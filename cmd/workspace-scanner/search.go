package main

import "strings"

func collectSearchMatchesFromIndex(files []fileIndexEntry, query string, workspaceRoot string, results *[]searchResult, limit int) {
	for _, file := range files {
		if len(*results) >= limit {
			return
		}
		if fuzzyMatch(file.LowerName, query) {
			*results = append(*results, searchResult{Path: file.Path, Display: file.Name, WorkspaceRoot: workspaceRoot})
		}
	}
}

func fuzzyMatch(text string, query string) bool {
	tokens := strings.Fields(query)
	if len(tokens) == 0 {
		return false
	}
	for _, token := range tokens {
		if !strings.Contains(text, token) && !isSubsequence(text, token) {
			return false
		}
	}
	return true
}

func isSubsequence(text string, query string) bool {
	if query == "" {
		return true
	}
	j := 0
	for i := 0; i < len(text) && j < len(query); i++ {
		if text[i] == query[j] {
			j++
		}
	}
	return j == len(query)
}
