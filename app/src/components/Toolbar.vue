<template>
  <nav class="toolbar navbar">
    <div class="container">
      <div class="row">
        <div v-for="(action, index) in actions"
          class="col text-center"
          :key="index"
          @click="action.click"
        >
          <icon :name="action.icon" />
          <div class="toolbar-action-title">{{ action.title }}</div>
        </div>
      </div>
    </div>
  </nav>
</template>

<script>
export default {
  props: {
    actions: Array
  }
}
</script>

<style lang="scss">
.toolbar.navbar {
  padding: .25rem;
  height: 3rem;

  > .container {
    display: block;
  }

  .col {
    cursor: pointer;
  }

  .toolbar-action-title {
    font-size: 60%;
  }
}
</style>