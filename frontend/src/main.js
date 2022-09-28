import {EventsOn} from '../wailsjs/runtime/runtime';

const textArea = document.querySelector('#text-input');

// Listen for events
EventsOn('onNewFile', () => textArea.value = '');
EventsOn('onFileRead', fileText => textArea.value = fileText);
