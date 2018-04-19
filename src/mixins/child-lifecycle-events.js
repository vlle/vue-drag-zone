class InvalidLifecycleHookName extends Error {}

const lifecycleHookNames = [
  'beforeCreate',
  'created',
  'beforeMount',
  'mounted',
  'beforeUpdate',
  'updated',
  'activated',
  'deactivated',
  'beforeDestroy',
  'destroyed',
  'errorCaptured',
]

const createHook = function(hookName) {
  // if (!lifecycleHookNames.includes(hookName))
  //   return false

  const eventName = 'child' + hookName[0].toUpperCase() + hookName.substring(1)

  return function() {
    if (this.$parent) {
      this.$parent.$emit(eventName, this)
    }
  }
}

const lifecycleHookFunctions = {}
lifecycleHookNames.forEach((name) => {
  lifecycleHookFunctions[name] = createHook(name)
})

export default function childLifecycleEvents(hookNames = lifecycleHookNames) {
  const hooks = {}

  hookNames.forEach((name) => {
    if (!lifecycleHookFunctions.hasOwnProperty(name)) {
      throw new InvalidLifecycleHookName(`invalid hook name: ${name}`)
    }
    hooks[name] = lifecycleHookFunctions[name]
  })

  return hooks
}
