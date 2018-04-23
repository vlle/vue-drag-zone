<template>
  <div class="drag-content"
    :class="{
      'threshold': isThreshold,
      'horizontal': zone.isHorizontal,
      'vertical': zone.isVertical,
  }" :style="style">
    <slot></slot>
  </div>
</template>

<script>
  import { getCss } from '@/utils/css'
  import childOfDragZone from '@/mixins/child-of-drag-zone'

  export default {
    name: 'drag-content',

    mixins: [
      childOfDragZone,
    ],

    props: {
      fixed: {
        type: [Number, Boolean],
        default: false
      }
    },

    data() {
      return {
        size_: null,
        isMinSize: false,
        isMaxSize: false
      }
    },

    computed: {
      size: {
        get() {
          return this.size_
        },
        set(val) {
          this.size_ = val
        }
      },

      isThreshold() {
        return this.isMinSize || this.isMaxSize
      },

      style() {
        const style = {}
        if (!this.fixed && this.size !== null) {
          style[this.zone.sizeAttr] = this.size + 'px'
        }
        return style
      },
    },

    methods: {
      getMinSize() {
        if (this.fixed) {
          return this.zone.getElementSize(this.$el)
        } else {
          let minSize = getCss(this.$el, this.zone.getSizeAttr('min'))
          if (minSize === '0px') {
            minSize = 0
          } else if (minSize.includes('%')) {
            minSize = parseFloat(minSize) / 100 * this.zone.getElementSize(this.$parent.$el)
          } else if (minSize.includes('px')) {
            minSize = parseFloat(minSize)
          }
          if (minSize < 0) {
            minSize = 0
          }
          return minSize
        }
      },

      getMaxSize() {
        if (this.fixed) {
          return this.zone.getElementSize(this.$el)
        } else {
          let maxSize = getCss(this.$el, this.zone.getSizeAttr('max'))
          if (maxSize.includes('%')) {
            maxSize = parseFloat(maxSize) / 100 * this.zone.getElementSize(this.$parent.$el)
          } else if (maxSize.includes('px')) {
            maxSize = parseFloat(maxSize)
          }
          return maxSize
        }
      },

      scale(scale) {
        let size = this.size
        if (size === null) {
          size = this.zone.getElementSize(this.$el)
        }
        size *= scale
        this.size = size
      },
    },
  }
</script>

<style scoped>
  .drag-content {
    padding: 0 !important;
    margin: 0 !important;

    position: static;
    display: block;

    background: rgba(0, 0, 0, 0.1);

    overflow: hidden;
  }

  .drag-content.horizontal {
    height: 100%;
  }

  .drag-content.vertical {
    width: 100%;
  }
</style>
