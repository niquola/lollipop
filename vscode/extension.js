const path = require("path");
const vscode = require('vscode');
const lsp = require('vscode-languageclient');
const net = require('net');
const { spawn } = require('child_process');

function activate(context) {
  let client;
  const server = net.createServer(socket => {
    console.log('Process connected');
    socket.on('end', () => {
      console.log('Process disconnected');
    });
    server.close();
    resolve({ reader: socket, writer: socket });
  });
  // Listen on random port
  let createAndRunServer = function(){
    return new Promise((resolve, reject) => {
      let port;
      server.listen(0, '127.0.0.1', () => {
        console.log('Starting server')
        const port = server.address().port;
        var path = "/usr/bin/java"
        var args = ["-jar", "/home/flawless/projects/igpop/target/igpop.jar",
                    "lsp", "-p", port];
        server.close(() => {
          client.serverProcess = spawn(path, args, {cwd: '/home/flawless/projects/igpop/example'} );
          resolve(port);
          client.serverProcess.on('exit', (code, signal) => {
            if (code !== 0) {
              console.log(`Language server exited ` + (signal ? `from signal ${signal}` : `with exit code ${code}`));
            }
          });
          console.log(`Server spawned on port ${port}`)
        });
      });
    });
  };
  let serverOptions = (args => {
    return new Promise((resolve, reject) => {
      let lspserver
      let connect = (client, port) => {
        client.connect(port, "127.0.0.1", () => {
          console.log('connected');
          resolve({
            reader: client,
            writer: client
          });
        });
      }
      client = new net.Socket();
      lspserver = createAndRunServer();
      lspserver.then((port) => {
        connect(client, port);
        client.on('error', () => {
          console.log('socket closed, try reconnect');
          let reconnectLoop = setInterval(() => {
            try {
              client.end();
            } finally {}
            connect(client, port)
            clearInterval(reconnectLoop);
          }, 5000);
        });
      });
    });
  });

  let clientOptions = {
    documentSelector: [{ scheme: 'file', language: 'igpop' }],
    synchronize: {
      // Notify the server about file changes to '.clientrc files contained in the workspace
      configurationSection: 'igpop-lsp',
      fileEvents: [
        vscode.workspace.createFileSystemWatcher('**/*.igpop')
      ]
    }
  };
  client = new lsp.LanguageClient('igpop', 'Language Server Igpop', serverOptions, clientOptions);
  client.start();
  context.subscriptions.push(client);

  console.log('Congratulations, your extension "hello" is now active!');

  let disposable = vscode.commands.registerCommand('extension.helloWorld', function () {
    vscode.window.showInformationMessage('Hello World!');
  });

  context.subscriptions.push(disposable);
}
exports.activate = activate;
function deactivate() {
  console.log("Deactivated Extension");
  client.serverProcess.kill();
  if (!client) {
    return undefined;
  }
  return client.stop();
}
exports.deactivate = deactivate;
