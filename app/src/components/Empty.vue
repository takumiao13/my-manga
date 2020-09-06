<template>
  <div class="empty" :class="{ 'empty-full': full }">
    <div>
      <Icon class="empty-icon" name="empty" :size="iconSize" />
    </div>
    {{ text }}
    <slot />
  </div>
</template>

<script>
export default {
  name: 'Empty',
  
  props: {
    text: {
      type: String,
      default: 'NO ITEMS'
    },
    iconSize: {
      type: String,
      default: '48'
    },
    full: {
      type: Boolean,
      default: false
    }
  }
}
</script>

<style lang="scss">
.empty {
  color: #999;
  font-size: 1rem;
  padding: 1rem 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  &.empty-full {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    text-align: center;
  }
}
</style>