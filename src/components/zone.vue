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

  import { isVueComponentTag } from '@/utils/vue'
  import autoRegisterEvents from '@/mixins/auto-register-events'

  export default {
    name: 'drag-zone',

    mixins: [
      autoRegisterEvents.mounted(),
    ],

    props: {
      'horizontal': Boolean,
      'vertical': Boolean,
    },

    mounted() {
      this.updateChildrenList()
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

      // Name of the size attribute
      // (depending on the zone's orientation)
      //
      sizeAttr() {
        return this.isHorizontal ? 'width' : 'height'
      },

      sizeAttrCamelCase() {
        return this.sizeAttr
          ? this.sizeAttr[0].toUpperCase() + this.sizeAttr.substr(1)
          : ''
      },

      contents() {
        return this.children.filter((child) => isVueComponentTag(child, 'drag-content'))
      },

      handles() {
        return this.children.filter((child) => isVueComponentTag(child, 'drag-handle'))
      },
    },

    methods: {
      updateChildrenList: debounce(function() {
        this.children = [...this.$children]
      }, 10),

      // Get size
      //
      getSizeAttr(type) {
        return type + this.sizeAttrCamelCase
      },

      // Get element's size
      //
      getElementSize(element) {
        return element.getBoundingClientRect()[this.sizeAttr]
      },

      // Get the sum of the components size
      //
      getComponentsSizeSum(components) {
        return components.reduce((size, component) => {
          return size + this.getElementSize(component.$el)
        }, 0)
      },

      // Get element's offset position
      //
      getElementOffsetPosition(element) {
        return this[this.isHorizontal ? 'getElementOffsetLeft' : 'getElementOffsetTop'](element)
      },

      // Get element's total offset top
      //
      getElementOffsetTop(element) {
        let offset = element.offsetTop
        if(element.offsetParent != null) {
          offset += this.getElementOffsetTop(element.offsetParent)
        }
        return offset
      },

      // Get element's total offset left
      //
      getElementOffsetLeft(element) {
        let offset = element.offsetLeft
        if(element.offsetParent != null) {
          offset += this.getElementOffsetLeft(element.offsetParent)
        }
        return offset
      },

      // Get mouse position of event
      //
      getEventMousePosition(event) {
        return event[this.isHorizontal ? 'pageX' : 'pageY']
      },
    },

    events: {
      childMounted(component) {
        this.updateChildrenList()
      },

      childDestroyed(component) {
        this.updateChildrenList()
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
