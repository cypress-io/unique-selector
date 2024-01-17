/**
 * Returns the `name` attribute of the element (if one exists)
 * @param  { Object } element
 * @return { String }
 */
export function getName( el )
{
  const name = el.getAttribute( 'name' );

  if( name !== null && name !== '')
  {
    return `[name="${name}"]`;
  }
  return null;
}
