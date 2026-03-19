/**
 * Expose `unique`
 */

import { getID } from './getID';
import { getClassSelectors } from './getClasses';
import { getCombinations } from './getCombinations';
import { getAttributes } from './getAttributes';
import { getName } from './getName'
import { getNthChild } from './getNthChild';
import { getTag } from './getTag';
import { isUnique } from './isUnique';
import { getParents } from './getParents';
import { getAttributeSelector } from './getAttribute';
import { isShadowRoot } from './isShadowRoot';

const dataRegex = /^data-.+/;
const attrRegex = /^attribute:(.+)/m;

/**
 * Checks if an element has any attributes matching the requiredAttributes config.
 * @param { Element } el
 * @param { Array<{attributeName: string, value: string}> } requiredAttributes
 * @return { String | null } - Combined attribute selector string, or null if no match
 */
function getRequiredAttributeSelector(el, requiredAttributes) {
  const matchingSelectors = [];
  for (const { attributeName, value } of requiredAttributes) {
    const attrValue = el.getAttribute(attributeName);
    if (attrValue === null) continue;
    const regex = new RegExp(value);
    if (regex.test(attrValue)) {
      matchingSelectors.push(
        attrValue ? `[${attributeName}="${attrValue}"]` : `[${attributeName}]`
      );
    }
  }
  return matchingSelectors.length > 0 ? matchingSelectors.join('') : null;
}

/**
 * Returns the cached required attribute selector for an element, or computes and caches it.
 * @param { Element } el
 * @param { Array<{attributeName: string, value: string}> } requiredAttributes
 * @param { Map | undefined } cache
 * @return { String | null }
 */
function getCachedRequiredAttr(el, requiredAttributes, cache) {
  if (cache && cache.has(el)) return cache.get(el);
  const selector = getRequiredAttributeSelector(el, requiredAttributes);
  if (cache) cache.set(el, selector);
  return selector;
}

/**
 * Inserts a required attribute selector into an element selector, placing it before any :nth-child.
 * @param { String } selector - A single element's selector (no combinators)
 * @param { String } attrSelector
 * @return { String }
 */
function insertRequiredAttrIntoSelector(selector, attrSelector) {
  // Extract the attribute name from attrSelector (e.g. "data-cy" from '[data-cy="val"]')
  const attrName = attrSelector.slice(1, attrSelector.indexOf(']')).split('=')[0];
  // Check if the selector already contains an attribute selector for this name,
  // matching a literal "[attrName=" or "[attrName]" — not inside a quoted value.
  const attrPattern = new RegExp('\\[' + attrName.replace(/[-[\]/{}()*+?.\\^$|]/g, '\\$&') + '[=\\]]');
  if (attrPattern.test(selector)) {
    return selector;
  }
  const nthChildIndex = selector.indexOf(':nth-child');
  if (nthChildIndex !== -1) {
    const before = selector.slice(0, nthChildIndex);
    const nthPart = selector.slice(nthChildIndex);
    return before + attrSelector + nthPart;
  }
  return selector + attrSelector;
}

/**
 * Builds a selector that includes all required attribute matches from the element and its ancestors.
 * Replicates the unique() walk but weaves required attributes into each element's selector
 * as the chain is built, ensuring attrs on elements within the > chain are appended to their
 * segment rather than prepended as separate ancestors.
 * @param { Element } el
 * @param { Object } options - The full options object passed to unique()
 * @return { String | null }
 */
