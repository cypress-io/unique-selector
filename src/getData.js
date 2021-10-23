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

/**
  * Method to wrap the HTML attribute selector text in double quotes if there's missing
  * @param {string} selector -> a string that represents a HTML attribute selector
  * @returns {string} -> the selector wrapped in double quotes if needed
  */
const _setQuotesToAttrSelector = (selector) => {
  const [attributeName, attributeValue] = selector.split('=')

  if (attributeName && attributeValue) {
    const hasQuotes = (attributeValue[0] === '"' || attributeValue[0] === '\'')

    if (selector.split('').includes('[', ']') && !hasQuotes) {
      return `[${attributeName.replace('[', '')}="${attributeValue.replace(']', '"]')}`
    }
}

  return selector
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
          return _setQuotesToAttrSelector(`[${nodeName}="${value}"]`);
        }

        return _setQuotesToAttrSelector(`[${nodeName}=${value}]`);
      }

      return _setQuotesToAttrSelector(`[${nodeName}]`);
    }
  }

  return null;
};
