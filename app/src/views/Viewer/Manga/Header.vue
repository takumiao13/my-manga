<template>
  <div
    :class="[
      'topbar viewer-topbar fixed-top',
      { 'viewer-autoscrolling': autoScrolling, open: locking }
    ]"
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
    title: {
      type: String
    },

    pager: {
      type: String
    },

    locking: {
      type: Boolean
    },
  
    fullscreen: {
      type: Boolean
    },

    autoScrolling: {
      type: Boolean
    },

    settings: {
      type: Object
    },
  },

  computed: {
    leftBtns() {
      return [{
        icon: 'arrow-left',
        tip: 'Back',
        title: this.title,
        click: () => this.$emit('back'),
        className: 'text-truncate viewer-title'
      }];
    },

    rightBtns() {
      // const { hand, zoom, gaps, pagerInfo } = this.settings;

      const leftHandBack = {
        icon: 'arrow-left',
        tip: 'Back',
        click: () => this.$emit('back'),
        className: 'viewer-back'
      }

      // const menu = [{
      //   zoom: 'width',
      //   text: 'Fit to width'
      // }, {
      //   zoom: 'screen',
      //   text: 'Fit to screen'
      // }].map(item => ({
      //   ...item,
      //   click: () => this.$emit('settings', { zoom: item.zoom })
      // }));

      // const selected = menu.map(item => item.zoom).indexOf(zoom);

      return [
        leftHandBack,
        {
          icon: this.fullscreen ? 'compress' : 'expand',
          tip: 'Fullscreen',
          click: () => this.$emit('fullscreen')
        }, 
        // {
        //   icon: 'page-alt',
        //   tip: 'Page Display',
        //   dropdown: {
        //     props: {
        //       menu: [{
        //         html: `
        //           Hand Mode : 
        //           <strong class="text-primary">
        //             ${hand.toUpperCase()}
        //           </strong>
        //         `,
        //         click: () => {
        //           this.$emit('settings', { 
        //             hand: { left: 'right', right: 'left' }[hand]
        //           });
        //         }
        //       }, {
        //         type: 'check',
        //         checked: gaps,
        //         text: 'Show Gaps Between Pages',
        //         click: () => this.$emit('settings', { gaps: !gaps })
        //       }, {
        //         type: 'check',
        //         checked: pagerInfo,
        //         text: 'Show Pager Info',
        //         click: () => this.$emit('settings', { pagerInfo: !pagerInfo })
        //       }]
        //     }
        //   }
        // }, 
        // {
        //   icon: 'search-plus',
        //   tip: 'Zoom',
        //   dropdown: {
        //     props: {
        //       type: 'select',
        //       selected,
        //       menu
        //     }
        //   }
        // }
      ];
    }
  }
}
</script>