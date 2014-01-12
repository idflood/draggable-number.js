# Draggable-number.js [![Build Status](https://travis-ci.org/idflood/draggable-number.js.png?branch=master)](https://travis-ci.org/idflood/draggable-number.js)
Display number as simple text but allow click + drag to change the value. If the
number is simply clicked then it displays an input so that a precise value can
be entered.

## Usage:
Include the draggable-number.min.js file and then call `new DraggableNumber(element)`.

```html
<input class="numeric-input" value="42" />
<script src="dist/draggable-number.min.js"></script>
<script>
  new DraggableNumber(document.getElementsByClassName('numeric-input'));
</script>
```
