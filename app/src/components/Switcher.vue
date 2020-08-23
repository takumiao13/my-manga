<template>
  <label class="switch">
    <input type="checkbox" v-model="checkboxValue" >
    <span></span>
  </label>
</template>

<script>
// https://codepen.io/designcouch/pen/sDAvk?__cf_chl_jschl_tk__=c0f4c5f7e49991fc87ae96ea2340a6492dda16c4-1598347255-0-AQOZkE8FGChytsQpWmYDbizRWJN-Ji5n2bX1aAc-geH9B09c_uOM-x0_H2xTQfbXwsp_sKdRdT9I1mofbBk6WdJhojBRtWv6O_L0i07YXfxfo3idh2fmJF5Uk6amj_6KnNWz7sO0nPekPYKG5xXEK3ydHidZjlvFiKyyst0WhFqM_ALZ_DiPcyoEoJHb7Vklnli6tISnar47w_39YcDKcneD2iHLG-vv7W1W3YFzkF2k0GmwBz9IAjO0UFdwOUT6a9E-yboMcOqCyKLeobFpRSUj1_inNS28yrmwvvNlbAhukXjO7CMp-mPZVW7_sWFU3ABBTpvMFNrHA-qIw9foUFOX033uliJ_5SsWTNoFq-qy
export default {
  props: {
    value: {
      required: true,
      type: Boolean
    }
  },
  methods: {
  },
  computed: {
    checkboxValue: {
      get() {
        return this.value;
      },
      set(e) {
        this.$emit('input', e);
      }
    }
  }
};
</script>

<style lang="scss">
$color-success--4: $primary; // #48CE5F;
$color-success--5: $primary; // rgb(64, 189, 85);
$span-animate-time: 0.30s;
$span-animate2-time: 0.15s;

.switch {
  font-size: 1.8rem;
  line-height: 1;
  display: inline-block;
  position: relative;
  margin: 0;
  cursor: pointer;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
  -webkit-tap-highlight-color: transparent;

  &:focus,
  &:active {
    outline: none;
  }
}

.switch input {
  opacity: 0;
  position: absolute;
  border: none;
}

.switch input + span {
  position: relative;
  display: inline-block;
  width: 1.65em;
  height: 1em;
  // background: white;
  background: none;
  box-shadow: inset 0 0 0 0.0625em #e9e9e9;
  border-radius: 0.5em;
  vertical-align: -0.15em;
  transition: all $span-animate-time cubic-bezier(.17,.67,.43,.98);
}

.switch:active input + span,
.switch input + span:active {
  box-shadow: inset 0 0 0 0.73em #e9e9e9;
}

.switch input + span:after {
  position: absolute;
  display: block;
  content: '';
  width: 0.875em;
  height: 0.875em;
  border-radius: 0.4375em;
  top: 0.0625em;
  left: 0.0625em;
  background: white;
  box-shadow: inset 0 0 0 0.03em rgba(0,0,0,0.1),
              0 0 0.05em rgba(0,0,0,0.05),
              0 0.1em 0.2em rgba(0,0,0,0.2);
  transition: all $span-animate2-time ease-out;
}

.switch:active input + span:after,
.switch input + span:active:after {
  width: 1.15em;
}
.switch input:checked + span {
  box-shadow: inset 0 0 0 0.73em $color-success--4;
}
.switch input:checked + span:after {
  left: 0.7125em;
}
.switch:active input:checked + span:after,
.switch input:checked + span:active:after {
  left: 0.4375em;
}

/* accessibility styles */
.switch input:focus + span:after {
    box-shadow: inset 0 0 0 0.03em rgba(0,0,0,0.15),
                0 0 0.05em rgba(0,0,0,0.08),
                0 0.1em 0.2em rgba(0,0,0,0.3);
    background: #fff;
    // background: none;
}
.switch input:focus + span {
    box-shadow: inset 0 0 0 0.0625em #dadada;
}
.switch input:focus:checked + span {
    box-shadow: inset 0 0 0 0.73em $color-success--5;
}
/* reset accessibility style on hover */
.switch:hover input:focus + span:after {
    box-shadow: inset 0 0 0 0.03em rgba(0,0,0,0.1),
                0 0 0.05em rgba(0,0,0,0.05),
                0 0.1em 0.2em rgba(0,0,0,0.2);
    background: #fff;
    // background: none;
}
.switch:hover input:focus + span {
    box-shadow: inset 0 0 0 0.0625em #e9e9e9;
}
.switch:hover input:focus:checked + span {
    box-shadow: inset 0 0 0 0.73em $color-success--5;
}
</style>
