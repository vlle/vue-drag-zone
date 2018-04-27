<template>
  <div class="drag-handle"
    @mousedown="handleMouseDown"
    :class="[
      zone.orientation,
      {'disabled': disabled},
  ]">
    <div class="drag-handle-inner" :class="zone.orientation">
      <slot></slot>
    </div>
  </div>
</template>

<script>
  import childOfDragZone from '@/mixins/child-of-drag-zone'

  export class IndexError extends Error {}

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

    computed: {
      // influenced content components (between this and adjacent handles)
      //
      // @return Object
      //   (Array) all   - All influenced content components
      //   (Array) prev  - All influenced content components before this
      //   (Array) next  - All influenced content components between this and the next handle
      //
      todoContents() {
        const allComponents = this.zone.children
        const {prev: prevHandle, next: nextHandle} = this.adjacentHandles

        const ownIndex = allComponents.indexOf(this)

        const prevIndex = prevHandle
          ? allComponents.indexOf(prevHandle)
          : null

        const nextIndex = nextHandle
          ? allComponents.indexOf(nextHandle)
          : null

        if (ownIndex === -1) throw new IndexError()
        if (prevIndex === -1) throw new IndexError()
        if (nextIndex === -1) throw new IndexError()

        const prev = allComponents.slice(prevIndex !== null ? prevIndex + 1 : 0,
          ownIndex)
        const next = allComponents.slice(ownIndex + 1,
          nextIndex !== null ? nextIndex : allComponents.length)
        const all = [...prev, ...next]

        return { all, prev, next }
      },

      // adjacent handle components
      //
      // @return Object
      //   (Array) prev  - Previous handle
      //   (Array) next  - Next handle
      //
      adjacentHandles() {
        const otherHandles = this.otherHandles

        const prev = otherHandles.prev[otherHandles.prev.length - 1] || undefined
        const next = otherHandles.next[0] || undefined

        return { prev, next }
      },

      // other handle components
      //
      // @return Object
      //   (Array) all   - All other handles
      //   (Array) prev  - All handles before this one
      //   (Array) next  - All handles after this one
      //
      otherHandles() {
        const handles = this.zone.handles

        const ownIndex = handles.indexOf(this)
        if (ownIndex === -1) throw new IndexError()

        const prev = handles.slice(0, ownIndex)
        const next = handles.slice(ownIndex + 1)
        const all = [...prev, ...next]

        return { all, prev, next }
      },
    },

    methods: {
      // Get the size of components
      //
      // @return Object
      //   (Integer) all   - Size of all content components
      //   (Integer) prev  - Size of all content components between this and the previous handle
      //   (Integer) next  - Size of all content components between this and the next handle
      //
      getLiveContentsSize() {
        const {
          prev: prevContents,
          next: nextContents
        } = this.todoContents
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
        const nextHandle = this.adjacentHandles.next
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
        const { prev: prevHandle, next: nextHandle } = this.adjacentHandles

        // Pending content components
        const {
          prev: prevContents,
          next: nextContents
        } = this.todoContents

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
    flex: 0 0 auto !important;

    position: relative;

    width: 2px;
    height: 2px;
    background: #2196f3;

    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
  }

  .drag-handle.horizontal {
    height: 100%;

    cursor: col-resize;
  }

  .drag-handle.vertical {
    width: 100%;

    cursor: row-resize;
  }

  .drag-handle.disabled {
    opacity: 0.5;

    cursor: no-drop;
  }

  .drag-handle-inner {
    position: absolute;
    top: 0;
    left: 0;

    width: 100%;
    height: 100%;
    padding: 5px;

    box-sizing: border-box;
  }

  .drag-handle-inner.horizontal {
    left: 50%;
    padding-top: 0;
    padding-bottom: 0;
    transform: translateX(-50%);
  }

  .drag-handle-inner.vertical {
    top: 50%;
    padding-left: 0;
    padding-right: 0;
    transform: translateY(-50%);
  }
</style>
