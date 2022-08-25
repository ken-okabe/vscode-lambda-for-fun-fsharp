// This code is based on
// https://github.com/microsoft/vscode-extension-samples/tree/main/decorator-sample

import * as vscode from 'vscode';

// this method is called when vs code is activated
export function activate(context: vscode.ExtensionContext) {

	console.log('lambda for fun F# is activated');

	type Config = {
		color: string,
		delay: number,
		regex: string
	};

	// config values are initialized
	let config: Config = vscode.workspace.getConfiguration().get('lambda-for-fun-fsharp') as Config;
	console.log(config);

	let color = config.color;
	let delay = config.delay;
	let regEx = config.regex === ""
		? /\bfun (?=(?:[^"]*"[^"]*")*[^"]*$)/g
		: new RegExp(config.regex, 'g');

	// config values will be updated on change
	vscode.workspace.onDidChangeConfiguration(event => {

		config = vscode.workspace.getConfiguration().get('lambda-for-fun-fsharp') as Config;
		console.log(config);

		color = config.color;
		delay = config.delay;
		regEx = config.regex === ""
			? /\bfun (?=(?:[^"]*"[^"]*")*[^"]*$)/g
			: new RegExp(config.regex, 'g');

	});

	let timeout: NodeJS.Timer | undefined = undefined;

	let activeEditor = vscode.window.activeTextEditor;

	// create a decorator type that we use to decorate the matched keyword
	const decorationType = vscode.window.createTextEditorDecorationType(
		{
			before: {
				contentText: "\\",
				color: color,
			},
			textDecoration: "none; display: none;",
		}
	);

	// regex match, then push/set the decoration
	function updateDecorations() {
		if (!activeEditor) {
			return;
		}

		const text = activeEditor.document.getText();
		const target: vscode.DecorationOptions[] = [];
		let match;

		while ((match = regEx.exec(text))) {
			const startPos = activeEditor.document.positionAt(match.index);
			const endPos = activeEditor.document.positionAt(match.index + match[0].length);
			const decoration = {
				range: new vscode.Range(startPos, endPos)
			};
			target.push(decoration);
		}

		activeEditor.setDecorations(decorationType, target);
	}

	// when supported languages, some smart delay update
	// the inner code is derived from MS official sample
	function triggerUpdateDecorations(throttle: boolean, editor: vscode.TextEditor) {

		editor.document.languageId === "fsharp"

			? (() => {
				if (timeout) {
					clearTimeout(timeout);
					timeout = undefined;
				}
				if (throttle) {
					timeout = setTimeout(updateDecorations, delay);
				} else {
					updateDecorations();
				}
			})()
			: (() => { })();

	}

	// Various update events will trigger triggerUpdateDecorations
	if (activeEditor) {
		triggerUpdateDecorations(false, activeEditor);
	}

	vscode.window.onDidChangeActiveTextEditor(editor => {
		activeEditor = editor;
		if (editor) {
			triggerUpdateDecorations(false, editor);
		}
	}, null, context.subscriptions);

	vscode.workspace.onDidChangeTextDocument(event => {
		if (activeEditor && event.document === activeEditor.document) {
			triggerUpdateDecorations(true, activeEditor);
		}
	}, null, context.subscriptions);

}

// this method is called when your extension is deactivated
export function deactivate() { }
