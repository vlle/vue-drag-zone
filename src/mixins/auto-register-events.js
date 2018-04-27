const registerEvents = function(vm, name) {
  for (const [name, func] of Object.entries(vm.$options.events)) {
    vm.$on(name, func)
  }
}

const unregisterEvents = function(vm) {
  for (const [name, func] of Object.entries(vm.$options.events)) {
    vm.$off(name, func)
  }
}

const getMixinHook = function(name = 'created') {
  if (getMixinHook.hooks.hasOwnProperty(name)) {
    return getMixinHook.hooks[name]
  }

  const hook = {
    [name](options) {
      registerEvents(this)
    },
  }

  getMixinHook.hooks[name] = hook
  return hook
}
getMixinHook.hooks = {}

export default {
  on: registerEvents,
  off: unregisterEvents,
  onBeforeCreate: () => getMixinHook('beforeCreate'),
  onCreated: () => getMixinHook('created'),
  onMounted: () => getMixinHook('mounted'),
}
