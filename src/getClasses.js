import 'css.escape';

/**
 * Get class names for an element
 *
 * @param { Element } el
 * @param { Function } filter
 * @return { Array }
 */
export function getClasses( el, filter )
{
  if( !el.hasAttribute( 'class' ) )
  {
    return [];
  }

  try {
    return Array.prototype.slice.call( el.classList )
    .filter((cls) => !filter || filter('attribute', 'class', cls));
  } catch (e) {
    let className = el.getAttribute( 'class' );

    // remove duplicate and leading/trailing whitespaces
    className = className.trim()

    // split into separate classnames, perform filtering
    return className.split(/\s+/g)
      .filter((cls) => !filter || filter('class', 'class', cls));
  }
}

/**
 * Returns the Class selectors of the element
 * @param  { Object } element
 * @param { Function } filter
 * @return { Array }
 */
export function getClassSelectors( el, filter )
{
  const classList = getClasses( el, filter ).filter( Boolean );
  return classList.map( cl => `.${CSS.escape( cl )}` );
}
