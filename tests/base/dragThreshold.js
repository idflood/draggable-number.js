var should = chai.should();

describe("DraggableNumberElement.dragThreshold", () => {
  var input = document.createElement("input");
  var input2 = document.createElement("input");

  beforeEach(function() {
    document.body.appendChild(input);
    this.el = new DraggableNumber(input);
  });

  afterEach(function() {
    this.el.destroy();
    delete this.el;
    document.body.removeChild(input);
  });

  it("By default dragThreshold should be 10", function() {
    this.el._dragThreshold.should.equal(10);
  });

  it("DragThreshold should be modifiable from options", function() {
    this.el.destroy();
    this.el = new DraggableNumber(input, {dragThreshold: 42});
    this.el._dragThreshold.should.equal(42);
  });
});
