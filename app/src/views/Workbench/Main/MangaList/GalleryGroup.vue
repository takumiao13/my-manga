<template>
  <div class="gallery-area mb-4" v-show="list.length" :data-view-mode="viewMode">
    <div class="area-header">
      <div class="area-header-inner">
        <div class="actions float-right">
          <icon 
            v-if="viewMode == 'grid'"
            name="th"
            size="18"
            @click.native="$emit('view-mode-change', 'list')"
          />
          <icon 
            v-else-if="viewMode == 'list'"
            name="th-list"
            size="18" 
            @click.native="$emit('view-mode-change', 'grid')"
          />
        </div>
        GALLERY
      </div>
    </div>
    <div
      :class="{ 
        'row': viewMode == 'grid',
        'list-group': viewMode == 'list'
      }"
    >
      <div
        :class="{
          'col-4 col-sm-3 col-lg-2 area-item': viewMode === 'grid',
          'list-group-item list-group-item-action': viewMode == 'list',
          'd-none': index === 0 && hideFirstImage,
          active: index === activePage,
        }"
        v-for="(item, index) in list" 
        :key="item.path"
        @click="$emit('item-click', item, index)"
      >
        <div
          v-show="viewMode === 'grid'"
          class="cover"
          :style="$service.image.style(item, 240)"
        >
          <img 
            v-lazy="$service.image.makeSrc({
              path: item.path,
              width: item.width,
              height: item.height,
              thumb: true
            })"
          />
        </div>

        <div v-show="viewMode === 'grid'" class="caption" :title="item.name">
          {{ item.name }}
        </div>

        <div v-show="viewMode == 'list'" class="gallery-row">
          <div class="gallery-row-left">
            <Icon name="file-image" />
          </div>
          <div class="gallery-row-main">
            <div class="gallery-name">
              {{ item.name }}
            </div>
            <div class="gallery-image-size text-muted">
              {{ item.width }} x {{ item.height }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    viewMode: String,
    list: Array,
    activePage: Number,
    hideFirstImage: Boolean
  }
}
</script>

<style lang="scss" scoped>
@import '@/assets/style/base';

.gallery-area {
  
  &[data-view-mode="grid"] {
    .area-header-inner {
      border-bottom: .5px solid;  
    }
  }
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

  // 1/8
  .area-item {    
    @include media-breakpoint-up(xl) {
      flex: 0 0 12.5%;
      max-width: 12.5%;
    }
  }

  .gallery-row {
    display: flex;

    > .gallery-row-left{
      .svg-icon {
        margin-left: -.25rem;
        margin-top: .5rem;
        width: 24px;
        height: 24px;
      }
    }

    > .gallery-row-main {
      display: flex;
      flex-direction: column;
      flex: 0 1 100%;
      max-width: 100%;
      min-width: 0; // !! fix text-truncate expand outer width
      padding-left: .5rem;
    }

    .gallery-name,
    .gallery-image-size {
      display: block;
    }

    .gallery-name {
      @include text-truncate;
    }

    .gallery-image-size {
      font-size: 80%;
    }

    @include media-breakpoint-up(lg) {
      > .gallery-row-left {
        .svg-icon {
          margin-top: .25rem;
          padding-right: 0;
          width: 18px;
          height: 18px;
        }
      }

      > .gallery-row-main {
        flex-direction: row;
      }

      .gallery-name,
      .gallery-image-size {
        display: block;
        padding: 0 .25rem;
      }

      .gallery-name {
        flex: 0 1 100%;
        max-width: 100%;
        order: 1;
      }

      .gallery-image-size {
        text-align: right;
        min-width: 150px;
        font-size: 90%;
        order: 3;
      }
    }
  }
}
</style>