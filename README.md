# Vuelle-Drag-Zone
Drag Zone component for Vue.


# Install

#### CDN

``` html
<script type="text/javascript" src="path/to/vue.min.js"></script>
<script type="text/javascript" src="path/to/dist/vuelle-drag-zone.js"></script>
<script type="text/javascript">
  Vue.use(window.VuelleDragZone)
</script>
```


### Mount

#### mount with global

``` javascript
import Vue from 'vue'
import VuelleDragZone from 'vuelle-drag-zone'

Vue.use(VuelleDragZone)
```

#### mount with component

```javascript
import { dragZone, dragHandle, dragContent } from 'vuelle-drag-zone'

export default {
  components: {
    dragZone,
    dragHandle,
    dragContent
  }
}
```

### component

```vue
<template>
  <!-- base use -->
  <drag-zone>
    <drag-content class="c1">
      <div class="item i1">item 1</div>
    </drag-content>
    <drag-handle></drag-handle>
    <drag-content class="c2">
      <div class="item i2">item 2</div>
    </drag-content>
    <drag-handle></drag-handle>
    <drag-content class="c3">
      <div class="item i3">item 3</div>
    </drag-content>
    <drag-content class="c4">
      <div class="item i4">item 4</div>
    </drag-content>
    <drag-handle></drag-handle>
    <drag-content class="c5">
      <div class="item i5">item 5</div>
    </drag-content>

  <!-- disabled handle -->
  <drag-zone>
    <drag-content class="c1">
      <div class="item i1">item 1</div>
    </drag-content>
    <drag-handle></drag-handle>
    <drag-content class="c2">
      <div class="item i2">item 2</div>
    </drag-content>
    <drag-content class="c3">
      <div class="item i3">item 3</div>
    </drag-content>
    <drag-handle></drag-handle>
    <drag-content class="c4">
      <div class="item i4">item 4</div>
    </drag-content>
    <drag-handle :disabled="disabledHandle"></drag-handle>
    <drag-content class="c5">
      <div class="item i5">item 5</div>
    </drag-content>
  </drag-zone>
</template>
```
