/**
 * Checks if the supplied node is a ShadowRoot
 * 
 * @param  { Object } element
 * @return { Boolean }
 */
export function isShadowRoot(node) {
  return Object.getPrototypeOf(node).constructor.name === 'ShadowRoot';
}
