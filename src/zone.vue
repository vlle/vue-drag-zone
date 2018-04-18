<template>
  <div class="drag-zone"
    :class="{
      'horizontal': isHorizontal,
      'vertical': isVertical,
  }">
    <slot></slot>
  </div>

</template>

<script>
  export default {
    name: 'drag-zone',

    props: {
      'horizontal': Boolean,
      'vertical': Boolean,
    },

    computed: {
      isHorizontal() {
        return this.horizontal || !this.vertical
      },

      isVertical() {
        return !this.isHorizontal
      },
    }
  }
</script>

<style scoped>
  .drag-zone {
    position: relative;
    display: flex;
    justify-content: space-between;
  }

  .drag-zone.horizontal {
    flex-direction: row;
  }

  .drag-zone.vertical {
    flex-direction: column;
  }
</style>
