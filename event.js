function Event() {
    if (!(this instanceof Event)) {
        return new Event();
    }
    this._callback = {};
}

Event.prototype = {
	constructor:Event,
    on: function(type, handler) {
        if (this._callback[type]) {
            this._callback[type].push(handler);
        } else {
            this._callback[type] = [];
            this._callback[type].push(handler);
        }
    },
    off: function(type, handler) {
        var hasType = this._callback[type]
        if (hasType && this._callback[type].indexOf(handler) !== -1) {
            var index = this._callback[type].indexOf(handler);
            this._callback[type].splice(index, 1);
        } else if (hasType && !handler) {
            this._callback[type] = [];
        }
    },
    trigger: function(type, handler) {
        if (this._callback[type].indexOf(handler) !== -1) {
            handler.apply(this, Array.prototype.slice.call(arguments, 2));
        } else if (this._callback[type]) {
            var self = this;
            this._callback[type].forEach(function(handler, index) {
                handler.apply(self, Array.prototype.slice.call(arguments, 2));
            });
        }
    },
    once: function(type, handler) {
        var self = this;
        this.on(type, wrapper);

        function wrapper() {
            handler.call(self, arguments);
            var index = self._callback[type].indexOf(handler);
            self._callback[type].splice(index, 1);
        }
    }
};
