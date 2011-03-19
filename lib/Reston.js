var FileStream = require('./FileStream'),
	core = require('./Core'),
	MultipartWriter = require('./MultipartWriter'),
	Accum = require('./Response'),
    evEmitter = require('events').EventEmitter;
	http = require('http'),
	Url = require('url'),
	querystring = require('querystring');

var https = null;
//Include the https support
if( core.node_ver.minor >= 4 ){
	https = require('https');
}

var protocol_libs = {
	'http:': http,
	'https:': https
};

var create_client = function(protocol, method, hostname, port, pathname, query_string, headers){
	//Check for protocol availability ;)
	if(!protocol_libs[protocol]){
		throw "Protocol "+protocol+" not supported in your node version";
	}

	protocol = protocol_libs[protocol];
  headers['Transfer-Encoding'] = 'chunked'
	if(false && core.node_ver.minor >= 4 && protocol.request){
	  
		return protocol.request({
				'host': hostname, 
				'port': (port || 80), 
				'method': method, 
				'headers': (headers || {}), 
				'path': (pathname || '/') + (query_string || '')
		});
	}
	//Older versions of node soon to be depreciated
	var cl = protocol.createClient( port || 80, hostname);
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
	//Do whats written on tin :D
	setRequestHeader: function(name, value){
		this.headers[name] = value;
	},

	//Duhh I know you could have done it but still
	setRequestHeaders: function(headers){
		core.mixin(this.headers, headers);
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
		var req = create_client(this.urlinfo.protocol, this.method, this.urlinfo.hostname, this.urlinfo.port, this.urlinfo.pathname, query_string, this.headers),
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
		//req.end();
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
		this.setRequestHeaders(mw.headers()) //mixin multipart headers, computes length
		var req = create_client(this.urlinfo.protocol, this.method, this.urlinfo.hostname, this.urlinfo.port, this.urlinfo.pathname, null, this.headers),
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
		debugger
		//req.end();
	}
});

core.mixin(Reston, {
	post: function(url){ return new Reston('POST', url); },
	get: function(url){ return new Reston('GET', url); },
	put: function(url){ return new Reston('PUT', url); },
	del: function(url){ return new Reston('DELETE', url); },
	//The utility crap will go here
	util: {
		//Yep the HTTP authentication google it if confused :D
		authorize_basic: function(user, pass){
			return {'Authorization': 'Basic '+(new Buffer(user+":"+pass)).toString("base64") }; 
		}
	},
	accumulate: function(reston, encoding){
		return new Accum(reston, encoding);
	},
	Accumulator: Accum,
	File: FileStream,

	//Warning: will be depriciated to File soon
	file: FileStream
});

module.exports = Reston;
