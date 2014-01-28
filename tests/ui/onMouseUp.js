var should = chai.should();

describe("DraggableNumberElement._onMouseUp", function() {
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

  it("Should set isDragging to false", function() {
    this.el._isDragging = true;
    this.el._onMouseUp(null);
    this.el._isDragging.should.equal(false);
  });

  it("Should display the input if there is no drag", function() {
    this.el._isDragging = false;
    this.el._onMouseUp(null);
    this.el._input.style.display.should.equal('');
    this.el._span.style.display.should.equal('none');
  });

  it("Should remove the body prevent selection", function() {
    document.body.style['user-select'] = 'none';
    this.el._onMouseUp(null);

    document.body.style['user-select'].should.equal('all');
  });
});
