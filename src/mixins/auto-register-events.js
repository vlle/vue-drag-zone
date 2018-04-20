const autoRegisterEvents = function(hookName = 'created') {
  return {
    [hookName]() {
      for (const [name, func] of Object.entries(this.$options.events)) {
        this.$on(name, func)
      }
    },
  }
}

export default {
  created: () => autoRegisterEvents('created'),
  mounted: () => autoRegisterEvents('mounted'),
}
