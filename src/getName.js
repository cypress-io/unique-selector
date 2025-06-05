const nameCache = new WeakMap()

/**
 * Returns the `name` attribute of the element (if one exists)
 * @param  { Object } element
 * @param { Function } filter
 * @return { String }
 */
export function getName(el, filter) {
  if (filter) {
    const name = el.getAttribute('name')
    if (name !== null && name !== '' && filter('attribute', 'name', name)) {
      return `[name="${name}"]`
    }
    return null
  }

  if (nameCache.has(el)) {
    return nameCache.get(el)
  }

  const name = el.getAttribute('name')
  const result = name !== null && name !== '' ? `[name="${name}"]` : null

  nameCache.set(el, result)
  return result
}
