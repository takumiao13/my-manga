<template>
  <div 
    class="backdrop" 
    :class="{ open: visible }" 
    :style="style"
  >
    <slot/>
  </div>
</template>

<script>
export default {
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    lock: {
      type: Boolean,
      default: false
    },
    zIndex: {
      type: Number,
      default: 1400
    },
    bgColor: {
      type: String,
      default: 'black'
    },
    opacity: {
      type: Number,
      default: .3
    },
  },

  computed: {
    style() {
      return {
        zIndex: this.zIndex,
        background: this.bgColor,
        opacity: this.visible
          ? this.opacity
          : 0
      }
    }
  },

  watch: {
    visible(val) {
      this.lock && window.document.body.classList[val ? 'add' : 'remove']('backdrop-lock');
    }
  },

  destroyed() {
    window.document.body.classList.remove('backdrop-lock');
  }
}
</script>

<style lang="scss" scoped>
.backdrop {
  position: fixed;
  top: 0;
  left: 0;

  &.open {
    width: 100vw;
    height: 100vh;
  }
}
</style>

<style lang="scss">
body.backdrop-lock {
  overflow-y: hidden !important; // hide body scroll
  width: 100%;
  height: 100%;
  position: relative;
}
</style>