import {EventsOn} from '../wailsjs/runtime/runtime';

const textArea = document.querySelector('#text-input');

EventsOn('onFileRead', fileText => {
    textArea.value = fileText;
});
