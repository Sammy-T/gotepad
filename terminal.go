package main

import (
	"log"
	"runtime"
)

type Terminal struct {
	Name    string
	CmdRoot string // The terminal command to use when executing the 'open' command
	OpenCmd []string
}

// getTerminals determines which terminals are available
func getTerminals() map[string]Terminal {
	terminals := make(map[string]Terminal)

	switch runtime.GOOS {
	case "windows":
		const cmdRoot = "cmd"

		// Set Command Prompt terminal
		terminals["Command Prompt"] = Terminal{"Command Prompt", cmdRoot, []string{"/C", "start"}}

		// Set Git Bash terminal if the file is found
		if bashPath := "C:/Program Files/Git/bin/bash.exe"; fileExists(bashPath) {
			bash := Terminal{"Git Bash", cmdRoot, []string{"/C", "start", "", bashPath}}

			terminals[bash.Name] = bash
		}
	case "linux":
		if qTerminalPath := "/usr/bin/qterminal"; fileExists(qTerminalPath) {
			qTerminal := Terminal{"qTerminal", "qterminal", []string{"qterminal"}}

			terminals[qTerminal.Name] = qTerminal
		}

		if gnomePath := "/usr/bin/gnome-terminal"; fileExists(gnomePath) {
			gnomeTerminal := Terminal{"gnome-terminal", "gnome-terminal", []string{"gnome-terminal"}}

			terminals[gnomeTerminal.Name] = gnomeTerminal
		}
	default:
		log.Printf("OS %v not implemented\n", runtime.GOOS)
	}

	return terminals
}
