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

var data = 'a=hello&b=world';

var req = Reston.post('http://localhost/test1.php');
req.on('data', function(c){
	console.log(c.toString());
});
req.sendMultiPart({
	'file': new FileStream('/home/mxp/Downloads/1430225297ASPn.rar'),
	'data': 'more data here'
}); 

/*
var req = request_object('PUT', 'http://localhost/test1.php', {
	'Content-Type': 'application/x-www-form-urlencoded',
	'Content-Length': data.length});

req.on('response', function(resp){
	console.log(resp.statusCode);
	resp.on('data', function(chunk){
		console.log(chunk.toString());
	});
});
req.write(data);
req.end();

var fl = new FileStream('/home/mxp/Downloads/1430225297ASPn.rar'),
	mw = new MultipartWriter({'filename': fl, 'name': 'zohaib'});


var req = request_object('POST', 'http://localhost/test1.php', mw.headers());

req.on('response', function(resp){
	console.log(resp.statusCode);
	resp.on('data', function(chunk){
		console.log(chunk.toString());
	});
});

mw.writebody(req);
mw.on('complete', function(){
	req.end();
});

fl.on('error', function(err){
	console.log("Error...");
	console.log(err);
});
*/

