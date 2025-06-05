import { isElement } from './isElement'

const nthChildCache = new WeakMap()

/**
 * Returns the selectors based on the position of the element relative to its siblings
 * @param  { Object } element
 * @param { Function } filter
 * @return { Array }
 */
export function getNthChild(element, filter) {
  if (filter) {
    return getNthChildUncached(element, filter)
  }

  if (nthChildCache.has(element)) {
    return nthChildCache.get(element)
  }

  const result = getNthChildUncached(element, null)
  nthChildCache.set(element, result)
  return result
}

function getNthChildUncached(element, filter) {
  let counter = 0
  let k
  let sibling
  const { parentNode } = element

  if (Boolean(parentNode)) {
    const { childNodes } = parentNode
    const len = childNodes.length
    for (k = 0; k < len; k++) {
      sibling = childNodes[k]
      if (isElement(sibling)) {
        counter++
        if (
          sibling === element &&
          (!filter || filter('nth-child', 'nth-child', counter))
        ) {
          return `:nth-child(${counter})`
        }
      }
    }
  }
  return null
}
