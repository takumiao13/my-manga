<template>
  <navbar
    :left-btns="leftBtns"
    :right-btns="rightBtns"
  />
</template>

<script>
export default {
  props: {
    autoPlaying: Boolean,
    fullscreen: Boolean
  },

  computed: {
    leftBtns() {
      return [{
        icon: this.autoPlaying ? 'stop' : 'play',
        title: this.autoPlaying ? 'Stop' : 'Auto Play',
        click: () => this.$emit('auto-play-change')
      }];
    },

    rightBtns() {
      return [{
        icon: 'cog',
        iconSize: 18,
        tip: 'Settings',
        click: () => this.$emit('settings')
      },{
        icon: this.fullscreen ? 'compress' : 'expand',
        iconSize: 18,
        tip: 'Fullscreen',
        click: () => this.$emit('fullscreen')
      }]
    }
  }
}
</script>
