<template>
  <div class="viewer-loading" :class="{ open: visible }">
    <Spinner 
      class="viewer-loading-spinner" 
      size="lg"
    >
      <p class="text-center">Loading</p>
    </Spinner>
  </div>
</template>

<script>
export default {
  name: 'Loading',

  props: {
    visible: {
      type: Boolean,
      default: false
    }
  }
}
</script>

<style lang="scss">
.viewer-loading {
  position: absolute;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  z-index: -1;
  opacity: 0;
  transition-property: opacity;
  
  .viewer-loading-spinner {
    opacity: 0;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    transition-property: opacity;
    transition-duration: 0s;
    transition-delay: 0s;
  }

  &.open {
    opacity: 1;
    z-index: 1040;
    transition-duration: 0s;

    // delay to show
    .viewer-loading-spinner {
      opacity: 1;
      transition-duration: .2s;
      transition-delay: .5s;
    }
  }
}
</style>