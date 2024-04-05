/**
 * Returns the Tag of the element
 * @param  { Object } element
 * @param { Function } filter
 * @return { String }
 */
export function getTag( el, filter )
{
  const tagName = el.tagName.toLowerCase().replace(/:/g, '\\:')

  if (filter && !filter('tag', 'tag', tagName)) {
    return null;
  }

  return tagName;
}
