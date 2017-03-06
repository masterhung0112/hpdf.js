'use strict';

self.importScripts = (function (importScripts) {
  return function() {
    setTimeout(function () {}, 0);
    return importScripts.apply(this, arguments);
  };
})(importScripts);

importScripts('../node_modules/requirejs/require.js');
importScripts('../requirejs.config.js');

requirejs(['hpdfjs/core/worker'], function(worker) {
	
});