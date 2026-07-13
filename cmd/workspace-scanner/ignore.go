package main

import (
	"os"
	"path/filepath"
	"strings"
)

func loadLocalPatterns(dir string) []string {
	return loadPatternsFile(filepath.Join(dir, ".mdvignore"))
}

func loadGlobalPatterns() []string {
	patterns := append([]string{}, defaultPatterns...)
	home, err := os.UserHomeDir()
	if err != nil || home == "" {
		return patterns
	}
	patterns = append(patterns, loadPatternsFile(filepath.Join(home, ".mdvignore"))...)
	return patterns
}

func loadPatternsFile(path string) []string {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil
	}
	lines := strings.Split(string(data), "\n")
	patterns := make([]string, 0, len(lines))
	for _, line := range lines {
		line = strings.TrimSpace(line)
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}
		patterns = append(patterns, line)
	}
	return patterns
}

func isIgnored(fullPath string, patterns []pattern) bool {
	for _, p := range patterns {
		rel, err := filepath.Rel(p.base, fullPath)
		if err != nil {
			continue
		}
		rel = filepath.ToSlash(rel)
		if matchPattern(rel, p.text) {
			return true
		}
	}
	return false
}

func matchPattern(rel string, p string) bool {
	p = filepath.ToSlash(strings.TrimSpace(p))
	if p == "" {
		return false
	}
	if strings.HasSuffix(p, "/") {
		prefix := strings.TrimSuffix(p, "/")
		return rel == prefix || strings.HasPrefix(rel, prefix+"/")
	}
	if ok, _ := filepath.Match(p, rel); ok {
		return true
	}
	if ok, _ := filepath.Match(p, filepath.Base(rel)); ok {
		return true
	}
	if !strings.Contains(p, "/") {
		for _, part := range strings.Split(rel, "/") {
			if ok, _ := filepath.Match(p, part); ok {
				return true
			}
		}
	}
	if strings.Contains(p, "**") {
		return matchGlobstar(rel, p)
	}
	return false
}

func matchGlobstar(rel string, p string) bool {
	parts := strings.Split(p, "**")
	if len(parts) != 2 {
		return false
	}
	prefix := strings.TrimSuffix(parts[0], "/")
	suffix := strings.TrimPrefix(parts[1], "/")
	if prefix != "" && !(rel == prefix || strings.HasPrefix(rel, prefix+"/")) {
		return false
	}
	if suffix == "" {
		return true
	}
	return strings.HasSuffix(rel, suffix)
}
