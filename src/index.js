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
import { escapeAttributeValue } from './utils';

const dataRegex = /^data-.+/;
const attrRegex = /^attribute:(.+)/m;

/**
 * @typedef CompiledRequiredAttr
 * @property { string } attributeName - The DOM attribute name (e.g. 'data-cy')
 * @property { RegExp } dedupPattern - Matches `[attrName=` or `[attrName]` in a selector string to detect existing usage
 * @property { RegExp } stripPattern - Matches a full `[attrName="..."]` or `[attrName]` bracket for removal during dedup
 */

/**
 * Builds a combined attribute selector string for all required attributes present on an element.
 * An optional filter function (sourced independently from the main selector filter) controls which
 * attribute values are allowed to be injected.
 * @param { Element } el
 * @param { CompiledRequiredAttr[] } compiledAttrs
 * @param { Function | undefined } filter
 * @return { String | null }
 */
function getRequiredAttributeSelector(el, compiledAttrs, filter) {
  const matchingSelectors = [];
  for (const { attributeName } of compiledAttrs) {
    const attrValue = el.getAttribute(attributeName);
    if (attrValue === null) continue;
    if (filter && !filter('attribute', attributeName, attrValue)) continue;
    matchingSelectors.push(
      attrValue ? `[${attributeName}="${escapeAttributeValue(attrValue)}"]` : `[${attributeName}]`
    );
  }
  return matchingSelectors.length > 0 ? matchingSelectors.join('') : null;
}

/**
 * Returns the required attribute selector for an element, using the cache when available.
 * @param { Element } el
 * @param { CompiledRequiredAttr[] } compiledAttrs
 * @param { Function | undefined } filter
 * @param { Map<Element, String|null> | undefined } cache
 * @return { String | null }
 */
function getCachedRequiredAttr(el, compiledAttrs, filter, cache) {
  if (cache && cache.has(el)) return cache.get(el);
  const selector = getRequiredAttributeSelector(el, compiledAttrs, filter);
  if (cache) cache.set(el, selector);
  return selector;
}

/**
 * Merges a required attribute selector into an element's base selector, placing it
 * before any :nth-child pseudo-class. Attributes already present in the base selector
 * (e.g. because selectorTypes also matched them) are skipped to avoid duplicates.
 * @param { String } selector - A single element's selector (no combinators)
 * @param { String } attrSelector - Combined required attribute selector (e.g. '[data-cy="val"]')
 * @param { CompiledRequiredAttr[] } compiledAttrs
 * @return { String }
 */
function insertRequiredAttrIntoSelector(selector, attrSelector, compiledAttrs) {
  // Strip any attributes that already appear in the base selector
  let toInsert = attrSelector;
  for (const { dedupPattern, stripPattern } of compiledAttrs) {
    if (dedupPattern.test(selector)) {
      toInsert = toInsert.replace(stripPattern, '');
    }
  }
  if (!toInsert) {
    return selector;
  }
  // Insert before :nth-child so the attribute qualifier binds to the element tag/class
  const nthChildIndex = selector.indexOf(':nth-child');
  if (nthChildIndex !== -1) {
    return selector.slice(0, nthChildIndex) + toInsert + selector.slice(nthChildIndex);
  }
  return selector + toInsert;
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
 * @param {Map<Element, String>} options.selectorCache Cache for Element -> Selector mappings. Caller is responsible for invalidation.
 * @param {Map<String, Boolean>} options.isUniqueCache Cache for Selector -> isUnique mappings. Caller is responsible for invalidation.
 * @param {{ attributeNames: string[], filter?: Function, elementCache?: Map<Element, String|null> }} options.requiredAttributes Attributes that must appear in the generated selector. Specifies the attribute names to inject, an optional filter function to control which values are allowed, and an optional element cache. Matching attributes are woven into the selector chain and ancestor context.
 * @return {String}
 */
export default function unique( el, options={} ) {
  const {
    selectorTypes=['id', 'name', 'class', 'tag', 'nth-child'],
    attributesToIgnore= ['id', 'class', 'length'],
    filter,
    selectorCache,
    isUniqueCache,
    requiredAttributes,
  } = options;

  const {
    attributeNames: requiredAttributeNames,
    filter: requiredAttributesFilter,
    elementCache: requiredAttributesElementCache,
  } = requiredAttributes || {};

  // Precompile required attribute patterns once per call to avoid repeated
  // RegExp construction during the element walk.
  const hasRequiredAttrs = requiredAttributeNames && requiredAttributeNames.length > 0;
  const compiledRequiredAttrs = hasRequiredAttrs
    ? requiredAttributeNames.map((attributeName) => {
        // Escape regex metacharacters: - [ ] / { } ( ) * + ? . \ ^ $ |
        const escaped = attributeName.replace(/[-[\]/{}()*+?.\\^$|]/g, '\\$&');
        return {
          attributeName,
          // Matches [attrName=  or [attrName]  — used to detect if the attribute is already present in a selector string.
          // Case-insensitive so it catches any casing the base selector builder may have used for the attribute name.
          dedupPattern: new RegExp('\\[' + escaped + '[=\\]]', 'i'),
          // Matches [attrName="any-value"] or [attrName] — used to strip an existing attribute bracket before re-appending it.
          // The value pattern (?:[^"\\]|\\.)*  handles CSS-escaped characters (e.g. \", \\, \A ) correctly.
          stripPattern: new RegExp('\\[' + escaped + '(?:="(?:[^"\\\\]|\\\\.)*")?\\]'),
        };
      })
    : null;

  // Wrap filter to default to `true` when the provided function returns null/undefined
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

      // Merge any matching required attributes into the element's selector
      if (hasRequiredAttrs) {
        const elementRequiredAttributes = getCachedRequiredAttr(currentElement, compiledRequiredAttrs, requiredAttributesFilter, requiredAttributesElementCache);
        if (elementRequiredAttributes) {
          selector = insertRequiredAttrIntoSelector(selector, elementRequiredAttributes, compiledRequiredAttrs);
        }
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

    if (isUniqueSelector) {
      // Prepend required attribute selectors from ancestors above the unique
      // chain using descendant combinators (e.g. '[data-cy="app"] [data-cy="nav"] .btn').
      if (hasRequiredAttrs) {
        const ancestorSelectors = [];
        let ancestor = currentElement.parentElement;
        while (ancestor) {
          const ancestorReqAttr = getCachedRequiredAttr(ancestor, compiledRequiredAttrs, requiredAttributesFilter, requiredAttributesElementCache);
          if (ancestorReqAttr) {
            ancestorSelectors.unshift(ancestorReqAttr);
          }
          ancestor = ancestor.parentElement;
        }
        if (ancestorSelectors.length > 0) {
          return ancestorSelectors.join(' ') + ' ' + maybeUniqueSelector;
        }
      }

      return maybeUniqueSelector
    }

    // Using parentElement here (rather than parentNode) to
    // filter out any document/document fragment nodes that may
    // be ancestors to elements within Shadow DOM trees.
    currentElement = currentElement.parentElement
   }

  return null;
}
