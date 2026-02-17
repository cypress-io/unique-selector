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
 * Check if ancestor is an ancestor of element
 * @param {Element} ancestor
 * @param {Element} element
 * @return {Boolean}
 */
function isAncestor(ancestor, element) {
  return ancestor && ancestor.contains && ancestor.contains(element);
}

/**
 * Get significant attributes for an element based on configuration
 * @param {Element} element
 * @param {Object} significantAncestors
 * @param {Map<Element, Object>} cache
 * @return {Object} Object with selectors (array of attribute selectors) and attributeNames (array of matched attribute names)
 */
function getSignificantAttributes(element, significantAncestors, cache) {
  if (!significantAncestors || !significantAncestors.attributes) {
    return { selectors: [], attributeNames: [] };
  }

  // Check cache first
  if (cache && cache.has(element)) {
    return cache.get(element);
  }

  const matchingSelectors = [];
  const matchingAttributeNames = [];

  for (const { attribute, value = '*' } of significantAncestors.attributes) {
    const attributeValue = element.getAttribute(attribute);
    
    if (attributeValue !== null) {
      // Convert wildcard '*' to regex '.*'
      const pattern = value === '*' ? '.*' : value;
      
      try {
        const regex = new RegExp(pattern);
        if (regex.test(attributeValue)) {
          // Build the attribute selector
          // Always include the value in quotes, even if it's an empty string
          matchingSelectors.push(`[${attribute}="${attributeValue}"]`);
          matchingAttributeNames.push(attribute);
        }
      } catch (e) {
        // Invalid regex pattern, skip this attribute
        continue;
      }
    }
  }

  const result = { selectors: matchingSelectors, attributeNames: matchingAttributeNames };

  // Store in cache if provided
  if (cache) {
    cache.set(element, result);
  }

  return result;
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
 * @param {Object} options.significantAncestors Configuration for forcing inclusion of specific attributes from ancestors
 * @param {Array} options.significantAncestors.attributes Array of {attribute, value} objects specifying which attributes to include
 * @param {String} options.significantAncestors.type Either 'all' (include all matching ancestors) or 'closest' (include only nearest ancestor)
 * @param {Map<Element, String[]>} options.significantAttributesCache Cache for significant attribute computation
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
    significantAncestors,
    significantAttributesCache
  } = options;
  // If filter was provided wrap it to ensure a default value of `true` is returned if the provided function fails to return a value
  const normalizedFilter = filter && function(type, key, value) {
    const result = filter(type, key, value)
    if (result === null || result === undefined) {
      return true
    }
    return result
  }

  // Pre-scan for significant ancestors if configured
  let significantAncestorsMap = null;
  if (significantAncestors && significantAncestors.attributes && significantAncestors.attributes.length > 0) {
    // Step 1: Collect ALL significant ancestors (cache-friendly, type-agnostic)
    const allSignificantAncestors = [];
    let scanElement = el;

    while (scanElement) {
      const significantAttrsData = getSignificantAttributes(scanElement, significantAncestors, significantAttributesCache);
      
      if (significantAttrsData.selectors.length > 0) {
        allSignificantAncestors.push({
          element: scanElement,
          data: significantAttrsData
        });
      }

      scanElement = scanElement.parentElement;
    }

    // Step 2: Apply type-specific filtering
    let filteredAncestors;
    if (significantAncestors.type === 'closest' && allSignificantAncestors.length > 0) {
      // For 'closest' mode, only include the nearest (first) ancestor
      filteredAncestors = [allSignificantAncestors[0]];
    } else {
      // For 'all' mode (or default), include all ancestors
      filteredAncestors = allSignificantAncestors;
    }

    // Step 3: Build map and set furthest ancestor references
    // Insert in reverse order (furthest to closest) so Map maintains deterministic order
    if (filteredAncestors.length > 0) {
      significantAncestorsMap = new Map();
      // The furthest ancestor is the last one in the filtered list (since we iterate child->parent)
      const furthestAncestor = filteredAncestors[filteredAncestors.length - 1].element;
      
      // Insert in reverse order so Map maintains furthest->closest order
      for (let i = filteredAncestors.length - 1; i >= 0; i--) {
        const { element, data } = filteredAncestors[i];
        data.furthestAncestor = furthestAncestor;
        significantAncestorsMap.set(element, data);
      }
    }
  }

  const allSelectors = [];

  let currentElement = el
  while (currentElement) {
    let selector = selectorCache ? selectorCache.get(currentElement) : undefined

    if (!selector) {
      // Check if this element has significant attributes
      const significantAttrsData = significantAncestorsMap ? significantAncestorsMap.get(currentElement) : null;
      
      if (significantAttrsData && significantAttrsData.selectors.length > 0) {
        // Start with significant attributes
        selector = significantAttrsData.selectors.join('');
        
        // Test if significant attributes alone make it unique within parent
        if (!testUniqueness(currentElement, selector)) {
          // Not unique, need to add the regular unique selector
          // Avoid duplicate attributes by ignoring the ones we're already including
          // Use only the attribute names that actually matched for this element
          const mergedAttributesToIgnore = [...attributesToIgnore, ...significantAttrsData.attributeNames];
          
          const regularSelector = getUniqueSelector(
            currentElement,
            selectorTypes,
            mergedAttributesToIgnore,
            normalizedFilter
          );
          
          // Combine significant attributes with regular selector (guarantees uniqueness)
          selector = significantAttrsData.selectors.join('') + regularSelector;
        }
      } else {
        // No significant attributes, use regular selector generation
        selector = getUniqueSelector(
          currentElement,
          selectorTypes,
          attributesToIgnore,
          normalizedFilter
        );
      }
      
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

    // Only return early if:
    // 1. The selector is unique, AND
    // 2. Either we don't have significant ancestors, OR we can compose a unique selector with them
    if (isUniqueSelector) {
      // Check if we have significant ancestors
      if (!significantAncestorsMap || significantAncestorsMap.size === 0) {
        return maybeUniqueSelector;
      }
      
      // We have a unique selector but need to include significant ancestors
      // Map is already in furthest->closest order, no sorting needed
      // Only include ancestors that are actual parents (not elements already in the path)
      const ancestorSelectors = [];
      for (const [element, data] of significantAncestorsMap) {
        // Only include if this element is an ancestor of currentElement (not currentElement itself or below)
        if (element !== currentElement && isAncestor(element, currentElement)) {
          ancestorSelectors.push(data.selectors.join(''));
        }
      }
      
      if (ancestorSelectors.length === 0) {
        // No ancestors to prepend, just return the current unique selector
        return maybeUniqueSelector;
      }
      
      // Build selector with descendant combinators (space, not >)
      const composedSelector = ancestorSelectors.join(' ') + ' ' + maybeUniqueSelector;
      
      // Verify the composed selector is still unique
      let composedIsUnique = isUniqueCache ? isUniqueCache.get(composedSelector) : undefined;
      if (composedIsUnique === undefined) {
        composedIsUnique = isUnique(el, composedSelector);
        if (isUniqueCache) {
          isUniqueCache.set(composedSelector, composedIsUnique);
        }
      }
      
      if (composedIsUnique) {
        // Great! We can return early with the composed selector
        return composedSelector;
      }
      
      // If not unique, fall back to normal iteration (continue to next parent)
    }

    // Using parentElement here (rather than parentNode) to
    // filter out any document/document fragment nodes that may
    // be ancestors to elements within Shadow DOM trees.
    currentElement = currentElement.parentElement
   }

  return null;
}
