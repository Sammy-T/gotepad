package main

import (
	"encoding/json"
	"fmt"
)

type Language struct {
	Aliases    []string
	Extensions []string
	Id         string
	Mimetypes  []string
}

// ParseLanguages parses the provided json array string
// into a collection of 'Language' structs
func ParseLanguages(jsonStr string) []Language {
	var languages []Language

	err := json.Unmarshal([]byte(jsonStr), &languages)
	if err != nil {
		fmt.Println("Error parsing languages:", err)
		return nil
	}

	return languages
}
