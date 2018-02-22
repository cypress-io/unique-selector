import 'css.escape';

/**
 * Returns the data-{dataAttr} selector of the element
 * @param  { String } dataAttr
 * @return { Function }
 * @param  { Object } element
 * @return { String }
 */
export const getData = ( dataAttr ) => ( el ) =>
{
  const value = el.dataset && el.dataset[ dataAttr ]

  if( value !== undefined && value !== null && value !== '' )
  {
    return `[data-${dataAttr}=${CSS.escape( value )}]`;
  }
  return null;
};
