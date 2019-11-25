<template>
  <div class="mobile">
    <div class="topbar">
      <navbar :title="title" />
    </div>
    <div>
      <div class="qrcode-wrapper my-5">
        <qriously class="qrcode" :value="qrcodeValue" :size="160" />
      </div>

      <p class="text-center">
        Scan Qrcode <br/> 
        watch on mobile
      </p>
    </div>
  </div>
</template>

<script>
import config from '@/config';
import platform from '@/helpers/platform';

export default {
  data() {
    return {
      title: {
        content: 'Watch on Mobile',
        className: 'navbar-brand-xs'
      }
    }
  },

  computed: {
    qrcodeValue() {
      const { host, port } = config;
      const protocol = platform.isElectron() ? 'http:' : window.location.protocol;
      return `${protocol}//${host}:${port}`
    },
  }
}
</script>

<style lang="scss" scoped>
.qrcode-wrapper {
  display: flex;
  justify-content: center;

  .qrcode {
    background: #fff;
    padding: .5rem;
    border: 1px solid #ddd;
  }
}
</style>