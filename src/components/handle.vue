<template>
  <div class="drag-handle"
    @mousedown="handleMouseDown"
    :class="[
      zone.orientation,
      {'disabled': disabled},
  ]">
    <slot></slot>
  </div>
</template>

<script>
  import childOfDragZone from '@/mixins/child-of-drag-zone'

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
      getAdjacentHandles() {
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
          if (this.zone.isContentComponent(component)) {
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
        })
        return { all, prev, next }
      },

      // Get the size of components
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
        const prevContentsSize = this.zone.getComponentsSizeSum(prevContents)
        const nextContentsSize = this.zone.getComponentsSizeSum(nextContents)
        const allContentsSize = prevContentsSize + nextContentsSize
        return {
          all: allContentsSize,
          prev: prevContentsSize,
          next: nextContentsSize
        }
      },

      // Get own size
      //
      getOwnSize() {
        return this.zone.getElementSize(this.$el)
      },

      // Get own offset position
      //
      getOwnOffsetPosition() {
        return this.zone.getElementOffsetPosition(this.$el)
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
        const handleSize = this.getOwnSize()
        const mousePosition = this.zone.getEventMousePosition(event)
        const handleOffsetPosition = this.getOwnOffsetPosition()

        // Determine the maximum width when pressed
        this.todoContentsMaxSize = this.getLiveContentsSize().all

        // The mouse's offset relative to the current handle
        this.mouseHandleOffsetPrev = mousePosition - handleOffsetPosition
        this.mouseHandleOffsetNext = handleSize - this.mouseHandleOffsetPrev

        // The absolute position of the next handle element or the zone's end
        const { next: nextHandle } = this.getAdjacentHandles()
        this.nextHandleOffsetPosition = nextHandle
          ? this.zone.getElementOffsetPosition(nextHandle.$el)
          : this.zone.getElementOffsetPosition(this.zone.$el) + this.zone.getElementSize(this.zone.$el)

        // Bind events
        this.bindMouseEvents()
      },

      // Handle mouse move event
      //
      handleMouseMove(event) {

        // Cancel if the handle is disabled or not clicked
        if (this.disabled || !this.canDrag) return false

        // Mouse positioning
        const mousePosition = this.zone.getEventMousePosition(event)

        // The position of the movable handle
        const handleOffsetPosition = this.getOwnOffsetPosition()

        // The position of the zone
        const zoneOffsetPosition = this.zone.getElementOffsetPosition(this.zone.$el)

        // Adjacent handles
        const { prev: prevHandle, next: nextHandle } = this.getAdjacentHandles()

        // Pending content components
        const {
          all: allContents,
          prev: prevContents,
          next: nextContents
        } = this.getTodoContents()

        // Total size of the front adjacent content components to be processed = mouse position - mouse offset relative to current handle - (position of front adjacent handle + size of front adjacent handle)
        let todoPrevContentsSize = mousePosition - this.mouseHandleOffsetPrev -
          (!prevHandle ? zoneOffsetPosition : (
            this.zone.getElementOffsetPosition(prevHandle.$el) + this.zone.getElementSize(prevHandle.$el)
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

        // Update all elements
        this.zone.updateContentsSize(prevContents, todoPrevContentsSize)
        this.zone.updateContentsSize(nextContents, todoNextContentsSize)
        // this.$nextTick(() => {
          // this.zone.updateContentsSize(nextContents, this.todoContentsMaxSize - this.getLiveContentsSize().prev)
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
    flex-grow: 0 !important;
    flex-shrink: 0 !important;

    position: static;
    display: block;

    background: #2196f3;

    user-select: none;
  }

  .drag-handle.horizontal {
    width: 10px;

    cursor: col-resize;
  }

  .drag-handle.vertical {
    height: 10px;

    cursor: row-resize;
  }

  .drag-handle.disabled {
    opacity: .5;
    cursor: no-drop;
  }
</style>
