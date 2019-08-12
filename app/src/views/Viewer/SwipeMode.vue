<template>
  <div class="viewer-mode">
    <div 
      class="img-wrapper"
      :style="{ width: current.width + 'px' }">
      <div 
        class="img-inner"
        :style="{ padding:'0 0 ' + (current.height / current.width) * 100 + '%' }">
        <img v-lazy="makeSrc(current)" />
      </div>
    </div>
  </div>
</template>

<script>
import config from '@/config';

export default {
  name: 'SwipeMode',
  props: {
    gallery: Array,
    page: [Number, String]
  },
  computed: {
    current: function() {
      return this.gallery[this.page-1] || {}
    }
  },
  methods: {
    makeSrc(item) {
      if (!item.path) return undefined;
      return `${config.baseURL}img/${encodeURIComponent(item.path)}`;
    }
  }
}
</script>