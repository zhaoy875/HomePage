/**
 * MarkTools - jQuery plugin
 * @author Ray Taylor Lin
 * //TODO 这个插件应该是一个单例模式，一个页面均允许存在一个插件实例
 */

jQuery.markTools = jQuery.markTools || {};

(function($) {
    var MT = $.markTools,
        util = MT.util,
        ToolButton = MT.ToolButton,
        ToolButtonContainer = MT.ToolButtonContainer,
        DrawingCanvas = MT.DrawingCanvas;

    /**
     * 给所有jquery对象新增一个查询是否存在的方法
     * @return {Boolean} 查找的jquery对象是否存在
     */
    $.fn.exists = function() {
        return this.length > 0;
    };

    $.fn.removeClassPrefix = function(prefix) {
        this.each(function(i, it) {
            var classes = it.className.split(" ").map(function(item) {
                return item.indexOf(prefix) === 0 ? "" : item;
            });
            it.className = classes.join(" ");
        });
        return this;
    }

})(jQuery);
/**
 * options.js (jquery.marktools)
 * @author Ray Taylor Lin
 */

(function($) {
    var MT = $.markTools;

    function setLineDash(context) {
        if (!context.setLineDash) {
            context.setLineDash = function() {};
        }
        context.setLineDash(MT.options.lineDash);
    }

    var Const = {
        LINE_WIDTH: 2,
        MARK_OPACITY: 0.1,
        LINE_DASH: [8, 4]
    };

    var options = {
        showInfo: true,
        showPin: true,
        showRegion: true,
        showEllipse: true,
        showLine: true,
        showMarkBox: true,
        hoverMarkEffect: false,
        toolButtonContainerAlign: 'center',

        color: '#FFD125',
        penWidth: 2,
        canvasMargin: 10,
        lineDash: [8, 4],

        //TODO: 考虑引入一个marktools-template的div专门存放模板
        markDialogClass: 'mark-dialog',
        markBoxClass: 'mark-box',
        onSaveMark: null,
        onCancelMark: null,
        onClickMark: null,
        onMarkDialogShow: null,
        validateHandler: null,
        onToolButtonActivated: function() {},
        onToolButtonInactivated: function() {},

        onDrawFuncMap: {
            pin: function(context, selection) {
                var radius = 3;
                //画内圆点
                context.beginPath();
                context.fillStyle = context.strokeStyle;
                context.arc(selection.x2, selection.y2, radius, 0, Math.PI * 2, true);
                context.fill();
                context.closePath();

                //画外圆透明部分
                context.beginPath();
                context.save();
                context.globalAlpha = Const.MARK_OPACITY;
                context.arc(selection.x2, selection.y2, radius * 8, 0, Math.PI * 2, true);
                context.fill();
                context.restore();

                //画外圆虚线框
                //setLineDash(context);
                if (context.setLineDash) {
                    context.setLineDash(Const.LINE_DASH);
                }
                context.lineWidth = Const.LINE_WIDTH;
                context.stroke();
                context.closePath();
            },
            rect: function(context, selection) {
                setLineDash(context);
                context.strokeRect(selection.x1, selection.y1,
                    selection.x2 - selection.x1, selection.y2 - selection.y1);
                context.save();
                context.globalAlpha = Const.MARK_OPACITY;
                context.fillRect(selection.x1, selection.y1,
                    selection.x2 - selection.x1, selection.y2 - selection.y1);
                context.restore();
            },
            ellipse: function(context, selection) {
                //使用三次贝塞尔曲线模拟椭圆
                function bezierEllipse(context, x, y, a, b) {
                    //关键是bezierCurveTo中两个控制点的设置
                    //0.5和0.6是两个关键系数（在本函数中为试验而得）
                    var ox = 0.5 * a,
                        oy = 0.6 * b;
                    context.save();
                    context.translate(x, y);
                    //从椭圆纵轴下端开始逆时针方向绘制
                    context.beginPath();
                    context.moveTo(0, b);
                    context.bezierCurveTo(ox, b, a, oy, a, 0);
                    context.bezierCurveTo(a, -oy, ox, -b, 0, -b);
                    context.bezierCurveTo(-ox, -b, -a, -oy, -a, 0);
                    context.bezierCurveTo(-a, oy, -ox, b, 0, b);
                    context.closePath();
                    //绘制外框
                    setLineDash(context);
                    context.stroke();
                    //填上透明色
                    context.globalAlpha = Const.MARK_OPACITY;
                    context.fill();
                    context.restore();
                }

                var a = (selection.x2 - selection.x1) / 2,
                    b = (selection.y2 - selection.y1) / 2,
                    x = selection.x1 + a,
                    y = selection.y1 + b;
                bezierEllipse(context, x, y, a, b);
            },
            line: function(context, selection) {
                context.beginPath();
                context.moveTo(selection.x1, selection.y1);
                context.lineTo(selection.x2, selection.y2);
                context.closePath();
                context.stroke();
            },
            arrow: function(context, selection) {
                var beginPoint = {},
                    stopPoint = {},
                    polygonVertex = [],
                    ARROW = {
                        edgeLen: 50,
                        angle: 25
                    };
                beginPoint.x = selection.x1;
                beginPoint.y = selection.y1;
                stopPoint.x = selection.x2;
                stopPoint.y = selection.y2;
                //封装的画箭头对象
                var PlotArrow = {
                    angle: "",
                    //自定义参数
                    paraDef: function(edgeLen, angle) {
                        ARROW.edgeLen = edgeLen;
                        ARROW.angle = angle;
                    },
                    //在ARROW中定义的edgeLen以及angle参数
                    //根据line长短动态匹配箭头：
                    arrowMatch: function() {
                        var x = stopPoint.x - beginPoint.x,
                            y = stopPoint.y - beginPoint.y,
                            length = Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));
                        if (length < 250) {
                            ARROW.edgeLen = ARROW.edgeLen / 2;
                            ARROW.angle = ARROW.angle / 2;
                        } else if (length < 500) {
                            ARROW.edgeLen = ARROW.edgeLen * length / 500;
                            ARROW.angle = ARROW.angle * length / 500;
                        }
                    },

                    //getAngle 返回以起点与X轴之间的夹角角度值
                    getAngle: function(beginPoint, stopPoint) {
                        PlotArrow.angle = Math.atan2(stopPoint.y - beginPoint.y, stopPoint.x - beginPoint.x) / Math.PI * 180;
                        PlotArrow.paraDef(50, 25);
                        PlotArrow.arrowMatch();
                    },

                    ///获得箭头底边两个点坐标
                    getArrowCoord: function(beginPoint, stopPoint) {
                        polygonVertex[0] = beginPoint.x;
                        polygonVertex[1] = beginPoint.y;
                        polygonVertex[6] = stopPoint.x;
                        polygonVertex[7] = stopPoint.y;
                        PlotArrow.getAngle(beginPoint, stopPoint);
                        polygonVertex[8] = stopPoint.x - ARROW.edgeLen * Math.cos(Math.PI / 180 * (PlotArrow.angle + ARROW.angle));
                        polygonVertex[9] = stopPoint.y - ARROW.edgeLen * Math.sin(Math.PI / 180 * (PlotArrow.angle + ARROW.angle));
                        polygonVertex[4] = stopPoint.x - ARROW.edgeLen * Math.cos(Math.PI / 180 * (PlotArrow.angle - ARROW.angle));
                        polygonVertex[5] = stopPoint.y - ARROW.edgeLen * Math.sin(Math.PI / 180 * (PlotArrow.angle - ARROW.angle));
                    },

                    //获取另两个底边侧面点坐标
                    getSideCoord: function() {
                        var midpoint = {};
                        midpoint.x = (polygonVertex[4] + polygonVertex[8]) / 2;
                        midpoint.y = (polygonVertex[5] + polygonVertex[9]) / 2;
                        polygonVertex[2] = (polygonVertex[4] + midpoint.x) / 2;
                        polygonVertex[3] = (polygonVertex[5] + midpoint.y) / 2;
                        polygonVertex[10] = (polygonVertex[8] + midpoint.x) / 2;
                        polygonVertex[11] = (polygonVertex[9] + midpoint.y) / 2;
                    },

                    //画箭头
                    drawArrow: function(context) {
                        context.beginPath();
                        context.moveTo(polygonVertex[0], polygonVertex[1]);
                        context.lineTo(polygonVertex[2], polygonVertex[3]);
                        context.lineTo(polygonVertex[4], polygonVertex[5]);
                        context.lineTo(polygonVertex[6], polygonVertex[7]);
                        context.lineTo(polygonVertex[8], polygonVertex[9]);
                        context.lineTo(polygonVertex[10], polygonVertex[11]);
                        context.closePath();
                        context.fill();
                    }
                };

                PlotArrow.getArrowCoord(beginPoint, stopPoint);
                PlotArrow.getSideCoord();
                PlotArrow.drawArrow(context);
            }
        }
    };

    MT.options = options;
    MT.drawConstant = Const;
})(jQuery);

