*Please use the 0.1.1 for production purposes; 0.2.0 has a unstable API yet*
Reston 0.2.0
============

MIT Licensed, (C) Zohaib Sibt-e-Hassan 2011

A Rest client library to make rest interaction easy:

Features
--------

* POST, GET, PUT, DELETE using native JSON objects for data
* Easy to use
* setRequestHeader like XHR object for directly manipulating headers = More power
* Support for multipart request
* Support for file upload
* Simple utility wrappers
* Totally event based (more flexible)

API
---

### Reston.get(url)

Basic method to make a get request object, example:

	var req = Reston.get('http://foo.com/');
	req.on('data', function(chunk){
		console.log(chunk.toString());
	});

	req.send(); //Sends a simple get Request

*URL must be properly formated i.e. must start with http:// (Currently only supports http, https coming soon)*

### Reston.post(url)

Creates a basic post request, e.g. Reston.post('http://place-to-post.com/save/');
*URL must be properly formated i.e. must start with http:// (Currently only supports http, https coming soon)*

### Reston.put(url)

Creates a basic put request, e.g. Reston.put('http://place-to-put.com/update/');
*URL must be properly formated i.e. must start with http:// (Currently only supports http, https coming soon)*

### Reston.del(url)

Creates a basic delete request, e.g. Reston.del('http://localhost/bye-bye/');
*URL must be properly formated i.e. must start with http:// (Currently only supports http, https coming soon)*

### new Reston.file(path_to_file, options) // To be depriciated in 0.3
### new Reston.File(path_to_file, options)

*path_to_file* is absolute path to file.
*options* JSON object with following properties 
	mode(default 666), 
	buffer_length( default is same as file's blksize assigned aka OS block size on disk), 
	read_mode ('binary' by default and recommended)

the created object in turn as data can be passed to sendMultiPart method of created request object to stream it as upload, example:

	var req = Reston.post('http://localhost/upload.php');
	req.on('success', function(){
		console.log('done');
	});
	req.on('error', function(){
		console.log('boooo!');
	});
	var data = {};
	data.my_file_name = new Reston.File('/home/myname/file.zip');
	data.some_other_field = 'Data';
	data.more_data  = 'text data here';
	req.sendMultiPart(data);

### setRequestHeader(name, value)

Sets header to be sent in the request; does what's written on box!
* Word of caution * Just dont try to mess around with headers like Host, Content-Length because it will propogate the set headers without any filters; so remember the rule; with great power comes great responsibility!

### setRequestHeaders(headers)

Sets headers to be sent in the request from given associative pairs of JSON object; does what's written on box!
* Word of caution * Just dont try to mess around with headers like Host, Content-Length because it will propogate the set headers without any filters; so remember the rule; with great power comes great responsibility!

	req.setRequestHeaders({"User-Agent": "Not IE!"});

### send(data)

Send a simple get/post/put/del request automatically determining the query string to be sent incase of post/put or get/delete. The query string variables in URL creation would be. *data* must be JSON object with properties corresponding to values that will be serialized by querystring.stringify and merged with query string parameters in url (when object was created)

*Warning* File upload wont work and may cause the send to mis-behave so use sentMultiPart in case your data contains Reston.file object

### sendMultiPart(data)

Make a multipart submission of POST/PUT request only; data specs remain the same as _send_ but adds acceptance for Reston.file object for file streaming.

### Reston.util.authorize_basic(username, password)

Generates a basic authorization header that in turn can be passed to setRequestHeaders, example
	
	request.setRequestHeaders(Reston.util.authorize_basic("foo", "bar"));

### Examples:

POST request with file:
	var req = Reston.post('http://localhost/upload.php');
	req.on('success', function(){
		console.log('done');
	});
	req.on('error', function(){
		console.log('boooo!');
	});
	var data = {};
	data.my_file_name = new Reston.file('/home/myname/file.zip');
	data.some_other_field = 'Data';
	data.more_data  = 'text data here';
	req.sendMultiPart(data);

POST request without multipart:
	var req = Reston.post('http://localhost/upload.php');
	req.on('success', function(){
		console.log('done');
	});
	req.on('error', function(){
		console.log('boooo!');
	});
	var data = {};
	data.foo = 'Data';
	data.bar = 'text data here';
	req.send(data);

GET request with querystring+data as well:
	
	var req = Reston.get('http://localhost/data.php?a=1&b=2&c=3');
	req.on('success', function(){
		console.log('done');
	});
	req.on('error', function(){
		console.log('boooo!');
	});
	var data = {};
	data.b = 5;
	req.send(data); // Sends a=1, b=5, c=3 (look how it overrides the data for b)


DEL request with querystring+data as well:
	
	var req = Reston.del('http://localhost/data.php?a=1&b=2&c=3');
	req.on('success', function(){
		console.log('done');
	});
	req.on('error', function(){
		console.log('boooo!');
	});
	var data = {};
	data.b = 5;
	req.send(data); // Makes a delete request Sends a=1, b=5, c=3 (look how it overrides the data for b)

### Events

Following events are triggered on Reston object:

* 'start' when response from server starts: function(resp, req){} //where response is clientResponse object and req is ClientRequest object
* 'data' triggered when response data: function(chunk){} //chunk the buffer of recieved chunk
* 'complete' triggered when respone is completed
* 'success' if the response code is between 200 to 299
* 'error' if response code is other than success codes
