<template>
  <div id="app">
    <notifications 
      class="app-toast" 
      :position="toastPosition"  
    />
    <server-error v-if="error" :error="error" />
    <keep-alive include="Workbench">
      <router-view v-show="!error" />
    </keep-alive>
  </div>
</template>

<script>
import ServerError from '@/views/Error/Server';
import { mapState } from 'vuex';

export default {
  name: 'App',

  components: {
    ServerError
  },

  computed: {
    ...mapState('app', [ 'error', 'size' ]),

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
