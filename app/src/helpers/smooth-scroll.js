(function(root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(root); // for csj
  } else {
    root.smoothscroll = factory(root); // for Browser
  }
}(this, function(root) {
  var SCROLL_TIME = 468;
  var isScrolling = false;
  var shortcut = {
    top: function() { return 0 },
    bottom: function() {
      return document.body.clientHeight - window.innerHeight
    }
  };

  function scrollTop() {
    return window.pageYOffset || document.documentElement.scrollTop || 
        document.body.scrollTop;
  }

  function scrollLeft() {
    return window.pageXOffset || document.documentElement.scrollLeft ||
        document.body.scrollLeft;
  }

  function offset(elem) {
    var box = elem.getBoundingClientRect();

    return {
      top: box.top + scrollTop() - document.documentElement.clientTop,
      left: box.left + scrollLeft() - document.documentElement.clientLeft
    }
  }

  function step(ctx) {
    var now = +new Date;
    var ratio = (now - ctx.startTime) / SCROLL_TIME;
    // calculate the position.
    var scrollTop = ctx.startTop + (ctx.distance * ratio);

    var isEnd = ctx.distance > 0 ? 
      scrollTop > ctx.endTop :
      scrollTop < ctx.endTop;
      
    if (isEnd) {
      window.scroll(0, ctx.endTop);
      isScrolling = false;
      setTimeout(ctx.callback);
    } else {
      window.scroll(0, scrollTop);
      requestAnimationFrame(function() { step(ctx) });
    }
  }

  function scrollTo(y, callback) {
    var startTop, endTop;
    if (typeof y === 'string' && shortcut[y]) {
      endTop = shortcut[y]();
    } else {
      endTop = +y; // convert to number
    }

    // if now is scrolling ignore this action
    if (!isNaN(endTop) && !isScrolling) {
      startTop = scrollTop();
      isScrolling = true;
      // start loop
      step({
        startTime: +new Date,
        startTop: scrollTop(),
        endTop: endTop,
        distance: endTop - startTop,
        callback: callback
      });
    }
  }

  function scrollBy(y, callback) {
    y = scrollTop() + y;
    return scrollTo(y, callback);
  }

  function scrollToView(selector, callback) {
    var $node = document.querySelector(selector);
    if (!$node) return;

    // get the offset top of node and scroll to it.
    var top = offset($node).top;
    return scrollTo(top, callback);
  }

  return {
    to: scrollTo,
    by: scrollBy,
    toView: scrollToView
  }
}));