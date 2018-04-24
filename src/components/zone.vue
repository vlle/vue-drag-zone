<template>
  <div class="drag-zone" :class="orientation">
    <slot></slot>
  </div>
</template>

<script>
  import ResizeSensor from 'css-element-queries/src/ResizeSensor'

  import { isVueComponentTag } from '@/utils/vue'
  import autoRegisterEvents from '@/mixins/auto-register-events'

  export default {
    name: 'drag-zone',

    mixins: [
      autoRegisterEvents.onCreated(),
    ],

    props: {
      'horizontal': Boolean,
      'vertical': Boolean,
    },

    mounted() {
      this.bindEvents()

      this.$nextTick(() => {
        this.handleResize()
        this.updateChildrenList()
        this.resetContentsSize()

        this.initialized = true
      })
    },

    beforeDestroy() {
      this.unbindEvents()
    },

    data: () => ({
      initialized: false,
      resizeSensor: undefined,
      size: undefined,
      children: [],
    }),

    watch: {
      orientation() {
        this.handleResize()
      },

      size(newSize, oldSize) {
        if (!this.initialized || !isFinite(newSize / oldSize)) {
          return
        }

        const scale = newSize / oldSize

        console.debug('watch: size')
        this.contents.forEach((o) => o.scale(scale))
      },
    },

    computed: {
      orientation() {
        return this.isHorizontal ? 'horizontal' : 'vertical'
      },

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
      updateChildrenList() {
        console.debug('updateChildrenList')
        this.children = [...this.$children]
      },

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

      // Reset size of content components
      //
      resetContentsSize() {
        console.debug('resetContentsSize')
        const todoContentsSize = this.size - this.getComponentsSizeSum(this.handles)
        this.updateContentsSize(this.contents, todoContentsSize)
      },

      // Update size of content components
      //
      updateContentsSize(contents, todoContentsSize) {
        console.debug('updateContentsSize')

        const average = todoContentsSize / contents.length
        const todoContents = []
        const fixedContents = []
        let fixedContentsSize = 0

        contents.forEach(content => {
          const contentSize = this.getElementSize(content.$el)
          if (content.fixed) {
            fixedContentsSize += contentSize
            fixedContents.push(content)

          } else {
            const contentMinSize = content.getMinSize()
            const contentMaxSize = content.getMaxSize()
            const isMinSize = contentSize <= contentMinSize
            const isMaxSize = contentSize >= contentMaxSize
            content.isMinSize = isMinSize
            content.isMaxSize = isMaxSize

            if ((isMinSize && average < contentMinSize) || (isMaxSize && average > contentMaxSize)) {
              content.size = isMinSize ? contentMinSize : contentMaxSize
              fixedContentsSize += isMinSize ? contentMinSize : contentMaxSize
              fixedContents.push(content)

            } else {
              todoContents.push(content)
            }
          }
        })

        todoContents.forEach(component => {
          component.size = (todoContentsSize - fixedContentsSize) / todoContents.length
        })
      },

      handleResize() {
        this.size = this.getElementSize(this.$el)
      },

      bindEvents() {
        this.resizeSensor = new ResizeSensor(this.$el, this.handleResize)
      },

      unbindEvents() {
        if (this.resizeSensor) {
          this.resizeSensor.detach()
        }
      },
    },

    events: {
      childMounted(component) {
        if (!this.initialized) {
          return false
        }

        this.updateChildrenList()
      },

      childDestroyed(component) {
        if (!this.initialized) {
          return false
        }

        this.updateChildrenList()
      },
    },
  }
</script>

<style scoped>
  .drag-content > .drag-zone {
    width: 100%;
    height: 100%;
  }

  .drag-zone {
    position: static;

    display: flex;
    justify-content: space-between;
  }

  .drag-zone.horizontal {
    flex-direction: row !important;
  }

  .drag-zone.vertical {
    flex-direction: column !important;
  }
</style>
