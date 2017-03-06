(function () {
	var baseLocation;
	
	if (typeof document !== 'undefined') {
		baseLocation = new URL('./', document.currentScript.src);
	} else if (typeof location !== 'undefined') {
		baseLocation = location;
		while (baseLocation.href.includes('/src/')) {
			baseLocation = new URL('..', baseLocation);
		}
	} else {
		throw new Error ('cannot configure SystemJS');
	}
	
	SystemJS.config({
		packages: {
			'': {
				format: 'amd',
				defaultExtension: 'js',
			},
		},
		paths: {
			'hpdfjs': new URL('src', baseLocation).href,
			'hpdfjs-web': new URL('web', baseLocation).href,
			'hpdfjs-test': new URL('test', baseLocation).href,
		},
	});
	
	
})();