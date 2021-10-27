/**
 * Returns the data-{dataAttr} selector of the element wrapped in double quotes.
 * @param  { String } selectorType
 * @return { Function }
 * @param  { Object } element
 * @return { String }
 */
export const getData = ( selectorType, attributes ) => {
  for ( let i = 0; i < attributes.length; i++ ) {
    const { nodeName, value } = attributes[ i ]

    if ( nodeName === selectorType ) return `[${nodeName}="${value}"]`
  }

  return null
}
