(function (root, factory) {
	if (typeof define === 'function' && define.amd) {
		define('hpdfjs/display/global', ['exports', 'hpdfjs/shared/util',
			'hpdfjs/display/api'], factory);
	} else {
		error('global undefined');
	}
}(this, function(exports, sharedUtil, displayAPI) {
	var globalScope = sharedUtil.globalScope;
	
	if (!globalScope.PDFJS) {
		globalScope.PDFJS = {};
  }
	var PDFJS = globalScope.PDFJS;
	
	PDFJS.workerSrc = (PDFJS.workerSrc === undefined ? null : PDFJS.workerSrc);
	
	/**
   *	Defines global port for worker process. 
	 */
	PDFJS.workerPort = (PDFJS.workerPort === undefined ? null : PDFJS.workerPort);
	
	PDFJS.getDocument = displayAPI.getDocument;
	
	exports.globalScope = globalScope;
	exports.PDFJS = globalScope.PDFJS;
}));