/**
 * util.js (jquery.marktools)
 * @author Ray Taylor Lin
 */

(function($) {
    var MT = $.markTools;

    var util = {
        divWithClass: function(className, content) {
            var key,
                newDiv = $('<div></div>');
            newDiv.addClass(className);
            if (typeof content !== undefined) {
                newDiv = newDiv.html(content);
            }
            return newDiv;
        },
        aWithClass: function(className, content) {
            var key,
                newA = $('<a href="javascript:void(0);"></a>');
            newA.addClass(className);
            if (typeof content !== undefined) {
                newA = newA.html(content);
            }
            return newA;
        },
        setOffset: function(obj, offset, isRelativeToolbar) {
            if (offset) {
                // offset.left = offset.left.replace('px', '');
                // offset.top = offset.top.replace('px', '');
                obj.css({
                    left: offset.left + (isRelativeToolbar ? 80 : 0),
                    top: offset.top
                });
            }
        },
        getOffset: function(obj) {
            return {
                left: parseInt(obj.css('left').replace('px', '')),
                top: parseInt(obj.css('top').replace('px', ''))
            };
        },

        /**
         * 获取鼠标相对于某个容器的偏移量
         * @param  {jQuery Object}} obj 计算偏移量的容器
         * @param  {Event} e 鼠标事件
         * @return {Object} 鼠标位置偏移量
         */
        getMouseOffset: function(obj, e) {
            var x, y;
            x = e.pageX - obj.offset().left;
            y = e.pageY - obj.offset().top;
            return {
                left: x,
                top: y
            };
        }
    };

    MT.util = util;
})(jQuery);

/**
 * ToolButton.js (jquery.marktools)
 * @author Ray Taylor Lin
 */

(function($) {
    var MT = $.markTools,
        util = MT.util;

    var ToolButton = (function() {
        var cursorColorMap = {
            '#FFD125': 'yellow',
            '#3FC835': 'green',
            '#FF4C00': 'red',
            '#111111': 'black',
            '#00B3F0': 'blue',
            '#FF296A': 'pink',
            '#FFFFFF': 'white'
        };

        var ToolButton = function(attr, $callObject) {
            var _this = this;
            attr = attr || {};

            //相关属性
            this.attr = attr;
            //按钮类型
            this.type = attr.type;
            //是否被按下
            this.isPressed = false;
            //容纳按钮的容器
            this.container = null;
            //激活时的鼠标指针
            this.activeCursor = null;
            //样式选择器
            this.stylePicker = null;

            //调用插件的jquery对象
            this.$callObject = $callObject;
            //按钮对应的jquery对象
            // this.$dom = util.divWithClass(attr.classRest);
            // this.$dom.addClass('btn-marktools');
            this.$dom = util.aWithClass('btn-marktools');
            this.$dom.append(util.divWithClass('btn-marktools-content')
                .addClass(attr.classRest));
            this.$dom.on('click touchend', function() {
                _this.toggle();
            });

            //创建光标cursor的div并隐藏
            this.$cursor = util.divWithClass(attr.classCursor).addClass('marktools-cursor').hide();
            $('body').append(this.$cursor);

            //按下按钮触发的方法
            // this.onPress = attr.onPress;
        };

        ToolButton.prototype.HEIGHT = 80;

        /**
         * 切换按钮状态
         */
        ToolButton.prototype.toggle = function() {
            this.isPressed = !this.isPressed;
            this.isPressed ? this.press() : this.popup();
        };

        /**
         * 按下按钮
         */
        ToolButton.prototype.press = function() {
            var index = this.container.getIndexByType(this.type);
            this.isPressed = true;
            this.$dom.addClass('btn-marktools-active');

            //设置按钮组的状态
            this.container.changeType(this.type);
            this.$dom.after(util.divWithClass('btn-marktools-active-border'));
            this.container.$dom.find('.btn-marktools-active-border').hide().css({
                top: index * this.HEIGHT
            }).show();
            //HACK: 创建一个遮罩覆盖选择颜色按钮，禁用
            // this.$dom.after(util.divWithClass('style-picker-mask'));

            bindCursor(this.$cursor, this.$callObject, this.type !== 'pin');

            //判断当前是否有画布存在，不允许存在多个画布
            if (!this.$callObject.find('.draw-canvas').exists()) {
                //清空缓存
                $.markTools.cache.userStartDraw = false;
                //触发按钮按下的事件
                this.onPress();
                $.markTools.options.onToolButtonActivated();
            } else {
                //若按下的按钮是颜色选取，也触发按钮按下事件
                if (this.type === 'color-picker') {
                    this.onPress();
                } else {
                    //画布存在则直接弹起按钮
                    this.popup();
                }
            }
        };

        /**
         * 弹起按钮
         */
        ToolButton.prototype.popup = function() {
            this.isPressed = false;
            this.$dom.removeClass('btn-marktools-active');
            this.container.$dom.find('.btn-marktools-active-border').remove();
            // this.container.$dom.find('.style-picker-mask').remove();
            // this.container.$dom.find('.btn-marktools-active-border').hide();

            //隐藏光标
            unbindCursor(this.$cursor, this.$callObject);

            //若用户没有开始绘画，则在切换按钮的时候删除所有现存canvas
            if (!$.markTools.cache.userStartDraw) {
                $('.draw-canvas').remove();
            }
            $.markTools.options.onToolButtonInactivated();
            this.container.activeType = 'none';
        }

        //显示光标并绑定到鼠标移动事件
        function bindCursor($cursor, $callObject, hasCrosshair) {
            var colorName = $.markTools.cache.colorName,
                $crosshair = $('.cursor-crosshair');
            $cursor.show().attr('color', colorName)
                .addClass('cursor-color-' + colorName);
            if (hasCrosshair && !$crosshair.length) {
                $crosshair = util.divWithClass('cursor-crosshair');
                $crosshair.append(util.divWithClass('cursor-crosshair-vertical'));
                $crosshair.append(util.divWithClass('cursor-crosshair-horizontal'));
                $cursor.after($crosshair);
            }

            $callObject.on('mousemove', function(e) {
                $cursor.css({
                    left: e.pageX,
                    top: e.pageY
                });
                $crosshair.show().css({
                    left: e.pageX,
                    top: e.pageY
                });
            });
        }

        //隐藏光标并解绑鼠标移动事件
        function unbindCursor($cursor, $callObject) {
            $cursor.hide().removeClass('cursor-color-' + $cursor.attr('color'));
            $('.cursor-crosshair').remove();
            $callObject.off('mousemove');
        }

        return ToolButton;
    })();

    MT.ToolButton = ToolButton;
})(jQuery);
/**
 * StylePicker.js (jquery.marktools)
 * @author Ray Taylor Lin
 */

