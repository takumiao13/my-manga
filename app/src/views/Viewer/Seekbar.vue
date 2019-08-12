<template>
  <div class="viewer-seekbar">
    <div class="viewer-seekbar-tips" v-show="shouldTipsShown">
      <strong>{{ value_ }}</strong> / {{ max }}
    </div>  
    <div class="viewer-seekbar-container">
      <input
        type="range"
        class="simple-slider" 
        :value="value_"
        :min="min"
        :max="max"
        @input="handleInput"
        @change="handleChange" />
    </div>
  </div>
</template>

<script>
export default {
  props: {
    value: [Number, String],
    max: [Number, String]
  },

  data() {
    return {
      shouldTipsShown: false,
      value_: this.value, // internal immediate value
      min: 1
    }
  },

  watch: {
    // prop value
    value(newVal, oldVal) {
      this.value_ = this.value;
    },
  },

  methods: {
    handleInput: function($event) {
      this.value_ = $event.target.value;
      if (!this.shouldTipsShown) this.shouldTipsShown = true;
    },

    handleChange: function($event) {
      this.$emit('end', $event.target.value);
    }
  }
}
</script>

<style lang="scss">
@import '../../assets/style/base';

.viewer-seekbar {
  .viewer-seekbar-tips {
    margin: 1rem auto;
    max-width: 100px;
    text-align: center;
    padding: .5rem 0;
    background: rgba(#000, .8);
  }

  .viewer-seekbar-container {
    max-width: 100%;
    padding: .5rem .5rem 1rem .5rem;
    margin: 0 auto;
    background: rgba(#000, .8);

    @include media-breakpoint-up(md) {
      max-width: 600px;
    }

    @include media-breakpoint-up(lg) {
      max-width: 800px;
    }
  }
}
</style>
