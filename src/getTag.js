/**
 * Returns the Tag of the element
 * @param  { Object } element
 * @param { Function } filter
 * @return { String }
 */
export function getTag( el, filter )
{
  if (typeof el.tagName !== 'string') {
    // If the tagName attribute has been overridden, we should 
    // return null and not use tagName for selector generation.
    //
    // This can happen when a <form> element contains an <input>
    // with an id of `tagName`. In this case, the form element's
    // tagName property is a reference to the input element, not
    // a string.
    return null;
  }

  const tagName = el.tagName.toLowerCase().replace(/:/g, '\\:')

  if (filter && !filter('tag', 'tag', tagName)) {
    return null;
  }

  return tagName;
}