(function($) {
    var MT = $.markTools,
        util = MT.util;

    var StylePicker = (function() {
        var StylePicker = function(callObject) {
            //颜色
            this.color = '#000000';
            //笔宽
            this.width = 1;
            this.$callObject = callObject;
            this.colorList = ['yellow', 'green', 'red', 'black', 'blue', 'pink', 'white'];
            this.$dom = $(
                '<div class="style-picker">' +
                '<div class="style-picker-container">' +
                '</div>' +
                '</div>');
            this.addColorBlock();
        };

        StylePicker.prototype.HEIGHT = 370;

        StylePicker.prototype.addColorBlock = function($container) {
            var i, $block;
            for (i = 0; i < this.colorList.length; i++) {
                $block = util.divWithClass('color-block-bg')
                    .addClass('color-block-transparent-' + this.colorList[i]);
                $block.append(util.aWithClass('color-block')
                    .addClass('color-block-' + this.colorList[i])
                    .attr('color-name', this.colorList[i]));
                this.$dom.find('.style-picker-container').append($block);
            }
        };
        // StylePicker.prototype.bind = function(onDraw, onFinishDraw) {
        //     var _this = this;
        //     this.$dom.one('click', '.style-picker-button', function() {
        //         //获取颜色值和笔宽值，并隐藏面板
        //         var $dom = $(this).parent(),
        //             drawingCanvas = new DrawingCanvas(_this.$callObject, onDraw, onFinishDraw);
        //         drawingCanvas.color = '#' + $dom.find('input[name=color]').val();
        //         drawingCanvas.penWidth = parseInt($dom.find('input[name=width]').val());
        //         $dom.hide();

        //         _this.$callObject.append(drawingCanvas.$dom);
        //     });
        // }

        return StylePicker;
    })();

    MT.StylePicker = StylePicker;
})(jQuery);

/**
 * StyleToolButton.js (jquery.marktools)
 * @author Ray Taylor Lin
 */

(function($) {
    var MT = $.markTools,
        util = MT.util,
        options = MT.options,
        ToolButton = MT.ToolButton,
        StylePicker = MT.StylePicker;

    var StyleToolButton = (function() {
        function toggleAnimation(stylePicker, isOpen) {
            var $stylePicker = stylePicker.$dom,
                height = stylePicker.HEIGHT,
                width = stylePicker.HEIGHT,
                duration = 500;

            if (isOpen) {
                //打开取色器
                // if(options.toolButtonContainerAlign === 'center') {
                $stylePicker.show().height(0).animate({
                    height: '+=' + height,
                    top: '-=' + height
                }, duration);
                $stylePicker.prevAll('.btn-marktools, .btn-marktools-active-border')
                    .animate({
                        top: '-=' + height
                    }, duration);
                // } else if(options.toolButtonContainerAlign === 'top') {
                //     $stylePicker.show().width(0).animate({
                //         width: '+=' + width
                //     }, duration);
                // }
            } else {
                //关闭取色器
                // if(options.toolButtonContainerAlign === 'center') {
                $stylePicker.height(height).animate({
                    height: '-=' + height,
                    top: '+=' + height
                }, duration, function() {
                    $(this).hide();
                });
                $stylePicker.prevAll('.btn-marktools, .btn-marktools-active-border')
                    .animate({
                        top: '+=' + height
                    }, duration);
                // } else if(options.toolButtonContainerAlign === 'top') {
                //     $stylePicker.width(width).animate({
                //         width: '-=' + width
                //         // left: '-=' + 80
                //     }, duration, function() {
                //         $(this).hide();
                //     });
                // }
            }
        }

        var StyleToolButton = function(attr, $callObject) {
            ToolButton.apply(this, arguments);

            this.$dom.find('.btn-marktools-color')
                .append(util.divWithClass('btn-marktools-color-triangle1'));
            this.$dom.find('.btn-marktools-color')
                .append(util.divWithClass('btn-marktools-color-triangle2'));
            this.stylePicker = new StylePicker();
            this.stylePicker.$dom.css('top', '350px');

            var _this = this;
            //颜色选取器的色块点击事件
            this.stylePicker.$dom.on('click touchend', '.color-block', function() {
                var color = $(this).css('background-color'),
                    colorName;
                $.markTools.cache.color = color;
                $.markTools.cache.colorName = colorName = $(this).attr('color-name');
                // if($('.btn-marktools-active').exists()) {
                //     $('.btn-marktools-active').click().click();
                // }
                $.each($('.marktools-cursor'), function(i, cursor) {
                    $(cursor).removeClassPrefix('cursor-color');
                    $(cursor).addClass('cursor-color-' + colorName);
                });
                //改变显示色块的颜色
                $('.btn-marktools-color').css('background-color', color);
                $('.btn-marktools-color-triangle2').css('border-right-color', color);
                $('.btn-marktools-color-triangle2').css('border-bottom-color', color);
                // _this.$callObject.parent().trigger('STYLE_PICKER_COLOR_CHANGE', color);
                $('.draw-canvas').trigger('STYLE_PICKER_COLOR_CHANGE', color);
                _this.popup();
            });

            // if(options.toolButtonContainerAlign === 'top') {
            //     this.stylePicker.$dom.css({
            //         'left': '80px',
            //         'height': '80px'
            //     }).addClass('style-picker-horizontal');
            //     this.stylePicker.$dom.find('.style-picker-container')
            //         .addClass('style-picker-container-horizontal');
            // }
        };

        StyleToolButton.prototype = new MT.ToolButton();

        StyleToolButton.prototype.press = function() {
            var $stylePicker = this.stylePicker.$dom;

            this.isPressed = true;
            this.$dom.children().addClass('btn-marktools-color-active');

            if (!this.$dom.prev('.style-picker').length) {
                this.$dom.before(this.stylePicker.$dom);
            }
            toggleAnimation(this.stylePicker, true);
        };

        StyleToolButton.prototype.popup = function() {
            this.isPressed = false;
            this.$dom.children().removeClass('btn-marktools-color-active');
            toggleAnimation(this.stylePicker, false);
        };

        /**
         * 添加（绑定）样式选取器
         * @param {StylePicker} stylePicker 样式选取器对象
         */
        StyleToolButton.prototype.addStylePicker = function(stylePicker) {
            var _this = this;
            //若没有绑定则绑定
            if (this.stylePicker === null) {
                this.stylePicker = stylePicker;
                // btnColorPicker.$dom.append('<div class="color-show-block"></div>');

                //添加在按钮之前
                this.$dom.before(stylePicker.$dom);

                //颜色选取器的色块点击事件
                $('.color-block').on('click touchend', function() {
                    var color = $(this).css('background-color');
                    $.markTools.cache.color = color;
                    //改变显示色块的颜色
                    $('.color-show-block').css('background-color', color);
                    // _this.$callObject.parent().trigger('STYLE_PICKER_COLOR_CHANGE', color);
                    $('.draw-canvas').trigger('STYLE_PICKER_COLOR_CHANGE', color);
                    _this.popup();
                });
            }
        };

        return StyleToolButton;
    })();

    MT.StyleToolButton = StyleToolButton;
})(jQuery);

/**
 * ToolButtonContainer.js (jquery.marktools)
 * @author Ray Taylor Lin
 */

