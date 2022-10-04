import {Environment, EventsOn} from '../wailsjs/runtime/runtime';
import {NewFile, OpenFile, SaveAs, Save} from '../wailsjs/go/main/App';

let platform;
let restoreText; // For storing/restoring text while transitioning between header focus
const restoreSelection = {start: -1, end: -1};

const menuDropdowns = document.querySelectorAll('#menu details');
const menuItems = document.querySelectorAll('#menu a');
const modals = document.querySelectorAll('dialog');
const header = document.querySelector('body > header');
const textArea = document.querySelector('#text-input');
const saveStatus = document.querySelector('#save-status');
const lineCount = document.querySelector('#line-count');

const templateFind = document.querySelector('#template-find');
const templateReplace = document.querySelector('#template-replace');

const modalOptions = document.querySelector('#modal-options');

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
        case 'f':
            toggleFind();
            break;
        case 'h':
            toggleReplace();
            break;
    }
}

/**
 * A helper to make a copy of the text and selection when the header gains focus.
 */
function onHeaderFocusIn() {
    restoreText = textArea.value;
    restoreSelection.start = textArea.selectionStart;
    restoreSelection.end = textArea.selectionEnd;
};

/**
 * A helper to restore the text area's content using the stored copy when the header loses focus.
 */
function onHeaderFocusOut() {
    textArea.value = restoreText;
    textArea.selectionStart = restoreSelection.start;
    textArea.selectionEnd = restoreSelection.end;

    restoreText = '';
    restoreSelection.start = -1;
    restoreSelection.end = -1;
};

/**
 * Searches for matching text starting from the current selection position.
 * @param {Event} event 
 */
function onFind(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const searchTerm = formData.get('search-term');
    
    // Get the selection/cursor position
    const selectionIndex = (textArea.selectionEnd === textArea.textLength) ? 0 : textArea.selectionEnd;

    // Create a copy of the text starting from the selection position
    const searchText = restoreText.substring(selectionIndex);

    if(searchTerm === '' || searchText === '') return;

    const searchIndex = searchText.indexOf(searchTerm); // Search for the text
    
    // If the text wasn't found, reset the textarea and selection
    if(searchIndex < 0) {
        textArea.value = restoreText;
        textArea.selectionStart = 0;
        textArea.selectionEnd = 0;
        return;
    }

    // Determine the index as it would be in the original text
    const matchIndex = searchIndex + selectionIndex;

    // Display brackets around the matched text
    textArea.value = restoreText.slice(0, matchIndex) + `[${searchTerm}]` 
        + restoreText.slice(matchIndex + searchTerm.length);
    
    // Move the selection while including the bracket-enclosed match
    textArea.selectionStart = matchIndex;
    textArea.selectionEnd = matchIndex + searchTerm.length + 2;

    // Store where the selection would be in the original text
    restoreSelection.start = matchIndex;
    restoreSelection.end = matchIndex + searchTerm.length;
}

/**
 * Replaces the currently selected text.
 * @param {Event} event 
 */
function onReplace(event) {
    event.preventDefault();

    const formData = new FormData(event.target);
    const searchTerm = formData.get('search-term');
    const replaceTerm = formData.get('replace-term');

    // Determine the currently selected text
    const selectedTerm = restoreText.slice(restoreSelection.start, restoreSelection.end);

    if(searchTerm === '') return;

    // Trigger a search if the selection doesn't encompass any text
    // or if the selected term doesn't match the search term.
    if(restoreSelection.start === restoreSelection.end || selectedTerm !== searchTerm) {
        console.warn(`Term not selected. replace: '${replaceTerm}', selected: '${selectedTerm}'`);
        onFind(event);
        return;
    }

    // Build the replacement text and set the new selection position
    const replaceText = restoreText.slice(0, restoreSelection.start) + replaceTerm 
        + restoreText.slice(restoreSelection.end);
    
    const selectionIndex = restoreSelection.start + replaceTerm.length;
    
    restoreText = replaceText;
    textArea.value = replaceText;

    textArea.selectionStart = selectionIndex;
    textArea.selectionEnd = selectionIndex;

    restoreSelection.start = selectionIndex;
    restoreSelection.end = selectionIndex;
}

/**
 * Replaces the current header or toggles the 'replace' header.
 */
function toggleReplace() {
    if(checkHeaderContent('replace')) return; // Toggle or replace the header content

    // A helper to route to the appropriate function based on the event's submitter
    const routeMethod = function(event) {
        switch(event.submitter.name) {
            case 'find-button':
                onFind(event);
                break;
            case 'replace-button':
                onReplace(event);
                break;
        }
    }

    // Create the form from the template
    const replaceForm = templateReplace.content.firstElementChild.cloneNode(true);

    replaceForm.addEventListener('focusin', onHeaderFocusIn);
    replaceForm.addEventListener('focusout', onHeaderFocusOut);
    replaceForm.addEventListener('submit', routeMethod);

    header.appendChild(replaceForm); // Add the form to the header

    replaceForm.querySelector('input').focus();
}

/**
 * Replaces the current header or toggles the 'find' header.
 */
function toggleFind() {
    if(checkHeaderContent('find')) return; // Toggle or replace the header content

    // Create the form from the template
    const findForm = templateFind.content.firstElementChild.cloneNode(true);

    findForm.addEventListener('focusin', onHeaderFocusIn);
    findForm.addEventListener('focusout', onHeaderFocusOut);
    findForm.addEventListener('submit', onFind);

    header.appendChild(findForm); // Add the form to the header

    findForm.querySelector('input').focus();
}

/**
 * Checks for and removes header content. 
 * @param {String} elementId - The id to search for.
 * @returns {Boolean} - Whether the found content matches the passed element id.
 */
function checkHeaderContent(elementId) {
    let headerChild = header.firstElementChild;
    
    if(headerChild) {
        header.innerHTML = ''; // Remove the content
        textArea.focus();
    }
    
    return headerChild?.id === elementId;
}

function showOptions() {
    modalOptions.setAttribute('open', '');

    const themeSelect = modalOptions.querySelector('[name="theme-select"]');
    themeSelect.value = localStorage.getItem('gotepad.theme') || 'auto';

    function handleAction(action) {
        if(new URL(action.href).hash === '#confirm') {
            if(themeSelect.value === 'auto') {
                localStorage.removeItem('gotepad.theme');
            } else {
                localStorage.setItem('gotepad.theme', themeSelect.value);
            }

            updateTheme();
        }

        modalOptions.removeAttribute('open');
    }

    const actions = modalOptions.querySelectorAll('footer a');
    actions.forEach(action => {
        action.onclick = () => handleAction(action)
    });
}

function initModal(modal) {
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
            Save(textArea.value);
            break;
        case 'save-file-as':
            SaveAs(textArea.value);
            break;
        case 'find-term':
            toggleFind();
            break;
        case 'replace-term':
            toggleReplace();
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

function updateTheme() {
    const html = document.querySelector('html');
    const theme = localStorage.getItem('gotepad.theme');
    
    if(!theme) {
        html.removeAttribute('data-theme');
        return;
    }

    html.setAttribute('data-theme', theme);
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

updateTheme();

// There's overlap between these listeners but it's the only way I've found
// to update on input, backspace, and selection changes.
textArea.addEventListener('input', onInput);
document.addEventListener('selectionchange', onSelectionChanged);

// Set up the menu and key interactions
menuItems.forEach(initMenuItem);
document.addEventListener('keydown', onKey);

modals.forEach(initModal);