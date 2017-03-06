(function(root, factory) {
	if (typeof define === 'function' && define.amd) {
		define('hpdfjs/shared/util', ['exports'], factory);
	} else {
		console.log('Unknown factory for shared\\util.js');
	}
	
}(this, function(exports) {

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

var VERBOSITY_LEVELS = {
	errors: 0,
	warnings: 1,
	infos: 5
};

var verbosity = VERBOSITY_LEVELS.warnings;

var globalScope = (typeof window !== 'undefined') ? window :
									(typeof global !== 'undefined') ? global :
									(typeof self !== 'undefined') ? self : this;

function createPromiseCapability() {
	var capability = {};
	capability.promise = new Promise(function (resolve, reject) {
		capability.resolve = resolve;
		capability.reject = reject;
	});
	capability.promise.catch(function (e) {});
	return capability;
} 

function isArrayBuffer(v) {
	return typeof v === 'object' && v !== null && v.byteLength !== undefined;
}

exports.error = error;
exports.globalScope = globalScope;
exports.createPromiseCapability = createPromiseCapability;
exports.isArrayBuffer = isArrayBuffer;
exports.VERBOSITY_LEVELS = VERBOSITY_LEVELS;

}));