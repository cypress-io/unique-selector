/**
 * Checks if the selector is unique
 * @param  { Object } element
 * @param  { String } selector
 * @return { Array }
 */
export function isUnique( el, selector )
{
  if( !Boolean( selector ) ) return false;
  try {
    var elems = el.ownerDocument.querySelectorAll(selector);
    return elems.length === 1 && elems[0] === el;
  } catch (e) {
    return false
  }
}
