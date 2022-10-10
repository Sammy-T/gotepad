import {EventsOn} from '../../wailsjs/runtime';
import {OpenTerminal} from '../../wailsjs/go/main/TerminalAction';

const terminalMenu = document.querySelector('#terminal-menu');
const menuDropdown = document.querySelector('#terminal-dropdown');

const templateTerminal = document.querySelector('#template-terminal');

/**
 * Opens the terminal and closes the menu dropdown.
 * @param {String} name - The terminal name
 */
function onTerminalClick(name) {
    OpenTerminal(name);
    menuDropdown.removeAttribute('open');
}

/**
 * Populates the terminal menu with the mapped terminals.
 * @param {Object} response 
 */
function onTerminalsMapped(response) {
    if(response.Status !== 'success') {
        console.error(response);
        return;
    }

    const terminals = response.Data;

    if(Object.keys(terminals).length === 0) return;

    terminalMenu.innerHTML = ''; // Clear the menu contents

    for(const name in terminals) {
        // Create a new 'terminal' menu item
        const menuItem = templateTerminal.content.firstElementChild.cloneNode(true);
        const small = menuItem.querySelector('small');
        const anchor = menuItem.querySelector('a');

        // Set the template values
        small.innerText = name;
        anchor.id = 'Terminal-' + name.replace(" ", "-");

        anchor.addEventListener('click', () => onTerminalClick(name));

        terminalMenu.appendChild(menuItem);
    }
}

EventsOn('onTerminalsMapped', onTerminalsMapped);