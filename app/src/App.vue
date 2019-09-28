<template>
  <div id="app">
    <server-error v-if="error" :error="error" />
    <keep-alive include="MainInterface">
      <router-view v-show="!error" />
    </keep-alive>
  </div>
</template>

<script>
import ServerError from '@/views/Error/ServerError';
import { mapState } from 'vuex';

export default {
  name: 'App',

  components: {
    ServerError
  },

  computed: {
    ...mapState('app', [ 'error' ]),
  }
}
</script>

<style lang="scss">
#app {
  min-height: 100vh;
}
</style>
