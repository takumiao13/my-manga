<template>
  <div id="app">
    <notifications 
      class="app-toast" 
      :position="toastPosition"  
    />
    <keep-alive include="Workbench">
      <router-view />
    </keep-alive>
  </div>
</template>

<script>
import { mapState } from 'vuex';

export default {
  name: 'App',

  computed: {
    ...mapState('app', [ 'size' ]),

    toastPosition() {
      return this.size === 'sm' ? 'bottom center' : 'top right';
    }
  }
}
</script>

<style lang="scss">
#app {
  min-height: 100vh;
}
</style>
