package main

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"net"
	"net/http"
	"os"
	"path/filepath"
	"strings"
)

func parseDaemonSocketArg(args []string) (string, error) {
	if len(args) == 0 {
		return "", nil
	}
	if len(args) == 2 && args[0] == "--socket" && strings.TrimSpace(args[1]) != "" {
		return args[1], nil
	}
	return "", fmt.Errorf("usage: workspace-scanner --daemon [--socket <path>]")
}

func runDaemon(socketPath string) error {
	d := &daemon{
		indexes:     map[string]FileTreeNode{},
		fileIndexes: map[string][]fileIndexEntry{},
		inFlight:    map[string]*scanFlight{},
		watches:     map[string]*workspaceWatch{},
		stats:       daemonStats{Workspaces: map[string]string{}},
	}

	mux := http.NewServeMux()
	mux.HandleFunc("/health", func(w http.ResponseWriter, _ *http.Request) {
		writeJSON(w, map[string]bool{"ok": true})
	})
	mux.HandleFunc("/scan", d.handleScan)
	mux.HandleFunc("/register", d.handleRegister)
	mux.HandleFunc("/unregister", d.handleUnregister)
	mux.HandleFunc("/search", d.handleSearch)
	mux.HandleFunc("/stats", d.handleStats)

	listener, ready, err := listenDaemon(socketPath)
	if err != nil {
		return err
	}
	if err := json.NewEncoder(os.Stdout).Encode(ready); err != nil {
		_ = listener.Close()
		return err
	}
	return http.Serve(listener, mux)
}

func listenDaemon(socketPath string) (net.Listener, daemonReady, error) {
	if socketPath == "" {
		listener, err := net.Listen("tcp", "127.0.0.1:0")
		if err != nil {
			return nil, daemonReady{}, err
		}
		return listener, daemonReady{Addr: listener.Addr().String()}, nil
	}

	absSocketPath, err := filepath.Abs(socketPath)
	if err != nil {
		return nil, daemonReady{}, err
	}
	if err := os.MkdirAll(filepath.Dir(absSocketPath), 0o700); err != nil {
		return nil, daemonReady{}, err
	}
	if info, err := os.Lstat(absSocketPath); err == nil {
		if info.Mode()&os.ModeSocket == 0 {
			return nil, daemonReady{}, fmt.Errorf("refusing to remove non-socket path: %s", absSocketPath)
		}
		if err := os.Remove(absSocketPath); err != nil {
			return nil, daemonReady{}, err
		}
	} else if !errors.Is(err, os.ErrNotExist) {
		return nil, daemonReady{}, err
	}
	listener, err := net.Listen("unix", absSocketPath)
	if err != nil {
		return nil, daemonReady{}, err
	}
	if err := os.Chmod(absSocketPath, 0o600); err != nil {
		_ = listener.Close()
		return nil, daemonReady{}, err
	}
	return listener, daemonReady{Socket: absSocketPath}, nil
}

func (d *daemon) handleStats(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	writeJSON(w, d.snapshotStats())
}

func (d *daemon) handleScan(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	var req scanRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid JSON", http.StatusBadRequest)
		return
	}
	if strings.TrimSpace(req.Path) == "" {
		http.Error(w, "missing path", http.StatusBadRequest)
		return
	}
	tree, err := d.ensureScan(req.Path, req.Force)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	writeJSON(w, tree)
}

func (d *daemon) handleRegister(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	req, ok := decodePathRequest(w, r)
	if !ok {
		return
	}
	root, err := normalizeRoot(req.Path)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	go func() {
		if _, err := d.ensureScan(root, false); err != nil {
			fmt.Fprintf(os.Stderr, "[workspace-daemon] register scan failed: %s: %v\n", root, err)
		}
	}()
	writeJSON(w, map[string]bool{"ok": true})
}

func (d *daemon) handleUnregister(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	req, ok := decodePathRequest(w, r)
	if !ok {
		return
	}
	root, err := filepath.Abs(req.Path)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	d.mu.Lock()
	delete(d.indexes, root)
	delete(d.fileIndexes, root)
	oldWatch := d.watches[root]
	delete(d.watches, root)
	d.ensureStatsMapLocked()
	delete(d.stats.Workspaces, root)
	d.mu.Unlock()
	closeWorkspaceWatch(oldWatch)
	writeJSON(w, map[string]bool{"ok": true})
}

func (d *daemon) handleSearch(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	var req searchRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid JSON", http.StatusBadRequest)
		return
	}
	limit := req.Limit
	if limit <= 0 || limit > 200 {
		limit = 50
	}
	query := strings.TrimSpace(strings.ToLower(req.Query))
	if query == "" {
		writeJSON(w, searchResponse{Results: []searchResult{}})
		return
	}

	results := []searchResult{}
	for _, rawRoot := range req.Roots {
		if len(results) >= limit {
			break
		}
		root, err := filepath.Abs(rawRoot)
		if err != nil {
			continue
		}
		files, ok := d.cachedFileIndex(root)
		if !ok {
			go func(root string) {
				if _, err := d.ensureScan(root, false); err != nil {
					fmt.Fprintf(os.Stderr, "[workspace-daemon] search warm failed: %s: %v\n", root, err)
				}
			}(root)
			continue
		}
		collectSearchMatchesFromIndex(files, query, root, &results, limit)
	}
	writeJSON(w, searchResponse{Results: results})
}

