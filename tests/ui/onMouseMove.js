var should = chai.should();

describe("DraggableNumberElement._onMouseMove", function() {
  var input = document.createElement("input");

  beforeEach(function() {
    document.body.appendChild(input);
    input.value = 10;
    this.el = new DraggableNumber(input);
    this.el._lastMousePosition = {x: 0, y: 0}
  });

  afterEach(function() {
    this.el.destroy();
    delete this.el;
    document.body.removeChild(input);
  });

  it("Should not modify value if mouse position is less than dragThreshold (10).", function() {
    this.el._onMouseMove({clientX: 1, clientY: 0});
    this.el.get().should.equal(10);
  });

  it("Should increment value by 1 if there is no modifier key.", function() {
    this.el._onMouseMove({clientX: 20, clientY: 0});
    this.el.get().should.equal(11);
  });

  it("Should increment value by 10 if shift key is pressed.", function() {
    this.el._onMouseMove({clientX: 20, clientY: 0, shiftKey: true});
    this.el.get().should.equal(20);
  });

  it("Should increment value by 0.1 if ctrl key is pressed.", function() {
    this.el._onMouseMove({clientX: 20, clientY: 0, ctrlKey: true});
    this.el.get().should.equal(10.1);
  });

  it("Should save new mouse position if difference is bigger than dragThreshold.", function() {
    this.el._onMouseMove({clientX: 20, clientY: 0});
    this.el._lastMousePosition.x.should.equal(20);
  });

  it("Should not save new mouse position if difference is smaller than dragThreshold.", function() {
    this.el._onMouseMove({clientX: 9, clientY: 0});
    this.el._lastMousePosition.x.should.equal(0);
  });
});
