var fs = require('fs'),
	path = require('path'),
	core = require('./Core'),
    evEmitter = require('events').EventEmitter;

var FileStream = function(path, opts){
	this.filepath = path;
	this.conf = core.mixin(core.mixin({}, opts), {
		mode: 666,
		buffer_length: null,
		read_mode: 'binary'
	});
};

core.mixin(FileStream.prototype, new evEmitter);
core.mixin(FileStream.prototype, {
	read: function(){
		var me = this;
		fs.stat(me.filepath, function(err, stats){
			if(err){
				return me.emit('error', err);
			}

			fs.open(me.filepath, 'r', me.access, function(err, fd){
				if(err){
					return me.emit('error', err);
				}

				var read_len = me.conf.buffer_length || stats.blksize,
					offset = 0;
				me.emit('read.start', stats.size);

				//Actual do read function
				var do_read = function(){
					fs.read(fd, read_len, offset, me.conf.read_mode, function(err, dat){
						if(err){
							return me.emit('error', err);
						}

						me.emit('read.data', dat, offset, read_len);
						me.emit("progress", "read", dat, offset, read_len);
						offset += read_len;

						//less than blksize bytes left
						if( read_len > stats.size - offset ){
							read_len = stats.size - offset; 
						}

						if( offset >= stats.size ){
							me.emit('read.complete');
							fs.closeSync(fd);
							//Close and go home
							return;
						}

						//Continue reading more
						do_read();
					});
				};
				//Start reading
				do_read();
			});
		});
	},

	basename: function(){
		return path.basename(this.filepath);
	},

	filesize: function(){
		var st = fs.statSync(this.filepath);
		if( !st ) return null;
		return st.size;
	},

	filetype: function(){
		return 'application/octet-stream';
	}

});

module.exports = FileStream;
