var should = chai.should();

describe("Draggable-number (Base)", function() {
  var input = document.createElement("input");
  var input2 = document.createElement("input");

  describe("DraggableNumberElement.dragThreshold", function() {
    beforeEach(function() {
      document.body.appendChild(input);
      this.el = new DraggableNumber(input);
    });

    afterEach(function() {
      this.el.destroy();
      delete this.el;
      document.body.removeChild(input);
    });

    it("By default dragThreshold should be 10", function() {
      this.el._dragThreshold.should.equal(10);
    });

    it("DragThreshold should be modifiable from options", function() {
      this.el.destroy();
      this.el = new DraggableNumber(input, {dragThreshold: 42});
      this.el._dragThreshold.should.equal(42);
    });
  });

  describe("DraggableNumberElement.min/max", function() {
    beforeEach(function() {
      document.body.appendChild(input);
      this.el = new DraggableNumber(input);
    });

    afterEach(function() {
      this.el.destroy();
      delete this.el;
      document.body.removeChild(input);
    });

    it("By default min should be -Infinity and max Infinity", function() {
      this.el._min.should.equal(-Infinity);
      this.el._max.should.equal(Infinity);
    });

    it("Min/max should be modifiable from options", function() {
      this.el.destroy();
      this.el = new DraggableNumber(input, {min: 7, max: 100});
      this.el._min.should.equal(7);
      this.el._max.should.equal(100);
    });

    it("Setting the value should keep it between min/max", function() {
      this.el.destroy();
      this.el = new DraggableNumber(input, {min: 7, max: 100});
      this.el.set(-42);
      this.el.get().should.equal(7);
      this.el.set(2415);
      this.el.get().should.equal(100);
    });
  });

  describe("DraggableNumberElement.getLargestDelta", function() {
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

  describe("DraggableNumberElement.getNumberOffset", function() {
    beforeEach(function() {
      document.body.appendChild(input);
      this.el = new DraggableNumber(input);
    });

    afterEach(function() {
      this.el.destroy();
      delete this.el;
      document.body.removeChild(input);
    });

    it("Should return 1 if delta is positive and there is no modifier", function() {
      var result = this.el._getNumberOffset(1, DraggableNumber.MODIFIER_NONE);
      result.should.equal(1);
    });

    it("Should return -1 if delta is negative and there is no modifier", function() {
      var result = this.el._getNumberOffset(-21, DraggableNumber.MODIFIER_NONE);
      result.should.equal(-1);
    });

    it("Should return 10 if delta is positive and there is a large modifier", function() {
      var result = this.el._getNumberOffset(17, DraggableNumber.MODIFIER_LARGE);
      result.should.equal(10);
    });

    it("Should return -10 if delta is negative and there is a large modifier", function() {
      var result = this.el._getNumberOffset(-1, DraggableNumber.MODIFIER_LARGE);
      result.should.equal(-10);
    });

    it("Should return 0.1 if delta is positive and there is a small modifier", function() {
      var result = this.el._getNumberOffset(19, DraggableNumber.MODIFIER_SMALL);
      result.should.equal(0.1);
    });

    it("Should return -0.1 if delta is negative and there is a small modifier", function() {
      var result = this.el._getNumberOffset(-142, DraggableNumber.MODIFIER_SMALL);
      result.should.equal(-0.1);
    });
  });

  describe("DraggableNumberElement.set and get", function() {
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

  describe("DraggableNumberElement.hasMovedEnough", function() {
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
});
