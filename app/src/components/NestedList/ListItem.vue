<template>
  <div 
    class="list-nested-item" 
    :class="[ {open: isOpen}, itemClassName ]"
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
        @click="toggle"
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
    <div class="list-group-loading" v-show="isLoading">
      <spinner />
    </div>
    <div class="list-group" v-show="isOpen && !isLoading" v-if="isBranch">
      <list-item
        v-for="item in item[props.children]"
        :key="item[props.key]"
        :props="props"
        :item="item"
        :depth="depth+1"
        :active-item="activeItem"
        @expand-item="handleExpandItem"
        @select-item="handleSelectItem"
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

  data() {
    return {
      isOpen: false,
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
      return 'chevron-' + (['right', 'down'][+this.isOpen]);
    },

    isLoading() {
      return this.status === 'pending';
    }
  },

  methods: {
    toggle() {
      if (this.isBranch) {
        this.isOpen = !this.isOpen
        if (this.isOpen) {
          this.$emit('expand-item', this.item, this);
        }
      }
    },

    selectItem() {
      this.$emit('select-item', this.item, this);
    },

    handleSelectItem(item, ctx) {
      this.$emit('select-item', item, ctx);
    },

    handleExpandItem(item, ctx) {
      this.$emit('expand-item', item, ctx);
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
    }
  }
}
</script>