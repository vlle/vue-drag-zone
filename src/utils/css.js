export const getCss = function(element, attr) {
  const css = document.defaultView.getComputedStyle(element, null)
  return attr ? css[attr] : css
}
