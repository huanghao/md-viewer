package main

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
)

func main() {
	if len(os.Args) >= 2 && os.Args[1] == "--daemon" {
		socketPath, err := parseDaemonSocketArg(os.Args[2:])
		if err != nil {
			fmt.Fprintln(os.Stderr, err)
			os.Exit(2)
		}
		if err := runDaemon(socketPath); err != nil {
			fmt.Fprintln(os.Stderr, err)
			os.Exit(1)
		}
		return
	}
	if len(os.Args) != 2 {
		fmt.Fprintln(os.Stderr, "usage: workspace-scanner <root> | workspace-scanner --daemon [--socket <path>]")
		os.Exit(2)
	}
	root, err := filepath.Abs(os.Args[1])
	if err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
	info, err := os.Stat(root)
	if err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
	if !info.IsDir() {
		fmt.Fprintf(os.Stderr, "not a directory: %s\n", root)
		os.Exit(1)
	}

	tree, err := scanWorkspaceTree(root)
	if err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
	encoder := json.NewEncoder(os.Stdout)
	encoder.SetEscapeHTML(false)
	if err := encoder.Encode(tree); err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
}