function buildRequiredAttributesSelector(el, options) {
  const {
    selectorTypes: sTypes = ['id', 'name', 'class', 'tag', 'nth-child'],
    attributesToIgnore: aToIgnore = ['id', 'class', 'length'],
    filter,
    selectorCache,
    isUniqueCache,
    requiredAttributes,
    requiredAttributesCache,
  } = options;

  const normalizedFilter = filter && function(type, key, value) {
    const result = filter(type, key, value);
    if (result === null || result === undefined) return true;
    return result;
  };

  // Walk up from el building the selector chain (like unique() does)
  // but append required attributes to each element's selector inline.
  const allSelectors = [];
  const chainElements = [];
  let currentElement = el;

  while (currentElement) {
    let selector = selectorCache ? selectorCache.get(currentElement) : undefined;

    if (!selector) {
      selector = getUniqueSelector(currentElement, sTypes, aToIgnore, normalizedFilter);
      if (selectorCache) selectorCache.set(currentElement, selector);
    }

    // Weave required attribute into this element's selector
    const reqAttr = getCachedRequiredAttr(currentElement, requiredAttributes, requiredAttributesCache);
    const decoratedSelector = reqAttr
      ? insertRequiredAttrIntoSelector(selector, reqAttr)
      : selector;

    allSelectors.unshift(decoratedSelector);
    chainElements.unshift(currentElement);

    var maybeUniqueSelector = allSelectors.join(' > ');
    var isUniqueResult = isUniqueCache ? isUniqueCache.get(maybeUniqueSelector) : undefined;
    if (isUniqueResult === undefined) {
      isUniqueResult = isUnique(el, maybeUniqueSelector);
      if (isUniqueCache) isUniqueCache.set(maybeUniqueSelector, isUniqueResult);

      if (!isUniqueResult && el.parentNode && isShadowRoot(el.parentNode)) {
        maybeUniqueSelector = ':host > ' + maybeUniqueSelector;
        isUniqueResult = isUnique(el, maybeUniqueSelector);
        if (isUniqueCache) isUniqueCache.set(maybeUniqueSelector, isUniqueResult);
      }
    }

    if (isUniqueResult) {
      // Found a unique chain. Now collect any ancestors ABOVE the chain
      // that have matching required attributes, prepend with descendant combinators.
      var ancestorSelectors = [];
      var ancestor = currentElement.parentElement;
      while (ancestor) {
        var ancestorReqAttr = getCachedRequiredAttr(ancestor, requiredAttributes, requiredAttributesCache);
        if (ancestorReqAttr) {
          ancestorSelectors.unshift(ancestorReqAttr);
        }
        ancestor = ancestor.parentElement;
      }

      if (ancestorSelectors.length > 0) {
        return ancestorSelectors.join(' ') + ' ' + maybeUniqueSelector;
      }
      return maybeUniqueSelector;
    }

    currentElement = currentElement.parentElement;
  }

  return null;
}

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
function getAllSelectors( el, selectors, attributesToIgnore, filter )
{
  const consolidatedAttributesToIgnore = [...attributesToIgnore]
  const nonAttributeSelectors = []
  for (const selectorType of selectors) {
    if (dataRegex.test(selectorType)) {
      consolidatedAttributesToIgnore.push(selectorType)
    } else if (attrRegex.test(selectorType)) {
      consolidatedAttributesToIgnore.push(selectorType.replace(attrRegex, '$1'))
    } else {
      nonAttributeSelectors.push(selectorType)
    }
  }

  const funcs =
    {
      'tag'        : elem => getTag( elem, filter ),
      'nth-child'  : elem => getNthChild( elem, filter ),
      'attributes' : elem => getAttributes( elem, consolidatedAttributesToIgnore, filter ),
      'class'      : elem => getClassSelectors( elem, filter ),
      'id'         : elem => getID( elem, filter ),
      'name'       : elem => getName (elem, filter ),
    };

  return nonAttributeSelectors
  .reduce( ( res, next ) =>
  {
    res[ next ] = funcs[ next ]( el );
    return res;
  }, {} );
}

/**
 * Tests uniqueNess of the element inside its parent
 * @param  { Object } element
 * @param { String } Selectors
 * @return { Boolean }
 */
