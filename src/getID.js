import 'css.escape'

const idCache = new WeakMap()

/**
 * Returns the Tag of the element
 * @param  { Object } element
 * @param { Function } filter
 * @return { String }
 */
export function getID(el, filter) {
  if (filter) {
    const id = el.getAttribute('id')
    if (id !== null && id !== '' && filter('attribute', 'id', id)) {
      return `#${CSS.escape(id)}`
    }
    return null
  }

  if (idCache.has(el)) {
    return idCache.get(el)
  }

  const id = el.getAttribute('id')
  const result = id !== null && id !== '' ? `#${CSS.escape(id)}` : null

  idCache.set(el, result)
  return result
}
