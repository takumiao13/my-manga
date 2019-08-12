<template>
  <div class="qrcode-container" ref="container"></div>
</template>

<script>
import '@/lib/qrcode';
export default {
  name: 'Qrcode',

  props: {
    text: String,
    width: {
      type: Number,
      default: 128
    },
    height: {
      type: Number,
      default: 128
    },
    colorDark: {
      type: Number,
      default: '#000000'
    },
    colorLight: {
      type: Number,
      default: '#ffffff'
    }
  },
  
  mounted() {
    const qrcode = new QRCode(this.$refs.container, {
      text: this.text,
      width: this.width,
      height: this.height,
      colorDark : this.colorDark,
      colorLight : this.colorLight,
      correctLevel : QRCode.CorrectLevel.H
    });
  }
}
</script>

<style>

</style>
