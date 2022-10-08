import {EventsOn} from '../../wailsjs/runtime';

const terminalMenu = document.querySelector('#terminal-menu');
const menuDropdown = document.querySelector('#terminal-dropdown');

const templateTerminal = document.querySelector('#template-terminal');

function onTerminalClick(name) {
    menuDropdown.removeAttribute('open');
}

function onTerminalsMapped(terminals) {
    if(Object.keys(terminals).length == 0) return;

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