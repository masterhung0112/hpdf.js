var http = require('http');
var path = require('path');
var fs = require('fs');

var mimeTypes = {
  '.css': 'text/css',
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.pdf': 'application/pdf',
  '.xhtml': 'application/xhtml+xml',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.png': 'image/png',
  '.log': 'text/plain',
  '.bcmap': 'application/octet-stream',
  '.properties': 'text/plain'
};

var defaultMimeType = 'applicaion/octet-stream';

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
		this._ensureNonZeroPort();
		this.server = http.createServer(this._handler.bind(this));
		this.server.listen(this.port, this.host, callback);
		console.log(
			'Server running at http://' + this.host + ':' + this.port + '/'
		);
	},
	stop: function (callback) {
		this.server.close(callback);
		this.server = null;
	},
	_handler: function(req, res) {
		var url = req.url.replace(/\/\//g, '/');
		var urlParts = /([^?]*)((?:\?(.*))?)/.exec(url);
		var pathPart = decodeURI(urlParts[1]), queryPart = urlParts[3];
		var verbose = this.verbose;
		
		var disableRangeRequests = this.disableRangeRequests;
		var cacheExpirationTime = this.cacheExpirationTime;
		
		var filePath;
		fs.realpath(path.join(this.root, pathPart), checkFile);
		
		function checkFile(err, file) {
			if (err) {
				res.writeHead(404);
				res.end();
				if (verbose) {
					console.error(url + ': not found');
				}
				return;
			}
			filePath = file;
			fs.stat(filePath, statFile);
		}
		
		var fileSize;
		
		function statFile(err, stats) {
			if (err) {
				res.writeHead(500);
				res.end();
				if (verbose) {
					console.error(url + ': failed to stat');
				}
				return;
			}
			
			fileSize = stats.size;
			var isDir = stats.isDirectory();
			if (isDir && !/\/$/.test(pathPart)) {
				res.setHeader('Location', pathPart + '/' + urlParts[2]);
				res.writeHead(301);
				res.end('Redirected', 'utf8');
				return;
			}
			
			if (isDir) {
				serveDirectoryIndex(filePath);
				return;
			}
			
			var range = req.headers['range'];
			if (range && !disableRangeRequests) {
				console.error('range support not implemented yet');
				res.writeHead(500);
				res.end();
				return;
			}
			
			if (verbose) {
				console.log(url);				
			}
			serveRequestedFile(filePath);
		}
		
		function escapeHTML(untrusted) {
      // Escape untrusted input so that it can safely be used in a HTML response
      // in HTML and in HTML attributes.
      return untrusted
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }
		
		function serveDirectoryIndex(dir) {
			res.setHeader('Content-Type', 'text/html');
			res.writeHead(200);
			
			if (queryPart == 'frame') {
				res.end('<html><frameset cols=*,200><frame name=pdf>' +
          '<frame src=\"' + encodeURI(pathPart) +
          '?side\"></frameset></html>', 'utf8');
				return;
			}
			
			var all = queryPart == 'all';
			fs.readdir(dir, function(err, files) {
				if (err) {
					console.error('Fail to read dir: ' + dir);
					res.end();
					return;
				}
				
				res.write('<html><head><meta charset=\"utf-8\"></head><body>' + 
					'<h1>PDFs of ' + pathPart + '</h1>\n');
				if (pathPart !== '/') {
					res.write('<a href=\"..\">..</a><br>\n');
				}
				
				files.forEach(function (file) {
					var stat;
          var item = pathPart + file;
          var href = '';
          var label = '';
          var extraAttributes = '';
          try {
            stat = fs.statSync(path.join(dir, file));
          } catch (e) {
            href = encodeURI(item);
            label = file + ' (' + e + ')';
            extraAttributes = ' style="color:red"';
          }
          if (stat) {
            if (stat.isDirectory()) {
              href = encodeURI(item);
              label = file;
            } else if (path.extname(file).toLowerCase() === '.pdf') {
              href = '/web/viewer.html?file=' + encodeURIComponent(item);
              label = file;
              extraAttributes = ' target="pdf"';
            } else if (all) {
              href = encodeURI(item);
              label = file;
            }
          }
          if (label) {
            res.write('<a href=\"' + escapeHTML(href) + '\"' +
              extraAttributes + '>' + escapeHTML(label) + '</a><br>\n');
          }
				});
				
				if (files.length == 0) {
					res.write('<p>No files found</p>\n');
				}
				if (!all && queryPart !== 'side') {
					res.write('<hr><p>only PDF fields are shown, ' + '<a href=\"?all\">show all</a></p>\n');
				}
				res.end('</body></html>');
			});
		}
		
		function serveRequestedFile(filePath) {
			var stream = fs.createReadStream(filePath, {flags: 'rs'} );
			
			stream.on('error', function(error) {
				res.writeHead(500);
				res.end();
			});
			
			var ext = path.extname(filePath).toLowerCase();
			var contentType = mimeTypes[ext] || defaultMimeType;
			
			if (!disableRangeRequests) {
				res.setHeader('Accept-Ranges', 'bytes');
			}
			
			res.setHeader('Content-Type', contentType);
			res.setHeader('Content-Length', fileSize);
			
			if (cacheExpirationTime > 0) {
				var expireTime = new Date();
				expireTime.setSeconds(expireTime.getSeconds() + cacheExpirationTime);
				res.setHeader('Expires', expireTime.toUTCString());
			}
			
			res.writeHead(200);
			stream.pipe(res);
		}
	},
	_ensureNonZeroPort: function() {
		if (!this.port) {
			// If port is 0, a random port will ben chosen instead.
			var server = http.createServer().listen(0);
			var address = server.address();
			this.port = address ? address.port : 8000;
			server.close();
		}
	},
}

exports.WebServer = WebServer;