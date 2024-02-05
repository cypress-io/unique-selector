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
import { getAttribute } from './getAttribute';

const dataRegex = /^data-.+/;
const attrRegex = /^attribute:(.+)/m;

/**
 * Returns all the selectors of the element
 * @param  { Object } element
 * @return { Object }
 */
function getAllSelectors( el, selectors, attributesToIgnore )
{
  const funcs =
    {
      'tag'        : getTag,
      'nth-child'  : getNthChild,
      'attributes' : elem => getAttributes( elem, attributesToIgnore ),
      'class'      : getClassSelectors,
      'id'         : getID,
      'name'       : getName,
    };

  return selectors
  .filter( ( selector ) => !dataRegex.test( selector ) && !attrRegex.test( selector ) )
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
function getUniqueSelector( element, selectorTypes, attributesToIgnore )
{
  let foundSelector;

  const attributes = [...element.attributes];

  const elementSelectors = getAllSelectors( element, selectorTypes, attributesToIgnore );

  for( let selectorType of selectorTypes )
  {
    let selector = elementSelectors[ selectorType ];

    // if we are a data attribute
    const isDataAttributeSelectorType = dataRegex.test(selectorType)
    const isAttributeSelectorType = !isDataAttributeSelectorType && attrRegex.test(selectorType)
    if ( isDataAttributeSelectorType || isAttributeSelectorType )
    {
      const attributeToQuery = isDataAttributeSelectorType ? selectorType : selectorType.replace(attrRegex, '$1')
      const attributeSelector = getAttribute( attributeToQuery, attributes );

      // if we found a selector via attribute
      if ( attributeSelector )
      {
        selector = attributeSelector;
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
 * Generate unique CSS selector for given DOM element
 *
 * @param {Element} el
 * @return {String}
 * @api private
 */

export default function unique( el, options={} ) {
  const { 
    selectorTypes=['id', 'name', 'class', 'tag', 'nth-child'], 
    attributesToIgnore= ['id', 'class', 'length'],
    selectorCache,
    isUniqueCache
  } = options;
  const allSelectors = [];

  let currentElement = el
  while (currentElement) {
    let selector = selectorCache ? selectorCache.get(currentElement) : undefined

    if (!selector) {
      selector = getUniqueSelector(
        currentElement,
        selectorTypes,
        attributesToIgnore
      )
      if (selectorCache) {
        selectorCache.set(currentElement, selector)
       }
     }

    allSelectors.unshift(selector)
    const maybeUniqueSelector = allSelectors.join(' > ')
    let isUniqueSelector = isUniqueCache ? isUniqueCache.get(maybeUniqueSelector) : undefined
    if (isUniqueSelector === undefined) {
      isUniqueSelector = isUnique(el, maybeUniqueSelector)
      if (isUniqueCache) {
        isUniqueCache.set(maybeUniqueSelector, isUniqueSelector)
      }
    }

    if (isUniqueSelector) {
      return maybeUniqueSelector
    }
    currentElement = currentElement.parentNode
   }

  return null;
}
