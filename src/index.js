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
 * Insert significant attributes into a selector in the correct position
 * CSS selector order: tag > id > class > attributes > pseudo-selectors
 * @param {String} regularSelector - The base selector (e.g., 'div', '#id', ':nth-child(1)')
 * @param {String} significantAttrs - Significant attributes to insert (e.g., '[data-cy="foo"]')
 * @return {String} Combined selector with proper ordering
 */
function insertSignificantAttributes(regularSelector, significantAttrs) {
  if (!significantAttrs) {
    return regularSelector;
  }
  
  // Find the first pseudo-selector (starts with : but not ::)
  const pseudoMatch = regularSelector.match(/(?<!:):(?!:)/);
  
  if (pseudoMatch) {
    // Insert significant attributes before pseudo-selector
    const insertPos = pseudoMatch.index;
    return regularSelector.slice(0, insertPos) + significantAttrs + regularSelector.slice(insertPos);
  }
  
  // No pseudo-selector, append significant attributes at end
  // This handles cases like 'div', '#id', '.class', 'div.class', etc.
  return regularSelector + significantAttrs;
}

/**
 * Build a map of significant ancestors for an element
 * @param {Element} el - The target element
 * @param {Object} significantAncestors - Configuration for significant ancestors
 * @param {Map<Element, Object>} significantAttributesCache - Optional cache
 * @return {Object|null} Object with map (Map<Element, Object>) and orderedElements (Array of elements, furthest to closest), or null if none found
 */
function buildSignificantAncestorsMap(el, significantAncestors, significantAttributesCache) {
  if (!significantAncestors || !significantAncestors.attributes || significantAncestors.attributes.length === 0) {
    return null;
  }

  // Step 1: Collect ALL significant ancestors (cache-friendly, type-agnostic)
  const allSignificantAncestors = [];
  const allScannedElements = []; // Track ALL scanned elements (even those without significant attrs)
  let scanElement = el;
  let foundCachedParents = null;

  // Scan up until cache hit or root
  while (scanElement) {
    // Check cache first
    if (significantAttributesCache && significantAttributesCache.has(scanElement)) {
      const cachedData = significantAttributesCache.get(scanElement);
      
      // Add this element to scanned list
      allScannedElements.push({ element: scanElement, data: cachedData });
      
      // Add to significant ancestors if it has matched attributes
      if (cachedData.matchedAttributes && Object.keys(cachedData.matchedAttributes).length > 0) {
        allSignificantAncestors.push({
          element: scanElement,
          data: cachedData
        });
      }
      
      // Get cached parents (they're already complete)
      foundCachedParents = cachedData.significantParents || [];
      break; // Stop! We have the rest via cache
    }
    
    // Cache miss - compute and track
    const data = getSignificantAttributes(
      scanElement,
      significantAncestors,
      null, // Don't pass cache here - we're handling it manually
      [] // Empty parent list for now
    );
    
    // Track this element (regardless of whether it has significant attrs)
    allScannedElements.push({ element: scanElement, data: data });
    
    // Add to significant ancestors only if it has matched attributes
    if (data.matchedAttributes && Object.keys(data.matchedAttributes).length > 0) {
      allSignificantAncestors.push({
        element: scanElement,
        data: data
      });
    }
    
    scanElement = scanElement.parentElement;
  }

  // Append cached parents to our collected significant ancestors
  if (foundCachedParents && foundCachedParents.length > 0) {
    for (const parent of foundCachedParents) {
      const parentData = significantAttributesCache.get(parent);
      if (parentData && parentData.matchedAttributes && Object.keys(parentData.matchedAttributes).length > 0) {
        allSignificantAncestors.push({
          element: parent,
          data: parentData
        });
      }
    }
  }

  // Update ALL scanned element cache entries with complete parent chain
  // This includes elements without significant attrs - they still benefit from knowing their significant parents
  if (significantAttributesCache && allScannedElements.length > 0) {
    // Build the list of significant parent elements (from allSignificantAncestors)
    const significantParentElements = [
      ...allSignificantAncestors.map(item => item.element),
      ...(foundCachedParents || [])
    ];
    
    for (let i = 0; i < allScannedElements.length; i++) {
      const { element, data } = allScannedElements[i];
      
      // Store all significant ancestors ABOVE this element
      // Filter to only include those that are actual parents of this element
      data.significantParents = significantParentElements.filter(parent => 
        parent !== element && isAncestor(parent, element)
      );
      
      // Update cache with complete parent chain
      significantAttributesCache.set(element, data);
    }
  }

  // Step 2: Apply per-attribute type-specific filtering
  // Get type configuration for each attribute
  const attributeTypeMap = new Map(); // attrName -> type
  const defaultType = significantAncestors.type || 'all'; // Global fallback
  
  for (const attrConfig of significantAncestors.attributes) {
    const attrType = attrConfig.type || defaultType;
    attributeTypeMap.set(attrConfig.attribute, attrType);
  }
  
  // Build a map of attribute name -> list of elements with that attribute
  const attributeElementsMap = new Map(); // attrName -> [{element, selector}]
  
  for (const { element, data } of allSignificantAncestors) {
    for (const [attrName, selector] of Object.entries(data.matchedAttributes)) {
      if (!attributeElementsMap.has(attrName)) {
        attributeElementsMap.set(attrName, []);
      }
      attributeElementsMap.get(attrName).push({
        element,
        selector
      });
    }
  }
  
  // Filter each attribute's elements based on its type (from config, not cache)
  const filteredByAttribute = new Map(); // element -> Set of attribute selectors to include
  
  for (const [attrName, elementsWithAttr] of attributeElementsMap) {
    if (elementsWithAttr.length === 0) continue;
    
    const attrType = attributeTypeMap.get(attrName) || defaultType;
    let elementsToInclude;
    
    if (attrType === 'closest') {
      // Only include the first (closest) element with this attribute
      elementsToInclude = [elementsWithAttr[0]];
    } else {
      // Include all elements with this attribute
      elementsToInclude = elementsWithAttr;
    }
    
    // Add to filtered map
    for (const { element, selector } of elementsToInclude) {
      if (!filteredByAttribute.has(element)) {
        filteredByAttribute.set(element, new Set());
      }
      filteredByAttribute.get(element).add(selector);
    }
  }

  // Step 3: Build final map with merged selectors per element
  if (filteredByAttribute.size === 0) {
    return null;
  }

  const significantAncestorsMap = new Map();
  const orderedElements = [];
  
  // Build list of unique elements in furthest->closest order
  const uniqueElements = [];
  for (const { element } of allSignificantAncestors) {
    if (filteredByAttribute.has(element) && !uniqueElements.includes(element)) {
      uniqueElements.push(element);
    }
  }
  
  // Insert in reverse order (furthest to closest)
  for (let i = uniqueElements.length - 1; i >= 0; i--) {
    const element = uniqueElements[i];
    const selectors = Array.from(filteredByAttribute.get(element));
    const originalData = allSignificantAncestors.find(item => item.element === element).data;
    
    // Build attribute names list from matched selectors
    const attributeNames = [];
    for (const [attrName, selector] of Object.entries(originalData.matchedAttributes)) {
      if (selectors.includes(selector)) {
        attributeNames.push(attrName);
      }
    }
    
    const mergedData = {
      selectors,
      attributeNames,
      matchedAttributes: originalData.matchedAttributes,
      significantParents: originalData.significantParents
    };
    
    significantAncestorsMap.set(element, mergedData);
    orderedElements.push(element);
  }

  return { map: significantAncestorsMap, orderedElements };
}

