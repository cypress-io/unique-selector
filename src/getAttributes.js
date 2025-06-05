const attributesCache = new WeakMap()

/**
 * Returns the Attribute selectors of the element
 * @param  { Element } element
 * @param  { Array } array of attributes to ignore
 * @param { Function } filter
 * @return { Array }
 */
export function getAttributes(
  el,
  attributesToIgnore = ['id', 'class', 'length'],
  filter
) {
  // If a filter is provided, we cannot cache since results may vary
  if (filter) {
    return getAttributesUncached(el, attributesToIgnore, filter)
  }

  // Create a stable cache key from attributesToIgnore
  const ignoreKey = Array.from(attributesToIgnore).sort().join(',')

  // Get or create the nested map for this element
  let elementCache = attributesCache.get(el)
  if (!elementCache) {
    elementCache = new Map()
    attributesCache.set(el, elementCache)
  }

  // Check if we have a cached result for this ignore set
  if (elementCache.has(ignoreKey)) {
    return elementCache.get(ignoreKey)
  }

  // Compute and cache result
  const result = getAttributesUncached(el, attributesToIgnore, null)
  elementCache.set(ignoreKey, result)
  return result
}

function getAttributesUncached(el, attributesToIgnore, filter) {
  const { attributes } = el
  const attrs = [...attributes]

  return attrs.reduce((sum, next) => {
    if (
      !(attributesToIgnore.indexOf(next.nodeName) > -1) &&
      (!filter || filter('attribute', next.nodeName, next.value))
    ) {
      sum.push(`[${next.nodeName}="${next.value}"]`)
    }
    return sum
  }, [])
}
