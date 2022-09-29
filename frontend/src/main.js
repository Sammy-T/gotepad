import {EventsOn} from '../wailsjs/runtime/runtime';
import {SaveAs, Save} from '../wailsjs/go/main/App';

const textArea = document.querySelector('#text-input');
const saveStatus = document.querySelector('#save-status');
const lineCount = document.querySelector('#line-count');

// Listen for Wails events
EventsOn('onNewFile', () => textArea.value = '');
EventsOn('onFileRead', fileText => textArea.value = fileText);
EventsOn('onFileSaved', response => console.log(response));

EventsOn('onRequestSaveAs', () => SaveAs(textArea.value));
EventsOn('onRequestSave', () => Save(textArea.value));

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

// There's overlap between these listeners but it's the only way I've found
// to update on input, backspace, and selection changes.
textArea.addEventListener('input', onSelectionChanged);
document.addEventListener('selectionchange', onSelectionChanged);
