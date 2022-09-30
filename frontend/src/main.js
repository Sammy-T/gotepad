import {Environment, EventsOn} from '../wailsjs/runtime/runtime';
import {NewFile, OpenFile, SaveAs, Save} from '../wailsjs/go/main/App';

let platform;

const menuDropdowns = document.querySelectorAll('#menu details');
const menuItems = document.querySelectorAll('#menu a');
const textArea = document.querySelector('#text-input');
const saveStatus = document.querySelector('#save-status');
const lineCount = document.querySelector('#line-count');

/**
 * Responds to the custom 'onNewFile' Wails event and clears the text area.
 */
function onNewFile() {
    textArea.value = '';
    saveStatus.innerText = 'unsaved';
}


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
 * Responds to input value changes. Updates the save status and line count.
 * @param {Event} event - The triggering event. 
 */
function onInput(event) {
    saveStatus.innerText = 'unsaved';
    onSelectionChanged(event);
}

/**
 * Responds to key events. Triggers the action corresponding to the received keyboard shortcut.
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

/**
 * Responds to menu item selection. Triggers the action corresponding to the selected menu item.
 * @param {Element} item - The selected menu item.
 */
function onMenuItemClick(item) {
    switch(item.id) {
        case 'new-file':
            NewFile();
            break;
        case 'open-file':
            OpenFile();
            break;
        case 'save-file':
            Save(textArea.value);
            break;
        case 'save-file-as':
            SaveAs(textArea.value);
            break;
    }

    // Close any open menu dropdowns
    menuDropdowns.forEach(dropdown => dropdown.removeAttribute('open'));
}

function initMenuItem(item) {
    // Replace 'Ctrl' with 'Cmd' on Mac os
    if(platform === 'darwin') {
        const shortcut = item.querySelector('small:last-child');
        shortcut.textContent = shortcut.textContent.replace('Ctrl', 'Cmd');
    }

    item.addEventListener('click', () => onMenuItemClick(item));
}

// Retrieve the platform from the environment
Environment()
    .then(info => platform = info.platform)
    .catch(err => console.error('Unable to get environment.', err));

// Listen for Wails events
EventsOn('onNewFile', onNewFile);
EventsOn('onFileRead', onFileRead);
EventsOn('onFileSaved', onFileSaved);

EventsOn('onRequestSaveAs', () => SaveAs(textArea.value));
EventsOn('onRequestSave', () => Save(textArea.value));

// There's overlap between these listeners but it's the only way I've found
// to update on input, backspace, and selection changes.
textArea.addEventListener('input', onInput);
document.addEventListener('selectionchange', onSelectionChanged);

// Set up the menu and key interactions
menuItems.forEach(initMenuItem);
document.addEventListener('keydown', onKey);