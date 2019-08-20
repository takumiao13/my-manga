<template>
  <div class="data-view">
    <div class="loading-mask" v-show="loading">
      <spinner class="loading-spinner" />
    </div>
    <slot></slot>
    <div class="empty-text" v-show="!loading && empty && !error">
      <icon name="empty" size="48" />
      <br/>
      NO ITEMS
    </div>
    <div class="error-info" v-if="!loading && error">
      <div class="error-icon mb-3">
        <icon :name="error_.icon" size="48" />
      </div>
      <h4 class="error-title">{{ error_.name }}</h4>
      <p class="error-message">{{ error_.message }}</p>
    </div>
  </div>
</template>

<script>

const DEFAULT_ERROR = {
  icon: 'times-circle',
  name: 'ERROR',
  message: 'An error occurred'
}

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

.loading-mask {
  position: absolute;
  margin: 0;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  transition: opacity .3s;

  .loading-spinner {
    position: absolute;
    top: 40%;
    left: 50%;
    transform: translate(-50%, -50%);
  }
}

.empty-text,
.error-info {
  text-align: center;
  font-size: 1rem;
  color: #999;
  position: absolute;
  top: 40%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.error-info {
  width: 100%;
}

</style>
