/**
 * Returns the Attribute selectors of the element
 * @param  { Element } element
 * @param  { Array } array of attributes to ignore
 * @param { Function } filter
 * @return { Array }
 */
export function getAttributes( el, attributesToIgnore = ['id', 'class', 'length'], filter )
{
  const { attributes } = el;
  const attrs = [ ...attributes ];

  return attrs.reduce( ( sum, next ) =>
  {
    if ( ! ( attributesToIgnore.indexOf( next.nodeName ) > -1 ) && (!filter || filter('attributes', next.nodeName, next.value)) )
    {
      sum.push( `[${next.nodeName}="${next.value}"]` );
    }
    return sum;
  }, [] );
}
