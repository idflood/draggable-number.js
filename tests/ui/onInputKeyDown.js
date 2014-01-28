var should = chai.should();

describe("DraggableNumberElement._onInputKeyDown", function() {
  var input = document.createElement("input");

  beforeEach(function() {
    document.body.appendChild(input);
    input.style.display = '';
    this.el = new DraggableNumber(input);
  });

  afterEach(function() {
    this.el.destroy();
    delete this.el;
    document.body.removeChild(input);
  });

  it("Should blur the element if enter key is pressed", function() {
    this.el._input.style.display = 'block';
    this.el._input.focus();
    document.activeElement.should.equal(this.el._input);
    // Simulate enter key.
    this.el._onInputKeyDown({charCode: 13});
    document.activeElement.should.not.equal(this.el._input);
    //this.el.input.style.display.should.equal('none');
  });
});
