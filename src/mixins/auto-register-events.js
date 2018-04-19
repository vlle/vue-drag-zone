class InvalidHookName extends Error {}

const validHookNames = [
  'created',
  'beforeMount',
  'mounted',
]

export default function autoRegisterEvents(hookName = 'created') {
  if (!validHookNames.includes(hookName)) {
    throw new InvalidHookName(`invalid hook name: ${hookName}`)
  }

  return {
    [hookName]() {
      for (const [name, func] of Object.entries(this.$options.events)) {
        this.$on(name, func)
      }
    },
  }
}
