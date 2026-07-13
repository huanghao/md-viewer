package main

import (
	"sync"
	"time"

	"github.com/fsnotify/fsnotify"
)

const maxDirEntries = 2000
const refreshDebounce = 250 * time.Millisecond
const maxIndexedWorkspaces = 30
const maxWatchedDirsPerWorkspace = 5000

var defaultPatterns = []string{"node_modules", "dist", "build", ".git", ".venv", "venv"}

type FileTreeNode struct {
	Name           string         `json:"name"`
	Path           string         `json:"path"`
	Type           string         `json:"type"`
	Children       []FileTreeNode `json:"children,omitempty"`
	FileCount      int            `json:"fileCount,omitempty"`
	LastModified   int64          `json:"lastModified,omitempty"`
	IgnorePatterns []string       `json:"ignorePatterns,omitempty"`
	ScanWarnings   []ScanWarning  `json:"scanWarnings,omitempty"`
}

type ScanWarning struct {
	Path       string `json:"path"`
	EntryCount int    `json:"entryCount"`
}

type pattern struct {
	base string
	text string
}

type daemon struct {
	mu          sync.Mutex
	indexes     map[string]FileTreeNode
	fileIndexes map[string][]fileIndexEntry
	inFlight    map[string]*scanFlight
	watches     map[string]*workspaceWatch
	stats       daemonStats
}

type scanFlight struct {
	done chan struct{}
	tree FileTreeNode
	err  error
}

type scanResult struct {
	tree  FileTreeNode
	dirs  []string
	files []fileIndexEntry
}

type fileIndexEntry struct {
	Path      string
	Name      string
	LowerName string
}

type workspaceWatch struct {
	root       string
	watcher    *fsnotify.Watcher
	dirs       map[string]struct{}
	timer      *time.Timer
	closed     bool
	refreshing bool
	dirty      bool
}

type daemonReady struct {
	Addr   string `json:"addr,omitempty"`
	Socket string `json:"socket,omitempty"`
}

type pathRequest struct {
	Path string `json:"path"`
}

type scanRequest struct {
	Path  string `json:"path"`
	Force bool   `json:"force"`
}

type searchRequest struct {
	Query string   `json:"query"`
	Roots []string `json:"roots"`
	Limit int      `json:"limit"`
}

type searchResult struct {
	Path          string `json:"path"`
	Display       string `json:"display"`
	WorkspaceRoot string `json:"workspaceRoot"`
}

type searchResponse struct {
	Results []searchResult `json:"results"`
}

type daemonStats struct {
	ScanCount       int64             `json:"scanCount"`
	RefreshCount    int64             `json:"refreshCount"`
	ScanErrorCount  int64             `json:"scanErrorCount"`
	WatchErrorCount int64             `json:"watchErrorCount"`
	WatchLimitCount int64             `json:"watchLimitCount"`
	LastError       string            `json:"lastError,omitempty"`
	LastRefreshUnix int64             `json:"lastRefreshUnix,omitempty"`
	Workspaces      map[string]string `json:"-"`
}

type statsResponse struct {
	WorkspaceCount             int               `json:"workspaceCount"`
	IndexedFileCount           int               `json:"indexedFileCount"`
	WatchedDirCount            int               `json:"watchedDirCount"`
	InFlightCount              int               `json:"inFlightCount"`
	ScanCount                  int64             `json:"scanCount"`
	RefreshCount               int64             `json:"refreshCount"`
	ScanErrorCount             int64             `json:"scanErrorCount"`
	WatchErrorCount            int64             `json:"watchErrorCount"`
	WatchLimitCount            int64             `json:"watchLimitCount"`
	LastError                  string            `json:"lastError,omitempty"`
	LastRefreshUnix            int64             `json:"lastRefreshUnix,omitempty"`
	MaxIndexedWorkspaces       int               `json:"maxIndexedWorkspaces"`
	MaxWatchedDirsPerWorkspace int               `json:"maxWatchedDirsPerWorkspace"`
	Workspaces                 map[string]string `json:"workspaces"`
}
