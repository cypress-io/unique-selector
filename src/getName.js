/**
 * Returns the `name` attribute of the element (if one exists)
 * @param  { Object } element
 * @param { Function } filter
 * @return { String }
 */
export function getName( el, filter )
{
  const name = el.getAttribute( 'name' );

  if( name !== null && name !== '' && (!filter || filter('attribute', 'name', name)))
  {
    return `[name="${name}"]`;
  }
  return null;
}
