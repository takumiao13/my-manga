<template>
  <video
    ref="videoPlayer"
    class="video-js vjs-big-play-centered"
  >
    <p class="vjs-no-js">
      To view this video please enable JavaScript, and consider upgrading to a
      web browser that
      <a href="http://videojs.com/html5-video-support/" target="_blank">
        supports HTML5 video
      </a>
    </p>
  </video>
</template>

<script>
import videojs from 'video.js'
import 'video.js/dist/video-js.css'
import 'videojs-hotkeys';

export default {
  props: {
    options: {
      type: Object,
      default() {
        return {};
      }
    }
  },

  // watch: {
  //   options(newVal, oldVal) {
  //     console.log('options', newVal, newVal === oldVal);
  //     this.createPlayer(newVal);
  //   }
  // },

  methods: {
    createPlayer(options) {
      const self = this;

      if (options && !this.player) {
        this.player = videojs(
          this.$refs.videoPlayer, 
          options, 
          function onPlayerReady() {
            this.hotkeys({
              volumeStep: 0.1,
              seekStep: 5,
              enableModifiersForNumbers: false
            });

            //this.userActive(false);

            self.$emit('ready', this);

            this.on('play', function() {
              self.$emit('play');
            });

            this.on('pause', function() {
              self.$emit('pause');
            });

            this.on('useractive', function(event) {
              self.$emit('active');
            });

            this.on('userinactive', function(event) {
              self.$emit('inactive');
            })
        });
      }
    }
  },

  mounted() {
    console.log('mounted');
    this.createPlayer(this.options);
  },

  destroyed() {
    console.log('destroyed');
    if (this.player) {
      this.player.dispose();
      
    }
  }
}
</script>

<style lang="scss">
// when paused show play button
.vjs-paused .vjs-big-play-button,
.vjs-paused.vjs-has-started .vjs-big-play-button {
  display: block;
}
</style>