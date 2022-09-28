import {EventsOn} from '../wailsjs/runtime/runtime';
import {SaveAs, Save} from '../wailsjs/go/main/App';

const textArea = document.querySelector('#text-input');

// Listen for events
EventsOn('onNewFile', () => textArea.value = '');
EventsOn('onFileRead', fileText => textArea.value = fileText);
EventsOn('onFileSaved', response => console.log(response));

EventsOn('onRequestSaveAs', () => SaveAs(textArea.value));
EventsOn('onRequestSave', () => Save(textArea.value));
