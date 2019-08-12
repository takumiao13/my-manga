<template>
  <div class="side-toolbar">
    <ul>
      <li v-for="(action, index) in actions" :key="index">
        <a class="side-toolbar-action" @click="action.click">
          <icon :name="action.icon" size="26" />
        </a>
      </li>
    </ul>
  </div>
</template>

<script>
export default {
  name: 'SideToolbar',
  
  props: {
    actions: {
      type: Array,
      default: () => [],
      required: true
    }
  }
}
</script>

<style lang="scss">

$side-toolbar-border:     1px solid #dcdcdc !default;
$side-toolbar-bg:         #ddd !default;
$side-toolbar-color:      #333 !default;
$side-toolbar-btn-width:  3rem !default;
$side-toolbar-btn-height: 3rem !default;

// Side Toolbar
.side-toolbar {
  position: fixed;
  bottom: 4rem;
  right: 2rem;
  z-index: 1040;

  > ul {
    list-style: none;
    margin: 0;
    padding: 0;

    > li {
      border: $side-toolbar-border;
      border-radius: 100%;
      background: $side-toolbar-bg;
      transition: .1s ease-in;
    }
  }

  .side-toolbar-action {
    cursor: pointer;
    color: $side-toolbar-color !important;
    width: $side-toolbar-btn-width;
    height: $side-toolbar-btn-height;
    display: flex;
    justify-content: center;
    align-items: center;
    font-weight: 700;
  }
}
</style>