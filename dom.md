### css选择器
选择器效率排行如下：

+ ID选择器
+ 类选择器
+ 标签选择器
+ 相邻选择器
+ 子选择器
+ 后代选择器
+ 通配符选择器
+ 属性选择器
+ 伪类选择器

### insertAdjacentHTML

- elm.insertAdjacentHTML('beforebegin', '<span>Hey-</span>');
- elm.insertAdjacentHTML('afterbegin', '<span>dude-</span>'); 
- elm.insertAdjacentHTML('beforeend', '<span>-are</span>'); 
- elm.insertAdjacentHTML('afterend', '<span>-you?</span>');  

### elementFromPoint

使用document.elementFromPoint(top,left)获取相对于顶层元素对象的top、left位置处的
dom元素

### scrollIntoView

使用element.scrollIntoView定位到element对应的元素位置，显示在视区
scrollIntoView(boolean):boolean=true定位到视图区顶部，boolean=false定位到视图区底部

### style接口

element.style获取inline css style样式，返回CSSStyleDeclaration对象
```javascript
{
  cssText:获取设置的inline style的文本
  item：获取设置的对应inline style第几个属性
  getPropertyValue：获取设置的样式值
  setProperty：设置inline style样式
  removeProperty：删除设置的对应样式
}
```

### getComputedStyle

window.getComputedStyle(element)获取元素的层叠样式;返回CSSStyleDeclaration对象，不可以
使用该对象设置样式，该对象只读

### text Node(文本节点)

+ textContent
+ splitText()
+ appendData()
+ deleteData()
+ insertData()
+ replaceData()
+ subStringData()
+ normalize()
+ data

### innerText与textContent区别

+ innerText is aware of CSS. So if you have hidden text innerText ignores this text, whereas textContent will not
Because innerText cares about CSS it will trigger a reflow, whereas textContent will not
+ innerText ignores the Text nodes contained in <script> and <style> elements
+ innerText, unlike textContent will normalize the text that is returned. Just think of textContent as returning exactly what is in the document with the markup removed. This will include white space, line breaks, and carriage returns
+ innerText is considered to be non-standard and browser specific while textContent is implemented from the DOM specifications
