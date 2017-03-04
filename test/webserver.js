var http = require('http');

function WebServer() {
	this.root = '.';
  this.host = 'localhost';
  this.port = 0;
  this.server = null;
  this.verbose = false;
  this.cacheExpirationTime = 0;
  this.disableRangeRequests = false;
  this.hooks = {
    'GET': [],
    'POST': []
  };
}
WebServer.prototype = {
	start: function(callback) {
		this.server = http.createServer(this._handler.bind(this));
		this.server.listen(this.port, this.host, callback);
		console.log(
			'Server running at http://' + this.host + ':' + this.port + '/'
		);
	},
	_handler: function(req, res) {
		res.end('Server has not been implemented');
	}
}

exports.WebServer = WebServer;