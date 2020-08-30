<template>
  <div class="gallery-area mb-4" v-show="list.length" data-view-mode="list">
    <div class="area-header">
      <div class="area-header-inner">
        GALLERY
      </div>
    </div>
    <div class="row">
      <div 
        class="col-4 col-sm-3 col-xl-2 area-item"
        :class="{ 'd-none': index === 0 && hideFirstImage }"
        v-for="(item, index) in list" 
        :key="item.path"
      >
        <div class="cover"
          :style="$service.image.style(item, 240)"
          @click="$emit('item-click', item, index)">
          <img v-lazy="$service.image.makeSrc({
            path: item.path,
            width: item.width,
            height: item.height,
            thumb: true
          })" />
        </div>

        <div class="caption" :title="item.name">{{ item.name }}</div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    list: Array,
    hideFirstImage: Boolean
  }
}
</script>

<style lang="scss" scoped>
@import '../../../../assets/style/base';

.gallery-area {
  .row {
    margin-top: -1px;
    padding: .5rem .5rem;
    border-width: .5px 0;
    border-style: solid;

    @include media-breakpoint-up(md) {
      margin-left: 0;
      margin-right: 0;
      border-width: .5px;
    }
  }

  .cover {
    cursor: pointer;
    transform: translateY(-50%);
    top: 50%;
    overflow: hidden;
  }

  .caption {
    top: 100%;
    text-align: center;
    overflow: hidden;
    word-break: break-all;
    word-wrap: break-word;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  }
}
</style>