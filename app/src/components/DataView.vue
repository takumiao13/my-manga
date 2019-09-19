<template>
  <div class="data-view">
    <div class="data-view-loading-mask" v-show="loading">
      <spinner class="data-view-loading-spinner" tip="Loading" />
    </div>

    <slot></slot>

    <div class="data-view-container" v-show="!loading && empty && !error">
      <div class="mb-3">
        <icon name="empty" size="48" />
      </div>
      NO ITEMS
    </div>

    <div class="data-view-container" v-show="!loading && error && !error.warn">
      <div class="mb-3">
        <icon :name="error_.icon" size="48" />
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
    
    empty: Boolean,
    
    error: Object,
  },

  computed: {
    error_() {
      return Object.assign({}, DEFAULT_ERROR, this.error || {})
    }
  }
}
</script>

<style lang="scss" scoped>
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
  transition: opacity .3s;
}

.data-view-loading-spinner {
  position: absolute;
  top: 40%;
  left: 50%;
  transform: translate(-50%, -50%);
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
