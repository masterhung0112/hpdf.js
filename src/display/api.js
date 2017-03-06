(function(root, factory) {
	if (typeof define === 'function' && define.amd) {
		define('hpdfjs/display/api', ['exports', 'hpdfjs/shared/util', 'hpdfjs/display/dom_utils'], factory);
	} else {
		console.log('Unknown module format for display\api');
	}
}(this, function(exports, sharedUtil, displayDOMUtils) {

var PDFJS = sharedUtil.globalScope.PDFJS;
var createPromiseCapability = sharedUtil.createPromiseCapability;
var isArrayBuffer = sharedUtil.isArrayBuffer;
var error = sharedUtil.error;
var MessageHandler = sharedUtil.MessageHandler;
var getDefaultSetting = displayDOMUtils.getDefaultSetting;
var getVerbosityLevel = sharedUtil.getVerbosityLevel;
var DOMCMapReaderFactory = displayDOMUtils.DOMCMapReaderFactory;

var DEFAULT_RANGE_CHUNK_SIZE = 65536;

var isWorkerDisabled = false;
var workerSrc;
var isPostMessageTransfersDisabled = false;

var pdfjsFilePath =
  typeof PDFJSDev !== 'undefined' &&
  PDFJSDev.test('PRODUCTION && !(MOZCENTRAL || FIREFOX)') &&
  typeof document !== 'undefined' && document.currentScript ?
    document.currentScript.src : null;

var PDFDocumentLoadingTask = (function PDFDocumentLoadingTaskClosure() {
	var nextDocumentId = 0;
	
	function PDFDocumentLoadingTask() {
		this._capability = createPromiseCapability();
		this._transport = null;
		this._worker = null;
		
		this.docId = 'd' + (nextDocumentId++);
		
		this.destroyed = false;
		this.onPassword = null;
		this.onProgress = null;
		this.onUnsupportedFeature = null;
	}
	
	PDFDocumentLoadingTask.prototype = {
		get promise() {
			return this._capability.promise;
		},
		
		destroy: function() {
			this.destroyed = true;
			
			var transportDestroyed = !this._transport ? Promise.resolve() :
				this._transport.destroy();
			return transportDestroyed.then(function () {
				this._transport = null;
				if (this._worker) {
					this._worker.destroy();
					this._worker = null;
				}
			}.bind(this));
		},
		
		then: function PDFDocumentLoadingTask_then(onFulfilled, onRejected) {
			return this.promise.then.apply(this.promise, arguments);
		}
	}
	
	return PDFDocumentLoadingTask;
})();

var PDFWorker = (function PDFWorkerClosure() {
	var nextFakeWorkerId = 0;
	
	function getWorkerSrc() {
		if (typeof workerSrc !== 'undefined') {
			return workerSrc;
		}
		
		if (getDefaultSetting('workerSrc')) {
			return getDefaultSetting('workerSrc');
		}
		
		if (typeof PDFJSDev !== 'undefined' &&
			PDFJSDev.test('PRODUCTION && !(MOZCENTRAL || FIREFOX)') &&
			pdfjsFilePath) {
			throw new Error('not impl');
		}
		error('No PDFJS.workerSrc specified');
	}
	
	function PDFWorker(name, port) {
		this.name = name;
		this.destroyed = false;
		
		this._readyCapability = createPromiseCapability();
		this._port = null;
		this._webWorker = null;
		this._messageHandler = null;
		
		if (port) {
			this._initializeFromPort(port);
			return;
		}
		
		this._initialize();
	}
	
	PDFWorker.prototype = {
		get promise() {
			return this._readyCapability.promise;
		},
		
		_initializeFromPort: function PDFWorker_initializeFromPort(port) {
			this._port = port;
			this._messageHandler = new MessageHandler('main', 'worker', port);
			this._messageHandler.on('ready', function() {});
		},
		
		_initialize: function PDFWorker_initialize() {
			if ((typeof PDFJSDev === 'undefined' || !PDFJSDev.test('SINGLE_FILE')) &&
				!isWorkerDisabled && !sharedUtil.globalScope.PDFJS.disableWorker &&
				typeof Worker !== 'undefined') {
					var workerSrc = getWorkerSrc();
					
					try {
						if (typeof PDFJSDev !== 'undefined' && PDFJSDev.test('GENERIC') &&
							!isSameOrigin(window.location.href, workerSrc)) {
							workerSrc = createCDNWrapper(
								new URL(workerSrc, window.location).href
							);
						}
						
						var worker = new Worker(workerSrc);
						var messageHandler = new MessageHandler('main', 'worker', worker);
						
						var terminateEarly = function() {
							worker.removeEventListener('error', onWorkerError);
							messageHandler.destroy();
							worker.terminate();
							if (this.destroyed) {
								this._readyCapability.reject(new Error('Worker was destroyed'));
							} else {
								this._setupFakeWorker();
							}
						}
						
						var onWorkerError = function(even) {
							if (!this._webWorker) {
								terminateEarly();
							}
						}.bind(this);
						worker.addEventListener('error', onWorkerError);
						
						messageHandler.on('test', function PDFWorker_test(data) {
							worker.removeEventListener('error', onWorkerError);
							if (this.destroyed) {
								terminateEarly();
								return;
							}
							var supportTypedArray = data && data.supportTypedArray;
							if (supportTypedArray) {
								this._messageHandler = messageHandler;
								this._port = worker;
								this._webWorker = worker;
								if (!data.supportTransfers) {
									isPostMessageTransfersDisabled = true;
								}
								this._readyCapability.resolve();
								
								// Send global setting, e.g. verbosity level.
								messageHandler.send('configure', {
									verbosity: getVerbosityLevel()
								});
							} else {
								this._setupFakeWorker();
								messageHandler.destroy();
								worker.terminate();
							}
						}.bind(this));
						
						messageHandler.on('ready', function(data) {
							worker.removeEventListener('error', onWorkerError);
							if (this.destroyed) {
								terminateEarly();
								return;
							}
							
							try {
								sendTest();
							} catch(e) {
								this._setupFakeWorker();
							}
						}.bind(this));
						
						var sendTest = function () {
							var postMessageTransfers = getDefaultSetting('postMessageTransfers') && !isPostMessageTransfersDisabled;
							var testObj = new Uint8Array([postMessageTransfers ? 255 : 0]);
							try {
								messageHandler.send('test', testObj, [testObj.buffer]);
							} catch (ex) {
								info('Cannot use PostMessage transfers');
								testObj[0] = 0;
								messageHandler.send('test', testObj);
							}
						};
						
						sendTest();
						return;
					} catch (e) {
						info('The worker has been disabled.');
					}
				}
		},
		
		_setupFakeWorker: function PDFWorker_setupFakeWorker() {
			throw new Error('_setupFakeWorker not impl yet');
		}
	};
	
	return PDFWorker;
})();

function getDocument(src, pdfDataRangeTransport, passwordCallback, progressCallback) {
	var task = new PDFDocumentLoadingTask();
	
	if (pdfDataRangeTransport) {
		console.log('Not support pdfDataRangeTransport yet');
	}
	task.onPassword = passwordCallback || null;
	task.onProgress = progressCallback || null;
	
	var source;
	if (typeof src === 'string') {
		source = { url: src };
	} else if (isArrayBuffer(src)) {
		source = { data: src };
	} else if (src instanceof PDFDataRangeTransport) {
		console.log('Not support pdfDataRangeTransport yet for src');
		source = { range: src };
	} else {
		if (typeof src !== 'object') {
			error('Invalid parameter in getDocument, need either Uint8Array, ' +
				'string or a parameter object');
		}
		if (!src.url && !src.data && !src.range) {
			error('Invalid parameter object: need either .data, .range or .url');
		}
		
		source = src;
	}
	
	var params = {};
	var rangeTransport = null;
	var worker = null;
	for (var key in source) {
		if (key === 'url' && typeof window !== 'undefined') {
			// the full path is requierd in the 'url' field
			params[key] = new URL(source[key], window.location).href;
			continue;
		} else if (key === 'range') {
			rangeTransport = source[key];
			continue;
		} else if (key === 'worker') {
			worker = source[key];
			continue;
		} else if (key === 'data' && !(source[key] instanceof Uint8Array)) {
			// Convert string or array-like data to Uint8Array
			throw new Error('Uint8Array haven\'t been support');
			error('Invalid PDF binary data: either typed array, string or ' +
              'array-like object is expected in the data property.');
			continue;
		}
		params[key] = source[key];
	}
	
	params.rangeChunkSize = params.rangeChunkSize || DEFAULT_RANGE_CHUNK_SIZE;
	params.disableNativeImageDecoder = params.disableNativeImageDecoder === true;
	var CMapReaderFactory = params.CMapReaderFactory || DOMCMapReaderFactory;
	
	if (!worker) {
		var workerPort = getDefaultSetting('workerPort');
		worker = workerPort ? new PDFWorker(null, workerPort) : new PDFWorker();
		task._worker = worker;
	}
	var docId = task.docId;
	worker.promise.then(function() {
		if (task.destroyed) {
			throw new Error('Loading aborted');
		}
		return _fetchDocument(worker, params, rangeTransport, docId).then(
			function(workerId) {
				if (task.destroyed) {
					throw new Error('Loading aborted');
				}
				throw new Error('worker promise then has not been implemented');
			}
		);
	}).catch(task._capability.reject);
	
	return task;
}

exports.getDocument = getDocument;

}));