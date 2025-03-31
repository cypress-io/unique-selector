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
    // Using getRootNode here to scope checks to any parent
    // ShadowRoot. getRootNode will otherwise return the
    // document associated to the elements page/frame (like
    // the ownerDocument property would).
    var elems = el.getRootNode().querySelectorAll(selector);
    return elems.length === 1 && elems[0] === el;
  } catch (e) {
    return false
  }
}
