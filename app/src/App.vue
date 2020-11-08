<template>
  <div id="app" dark="true">
    <notifications 
      class="app-toast"
      :duration="500"
      :position="toastPosition"
    />
    <notifications 
      class="app-toast app-toast-group-viewer"
      group="viewer"
      :duration="300"
      position="top center"  
    />
    <keep-alive include="Workbench">
      <router-view />
    </keep-alive>
  </div>
</template>

<script>
import { mapState, mapMutations } from 'vuex';

export default {
  name: 'App',

  computed: {
    ...mapState('app', [ 'size' ]),

    toastPosition() {
      return this.size === 'sm' ? 'bottom center' : 'top right';
    }
  },

  methods: {
    ...mapMutations('app', ['setSize'])
  },

  created() {
    this._removeListener = this.$service.media.addListener(evt => {
      this.setSize(evt.$active);
    });
  },

  destroyed() {
    this._removeListener();
  }
}
</script>

<style lang="scss">
#app {
  min-height: 100vh;
}
</style>
