import dragZone from '@/components/zone.vue'
import dragHandle from '@/components/handle.vue'
import dragContent from '@/components/content.vue'

const install = function (Vue) {
  Vue.component(dragZone.name, dragZone)
  Vue.component(dragHandle.name, dragHandle)
  Vue.component(dragContent.name, dragContent)
}

const VuelleDragZone = { dragZone, dragHandle, dragContent, install }

export default VuelleDragZone
export { dragZone, dragHandle, dragContent, install }
