var canvas = document.getElementById('myCanvas'),
    ctx = getCanvasContext(canvas),
    buttonRect = document.getElementById('block'),
    buttonCircle = document.getElementById('circle'),
    buttonReset = document.getElementById('reset'),
    graphType = '',
    graphCollections = [];
addEvent(canvas, 'click', draw);
addEvent(buttonRect, 'click', getGraphType);
addEvent(buttonCircle, 'click', getGraphType);
addEvent(buttonReset, 'click', getGraphType);

function addEvent(elm, evType, fn, useCapture) {
    if (elm.addEventListener) {
        elm.addEventListener(evType, fn, useCapture);
        return true;
    } else if (elm.attachEvent) {
        var r = elm.attachEvent('on' + evType, fn);
        return r;
    } else {
        elm['on' + evType] = fn;
    }
}

function getCanvasContext(canvas) {
    if (canvas.getContext) {
        var ctx = canvas.getContext('2d');
    }
    return ctx;
}

function getGraphType(evt) {
    switch (evt.target.id) {
        case 'block':
            graphType = 'rect';
            break;
        case 'circle':
            graphType = 'circle';
            break;
        default:
            graphType = '';
            break;
    }
}

function draw(evt) {
    if (!graphType) {
        showMessage(evt);
        return;
    }
    var data = {}
    data.x = evt.offsetX;
    data.y = evt.offsetY;
    // console.log(data);
    if (graphType === 'rect') {
        var rect = new Rect();
        rect.draw(data);
        graphCollections.push(rect);
    } else {
        var circle = new Circle();
        circle.draw(data);
        graphCollections.push(circle);
    }
}

function showMessage(evt){
    var data={};
    data.x=evt.offsetX;
    data.y=evt.offsetY;
    graphCollections.forEach(function(gragh,key){
        
    });
}

//画图类
function Graph(type) {
    this.type = type || 'rect';
    this.vertex = {};
    this.ctx = ctx;
}
Graph.prototype.draw = function(data) {
    switch (this.type) {
        case 'rect':
            this.vertex.x = parseInt(data.x) - 50;
            this.vertex.y = parseInt(data.y) - 50;
            this.ctx.fillStyle = "#000";
            this.ctx.fillRect(this.vertex.x, this.vertex.y, 100, 100)
            break;
        case 'circle':
            this.vertex.x = parseInt(data.x);
            this.vertex.y = parseInt(data.y);
            this.ctx.fillStyle = "#000";
            this.ctx.arc(this.vertex.x, this.vertex.y, 50, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.closePath();
            break;
        default:
            break;
    }
};

function Rect() {
    Graph.call(this, 'rect');
}
Rect.prototype = Object.create(Graph.prototype);
Rect.prototype.constructor = Rect;

function Circle() {
    Graph.call(this, 'circle');
}
Circle.prototype = Object.create(Graph.prototype);
Circle.prototype.constructor = Circle;
