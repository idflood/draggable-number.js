var should = chai.should();

describe("DraggableNumberElement.getLargestDelta", function() {
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

  it("Should return 0 if there is no difference", function() {
    var pos = {x: 142, y: 2145};
    var result = this.el._getLargestDelta(pos, pos);
    result.should.equal(0);
  });

  it("Should return the largest delta (x)", function() {
    var posA = {x: 100, y: 200};
    var posB = {x: 145, y: 244};
    var result = this.el._getLargestDelta(posB, posA);
    result.should.equal(45);
  });

  it("Should return the largest delta (y) inversed", function() {
    var posA = {x: 100, y: 200};
    var posB = {x: 142, y: 243};
    var result = this.el._getLargestDelta(posB, posA);
    result.should.equal(-43);
  });

  it("Should return the largest delta even if the difference is negative", function() {
    var posA = {x: 100, y: -200};
    var posB = {x: 142, y: -243};
    var result = this.el._getLargestDelta(posB, posA);
    result.should.equal(43);
  });
});
