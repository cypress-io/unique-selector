import 'css.escape';

/**
 * Returns the data-{dataAttr} selector of the element
 * @param  { String } selectorType
 * @return { Function }
 * @param  { Object } element
 * @return { String }
 */

function needsQuote( v )
{
  // if the escaped value is different from
  // the non escaped value then we know
  // we need to quote the value
  return v !== CSS.escape( v );
}

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
        if ( needsQuote( value ) )
        {
          // if we have value that needs quotes
          return `[${nodeName}="${value}"]`;
        }

        return `[${nodeName}=${value}]`;
      }

      return `[${nodeName}]`;
    }
  }

  return null;
};
