# Gotepad
Gotepad is a basic text editor for Window, Linux, and Mac intended for quick or light text and code editing when a larger editor might be overkill. It aims to provide features and functionality somewhere between the default Microsoft Notepad app and VS Code. It's built with Wails and utilizes the Monaco editor.
## Features
- Syntax highlighting
- Language/File type selection
- Word Wrap
- Line Numbers
- Find/Replace
- Opening external terminals (If supported ones are found or if their configurations are imported)
- Light & Dark themes

## Getting Started
### Installing
Just download and run the application file. A warning will most likely pop up as the application is not code signed.
When running on Linux for the first time, try executing the application from the terminal. This should help troubleshoot missing dependencies.

### Installing from source
#### Requirements
- Node.js v15+
- Go v1.18+
- Wails v2
Check https://wails.io/docs/gettingstarted/installation for OS specific requirements.
#### Run the dev server
```
wails dev
```
#### Build the application
```
wails build 
```
This will build the app binary to `/build/bin`.

## License
This project uses the MIT license.