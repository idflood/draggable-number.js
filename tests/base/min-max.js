var should = chai.should();

describe("DraggableNumberElement.min/max", () => {
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

  it("By default min should be -Infinity and max Infinity", function() {
    this.el._min.should.equal(-Infinity);
    this.el._max.should.equal(Infinity);
  });

  it("Min/max should be modifiable from options", function() {
    this.el.destroy();
    this.el = new DraggableNumber(input, {min: 7, max: 100});
    this.el._min.should.equal(7);
    this.el._max.should.equal(100);
  });

  it("Setting the value should keep it between min/max", function() {
    this.el.destroy();
    this.el = new DraggableNumber(input, {min: 7, max: 100});
    this.el.set(-42);
    this.el.get().should.equal(7);
    this.el.set(2415);
    this.el.get().should.equal(100);
  });

  it("Setting the min value should adapt the current value if needed", function() {
    this.el.destroy();
    this.el = new DraggableNumber(input);
    this.el.set(7);
    this.el.setMin(24);
    this.el.get().should.equal(24);
  });

  it("Setting the max value should adapt the current value if needed", function() {
    this.el.destroy();
    this.el = new DraggableNumber(input);
    this.el.set(7);
    this.el.setMax(4);
    this.el.get().should.equal(4);
  });
});
