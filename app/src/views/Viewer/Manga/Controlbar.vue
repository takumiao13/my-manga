<template>
  <navbar
    :left-btns="leftBtns"
    :right-btns="rightBtns"
  />
</template>

<script>
export default {
  props: {
    autoScrolling: Boolean
  },

  computed: {
    leftBtns() {
      return [{
        icon: this.autoScrolling ? 'stop' : 'play',
        title: this.autoScrolling ? 'Stop' : 'Auto Play',
        click: this.autoScrollToggle
      }];
    },

    rightBtns() {
      return [{
        icon: 'cog',
        iconSize: 20,
        click: () => this.$emit('settings')
      }]
    }
  },

  methods: {
    autoScrollToggle() {
      this.$emit('autoPlayChange');
    }
  }
}
</script>
