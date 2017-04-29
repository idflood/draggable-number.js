var should = chai.should();

describe("DraggableNumberElement._onInputBlur", () => {
  var input = document.createElement("input");

  beforeEach(function() {
    document.body.appendChild(input);
    input.value = 10;
    this.el = new DraggableNumber(input);
  });

  afterEach(function() {
    this.el.destroy();
    delete this.el;
    document.body.removeChild(input);
  });

  it("Should update the value based on the input and convert it to float", function() {
    input.value = "42";
    this.el._onInputBlur(null);
    this.el.get().should.equal(42);
  });
});
