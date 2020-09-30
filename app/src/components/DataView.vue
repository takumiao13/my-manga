<template>
  <div class="data-view">
    <div class="data-view-loading-mask" :class="{ open: loading }">
      <Spinner class="data-view-loading-spinner" v-bind="spinner">
        <slot name="spinner-tip" />
      </Spinner>
    </div>

    <slot />

    <div class="data-view-container" v-show="!loading && error && !error.warn">
      <div>
        <Icon :name="error_.icon" size="48" />
      </div>
      <h4>{{ error_.name }}</h4>
      <p>{{ error_.message }}</p>
    </div>
  </div>
</template>

<script>

const DEFAULT_ERROR = {
  icon: 'times-circle',
  name: 'ERROR',
  message: 'An error occurred'
};

export default {
  name: 'DataView',

  props: {
    loading: Boolean,

    error: Object,
  
    spinner: Object
  },

  computed: {
    error_() {
      return Object.assign({}, DEFAULT_ERROR, this.error || {})
    }
  }
}
</script>

<style lang="scss">
.data-view {
  position: relative;
}

.data-view-loading-mask {
  position: absolute;
  margin: 0;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: -1;
  opacity: 0;
  transition-property: opacity;

  .data-view-loading-spinner {
    position: absolute;
    top: 40%;
    left: 50%;
    transform: translate(-50%, -50%);
    opacity: 0;
    transition-property: opacity;
    transition-duration: 0s;
    transition-delay: 0s;
  }

   &.open {
    opacity: 1;
    z-index: 1040;
    transition-duration: 0s;

    .data-view-loading-spinner {
      opacity: 1;
      transition-duration: .2s;
      transition-delay: .5s;
    }
  }
}

.data-view-container {
  position: absolute;
  top: 40%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  font-size: 1rem;
  color: #999;
}
</style>
