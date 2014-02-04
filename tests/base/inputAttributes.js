var should = chai.should();

describe("DraggableNumber input attributes", function() {
  beforeEach(function() {
    this.input = document.createElement("input");
    document.body.appendChild(this.input);
  });

  afterEach(function() {
    document.body.removeChild(this.input);
    delete this.input;
  });

  it("It should be possible to set options with input attributes", function() {
    this.input.setAttribute('data-min', "-17");
    this.input.setAttribute('data-max', "2014");
    this.input.setAttribute('data-dragThreshold', "24");
    var el = new DraggableNumber(this.input);
    el._min.should.equal(-17);
    el._max.should.equal(2014);
    el._dragThreshold.should.equal(24);
    el.destroy();
  });

  it("Defining options should override data attributes", function() {
    this.input.setAttribute('data-min', "-17");
    this.input.setAttribute('data-max', "2014");
    this.input.setAttribute('data-dragThreshold', "24");
    var el = new DraggableNumber(this.input, {
      min: 72,
      max: 1234,
      dragThreshold: 7
    });
    el._min.should.equal(72);
    el._max.should.equal(1234);
    el._dragThreshold.should.equal(7);
    el.destroy();
  });
});
