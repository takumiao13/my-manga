<template>
  <div
    class="topbar viewer-topbar fixed-top"
    :class="{ open: locking }"
  >
    <Navbar
      :left-btns="leftBtns"
      :right-btns="rightBtns"
    />
    <!--
      :title="{ 
        content: pager, 
        className: 'text-center d-none d-md-block'
      }"
    -->
  </div>
</template>

<script>

export default {
  props: {
    title: String,
    pager: String,
    locking: Boolean,
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
          icon: 'level-up-alt',
          tip: 'Detail',
          click: () => this.$emit('detail')
        }
      ];
    }
  }
}
</script>