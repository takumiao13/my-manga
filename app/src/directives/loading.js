import Vue from 'vue';
import Spinner from '@/components/Spinner';
const LoadingSpinner = Vue.extend(Spinner);

export default {
  bind(el, binding) {
    if (!/^(a|r|f|s)/.test(el.style.position)) {
      el.style.position = 'relative';
    }

    const mask = document.createElement('div');
    const spinner = new LoadingSpinner({
      el: document.createElement('div'),
      propsData: {
        size: 'md',
        className: 'loading-spinner'
      }
    });

    mask.classList.add('loading-mask');
    mask.appendChild(spinner.$el);

    el._mask = mask;
    el.appendChild(mask);

    toggle(el, binding.value);
  },
  update(el, binding) {
    toggle(el, binding.value);
  }
}

function toggle(el, value) {
  el._mask.style.display = value.pending ? '' : 'none';
}