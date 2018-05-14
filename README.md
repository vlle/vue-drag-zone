# Vuelle-Drag-Zone
Drag Zone component for Vue.


# Install


#### NPM

``` bash
npm install vuelle-drag-zone --save
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

# Based on

[vue-drag-zone](https://github.com/surmon-china/vue-drag-zone) by [surmon-china](https://github.com/surmon-china)
