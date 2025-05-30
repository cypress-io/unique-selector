/**
 * Returns the data-* attribute selectors of the element
 * @param  { Element } element
 * @param { Function } filter
 * @return { Array }
 */
export function getDataAttributes(el, filter) {
  const { attributes } = el
  const attrs = [...attributes]

  // Filter to only include data-* attributes
  const dataAttrs = attrs.filter(
    (attr) =>
      attr.nodeName.startsWith('data-') &&
      (!filter || filter('attribute', attr.nodeName, attr.value))
  )

  if (dataAttrs.length === 0) {
    return []
  }

  // Convert to selectors
  return dataAttrs.map((attr) => {
    if (attr.value) {
      return `[${attr.nodeName}="${attr.value}"]`
    }
    return `[${attr.nodeName}]`
  })
}
