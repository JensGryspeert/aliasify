const vscode = require('vscode');

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
	const disposable = vscode.commands.registerCommand('aliasify.php.makeAliasOfSelectedClass', async function () {
        const editor = vscode.window.activeTextEditor;

        if (!editor) {
            vscode.window.showErrorMessage('No active editor found.');
            return;
        }

        if (editor.document.languageId !== 'php') {
            vscode.window.showInformationMessage('Please select a PHP file.');
            return;
        }

        const selection = editor.selection;
        const selectedText = editor.document.getText(selection).trim();

        if (!selectedText) {
            vscode.window.showInformationMessage('Please select a valid class name.');
            return;
        }

        const alias = await vscode.window.showInputBox({ prompt: `Enter alias for "${selectedText}"` });

        if (!alias) {
            vscode.window.showInformationMessage('Alias not provided.');
            return;
        }

        const documentText = editor.document.getText();
        const lines = documentText.split('\n');
        const useRegex = new RegExp(`^\\s*use\\s+([^\\s]+\\\\)?${selectedText}(?!\\s+as\\s+)(\\s*;)`, 'i');
        const useLineIndex = lines.findIndex(line => useRegex.test(line));

        if (useLineIndex === -1) {
            vscode.window.showInformationMessage(`No valid 'use' statement found for "${selectedText}".`);
            return;
        }

        lines[useLineIndex] = lines[useLineIndex].replace(useRegex, `use $1${selectedText} as ${alias}$2`);

        const classRegex = new RegExp(`\\b${selectedText}\\b`, 'g');

        const updatedContent = lines.map((line, index) => {
            if (
                index !== useLineIndex
                && !line.trim().startsWith('use ')
                && !line.trim().startsWith('namespace ')
                && !line.trim().startsWith('class ')
                && !line.trim().startsWith('interface ')
                && !line.trim().startsWith('trait ')
                && !line.trim().startsWith('enum ')
            ) {
                return line.replace(classRegex, alias);
            }
            return line;
        }).join('\n');

        await editor.edit((editBuilder) => {
            const fullRange = new vscode.Range(0, 0, editor.document.lineCount, 0);
            editBuilder.replace(fullRange, updatedContent);
        });

        editor.selections = [new vscode.Selection(0, 0, 0, 0)];

        vscode.window.showInformationMessage(`Successfully aliased '${selectedText}' as '${alias}'`);
    });


	context.subscriptions.push(disposable);
}

function deactivate() {}

module.exports = {
	activate,
	deactivate
}
