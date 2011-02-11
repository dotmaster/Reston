var mixin = function(obj, target){
	target = target || {};
    for(var p in target){
		obj[p] = target[p];
    }
    return obj;
};

var arrize = function(ary, from){
    return Array.prototype.slice.call(ary, from || 0);
};

var core = {
    'mixin': mixin,
    'arrize': arrize
};

if( module ){
    module.exports = core;
}else if(exports){
    exports = core;
}
