var core = require('./Core'),
	evEmitter = require('events').EventEmitter;

var ResponseAccumulator = function (reston, encoding){
	var me=this;

	me.data = '';
	me.headers = {};

	encoding = encoding || 'utf8';

	reston.on('start', function(resp, req){
		core.mixin(me.headers, resp.headers);
	});
	reston.on('data', function(chunk){
		me.data = me.data + chunk.toString(encoding);
	});
};

var proto = ResponseAccumulator.prototype; 

module.exports = ResponseAccumulator; 
