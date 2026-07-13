package main

import (
	"errors"
	"io/fs"
	"os"
	"path/filepath"
	"sort"
	"strings"
)

func scanWorkspaceTree(rootPath string) (FileTreeNode, error) {
	result, err := scanWorkspace(rootPath)
	return result.tree, err
}

func scanWorkspace(rootPath string) (scanResult, error) {
	rootLocalPatterns := loadLocalPatterns(rootPath)
	root := FileTreeNode{
		Name:     filepath.Base(rootPath),
		Path:     rootPath,
		Type:     "directory",
		Children: []FileTreeNode{},
	}
	if len(rootLocalPatterns) > 0 {
		root.IgnorePatterns = rootLocalPatterns
	}

	globalPatterns := loadGlobalPatterns()
	patterns := make([]pattern, 0, len(globalPatterns)+len(rootLocalPatterns))
	for _, p := range globalPatterns {
		patterns = append(patterns, pattern{base: rootPath, text: p})
	}
	for _, p := range rootLocalPatterns {
		patterns = append(patterns, pattern{base: rootPath, text: p})
	}

	warnings := []ScanWarning{}
	dirs := []string{}
	count, err := walk(rootPath, patterns, &root, &warnings, &dirs)
	if err != nil {
		return scanResult{tree: root, dirs: dirs}, err
	}
	root.FileCount = count
	sortTree(&root)
	if len(warnings) > 0 {
		root.ScanWarnings = warnings
	}
	return scanResult{tree: root, dirs: dirs, files: buildFileIndex(root)}, nil
}

func buildFileIndex(root FileTreeNode) []fileIndexEntry {
	files := []fileIndexEntry{}
	appendFileIndexEntries(root, &files)
	return files
}

func appendFileIndexEntries(node FileTreeNode, files *[]fileIndexEntry) {
	if node.Type == "file" {
		name := filepath.Base(node.Path)
		*files = append(*files, fileIndexEntry{
			Path:      node.Path,
			Name:      name,
			LowerName: strings.ToLower(name),
		})
		return
	}
	for _, child := range node.Children {
		appendFileIndexEntries(child, files)
	}
}

func walk(dir string, ancestorPatterns []pattern, parent *FileTreeNode, warnings *[]ScanWarning, dirs *[]string) (int, error) {
	localPatterns := loadLocalPatterns(dir)
	patterns := append([]pattern{}, ancestorPatterns...)
	for _, p := range localPatterns {
		patterns = append(patterns, pattern{base: dir, text: p})
	}

	entries, err := os.ReadDir(dir)
	if err != nil {
		if errors.Is(err, fs.ErrPermission) {
			return 0, nil
		}
		return 0, nil
	}
	if len(entries) > maxDirEntries {
		*warnings = append(*warnings, ScanWarning{Path: dir, EntryCount: len(entries)})
		return 0, nil
	}
	*dirs = append(*dirs, dir)

	fileCount := 0
	for _, entry := range entries {
		fullPath := filepath.Join(dir, entry.Name())
		if isIgnored(fullPath, patterns) {
			continue
		}
		if entry.IsDir() {
			child := FileTreeNode{
				Name:     entry.Name(),
				Path:     fullPath,
				Type:     "directory",
				Children: []FileTreeNode{},
			}
			count, err := walk(fullPath, patterns, &child, warnings, dirs)
			if err != nil || count == 0 {
				continue
			}
			local := loadLocalPatterns(fullPath)
			if len(local) > 0 {
				child.IgnorePatterns = local
			}
			child.FileCount = count
			parent.Children = append(parent.Children, child)
			fileCount += count
			continue
		}
		if entry.Type().IsRegular() && isSupportedTextFile(strings.ToLower(entry.Name())) {
			info, err := entry.Info()
			mtime := int64(0)
			if err == nil {
				mtime = info.ModTime().UnixMilli()
			}
			parent.Children = append(parent.Children, FileTreeNode{
				Name:         entry.Name(),
				Path:         fullPath,
				Type:         "file",
				LastModified: mtime,
			})
			fileCount++
		}
	}
	return fileCount, nil
}

func sortTree(node *FileTreeNode) int {
	if node.Type == "file" {
		return 1
	}
	sort.Slice(node.Children, func(i, j int) bool {
		a := node.Children[i]
		b := node.Children[j]
		if a.Type != b.Type {
			return a.Type == "directory"
		}
		return a.Name < b.Name
	})
	count := 0
	for i := range node.Children {
		count += sortTree(&node.Children[i])
	}
	node.FileCount = count
	return count
}

func isSupportedTextFile(name string) bool {
	switch filepath.Ext(name) {
	case ".md", ".markdown", ".html", ".htm", ".json", ".jsonl", ".pdf":
		return true
	default:
		return false
	}
}
