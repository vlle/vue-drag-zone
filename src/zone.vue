<template>
  <div class="drag-zone"
    :class="{
      'horizontal': horizontal,
      'vertical': !horizontal,
  }">
    <slot></slot>
  </div>

</template>

<script>
  export default {
    name: 'drag-zone',
    props: {
      options: {
        type: Object,
        default() {
          return {
            direction: 'horizontal'
          }
        }
      }
    },
    computed: {
      horizontal() {
        return this.options.direction === 'horizontal'
      }
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
