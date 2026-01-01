import * as vscode from 'vscode';

let serverTerminal: vscode.Terminal | undefined;
let statusBarItem: vscode.StatusBarItem;

export function activate(context: vscode.ExtensionContext) {
  console.log('Schemock extension is now active');

  // Initialize status bar item
  statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  statusBarItem.text = "$(rocket) Schemock Running";
  statusBarItem.tooltip = "Click to stop Schemock server";
  statusBarItem.command = "schemock.stop";
  context.subscriptions.push(statusBarItem);

  let startDisposable = vscode.commands.registerCommand('schemock.start', (uri: vscode.Uri) => {
    if (!uri) {
      vscode.window.showErrorMessage('Please right-click a JSON schema file to start Schemock.');
      return;
    }

    const filePath = uri.fsPath;
    
    // Check if terminal already exists
    if (serverTerminal) {
      serverTerminal.dispose();
    }

    serverTerminal = vscode.window.createTerminal({
      name: 'Schemock Server',
      iconPath: new vscode.ThemeIcon('rocket')
    });
    
    serverTerminal.show();
    
    // Run schemock start command
    // Use npx if schemock is not in path, or try both
    serverTerminal.sendText(`npx schemock start "${filePath}" --watch || schemock start "${filePath}" --watch`);
    
    vscode.window.showInformationMessage(`Starting Schemock on ${vscode.workspace.asRelativePath(uri)}...`);
    
    statusBarItem.show();
  });

  let stopDisposable = vscode.commands.registerCommand('schemock.stop', () => {
    if (serverTerminal) {
      serverTerminal.dispose();
      serverTerminal = undefined;
      statusBarItem.hide();
      vscode.window.showInformationMessage('Schemock server stopped.');
    }
  });

  let playgroundDisposable = vscode.commands.registerCommand('schemock.openPlayground', () => {
    vscode.env.openExternal(vscode.Uri.parse('http://localhost:3000'));
  });

  context.subscriptions.push(startDisposable);
  context.subscriptions.push(stopDisposable);
  context.subscriptions.push(playgroundDisposable);
}

export function deactivate() {
  if (serverTerminal) {
    serverTerminal.dispose();
  }
}
