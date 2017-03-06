
(function(root, factory) {
	if (typeof define === 'function' && define.amd) {
		define('hpdfjs/display/dom_utils', ['exports', 'hpdfjs/shared/util'], factory);
	} else {
		console.log('Unknown module format for display\api');
	}
}(this, function(exports, sharedUtil) {
	
function getDefaultSetting(id) {
	// The list of the settings and their default is maintained for backward
	// compatibility and shall not be extended or modified. See also global.js.
	var globalSettings = sharedUtil.globalScope.PDFJS;
	switch (id) {
		case 'pdfBug':
			return globalSettings ? globalSettings.pdfBug : false;
		case 'disableAutoFetch':
			return globalSettings ? globalSettings.disableAutoFetch : false;
		case 'disableStream':
			return globalSettings ? globalSettings.disableStream : false;
		case 'disableRange':
			return globalSettings ? globalSettings.disableRange : false;
		case 'disableFontFace':
			return globalSettings ? globalSettings.disableFontFace : false;
		case 'disableCreateObjectURL':
			return globalSettings ? globalSettings.disableCreateObjectURL : false;
		case 'disableWebGL':
			return globalSettings ? globalSettings.disableWebGL : true;
		case 'cMapUrl':
			return globalSettings ? globalSettings.cMapUrl : null;
		case 'cMapPacked':
			return globalSettings ? globalSettings.cMapPacked : false;
		case 'postMessageTransfers':
			return globalSettings ? globalSettings.postMessageTransfers : true;
		case 'workerPort':
			return globalSettings ? globalSettings.workerPort : null;
		case 'workerSrc':
			return globalSettings ? globalSettings.workerSrc : null;
		case 'disableWorker':
			return globalSettings ? globalSettings.disableWorker : false;
		case 'maxImageSize':
			return globalSettings ? globalSettings.maxImageSize : -1;
		case 'imageResourcesPath':
			return globalSettings ? globalSettings.imageResourcesPath : '';
		case 'isEvalSupported':
			return globalSettings ? globalSettings.isEvalSupported : true;
		case 'externalLinkTarget':
			if (!globalSettings) {
				return LinkTarget.NONE;
			}
			switch (globalSettings.externalLinkTarget) {
				case LinkTarget.NONE:
				case LinkTarget.SELF:
				case LinkTarget.BLANK:
				case LinkTarget.PARENT:
				case LinkTarget.TOP:
					return globalSettings.externalLinkTarget;
			}
			warn('PDFJS.externalLinkTarget is invalid: ' +
					globalSettings.externalLinkTarget);
			// Reset the external link target, to suppress further warnings.
			globalSettings.externalLinkTarget = LinkTarget.NONE;
			return LinkTarget.NONE;
		case 'externalLinkRel':
			return globalSettings ? globalSettings.externalLinkRel : DEFAULT_LINK_REL;
		case 'enableStats':
			return !!(globalSettings && globalSettings.enableStats);
		default:
			throw new Error('Unknown default setting: ' + id);
	}
}

var DOMCMapReaderFactory = (function DOMCMapReaderFactoryClosure() {
	function DOMCMapReaderFactory(params) {
		this.baseUrl = params.baseUrl || null;
		this.isCompressed = params.isCompressed || false;
	}
	
	DOMCMapReaderFactory.prototype = {
		fetch: function(params) {
			throw new Error('DOMCMapReaderFactory.fetch not impl');
		}
	}
	
	return DOMCMapReaderFactory;
})();

exports.DOMCMapReaderFactory = DOMCMapReaderFactory;
exports.getDefaultSetting = getDefaultSetting;
}));