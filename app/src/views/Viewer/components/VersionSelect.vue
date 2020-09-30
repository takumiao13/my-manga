<template>
  <div class="viewer-version-select">
    <div class="viewer-version-select-container">
      <header>
        Please select a version.
      </header>
      <div class="list-group">
        <div 
          class="list-group-item"
          v-for="item in versions"
          :key="item.path"
          @click.stop="$emit('change', item)"
        >
          {{ item.ver }}
          <Icon name="chevron-right" class="ml-auto" />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    versions: Array
  }
}
</script>

<style lang="scss">
.viewer-version-select {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 1050;
  width: 100%;
  height: 100%;
  overflow-x: hidden;
  overflow-y: auto;
  outline: 0;
  display: flex;
  justify-content: center;
  padding-left: 15px;
  padding-right: 15px;
}

.viewer-version-select-container {
  max-width: 500px;
  width: 100%;
  margin-top: 3rem;

  header {
    text-align: center;
    font-size: 140%;
    padding: 1rem 0;
  }

  .list-group-item {
    cursor: pointer;
    display: flex;
    align-items: center;
  }
}
</style>