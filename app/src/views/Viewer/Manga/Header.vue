<template>
  <div
    class="topbar viewer-topbar fixed-top"
    :class="{ open: locking }"
  >
    <Navbar
      :title="{ 
        content: pager, 
        className: 'text-center d-none d-md-block'
      }"
      :left-btns="leftBtns"
      :right-btns="rightBtns"
    />
  </div>
</template>

<script>

export default {
  props: {
    title: String,
    pager: String,
    locking: Boolean,
    fullscreen: Boolean,
    settings: Object,
    chapterlistVisible: Boolean
  },

  computed: {
    leftBtns() {
      return [{
        icon: 'arrow-left',
        tip: 'Back',
        title: this.title,
        className: 'text-truncate viewer-title',
        click: () => this.$emit('back')
      }];
    },

    rightBtns() {
      const leftHandBack = {
        icon: 'arrow-left',
        tip: 'Back',
        className: 'viewer-back',
        click: () => this.$emit('back')
      };

      return [
        leftHandBack,
        this.chapterlistVisible ? {
          icon: 'list-alt',
          tip: 'Chapters',
          click: () => this.$emit('chapterlist:show')
        } : null,
        {
          icon: this.fullscreen ? 'compress' : 'expand',
          tip: 'Fullscreen',
          click: () => this.$emit('fullscreen')
        }   
      ];
    }
  }
}
</script>