(function($) {
    var MT = $.markTools,
        options = MT.options,
        util = MT.util,
        ToolButton = MT.ToolButton;

    var ToolButtonContainer = (function() {
        var ToolButtonContainer = function($callObject) {
            this.activeType = 'none';
            this.buttonMap = {};
            this.buttonList = [];
            this.$callObject = $callObject;
            //初始化标记工具栏容器
            this.$wrapper = util.divWithClass('marktools-wrapper');
            this.$dom = util.divWithClass('marktools-container');

            this.initPosition();
            //在调用插件的容器里面添加
            //（层级关系：$callObject->floater, $wrapper->$dom）
            this.$callObject.append(this.$wrapper);
            this.$wrapper.append(this.$dom);

            if (options.toolButtonContainerAlign === 'top') {

            } else if (options.toolButtonContainerAlign === 'center') {
                this.$dom.before(util.divWithClass('marktools-container-floater'));
            }

            //添加mark开关
            this.$dom.after('<div class="mark-switch open">' +
                '<div class="switch-button">' +
                '<div class="switch-button-inner"></div>' +
                '</div>' +
                '<div class="font-hel-xs switch-label">' +
                '<div class="switch-light"></div>' +
                '<span>mark</span>' +
                '</div>' +
                '</div>');
        };

        /**
         * 初始化工具栏的位置
         */
        ToolButtonContainer.prototype.initPosition = function() {
            //调整位置
            $callObject.css({
                'position': 'relative'
            });
            var _this = this;
            var adjust = function() {
                var offset = $callObject.offset();

                // _this.$dom.css({
                //     left: offset.left,
                //     top: offset.top + 40
                // });
            };
            adjust();
            $(window).resize(adjust);
        };

        /**
         * 添加按钮
         * @param {ToolButton} button 要添加的按钮
         */
        ToolButtonContainer.prototype.add = function(button) {
            var $conatiner = this.$dom,
                $button = button.$dom;

            if (!(button instanceof ToolButton)) {
                console.error('Button type error');
                return;
            }
            this.buttonMap[button.type] = button;
            this.buttonList.push(button.type);
            button.container = this;
            //添加jquery对象
            $button.css('top',
                $conatiner.children('.btn-marktools').length * button.HEIGHT);
            this.$dom.append(button.$dom);
        };

        /**
         * 改变按钮组中激活的按钮
         * @param  {String} type 按钮名称
         */
        ToolButtonContainer.prototype.changeType = function(type) {
            var changeIndex = 0;
            if (this.activeType !== type && this.activeType !== 'none') {
                this.buttonMap[this.activeType].popup();
            }
            //激活框移动动画
            // changeIndex = this.buttonList.indexOf(type) -
            //     this.buttonList.indexOf(this.activeType);
            // if (this.activeType === 'none' || changeIndex === 0) {
            //     this.$dom.find('.btn-marktools-active-border').css({
            //         top: this.buttonList.indexOf(type) * 80
            //     }).fadeToggle();
            // } else {
            //     this.$dom.find('.btn-marktools-active-border').animate({
            //         top: '+=' + changeIndex * 80
            //     }, 1000);
            // }

            this.activeType = type;
        };

        ToolButtonContainer.prototype.getIndexByType = function(type) {
            return this.buttonList.indexOf(type);
        }

        ToolButtonContainer.prototype.popupAll = function() {
            this.buttonMap[this.activeType].popup();
            this.activeType = 'none';
        };

        return ToolButtonContainer;
    })();

    MT.ToolButtonContainer = ToolButtonContainer;
})(jQuery);

/**
 * DrawingCanvas.js (jquery.marktools)
 * @author Ray Taylor Lin
 */

