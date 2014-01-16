/**!
 * draggable-number.js
 * Minimal numeric input widget
 *
 * @license Licensed under the MIT (http://www.opensource.org/licenses/mit-license.php) license.
 * @author David Mignot - http://idflood.com
 * @version 0.0.3
 **/
(function(root, factory) {
    if(typeof exports === 'object') {
        module.exports = factory();
    }
    else if(typeof define === 'function' && define.amd) {
        define([], factory);
    }
    else {
        root['DraggableNumber'] = factory();
    }
}(this, function() {
var DraggableNumber = function(elements) {
  this.elements = elements;
  this.instances = [];
  this.init();
};

DraggableNumber.prototype = {
  constructor: DraggableNumber,

  init: function () {
    if (this.elements && this.elements instanceof Array === false && this.elements instanceof NodeList === false) {
      this.elements = [this.elements];
    }
    for (var i = this.elements.length - 1; i >= 0; i--) {
      this.instances.push(new DraggableNumber.Element(this.elements[i]));
    }
  },

  destroy: function () {
    for (var i = this.instances.length - 1; i >= 0; i--) {
      this.instances[i].destroy();
    }
  }
};

// Set some constants.
DraggableNumber.MODIFIER_NONE = 0;
DraggableNumber.MODIFIER_LARGE = 1;
DraggableNumber.MODIFIER_SMALL = 2;

// Utility function to replace .bind(this) since it is not available in all browsers.
var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

DraggableNumber.Element = function (input) {
  this._input = input;
  this._span = document.createElement("span");
  this._isDragging = false;
  this._lastMousePosition = {x: 0, y: 0};
  this._value = 0;

  // Minimum mouse movement before a drag start.
  this._dragThreshold = 10;

  // Store the original display style for the input and span.
  this._inputDisplayStyle = "";
  this._spanDisplayStyle = "";

  this._init();
};

DraggableNumber.Element.prototype = {
  constructor: DraggableNumber.Element,

  _init: function () {
    // Get the inital _value from the input.
    this._value = parseFloat(this._input.value, 10);

    // Add a span containing the _value. Clicking on the span will show the
    // input. Dragging the span will change the _value.
    this._addSpan();

    // Save the original display style of the input and span.
    this._inputDisplayStyle = this._input.style.display;
    this._spanDisplayStyle = this._span.style.display;

    // Hide the input.
    this._input.style.display = 'none';

    // Bind 'this' on event callbacks.
    this._onMouseUp = __bind(this._onMouseUp, this);
    this._onMouseMove = __bind(this._onMouseMove, this);
    this._onMouseDown = __bind(this._onMouseDown, this);
    this._onInputBlur = __bind(this._onInputBlur, this);
    this._onInputKeyDown = __bind(this._onInputKeyDown, this);
    this._onInputChange = __bind(this._onInputChange, this);

    // Add mousedown event handler.
    this._span.addEventListener('mousedown', this._onMouseDown, false);

    // Add key events on the input.
    this._input.addEventListener('blur', this._onInputBlur, false);
    this._input.addEventListener('keypress', this._onInputKeyDown, false);
    // Directly assign the function instead of using addeventlistener.
    // To programatically change the _value of the draggableNumber you
    // could then do:
    // input._value = new_number;
    // input.onchange();
    this._input.onchange = this._onInputChange;
  },

  set: function (new_value) {
    this._value = new_value;
    this._input.value = this._value;
    this._span.innerHTML = this._value;
  },

  get: function () {
    return this._value;
  },

  destroy: function () {
    if (this._span.parentNode) {
      this._span.parentNode.removeChild(this._span);
    }
  },

  _preventSelection: function (prevent) {
    var value = 'none';
    if (prevent === false) {
      value = 'all';
    }
    document.body.style['-moz-user-select'] = value;
    document.body.style['-webkit-user-select'] = value;
    document.body.style['-ms-user-select'] = value;
    document.body.style['user-select'] = value;
  },

  _addSpan: function () {
    var inputParent = this._input.parentNode;
    inputParent.insertBefore(this._span, this._input);
    this._span.innerHTML = this.get();

    // Add resize cursor.
    this._span.style.cursor = "col-resize";
  },

  _showInput: function () {
    this._input.style.display = this._inputDisplayStyle;
    this._span.style.display = 'none';
    this._input.focus();
  },

  _showSpan: function () {
    this._input.style.display = 'none';
    this._span.style.display = this._spanDisplayStyle;
  },

  _onInputBlur: function (e) {
    this._onInputChange();
    this._showSpan();
  },

  _onInputChange: function () {
    this.set(parseFloat(this._input.value, 10));
  },

  _onInputKeyDown: function (e) {
    var keyEnter = 13;
    if (e.charCode == keyEnter) {
      this._input.blur();
    }
  },

  _onMouseDown: function (e) {
    this._preventSelection(true);
    this._isDragging = false;
    this._lastMousePosition = {x: e.clientX, y: e.clientY};

    document.addEventListener('mouseup', this._onMouseUp, false);
    document.addEventListener('mousemove', this._onMouseMove, false);
  },

  _onMouseUp: function (e) {
    this._preventSelection(false);
    // If we didn't drag the span then we display the input.
    if (this._isDragging === false) {
      this._showInput();
    }
    this._isDragging = false;

    document.removeEventListener('mouseup', this._onMouseUp, false);
    document.removeEventListener('mousemove', this._onMouseMove, false);
  },

  _hasMovedEnough: function (newMousePosition, lastMousePosition) {
    if (Math.abs(newMousePosition.x - lastMousePosition.x) >= this._dragThreshold ||
      Math.abs(newMousePosition.y - lastMousePosition.y) >= this._dragThreshold) {
      return true;
    }
    return false;
  },

  _onMouseMove: function (e) {
    // Get the new mouse position.
    var newMousePosition = {x: e.clientX, y: e.clientY};

    if (this._hasMovedEnough(newMousePosition, this._lastMousePosition)) {
      this._isDragging = true;
    }

    // If we are not dragging don't do anything.
    if (this._isDragging === false) {
      return;
    }

    // Get the increment modifier. Small increment * 0.1, large increment * 10.
    var modifier = DraggableNumber.MODIFIER_NONE;
    if (e.shiftKey) {
      modifier = DraggableNumber.MODIFIER_LARGE;
    }
    else if (e.ctrlKey) {
      modifier = DraggableNumber.MODIFIER_SMALL;
    }

    // Calculate the delta with previous mouse position.
    var delta = this._getLargestDelta(newMousePosition, this._lastMousePosition);

    // Get the number offset.
    var offset = this._getNumberOffset(delta, modifier);

    // Update the input number.
    this.set(this.get() + offset);

    // Save current mouse position.
    this._lastMousePosition = newMousePosition;
  },

  _getNumberOffset: function (delta, modifier) {
    var increment = 1;
    if (modifier == DraggableNumber.MODIFIER_SMALL) {
      increment *= 0.1;
    }
    else if (modifier == DraggableNumber.MODIFIER_LARGE) {
      increment *= 10;
    }
    // Negative increment if delta is negative.
    if (delta < 0) {
      increment *= -1;
    }
    return increment;
  },

  _getLargestDelta: function (newPosition, oldPosition) {
    var result = 0;
    var delta = {
      x: newPosition.x - oldPosition.x,
      y: newPosition.y - oldPosition.y,
    };
    if (Math.abs(delta.x) > Math.abs(delta.y)) {
      return delta.x;
    }
    else {
      // Inverse the position.y since mouse move to up should increase the _value.
      return delta.y * -1;
    }
  }
};

    return DraggableNumber;
}));
