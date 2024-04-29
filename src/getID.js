import 'css.escape';

/**
 * Returns the Tag of the element
 * @param  { Object } element
 * @param { Function } filter
 * @return { String }
 */
export function getID( el, filter )
{
  const id = el.getAttribute( 'id' );

  if( id !== null && id !== '' && (!filter || filter('attribute', 'id', id)))
  {
    return `#${CSS.escape( id )}`;
  }
  return null;
}