(function($) {
    var MT = $.markTools,
        util = MT.util;

    var DrawingCanvas = (function() {
        var DrawingCanvas = function($callObject, onDraw, onFinishDraw, type) {
            var canvas;
            //canvas宽高
            this.width = $callObject.width();
            this.height = $callObject.height();
            //canvas边距
            this.margin = 10;
            //是否开始在canvas上拖拽的标记
            this.startMouseDown = false;
            this.startMouseMove = false;

            this.$callObject = $callObject;
            this.onDraw = onDraw;
            this.onFinishDraw = onFinishDraw;
            this.type = type;

            //初始化完成后，将DOM添加进调用主体中
            this.$callObject.append(this.$dom);

            //初始化canvas并添加到调用插件的主容器
            this.$dom = canvas = $('<canvas></canvas>')
                .attr('class', 'draw-canvas')
                .attr('width', this.width - this.OFFSET_X)
                .attr('height', this.height)
                .css('left', this.OFFSET_X);
            //给非pin画布添加十字鼠标光标
            // this.$dom.css('cursor', this.type === 'pin' ? 'default' : 'none');
            this.$dom.css('cursor', 'none');

            $callObject.append(this.$dom);
            this.context = canvas.get(0).getContext("2d");

            this.selection = {
                x1: 0,
                y1: 0,
                x2: 0,
                y2: 0
            }
            var _this = this;

            this.clear();
            this.refreshStyle();
            //绑定canvas的鼠标事件
            canvas.on('mousedown touchstart',
                function(e) {
                    if (!_this.startMouseDown) {
                        //标记鼠标开始按下
                        _this.startMouseDown = true;
                        $.markTools.cache.userStartDraw = true;
                        if (!/touch/.test(e.type)) {
                            _this.selection.x1 = e.offsetX || (e.clientX - $(e.target).offset().left);
                            _this.selection.y1 = e.offsetY || (e.clientY - $(e.target).offset().top);
                        } else {
                            _this.selection.x1 = e.originalEvent.touches[0].clientX - $(e.target).offset().left;
                            _this.selection.y1 = e.originalEvent.touches[0].clientY - $(e.target).offset().top;
                        }
                    }
                    e.preventDefault();
                }).on('mousemove touchmove',
                function(e) {
                    if (_this.startMouseDown) {
                        //标记鼠标开始移动
                        _this.startMouseMove = true;
                        if (!/touch/.test(e.type)) {
                            _this.selection.x2 = e.offsetX || (e.clientX - $(e.target).offset().left);
                            _this.selection.y2 = e.offsetY || (e.clientY - $(e.target).offset().top);
                        } else {
                            _this.selection.x2 = e.originalEvent.touches[0].clientX - $(e.target).offset().left;
                            _this.selection.y2 = e.originalEvent.touches[0].clientY - $(e.target).offset().top;
                        }
                        _this.redraw();
                    }
                    e.preventDefault();
                }).on('mouseup touchend',
                function(e) {
                    if (_this.startMouseDown) {
                        if (!_this.startMouseMove) {
                            _this.selection.x2 = _this.selection.x1;
                            _this.selection.y2 = _this.selection.y1;
                        }
                        var drawData = {
                            selection: _this.selection,
                            onDraw: _this.onDraw,
                            color: $.markTools.cache.color,
                            penWidth: $.markTools.options.penWidth,
                            type: _this.type
                        };
                        _this.startDrag = false;

                        _this.repositionMarkDialog(e, drawData);
                        _this.checkMarkDialogNearBottom(drawData.selection, canvas.next('.mark-dialog'));
                        _this.repositionMarkDialog(e, drawData);

                        if (_this.onFinishDraw) {
                            _this.onFinishDraw(_this, e, drawData);
                        }
                    }
                    //对pin做特殊处理
                    if (_this.type === 'pin') {
                        _this.redraw();
                        //pin只有单点，让左上角坐标和右下角坐标一致方便后面创建canvas
                        _this.selection.x1 = _this.selection.x2;
                        _this.selection.y1 = _this.selection.y2;
                    }
                    e.preventDefault();
                });
        };

        DrawingCanvas.prototype.OFFSET_X = 80;

        DrawingCanvas.prototype.refreshStyle = function() {
            this.context.fillStyle = MT.cache.color;
            this.context.strokeStyle = MT.cache.color;
            this.context.lineWidth = MT.options.penWidth = MT.drawConstant.LINE_WIDTH;
            MT.options.lineDash = MT.drawConstant.LINE_DASH;
        };

        DrawingCanvas.prototype.clear = function() {
            this.context.clearRect(0, 0, this.width, this.height);
        };

        DrawingCanvas.prototype.redraw = function() {
            this.clear();
            this.refreshStyle();
            this.onDraw(this.context, this.selection);
        };

        /**
         * 开启图形的编辑
         */
        DrawingCanvas.prototype.activeEdit = function(type) {
            var canvas = this.$dom,
                _this = this,
                startDragPoint = {},
                startResizePoint = -1,
                originSelection = {
                    x1: this.selection.x1,
                    x2: this.selection.x2,
                    y1: this.selection.y1,
                    y2: this.selection.y2
                },
                resizeHandlerGroup = new ResizeHandlerGroup(this.context, this.selection, type);
            //禁用canvas之前绑定的事件
            canvas.off();
            this.startDrag = false;
            this.startResize = false;
            //若mark的类型是pin，则禁用缩放大小
            if (this.type === 'pin') {
                resizeHandlerGroup.isEnable = false;
            }

            resizeHandlerGroup.draw(this.selection);

            canvas.on('mousedown touchstart',
                function(e) {
                    if (!_this.startResize) {
                        startResizePoint = resizeHandlerGroup.checkMouseOn(e);
                        if (startResizePoint >= 0) {
                            _this.startResize = true;
                            //拖动时隐藏对话框
                            canvas.next('.mark-dialog').hide();
                            return;
                        }
                    }
                    if (!_this.startDrag && _this.checkMouseOn(e, _this.type)) {
                        //开始拖动
                        _this.startDrag = true;
                        //记录拖动的起点
                        if (!/touch/.test(e.type)) {
                            startDragPoint.x1 = e.offsetX || (e.clientX - $(e.target).offset().left);
                            startDragPoint.y1 = e.offsetY || (e.clientY - $(e.target).offset().top);
                        } else {
                            startDragPoint.x1 = e.originalEvent.touches[0].clientX - $(e.target).offset().left;
                            startDragPoint.y1 = e.originalEvent.touches[0].clientY - $(e.target).offset().top;
                        }
                        if (_this.type === 'pin') {
                            startDragPoint.x1 = originSelection.x1;
                            startDragPoint.y1 = originSelection.y1;
                        }
                        //拖动时隐藏对话框
                        canvas.next('.mark-dialog').hide();
                    }
                    e.preventDefault();
                }).on('mousemove touchmove',
                function(e) {
                    var mouseX, mouseY;

                    if (!/touch/.test(e.type)) {
                        mouseX = e.offsetX || (e.clientX - $(e.target).offset().left);
                        mouseY = e.offsetY || (e.clientY - $(e.target).offset().top);
                    } else {
                        mouseX = e.originalEvent.touches[0].clientX - $(e.target).offset().left;
                        mouseY = e.originalEvent.touches[0].clientY - $(e.target).offset().top;
                    }

                    //鼠标移动：拖拽移动
                    if (_this.startDrag) {
                        //记录拖动终点
                        startDragPoint.x2 = mouseX;
                        startDragPoint.y2 = mouseY;
                        //计算本次拖动的偏移量
                        var offsetX = startDragPoint.x2 - startDragPoint.x1,
                            offsetY = startDragPoint.y2 - startDragPoint.y1;
                        //重新计算绘制位置
                        _this.selection.x1 = originSelection.x1 + offsetX;
                        _this.selection.x2 = originSelection.x2 + offsetX;
                        _this.selection.y1 = originSelection.y1 + offsetY;
                        _this.selection.y2 = originSelection.y2 + offsetY;

                        _this.redraw();
                        resizeHandlerGroup.draw(_this.selection);
                    } else if (_this.startResize) {
                        //鼠标移动：拖拽缩放大小
                        switch (startResizePoint) {
                            case 0:
                                _this.selection.x1 = mouseX;
                                _this.selection.y1 = mouseY;
                                break;
                            case 1:
                                _this.selection.x2 = mouseX;
                                _this.selection.y1 = mouseY;
                                break;
                            case 2:
                                _this.selection.x1 = mouseX;
                                _this.selection.y2 = mouseY;
                                break;
                            case 3:
                                _this.selection.x2 = mouseX;
                                _this.selection.y2 = mouseY;
                                break;
                        }
                    } else {
                        //鼠标移动：修改光标
                        startResizePoint = resizeHandlerGroup.checkMouseOn(e);
                        if (startResizePoint >= 0) {
                            //0是左上角，3是右下角
                            e.target.style.cursor = (startResizePoint % 3 === 0 ? 'se-resize' : 'ne-resize');
                        } else if (_this.checkMouseOn(e)) {
                            e.target.style.cursor = 'move';
                        } else {
                            e.target.style.cursor = 'default';
                        }
                    }
                    _this.redraw();
                    resizeHandlerGroup.draw(_this.selection);
                    e.preventDefault();
                }).on('mouseup touchend',
                function(e) {
                    //对pin做特殊处理
                    if (_this.type === 'pin') {
                        _this.redraw();
                        //pin只有单点，让左上角坐标和右下角坐标一致方便后面创建canvas
                        _this.selection.x1 = _this.selection.x2;
                        _this.selection.y1 = _this.selection.y2;
                    }
                    if (_this.startDrag || _this.startResize) {
                        var drawData = {
                            selection: _this.selection,
                            onDraw: _this.onDraw,
                            color: $.markTools.cache.color,
                            penWidth: $.markTools.options.penWidth,
                            type: _this.type
                        };
                        _this.startDrag = false;

                        _this.checkMarkDialogNearBottom(drawData.selection, canvas.next('.mark-dialog'));
                        _this.repositionMarkDialog(e, drawData);
                        //结束拖动后显示对话框
                        canvas.next('.mark-dialog').show();
                        if (_this.onFinishDraw) {
                            _this.onFinishDraw(_this, e, drawData);
                        }
                    }
                    e.preventDefault();
                });

            //捕获颜色改变的事件
            $('.draw-canvas').on('STYLE_PICKER_COLOR_CHANGE', function(e, color) {
                //将颜色保存在缓存中
                $.markTools.cache.drawData.color = color;
                //重画
                _this.redraw();
                resizeHandlerGroup.draw(_this.selection);
            });
        };

        /**
         * 判断鼠标是否在canvas上
         * @param  {Event} e    鼠标事件
         * @param  {String} type mark的类型
         * @return {Boolean}      鼠标是否在canvas上
         */
        DrawingCanvas.prototype.checkMouseOn = function(e, type) {
            var mouseX = e.offsetX || (e.clientX - $(e.target).offset().left),
                mouseY = e.offsetY || (e.clientY - $(e.target).offset().top),
                x1, y1, w, h, margin;

            if (/touch/.test(e.type)) {
                mouseX = e.originalEvent.touches[0].clientX - $(e.target).offset().left;
                mouseY = e.originalEvent.touches[0].clientY - $(e.target).offset().top;
            }

            if (type === 'pin') {
                margin = $.markTools.options.canvasMargin;
                x1 = this.selection.x2 - margin;
                y1 = this.selection.y2 - margin;
                w = margin * 2;
                h = margin * 2;
            } else {
                x1 = this.selection.x1 < this.selection.x2 ? this.selection.x1 : this.selection.x2,
                y1 = this.selection.y1 < this.selection.y2 ? this.selection.y1 : this.selection.y2,
                w = Math.abs(this.selection.x1 - this.selection.x2),
                h = Math.abs(this.selection.y1 - this.selection.y2);
            }

            return (mouseX >= x1 && mouseX <= x1 + w && mouseY >= y1 && mouseY <= y1 + h);
        };

        DrawingCanvas.prototype.repositionMarkDialog = function(e, drawData) {
            var $callObject = this.$callObject
            $markDialog = this.$dom.next('.mark-dialog');
            //获取鼠标偏移量，显示并定位对话框
            var offset = util.getMouseOffset($callObject, e),
                sel = drawData.selection;

            offset.left = sel.x2 - (sel.x2 - sel.x1) / 2;
            offset.top = sel.y2 + (sel.y2 > sel.y1 ? 0 : sel.y1 - sel.y2);

            //如果是点，修正下偏移
            offset.top += drawData.type === 'pin' ? 20 : 0;

            if ($markDialog.hasClass('mark-dialog-reverse')) {
                offset.top = sel.y1 + (sel.y2 > sel.y1 ? 0 : sel.y2 - sel.y1);
                offset.top += drawData.type === 'pin' ? -10 : 0;
            }

            $.markTools.cache.drawData = drawData;
            $.markTools.cache.offset = offset;
            this.activeEdit(this.type);
            if (!$markDialog.exists()) {
                $markDialog = $.markTools.showMarkDialog(offset);
                $.markTools.$callObject.append($markDialog);

            } else {
                util.setOffset($markDialog, offset, true);
            }

            if ($.markTools.options.onMarkDialogShow) {
                $.markTools.options.onMarkDialogShow($markDialog);
            }
        };

        /**
         * 检测所画的mark是否位于调用主体偏下的位置，以次决定是否将mark-box翻转至上面
         * @param  {Object} selection mark的绘画位置
         * @param  {jQuery} $markDialog  markDialog的jQuery对象
         */
        DrawingCanvas.prototype.checkMarkDialogNearBottom = function(selection, $markDialog) {
            var $callObject = this.$callObject,
                markDialogHeight = $markDialog.outerHeight(),
                bottomY = selection.y1 > selection.y2 ? selection.y1 : selection.y2,
                topY = selection.y1 < selection.y2 ? selection.y1 : selection.y2,
                selectionHeight = Math.abs(topY - bottomY),
                offset = 10,
                ratio,
                nearBottom = false,
                nearTop = false,
                markDialogClass;

            $markDialog.removeClass('mark-dialog-reverse');
            $markDialog.css('margin-top', '');
            nearBottom = bottomY + markDialogHeight + offset > $callObject.height();
            nearTop = topY - markDialogHeight - offset < 0;
            //如果mark同时接近上下边界，则把mark-dialog放在中心
            if (nearTop && nearBottom) {
                console.log('put middle');
                ratio = ((selectionHeight - markDialogHeight) / 2 + markDialogHeight) / selectionHeight;
                $markDialog.css('margin-top', -ratio * selectionHeight);
            } else if (nearBottom) {
                //如果mark靠近下边界，则把mark-dialog放在上面
                console.log('need reverse');
                $markDialog.addClass('mark-dialog-reverse');
            }
            //默认mark-dialog在下面
        };

        var ResizeHandlerGroup = function(context, selection, type) {
            this.context = context;
            this.selection = selection;
            this.type = type;
            this.isEnable = true;
            this.handlerList = [
                new ResizeHandler(),
                new ResizeHandler(),
                new ResizeHandler(),
                new ResizeHandler()
            ];
            if (type === 'line') {
                this.handlerList[1].canDraw = false;
                this.handlerList[2].canDraw = false;
            } else if (type === 'pin') {
                this.handlerList[0].canDraw = false;
                this.handlerList[1].canDraw = false;
                this.handlerList[2].canDraw = false;
                this.handlerList[3].canDraw = false;
            }
        };

        ResizeHandlerGroup.prototype.draw = function(selection) {
            var i;
            if (!this.isEnable) {
                return;
            }
            this.handlerList[0].setPosition(selection.x1, selection.y1);
            this.handlerList[1].setPosition(selection.x2, selection.y1);
            this.handlerList[2].setPosition(selection.x1, selection.y2);
            this.handlerList[3].setPosition(selection.x2, selection.y2);
            for (i = 0; i < this.handlerList.length; i++) {
                this.handlerList[i].draw(this.context);
            }
        };

        ResizeHandlerGroup.prototype.checkMouseOn = function(e) {
            var i;
            if (!this.isEnable) {
                return -1;
            }
            for (i = 0; i < this.handlerList.length; i++) {
                if (this.handlerList[i].checkMouseOn(e, this.context)) {
                    return i;
                }
            }
            return -1;
        };

        var ResizeHandler = function() {
            this.canDraw = true;
        };

        ResizeHandler.prototype.setPosition = function(x, y) {
            this.x = x;
            this.y = y;
            this.r = 4;
        };

        ResizeHandler.prototype.draw = function(context) {
            if (this.canDraw) {
                context.beginPath();
                context.strokeStyle = '#fff';
                context.fillStyle = '#1977FF';
                context.arc(this.x, this.y, this.r, 0, Math.PI * 2, true);
                context.stroke();
                context.fill();
                context.closePath();
            }
        };

        ResizeHandler.prototype.checkMouseOn = function(e) {
            var mouseX = e.offsetX || (e.clientX - $(e.target).offset().left),
                mouseY = e.offsetY || (e.clientY - $(e.target).offset().top),
                rOffset = 4;

            if (/touch/.test(e.type)) {
                mouseX = e.originalEvent.touches[0].clientX - $(e.target).offset().left;
                mouseY = e.originalEvent.touches[0].clientY - $(e.target).offset().top;
            }
            return (mouseX >= this.x - (this.r + rOffset) && mouseX <= this.x + (this.r + rOffset) &&
                mouseY >= this.y - (this.r + rOffset) && mouseY <= this.y + (this.r + rOffset));
        };

        return DrawingCanvas;
    })();

    MT.DrawingCanvas = DrawingCanvas;
})(jQuery);

