var should = chai.should();

describe("DraggableNumberElement callbacks", function() {
  var input = document.createElement("input");

  var testVal = 0;

  var onChangeCallback = function(new_val) {
    testVal = new_val;
  };

  beforeEach(function() {
    document.body.appendChild(input);
    input.value = 32;
    this.el = new DraggableNumber(input, {changeCallback: onChangeCallback});
  });

  afterEach(function() {
    this.el.destroy();
    delete this.el;
    document.body.removeChild(input);
  });

  it("Should call the changeCallback function", function() {
    this.el._isDragging = true;
    this.el._lastMousePosition = {x: 0, y: 0};
    this.el._onMouseMove({clientX: 100, clientY: 0});
    testVal.should.not.equal(0);
  });
});
