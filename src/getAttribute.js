const attributeSelectorCache = new WeakMap()

/**
 * Returns the {attr} selector of the element
 * @param  { Element } el - The element.
 * @param  { String } attribute - The attribute name.
 * @param { Function } filter
 * @return { String | null } - The {attr} selector of the element.
 */
export const getAttributeSelector = (el, attribute, filter) => {
  // If a filter is provided, we cannot cache since results may vary
  if (filter) {
    return getAttributeSelectorUncached(el, attribute, filter)
  }

  // Get or create the nested map for this element
  let elementCache = attributeSelectorCache.get(el)
  if (!elementCache) {
    elementCache = new Map()
    attributeSelectorCache.set(el, elementCache)
  }

  // Check if we have a cached result for this attribute
  if (elementCache.has(attribute)) {
    return elementCache.get(attribute)
  }

  // Compute and cache result
  const result = getAttributeSelectorUncached(el, attribute, null)
  elementCache.set(attribute, result)
  return result
}

function getAttributeSelectorUncached(el, attribute, filter) {
  const attributeValue = el.getAttribute(attribute)

  if (
    attributeValue === null ||
    (filter && !filter('attribute', attribute, attributeValue))
  ) {
    return null
  }

  if (attributeValue) {
    // if we have value that needs quotes
    return `[${attribute}="${attributeValue}"]`
  }

  return `[${attribute}]`
}
