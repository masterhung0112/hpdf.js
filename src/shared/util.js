(function(root, factory) {
	if (typeof define === 'function' && define.amd) {
		define('hpdfjs/shared/util', ['exports'], factory);
	} else {
		console.log('Unknown factory for shared\\util.js');
	}
	
}(this, function(exports) {

var globalScope = (typeof window !== 'undefined') ? window :
									(typeof global !== 'undefined') ? global :
									(typeof self !== 'undefined') ? self : this;

var VERBOSITY_LEVELS = {
	errors: 0,
	warnings: 1,
	infos: 5
};

var verbosity = VERBOSITY_LEVELS.warnings;

function backtrace() {
	try {
		throw new Error();
	} catch (e) {
		return e.stack ? e.stack.split('\n').slice(2).join('\n') : '';
	}
}

function error(msg) {
	if (verbosity >= VERBOSITY_LEVELS.errors) {
		console.log('Error: ' + msg);
		console.log(backtrace());
	}
	throw new Error(msg);
}

function createPromiseCapability() {
	var capability = {};
	capability.promise = new Promise(function (resolve, reject) {
		capability.resolve = resolve;
		capability.reject = reject;
	});
	return capability;
} 

function isArrayBuffer(v) {
	return typeof v === 'object' && v !== null && v.byteLength !== undefined;
}

function MessageHandler(sourceName, targetName, comObj) {
	this.sourceName = sourceName;
	this.targetName = targetName;
	this.comObj = comObj;
	this.callbackIndex = 1;
	this.postMessageTransfers = true;
	var callbacksCapabilities = this.callbacksCapabilities = Object.create(null);
	var ah = this.actionHandler = Object.create(null);
	
	this._onComObjOnMessage = function messageHandlerComObjOnMessage(event) {
		var data = event.data;
		if (data.targetName != this.sourceName) {
			return;
		}
		
		if (data.isReply) {
			var callbackId = data.callbackId;
			if (data.callbackId in callbacksCapabilities) {
				var callback = callbacksCapabilities[callbackId];
				delete callbacksCapabilities[callbackId];
				if ('error' in data) {
					callback.reject(data.error);
				} else {
					callback.resolve(data.data);
				}
			} else {
				error('Cannot resolve callback ' + callbackId);
			}
		} else if (data.action in ah) {
			var action = ah[data.action];
			if (data.callbackId) {
				var sourceName = this.sourceName;
				var targetName = data.sourceName;
				Promise.resolve().then(function() {
					return action[0].call(action[1], data.data);
				}).then(function (result) {
					comObj.postMessage({
						sourceName: sourceName,
						targetName: targetName,
						isReply: true,
						callbackId: data.callbackId,
						data: result
					}, function (reason) {
						if (reason instanceof Error) {
							reason = reason + '';
						}
						comObj.postMessage({
							sourceName: sourceName,
							targetName: targetName,
							isReply: true,
							callbackId: data.callbackId,
							error: reason
						});
					});
				});
			} else {
				action[0].call(action[1], data.data);
			}
		} else {
			error('Unknown action from worker: ' + data.action);
		}
	}.bind(this);
	
	comObj.addEventListener('message', this._onComObjOnMessage, false);
}

MessageHandler.prototype = {
	on: function MessageHandlerOn(actionName, handler, scope) {
		var ah = this.actionHandler;
		if (ah[actionName]) {
			error ('There is already an actionName called "' + actionName + '"');
		}
		ah[actionName] = [handler, scope];
	},
	
	send: function messageHandlerSend(actionName, data, transfers) {
		var message = {
			sourceName: this.sourceName,
			targetName: this.targetName,
			action: actionName,
			data: data
		};
		this.postMessage(message, transfers);
	},
	
	postMessage: function (message, transfers) {
		if (transfers && this.postMessageTransfers) {
			this.comObj.postMessage(message, transfers);
		} else {
			this.comObj.postMessage(message);
		}
	},
	
	destroy: function() {
		this.comObj.removeEventListener('message', this._onComObjOnMessage);
	}
};

function getVerbosityLevel() {
	return verbosity;
}

function isNodeJS() {
	// The if below protected by __pdfjsdev_webpack__ check from webpack parsing.
	if (typeof __pdfjsdev_webpack__ === 'undefined') {
		return typeof process === 'object' && process + '' === '[object process]';
	}
	return false;
}

exports.error = error;
exports.globalScope = globalScope;
exports.createPromiseCapability = createPromiseCapability;
exports.MessageHandler = MessageHandler;
exports.isArrayBuffer = isArrayBuffer;
exports.isNodeJS = isNodeJS;
exports.VERBOSITY_LEVELS = VERBOSITY_LEVELS;
exports.getVerbosityLevel = getVerbosityLevel;

}));