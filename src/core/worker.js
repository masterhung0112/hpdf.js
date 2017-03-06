'use strict';

(function (root, factory) {
	if (typeof define === 'function' && define.amd) {
		define('hpdfjs/core/worker', ['exports', 'hpdfjs/shared/util'], factory);
	} else {
		console.error('unknown module for worker');
	}
}(this, function (exports, sharedUtil) {

var isNodeJS = sharedUtil.isNodeJS
var MessageHandler = sharedUtil.MessageHandler;

var WorkerMessageHandler = {
	setup: function wphSetup(handler, port) {
		var testMessageProcessed = false;
		handler.on('test', function wphSetupTest(data) {
			if (testMessageProcessed) {
				return;
			}
			
			testMessageProcessed = true;
			
			// Check if Uint8Array can be sent to worker
			if (!(data instanceof Uint8Array)){
				handler.send('test', 'main', false);
				return;
			}
			
			// making sure postMessage transfers are working
			var supportTransfers = data[0] == 255;
			handler.postMessageTranfers = supportTransfers;
			var xhr = new XMLHttpRequest();
			var responseExists = 'response' in xhr;
			try {
				xhr.responseType; // eslint-disable-line no-unused-expressions
			} catch(e) {
				responseExists = false;
			}
			if (!responseExists) {
				handler.send('test', false);
				return;
			}
			handler.send('test', {
				supportTypedArray: true,
				supportTransfers: supportTransfers
			});
		});
	},
}

function initializeWorker() {
	var handler = new MessageHandler('worker', 'main', self);
	WorkerMessageHandler.setup(handler, self);
	handler.send('ready', null);
}

if (typeof window === 'undefined' && !isNodeJS()) {
	initializeWorker();
}

}));