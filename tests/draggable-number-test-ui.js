var should = chai.should();

describe("Draggable-number (UI)", function() {
  var input = document.createElement("input");

  describe("DraggableNumberElement.onInputBlur", function() {
    beforeEach(function() {
      document.body.appendChild(input);
      input.value = 10;
      this.el = new DraggableNumber.Element(input);
    });

    afterEach(function() {
      this.el.destroy();
      delete this.el;
      document.body.removeChild(input);
    });

    it("Should update the value based on the input and convert it to float", function() {
      input.value = "42";
      this.el.onInputBlur(null);
      this.el.value.should.equal(42);
    });
  });

  describe("DraggableNumberElement.onMouseDown", function() {
    beforeEach(function() {
      document.body.appendChild(input);
      this.el = new DraggableNumber.Element(input);
    });

    afterEach(function() {
      this.el.destroy();
      delete this.el;
      document.body.removeChild(input);
    });

    it("Should set isDragging to false", function() {
      this.el.isDragging = true;
      this.el.onMouseDown({clientX: 10, clientY: 42});
      this.el.isDragging.should.equal(false);
    });

    it("Should save mouse position in lastMousePosition", function() {
      var position = {clientX: 10, clientY: 42};
      this.el.onMouseDown(position);
      this.el.lastMousePosition.should.deep.equal({x: position.clientX, y: position.clientY * -1});
    });
  });

  describe("DraggableNumberElement.onMouseUp", function() {
    beforeEach(function() {
      document.body.appendChild(input);
      input.style.display = '';
      this.el = new DraggableNumber.Element(input);
    });

    afterEach(function() {
      this.el.destroy();
      delete this.el;
      document.body.removeChild(input);
    });

    it("Should set isDragging to false", function() {
      this.el.isDragging = true;
      this.el.onMouseUp(null);
      this.el.isDragging.should.equal(false);
    });

    it("Should display the input if there is no drag", function() {
      this.el.isDragging = false;
      this.el.onMouseUp(null);
      this.el.input.style.display.should.equal('');
      this.el.span.style.display.should.equal('none');
    });

    it("Should remove the body prevent selection", function() {
      document.body.style['user-select'] = 'none';
      this.el.onMouseUp(null);

      document.body.style['user-select'].should.equal('all');
    });
  });

  describe("DraggableNumberElement.showSpan", function() {
    beforeEach(function() {
      document.body.appendChild(input);
      input.style.display = '';
      this.el = new DraggableNumber.Element(input);
    });

    afterEach(function() {
      this.el.destroy();
      delete this.el;
      document.body.removeChild(input);
    });

    it("Should show the span element", function() {
      this.el.span.style.display = 'none';
      this.el.showSpan();
      this.el.span.style.display.should.equal('');
    });

    it("Should hide the input element", function() {
      this.el.input.style.display = 'block';
      this.el.showSpan();
      this.el.input.style.display.should.equal('none');
    });
  });

  describe("DraggableNumberElement.showInput", function() {
    beforeEach(function() {
      document.body.appendChild(input);
      input.style.display = '';
      this.el = new DraggableNumber.Element(input);
    });

    afterEach(function() {
      this.el.destroy();
      delete this.el;
      document.body.removeChild(input);
    });

    it("Should show the input element", function() {
      this.el.showInput();
      this.el.input.style.display.should.equal('');
    });

    it("Should hide the span element", function() {
      this.el.span.style.display = 'block';
      this.el.showInput();
      this.el.span.style.display.should.equal('none');
    });
  });

  describe("DraggableNumberElement.preventSelection", function() {
    beforeEach(function() {
      document.body.appendChild(input);
      document.body.style['user-select'] = '';
      this.el = new DraggableNumber.Element(input);
    });

    afterEach(function() {
      this.el.destroy();
      delete this.el;
      document.body.style['user-select'] = '';
      document.body.removeChild(input);
    });

    it("Should prevent selection by default", function() {
      this.el.preventSelection();
      document.body.style['user-select'].should.equal('none');
    });

    it("Should remove preventSelection when passed false", function() {
      document.body.style['user-select'] = 'none';
      this.el.preventSelection(false);
      document.body.style['user-select'].should.equal('all');
    });
  });
});
