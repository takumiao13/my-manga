<template>
  <div>
    <div class="viewer-settings" :class="{ open: visible }">
      <div class="viewer-settings-header">
        Settings
      </div>

      <!-- Read Mode -->
      <div class="viewer-settings-item">
        <div>Read Mode:</div>
        <div>
          <div
            class="viewer-settings-checkbox" 
            :class="{ 
              selected: mode === 'swipe',
              disabled: mode !== 'swipe' && force
            }" 
            @click="handleReadModeChange('swipe')"
          >
            <Icon name="arrow-square-right" size="30" />
            <small>swipe</small>
          </div>
          <div
            class="viewer-settings-checkbox"
            :class="{ 
              selected: mode === 'scroll',
              disabled: mode !== 'scroll' && force
            }"
            @click="handleReadModeChange('scroll')"
          >
            <Icon name="arrow-square-down" size="30" />
            <small>scroll</small>
          </div>
        </div>
      </div>

      <!-- Page Gaps -->
      <div v-show="mode === 'scroll'" class="viewer-settings-item" >
        <div>Show Gaps:</div>
        <div><Switcher v-model="gaps" /></div>
      </div>

      <!-- Scroll Speed -->
      <div v-show="mode === 'scroll'" class="viewer-settings-item">
        <div>Scroll Speed:</div>
        <div>
          <div class="viewer-settings-input-number">
            <span @click="handleScrollSpeedChange(-10)">
              <Icon name="minus-square" size="26" />
            </span>
            <div>{{ scrollSpeedDisplay }}</div>
            <span @click="handleScrollSpeedChange(10)">
              <Icon name="plus-square" size="26"/>  
            </span>
          </div>
        </div>
      </div>

      <!-- Swipe Effect -->
      <div v-show="mode === $consts.VIEWER_MODE.SWIPE" class="viewer-settings-item">
        <div>Swipe Effect:</div>
        <div>
          <div
            class="viewer-settings-checkbox" 
            :class="{ selected: effect === 'slide' }" 
            @click="effect='slide'"
          >
            Slide
          </div>
          <div
            class="viewer-settings-checkbox" 
            :class="{ selected: effect === 'fade' }" 
            @click="effect='fade'"
          >
            Fade
          </div>
        </div>
      </div>

      <!-- Play Internal -->
      <div v-show="mode === $consts.VIEWER_MODE.SWIPE" class="viewer-settings-item">
        <div>Play Internal:</div>
        <div>
          <div class="viewer-settings-input-number">
            <span @click="handlePlayIntervalChange(-200)">
              <Icon name="minus-square" size="26" />
            </span>
            <div>{{ playIntervalDisplay }}</div>
            <span @click="handlePlayIntervalChange(200)" >
              <Icon name="plus-square" size="26" />  
            </span>
          </div>
        </div>
      </div>

      <!-- Pager Info -->
      <div class="viewer-settings-item">
        <div>Show Pager Info:</div>
        <div><Switcher v-model="pagerInfo" /></div>
      </div>

      <!-- Hand -->
      <div class="viewer-settings-item">
        <div>Hand Mode:</div>
        <div>
          <div
            class="viewer-settings-checkbox" 
            :class="{ selected: hand === 'left' }" 
            @click="hand='left'"
          >
            Left
          </div>
          <div
            class="viewer-settings-checkbox" 
            :class="{ selected: hand === 'right' }" 
            @click="hand='right'"
          >
            Right
          </div>
        </div>
      </div>

      <!-- Quality -->

      <div class="viewer-settings-footer">
        <button
          type="button" 
          class="btn btn-lg btn-block btn-outline-secondary"
          @click.stop="handleFinish"
        >
          SAVE
        </button>
      </div>
    </div>

    <Backdrop lock :visible="backdropVisible" @mousedown.native="$emit('close')" />
  </div>
</template>

