# Gotepad
Gotepad is a basic text editor for Window, Linux, and Mac intended for quick or light text and code editing when a larger editor might be overkill. It aims to provide features and functionality somewhere between the default Microsoft Notepad app and VS Code. It's built with [Wails](https://wails.io/) and utilizes the [Monaco Editor](https://microsoft.github.io/monaco-editor/).

## Features
- Syntax highlighting
- Language/File type selection
- Word Wrap
- Line Numbers
- Find/Replace
- Opening external terminals (If supported ones are found or if their configurations are imported)
- Light & Dark themes

![screen01](https://user-images.githubusercontent.com/22360092/194957928-75d8a9f6-e1f2-4535-951c-4b0dedb900cf.png)
![screen02](https://user-images.githubusercontent.com/22360092/194957929-f3ad583d-6301-4d95-99bb-b4efaf211ccb.png)
![screen03](https://user-images.githubusercontent.com/22360092/194957932-213bbcb8-5332-4848-9142-5171675a6ce8.png)
![screen04](https://user-images.githubusercontent.com/22360092/194957934-055fd6c1-7d41-4185-8acb-f347860ff984.png)

## Getting Started
### Installing
Just download and run the application file*. A warning will most likely pop up as the application is not code signed.
When running on Linux for the first time, try executing the application from the terminal. This should help troubleshoot missing dependencies.
* Currently, only amd64 builds are supported.

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
This project uses the [MIT](LICENSE) license.
