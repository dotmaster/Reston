var FileStream = require('./lib/FileStream'),
	MultipartWriter = require('./lib/MultipartWriter'),
	Reston = require('./lib/Reston'),
	http = require('http'),
	Url = require('url'),
	core = require('./lib/Core'),
	querystring = require('querystring');


var request_object = function(method, address, headers){
	//Create client for node 0.2.x
	if(http.createClient){
		var urlinfo = Url.parse(address);
		if( urlinfo.protocol && urlinfo.protocol != 'http:') throw new 'Only support of http protocol';
		var cl = http.createClient( urlinfo.port || 80, urlinfo.hostname);
		var req = cl.request( method, (urlinfo.pathname || '/') + ((urlinfo.query && '?') || '') + (urlinfo.query || ''), core.mixin({
				'Host': urlinfo.host
			}, headers));
		return req;
	}
};

var data = '';

var req = Reston.get('http://search.twitter.com/search.json');
req.on('data', function(c){
	console.log(c.toString());
});
req.send({q: 'nodejs'});
