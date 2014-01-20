$.fn.draggableNumber = function(options) {
  return this.each(function() {
    if (!$.data(this, 'draggableNumber')) {
      $.data(this, 'draggableNumber', new DraggableNumber( this ));
    }
  });
};
