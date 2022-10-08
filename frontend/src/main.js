import {editor, supportedLangs, setEditorLang} from './ext/editor';
import './ext/terminal';
import {Environment, EventsEmit, EventsOn} from '../wailsjs/runtime/runtime';
import {NewFile, OpenFile, SaveAs, Save} from '../wailsjs/go/main/App';

let platform;
let currentLang = 'plaintext';

const menuDropdowns = document.querySelectorAll('#menu details');
const menuItems = document.querySelectorAll('#menu a');
const modals = document.querySelectorAll('dialog');
const saveStatus = document.querySelector('#save-status');
const lineCount = document.querySelector('#line-count');

const modalPrefs = document.querySelector('#modal-prefs');
const modalLang = document.querySelector('#modal-language');

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
    const isFuncKey = /F\d+/i.test(event.key);

    if(!event[cmdOrCtrl] && !isFuncKey) return; // Ignore non-accelerator inputs

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
        case 'F1':
            triggerCmdPalette();
            break;
    }
}

/**
 * Triggers monaco editor's 'find' action.
 */
function triggerFind() {
    editor.trigger(null, 'actions.find');
}

/**
 * Triggers monaco editor's 'replace' action.
 */
 function triggerReplace() {
    editor.trigger(null, 'editor.action.startFindReplaceAction');
}

/**
 * Triggers monaco editor's 'command palette' action.
 */
function triggerCmdPalette() {
    editor.focus(); // Command palette can only be triggered when the editor has focus
    editor.trigger(null, 'editor.action.quickCommand');
}

/**
 * Displays the 'preferences' modal and updates its form with the current option values.
 */
function showPrefs() {
    modalPrefs.setAttribute('open', '');

    // A helper to respond to modal actions
    function handleAction(action) {
        if(new URL(action.href).hash === '#confirm') {
            savePrefs(modalPrefs.querySelector('form'));
            readPrefs();
        }

        modalPrefs.removeAttribute('open');
    }

    // Update the form to match the current option values
    const themeSelect = modalPrefs.querySelector('#theme-select');
    themeSelect.value = localStorage.getItem('gotepad.theme') || 'auto';

    const lineNumSwitch = modalPrefs.querySelector('#line-numbers');
    lineNumSwitch.checked = localStorage.getItem('gotepad.lineNumbers') === 'on';

    const wordWrapSwitch = modalPrefs.querySelector('#word-wrap');
    wordWrapSwitch.checked = localStorage.getItem('gotepad.wordWrap') === 'on';

    // Respond to the modal actions
    const actions = modalPrefs.querySelectorAll('footer a');
    actions.forEach(action => {
        action.onclick = () => handleAction(action);
    });
}

/**
 * Saves the options to local storage.
 * @param {Element} optionsForm - The options form element
 */
function savePrefs(optionsForm) {
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
function readPrefs() {
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

/**
 * Displays the 'language' modal and updates its form with the current option values.
 */
function showLangOpts() {
    modalLang.setAttribute('open', '');

    const langSelect = modalLang.querySelector('#language-select');

    // A helper to respond to modal actions
    function handleAction(action) {
        if(new URL(action.href).hash === '#confirm') {
            setLanguage(langSelect.value);
        }

        modalLang.removeAttribute('open');
    }

    // Update the form to match the current option values
    langSelect.value = currentLang;

    // Respond to the modal actions
    const actions = modalLang.querySelectorAll('footer a');
    actions.forEach(action => {
        action.onclick = () => handleAction(action);
    });
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
        case 'cmd-palette':
            triggerCmdPalette();
            break;
        case 'prefs':
            showPrefs();
            break;
        case 'language':
            showLangOpts();
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

function setLanguage(lang) {
    currentLang = lang;
    setEditorLang(lang);
}

function initLanguages() {
    // Emit an event with the supported languages to notify the backend
    EventsEmit('onLanguagesLoaded', JSON.stringify(supportedLangs));

    const langSelect = document.querySelector('#language-select');

    // Populate languages modal menu
    supportedLangs.forEach(language => {
        const langOpt = document.createElement('option');
        langOpt.value = language.id;
        langOpt.text = language.aliases[0];

        langSelect.add(langOpt, null);
    });
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

readPrefs();
initLanguages();

// Listen for resizes on the editor's parent container
resizeObserver.observe(document.querySelector('body > main'));

// Listen for editor content and cursor changes
editor.onDidChangeModelContent(() => saveStatus.innerText = 'unsaved');
editor.onDidChangeCursorPosition(onSelectionChanged);

// Set up the menu and key interactions
menuItems.forEach(initMenuItem);
document.addEventListener('keydown', onKey);

modals.forEach(initModal);