requirejs(['hpdfjs/display/api', 'hpdfjs/display/global'], function(api, global) {
	global.PDFJS.workerSrc = '../../src/worker_loader.js';
	
	// Getch the PDF document
	api.getDocument('helloworld.pdf').then(function(pdf) {
		console.log("Got the pdf document");
		
	});
});