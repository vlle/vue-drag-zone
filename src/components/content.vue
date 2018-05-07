<template>
  <div class="drag-content"
    :class="[
      zone.orientation,
      {
        'fixed': isFixed,
        'threshold': isThreshold,
      },
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
      initialProportion: {
        type: Number,
        default: 1,
      },

      fixed: {
        type: [Number, Boolean],
        default: false,
      },

      minSize: {
        type: String,
        default: undefined,
      },

      maxSize: {
        type: String,
        default: undefined,
      },
    },

    created() {
      this.resetSize()
      this.initialized = true
    },

    data() {
      return {
        $_sizeProportion: undefined,
        initialized: false,
        isMinSize: false,
        isMaxSize: false
      }
    },

    computed: {
      isFixed() {
        return this.fixed && this.initialized
      },

      sizeProportion: {
        get() {
          return this.$data.$_sizeProportion
        },
        set(val) {
          if (this.isFixed || !isFinite(val) || typeof val !== 'number') {
            return
          }
          const max = this.zone.contents.length
          this.$data.$_sizeProportion = (val >= max ? max : (val <= 0 ? 0 : val))
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

        style['flex-grow'] = this.sizeProportion
        if (this.minSize !== undefined) style['min-' + this.zone.sizeAttr] = this.minSize
        if (this.maxSize !== undefined) style['max-' + this.zone.sizeAttr] = this.maxSize

        return style
      },
    },

    methods: {
      getMinSize() {
        if (this.isFixed) {
          return this.zone.getElementSize(this.$el)

        } else {
          let minSize = getCss(this.$el, this.zone.getSizeAttr('min'))

          if (minSize === '0px') {
            minSize = 0
          } else if (minSize.includes('%')) {
            minSize = parseFloat(minSize) / 100 * this.zone.getElementSize(this.zone.$el)
          } else if (minSize.includes('px')) {
            minSize = parseFloat(minSize)
          }

          if (minSize < 0 || typeof minSize !== 'number') {
            minSize = 0
          }

          return minSize
        }
      },

      getMaxSize() {
        if (this.isFixed) {
          return this.zone.getElementSize(this.$el)

        } else {
          let maxSize = getCss(this.$el, this.zone.getSizeAttr('max'))

          if (maxSize.includes('%')) {
            maxSize = parseFloat(maxSize) / 100 * this.zone.getElementSize(this.zone.$el)
          } else if (maxSize.includes('px')) {
            maxSize = parseFloat(maxSize)
          }

          if (typeof maxSize !== 'number') {
            maxSize = undefined
          }

          return maxSize
        }
      },

      resetSize() {
        this.sizeProportion = this.initialProportion
      },

      scale(scale) {
        this.sizeProportion *= scale
      },
    },
  }
</script>

<style scoped>
  .drag-content {
    flex-shrink: 1 !important;
    flex-basis: 0% !important;

    overflow: hidden;
  }
</style>
