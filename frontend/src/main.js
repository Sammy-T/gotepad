import {Environment, EventsOn} from '../wailsjs/runtime/runtime';
import {NewFile, OpenFile, SaveAs, Save} from '../wailsjs/go/main/App';

let platform;

const textArea = document.querySelector('#text-input');
const saveStatus = document.querySelector('#save-status');
const lineCount = document.querySelector('#line-count');

// Retrieve the platform from the environment
Environment()
    .then(info => platform = info.platform)
    .catch(err => console.error('Unable to get environment.', err));

// Listen for Wails events
EventsOn('onNewFile', () => textArea.value = '');
EventsOn('onFileRead', onFileRead);
EventsOn('onFileSaved', onFileSaved);

EventsOn('onRequestSaveAs', () => SaveAs(textArea.value));
EventsOn('onRequestSave', () => Save(textArea.value));

/**
 * Responds to the custom 'onFileRead' Wails event and updates the text area
 * with the file text.
 * @param {String} fileText 
 */
function onFileRead(fileText) {
    textArea.value = fileText;
    saveStatus.innerText = 'saved';
}

/**
 * Responds to the custom 'onFileSaved' Wails event and updates the save status.
 * @param {Object} response 
 */
function onFileSaved(response) {
    console.log(response);
    saveStatus.innerText = 'saved';
}

/**
 * Responds to text area changes and updates the line count.
 * @param {Event} event - The triggering event.
 */
function onSelectionChanged(event) {
    const targetId = event.target.activeElement?.id || event.target.id;

    // Only respond to changes from the text area
    if(targetId !== 'text-input') return;

    // Get the text leading up to the selection
    const upToCursor = textArea.value.substring(0, textArea.selectionStart);

    // If we're past the first line, start after the last newline.
    // if we're on the first line, start at the beginning.
    let lineStart = upToCursor.lastIndexOf('\n');
    lineStart = (lineStart > -1) ? lineStart + 1 : 0;

    const currentLine = upToCursor.substring(lineStart);

    const line = (upToCursor.match(/\n/g) || []).length + 1;
    const col = currentLine.length + 1;

    const totalLines = (textArea.value.match(/\n/g) || []).length + 1;

    const ending = totalLines > 1 ? 'lines' : 'line';
    lineCount.innerText = `line ${line}, col ${col} - ${totalLines} ${ending}`;
}

/**
 * Responds to input value changes.
 * @param {Event} event - The triggering event. 
 */
function onInput(event) {
    saveStatus.innerText = 'unsaved';
    onSelectionChanged(event);
}

/**
 * Responds to keyboard accelerator shortcut inputs.
 * @param {Event} event - The triggering event.
 */
function onKey(event) {
    const cmdOrCtrl = (platform === 'darwin') ? 'metaKey' : 'ctrlKey';

    if(!event[cmdOrCtrl]) return; // Ignore non-accelerator inputs

    switch(event.key) {
        case 'n':
            NewFile();
            break;
        case 'o':
            OpenFile();
            break;
        case 's':
            if(event.shiftKey) {
                SaveAs(textArea.value);
            } else {
                Save(textArea.value);
            }
            break;
    }
}

// There's overlap between these listeners but it's the only way I've found
// to update on input, backspace, and selection changes.
textArea.addEventListener('input', onInput);
document.addEventListener('selectionchange', onSelectionChanged);

document.addEventListener('keydown', onKey);