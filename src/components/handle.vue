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
  import throttle from 'lodash/throttle'

  import childOfDragZone from '@/mixins/child-of-drag-zone'

  const CONTENT_THRESHOLDS_PREV_MIN = 2 ** 1
  const CONTENT_THRESHOLDS_PREV_MAX = 2 ** 2
  const CONTENT_THRESHOLDS_NEXT_MIN = 2 ** 3
  const CONTENT_THRESHOLDS_NEXT_MAX = 2 ** 4

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

    created() {
      this.handleMouseMoveThrottled = throttle(this.handleMouseMove, 25)
    },

    data() {
      return {
        isDragging: false,
        contentThresholds: 0,
        todoContentsMaxSize: 0,
        mousePosition: 0,
        mouseHandleOffsetPrev: 0,
        mouseHandleOffsetNext: 0,
        prevHandleEndOffsetPosition: 0,
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
        this.isDragging = false
        this.contentThresholds = 0
        this.mousePosition = 0
        this.mouseHandleOffsetPrev = 0
        this.mouseHandleOffsetNext = 0
        this.prevHandleEndOffsetPosition = 0
        this.nextHandleOffsetPosition = 0
        this.removeMouseEvents()
      },

      // Handle mouse down event
      //
      handleMouseDown(event) {

        // Cancel if the handle is disabled
        if (this.disabled) return false

        // Change the status
        this.isDragging = true

        // Basic properties
        const mousePosition = this.zone.getEventMousePosition(event)
        this.mousePosition = mousePosition
        const handleSize = this.getOwnSize()
        const handleOffsetPosition = this.getOwnOffsetPosition()
        const zoneOffsetPosition = this.zone.getElementOffsetPosition(this.zone.$el)
        const { prev: prevHandle, next: nextHandle } = this.adjacentHandles

        // Determine the maximum width when pressed
        this.todoContentsMaxSize = this.getLiveContentsSize().all

        // The mouse's offset relative to the current handle
        this.mouseHandleOffsetPrev = mousePosition - handleOffsetPosition
        this.mouseHandleOffsetNext = handleSize - this.mouseHandleOffsetPrev

        // The absolute position of the previous handle element's end or the zone's start
        this.prevHandleEndOffsetPosition = prevHandle
          ? this.zone.getElementOffsetPosition(prevHandle.$el) + this.zone.getElementSize(prevHandle.$el)
          : zoneOffsetPosition

        // The absolute position of the next handle element's start or the zone's end
        this.nextHandleOffsetPosition = nextHandle
          ? this.zone.getElementOffsetPosition(nextHandle.$el)
          : zoneOffsetPosition + this.zone.getElementSize(this.zone.$el)

        // Bind events
        this.bindMouseEvents()
      },

      // Handle mouse move event
      //
      handleMouseMove(event) {

        // Cancel if the handle is not clicked
        if (!this.isDragging) return false

        // Mouse positioning
        const mousePosition = this.zone.getEventMousePosition(event)
        // Cancel if not changed
        if (mousePosition === this.mousePosition) return false
        this.mousePosition = mousePosition

        // Pending content components
        const { prev: prevContents, next: nextContents } = this.todoContents

        // Maximum size of the content components corresponding to this handle
        const todoContentsMaxSize = this.todoContentsMaxSize

        // Total size of the front adjacent content components to be processed = mouse position - mouse offset relative to current handle - position of front adjacent handle's end
        let todoPrevContentsSize = mousePosition - this.mouseHandleOffsetPrev - this.prevHandleEndOffsetPosition

        // Total size of the rear adjacent content components to be processed = position of the rear adjacent handle - mouse position - mouse offset relative to current handle
        let todoNextContentsSize = this.nextHandleOffsetPosition - mousePosition - this.mouseHandleOffsetNext

        // minimum size of the front contents === (specific value || 0)
        const prevContentsMinSizePlus = prevContents.reduce((plus, content) => plus + content.getMinSize(), 0) || 0

        // minimum size of the rear contents  === (specific value || 0)
        const nextContentsMinSizePlus = nextContents.reduce((plus, content) => plus + content.getMinSize(), 0) || 0

        // maximum size of the front contents === (specific value || moving range - minimum size of the rear contents)
        const prevContentsMaxSizePlus = prevContents.reduce((plus, content) => plus + content.getMaxSize(), 0) ||
          todoContentsMaxSize - nextContentsMinSizePlus

        // maximum size of the rear contents  === (specific value || moving range - minimum size of the front contents)
        const nextContentsMaxSizePlus = nextContents.reduce((plus, content) => plus + content.getMaxSize(), 0) ||
          todoContentsMaxSize - prevContentsMinSizePlus

        // Some anti-spill handling

        if (todoPrevContentsSize < 0) {
          todoPrevContentsSize = 0
        } else  if (todoPrevContentsSize > todoContentsMaxSize) {
          todoPrevContentsSize = todoContentsMaxSize
        }

        if (todoNextContentsSize < 0) {
          todoNextContentsSize = 0
        } else if (todoNextContentsSize > todoContentsMaxSize) {
          todoNextContentsSize = todoContentsMaxSize
        }

        if (todoPrevContentsSize < prevContentsMinSizePlus) {
          todoPrevContentsSize = prevContentsMinSizePlus
          todoNextContentsSize = todoContentsMaxSize - todoPrevContentsSize

        } else if (todoPrevContentsSize > prevContentsMaxSizePlus) {
          todoPrevContentsSize = prevContentsMaxSizePlus
          todoNextContentsSize = todoContentsMaxSize - todoPrevContentsSize

        } else if (todoNextContentsSize < nextContentsMinSizePlus) {
          todoNextContentsSize = nextContentsMinSizePlus
          todoPrevContentsSize = todoContentsMaxSize - todoNextContentsSize

        } else if (todoNextContentsSize > nextContentsMaxSizePlus) {
          todoNextContentsSize = nextContentsMaxSizePlus
          todoPrevContentsSize = todoContentsMaxSize - todoNextContentsSize
        }

        if (todoPrevContentsSize + todoNextContentsSize !== todoContentsMaxSize) {
          const averageOverflow = (todoPrevContentsSize + todoNextContentsSize - todoContentsMaxSize) / 2
          todoPrevContentsSize -= averageOverflow
          todoNextContentsSize -= averageOverflow
        }

        // console.debug(
        //   `all-contents: ${prevContentsMinSizePlus + nextContentsMinSizePlus} <= ${todoPrevContentsSize + todoNextContentsSize} <= ${todoContentsMaxSize}\n`,
        //   `prev-contents: ${prevContentsMinSizePlus} <= ${todoPrevContentsSize} <= ${prevContentsMaxSizePlus}\n`,
        //   `next-contents: ${nextContentsMinSizePlus} <= ${todoNextContentsSize} <= ${nextContentsMaxSizePlus}\n`)

        // Determine thresholds
        const contentThresholds = (
          (todoPrevContentsSize <= prevContentsMinSizePlus ? CONTENT_THRESHOLDS_PREV_MIN : 0) |
          (todoPrevContentsSize >= prevContentsMaxSizePlus ? CONTENT_THRESHOLDS_PREV_MAX : 0) |
          (todoNextContentsSize <= nextContentsMinSizePlus ? CONTENT_THRESHOLDS_NEXT_MIN : 0) |
          (todoNextContentsSize >= nextContentsMaxSizePlus ? CONTENT_THRESHOLDS_NEXT_MAX : 0))

        // Cancel if thresholds reached and not changed
        if (contentThresholds !== 0 && this.contentThresholds === contentThresholds) {
          // console.debug(`Intercepted, thresholds reached: ${contentThresholds}`)
          return false
        }
        this.contentThresholds = contentThresholds

        // Intercept on out of bound values
        // total front size to be operated < minimum front size
        // total front size to be operated > maximum front size
        // total rear size to be operated < minimum rear size
        // total rear size to be operated > maximum rear size

        if ((todoPrevContentsSize < prevContentsMinSizePlus) ||
          (todoPrevContentsSize > prevContentsMaxSizePlus) ||
          (todoNextContentsSize < nextContentsMinSizePlus) ||
          (todoNextContentsSize > nextContentsMaxSizePlus)) {

          // console.warn('Intercepted, values beyond expectations')
          return false
        }

        // Update all elements
        this.zone.updateContentsSize(prevContents, todoPrevContentsSize)
        this.zone.updateContentsSize(nextContents, todoNextContentsSize)
      },

      // Bind mouse events
      bindMouseEvents() {
        document.addEventListener('mouseup', this.handleMouseUp)
        document.addEventListener('mousemove', this.handleMouseMoveThrottled)
      },

      // Release mouse events
      removeMouseEvents() {
        document.removeEventListener('mouseup', this.handleMouseUp)
        document.removeEventListener('mousemove', this.handleMouseMoveThrottled)
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
