<template>
  <div class="list-nested">
    <div class="list-group list-group-flush">
      <list-item
        v-for="item in data"
        :key="item[props.key]"
        :props="props"
        :item="item"
        :depth="depth"
        :active-item="activeItem"
        @select-item="selectItem"
        @expand-item="expandItem" />
    </div>
  </div>
</template>

<script>
import Vue from 'vue';
import ListItem from './ListItem.vue';
export default {
  components: {
    ListItem
  },

  props: {
    data: {
      type: Array,
      default: () => []
    },

    activeItem: {
      type: Object,
    },

    props: {
      type: Object,
      default: () => ({
        key: 'id',
        label: 'name',
        title: 'name',
        children: 'children',
        className: ''
      })
    },
  },

  provide() {
    return {
      eventHub: this.eventHub
    } 
  },

  data() {
    return {
      depth: 1
    }
  },

  beforeCreate() {
    this.eventHub = new Vue();
  },

  methods: {
    selectItem(item, ctx) {
      this.$emit('selected', item, ctx);
    },

    expandItem(item, ctx) {
      this.$emit('expanded', item, ctx);
    },

    collapseItem(item, ctx) {
      this.$emit('collapsed', item, ctx);
    },

    collapseAll() {
      this.eventHub.$emit('collapsed:all');
    },

    reset() {
      this.eventHub.$emit('reset:all');
    }
  }
}
</script>

<style lang="scss">
.list-nested  {
  .list-group-loading,
  .list-group-error {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: .5rem 0;
  }

  .list-group {
    .list-group-item {
      background: none;
      padding: 0 .75rem;
      border: .5px solid transparent;
    }

    .list-nested-toggle-icon {
      cursor: pointer;
      padding: 0.3rem 0;
      text-align: center;
      position: absolute;
    }

    .list-nested-label {
      cursor: pointer;
      padding: 0.5rem 0;
      margin-left: 2rem;
      font-size: 80%;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }
}
</style>