func decodePathRequest(w http.ResponseWriter, r *http.Request) (pathRequest, bool) {
	var req pathRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid JSON", http.StatusBadRequest)
		return req, false
	}
	if strings.TrimSpace(req.Path) == "" {
		http.Error(w, "missing path", http.StatusBadRequest)
		return req, false
	}
	return req, true
}

func writeJSON(w http.ResponseWriter, value any) {
	w.Header().Set("Content-Type", "application/json")
	var buf bytes.Buffer
	encoder := json.NewEncoder(&buf)
	encoder.SetEscapeHTML(false)
	if err := encoder.Encode(value); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	_, _ = w.Write(buf.Bytes())
}

func normalizeRoot(path string) (string, error) {
	root, err := filepath.Abs(path)
	if err != nil {
		return "", err
	}
	info, err := os.Stat(root)
	if err != nil {
		return "", err
	}
	if !info.IsDir() {
		return "", fmt.Errorf("not a directory: %s", root)
	}
	return root, nil
}

func (d *daemon) cached(root string) (FileTreeNode, bool) {
	d.mu.Lock()
	defer d.mu.Unlock()
	tree, ok := d.indexes[root]
	return tree, ok
}

func (d *daemon) cachedFileIndex(root string) ([]fileIndexEntry, bool) {
	d.mu.Lock()
	defer d.mu.Unlock()
	files, ok := d.fileIndexes[root]
	if !ok {
		return nil, false
	}
	copied := append([]fileIndexEntry(nil), files...)
	return copied, true
}

func (d *daemon) ensureScan(path string, force bool) (FileTreeNode, error) {
	root, err := normalizeRoot(path)
	if err != nil {
		return FileTreeNode{}, err
	}

	d.mu.Lock()
	if tree, ok := d.indexes[root]; ok && !force {
		d.mu.Unlock()
		return tree, nil
	}
	if flight, ok := d.inFlight[root]; ok {
		d.mu.Unlock()
		<-flight.done
		return flight.tree, flight.err
	}
	flight := &scanFlight{done: make(chan struct{})}
	d.inFlight[root] = flight
	d.mu.Unlock()

	result, err := scanWorkspace(root)
	tree := result.tree

	d.mu.Lock()
	flight.tree = tree
	flight.err = err
	if err == nil {
		d.indexes[root] = tree
		d.fileIndexes[root] = result.files
		d.stats.ScanCount++
		d.ensureStatsMapLocked()
		d.stats.Workspaces[root] = "indexed"
		d.evictIfNeededLocked(root)
		d.replaceWatchLocked(root, result.dirs)
	} else {
		d.stats.ScanErrorCount++
		d.stats.LastError = err.Error()
		d.ensureStatsMapLocked()
		d.stats.Workspaces[root] = "scan_error"
	}
	delete(d.inFlight, root)
	close(flight.done)
	d.mu.Unlock()
	return tree, err
}

func (d *daemon) evictIfNeededLocked(protectedRoot string) {
	for len(d.indexes) > maxIndexedWorkspaces {
		var evictRoot string
		for root := range d.indexes {
			if root != protectedRoot {
				evictRoot = root
				break
			}
		}
		if evictRoot == "" {
			return
		}
		delete(d.indexes, evictRoot)
		delete(d.fileIndexes, evictRoot)
		oldWatch := d.watches[evictRoot]
		delete(d.watches, evictRoot)
		d.ensureStatsMapLocked()
		d.stats.Workspaces[evictRoot] = "evicted"
		go closeWorkspaceWatch(oldWatch)
	}
}

func (d *daemon) snapshotStats() statsResponse {
	d.mu.Lock()
	defer d.mu.Unlock()
	watchedDirs := 0
	for _, watch := range d.watches {
		watchedDirs += len(watch.dirs)
	}
	indexedFiles := 0
	for _, files := range d.fileIndexes {
		indexedFiles += len(files)
	}
	workspaces := make(map[string]string, len(d.stats.Workspaces))
	for root, status := range d.stats.Workspaces {
		workspaces[root] = status
	}
	return statsResponse{
		WorkspaceCount:             len(d.indexes),
		IndexedFileCount:           indexedFiles,
		WatchedDirCount:            watchedDirs,
		InFlightCount:              len(d.inFlight),
		ScanCount:                  d.stats.ScanCount,
		RefreshCount:               d.stats.RefreshCount,
		ScanErrorCount:             d.stats.ScanErrorCount,
		WatchErrorCount:            d.stats.WatchErrorCount,
		WatchLimitCount:            d.stats.WatchLimitCount,
		LastError:                  d.stats.LastError,
		LastRefreshUnix:            d.stats.LastRefreshUnix,
		MaxIndexedWorkspaces:       maxIndexedWorkspaces,
		MaxWatchedDirsPerWorkspace: maxWatchedDirsPerWorkspace,
		Workspaces:                 workspaces,
	}
}

func (d *daemon) ensureStatsMapLocked() {
	if d.stats.Workspaces == nil {
		d.stats.Workspaces = map[string]string{}
	}
}
