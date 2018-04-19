export const getVueComponentTag = function(component) {
  if (component.$vnode && component.$vnode.componentOptions) {
    return component.$vnode.componentOptions.tag
  }
  return undefined
}

export const isVueComponent = function(component) {
  return Boolean(component.$vnode)
}

export const isVueComponentTag = function(component, tag) {
  return getVueComponentTag(component) === tag
}
