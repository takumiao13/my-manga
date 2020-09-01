<template>
  <navbar
    :left-btns="leftBtns"
    :right-btns="rightBtns"
  />
</template>

<script>
export default {
  props: {
    autoPlaying: Boolean
  },

  computed: {
    leftBtns() {
      return [{
        icon: this.autoPlaying ? 'stop' : 'play',
        title: this.autoPlaying ? 'Stop' : 'Auto Play',
        click: this.togglePlaying
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
    togglePlaying() {
      this.$emit('autoPlayChange');
    }
  }
}
</script>
