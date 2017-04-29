var should = chai.should();

describe("DraggableNumberElement.set and get", () => {
  var input = document.createElement("input");
  var input2 = document.createElement("input");

  beforeEach(function() {
    document.body.appendChild(input);
    input.value = 32;
    this.el = new DraggableNumber(input);
  });

  afterEach(function() {
    this.el.destroy();
    delete this.el;
    document.body.removeChild(input);
  });

  it("Should update the value", function() {
    this.el.set(this.el.get() + 10);
    this.el.get().should.equal(42);
  });

  it("Should update the input.value", function() {
    this.el.set(this.el.get() + 12);
    this.el._input.value.should.equal('44');
  });

  it("Should update the span.innerHTML", function() {
    this.el.set(this.el.get() + 8);
    this.el._span.innerHTML.should.equal('40');
  });
});
