var FileStream = require('./FileStream'),
	MultipartWriter = require('./MultipartWriter'),
    evEmitter = require('events').EventEmitter;
	http = require('http'),
	Url = require('url'),
	core = require('./Core'),
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

var create_client = function(method, hostname, port, pathname, query_string, headers){
	var cl = http.createClient( port || 80, hostname);
	var req = cl.request( method, (pathname || '/') + (query_string || ''), headers || {});
	return req;
};

var Reston = function(method, address){
	this.method = method;
	this.urlinfo = Url.parse(address);
	this.headers = {
		'Host': this.urlinfo.host
	};

	if(!this.headers.Host)
		throw "Wrong host name please check your URL";
};

core.mixin(Reston, {
	Events: {
		Start: 'start',
		Data: 'data',
		End: 'end',
		Success: 'success',
		Error: 'error'
	}
});

var proto = Reston.prototype;
core.mixin( proto, new evEmitter );
core.mixin( proto, {
	setRequestHeader: function(name, value){
		this.headers[name] = value;
	},

	//Send url-encoded or get, put form submission
	send: function(data){
		var query_data = {};
		if(this.urlinfo.query){
			query_data = querystring.parse(this.urlinfo.query);
		}
		data = core.mixin(query_data, data);

		if( this.method == 'POST' || this.method == 'PUT' ){
			if( !this.headers['Content-Type'] ){
				this.headers['Content-Type'] = 'application/x-www-form-urlencoded';
			}
		}

		if( data instanceof Object ){
			data = querystring.stringify(data);
		}else if(data !== null || data !== undefined){
			data = (''+data);
		}

		var query_string = null;
		//Incase of Get request move the data to query string
		if(this.method != 'POST' && this.method != 'PUT'){
			query_string = (data && '?'+data) || '';
			data = null;
		}else if(data && data.length){
			//Data length in case of post or put
			this.headers['Content-Length'] = data.length;
		}


		//Create client request of specified method and info
		var req = create_client(this.method, this.urlinfo.hostname, this.urlinfo.port, this.urlinfo.pathname, query_string, this.headers),
			me = this;

		//making request visible
		me.request = req;

		req.on('response', function(resp){
			//Passing response and request object
			me.emit(Reston.Events.Start, resp, req);
			resp.on('data', function(chunk){
				me.emit(Reston.Events.Data, chunk);
			});
			resp.on('end', function(){
				me.emit(Reston.Events.End, resp);
				if( resp.statusCode >= 200 && resp.statusCode < 300 ){
					me.emit(Reston.Events.Success, resp);
				}else{
					me.emit(Reston.Events.Error, resp);
				}
			});
		});

		if(data){
			req.write(data);
		}
		req.end();
	},

	//Send multipart request necessary for file uploads and huge writes
	sendMultiPart: function(data){
		if(!data){
			throw "Invalid data provided for sending multi-part data";
		}

		if(this.method != 'POST' && this.method != 'PUT'){
			throw "Multipart request only makes sense in POST and PUT";
		}

		mw = new MultipartWriter(data);
		var req = create_client(this.method, this.urlinfo.hostname, this.urlinfo.port, this.urlinfo.pathname, null, core.mixin(this.headers, mw.headers()) ),
			me = this;

		//Handlers
		req.on('response', function(resp){
			me.emit(Reston.Events.Start, resp);
			resp.on('data', function(chunk){
				me.emit(Reston.Events.Data, chunk);
			});
			resp.on('end', function(){
				me.emit(Reston.Events.End, resp);
				if( resp.statusCode >= 200 && resp.statusCode < 300 ){
					me.emit(Reston.Events.Success, resp);
				}else{
					me.emit(Reston.Events.Error, resp);
				}
			});
		});

		//write multipart responder
		mw.writebody(req);
		req.end();
	}
});

core.mixin(Reston, {
	post: function(url){ return new Reston('POST', url); },
	get: function(url){ return new Reston('GET', url); },
	put: function(url){ return new Reston('PUT', url); },
	del: function(url){ return new Reston('DELETE', url); },
	file: FileStream
});

if(module)
	module.exports = Reston;
else
	exports = Reston;
