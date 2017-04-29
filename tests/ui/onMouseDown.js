var should = chai.should();

describe("DraggableNumberElement._onMouseDown", () => {
  var input = document.createElement("input");

  beforeEach(function() {
    document.body.appendChild(input);
    this.el = new DraggableNumber(input);
  });

  afterEach(function() {
    this.el.destroy();
    delete this.el;
    document.body.removeChild(input);
  });

  it("Should set isDragging to false", function() {
    this.el._isDragging = true;
    this.el._onMouseDown({clientX: 10, clientY: 42});
    this.el._isDragging.should.equal(false);
  });

  it("Should save mouse position in lastMousePosition", function() {
    var position = {clientX: 10, clientY: 42};
    this.el._onMouseDown(position);
    this.el._lastMousePosition.should.deep.equal({x: position.clientX, y: position.clientY});
  });
});
