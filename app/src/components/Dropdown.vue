<template>
  <component :is="as" class="dropdown" v-click-out-side="{ handler: handleClickOutSide }">
    <a class="btn dropdown-toggle" @click.stop="toggle()">
      <slot />
    </a>
    <div
      class="dropdown-menu"
      :class="[{ show: visible_ }, 'dropdown-menu-' + alignment]"
    >
      <a 
        class="dropdown-item"
        v-for="(item, index) in menu"
        :key="index"
        @click="handleItemClick($event, item, index)"
      >
        <icon v-if="isShowCheckIcon(item, index)"
          name="check"
          class="dropdown-item-checked-icon"
        />
        <template v-if="item.text">{{ item.text }}</template>
        <div v-if="item.html" v-html="item.html"></div>    
      </a>
    </div>
  </component> 
</template>

<script>
export default {
  name: 'Dropdown',

  props: {
    type: {
      type: [ String, Boolean ],
      default: false
    },

    selected: Number,

    visible: {
      type: Boolean,
      default: false
    },

    alignment: {
      type: String,
      default: 'left'
    },

    menu: Array,
    
    as: {
      type: String,
      default: 'div'
    }
  },

  data() {
    return {
      visible_: this.visible
    }
  },

  methods: {
    toggle(show) {
      this.visible_ = show !== undefined ? !!show : !this.visible_;
      const event = this.visible_ ? 'show' : 'hide';
      this.$emit(event);
    },

    isShowCheckIcon(item, index) {
      return (this.type === 'select' && index === this.selected) || 
             (item.type === 'check' && item.checked);
    },

    handleClickOutSide($event) {
      $event.stopPropagation();
      this.visible_ && this.toggle(false);
    },

    handleItemClick($event, item) {
      $event.stopPropagation();
      this.toggle(false);
      item.click();
    }
  }
}
</script>

<style lang="scss">
.dropdown-item {
  height: 3rem;
  line-height: 3rem;
  padding: 0 1.5rem 0 2.25rem;
  cursor: pointer;
}

.dropdown-toggle:after {
  content: none; // remove caret
}

.dropdown-item-checked-icon {
  margin-left: -24px;
  margin-right: 8px;
}

</style>