/**
 * util.js (jquery.marktools)
 * @author Ray Taylor Lin
 */

(function($) {
    var MT = $.markTools,
        options = MT.options,
        util = MT.util;

    $.extend($.markTools, {
        $callObject: null,
        cache: {
            userStartDraw: false,
            color: '#FF4C00',
            colorName: 'red',
            openedMarkBox: null
        },

        /**
         * 显示标记对话框，对话框由模板创建
         */
        showMarkDialog: function(mousePos) {
            var $markDialogTemplate = $('#marktools-template').find('.' + $.markTools.options.markDialogClass),
                $markDialog = $markDialogTemplate.clone(true).show();
            util.setOffset($markDialog, mousePos, true);
            return $markDialog;
        },
        createMarkBox: function(data, template) {
            var key,
                $newMarkBox,
                $template, newMarkBoxHtml;

            if (typeof template === 'string') {
                newMarkBoxHtml = template;
            } else if (template instanceof jQuery) {
                newMarkBoxHtml = $('<div>').append(template.clone()).html();
            }

            for (key in data) {
                newMarkBoxHtml = newMarkBoxHtml.replace(new RegExp('\\${' + key + '}', 'g'), data[key]);
            }
            $newMarkBox = $(newMarkBoxHtml);
            if ($newMarkBox.find('input[name=creator_id]').val() !==
                $('#data_form input[name=user_id]').val()) {
                $newMarkBox.find('.to-delete').remove();
            }
            return $newMarkBox;
        },
        fillMarkBox: function($markBox, data) {
            var key,
                markBoxHtml;
            markBoxHtml = $markBox.html();
            for (key in data) {
                markBoxHtml = markBoxHtml.replace('${' + key + '}', data[key]);
            }

            $markBox.html(markBoxHtml);
            return $markBox;
        },
        /**
         * 创建mark容器，该容器包含mark本身和mark-box信息框
         * @param  {String} strId 该容器的id
         * @param  {jQuery} $markObj    [description]
         * @param  {Object} [offset]      [description]
         * @param  {Number} [offset.left]
         * @param  {Number} [offset.top]
         * @param  {[type]} margin      [description]
         * @return {[type]}             创建好的mark容器
         */
        createMarkContainer: function(strId, $markObj, offset, margin) {
            var $newContainer = $('<div class="mark-container"></div>'),
                $callObject = $.markTools.$callObject;
            $newContainer.attr('id', strId);
            if (offset !== undefined) {
                $newContainer.css({
                    'left': offset.left,
                    'top': offset.top
                });
            }
            $newContainer.append($markObj);
            $callObject.append($newContainer);

            $markObj.css({
                'margin-left': -$markObj.width() / 2 + 'px',
                'margin-top': -$markObj.height() + (margin === undefined ? 0 : margin) + 'px'
            });
            return $newContainer;
        },
        createPin: function(offset, data) {
            var $newMark;
            $newMark = divWithClass('static-pin');
            $.markTools.$callObject.append($newMark);
            if (offset) {
                util.setOffset($newMark, offset);
            }
            $newMark.css({
                'margin-left': -$newMark.width() / 2 + 'px',
                'margin-top': -$newMark.height() + 'px'
            });
            return $newMark;
        },
        createCanvas: function($canvas, offset, data, changeSelection) {
            $canvas = $canvas || $('<canvas class="static-canvas"></canvas>');
            $.markTools.$callObject.append($canvas);
            var context = $canvas[0].getContext('2d'),
                options = $.markTools.options,
                canvasMargin = options.canvasMargin,
                width = Math.abs(data.selection.x2 - data.selection.x1) + canvasMargin * 2,
                height = Math.abs(data.selection.y2 - data.selection.y1) + canvasMargin * 2,
                onDraw = options.onDrawFuncMap[data.type] || data.onDraw;
            if (data.type === 'pin') {
                canvasMargin = 30;
                width = height = canvasMargin * 2;
            }
            $canvas.attr('width', width).attr('height', height);
            $canvas.attr('mark-type', data.type);

            if (changeSelection && typeof changeSelection === 'function') {
                changeSelection(data.selection);
            } else {
                data.selection.x2 = width - canvasMargin;
                data.selection.y2 = height - canvasMargin;
                data.selection.x1 = canvasMargin;
                data.selection.y1 = canvasMargin;
            }

            var redrawFunc = function() {
                context.clearRect(0, 0, width, height);
                context.strokeStyle = data.color;
                context.fillStyle = data.color;
                context.lineWidth = options.penWidth;
                onDraw(context, data.selection);
            };
            // redrawFunc();
            $canvas.data('redrawFunc', redrawFunc);

            if ($canvas && offset) {
                util.setOffset($canvas, {
                    left: offset.left,
                    top: offset.top + options.canvasMargin
                }, true);
            }
            $canvas.css({
                'margin-left': -$canvas.width() / 2 + 'px',
                'margin-top': -$canvas.height() + (data.type === 'pin' ? 30 : 0) + 'px'
            });

            return $canvas;
        },
        createMarkNumber: function(number) {
            var $number = $('<div class="mark-number font-hand-l">').html(number);
            $.markTools.$callObject.append($number);
            return $number;
        },
        /**
         * 将mark和mark-box绑定
         * @param  {jQuery} $markObj mark的jQuery对象
         * @param  {jQuery} $markBox mark-box的jQuery对象
         */
        bindMarkAndBox: function($markObj, $markBox) {
            util.setOffset($markBox, util.getOffset($markObj), false);
            $markObj.after($markBox);
            $markBox.hide();

            //点击mark事件
            $markObj.on('click touchend', function(e) {
                var highlightClass = 'animated tada';
                var $openedMarkBox = $.markTools.cache.openedMarkBox;
                //添加高亮
                if ($markBox.css('display') === 'none') {
                    $markObj.addClass(highlightClass);
                    setTimeout(function() {
                        $markObj.removeClass(highlightClass);
                    }, 1500);
                }
                if ($openedMarkBox && $openedMarkBox[0] !== $markBox[0]) {
                    $openedMarkBox.fadeOut();
                }
                //触发自定义的点击mark回调函数
                if ($.markTools.options.onClickMark) {
                    $.markTools.options.onClickMark($(this));
                }
                //mark-box淡入或淡出
                if (options.showMarkBox) {
                    $markBox.fadeToggle('fast', function() {
                        var $target = $(this);
                        //在缓存中记录当前已打开的markBox
                        $.markTools.cache.openedMarkBox = $target.is(':visible') ? $target : null;
                    });
                }
                e.stopPropagation();
            });

            //鼠标移到mark上事件
            if (options.hoverMarkEffect) {
                $markObj.hover(function() {
                    $markObj.removeClass(highlightClass).addClass(highlightClass);
                }, function() {
                    $markObj.removeClass(highlightClass);
                });
            }
        }
    });

})(jQuery);

