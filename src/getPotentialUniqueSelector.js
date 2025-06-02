import { getID } from './getID'
import { getClassSelectors } from './getClasses'
import { getAttributes } from './getAttributes'
import { getDataAttributes } from './getDataAttributes'
import { getName } from './getName'
import { getNthChild } from './getNthChild'
import { getTag } from './getTag'
import { isUnique } from './isUnique'

/**
 * Recursively finds a unique selector for a given element, searching up to 2 levels of parent.
 * @param {Element} el - The target element.
 * @param {string} directSelector - A simple selector (e.g., tag, class, or ID) that matches all sibling candidates.
 * @param {Object} selectorTypes - Configuration for which selector types to prioritize.
 * @param {Set<string>} attributesToIgnore - Attributes to skip when generating attribute-based selectors.
 * @param {function(string): boolean} normalizedFilter - (Optional) Filter function for selector strings.
 * @param {number} depth - Current recursion depth (internal use). Max depth = 2.
 * @returns {string|null} - A unique selector string for `el`, or null if none found.
 */
export function getPotentialUniqueSelector(
  el,
  directSelector,
  selectorTypes,
  attributesToIgnore,
  normalizedFilter,
  depth = 0
) {
  const MAX_DEPTH = 2
  if (!el || depth > MAX_DEPTH) return null

  // Cache for selector uniqueness checks
  const uniqueCache = new Map()
  const rootNode = el.getRootNode()

  // Get all elements matching the direct selector
  const allCandidates = Array.from(rootNode.querySelectorAll(directSelector))

  // If directSelector is already unique, return it
  if (allCandidates.length === 1 && allCandidates[0] === el) {
    return directSelector
  }

  // Collect data for target and other elements
  let targetData = null
  const othersData = []

  for (const node of allCandidates) {
    const data = {
      ids: getID(node),
      classes: getClassSelectors(node),
      attributes: getAttributes(node, attributesToIgnore),
      name: getName(node),
      tag: getTag(node),
      nthChild: getNthChild(node),
      dataAttributes: getDataAttributes(node),
    }

    if (node === el) {
      targetData = data
    } else {
      othersData.push(data)
    }
  }

  if (!targetData) return null

  // Find unique selectors for this element
  const uniqueSelectors = []
  for (const [key, value] of Object.entries(targetData)) {
    if (Array.isArray(value)) {
      for (const token of value) {
        if (!token) continue

        if (
          othersData.some(
            (other) => !Array.isArray(other[key]) || !other[key].includes(token)
          )
        ) {
          uniqueSelectors.push(token)
        }
      }
    } else if (value && othersData.every((other) => other[key] !== value)) {
      uniqueSelectors.push(value)
    }
  }

  // Try each unique selector
  for (const token of uniqueSelectors) {
    const candidate = `${directSelector}${token}`
    if (normalizedFilter && !normalizedFilter(candidate)) continue

    if (isUniqueCached(el, candidate, uniqueCache)) {
      return candidate
    }
  }

  // Try with parent selectors if no unique selector found
  if (el.parentElement && depth < MAX_DEPTH) {
    const parentTag = getTag(el.parentElement)
    const parentSelector = getPotentialUniqueSelector(
      el.parentElement,
      parentTag,
      selectorTypes,
      attributesToIgnore,
      normalizedFilter,
      depth + 1
    )

    if (parentSelector && parentSelector !== '*') {
      // Try child combinator with tokens
      for (const token of uniqueSelectors) {
        const childSelector = `${parentSelector} > ${directSelector}${token}`
        if (normalizedFilter && !normalizedFilter(childSelector)) continue

        if (isUniqueCached(el, childSelector, uniqueCache)) {
          return childSelector
        }
      }

      // Try simple child combinator
      const simpleChildSelector = `${parentSelector} > ${directSelector}`
      if (isUniqueCached(el, simpleChildSelector, uniqueCache)) {
        return simpleChildSelector
      }

      // Try descendant combinator with tokens
      for (const token of uniqueSelectors) {
        const descendantSelector = `${parentSelector} ${directSelector}${token}`
        if (normalizedFilter && !normalizedFilter(descendantSelector)) continue

        if (isUniqueCached(el, descendantSelector, uniqueCache)) {
          return descendantSelector
        }
      }
    }
  }

  return null
}

// Helper function to check uniqueness with caching
function isUniqueCached(el, selector, cache) {
  if (!cache.has(selector)) {
    cache.set(selector, isUnique(el, selector))
  }
  return cache.get(selector)
}
