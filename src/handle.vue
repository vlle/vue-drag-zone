<template>
  <div class="drag-handle"
    @mousedown="handleMouseDown"
    :class="{
      'disabled': disabled,
      'horizontal': zone.isHorizontal,
      'vertical': zone.isVertical,
    }">
    <slot></slot>
  </div>
</template>

<script>
  import childOfDragZone from './mixins/child-of-drag-zone'

  export default {
    name: 'drag-handle',

    mixins: [
      childOfDragZone,
    ],

    props: {
      disabled: {
        type: Boolean,
        default: false
      }
    },

    data() {
      return {
        canDrag: false,
        todoContentsMaxSize: 0,
        mouseHandleOffsetPrev: 0,
        mouseHandleOffsetNext: 0,
        nextHandleOffsetPosition: 0,
      }
    },

    methods: {
      // Split front and rear handle components
      //
      // @return Object
      //   (Array) all   - All handles including this one
      //   (Array) prev  - All handles before this one
      //   (Array) next  - All handles after this one
      //
      getHandles() {
        const allHandles = this.zone.handles
        const prev = []
        const next = []
        let isSegmented = false
        allHandles.forEach(handle => {
          const isCurrent = handle === this
          isSegmented = isSegmented || isCurrent
          if (!isCurrent) {
            (isSegmented ? next : prev).push(handle)
          }
        })
        return { all: allHandles, prev, next }
      },

      // Split adjacent handle components
      //
      // @return Object
      //   (Array) all   - All handles including this one
      //   (Array) prev  - All handles before this one
      //   (Array) next  - All handles after this one
      //
      getHandle() {
        const allHandles = this.zone.handles
        let prev = null
        let next = null
        allHandles.forEach((handle, index) => {
          if (handle === this) {
            prev = allHandles[index - 1]
            next = allHandles[index + 1]
          }
        })
        return { prev, next }
      },

      // Split adjacent content components
      //
      // @return Object
      //   (Array) all   - All content components
      //   (Array) prev  - All content components between this and the previous handle
      //   (Array) next  - All content components between this and the next handle
      //
      getTodoContents() {
        const allComponents = this.zone.children
        const all = []
        const next = []
        let prev = []
        let isSegmented = false
        let isSegmentEnd = false
        allComponents.forEach(component => {
          const isCurrent = component === this
          isSegmented = isSegmented || isCurrent
          if (component.$vnode && component.$vnode.componentOptions) {
            if (component.$vnode.componentOptions.tag === 'drag-content') {
              all.push(component)
              if (!isSegmented) {
                prev.push(component)
              } else if (!isSegmentEnd) {
                next.push(component)
              }
            } else {
              if (!isCurrent) {
                (isSegmented) ? (isSegmentEnd = true) : prev = []
              }
            }
          }
        })
        return { all, prev, next }
      },

      // Get element's size
      // (width or height, depending on the zone's orientation)
      //
      getSize(element) {
        return element.getBoundingClientRect()[this.zone.isHorizontal ? 'width' : 'height']
      },

      // Get element's offset position
      // (left or top, depending on the zone's orientation)
      //
      getOffsetPosition(element) {
        return this[this.zone.isHorizontal ? 'offsetLeft' : 'offsetTop'](element)
      },

      // Get the sum of the components size
      // (width or height, depending on the zone's orientation)
      //
      getSizePlus(components) {
        return components.reduce((size, component) => {
          return size + this.getSize(component.$el)
        }, 0)
      },

      // Get the size of components
      // (width or height, depending on the zone's orientation)
      //
      // @return Object
      //   (Integer) all   - Size of all content components
      //   (Integer) prev  - Size of all content components between this and the previous handle
      //   (Integer) next  - Size of all content components between this and the next handle
      //
      getLiveContentsSize() {
        const {
          all: allContents,
          prev: prevContents,
          next: nextContents
        } = this.getTodoContents()
        const prevContentsSize = this.getSizePlus(prevContents)
        const nextContentsSize = this.getSizePlus(nextContents)
        const allContentsSize = prevContentsSize + nextContentsSize
        return {
          all: allContentsSize,
          prev: prevContentsSize,
          next: nextContentsSize
        }
      },

      // Get element's total offset top
      //
      offsetTop(element) {
        let offset = element.offsetTop
        if(element.offsetParent != null) {
          offset += this.offsetTop(element.offsetParent)
        }
        return offset
      },

      // Get element's total offset left
      //
      offsetLeft(element) {
        let offset = element.offsetLeft
        if(element.offsetParent != null) {
          offset += this.offsetLeft(element.offsetParent)
        }
        return offset
      },

      // Get mouse position
      // (x or y, depending on the zone's orientation)
      //
      mousePosition(event) {
        return event[this.zone.isHorizontal ? 'pageX' : 'pageY']
      },

      // Get own size
      // (width or height, depending on the zone's orientation)
      //
      handleSize() {
        return this.getSize(this.$el)
      },

      // Get own offset position
      // (width or height, depending on the zone's orientation)
      //
      handleOffsetPosition() {
        return this.getOffsetPosition(this.$el)
      },

      // Handle mouse up event
      //
      handleMouseUp() {
        this.canDrag = false
        this.mouseHandleOffsetPrev = 0
        this.mouseHandleOffsetNext = 0
        this.nextHandleOffsetPosition = 0
        this.removeMouseEvents()
      },

      // Handle mouse down event
      //
      handleMouseDown(event) {

        // Change the status
        this.canDrag = true

        // Basic properties
        const handleSize = this.handleSize()
        const mousePosition = this.mousePosition(event)
        const handleOffsetPosition = this.handleOffsetPosition()

        // Determine the maximum width when pressed
        this.todoContentsMaxSize = this.getLiveContentsSize().all

        // The mouse's offset relative to the current handle
        this.mouseHandleOffsetPrev = mousePosition - handleOffsetPosition
        this.mouseHandleOffsetNext = handleSize - this.mouseHandleOffsetPrev

        // The absolute position of the next handle element or the zone's end
        const { next: nextHandle } = this.getHandle()
        this.nextHandleOffsetPosition = nextHandle
          ? this.getOffsetPosition(nextHandle.$el)
          : this.getOffsetPosition(this.zone.$el) + this.getSize(this.zone.$el)

        // Bind events
        this.bindMouseEvents()
      },

      // Handle mouse move event
      //
      handleMouseMove(event) {

        // Cancel if the handle is disabled or not clicked
        if (this.disabled || !this.canDrag) return false

        // Mouse positioning
        const mousePosition = this.mousePosition(event)

        // The position of the movable handle
        const handleOffsetPosition = this.handleOffsetPosition()

        // The position of the zone
        const zoneOffsetPosition = this.getOffsetPosition(this.zone.$el)

        // Adjacent handles
        const { prev: prevHandle, next: nextHandle } = this.getHandle()

        // Pending content components
        const {
          all: allContents,
          prev: prevContents,
          next: nextContents
        } = this.getTodoContents()

        // Total size of the front adjacent content components to be processed = mouse position - mouse offset relative to current handle - (position of front adjacent handle + size of front adjacent handle)
        let todoPrevContentsSize = mousePosition - this.mouseHandleOffsetPrev -
          (!prevHandle ? zoneOffsetPosition : (
            this.getOffsetPosition(prevHandle.$el) + this.getSize(prevHandle.$el)
          ))


        // Total size of the rear adjacent content components to be processed = position of the rear adjacent handle - mouse position - mouse offset relative to current handle
        let todoNextContentsSize = this.nextHandleOffsetPosition - mousePosition - this.mouseHandleOffsetNext

        // Some anti-spill handling
        if (todoPrevContentsSize < 0) {
          todoPrevContentsSize = 0
        }
        if (todoNextContentsSize < 0) {
          todoNextContentsSize = 0
        }
        if (todoPrevContentsSize > this.todoContentsMaxSize) {
          todoPrevContentsSize = this.todoContentsMaxSize
        }
        if (todoNextContentsSize > this.todoContentsMaxSize) {
          todoNextContentsSize = this.todoContentsMaxSize
        }

        // Intercept on out of bound values
        // maximum size of the front contents === (specific value || moving range - minimum size of the rear contents)
        // minimum size of the front contents === (specific value || 0)
        // maximum size of the rear contents  === (specific value || moving range - minimum size of the front contents)
        // minimum size of the rear contents  === (specific value || 0)

        let prevContentsMinSizePlus = prevContents.reduce((plus, content) => plus + content.getMinSize(), 0)
        let nextContentsMinSizePlus = nextContents.reduce((plus, content) => plus + content.getMinSize(), 0)
        let prevContentsMaxSizePlus = prevContents.reduce((plus, content) => plus + content.getMaxSize(), 0)
        let nextContentsMaxSizePlus = nextContents.reduce((plus, content) => plus + content.getMaxSize(), 0)

        if (typeof prevContentsMinSizePlus === 'string') {
          prevContentsMinSizePlus = 0
        }

        if (typeof nextContentsMinSizePlus === 'string') {
          nextContentsMinSizePlus = 0
        }

        if (typeof prevContentsMaxSizePlus === 'string') {
          prevContentsMaxSizePlus = this.todoContentsMaxSize - nextContentsMinSizePlus
        }

        if (typeof nextContentsMaxSizePlus === 'string') {
          nextContentsMaxSizePlus = this.todoContentsMaxSize - prevContentsMinSizePlus
        }

        // total front size to be operated > maximum front size
        // total front size to be operated < minimum front size
        // total rear size to be operated > maximum rear size
        // total rear size to be operated < minimum rear size

        if (todoPrevContentsSize > prevContentsMaxSizePlus ||
          todoPrevContentsSize < prevContentsMinSizePlus ||
          todoNextContentsSize > nextContentsMaxSizePlus ||
          todoNextContentsSize < nextContentsMinSizePlus) {

          // console.warn('Intercepted, values beyond expectations')
          return false
        }

        // Function to update elements
        const updateContentsSize = (contents, todoContentsSize) => {
          const average = todoContentsSize / contents.length
          const todoContents = []
          const fixedContents = []
          let fixedContentsSize = 0
          contents.forEach(content => {
            const contentSize = this.getSize(content.$el)
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
        }

        // Update all elements
        updateContentsSize(prevContents, todoPrevContentsSize)
        updateContentsSize(nextContents, todoNextContentsSize)
        // this.$nextTick(() => {
          // updateContentsSize(nextContents, this.todoContentsMaxSize - this.getLiveContentsSize().prev)
        // })
      },

      // Bind mouse events
      bindMouseEvents() {
        document.addEventListener('mouseup', this.handleMouseUp)
        document.addEventListener('mousemove', this.handleMouseMove)
      },

      // Release mouse events
      removeMouseEvents() {
        document.removeEventListener('mouseup', this.handleMouseUp)
        document.removeEventListener('mousemove', this.handleMouseMove)
      }
    }
  }
</script>

<style scoped>
  .drag-handle {
    background: #2196f3;

    user-select: none;
  }

  .drag-handle.horizontal {
    width: 10px;
    height: 100%;

    cursor: col-resize;
  }

  .drag-handle.vertical {
    width: 100%;
    height: 10px;

    cursor: row-resize;
  }

  .drag-handle.disabled {
    opacity: .5;
    cursor: no-drop;
  }
</style>
