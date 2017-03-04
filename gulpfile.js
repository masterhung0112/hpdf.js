var gulp = require('gulp');

gulp.task('server', function(done) {
	console.log();
	console.log('### Starting local server');
	
	var WebServer = require('./test/webserver.js').WebServer;
	var server = new WebServer();
	server.port = 8888;
	server.start();
});