<script>
export default {
  props: {
    visible: Boolean,
    settings: Object
  },

  data() {
    return {
      backdropVisible: false,
      force: this.settings.force,
      mode: this.settings.mode,
      pagerInfo: this.settings.pagerInfo,
      hand: this.settings.hand,
      // scroll mode only
      gaps: this.settings.gaps,
      scrollSpeed: this.settings.scrollSpeed,
      // swipe mode only
      effect: this.settings.effect,
      playInterval: this.settings.playInterval
    }
  },

  watch: {
    visible(val) {
      this.backdropVisible = val;
    }
  },

  computed: {
    scrollSpeedDisplay() {
      // TODO: 根据当前 app size 做一些调整
      return (this.scrollSpeed/100).toFixed(1) + 'x';
    },

    playIntervalDisplay() {
      return (this.playInterval/1000).toFixed(1) + 's';
    }
  },

  methods: {
    handleReadModeChange(mode) {
      // disable change mode when forced
      if (this.force && mode !== this.mode) return;
      this.mode = mode;
    },

    handleScrollSpeedChange(val) {
      if (this.scrollSpeed === 50 && val < 0) return;
      if (this.scrollSpeed === 400 && val > 0) return;

      // reset scrollSpeed
      if (val === 0) {
        this.scrollSpeed = 100;
      } else {
        this.scrollSpeed += val;
      }
    },

    handlePlayIntervalChange(val) {
      if (this.playInterval === 1000 && val < 0) return;
      if (this.playInterval === 4000 && val > 0) return;

      // reset playInterval
      if (val === 0) {
        this.playInterval = 2000;
      } else {
        this.playInterval += val;
      }
    },

    handleFinish() {
      const settings = {
        mode: this.mode,
        pagerInfo: this.pagerInfo,
        hand: this.hand
      };

      // addon mode options only
      if (this.mode === this.$consts.VIEWER_MODE.SCROLL) {
        settings.gaps = this.gaps;
        settings.scrollSpeed = this.scrollSpeed;
      } else if (this.mode === this.$consts.VIEWER_MODE.SWIPE) {
        settings.effect = this.effect;
        settings.playInterval = this.playInterval;
      }

      this.$emit('finish', settings);
    }
  }
}
</script>

<style lang="scss" scoped>
@import '@/assets/style/base';

.viewer-settings {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  top: auto;
  transform: translateY(100%);
  z-index: 1500;
  padding-left: .5rem;
  padding-right: .5rem;
  
  @include transition(transform .3s ease-out);

  &.open {
    display: block;
    transform: translateY(0);
  }

  @include media-breakpoint-up(sm) {
    display: none;
    width: 480px;
    left: 50%;
    top: 50%;
    bottom: auto;
    transform: translate(-50%, -50%) !important;
    border-radius: .25rem;
  }
}

.viewer-settings-header {
  padding: 1rem .5rem;
  border-bottom: .5px solid #ccc;

  h5 {
    margin-bottom: 0;
  }
}

.viewer-settings-footer {
  padding: 1rem .5rem;

  .btn {
    border-width: 2px;
  }
}

.viewer-settings-item {
  padding: .75rem .5rem;
  min-height: 64px;
  display: flex;
  align-items: center;
  border-bottom: .5px solid #333;

  > div + div {
    display: flex;
    margin-left: auto;
  }
}

.viewer-settings-checkbox {
  border-width: 1px;
  border-style: solid;
  min-width: 70px;
  padding: .35rem .8rem;
  border-radius: .25rem;
  margin-left: .5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;

  &.selected {
    border-color: $primary;
    color: $primary;
    background: rgba($primary, .1);
  }

  &.disabled {
    cursor: not-allowed;
    opacity: .3;
  }
}

.viewer-settings-input-number {
  display: flex;
  justify-content: center;

  > span {
    cursor: pointer;
  }

  > div {
    text-align: center;
    width: 60px;
  }
}

</style>