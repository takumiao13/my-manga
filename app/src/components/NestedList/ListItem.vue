<template>
  <div 
    class="list-nested-item" 
    :class="[ {open: open}, itemClassName ]"
  >
    <div 
      class="list-group-item" 
      :class="{ active: item === activeItem }"
      :style="{ 'padding-left': indent + 'rem' }"
    >

      <span
        class="list-nested-toggle-icon" 
        :style="{
          width: indent + 2 + 'rem',
          'margin-left': - indent + 'rem',
          'padding-left': indent + 'rem'
        }"
        @click="toggleItem()"
      >
        <icon v-if="isBranch" :name="toggleIcon" />
      </span>

      <div class="list-nested-label" 
        @click="selectItem" 
        :title="item[props.title]"
        v-html="itemLabel"  
      >
      </div>
    </div>
    <div class="list-group-loading" v-show="loading">
      <spinner />
    </div>
    <div class="list-group-error" v-show="open && error">
      <icon name="folder-items" size="32" />
    </div>
    <div class="list-group" v-show="open && !error" v-if="isBranch">
      <list-item
        v-for="item in item[props.children]"
        :key="item[props.key]"
        :props="props"
        :item="item"
        :depth="depth+1"
        :active-item="activeItem"
        @select-item="handleSelectItem"
        @expand-item="handleExpandItem"
        @collapse-item="handleCollapseItem"
      ></list-item>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ListItem',

  props: {
    item: Object,
    depth: Number,
    activeItem: Object,
    collapsed: Boolean,
    props: {
      type: Object,
      default: () => ({
        key: 'id',
        label: 'name',
        title: 'name',
        children: 'children',
        className: ''
      })
    }
  },

  inject: ['eventHub'],

  data() {
    return {
      open: false,
      status: '',
      indent: .8 * (this.depth-1)
    }
  },

  computed: {
    itemLabel() {
      if (typeof this.props.label === 'function') {
        return this.props.label(this.item, this.props);
      } else {
        return this.item[this.props.label];
      }
    },

    itemClassName() {
      if (typeof this.props.className === 'function') {
        return this.props.className(this.item, this.props);
      } else {
        return this.item[this.props.className];
      }
    },

    isBranch() {
      if (typeof this.props.isBranch === 'function') {
        return this.props.isBranch(this.item, this.props);
      } else {
        return this.item[this.props.children].length;
      }
    },

    toggleIcon() {
      return 'chevron-' + (['right', 'down'][+!!this.open]);
    },

    loading() {
      return this.status === 'pending';
    },

    error() {
      return this.status === 'error';
    }
  },

  created() {
    this._collapse = () => this.toggleItem(false);
    this._reset = () => {
      this.status = '';
      this.open = false;
    };
    this.eventHub.$on('collapsed:all', this._collapse);
    this.eventHub.$on('reset:all', this._reset);
  },

  destroyed() {
    this.eventHub.$off('collapsed:all', this._collapse);
    this.eventHub.$off('reset:all', this._reset);
  },

  methods: {
    toggleItem(_open) {
      if (this.isBranch) {
        this.open = _open !== void 0 ? _open : !this.open;
        if (this.open) {
          this.$emit('expand-item', this.item, this);
        } else {
          this.$emit('collapse-item', this.item, this);
        }
      }
    },

    selectItem() {
      this.$emit('select-item', this.item, this);
    },

    setStatus(status) {
      // @XXX maybe use debounce function
      if (this._timer) {
        clearTimeout(this._timer);
        this._timer = null;
      }

      this._timer = setTimeout(() => {
        this.status = status;
      }, 300);
    },

    getStatus() {
      return this.status;
    },

    // just forward emit events
    handleSelectItem(item, ctx) {
      this.$emit('select-item', item, ctx);
    },

    handleExpandItem(item, ctx) {
      this.$emit('expand-item', item, ctx);
    },

    handleCollapseItem(item, ctx) {
      this.$emit('collapse-item', item, ctx);
    },
  }
}
</script>