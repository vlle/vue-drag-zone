<template>
  <div class="drag-content"
    :class="[
      zone.orientation,
      {'threshold': isThreshold},
    ]"
  :style="style">
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
        sizeProportion_: 1,
        isMinSize: false,
        isMaxSize: false
      }
    },

    computed: {
      sizeProportion: {
        get() {
          return this.sizeProportion_
        },
        set(val) {
          if (!isFinite(val) || typeof val !== 'number') {
            return
          }
          const max = this.zone.contents.length
          this.sizeProportion_ = (val >= max ? max : (val <= 0 ? 0 : val))
        },
      },

      sizeFraction: {
        get() {
          return this.sizeProportion / this.zone.contents.length
        },
        set(val) {
          this.sizeProportion = val * this.zone.contents.length
        },
      },

      sizePercent: {
        get() {
          return this.sizeFraction * 100
        },
        set(val) {
          this.sizeFraction = val / 100
        },
      },

      sizePx: {
        get() {
          return this.zone.getElementSize(this.zone.$el) * this.sizeFraction
        },
        set(val) {
          this.sizeFraction = val / this.zone.getElementSize(this.zone.$el)
        },
      },

      size: {
        get() {
          return this.sizePx
        },
        set(val) {
          this.sizePx = val
        },
      },

      isThreshold() {
        return this.isMinSize || this.isMaxSize
      },

      style() {
        const style = {}
        if (!this.fixed) {
          style['flex-grow'] = this.sizeProportion
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
        this.sizeProportion *= scale
      },
    },
  }
</script>

<style scoped>
  .drag-content {
    display: flex !important;
    flex-wrap: nowrap !important;
    align-items: stretch !important;

    flex-shrink: 1 !important;
    flex-basis: 0 !important;

    position: static;

    overflow: hidden;
  }
</style>
