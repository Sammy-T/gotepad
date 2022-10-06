import {editor} from './editor/init';
import {Environment, EventsOn} from '../wailsjs/runtime/runtime';
import {NewFile, OpenFile, SaveAs, Save} from '../wailsjs/go/main/App';

let platform;

const menuDropdowns = document.querySelectorAll('#menu details');
const menuItems = document.querySelectorAll('#menu a');
const modals = document.querySelectorAll('dialog');
const saveStatus = document.querySelector('#save-status');
const lineCount = document.querySelector('#line-count');

const modalOptions = document.querySelector('#modal-options');

/**
 * Responds to the custom 'onNewFile' Wails event and clears the text area.
 */
function onNewFile() {
    editor.setValue('');
    saveStatus.innerText = 'unsaved';
}


/**
 * Responds to the custom 'onFileRead' Wails event and updates the text area
 * with the file text.
 * @param {String} fileText 
 */
function onFileRead(fileText) {
    editor.setValue(fileText);
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
    const {lineNumber, column} = event.position;
    const totalLines = (editor.getValue().match(/\n/g) || []).length + 1;
    const ending = totalLines > 1 ? 'lines' : 'line';

    lineCount.innerText = `line ${lineNumber}, col ${column} - ${totalLines} ${ending}`;
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
                SaveAs(editor.getValue());
            } else {
                Save(editor.getValue());
            }
            break;
        case 'f':
            triggerFind();
            break;
        case 'h':
            triggerReplace();
            break;
    }
}

/**
 * Triggers monaco editor's 'replace' action.
 */
function triggerReplace() {
    editor.trigger(null, 'editor.action.startFindReplaceAction');
}

/**
 * Triggers monaco editor's 'find' action.
 */
function triggerFind() {
    editor.trigger(null, 'actions.find');
}

/**
 * Displays the 'options' modal and updates its form with the current option values.
 */
function showOptions() {
    modalOptions.setAttribute('open', '');

    // A helper to respond to modal actions
    function handleAction(action) {
        if(new URL(action.href).hash === '#confirm') {
            saveOptions(modalOptions.querySelector('form'));
            readOptions();
        }

        modalOptions.removeAttribute('open');
    }

    // Update the form to match the current option values
    const themeSelect = modalOptions.querySelector('#theme-select');
    themeSelect.value = localStorage.getItem('gotepad.theme') || 'auto';

    const lineNumSwitch = modalOptions.querySelector('#line-numbers');
    lineNumSwitch.checked = localStorage.getItem('gotepad.lineNumbers') === 'on';

    const wordWrapSwitch = modalOptions.querySelector('#word-wrap');
    wordWrapSwitch.checked = localStorage.getItem('gotepad.wordWrap') === 'on';

    // Respond to the modal actions
    const actions = modalOptions.querySelectorAll('footer a');
    actions.forEach(action => {
        action.onclick = () => handleAction(action);
    });
}

/**
 * Saves the options to local storage.
 * @param {Element} optionsForm - The options form element
 */
function saveOptions(optionsForm) {
    const optionsData = new FormData(optionsForm);

    const theme = optionsData.get('theme-select');
    const lineNumbers = optionsData.get('line-numbers') || 'off';
    const wordWrap = optionsData.get('word-wrap') || 'off';

    if(theme === 'auto') {
        localStorage.removeItem('gotepad.theme');
    } else {
        localStorage.setItem('gotepad.theme', theme);
    }

    localStorage.setItem('gotepad.lineNumbers', lineNumbers);
    localStorage.setItem('gotepad.wordWrap', wordWrap);
}

/**
 * Reads the options from local storage and updates the ui.
 */
function readOptions() {
    const html = document.querySelector('html');

    const theme = localStorage.getItem('gotepad.theme');
    const lineNumbers = localStorage.getItem('gotepad.lineNumbers') || 'off';
    const wordWrap = localStorage.getItem('gotepad.wordWrap') || 'off';

    const editorOptions = {
        theme: (theme === 'light') ? 'vs' : 'vs-dark',
        lineNumbers: lineNumbers,
        wordWrap: wordWrap
    };
    
    if(!theme) {
        // Match the system theme if the option isn't set
        const prefersSystemDark = window.matchMedia('(prefers-color-scheme: dark').matches
        editorOptions.theme = (prefersSystemDark) ? 'vs-dark' : 'vs';

        html.removeAttribute('data-theme');
    } else {
        html.setAttribute('data-theme', theme);
    }

    editor.updateOptions(editorOptions);
}

function initModal(modal) {
    // Close the modal when the background is clicked
    modal.addEventListener('click', event => {
        if(event.target.tagName === 'DIALOG') modal.removeAttribute('open');
    });
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
            Save(editor.getValue());
            break;
        case 'save-file-as':
            SaveAs(editor.getValue());
            break;
        case 'find-term':
            triggerFind();
            break;
        case 'replace-term':
            triggerReplace();
            break;
        case 'options':
            showOptions();
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

const resizeObserver = new ResizeObserver(entries => {
    for(const entry of entries) {
        if(entry.contentRect) {
            const {width, height} = entry.contentRect;

            editor.layout({height, width}); // Update the size of the editor
        }
    }
});

// Retrieve the platform from the environment
Environment()
    .then(info => platform = info.platform)
    .catch(err => console.error('Unable to get environment.', err));

// Listen for Wails events
EventsOn('onNewFile', onNewFile);
EventsOn('onFileRead', onFileRead);
EventsOn('onFileSaved', onFileSaved);

EventsOn('onRequestSaveAs', () => SaveAs(editor.getValue()));
EventsOn('onRequestSave', () => Save(editor.getValue()));

readOptions();

// Listen for resizes on the editor's parent container
resizeObserver.observe(document.querySelector('.container'));

// Listen for editor content and cursor changes
editor.onDidChangeModelContent(() => saveStatus.innerText = 'unsaved');
editor.onDidChangeCursorPosition(onSelectionChanged);

// Set up the menu and key interactions
menuItems.forEach(initMenuItem);
document.addEventListener('keydown', onKey);

modals.forEach(initModal);

// console.log(editor.getSupportedActions());