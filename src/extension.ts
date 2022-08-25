// This code is based on
// https://github.com/microsoft/vscode-extension-samples/tree/main/decorator-sample

import * as vscode from 'vscode';

// this method is called when vs code is activated
export function activate(context: vscode.ExtensionContext) {

  console.log('lambda for fun F# is activated');

  const setConfig = () => {
    type Config = {
      color: string,
      delay: number,
      regex: string
    };
    let config: Config = vscode.workspace.getConfiguration().get('lambda-for-fun-fsharp') as Config;

    console.log(config);
    // create a decorator type that we use to decorate the matched keyword
    decorationType = vscode.window.createTextEditorDecorationType(
      {
        before: {
          contentText: "\\",
          color: config.color,
        },
        textDecoration: "none; display: none;",
      }
    );

    delay = config.delay;

    regEx = config.regex === ""
      ? /\bfun (?=(?:[^"]*"[^"]*")*[^"]*$)/g
      : new RegExp(config.regex, 'g');
  };

  let decorationType: vscode.TextEditorDecorationType;
  let delay: number;
  let regEx: RegExp;
  //initialize
  setConfig();
  // config values will be updated on change
  vscode.workspace.onDidChangeConfiguration(event => {
    setConfig();
  });

  let timeout: NodeJS.Timer | undefined = undefined;
  let activeEditor = vscode.window.activeTextEditor;

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
