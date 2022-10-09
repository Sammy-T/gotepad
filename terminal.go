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
		cmdRoot := "cmd"

		// Set Command Prompt terminal
		terminals["Command Prompt"] = Terminal{"Command Prompt", cmdRoot, []string{"/C", "start"}}

		// Set Git Bash terminal if the file is found
		if bashPath := "C:/Program Files/Git/bin/bash.exe"; fileExists(bashPath) {
			bash := Terminal{
				Name:    "Git Bash",
				CmdRoot: cmdRoot,
				OpenCmd: []string{"/C", "start", "", bashPath},
			}

			terminals[bash.Name] = bash
		}
	case "linux":
		if qTerminalPath := "/usr/bin/qterminal"; fileExists(qTerminalPath) {
			qTerminal := Terminal{
				Name:    "qTerminal",
				CmdRoot: "qterminal",
				OpenCmd: []string{"qterminal"},
			}

			terminals["qTerminal"] = qTerminal
		}
	default:
		log.Printf("OS %v not implemented\n", runtime.GOOS)
	}

	return terminals
}
