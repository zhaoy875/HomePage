#布局介绍
________________
## 两列布局
* **方案1：**
  使用浮动布局，left、content两列，left浮动、content使用margin-left给个left的width;
* **方案2：**
  使用浮动+负边距，left、wrapper>content两列，left、wrapper浮动，left的margin-right：-100%,
content有个margin-left给left的width

## 两列等高布局
------------------
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
