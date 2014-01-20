# Draggable-number.js [![Build Status](https://travis-ci.org/idflood/draggable-number.js.png?branch=master)](https://travis-ci.org/idflood/draggable-number.js) [![Coverage Status](https://coveralls.io/repos/idflood/draggable-number.js/badge.png?branch=master)](https://coveralls.io/r/idflood/draggable-number.js?branch=master)
Display number as simple text but allow click + drag to change the value. If the
number is simply clicked then it displays an input so that a precise value can
be entered.

## Usage:
Include the draggable-number.min.js file and then call `new DraggableNumber(element)`.

```html
<input class="numeric-input" value="42" />
<script src="dist/draggable-number.min.js"></script>
<script>
  new DraggableNumber(document.getElementsByClassName('numeric-input')[0]);
</script>
```

## API:

### item.get()
Return the current value as float.

```javascript
var value = item.get();
```

### item.set(value)
Set the value of the element. This update the input and span value.

```javascript
item.set(42);
```

### item.destroy()
Remove the DraggableNumber element, leaving the original input field.

```javascript
item.destroy();
```
