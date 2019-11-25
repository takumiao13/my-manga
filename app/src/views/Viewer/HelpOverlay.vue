<template>
  <div class="viewer-help">

    <div class="viewer-help-topbar">
      <div>
        Set to 
        <strong class="text-primary">
          {{ capitalize(hand) }}
        </strong> 
        Mode
      </div>
    </div>

    <div class="viewer-help-hand" :class="hand">
      <div class="viewer-help-hand-left">
        <p v-html="help.left" />
      </div>
      <div class="viewer-help-hand-mid">
        <p>Menu</p>
      </div>
      <div class="viewer-help-hand-right">
        <p v-html="help.right" />
      </div>
    </div>

    <div class="viewer-help-shortcuts">
      <div class="viewer-help-shortcuts-container">
        <p>Shortcuts</p>
        <hr/>
        <dl class="row">
          <dt class="col-4 pr-0 text-right">
            <template v-if="hand === 'right'">
              <kbd>&larr;</kbd>
              <kbd>&rarr;</kbd>
            </template>
            <template v-if="hand === 'left'">
              <kbd>A</kbd>
              <kbd>D</kbd>
            </template>       
          </dt>
          <dd class="col-8">Prev / Next Page</dd>

          <dt class="col-4 pr-0 text-right">
            <template v-if="hand === 'right'">
              <kbd>&uarr;</kbd>
              <kbd>&darr;</kbd>
            </template>
            <template v-if="hand === 'left'">
              <kbd>W</kbd>
              <kbd>S</kbd>
            </template>
          </dt>
          <dd class="col-8">Scroll</dd>

          <dt class="col-4 pr-0 text-right">
            <kbd>F11</kbd>
          </dt>
          <dd class="col-8">Fullscreen Toggle</dd>

          <dt class="col-4 pr-0 text-right">
            <kbd>F1</kbd>
          </dt>
          <dd class="col-8">Help</dd>
        </dl>
      </div>
    </div>
  </div>
</template>

<script>

// TODO: use filter later
import { capitalize } from '@/helpers/utils';

const HELP = {
  left: {
    left: 'Next &rarr;',
    right: '&larr; Prev'
  },

  right: {
    left: '&larr; Prev',
    right: 'Next &rarr;',
  }
}

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
    help() {
      return HELP[this.hand];
    }
  },

  methods: {
    capitalize,
  }
}
</script>

<style lang="scss">
@import '../../assets/style/base';

.viewer-help {
  position: fixed;
  top: 0;
  right: 0;
  left: 0;
  bottom: 0;
  z-index: 1050;
  background: rgba(0, 0, 0, 0.8);
}

.viewer-help-topbar {
  display: flex;
  overflow: visible;
  height: 3rem;
  border-bottom: .5px solid #eee;
  position: absolute;
  top: 0;
  width: 100%;
  line-height: 3rem;
  justify-content: center;
}

.viewer-help-hand {
  display: flex;
  position: absolute;
  width: 100%;
  top: 3.5rem;
  bottom: .5rem;

  > div {
    width: 33.3%;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    padding: 0 .5rem;
    font-size: 110%;
    
    > p {
      margin-top: -6rem;
    }
  }

  > .viewer-help-hand-left {
    border-right: .5px solid #eee;
  }

  > .viewer-help-hand-right {
    border-left: .5px solid #eee;
  }

  @include media-breakpoint-up(md) {
    > .viewer-help-hand-mid {
      width: 600px;
    }

    > .viewer-help-hand-left {
      width: calc(50% -  300px);
    }

    > .viewer-help-hand-right {
      width: calc(50% -  300px);
    }
  }

  @include media-breakpoint-up(lg) {
    > .viewer-help-hand-mid {
      width: 800px;
    }

    > .viewer-help-hand-left {
      width: calc(50% -  400px);
    }

    > .viewer-help-hand-right {
      width: calc(50% -  400px);
    }
  }
}

.viewer-help-shortcuts {
  position: absolute;
  left: 1rem;
  right: 1rem;
  bottom: 3.5rem;
  z-index: 1050;
  display: block;

  kbd {
    padding-left: .8rem;
    padding-right: .8rem;
    
    + kbd {
      margin-left: .25rem;
    }
  }

  hr {
    border-top: 1px solid #eee;
  }

  .viewer-help-shortcuts-container {
    padding: 1rem;
    background: #333;
    border: .5px solid #eee;
    border-radius: .25rem;
    
    width: 100%;
    max-width: 580px;
    margin: 0 auto;      
  }
}
</style>
