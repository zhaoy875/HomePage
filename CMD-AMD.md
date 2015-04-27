### CMD与AMD的区别
-----------------------
* 一、
 **CMD依赖就近**
  ``` javascript
      define(function(require,exports,module){  
            var a = require('./a');  
            a.doSomthing();  
      });
  ```
  代码在运行时，首先是不知道依赖的，需要遍历所有的require关键字，找出后面的依赖。具体做法是将
function toString后，用正则匹配出require关键字后面的依赖。
 **AMD依赖前置**
  ```javascript
    define(['./a','./b'],function(a,b){  
       //......  
       a.doSomthing();  
       //......  
       b.doSomthing();  
    })  
  ``` 
  代码在一旦运行到此处，能立即知晓依赖。而无需遍历整个函数体找到它的依赖，因此性能有所提升，缺点就是开发者
  必须显示得指明依赖——这会使得开发工作量变大，比如：当依赖有n个的时候，那么写起来比较烦，且容易出错。
  不过RequireJS从2.0开始，也改变可以延迟执行(根据写法不同，处理方式不同)。
  
* 二、执行顺序上：
  **CMD是延迟执行的**
  **AMD是提前执行的**
  
* 三、api设计角度
  **AMD的api默认是一个当多个用**
  **CMD的API严格区分，推从职责单一**
  比如AMD里，require分全局require和局部require，都叫require。
  CMD里，没有全局require，而是根据模块系统的完备性，提供seajs.use来实现模块系统的加载启动。
  CMD里，每个API都简单纯粹。
