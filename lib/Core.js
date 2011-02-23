//Says for itself
var mixin = function(obj, target){
	target = target || {};
    for(var p in target){
		obj[p] = target[p];
    }
    return obj;
};

//Convert arguments to array
var arrize = function(ary, from){
    return Array.prototype.slice.call(ary, from || 0);
};

//Bind  proxy objects to function
function glue(f, obj){
	var oargs = arrize(arguments, 2);
	return function(){
		var iargs = arrize(arguments);
		return f.apply && f.apply(obj, oargs.concat(iargs));
	}
}

var node_ver = null;
(function(){
	if( node_ver ) return node_ver;
	var ver = process.version,
		rex = /^v(\d+)\.(\d+)\.(\d+)/i;
	
	var matches = ver.match(rex);
	if( !matches ){
		throw "Unable to determine node version";
	}

	node_ver = { major: (~~matches[1]), minor: (~~matches[2]), release: (~~matches[3]) };
	return node_ver;
})();

var core = {
    'mixin': mixin,
    'arrize': arrize,
	'glue': glue,
	'node_ver': node_ver 
};

module.exports = core;
