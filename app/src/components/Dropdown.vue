<template>
  <component :is="as" class="dropdown" v-click-out-side="{ handler: handleClickOutSide }">
    <a class="btn dropdown-toggle" @click="handleToggle">
      <slot />
    </a>
    <div
      class="dropdown-menu dropdown-menu-right"
      :class="{ show: visible_ }"
    >
      <a 
        class="dropdown-item"
        v-for="(item, index) in menus"
        :key="index"
        @click="handleItemClick($event, item)"
      >
        {{ item.text }}    
      </a>
    </div>
  </component> 
</template>

<script>
export default {
  name: 'Dropdown',

  props: {
    visible: {
      type: Boolean,
      default: false
    },

    menus: Array,
    
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
    handleToggle() {
      this.visible_ = !this.visible_;
    },

    handleClickOutSide() {
      this.visible_ = false;
    },

    handleItemClick($event, item) {
      $event.stopPropagation();
      this.visible_ = false;
      item.click();
    }
  }
}
</script>

<style>

</style>