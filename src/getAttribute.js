/**
 * Returns the {attr} selector of the element
 * @param  { String } selectorType - The attribute selector to return.
 * @param  { String } attributes - The attributes of the element.
 * @return { String | null } - The {attr} selector of the element.
 */

export const getAttribute = ( selectorType, attributes ) =>
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
