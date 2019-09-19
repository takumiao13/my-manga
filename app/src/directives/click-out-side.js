let handleOutsideClick;

export default {
  bind(el, binding, vnode) {
    handleOutsideClick = (e) => {
      const { handler, exclude } = binding.value;

      let clickedOnExcludedEl = exclude;
      exclude && exclude.forEach(refName => {

        if (!clickedOnExcludedEl) {
          const excludedEl = vnode.context.$refs[refName];
          clickedOnExcludedEl = excludedEl.contains(e.target);
        }
      })

      // if not contains and not click on excluce element
      if (el !== e.target && !el.contains(e.target) && !clickedOnExcludedEl) {
        handler.call(vnode.context, e);
      }
    }

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);
  },

  unbind() {
    document.removeEventListener('mousedown', handleOutsideClick);
    document.removeEventListener('touchstart', handleOutsideClick);
  }
}