/**
 * Get significant attributes for an element based on configuration
 * Returns attribute-level detail for filtering (cache stores raw data without types)
 * @param {Element} element
 * @param {Object} significantAncestors
 * @param {Map<Element, Object>} cache
 * @param {Array} allSignificantAncestorsSoFar - Array of {element, data} objects found so far
 * @return {Object} Object with matchedAttributes (map of attrName -> selector), and significantParents
 */
function getSignificantAttributes(element, significantAncestors, cache, allSignificantAncestorsSoFar = []) {
  if (!significantAncestors || !significantAncestors.attributes) {
    return { matchedAttributes: {}, significantParents: null };
  }

  // Check cache first - cache stores raw matched attributes (no types)
  if (cache && cache.has(element)) {
    return cache.get(element);
  }

  const matchedAttributes = {}; // Map attribute name to selector string

  for (const { attribute, value = '*' } of significantAncestors.attributes) {
    const attributeValue = element.getAttribute(attribute);
    
    if (attributeValue !== null) {
      // Convert wildcard '*' to regex '.*'
      const pattern = value === '*' ? '.*' : value;
      
      try {
        const regex = new RegExp(pattern);
        if (regex.test(attributeValue)) {
          // Build the attribute selector (store without type info)
          const selector = `[${attribute}="${attributeValue}"]`;
          matchedAttributes[attribute] = selector;
        }
      } catch (e) {
        // Invalid regex pattern, skip this attribute
        continue;
      }
    }
  }

  const result = {
    matchedAttributes,
    // Store references to all significant ancestors found so far (for cache optimization)
    significantParents: allSignificantAncestorsSoFar.map(item => item.element)
  };

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
 * @param {Array} options.significantAncestors.attributes Array of {attribute, value, type?} objects specifying which attributes to include
 * @param {String} options.significantAncestors.attributes[].attribute The attribute name (e.g., 'data-cy')
 * @param {String} options.significantAncestors.attributes[].value Regex pattern to match attribute values (default: '*' for wildcard)
 * @param {String} options.significantAncestors.attributes[].type Optional per-attribute type: 'all' (include all matching ancestors) or 'closest' (include only nearest). Falls back to global type.
 * @param {String} options.significantAncestors.type Optional global type fallback when per-attribute type not specified. Defaults to 'all'.
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
  const significantAncestorsResult = buildSignificantAncestorsMap(el, significantAncestors, significantAttributesCache);
  const significantAncestorsMap = significantAncestorsResult ? significantAncestorsResult.map : null;
  const significantAncestorsOrdered = significantAncestorsResult ? significantAncestorsResult.orderedElements : null;

  const allSelectors = [];

  let currentElement = el
  while (currentElement) {
    let selector = selectorCache ? selectorCache.get(currentElement) : undefined

    if (!selector) {
      // Check if this element has significant attributes
      const significantAttrsData = significantAncestorsMap ? significantAncestorsMap.get(currentElement) : null;
      
      if (significantAttrsData && significantAttrsData.selectors && significantAttrsData.selectors.length > 0) {
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
          
          // Combine significant attributes with regular selector in correct CSS order
          // (tag > id > class > attributes > pseudo-selectors)
          selector = insertSignificantAttributes(regularSelector, significantAttrsData.selectors.join(''));
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
      // Use the ordered array to efficiently get ancestors above currentElement
      const ancestorSelectors = [];
      
      // significantAncestorsOrdered is already in furthest→closest order
      // Filter to only include ancestors above currentElement
      for (const element of significantAncestorsOrdered) {
        if (element !== currentElement && isAncestor(element, currentElement)) {
          const data = significantAncestorsMap.get(element);
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
      
      // If not unique, continue to next parent (fallback to normal iteration)
    }

    // Using parentElement here (rather than parentNode) to
    // filter out any document/document fragment nodes that may
    // be ancestors to elements within Shadow DOM trees.
    currentElement = currentElement.parentElement
   }

  return null;
}
