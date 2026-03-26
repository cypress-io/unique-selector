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

- **`requiredAttributes`** (Object, optional) - Specifies attributes that must appear in the generated selector regardless of whether they are needed for uniqueness. When provided, matching attribute selectors are woven into every element's segment of the `>` chain, and ancestors above the unique chain are prepended using descendant combinators.

  This option takes precedence over `selectorTypes` and `filter` for the attributes it names — if an element has a required attribute, its `[attr="value"]` selector will appear in the output even if `filter` would reject that attribute for uniqueness purposes, and even if the attribute is not listed in `selectorTypes`.

  The `requiredAttributes` object has the following shape:

  - **`attributeNames`** (String[]) - The attribute names to inject into the selector (e.g., `['data-component', 'data-cy']`). Exact attribute names only — not patterns or regexes. Names are used as-provided in the generated selector with no internal normalization, so the casing you supply is the casing that appears in the output. When an attribute in `attributeNames` is already present in the base selector (from `selectorTypes`), dedup detection is case-insensitive, so duplicate injection is correctly suppressed regardless of case differences.
  - **`filter`** (Function, optional) - A filter function with the same signature as the top-level `filter` option, applied independently to control which attribute _values_ are allowed to be injected. Return `false` to skip injection for a given element. This filter is separate from the top-level `filter` and serves a different purpose: the top-level `filter` controls which traits are eligible for building a _unique_ selector, while `requiredAttributes.filter` controls which attribute values are eligible for _injection_. The `key` argument passed to this function will match the casing of the name as provided in `attributeNames`.
  - **`elementCache`** (Map<Element, (string|null)[]>, optional) - Cache for per-element required attribute selectors. Each cached entry is an array of individual selector strings parallel to `attributeNames` (null for attributes not present or filtered out). The caller is responsible for cache invalidation.

  ```javascript
  unique(element, {
    requiredAttributes: {
      attributeNames: ['data-component', 'data-cy'],
      filter: (type, key, value) => {
        // Exclude auto-generated component names from injection
        if (type === 'attribute' && key === 'data-component') {
          return !value.startsWith('jss-');
        }
        return true;
      },
      elementCache: new Map(),
    }
  });
  ```

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

### Required Attributes

Use `requiredAttributes` when you want specific attributes to always appear in the generated selector, regardless of whether they contribute to uniqueness. This is useful when your application uses semantic component attributes (e.g., `data-component`, `data-cy`) that you want reflected in every selector for readability or stability.

```javascript
// Always include data-component in the selector, even when an ID alone would be unique
const selector = unique(element, {
    requiredAttributes: {
        attributeNames: ['data-component']
    }
});
// '#submit-button' becomes '#submit-button[data-component="PrimaryButton"]'
// Ancestors with data-component are prepended with descendant combinators:
// '[data-component="Form"] #submit-button[data-component="PrimaryButton"]'
```

Required attributes take precedence over `selectorTypes` and `filter`. If an element has a required attribute, it will be injected into the selector even if:
- The attribute is not listed in `selectorTypes`
- The top-level `filter` would reject that attribute for uniqueness purposes

```javascript
// The top-level filter rejects data-component for uniqueness building,
// but requiredAttributes.filter allows it to still be injected.
const selector = unique(element, {
    filter: (type, key) => key !== 'data-component',
    requiredAttributes: {
        attributeNames: ['data-component'],
        // No requiredAttributes.filter — all values are injected
    }
});
// data-component still appears in the output
```

Use `requiredAttributes.filter` independently to control which attribute _values_ get injected, without affecting how uniqueness is determined:

```javascript
// Inject data-component only when the value doesn't look auto-generated
const selector = unique(element, {
    requiredAttributes: {
        attributeNames: ['data-component'],
        filter: (type, key, value) => {
            if (type === 'attribute' && key === 'data-component') {
                return !value.startsWith('jss-');
            }
            return true;
        },
        elementCache: new Map(), // reuse across calls for performance
    }
});
```

When multiple `attributeNames` are specified, each is matched independently on every element:

```javascript
const selector = unique(element, {
    requiredAttributes: {
        attributeNames: ['data-cy', 'data-region']
    }
});
// '[data-region="main"] [data-cy="dashboard"] .widget[data-cy="widget-a"]'
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
6. **Required attribute injection**: After the unique `>` chain is determined, any `requiredAttributes` are woven into each element's segment of the chain. Ancestors above the chain that carry a required attribute are prepended as descendant combinators. Required attributes are injected even when they are not needed for uniqueness and even when the top-level `filter` would exclude them from consideration.

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
