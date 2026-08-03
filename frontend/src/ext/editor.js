import * as monaco from 'monaco-editor';

self.MonacoEnvironment = {
	getWorker: function (workerId, label) {
		const getWorkerModule = (moduleUrl, label) => {
			return new Worker(self.MonacoEnvironment.getWorkerUrl(moduleUrl), {
				name: label,
				type: 'module'
			});
		};

		switch (label) {
			case 'json':
				return getWorkerModule('/monaco-editor/esm/vs/language/json/json.worker?worker', label);
			case 'css':
			case 'scss':
			case 'less':
				return getWorkerModule('/monaco-editor/esm/vs/language/css/css.worker?worker', label);
			case 'html':
			case 'handlebars':
			case 'razor':
				return getWorkerModule('/monaco-editor/esm/vs/language/html/html.worker?worker', label);
			case 'typescript':
			case 'javascript':
				return getWorkerModule('/monaco-editor/esm/vs/language/typescript/ts.worker?worker', label);
			default:
				return getWorkerModule('/monaco-editor/esm/vs/editor/editor.worker?worker', label);
		}
	}
};

monaco.editor.addKeybindingRules([
    // Add alternate keybinding option for opening the command palette
    {
        keybinding: monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyP,
        command: "editor.action.quickCommand"
    }
]);

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