/**
 * core.js (jquery.marktools)
 * @author Ray Taylor Lin
 */

(function($) {
    var MT = $.markTools,
        ToolButton = MT.ToolButton,
        ToolButtonContainer = MT.ToolButtonContainer,
        StyleToolButton = MT.StyleToolButton,
        DrawingCanvas = MT.DrawingCanvas;

    $.fn.markTools = function(options) {
        var currentFunc = 'none',
            toolsMap = {
                pin: {
                    type: 'pin',
                    classRest: 'btn-marktools-pin',
                    classActive: 'btn-marktools-pin-active',
                    classCursor: 'cursor-pin'
                },
                rect: {
                    type: 'rect',
                    classRest: 'btn-marktools-rect',
                    classActive: 'btn-marktools-rect-active',
                    classCursor: 'cursor-rect'
                },
                ellipse: {
                    type: 'ellipse',
                    classRest: 'btn-marktools-ellipse',
                    classActive: 'btn-marktools-ellipse-active',
                    classCursor: 'cursor-ellipse'
                },
                line: {
                    type: 'line',
                    classRest: 'btn-marktools-line',
                    classActive: 'btn-marktools-line-active',
                    classCursor: 'cursor-line'
                },
                'color-picker': {
                    type: 'color-picker',
                    classRest: 'btn-marktools-color',
                    classActive: 'btn-marktools-color'
                }
            },
            toolButtonContainer,
            $markDialogTemplate;


        function init() {
            //$this为调用插件的jQuery对象，对应组件中的$callObject
            var $this = $callObject = $(this),
                options = $.markTools.options,
                mouseDownPos;
            $.markTools.$callObject = $this;

            toolButtonContainer = new ToolButtonContainer($this);

            //初始化Pin按钮
            if (options.showPin) {
                var btnPin = new ToolButton(toolsMap['pin'], $this);
                btnPin.onPress = function() {
                    var onDraw = options.onDrawFuncMap['pin'],
                        onFinishDraw = function(drawingCanvas, e, drawData) {
                            //弹起按钮
                            btnPin.popup();
                        };
                    drawingCanvas = new DrawingCanvas($callObject, onDraw, onFinishDraw, 'pin');
                };
                toolButtonContainer.add(btnPin);
            }

            //初始化Region按钮
            if (options.showRegion) {
                var btnRect = new ToolButton(toolsMap['rect'], $this);

                btnRect.onPress = function() {
                    var onDraw = options.onDrawFuncMap['rect'],
                        onFinishDraw = function(drawingCanvas, e, drawData) {
                            //弹起按钮
                            btnRect.popup();
                        };
                    drawingCanvas = new DrawingCanvas($callObject, onDraw, onFinishDraw, 'rect');
                };
                toolButtonContainer.add(btnRect);
            }

            if (options.showEllipse) {
                var btnEllipse = new ToolButton(toolsMap['ellipse'], $this);

                btnEllipse.onPress = function() {
                    var onDraw = options.onDrawFuncMap['ellipse'],
                        onFinishDraw = function(drawingCanvas, e, drawData) {
                            //弹起按钮
                            btnEllipse.popup();
                        };
                    drawingCanvas = new DrawingCanvas($callObject, onDraw, onFinishDraw, 'ellipse');
                };
                toolButtonContainer.add(btnEllipse);
            }

            if (options.showLine) {
                var btnLine = new MT.ToolButton(toolsMap['line'], $this);

                btnLine.onPress = function() {
                    var onDraw = options.onDrawFuncMap['line'],
                        onFinishDraw = function() {
                            $.markTools.cache.changeSelection = function(selection) {
                                var margin = $.markTools.options.canvasMargin,
                                    flagX = selection.x2 > selection.x1,
                                    flagY = selection.y2 > selection.y1,
                                    width = Math.abs(selection.x2 - selection.x1) + margin,
                                    height = Math.abs(selection.y2 - selection.y1) + margin;
                                selection.x1 = flagX ? margin : width;
                                selection.x2 = flagX ? width : margin;
                                selection.y1 = flagY ? margin : height;
                                selection.y2 = flagY ? height : margin;
                            };
                            //弹起按钮
                            btnLine.popup();
                        };
                    drawingCanvas = new DrawingCanvas($callObject, onDraw, onFinishDraw, 'line');
                };
                toolButtonContainer.add(btnLine);
            }

            if (true) {
                var btnColorPicker = new StyleToolButton(toolsMap['color-picker'], $this);
                // stylePicker = new StylePicker($this);
                // btnColorPicker.$dom.append('<div class="color-show-block"></div>');

                btnColorPicker.onPress = function() {
                    // var $stylePicker = stylePicker.$dom,
                    //     height = $stylePicker.height();
                    // // btnColorPicker.addStylePicker(stylePicker);
                    // $stylePicker.height(0).animate({
                    //     height: '+=445',
                    //     'margin-top': '-=445'
                    // }, 1000, function() {
                    //     /* stuff to do after animation is complete */
                    // });
                };
                toolButtonContainer.add(btnColorPicker);
            }

            var $marktoolsTemplate = $('#marktools-template').hide(),
                markDialogTemplateHtml =
                '<form class="' + options.markDialogClass + '">' +
                '<div class="mark-dialog-control">' +
                '<label for="title" class="font-hel-s">opinion on mark</label>' +
                '<textarea name="title" class="font-hel-s"></textarea>' +
                '</div>' +
                // '<div class="mark-dialog-control">' +
                // '<label for="description">Description</label>' +
                // '<textarea name="description"></textarea>' +
                // '</div>' +
                '<a class="mark-dialog-button mark-dialog-button-cancel font-hel-s" href="javascript:void(0)">Cancel</a>' +
                '<a class="mark-dialog-button mark-dialog-button-save font-hel-s" href="javascript:void(0)">Save</a>' +
                '<div class="clearfix"></div>' +
                '</form>',
                markBoxTemplateHtml =
                '<div class="mark-box">' +
                '<p class="mark-box-title">${title}</p>' +
                '<p class="mark-box-description">${description}</p>' +
                '</div>',
                $markDialogTemplate = $(markDialogTemplateHtml).hide(),
                $markBoxTemplate = $(markBoxTemplateHtml).hide();
            //若模板不存在则创建一个默认的模板div
            if (!$marktoolsTemplate.exists()) {
                $marktoolsTemplate = $('<div id="marktools-template"></div>');
                $('body').append($marktoolsTemplate);

                $marktoolsTemplate.append($markDialogTemplate);
                $marktoolsTemplate.append($markBoxTemplate);
            } else {
                /* 后续生成的对话框均由此模板clone而成 */

                //options.markDialogClass为用户自定义的对话框DOM模板的class
                if (!$('.' + options.markDialogClass).exists()) {
                    //插件默认的对话框
                    $marktoolsTemplate.append($markDialogTemplate);
                } else {
                    //用户自定义的对话框
                    $markDialogTemplate = $('.' + options.markDialogClass);
                }

                //options.markBoxClass为用户自定义的标记内容框DOM模板的class
                if (!$('.' + options.markBoxClass).exists()) {
                    //插件默认的标记内容框
                    $marktoolsTemplate.append($markBoxTemplate);
                } else {
                    //用户自定义的标记内容框
                    $markBoxTemplate = $('.' + options.markBoxClass);
                }
            }

            //Cancel按钮事件
            $markDialogTemplate.on('click touchend', '.mark-dialog-button-cancel',
                function() {
                    //移除整个mark-container
                    //$(this)为按钮，上1级父节点的前一节点即mark-container
                    $(this).parent().prev().remove();
                    $(this).parent().remove();
                    //触发保存mark时的自定义方法
                    if (options.onCancelMark) {
                        options.onCancelMark();
                    }
                });
            //Save按钮事件
            $markDialogTemplate.on('click touchend', '.mark-dialog-button-save',
                function() {
                    var $markDialog = $(this).parent(),
                        $title = $markDialog.find('textarea[name=title]'),
                        $description = $markDialog.find('textarea'),
                        title = $title.val(),
                        description = $description.val(),

                        $markBox,
                        $markObject,
                        offset, drawData, changeSelection, sel;

                    if (options.validateHandler) {
                        if (!options.validateHandler()) {
                            return;
                        }
                    }

                    offset = $.markTools.cache.offset;
                    drawData = $.markTools.cache.drawData;
                    sel = drawData.selection;
                    changeSelection = $.markTools.cache.changeSelection;
                    $markObject = $markDialog.prev();

                    //offset可能在mark-dialog翻转的时候被修改过，这时候应该重新设置成以canvas中下点为基点
                    offset.top = sel.y2 + (sel.y2 > sel.y1 ? 0 : sel.y1 - sel.y2);

                    if (drawData !== undefined) {
                        $markObject = $.markTools.createCanvas($markObject, offset, drawData, changeSelection);
                        //将canvas转换为静态canvas（绘画canvas拥有相对最高的z-index）
                        $markObject.removeClass('draw-canvas').addClass('static-canvas');
                        $markObject.off();
                    }

                    var markType = $markObject.attr('mark-type');

                    var markData = {
                        title: title,
                        description: description,
                        type: markType,
                        color: $.markTools.cache.color,
                        margin: $.markTools.options.canvasMargin,
                        mouseX: parseInt($markObject.css('left')),
                        mouseY: parseInt($markObject.css('top')),
                        width: markType === 'pin' ? 0 : $markObject.width(),
                        height: markType === 'pin' ? 0 : $markObject.height()
                    };

                    markData.lineReverse = (drawData.type === 'line' &&
                        ((sel.x1 < sel.x2 && sel.y1 > sel.y2) ||
                            (sel.x1 > sel.x2 && sel.y1 < sel.y2)));
                    markData.selection = sel;

                    //触发保存mark时的自定义方法
                    if (options.onSaveMark) {
                        options.onSaveMark($markObject, $markDialog, markData);
                        $markObject.remove();
                    } else {
                        //创建新的markBox
                        $markBox = $.markTools.createMarkBox(markData, $markBoxTemplate);
                        $.markTools.bindMarkAndBox($markObject, $markBox);

                    }
                    $markDialog.remove();
                    $.markTools.cache.drawData = undefined;
                    $.markTools.cache.offset = undefined;
                });
        }

        $.extend($.markTools.options, options);

        return this.each(init);
    };

})(jQuery);
