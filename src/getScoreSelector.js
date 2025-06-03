/**
 * Scores a selector based on its quality and specificity
 * Higher scores are better
 * @param { String } selector
 * @return { Number }
 */
export function getScoreSelector(selector) {
  if (!selector) return 0

  // Base score
  let score = 1

  // Prefer attribute-based selectors over positional ones
  if (selector.includes(':nth-child')) {
    score -= 5
  }

  // Prioritize by selector type
  if (selector.startsWith('#')) {
    // ID selectors are the most specific and stable
    score += 100
  } else if (selector.startsWith('[data-id')) {
    // data-id is almost as good as ID
    score += 90
  } else if (selector.startsWith('[data-')) {
    // Other data attributes are good
    score += 80
  } else if (selector.startsWith('[name')) {
    // name attribute is good
    score += 70
  } else if (selector.startsWith('[')) {
    // Other attribute selectors
    score += 60
  } else if (selector.startsWith('.')) {
    // Class selectors
    score += 50
  } else if (/^[a-z]+$/.test(selector)) {
    // Tag selectors
    score += 30
  }

  // Penalize long selectors
  score -= selector.length / 10

  return score
}
