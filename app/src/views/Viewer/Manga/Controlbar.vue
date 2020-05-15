<template>
  <navbar
    :left-btns="leftBtns"
    :right-btns="rightBtns"
  />
</template>

<script>
export default {
  props: {
    speed: Number
  },

  data() {
    return {
      scrolling: false
    }
  },

  computed: {
    leftBtns() {
      return [{
        icon: this.scrolling ? 'pause' : 'play',
        title: this.scrolling ? 'Stop' : 'Auto Scroll',
        click: this.autoScrollToggle
      }];
    },

    rightBtns() {
      return [{
        icon: 'minus-circle',
        click: this.slowDown
      }, {
        title: this.speed,
        tip: 'Reset speed',
        click: this.resetSpeed
      }, {
        icon: 'plus-circle',
        click: this.speedUp
      }]
    }
  },

  methods: {
    autoScrollToggle() {
      this.scrolling = !this.scrolling;
      this.$emit('auto-scroll', this.scrolling);
    },

    backward() {

    },

    forward() {

    },

    speedUp() {
      this.$emit('speed', 10);
    },

    slowDown() {
      this.$emit('speed', -10);
    },

    resetSpeed() {
      this.$emit('speed', 0);
    }
  }
}
</script>

<style lang="scss">
@import '../../../assets/style/base';
</style>
