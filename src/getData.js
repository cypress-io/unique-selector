/**
 * Returns the data-{dataAttr} selector of the element
 * @param  { String } selectorType - The type of selector to return.
 * @param  { String } attributes - The attributes of the element.
 * @return { String | null } - The data-{dataAttr} selector of the element.
 */

export const getData = ( selectorType, attributes ) =>
{
  for ( let i = 0; i < attributes.length; i++ )
  {
    // extract node name + value
    const { nodeName, value } = attributes[ i ];

    // if this matches our selector
    if ( nodeName === selectorType )
    {
      if ( value )
      {
        // if we have value that needs quotes
        return `[${nodeName}="${value}"]`;
      }

      return `[${nodeName}]`;
    }
  }

  return null;
};
