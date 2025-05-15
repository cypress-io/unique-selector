function isString(value) {
  return typeof value === 'string';
}

/**
 * Returns the Tag of the element
 * @param  { Object } element
 * @param { Function } filter
 * @return { String }
 */
export function getTag( el, filter )
{
  let tagName = el.tagName;

  // If the tagName attribute has been overridden, we should 
  // check the nodeName property instead. If the nodeName property
  // is also not a string, we should return null and ignore tagName
  // for selector generation.
  //
  // This can happen when a <form> element contains an <input>
  // with an id of `tagName`. In this case, the form element's
  // tagName property is a reference to the input element, not
  // a string.
  if (!isString(tagName)) {
    tagName = el.nodeName;

    if (!isString(tagName)) {
      return null;
    }
  }

  tagName = tagName.toLowerCase().replace(/:/g, '\\:')

  if (filter && !filter('tag', 'tag', tagName)) {
    return null;
  }

  return tagName;
}
