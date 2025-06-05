import { getID } from './getID'
import { getClassSelectors } from './getClasses'
import { getAttributes } from './getAttributes'
import { getDataAttributes } from './getDataAttributes'
import { getName } from './getName'
import { getNthChild } from './getNthChild'
import { getTag } from './getTag'
import { isUnique } from './isUnique'
import { getScoreSelector } from './getScoreSelector'

/**
 * Recursively finds unique selectors for a given element, searching up to 2 levels of parent.
 * @param {Element} el - The target element.
 * @param {string} directSelector - A simple selector (e.g., tag, class, or ID) that matches all sibling candidates.
 * @param {Object} selectorTypes - Configuration for which selector types to prioritize.
 * @param {Set<string>} attributesToIgnore - Attributes to skip when generating attribute-based selectors.
 * @param {function(string): boolean} normalizedFilter - (Optional) Filter function for selector strings.
 * @param {number} depth - Current recursion depth (internal use). Max depth = 2.
 * @returns {string[]} - An array of unique selector strings for `el`, or empty array if none found.
 */
export function getPotentialUniqueSelectors(
  el,
  directSelector,
  selectorTypes,
  attributesToIgnore,
  normalizedFilter,
  maxCandidates,
  depth = 0
) {
  const MAX_DEPTH = 2
  if (!el || depth > MAX_DEPTH) return []

  // Cache for selector uniqueness checks
  const uniqueCache = new Map()
  const rootNode = el.getRootNode()

  // Get all elements matching the direct selector
  const allCandidates = Array.from(rootNode.querySelectorAll(directSelector))

  // If directSelector is already unique, return it
  if (allCandidates.length === 1 && allCandidates[0] === el) {
    return [directSelector]
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

  if (!targetData) return []

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

  // Sort selectors by score (highest first) to prioritize better selectors
  uniqueSelectors.sort((a, b) => {
    const scoreA = getScoreSelector(a)
    const scoreB = getScoreSelector(b)
    return scoreB - scoreA
  })

  // Try each unique selector
  const foundSelectors = []
  for (const token of uniqueSelectors) {
    const candidate = `${directSelector}${token}`
    if (normalizedFilter && !normalizedFilter(candidate)) continue

    if (isUniqueCached(el, candidate, uniqueCache)) {
      foundSelectors.push(candidate)
      if (foundSelectors.length >= maxCandidates) {
        return foundSelectors
      }
    }
  }

  // Try with parent selectors if we can go deeper
  if (el.parentElement && depth < MAX_DEPTH) {
    const parentTag = getTag(el.parentElement)
    const parentSelectors = getPotentialUniqueSelectors(
      el.parentElement,
      parentTag,
      selectorTypes,
      attributesToIgnore,
      normalizedFilter,
      maxCandidates,
      depth + 1
    )

    for (const parentSelector of parentSelectors) {
      if (parentSelector && parentSelector !== '*') {
        // Sort tokens by score for parent combinations too
        const sortedTokens = [...uniqueSelectors].sort((a, b) => {
          const scoreA = getScoreSelector(a)
          const scoreB = getScoreSelector(b)
          return scoreB - scoreA
        })

        // Try child combinator with tokens
        for (const token of sortedTokens) {
          const childSelector = `${parentSelector} > ${directSelector}${token}`
          if (normalizedFilter && !normalizedFilter(childSelector)) continue

          if (isUniqueCached(el, childSelector, uniqueCache)) {
            foundSelectors.push(childSelector)
            if (foundSelectors.length >= 20) {
              return foundSelectors
            }
          }
        }

        // Try simple child combinator
        const simpleChildSelector = `${parentSelector} > ${directSelector}`
        if (isUniqueCached(el, simpleChildSelector, uniqueCache)) {
          foundSelectors.push(simpleChildSelector)
          if (foundSelectors.length >= 20) {
            return foundSelectors
          }
        }

        // Try descendant combinator with tokens
        for (const token of sortedTokens) {
          const descendantSelector = `${parentSelector} ${directSelector}${token}`
          if (normalizedFilter && !normalizedFilter(descendantSelector))
            continue

          if (isUniqueCached(el, descendantSelector, uniqueCache)) {
            foundSelectors.push(descendantSelector)
            if (foundSelectors.length >= 20) {
              return foundSelectors
            }
          }
        }
      }
    }
  }

  return foundSelectors
}

// Helper function to check uniqueness with caching
function isUniqueCached(el, selector, cache) {
  if (!cache.has(selector)) {
    cache.set(selector, isUnique(el, selector))
  }
  return cache.get(selector)
}
