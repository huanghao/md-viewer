package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"testing"
	"time"
)

func writeFile(t *testing.T, path string) {
	t.Helper()
	if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(path, []byte(""), 0o644); err != nil {
		t.Fatal(err)
	}
}

func hasChild(node FileTreeNode, name string) bool {
	for _, child := range node.Children {
		if child.Name == name {
			return true
		}
	}
	return false
}

func newTestDaemon() *daemon {
	return &daemon{
		indexes:     map[string]FileTreeNode{},
		fileIndexes: map[string][]fileIndexEntry{},
		inFlight:    map[string]*scanFlight{},
		watches:     map[string]*workspaceWatch{},
		stats:       daemonStats{Workspaces: map[string]string{}},
	}
}

func TestScanWorkspaceTreeRespectsLocalAndGlobalIgnore(t *testing.T) {
	home := t.TempDir()
	t.Setenv("HOME", home)
	if err := os.WriteFile(filepath.Join(home, ".mdvignore"), []byte("global-skip\n"), 0o644); err != nil {
		t.Fatal(err)
	}

	root := t.TempDir()
	writeFile(t, filepath.Join(root, "global-skip", "a.md"))
	writeFile(t, filepath.Join(root, "local-skip", "b.md"))
	writeFile(t, filepath.Join(root, "docs", "guide.md"))
	if err := os.WriteFile(filepath.Join(root, ".mdvignore"), []byte("local-skip\n"), 0o644); err != nil {
		t.Fatal(err)
	}

	tree, err := scanWorkspaceTree(root)
	if err != nil {
		t.Fatal(err)
	}
	if hasChild(tree, "global-skip") || hasChild(tree, "local-skip") {
		t.Fatalf("ignored directories leaked into tree: %+v", tree.Children)
	}
	if !hasChild(tree, "docs") {
		t.Fatalf("expected docs in tree: %+v", tree.Children)
	}
}

func TestScanWorkspaceTreeReportsLargeDirectoryWarning(t *testing.T) {
	t.Setenv("HOME", t.TempDir())
	root := t.TempDir()
	exploded := filepath.Join(root, "exploded")
	if err := os.MkdirAll(exploded, 0o755); err != nil {
		t.Fatal(err)
	}
	for i := 0; i < maxDirEntries+1; i++ {
		writeFile(t, filepath.Join(exploded, fmt.Sprintf("f%d.md", i)))
	}
	writeFile(t, filepath.Join(root, "docs", "guide.md"))

	tree, err := scanWorkspaceTree(root)
	if err != nil {
		t.Fatal(err)
	}
	if hasChild(tree, "exploded") {
		t.Fatalf("large directory should not be included: %+v", tree.Children)
	}
	if len(tree.ScanWarnings) != 1 || tree.ScanWarnings[0].Path != exploded || tree.ScanWarnings[0].EntryCount != maxDirEntries+1 {
		t.Fatalf("unexpected warnings: %+v", tree.ScanWarnings)
	}
}

func TestDaemonSearchUsesRegisteredIndex(t *testing.T) {
	t.Setenv("HOME", t.TempDir())
	root := t.TempDir()
	writeFile(t, filepath.Join(root, "docs", "alpha-guide.md"))
	writeFile(t, filepath.Join(root, "docs", "beta.md"))

	d := newTestDaemon()
	mux := http.NewServeMux()
	mux.HandleFunc("/register", d.handleRegister)
	mux.HandleFunc("/unregister", d.handleUnregister)
	mux.HandleFunc("/search", d.handleSearch)
	server := httptest.NewServer(mux)
	defer server.Close()

	postJSON(t, server.URL+"/register", pathRequest{Path: root}, nil)

	deadline := time.Now().Add(2 * time.Second)
	for time.Now().Before(deadline) {
		var resp searchResponse
		postJSON(t, server.URL+"/search", searchRequest{Query: "alpha", Roots: []string{root}, Limit: 10}, &resp)
		if len(resp.Results) == 1 {
			if resp.Results[0].Display != "alpha-guide.md" {
				t.Fatalf("unexpected result: %+v", resp.Results)
			}
			goto unregister
		}
		time.Sleep(20 * time.Millisecond)
	}
	t.Fatalf("daemon did not build searchable index in time")

unregister:
	postJSON(t, server.URL+"/unregister", pathRequest{Path: root}, nil)
	var resp searchResponse
	postJSON(t, server.URL+"/search", searchRequest{Query: "alpha", Roots: []string{root}, Limit: 10}, &resp)
	if len(resp.Results) != 0 {
		t.Fatalf("expected no results after unregister, got %+v", resp.Results)
	}
}

