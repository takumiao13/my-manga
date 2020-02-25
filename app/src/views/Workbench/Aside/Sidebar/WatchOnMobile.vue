<template>
  <div class="mobile">
    <div class="topbar">
      <navbar :title="title" />
    </div>
    <div>
      <div class="qrcode-wrapper mb-3 mt-5">
        <qriously class="qrcode" :value="qrcodeValue" :size="140" />
      </div>

      <p class="text-center">
        Scan Qrcode <br/> 
        read on mobile
      </p>

      <hr/>

      <div class="a2hs" v-show="pwaInstallPrompt">
        <img class="a2hs-logo my-3" :src="appLogoPath" />

        <button type="button"
          class="btn btn-outline-secondary"
          :disabled="installed"
          @click="handleA2HS"
        >
          {{ installText }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex';

export default {
  data() {
    return {
      title: {
        content: 'Read on Mobile',
        className: 'navbar-brand-xs'
      },
      appLogoPath: process.env.APP_LOGO,
      installed: this.$platform.isLaunchedFromHS()
    }
  },

  computed: {
    ...mapState('app', ['pwaInstallPrompt']),

    installText(){
      return this.installed ? 'Installed' : 'Add to Home Screen';
    },

    qrcodeValue() {
      const { HOST, PORT } = this.$config.api;
      
      const protocol = this.$platform.isElectron() ? 
        'http:' : 
        window.location.protocol;
      
      // when dev env use location port
      const port = process.env.NODE_ENV === 'development' ?
        window.location.port : PORT;

      return `${protocol}//${HOST}:${port}`
    }
  },

  methods: {
    handleA2HS() {
      // hide our user interface that shows our A2HS button
      // Show the prompt
      this.pwaInstallPrompt.prompt();
      // Wait for the user to respond to the prompt
      this.pwaInstallPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
          this.installed = true;
          console.log('User accepted the A2HS prompt');
          
        } else {
          console.log('User dismissed the A2HS prompt');
        }
      });
    }
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
    height: 158px;
  }
}

.a2hs {
  display: flex;
  flex-direction: column;
  align-items: center;

  .a2hs-logo {
    border-radius: 100%;
    width: 120px;
  }
}
</style>