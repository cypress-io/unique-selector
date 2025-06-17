# unique-selector

Given a DOM node, return a unique CSS selector matching only that element.

Selector uniqueness is determined based on the given element's root node. Elements rendered within Shadow DOM will derive a selector unique within the associated ShadowRoot context. Otherwise, a selector unique within an element's owning document will be derived.

## Installation

![NPM Version](https://img.shields.io/npm/v/%40cypress%2Funique-selector)

```bash
npm install @cypress/unique-selector
```

## API

### `unique(element, options)`

Generates a unique CSS selector for the given DOM element.

#### Parameters

- **`element`** (Element) - The DOM element for which to generate a unique selector
- **`options`** (Object, optional) - Configuration options for selector generation

#### Options

- **`selectorTypes`** (String[], optional) - Array of selector types to use in order of preference. Default: `['id', 'name', 'class', 'tag', 'nth-child']`
  
  Available selector types:
  - `'id'` - Uses element's ID attribute (e.g., `#myId`)
  - `'name'` - Uses element's name attribute (e.g., `[name="myName"]`)
  - `'class'` - Uses element's class attributes (e.g., `.myClass`)
  - `'tag'` - Uses element's tag name (e.g., `div`, `span`)
  - `'nth-child'` - Uses nth-child position (e.g., `:nth-child(1)`)
  - `'attributes'` - Uses all attributes except those in `attributesToIgnore`
  - `'data-*'` - Uses specific data attributes (e.g., `data-foo`, `data-test-id`)
  - `'attribute:*'` - Uses specific attributes (e.g., `attribute:role`, `attribute:aria-label`)

- **`attributesToIgnore`** (String[], optional) - Array of attribute names to ignore when generating selectors. Default: `['id', 'class', 'length']`

- **`filter`** (Function, optional) - A filter function to conditionally reject various traits when building selectors.
  
  ```javascript
  function filter(type, key, value) {
    // type: 'attribute', 'class', 'tag', 'nth-child'
    // key: attribute name (for attributes), class name (for classes), etc.
    // value: attribute value, class name, tag name, nth-child position
    
    // Return true to allow this trait, false to reject it
    return true;
  }
  ```

- **`selectorCache`** (Map<Element, String>, optional) - Cache to improve performance of repeated selector generation. The caller is responsible for cache invalidation.

- **`isUniqueCache`** (Map<String, Boolean>, optional) - Cache to improve performance of repeated uniqueness checks. The caller is responsible for cache invalidation.

#### Returns

- **String** - A unique CSS selector for the element, or `null` if no unique selector can be generated

## Usage Examples

### Basic Usage

```javascript
import unique from '@cypress/unique-selector';

// Get a unique selector for an element
const element = document.querySelector('.my-button');
const selector = unique(element);
// Returns: '#my-button' or '.my-button' or 'button' etc.
```

### Custom Selector Types

```javascript
// Use only ID and class selectors
const selector = unique(element, {
    selectorTypes: ['id', 'class']
});

// Use only data attributes
const selector = unique(element, {
    selectorTypes: ['data-test-id', 'data-cy']
});

// Use specific attributes
const selector = unique(element, {
    selectorTypes: ['attribute:role', 'attribute:aria-label']
});
```

### Filtering Selectors

```javascript
// Filter out certain IDs
const selector = unique(element, {
    filter: (type, key, value) => {
        if (type === 'attribute' && key === 'id') {
            // Only allow IDs that contain 'test'
            return value.includes('test');
        }
        return true;
    }
});

// Filter out certain classes
const selector = unique(element, {
    filter: (type, key, value) => {
        if (type === 'class') {
            // Only allow classes that start with 'btn-'
            return value.startsWith('btn-');
        }
        return true;
    }
});
```

### Performance Optimization with Caching

```javascript
const selectorCache = new Map();
const isUniqueCache = new Map();

const selector = unique(element, {
    selectorCache,
    isUniqueCache
});

// Reuse the same caches for multiple calls
const selector2 = unique(anotherElement, {
    selectorCache,
    isUniqueCache
});
```

### Shadow DOM Support

```javascript
// Works with Shadow DOM elements
const shadowHost = document.querySelector('#shadow-host');
const shadowRoot = shadowHost.attachShadow({ mode: 'open' });
const shadowElement = shadowRoot.querySelector('.shadow-button');

const selector = unique(shadowElement);
// Returns a selector unique within the shadow root context
```

## Selector Generation Strategy

The library follows this strategy to generate unique selectors:

1. **Element-level uniqueness**: First tries to find a selector that uniquely identifies the element within its parent
2. **Parent traversal**: If element-level uniqueness fails, traverses up the DOM tree, building a path of selectors
3. **Selector type precedence**: Uses the `selectorTypes` array to determine which selector types to try first
4. **Combination fallback**: For classes and attributes, tries combinations of multiple selectors if single selectors aren't unique
5. **Nth-child fallback**: Uses nth-child positioning as a last resort

## Examples of Generated Selectors

```html
<!-- Element with ID -->
<div id="header">Header</div>
<!-- Selector: #header -->

<!-- Element with unique class -->
<button class="submit-btn">Submit</button>
<!-- Selector: .submit-btn -->

<!-- Element with multiple classes -->
<div class="card primary large">Card</div>
<!-- Selector: .card.primary.large -->

<!-- Element with data attributes -->
<div data-test-id="user-profile">Profile</div>
<!-- Selector: [data-test-id="user-profile"] -->

<!-- Element with custom attributes -->
<button role="button" aria-label="Close">×</button>
<!-- Selector: [role="button"] or [aria-label="Close"] -->

<!-- Element requiring nth-child -->
<div class="item">Item 1</div>
<div class="item">Item 2</div>
<!-- Selector: :nth-child(1) or :nth-child(2) -->

<!-- Complex nested element -->
<div class="container">
  <div class="wrapper">
    <span class="text">Hello</span>
  </div>
</div>
<!-- Selector: .container > .wrapper > .text -->
```
