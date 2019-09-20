<template>
  <div class="viewer-hand-mode-tip" :class="hand">
    <div class="viewer-hand-left">{{ left }}</div>
    <div class="viewer-hand-mid">
      <h3>Menu</h3>

      <div class="viewer-hand-shortcuts">
        <h4>Shortcuts</h4>
        <dl class="row">
          <dt class="col-12 col-sm-4 pr-0 text-sm-right">
            <template v-if="hand === 'right'">
              <kbd>&larr;</kbd>
              <kbd>&rarr;</kbd>
            </template>
            <template v-if="hand === 'left'">
              <kbd>A</kbd>
              <kbd>D</kbd>
            </template>       
          </dt>
          <dd class="col-12 col-sm-8">Prev / Next Page</dd>

          <dt class="col-12 col-sm-4 pr-0 text-sm-right">
            <template v-if="hand === 'right'">
              <kbd>&uarr;</kbd>
              <kbd>&darr;</kbd>
            </template>
            <template v-if="hand === 'left'">
              <kbd>W</kbd>
              <kbd>S</kbd>
            </template>
          </dt>
          <dd class="col-12 col-sm-8">Scroll</dd>

          <dt class="col-12 col-sm-4 pr-0 text-sm-right">
            <kbd>F11</kbd>
          </dt>
          <dd class="col-12 col-sm-8">Fullscreen Toggle</dd>
        </dl>
      </div>
    </div>
    <div class="viewer-hand-right">{{ right }}</div>
  </div>
</template>

<script>
export default {
  props: {
    open: {
      type: Boolean,
      default: true
    },

    hand: {
      type: String,
      default: 'left'
    }
  },

  computed: {
    left() {
      return (this.hand === 'right' ? 'Prev' : 'Next') + ' Page';
    },

    right() {
      return (this.hand === 'right' ? 'Next' : 'Prev') + ' Page';
    }
  }
}
</script>

<style lang="scss">
@import '../../assets/style/base';

.viewer-hand-mode-tip {
  position: fixed;
  top: 0;
  right: 0;
  left: 0;
  bottom: 0;
  z-index: 1050;
  display: flex;

  kbd {
    padding-left: .8rem;
    padding-right: .8rem;
    
    + kbd {
      margin-left: .25rem;
    }
  }

  > div {
    width: 33.3%;
    display: flex;
    justify-content: center;
    align-items: center;
    color: #fff;
    padding: 0 .5rem;
  }

  > .viewer-hand-mid {
    background: rgba(yellow, .8);
    color: #333;
    flex-direction: column;
  }

  &.right {
    > .viewer-hand-left {
      background: rgba(red, .8);
    }

    > .viewer-hand-right {
      background: rgba(green, .8);
    }
  }

  &.left {
    > .viewer-hand-left {
      background: rgba(green, .8);
    }

    > .viewer-hand-right {
      background: rgba(red, .8);
    }
  }


  @include media-breakpoint-up(md) {
    > .viewer-hand-mid {
      width: 600px;
    }

    > .viewer-hand-left {
      width: calc(50% -  300px);
    }

    > .viewer-hand-right {
      width: calc(50% -  300px);
    }
  }

  @include media-breakpoint-up(lg) {
    > .viewer-hand-mid {
      width: 800px;
    }

    > .viewer-hand-left {
      width: calc(50% -  400px);
    }

    > .viewer-hand-right {
      width: calc(50% -  400px);
    }
  }
}
</style>
