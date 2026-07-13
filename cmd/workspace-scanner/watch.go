package main

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/fsnotify/fsnotify"
)

func (d *daemon) replaceWatchLocked(root string, dirs []string) {
	oldWatch := d.watches[root]
	d.ensureStatsMapLocked()
	if len(dirs) > maxWatchedDirsPerWorkspace {
		d.stats.WatchLimitCount++
		d.stats.Workspaces[root] = "indexed_watch_limit"
		go closeWorkspaceWatch(oldWatch)
		delete(d.watches, root)
		return
	}
	watcher, err := fsnotify.NewWatcher()
	if err != nil {
		fmt.Fprintf(os.Stderr, "[workspace-daemon] watcher create failed: %s: %v\n", root, err)
		d.stats.WatchErrorCount++
		d.stats.LastError = err.Error()
		d.stats.Workspaces[root] = "indexed_watch_error"
		return
	}
	dirSet := make(map[string]struct{}, len(dirs))
	for _, dir := range dirs {
		if err := watcher.Add(dir); err != nil {
			fmt.Fprintf(os.Stderr, "[workspace-daemon] watch add failed: %s: %v\n", dir, err)
			d.stats.WatchErrorCount++
			d.stats.LastError = err.Error()
			continue
		}
		dirSet[dir] = struct{}{}
	}
	next := &workspaceWatch{root: root, watcher: watcher, dirs: dirSet}
	d.watches[root] = next
	if len(dirSet) == len(dirs) {
		d.stats.Workspaces[root] = "indexed_watched"
	} else {
		d.stats.Workspaces[root] = "indexed_partial_watch"
	}
	go d.runWorkspaceWatch(next)
	closeWorkspaceWatch(oldWatch)
}

func closeWorkspaceWatch(w *workspaceWatch) {
	if w == nil {
		return
	}
	w.closed = true
	if w.timer != nil {
		w.timer.Stop()
	}
	_ = w.watcher.Close()
}

func (d *daemon) closeAllWatches() {
	d.mu.Lock()
	watches := make([]*workspaceWatch, 0, len(d.watches))
	for root, watch := range d.watches {
		watches = append(watches, watch)
		delete(d.watches, root)
	}
	d.mu.Unlock()
	for _, watch := range watches {
		closeWorkspaceWatch(watch)
	}
}

func (d *daemon) runWorkspaceWatch(w *workspaceWatch) {
	for {
		select {
		case event, ok := <-w.watcher.Events:
			if !ok {
				return
			}
			if shouldRefreshForEvent(w, event) {
				d.scheduleRefresh(w.root)
			}
		case err, ok := <-w.watcher.Errors:
			if !ok {
				return
			}
			fmt.Fprintf(os.Stderr, "[workspace-daemon] watch error: %s: %v\n", w.root, err)
			d.mu.Lock()
			d.stats.WatchErrorCount++
			d.stats.LastError = err.Error()
			d.mu.Unlock()
		}
	}
}

func shouldRefreshForEvent(w *workspaceWatch, event fsnotify.Event) bool {
	if !(event.Has(fsnotify.Create) || event.Has(fsnotify.Write) || event.Has(fsnotify.Remove) || event.Has(fsnotify.Rename)) {
		return false
	}
	name := filepath.Base(event.Name)
	if name == ".mdvignore" {
		return true
	}
	if _, ok := w.dirs[event.Name]; ok {
		return true
	}
	if info, err := os.Stat(event.Name); err == nil && info.IsDir() {
		return true
	}
	return isSupportedTextFile(strings.ToLower(event.Name))
}

func (d *daemon) scheduleRefresh(root string) {
	d.mu.Lock()
	w := d.watches[root]
	if w == nil || w.closed {
		d.mu.Unlock()
		return
	}
	if w.timer != nil {
		w.timer.Stop()
	}
	w.timer = time.AfterFunc(refreshDebounce, func() {
		d.refreshWorkspace(root)
	})
	d.mu.Unlock()
}

func (d *daemon) refreshWorkspace(root string) {
	d.mu.Lock()
	w := d.watches[root]
	if w == nil || w.closed {
		d.mu.Unlock()
		return
	}
	if w.refreshing {
		w.dirty = true
		d.mu.Unlock()
		return
	}
	w.refreshing = true
	d.mu.Unlock()

	_, err := d.ensureScan(root, true)

	d.mu.Lock()
	d.stats.LastRefreshUnix = time.Now().Unix()
	if err == nil {
		d.stats.RefreshCount++
	} else {
		d.stats.LastError = err.Error()
		fmt.Fprintf(os.Stderr, "[workspace-daemon] refresh failed: %s: %v\n", root, err)
	}
	w = d.watches[root]
	if w != nil {
		w.refreshing = false
		if w.dirty && !w.closed {
			w.dirty = false
			if w.timer != nil {
				w.timer.Stop()
			}
			w.timer = time.AfterFunc(refreshDebounce, func() {
				d.refreshWorkspace(root)
			})
		}
	}
	d.mu.Unlock()
}
