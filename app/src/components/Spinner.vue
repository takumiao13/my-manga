<template>
  <div class="spinner">
    <div class="la-ball-clip-rotate" :class="[ size_, className ]">
      <div></div>
    </div>
    <p class="text-center" v-show="tip">{{ tip }}</p>
  </div>
</template>

<script>
const sizeMap = {
  md: 'la-2x',
  lg: 'la-3x'
};

export default {
  props: {
    size: String,
    className: String,
    tip: {
      type: [ String, Boolean ],
      default: false
    }
  },

  computed:{
    size_: function() {
      return sizeMap[this.size] || ''
    }
  }
}
</script>

<style lang="scss">
.la-ball-clip-rotate,
.la-ball-clip-rotate > div {
    position: relative;
    -webkit-box-sizing: border-box;
       -moz-box-sizing: border-box;
            box-sizing: border-box;
}
.la-ball-clip-rotate {
    display: block;
    font-size: 0;
    color: #333;
    margin: 0 auto;
    margin-bottom: 1rem;
}
.la-ball-clip-rotate > div {
    display: inline-block;
    float: none;
    background-color: currentColor;
    border: 0 solid currentColor;
}
.la-ball-clip-rotate {
    width: 32px;
    height: 32px;
}
.la-ball-clip-rotate > div {
    width: 32px;
    height: 32px;
    background: transparent;
    border-width: 2px;
    border-bottom-color: transparent;
    border-radius: 100%;
    -webkit-animation: ball-clip-rotate .75s linear infinite;
       -moz-animation: ball-clip-rotate .75s linear infinite;
         -o-animation: ball-clip-rotate .75s linear infinite;
            animation: ball-clip-rotate .75s linear infinite;
}
.la-ball-clip-rotate.la-sm {
    width: 16px;
    height: 16px;
}
.la-ball-clip-rotate.la-sm > div {
    width: 16px;
    height: 16px;
    border-width: 1px;
}
.la-ball-clip-rotate.la-2x {
    width: 64px;
    height: 64px;
}
.la-ball-clip-rotate.la-2x > div {
    width: 64px;
    height: 64px;
    border-width: 4px;
}
.la-ball-clip-rotate.la-3x {
    width: 96px;
    height: 96px;
}
.la-ball-clip-rotate.la-3x > div {
    width: 96px;
    height: 96px;
    border-width: 6px;
}
/*
 * Animation
 */
@-webkit-keyframes ball-clip-rotate {
    0% {
        -webkit-transform: rotate(0deg);
                transform: rotate(0deg);
    }
    50% {
        -webkit-transform: rotate(180deg);
                transform: rotate(180deg);
    }
    100% {
        -webkit-transform: rotate(360deg);
                transform: rotate(360deg);
    }
}
@-moz-keyframes ball-clip-rotate {
    0% {
        -moz-transform: rotate(0deg);
             transform: rotate(0deg);
    }
    50% {
        -moz-transform: rotate(180deg);
             transform: rotate(180deg);
    }
    100% {
        -moz-transform: rotate(360deg);
             transform: rotate(360deg);
    }
}
@-o-keyframes ball-clip-rotate {
    0% {
        -o-transform: rotate(0deg);
           transform: rotate(0deg);
    }
    50% {
        -o-transform: rotate(180deg);
           transform: rotate(180deg);
    }
    100% {
        -o-transform: rotate(360deg);
           transform: rotate(360deg);
    }
}
@keyframes ball-clip-rotate {
    0% {
        -webkit-transform: rotate(0deg);
           -moz-transform: rotate(0deg);
             -o-transform: rotate(0deg);
                transform: rotate(0deg);
    }
    50% {
        -webkit-transform: rotate(180deg);
           -moz-transform: rotate(180deg);
             -o-transform: rotate(180deg);
                transform: rotate(180deg);
    }
    100% {
        -webkit-transform: rotate(360deg);
           -moz-transform: rotate(360deg);
             -o-transform: rotate(360deg);
                transform: rotate(360deg);
    }
}
</style>