function testUniqueness( element, selector )
{
  const { parentNode } = element;
  try {
    const elements = parentNode.querySelectorAll( selector );
    return elements.length === 1 && elements[0] === element;
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
function getFirstUnique( element, selectors )
{
  return selectors.find( testUniqueness.bind( null, element ) );
}

/**
 * Checks all the possible selectors of an element to find one unique and return it
 * @param  { Object } element
 * @param  { Array } items
 * @param  { String } tag
 * @return { String }
 */
function getUniqueCombination( element, items, tag )
{
  let combinations = getCombinations( items, 3 ),
    firstUnique = getFirstUnique( element, combinations );

  if( Boolean( firstUnique ) )
  {
    return firstUnique;
  }

  if( Boolean( tag ) )
  {
    combinations = combinations.map( combination => tag + combination );
    firstUnique = getFirstUnique( element, combinations );

    if( Boolean( firstUnique ) )
      {
      return firstUnique;
    }
  }

  return null;
}

/**
 * Returns a uniqueSelector based on the passed options
 * @param  { DOM } element
 * @param  { Array } options
 * @return { String }
 */
function getUniqueSelector( element, selectorTypes, attributesToIgnore, filter )
{
  let foundSelector;

  const elementSelectors = getAllSelectors( element, selectorTypes, attributesToIgnore, filter );

  for( let selectorType of selectorTypes )
  {
    let selector = elementSelectors[ selectorType ];

    // if we are a data attribute
    const isDataAttributeSelectorType = dataRegex.test(selectorType)
    const isAttributeSelectorType = !isDataAttributeSelectorType && attrRegex.test(selectorType)
    if ( isDataAttributeSelectorType || isAttributeSelectorType )
    {
      const attributeToQuery = isDataAttributeSelectorType ? selectorType : selectorType.replace(attrRegex, '$1')
      const attributeSelector = getAttributeSelector(element, attributeToQuery, filter)
      // if we found a selector via attribute
      if ( attributeSelector )
      {
        selector = attributeSelector
        selectorType = 'attribute';
      }
    }

    if ( !Boolean( selector ) ) continue;

    switch ( selectorType )
    {
      case 'attribute' :
      case 'id' :
      case 'name':
      case 'tag':
        if ( testUniqueness( element, selector ) )
        {
          return selector;
        }
        break;
      case 'class':
      case 'attributes':
        if ( selector.length )
        {
          foundSelector = getUniqueCombination( element, selector, elementSelectors.tag );
          if ( foundSelector )
          {
            return foundSelector;
          }
        }
        break;

      case 'nth-child':
        return selector;

      default:
        break;
    }
  }
  return '*';
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
export default function unique( el, options={} ) {
  const {
    selectorTypes=['id', 'name', 'class', 'tag', 'nth-child'],
    attributesToIgnore= ['id', 'class', 'length'],
    filter,
    selectorCache,
    isUniqueCache,
    requiredAttributes,
    requiredAttributesCache,
  } = options;

  if (requiredAttributes && requiredAttributes.length > 0) {
    return buildRequiredAttributesSelector(el, options);
  }
  // If filter was provided wrap it to ensure a default value of `true` is returned if the provided function fails to return a value
  const normalizedFilter = filter && function(type, key, value) {
    const result = filter(type, key, value)
    if (result === null || result === undefined) {
      return true
    }
    return result
  }
  const allSelectors = [];

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
    let maybeUniqueSelector = allSelectors.join(' > ')
    let isUniqueSelector = isUniqueCache ? isUniqueCache.get(maybeUniqueSelector) : undefined
    if (isUniqueSelector === undefined) {
      isUniqueSelector = isUnique(el, maybeUniqueSelector)
      if (isUniqueCache) {
        isUniqueCache.set(maybeUniqueSelector, isUniqueSelector)
      }

      // If the selector is not unique but we detect we've reached a ShadowRoot attempt
      // to prefix the selector with `:host >` to anchor against the root. This helps
      // address the possibility of a unique path segment not existing before reaching
      // the root.
      if (!isUniqueSelector && el.parentNode && isShadowRoot(el.parentNode)) {
        maybeUniqueSelector = `:host > ${maybeUniqueSelector}`
        isUniqueSelector = isUnique(el, maybeUniqueSelector)

        if (isUniqueCache) {
          isUniqueCache.set(maybeUniqueSelector, isUniqueSelector)
        }
      }
    }

    if (isUniqueSelector) {
      return maybeUniqueSelector
    }

    // Using parentElement here (rather than parentNode) to
    // filter out any document/document fragment nodes that may
    // be ancestors to elements within Shadow DOM trees.
    currentElement = currentElement.parentElement
   }

  return null;
}
