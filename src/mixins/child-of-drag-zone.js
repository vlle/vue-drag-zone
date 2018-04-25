//
// @Description
//   Provide default stuff required by
//   children of a <drag-zone> component.
//

import { isVueComponentTag } from '@/utils/vue'

import childLifecycleEvents from '@/mixins/child-lifecycle-events'

export class NotADragZone extends Error {}

export default {
  mixins: [
    childLifecycleEvents(['created', 'mounted', 'destroyed']),
  ],

  computed: {
    zone() {
      if (!isVueComponentTag(this.$parent, 'drag-zone')) {
        throw new NotADragZone('$parent has to be a drag-zone')
      }
      return this.$parent
    },
  },
}
