import * as monaco from 'monaco-editor';
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker';
import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker';
import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker';
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker';

self.MonacoEnvironment = {
    getWorker: function(workerId, label) {
        switch(label) {
            case 'json':
                return new jsonWorker();
            case 'css':
            case 'scss':
            case 'less':
                return new cssWorker();
            case 'html':
            case 'handlebars':
            case 'razor':
                return new htmlWorker();
            case 'typescript':
            case 'javascript':
                return new tsWorker();
            default:
                return new editorWorker();
        }
    }
};

export const editor = monaco.editor.create(document.querySelector('#text-input'), {
    lineNumbers: 'off',
    language: 'plaintext'
});

export const supportedLangs = monaco.languages.getLanguages()
    .filter(lang => lang.aliases?.length > 0 && lang.extensions?.length > 0);

/**
 * Updates the Monaco editor's current language.
 * @param {string} lang - The language to update to.
 */
export function setEditorLang(lang) {
    monaco.editor.setModelLanguage(editor.getModel(), lang);
}

// console.log(editor.getSupportedActions());
// console.log(monaco.languages.getLanguages());