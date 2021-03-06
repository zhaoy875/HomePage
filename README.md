-----------------------
##基于NodeJs的云平台存储系统设计与实现
-----------------------

#布局介绍
________________
## 两列布局
* **方案1：**
  使用浮动布局，left、content两列，left浮动、content使用margin-left给个left的width;
* **方案2：**
  使用浮动+负边距，left、wrapper>content两列，left、wrapper浮动，left的margin-right：-100%,
content有个margin-left给left的width

## 两列等高布局
 * **方案1：**
  使用border，wrapper>left+content,left、content浮动，wrapper的border为left的width
 * **方案2：**
  使用padding-bottom、负margin-bottom，left、content设定一合适的大小
 * **方案3：**
  使用浮动+content[border]，left、content浮动，
content[border]大小为left的width，content设置负margin
 * **方案4：**
  使用relative+float布局，wrapper>container>left+content,各个都设置relative，
left设置float，width为负margin，content设置margin=left[width]
 * **方案5：**
  两列布局meghod2+relative布局 

[**详细布局信息**](http://www.cnblogs.com/jununx/p/3336553.html)
## 优秀JS文章
[**html5rocks详细介绍HTML5**](http://slides.html5rocks.com/#landing-slide) 

[**阮一峰论html5**](http://javascript.ruanyifeng.com/#introduction)

[**阿里goddyzhao论js核心**](http://goddyzhao.tumblr.com/JavaScript-Internal)

###伪类、伪元素区别
 **根本区别在于：它们是否创造了新的元素(抽象)。从我们模仿其意义的角度来看，如果需要添加新元素加以标识的，就是伪元素，反之，如果只需要在既有元素上添加类别的，就是伪类。**
 
###绝对居中方式详解
[**详见该网址**](http://blog.csdn.net/freshlover/article/details/11579669)

[**台湾牛人——前端没有极限：解决方案**](http://wcc723.github.io/css/2015/01/16/css-magic/)

[**CodePen测试**](http://codepen.io/KatieK2/pen/AbxGr)

[**CodePen另一个测试**](http://codepen.io/thirdtiu/pen/fjnxd)

###工具类
[**直接将style中的css对应到标签内在线实现**](http://templates.mailchimp.com/resources/inline-css/)

###移动端web总结
[**HTML5移动平台支撑度与兼容性分析**](http://zhangdaiping.iteye.com/blog/1645363)

###AngularJs博客详解
[**angular学习笔记**](http://www.cnblogs.com/lcllao/tag/%E7%AC%94%E8%AE%B0/)

###Div.io地址
[Div.io](http://div.io/user/1811)

## 移动设计手册
**DPI(Dots Per Inch)每英寸像素点的个数**

**PPI(pixels per inch)图像分辨率(在图像中，每英寸所包含的像素数目)**

**1inch = 2.54cm**

**dip(device independent pixel)**

**dp(device pixel)**

+ dip(设备独立像素:不同设备有不同的显示效果，这个和设备硬件你有关，不依赖像素。
+ 分辨率:屏幕图像的精密度，是指显示器所能显示的像素点的多少，显示器可显示的像素越多，画面就越精细
+ px(像素):不同设备显示效果相同，px是分辨率的单位，也就是说320*480的分辨率内，共有153600个像素。
+ 屏幕密度：表示每英寸有多少个显示点，与分辨率是两个不同的概念。单位是dpi。
+ dpi的计算：dpi=Diagonal pixel/Screen size
	Diagonal pixel表示对角线像素值：
	=sqrt(长^2+宽^2)
	Screen size:屏幕对角线长度

-------------------------------------------------------

## styleSheet

+ **document.styleSheets**
	获取文档中的所有css样式列表
item接口获取列表中的第几项

+ **document.styleSheets.item(n)**
	获取第n项的样式表

**属性**
+ cssRules：获取所有cssStyleRule列表
+ rules：同cssRules
+ title
+ type
+ owerNode
+ ownerRule

**方法**
+ addRule
+ deleteRule
+ insertRule
+ removeRule

## github token 
**一个测试用的github access_token**

fdca470dfab03227f9535ab30e42a3c4e110e293

## css conf china
[**中国第二届CSS Conf**](http://www.w3ctech.com/topic/1463)

## 不想用issue就直接在这里写
**section bug**
> section与section或者article标签之间会产生底部空隙，原因暂时不知

> 解决方法：给section添加一个padding-bottom:1px;

### namespace简单实现
``` javascript
function namespace(oNamespace, sPackage) {
    var obj = oNamespace;
    sPackage = sPackage.split('.');
    for(var i=0,len=sPackage.length;i<len;i++){
        obj[sPackage[i]] = {};
        obj=obj[sPackage[i]];
    }
    return oNamespace;
}
```
### 待解决js难题
```javascript
var obj={x:1},
	another = obj;
	console.log(another);
another.z=another={y:2};
```
**分析**

```javascript another.z=another={y:2};```
如果执行顺序为：
``` javascript
	another={y:2};//执行这个后，其实another.z的another对象依然指向{x:1}的obj
	another.z=another;//执行这个后，obj获取z属性
```
那么，一切都正常了...

### 美团笔试
 
 ```javascript
 function formatString(sourceString) {
    var regHeadTail=/^\s*|\s*$/g,
        regMiddle=/\b\s{2,}\b/g;
    sourceString = sourceString.replace(regHeadTail,'');
    return sourceString.replace(regMiddle,' ');
}
 ```
### 获取天气数据

http://op.juhe.cn/onebox/weather/query?cityname=%E4%B8%8A%E6%B5%B7&key=01827b8b5b216fe22ccf240352e8b5eb

### xss与字符编码
[字符编码中的xss](http://drops.wooyun.org/tips/689)

###javascript学习资料

[资料合集](https://github.com/lidasong2014/javascript-path)

###this的确定
**在一般的函数调用中，this的值是由激活上下文代码的调用者决定的，比如说，调用函数的外层上下文。this的值是由调用表达式的形式决定的。影响调用上下文中的this的值的只有可能是调用表达式的形式，也就是调用函数的方式。函数上下文中this的值是函数调用者提供并且由当前调用表达式的形式而定的。 如果在调用括号()的左边，有引用类型的值，那么this的值就会设置为该引用类型值的base对象。 所有其他情况下（非引用类型），this的值总是null。然而，由于null对于this来说没有任何意义，因此会隐式转换为全局对象。**