func TestDaemonSearchUsesFlatFileIndex(t *testing.T) {
	t.Setenv("HOME", t.TempDir())
	root := t.TempDir()
	match := filepath.Join(root, "docs", "alpha-guide.md")

	d := newTestDaemon()
	d.indexes[root] = FileTreeNode{
		Name:     filepath.Base(root),
		Path:     root,
		Type:     "directory",
		Children: []FileTreeNode{},
	}
	d.fileIndexes[root] = []fileIndexEntry{{
		Path:      match,
		Name:      "alpha-guide.md",
		LowerName: "alpha-guide.md",
	}}

	mux := http.NewServeMux()
	mux.HandleFunc("/search", d.handleSearch)
	server := httptest.NewServer(mux)
	defer server.Close()

	var resp searchResponse
	postJSON(t, server.URL+"/search", searchRequest{Query: "alpha", Roots: []string{root}, Limit: 10}, &resp)
	if len(resp.Results) != 1 || resp.Results[0].Path != match {
		t.Fatalf("search did not use flat file index: %+v", resp.Results)
	}
}

func TestDaemonRefreshesIndexFromFileSystemEvents(t *testing.T) {
	t.Setenv("HOME", t.TempDir())
	root := t.TempDir()
	writeFile(t, filepath.Join(root, "docs", "alpha.md"))
	if err := os.MkdirAll(filepath.Join(root, "drafts"), 0o755); err != nil {
		t.Fatal(err)
	}

	d := newTestDaemon()
	mux := http.NewServeMux()
	mux.HandleFunc("/register", d.handleRegister)
	mux.HandleFunc("/search", d.handleSearch)
	server := httptest.NewServer(mux)
	defer server.Close()
	defer d.closeAllWatches()

	postJSON(t, server.URL+"/register", pathRequest{Path: root}, nil)
	waitForSearchResult(t, server.URL, root, "alpha", "alpha.md")

	writeFile(t, filepath.Join(root, "docs", "beta-new.md"))
	waitForSearchResult(t, server.URL, root, "beta", "beta-new.md")

	writeFile(t, filepath.Join(root, "drafts", "empty-dir-new.md"))
	waitForSearchResult(t, server.URL, root, "empty", "empty-dir-new.md")
}

