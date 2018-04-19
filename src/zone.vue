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
  import debounce from 'lodash/debounce'

  import { isVueComponentTag } from './utils/vue'
  import autoRegisterEvents from './mixins/auto-register-events'

  export default {
    name: 'drag-zone',

    mixins: [
      autoRegisterEvents('mounted'),
    ],

    props: {
      'horizontal': Boolean,
      'vertical': Boolean,
    },

    mounted() {
      this.updateChildren()
    },

    data: () => ({
      children: [],
    }),

    computed: {
      isHorizontal() {
        return this.horizontal || !this.vertical
      },

      isVertical() {
        return !this.isHorizontal
      },

      contents() {
        return this.children.filter((child) => isVueComponentTag(child, 'drag-content'))
      },

      handles() {
        return this.children.filter((child) => isVueComponentTag(child, 'drag-handle'))
      },
    },

    methods: {
      updateChildren: debounce(function() {
        this.children = [...this.$children]
      }, 0.01),
    },

    events: {
      childMounted(component) {
        this.updateChildren()
      },

      childDestroyed(component) {
        this.updateChildren()
      },
    },
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
