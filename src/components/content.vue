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
        sizeAttr: null,
        isMinSize: false,
        isMaxSize: false
      }
    },

    methods: {
      getCss(element, attr) {
        const css = document.defaultView.getComputedStyle(element, null)
        return attr ? css[attr] : css
      },

      getSize(element) {
        return element.getBoundingClientRect()[this.zone.isHorizontal ? 'width' : 'height']
      },

      getSizeAttr(type) {
        return `${type}${this.zone.isHorizontal ? 'Width' : 'Height'}`
      },

      getMinSize() {
        if (this.fixed) {
          return this.getSize(this.$el)
        } else {
          let minSize = this.getCss(this.$el, this.getSizeAttr('min'))
          if (minSize === '0px') {
            minSize = 0
          } else if (minSize.includes('%')) {
            minSize = parseFloat(minSize) / 100 * this.getSize(this.$parent.$el)
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
          return this.getSize(this.$el)
        } else {
          let maxSize = this.getCss(this.$el, this.getSizeAttr('max'))
          if (maxSize.includes('%')) {
            maxSize = parseFloat(maxSize) / 100 * this.getSize(this.$parent.$el)
          } else if (maxSize.includes('px')) {
            maxSize = parseFloat(maxSize)
          }
          return maxSize
        }
      }
    },

    computed: {
      size: {
        get() {
          return this.sizeAttr
        },
        set(val) {
          this.sizeAttr = val
        }
      },

      isThreshold() {
        return this.isMinSize || this.isMaxSize
      },

      style() {
        const style = {}
        if (!this.fixed && this.size !== null) {
          if (this.zone.isHorizontal) {
            style.width = this.size + 'px'
          } else {
            style.height = this.size + 'px'
          }
        }
        return style
      },
    }
  }
</script>

<style scoped>
  .drag-content {
    /*display: inline-block;*/

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
