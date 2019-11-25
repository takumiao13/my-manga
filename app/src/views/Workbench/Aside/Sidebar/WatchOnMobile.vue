<template>
  <div class="watch-on-mobile">
    <div class="topbar">
      <navbar :title="title" />
    </div>
    <div>
      qrcode in this
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      title: {
        content: 'Watch on Mobile',
        className: 'navbar-brand-xs'
      },
    }
  }
}
</script>

<style>

</style>