func TestDaemonStatsAndWatcherLifecycleAreBounded(t *testing.T) {
	t.Setenv("HOME", t.TempDir())
	root := t.TempDir()
	writeFile(t, filepath.Join(root, "docs", "alpha.md"))

	d := newTestDaemon()
	mux := http.NewServeMux()
	mux.HandleFunc("/scan", d.handleScan)
	mux.HandleFunc("/register", d.handleRegister)
	mux.HandleFunc("/unregister", d.handleUnregister)
	mux.HandleFunc("/stats", d.handleStats)
	server := httptest.NewServer(mux)
	defer server.Close()
	defer d.closeAllWatches()

	postJSON(t, server.URL+"/register", pathRequest{Path: root}, nil)
	waitForStats(t, server.URL, func(stats statsResponse) bool {
		return stats.WorkspaceCount == 1 && stats.WatchedDirCount > 0
	})
	initial := getStats(t, server.URL)

	for i := 0; i < 5; i++ {
		var tree FileTreeNode
		postJSON(t, server.URL+"/scan", scanRequest{Path: root, Force: true}, &tree)
	}
	afterScans := getStats(t, server.URL)
	if afterScans.WorkspaceCount != 1 {
		t.Fatalf("expected one workspace, got %+v", afterScans)
	}
	if afterScans.WatchedDirCount != initial.WatchedDirCount {
		t.Fatalf("watch count grew after force scans: before=%d after=%d", initial.WatchedDirCount, afterScans.WatchedDirCount)
	}

	postJSON(t, server.URL+"/unregister", pathRequest{Path: root}, nil)
	afterUnregister := getStats(t, server.URL)
	if afterUnregister.WorkspaceCount != 0 || afterUnregister.WatchedDirCount != 0 {
		t.Fatalf("resources not released after unregister: %+v", afterUnregister)
	}
}

func waitForStats(t *testing.T, serverURL string, predicate func(statsResponse) bool) {
	t.Helper()
	deadline := time.Now().Add(3 * time.Second)
	for time.Now().Before(deadline) {
		stats := getStats(t, serverURL)
		if predicate(stats) {
			return
		}
		time.Sleep(50 * time.Millisecond)
	}
	t.Fatalf("stats predicate did not pass in time; last=%+v", getStats(t, serverURL))
}

func getStats(t *testing.T, serverURL string) statsResponse {
	t.Helper()
	resp, err := http.Get(serverURL + "/stats")
	if err != nil {
		t.Fatal(err)
	}
	defer resp.Body.Close()
	if resp.StatusCode != 200 {
		t.Fatalf("unexpected stats status %d", resp.StatusCode)
	}
	var stats statsResponse
	if err := json.NewDecoder(resp.Body).Decode(&stats); err != nil {
		t.Fatal(err)
	}
	return stats
}

func waitForSearchResult(t *testing.T, serverURL string, root string, query string, display string) {
	t.Helper()
	deadline := time.Now().Add(3 * time.Second)
	for time.Now().Before(deadline) {
		var resp searchResponse
		postJSON(t, serverURL+"/search", searchRequest{Query: query, Roots: []string{root}, Limit: 10}, &resp)
		for _, result := range resp.Results {
			if result.Display == display {
				return
			}
		}
		time.Sleep(50 * time.Millisecond)
	}
	t.Fatalf("search did not return %s for query %q in time", display, query)
}

func TestListenDaemonUnixSocket(t *testing.T) {
	dir, err := os.MkdirTemp("/tmp", "mdv-sock-")
	if err != nil {
		t.Fatal(err)
	}
	defer os.RemoveAll(dir)
	socketPath := filepath.Join(dir, "idx.sock")
	listener, ready, err := listenDaemon(socketPath)
	if err != nil {
		t.Fatal(err)
	}
	defer listener.Close()

	if ready.Socket != socketPath {
		t.Fatalf("unexpected ready socket: %+v", ready)
	}
	info, err := os.Lstat(socketPath)
	if err != nil {
		t.Fatal(err)
	}
	if info.Mode()&os.ModeSocket == 0 {
		t.Fatalf("expected socket file, got mode %s", info.Mode())
	}
}

func postJSON(t *testing.T, url string, body any, out any) {
	t.Helper()
	data, err := json.Marshal(body)
	if err != nil {
		t.Fatal(err)
	}
	resp, err := http.Post(url, "application/json", bytes.NewReader(data))
	if err != nil {
		t.Fatal(err)
	}
	defer resp.Body.Close()
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		t.Fatalf("unexpected status %d from %s", resp.StatusCode, url)
	}
	if out != nil {
		if err := json.NewDecoder(resp.Body).Decode(out); err != nil {
			t.Fatal(err)
		}
	}
}
