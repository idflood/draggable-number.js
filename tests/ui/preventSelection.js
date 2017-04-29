var should = chai.should();

describe("DraggableNumberElement.preventSelection", () => {
  var input = document.createElement("input");

  beforeEach(function() {
    document.body.appendChild(input);
    document.body.style['user-select'] = '';
    this.el = new DraggableNumber(input);
  });

  afterEach(function() {
    this.el.destroy();
    delete this.el;
    document.body.style['user-select'] = '';
    document.body.removeChild(input);
  });

  it("Should prevent selection by default", function() {
    this.el._preventSelection();
    document.body.style['user-select'].should.equal('none');
  });

  it("Should remove preventSelection when passed false", function() {
    document.body.style['user-select'] = 'none';
    this.el._preventSelection(false);
    document.body.style['user-select'].should.equal('all');
  });
});
