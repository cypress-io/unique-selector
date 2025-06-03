/**
 * Expose `unique`
 */

import { getID } from './getID'
import { getClassSelectors } from './getClasses'
import { getCombinations } from './getCombinations'
import { getAttributes } from './getAttributes'
import { getDataAttributes } from './getDataAttributes'
import { getName } from './getName'
import { getNthChild } from './getNthChild'
import { getTag } from './getTag'
import { isUnique } from './isUnique'
import { getAttributeSelector } from './getAttribute'
import { getPotentialUniqueSelector } from './getPotentialUniqueSelector'
import { getScoreSelector } from './getScoreSelector'

const dataRegex = /^data-.+/
const attrRegex = /^attribute:(.+)/m

/**
 * @typedef Filter
 * @type {Function}
 * @param {string} type - the trait being considered ('attribute', 'tag', 'nth-child'). As a special case, the `class` attribute is split on whitespace and each token passed individually with a `class` type.
 * @param {string} key - your trait key (for 'attribute' will be the attribute name, for others will typically be the same as 'type').
 * @param {string} value - the trait value.
 * @returns {boolean} whether this trait can be used when building the selector (true = allow). Defaults to 'true' if no value returned.
 */

/**
 * Returns all the selectors of the element
 * @param  { Object } element
 * @return { Object }
 */
function getAllSelectors(el, selectors, attributesToIgnore, filter) {
  const consolidatedAttributesToIgnore = [...attributesToIgnore]
  const nonAttributeSelectors = []
  for (const selectorType of selectors) {
    if (dataRegex.test(selectorType)) {
      nonAttributeSelectors.push(selectorType)
    } else if (attrRegex.test(selectorType)) {
      consolidatedAttributesToIgnore.push(selectorType.replace(attrRegex, '$1'))
    } else {
      nonAttributeSelectors.push(selectorType)
    }
  }

  const funcs = {
    tag: (elem) => getTag(elem, filter),
    'nth-child': (elem) => getNthChild(elem, filter),
    attributes: (elem) =>
      getAttributes(elem, consolidatedAttributesToIgnore, filter),
    'data-attributes': (elem) => getDataAttributes(elem, filter),
    class: (elem) => getClassSelectors(elem, filter),
    id: (elem) => getID(elem, filter),
    name: (elem) => getName(elem, filter),
  }

  return nonAttributeSelectors.reduce((res, next) => {
    if (next.startsWith('data-')) {
      next = 'data-attributes'
    }
    res[next] = funcs[next](el)
    return res
  }, {})
}

/**
 * Tests uniqueNess of the element inside its parent
 * @param  { Object } element
 * @param { String } Selectors
 * @return { Boolean }
 */
function testUniqueness(element, selector) {
  const { parentNode } = element
  try {
    const elements = parentNode.querySelectorAll(selector)
    return elements.length === 1 && elements[0] === element
  } catch (e) {
    return false
  }
}

/**
 * Tests all selectors for uniqueness and returns the first unique selector.
 * @param  { Object } element
 * @param  { Array } selectors
 * @return { String }
 */
function getFirstUnique(element, selectors) {
  return selectors.find(testUniqueness.bind(null, element))
}

/**
 * Checks all the possible selectors of an element to find one unique and return it
 * @param  { Object } element
 * @param  { Array } items
 * @param  { String } tag
 * @return { String }
 */
function getUniqueCombination(element, items, tag) {
  let combinations = getCombinations(items, 3),
    firstUnique = getFirstUnique(element, combinations)

  if (Boolean(firstUnique)) {
    return firstUnique
  }

  if (Boolean(tag)) {
    combinations = combinations.map((combination) => tag + combination)
    firstUnique = getFirstUnique(element, combinations)

    if (Boolean(firstUnique)) {
      return firstUnique
    }
  }

  return null
}

/**
 * Returns a uniqueSelector based on the passed options
 * @param  { DOM } element
 * @param  { Array } options
 * @return { String }
 */
function getUniqueSelector(element, selectorTypes, attributesToIgnore, filter) {
  let foundSelector
  let candidates = []

  const elementSelectors = getAllSelectors(
    element,
    selectorTypes,
    attributesToIgnore,
    filter
  )

  for (let selectorType of selectorTypes) {
    let selector = elementSelectors[selectorType]

    // if we are a data attribute
    const isDataAttributeSelectorType = dataRegex.test(selectorType)
    const isAttributeSelectorType =
      !isDataAttributeSelectorType && attrRegex.test(selectorType)
    if (isDataAttributeSelectorType || isAttributeSelectorType) {
      const attributeToQuery = isDataAttributeSelectorType
        ? selectorType
        : selectorType.replace(attrRegex, '$1')
      const attributeSelector = getAttributeSelector(
        element,
        attributeToQuery,
        filter
      )
      // if we found a selector via attribute
      if (attributeSelector) {
        selector = attributeSelector
        selectorType = 'attribute'
      }
    }

    if (!Boolean(selector)) continue

    switch (selectorType) {
      case 'attribute':
      case 'id':
      case 'name':
      case 'tag':
        if (testUniqueness(element, selector)) {
          candidates.push(selector)
        }
        break
      case 'class':
      case 'attributes':
      case 'data-attributes':
        if (selector.length) {
          foundSelector = getUniqueCombination(
            element,
            selector,
            elementSelectors.tag
          )
          if (foundSelector) {
            candidates.push(foundSelector)
          }
        }
        break

      case 'nth-child':
        candidates.push(selector)
        break

      default:
        break
    }
  }

  // Sort candidates by score and return the highest-scoring unique selector
  if (candidates.length > 0) {
    candidates.sort((a, b) => getScoreSelector(b) - getScoreSelector(a))

    return candidates[0]
  }

  return '*'
}

