var should = chai.should();

describe("DraggableNumberElement.hasMovedEnough", () => {
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

  it("Should return false if difference between 2 mouse positions is less than 10", function() {
    var result = this.el._hasMovedEnough({x: 0, y: 42}, {x: 2, y: 43});
    result.should.equal(false);
  });

  it("Should return true if difference between 2 mouse positions is larger or equal to 10", function() {
    var result = this.el._hasMovedEnough({x: 0, y: 42}, {x: 0, y: 52});
    result.should.equal(true);
  });

  it("Should return true if difference between 2 mouse positions is larger or equal to 10 even if difference is negative", function() {
    var result = this.el._hasMovedEnough({x: 0, y: 42}, {x: 0, y: 30});
    result.should.equal(true);
  });
});
