<template>
  <div class="viewer-seekbar">
    <div class="viewer-seekbar-tip" v-show="tipShown">
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
        @change="handleChange" 
      />
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
      tipShown: false,
      min: 1,
      value_: this.value, // internal immediate value
    }
  },

  watch: {
    // prop value
    value() {
      this.value_ = this.value;
    },
  },

  methods: {
    handleInput($event) {
      this.value_ = $event.target.value;
      if (!this.tipShown) this.tipShown = true;
    },

    handleChange($event) {
      this.$emit('end', $event.target.value);
    }
  }
}
</script>

<style lang="scss">
@import '../../assets/style/base';

.viewer-seekbar-tip {
  margin: 1rem auto;
  max-width: 100px;
  text-align: center;
  padding: .5rem 0;
}

.viewer-seekbar-container {
  max-width: 100%;
  padding: .5rem .5rem 1rem .5rem;
  margin: 0 auto;

  @include media-breakpoint-up(md) {
    max-width: 600px;
  }

  @include media-breakpoint-up(lg) {
    max-width: 800px;
  }
}
</style>