/**
 * Generate unique CSS selector for given DOM element. Selector uniqueness is determined based on the given element's root node.
 * Elements rendered within Shadow DOM will derive a selector that is unique within the associated ShadowRoot context.
 * Otherwise, a selector that is unique within the element's owning document will be derived.
 *
 * @param {Element} el
 * @param {Object} options (optional) Customize various behaviors of selector generation
 * @param {String[]} options.selectorTypes Specify the set of traits to leverage when building selectors in precedence order
 * @param {String[]} options.attributesToIgnore Specify a set of attributes to *not* leverage when building selectors
 * @param {Filter} options.filter Provide a filter function to conditionally reject various traits when building selectors.
 * @param {Map<Element, String>} options.selectorCache Provide a cache to improve performance of repeated selector generation - it is the responsibility of the caller to handle cache invalidation. Caching is performed using the input Element as key. This cache handles Element -> Selector caching.
 * @param {Map<String, Boolean>} options.isUniqueCache Provide a cache to improve performance of repeated selector generation - it is the responsibility of the caller to handle cache invalidation. Caching is performed using the input Element as key. This cache handles Selector -> isUnique caching.
 * @return {String}
 * @api private
 */
export default function unique(el, options = {}) {
  const {
    selectorTypes = [
      'data-attributes',
      'id',
      'name',
      'class',
      'tag',
      'nth-child',
    ],
    attributesToIgnore = ['id', 'class', 'length'],
    filter,
    selectorCache,
    isUniqueCache,
  } = options

  // If filter was provided wrap it to ensure a default value of `true` is returned if the provided function fails to return a value
  const normalizedFilter =
    filter &&
    function (type, key, value) {
      const result = filter(type, key, value)
      if (result === null || result === undefined) {
        return true
      }
      return result
    }

  // Strategy 1: Try to find a direct unique selector for the element itself
  const directSelector = getUniqueSelector(
    el,
    selectorTypes,
    attributesToIgnore,
    normalizedFilter
  )

  // If the direct selector is already good (not nth-child), use it
  if (directSelector !== '*' && !directSelector.startsWith(':nth-child')) {
    if (isUnique(el, directSelector)) {
      return directSelector
    } else {
      const selector = getPotentialUniqueSelector(
        el,
        directSelector,
        selectorTypes,
        attributesToIgnore,
        normalizedFilter
      )

      if (selector) {
        return selector
      }
    }
  }

  // Strategy 2: Build a path of selectors if needed
  const allSelectors = []
  const candidateSelectors = []
  let currentElement = el

  while (currentElement) {
    let selector = selectorCache ? selectorCache.get(currentElement) : undefined

    if (!selector) {
      selector = getUniqueSelector(
        currentElement,
        selectorTypes,
        attributesToIgnore,
        normalizedFilter
      )

      if (selectorCache) {
        selectorCache.set(currentElement, selector)
      }
    }

    allSelectors.unshift(selector)

    // Try different combinations of selectors at each step to find optimal ones
    for (let i = 0; i < allSelectors.length; i++) {
      // Try single selector
      const singleSelector = allSelectors[i]
      if (singleSelector && isUnique(el, singleSelector)) {
        candidateSelectors.push({
          selector: singleSelector,
          score: getScoreSelector(singleSelector),
        })
      }

      // Try with one parent
      if (i < allSelectors.length - 1) {
        const withParent = `${allSelectors[i + 1]} > ${singleSelector}`
        if (isUnique(el, withParent)) {
          candidateSelectors.push({
            selector: withParent,
            score: getScoreSelector(withParent),
          })
        }
      }
    }

    // Try the full path as it stands
    const currentPath = allSelectors.join(' > ')
    let isUniqueSelector = isUniqueCache
      ? isUniqueCache.get(currentPath)
      : undefined

    if (isUniqueSelector === undefined) {
      isUniqueSelector = isUnique(el, currentPath)
      if (isUniqueCache) {
        isUniqueCache.set(currentPath, isUniqueSelector)
      }
    }

    if (isUniqueSelector) {
      candidateSelectors.push({
        selector: currentPath,
        score: getScoreSelector(currentPath),
      })
    }

    // If we have good candidates, pick the best one
    if (candidateSelectors.length > 0) {
      // Sort by score (highest first)
      candidateSelectors.sort((a, b) => b.score - a.score)
      return candidateSelectors[0].selector
    }

    // Move up the DOM tree
    if (currentElement.parentElement) {
      currentElement = currentElement.parentElement
    } else {
      // Only consider shadow root parent if it actually exists
      const rootNode = currentElement.getRootNode()
      currentElement =
        rootNode && rootNode.nodeType === 11 ? rootNode.host : null
    }
  }

  // If we still don't have a good selector, return the full path
  return allSelectors.join(' > ')
}
