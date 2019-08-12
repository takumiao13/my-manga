<template>
  <div class="data-view">
    <div class="loading-mask" v-show="loading">
      <spinner class="loading-spinner" />
    </div>
    <slot></slot>
    <div class="empty-text" v-show="!loading && empty">
      <icon name="empty" size="48" />
      <br/>
      NO FILES
    </div>
  </div>
</template>

<script>
export default {
  name: 'DataView',

  props: {
    loading: Boolean,
    
    empty: Boolean
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

.empty-text {
  text-align: center;
  font-size: 1rem;
  color: #999;
  position: absolute;
  top: 40%;
  left: 50%;
  transform: translate(-50%, -50%);
}
</style>
