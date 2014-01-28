var should = chai.should();

describe("DraggableNumberElement.showSpan", function() {
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

  it("Should show the span element", function() {
    this.el._span.style.display = 'none';
    this.el._showSpan();
    this.el._span.style.display.should.equal('');
  });

  it("Should hide the input element", function() {
    this.el._input.style.display = 'block';
    this.el._showSpan();
    this.el._input.style.display.should.equal('none');
  });
});
