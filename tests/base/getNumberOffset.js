var should = chai.should();

describe("DraggableNumberElement.getNumberOffset", function() {
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

  it("Should return 1 if delta is positive and there is no modifier", function() {
    var result = this.el._getNumberOffset(1, DraggableNumber.MODIFIER_NONE);
    result.should.equal(1);
  });

  it("Should return -1 if delta is negative and there is no modifier", function() {
    var result = this.el._getNumberOffset(-21, DraggableNumber.MODIFIER_NONE);
    result.should.equal(-1);
  });

  it("Should return 10 if delta is positive and there is a large modifier", function() {
    var result = this.el._getNumberOffset(17, DraggableNumber.MODIFIER_LARGE);
    result.should.equal(10);
  });

  it("Should return -10 if delta is negative and there is a large modifier", function() {
    var result = this.el._getNumberOffset(-1, DraggableNumber.MODIFIER_LARGE);
    result.should.equal(-10);
  });

  it("Should return 0.1 if delta is positive and there is a small modifier", function() {
    var result = this.el._getNumberOffset(19, DraggableNumber.MODIFIER_SMALL);
    result.should.equal(0.1);
  });

  it("Should return -0.1 if delta is negative and there is a small modifier", function() {
    var result = this.el._getNumberOffset(-142, DraggableNumber.MODIFIER_SMALL);
    result.should.equal(-0.1);
  });
});
