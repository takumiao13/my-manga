import FastClick from 'fastclick'

const needsClick = FastClick.prototype.needsClick;

// now conflict with videojs
FastClick.prototype.needsClick = function(target) {
  if (/\bvjs/.test(target.className)) {
    return true;
  }

  return needsClick.call(this, target);
}

export default FastClick;
