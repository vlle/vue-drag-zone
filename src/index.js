import dragZone from './zone.vue'
import dragHandle from './handle.vue'
import dragContent from './content.vue'

const install = function (Vue) {
  Vue.component(dragZone.name, dragZone)
  Vue.component(dragHandle.name, dragHandle)
  Vue.component(dragContent.name, dragContent)
}

const VuelleDragZone = { dragZone, dragHandle, dragContent, install }

export default VuelleDragZone
export { dragZone, dragHandle, dragContent, install }
