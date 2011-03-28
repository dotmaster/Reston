var url = require('url'),
	FileStream = require('./FileStream'),
	querystring = require('querystring'),
	fs = require('fs'),
    evEmitter = require('events').EventEmitter,
	core = require('./Core'),
	uuid = require('./deps/uuid');

var CRLF = "\r\n";

// given boundary value generate a boundary string for HTTP
function get_boundary(val, end){
	end = (end && '--') || '';
	return '--'+val+end;
}

//given boundary and variable name generate a boundary content string for normal data
function string_data_prefix(boundary, name){
	var ret = get_boundary(boundary)+CRLF+
			'Content-Disposition: form-data; name="'+name+'"'+CRLF+
			CRLF;
	return ret;
}

//given boundary, variable name, file name, and file type generate boundary string for file data
function file_data_prefix(boundary, name, filename, filetype){
	var ret=get_boundary(boundary)+CRLF+
			'Content-Disposition: form-data; name="'+name+'"; filename="'+filename+'"'+CRLF+
			'Content-Type: '+filetype+CRLF+
			CRLF;
	return ret;
}

//Multipart constructor
var MultipartWriter = function(data, opts){
	this.data = data;
	this.conf = core.mixin({}, opts);
	this.multipart_boundary = this.conf.boundary || uuid.uuid();
};

/*
Predict the length of packet given its name and value
according to value generate multipart boundary and then
accumulate lengths
*/

function length_for_part(boundary, name, value){
	var len = 0;
	if(value instanceof FileStream){
		len+=	file_data_prefix(boundary, name, value.basename(), value.filetype()).length+
				value.filesize()+
				CRLF.length;
	}
	else if(value instanceof Array){
		for(var i=0, l=value.length; i<l; i++){
			len+= length_for_part(boundary, name+"[]", value[i]);
		}
	}else if(value instanceof Object){
		for( var i in value ){
			len+= length_for_part(boundary, name+"["+i+"]", value[i]);
		}
	}else if(value !== null){
		len+=	string_data_prefix(boundary, name).length+
			 	value.length+
			 	CRLF.length;
	}
	return len;
}

/**
* Only write the part contents of value on write and call write_complete when done
* write_complete recieves a 1 if a value has been completely written other wise a 0
* write_error is called if anything goes wrong
* writer:	must be httpClient
* name:		must be string
* value:	can be FileStream, Array, Hashmap, or String
* write_complete: callback when write is completed
* write_error: called incase file write fails
*/

function write_part(writer, name, value, boundary, write_complete, write_error){
	if(value instanceof FileStream){
		writer.write(file_data_prefix(boundary, name, value.basename(), value.filetype()), "binary");
		/*value.on("error", function(e){
			write_error && write_error(e);
		});
		value.on("read.data", function(data, offset, len){
			writer.write(data);//removed binary encodeing
		});
		value.on("read.complete", function(){
			writer.write(CRLF, "binary");
			write_complete && write_complete();
		});
		value.read();
		*/
		value.getReadStream(function(reader){
  		writer.on('error', function(e){
  			me.emit('error', e);
  		});
  		reader.on('error', function(e){
  			me.emit('error', e);
  		});
  		writer.on('end', function(){
  		  debugger
		  })
		  reader.on('close', function(){
  		  debugger		    
		  })
  		reader.on('end', function(){
  		  debugger
  			writer.write(CRLF, "binary");
  			write_complete && write_complete();
  		});		 
  		reader.pipe(writer, { end: false })  		 
		})

	}else if(value instanceof Array){
		for(var i=0, l=value.length; i<l; i++) write_part(writer, name+"[]", value[i], boundary, null, write_error);
	}else if(value instanceof Object){
		for(var i in value) write_part(writer, name+"["+i+"]", value[i], boundary, null, write_error);
	}else if(value !== null && value !== undefined){
		writer.write(string_data_prefix(boundary, name), "binary");
		writer.write(value, "binary");
		writer.write(CRLF, "binary");
		write_complete && write_complete();
	}
}

core.mixin(MultipartWriter.prototype, new evEmitter);
core.mixin(MultipartWriter.prototype, {
	headers: function(){
		var len = 0;
		for(var i in this.data){
			len+= length_for_part(this.multipart_boundary, i, this.data[i]);
		}
		len+= get_boundary(this.multipart_boundary, true).length;
		return {
				"Content-Type": "multipart/form-data; boundary="+this.multipart_boundary,
				"Content-Length": len
		}
	},

	writebody: function(writer, cb){
		var p = -1, 
			props = Object.keys(this.data), 
			me = this;
		var write_next = function(){
			if( !props[++p] ){
				writer.write(get_boundary(me.multipart_boundary, true)+CRLF+CRLF, "binary");
				//writer.end()
				me.emit('complete');
				cb();
				return;
			}

			var name = props[p],
				value = me.data[props[p]];

			write_part(writer, name, value, me.multipart_boundary, write_next, function(e){
				me.emit('error', e);
			});
		};

		write_next();
	}
});

(module && (module.exports = MultipartWriter)) || (exports = MultipartWriter);
