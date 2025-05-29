/**
 * Returns the {attr} selector of the element
 * @param  { Element } el - The element.
 * @param  { String } attribute - The attribute name.
 * @param { Function } filter
 * @return { String | null } - The {attr} selector of the element.
 */
export const getAttributeSelector = (el, attribute, filter) => {
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
