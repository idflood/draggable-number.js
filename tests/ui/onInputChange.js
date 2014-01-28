var should = chai.should();

describe("DraggableNumberElement input value change", function() {
  var input = document.createElement("input");

  beforeEach(function() {
    document.body.appendChild(input);
    input.value = 42;
    this.el = new DraggableNumber(input);
  });

  afterEach(function() {
    this.el.destroy();
    delete this.el;
    document.body.removeChild(input);
  });

  it("Should update the component value on input.onchange", function() {
    input.value = 10;
    input.onchange();
    this.el.get().should.equal(10);
  });
});
