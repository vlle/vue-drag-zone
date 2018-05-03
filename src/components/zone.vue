<template>
  <div class="drag-zone" :class="orientation">
    <slot></slot>
  </div>
</template>

<script>
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

    beforeDestroy() {
      // unregister events
      autoRegisterEvents.off(this)
    },

    data: () => ({
      children: [],
    }),

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
        return this.children.filter((child) => this.isContentComponent(child))
      },

      handles() {
        return this.children.filter((child) => this.isHandleComponent(child))
      },
    },

    methods: {
      updateChildrenList() {
        this.children = [...this.$children]
      },

      isContentComponent(component) {
        return isVueComponentTag(component, 'drag-content')
      },

      isHandleComponent(component) {
        return isVueComponentTag(component, 'drag-handle')
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
        this.contents.forEach((content) => content.reset())
      },

      // Adjust content components proportions
      //
      adjustContentProportions() {
        const fractionSum = this.contents.reduce((sum, comp) => sum + comp.sizeFraction, 0)
        const scale = 1 / fractionSum

        if (scale === Infinity) {
          // all contents have a size of 0. Reset them to distribute the space between them.
          this.contents.forEach((comp) => comp.resetSize())
        } else if (scale !== 1) {
          // scale the contents. Note: scaling 0 size contents has no effect (0 * x = 0).
          this.contents.forEach((comp) => comp.scale(scale))
        }
      },

      // Update size of content components
      //
      updateContentsSize(contents, todoContentsSize) {
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
            const becomesMinSize = average <= contentMinSize
            const becomesMaxSize = average >= contentMaxSize
            content.isMinSize = becomesMinSize
            content.isMaxSize = becomesMaxSize

            if ((becomesMinSize && average < contentMinSize) || (becomesMaxSize && average > contentMaxSize)) {
              content.size = becomesMinSize ? contentMinSize : contentMaxSize
              fixedContentsSize += becomesMinSize ? contentMinSize : contentMaxSize
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
    },

    events: {
      childCreated(component) {
        this.updateChildrenList()
      },

      childDestroyed(component) {
        this.updateChildrenList()

        if (this.contents.length && this.isContentComponent(component)) {
          // distribute freed content space to other content components or remove overflow
          this.adjustContentProportions()
        }
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
    display: flex !important;
    flex-wrap: nowrap !important;
    align-items: stretch !important;
    justify-content: space-between !important;

    overflow: hidden;
  }

  .drag-zone.horizontal {
    flex-direction: row !important;
  }

  .drag-zone.vertical {
    flex-direction: column !important;
  }
</style>
