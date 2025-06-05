import 'css.escape'

const classesCache = new WeakMap()
const classSelectorCache = new WeakMap()

/**
 * Get class names for an element
 *
 * @param { Element } el
 * @param { Function } filter
 * @return { Array }
 */
export function getClasses(el, filter) {
  if (filter) {
    return getClassesUncached(el, filter)
  }

  if (classesCache.has(el)) {
    return classesCache.get(el)
  }

  const result = getClassesUncached(el, null)
  classesCache.set(el, result)
  return result
}

function getClassesUncached(el, filter) {
  if (!el.hasAttribute('class')) {
    return []
  }

  try {
    return Array.prototype.slice
      .call(el.classList)
      .filter((cls) => !filter || filter('class', 'class', cls))
  } catch (e) {
    let className = el.getAttribute('class')

    // remove duplicate and leading/trailing whitespaces
    className = className.trim()

    // split into separate classnames, perform filtering
    return className
      .split(/\s+/g)
      .filter((cls) => !filter || filter('class', 'class', cls))
  }
}

/**
 * Returns the Class selectors of the element
 * @param  { Object } element
 * @param { Function } filter
 * @return { Array }
 */
export function getClassSelectors(el, filter) {
  if (filter) {
    const classList = getClasses(el, filter).filter(Boolean)
    return classList.map((cl) => `.${CSS.escape(cl)}`)
  }

  if (classSelectorCache.has(el)) {
    return classSelectorCache.get(el)
  }

  const classList = getClasses(el, null).filter(Boolean)
  const result = classList.map((cl) => `.${CSS.escape(cl)}`)

  classSelectorCache.set(el, result)
  return result
}
