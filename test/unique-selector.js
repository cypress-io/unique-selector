const expect = require( 'chai' ).expect;
const JSDOM = require('jsdom').JSDOM;
const unique = require('../lib').default;

const $ = require( 'jquery' )( (new JSDOM()).window );

describe( 'Unique Selector Tests', () =>
{
  beforeEach(() => {
    $( 'body' ).get( 0 ).innerHTML = ''; // Clear previous appends
  })

  it( 'ID', () =>
  {
    $( 'body' ).append( '<div id="so" class="test3"></div>' );
    const findNode = $( 'body' ).find( '.test3' ).get( 0 );
    const uniqueSelector = unique( findNode );
    expect( uniqueSelector ).to.equal( '#so' );
  } );

  it( 'ID that needs escaping', () =>
  {
    $( 'body' ).append( '<div id="123" class="test3"></div>' );
    const findNode = $( 'body' ).find( '.test3' ).get( 0 );
    const uniqueSelector = unique( findNode );
    expect( uniqueSelector ).to.equal( '#\\31 23' );
  } );

  it('ID filters appropriately', () => {
    const filter = (type, key, value) => {
      if (type === 'attribute' && key === 'id') {
        return /oo/.test(value)
      }
      return true
    }
    let el = $.parseHTML( '<div id="foo"></div>' )[0];
    $(el).appendTo('body')
    let uniqueSelector = unique( el, { filter } );
    expect( uniqueSelector ).to.equal( '#foo' );

    el = $.parseHTML( '<div id="bar"></div>' )[0];
    $(el).appendTo('body')
    uniqueSelector = unique( el, { filter } );
    expect( uniqueSelector ).to.equal( 'body > :nth-child(2)' );
  });

  it( 'Class', () =>
  {
    $( 'body' ).append( '<div class="test2"></div>' );
    const findNode = $( 'body' ).find( '.test2' ).get( 0 );
    const uniqueSelector = unique( findNode );
    expect( uniqueSelector ).to.equal( '.test2' );
  } );

  it( 'Class that needs escaping', () =>
  {
    $( 'body' ).append( '<div class="@test test2"></div>' );
    const findNode = $( 'body' ).find( '.test2' ).get( 0 );
    const uniqueSelector = unique( findNode );
    expect( uniqueSelector ).to.equal( '.\\@test' );
  } );

  it( 'Classes', () =>
  {
    $( 'body' ).append( '<div class="test2"></div><div class="test2"></div>' );
    const findNode = $( 'body' ).find( '.test2' ).get( 0 );
    const uniqueSelector = unique( findNode );
    expect( uniqueSelector ).to.equal( 'body > :nth-child(1)' );
  } );

  it( 'Classes', () =>
  {
    $( 'body' ).append( '<div class="test2 ca cb cc cd cx"></div><div class="test2 ca cb cc cd ce"></div><div class="test2 ca cb cc cd ce"></div><div class="test2 ca cb cd ce cf cx"></div>' );
    const findNode = $( 'body' ).find( '.test2' ).get( 0 );
    const uniqueSelector = unique( findNode );
    expect( uniqueSelector ).to.equal( '.cc.cx' );
  } );

  it( 'Classes with newline', () =>
  {
    $( 'body' ).append( '<div class="test2\n ca\n cb\n cc\n cd\n cx"></div><div class="test2\n ca\n cb\n cc\n cd\n ce"></div><div class="test2\n ca\n cb\n cc\n cd\n ce"></div><div class="test2\n ca\n cb\n cd\n ce\n cf\n cx"></div>' );
    const findNode = $( 'body' ).find( '.test2' ).get( 0 );
    const uniqueSelector = unique( findNode );
    expect( uniqueSelector ).to.equal( '.cc.cx' );
  } );

  it('Classes filters appropriately', () => {
    const filter = (type, key, value) => {
      if (key === 'class') {
        expect(type).to.eq('class')
        return value.startsWith('a')
      }
      expect(type).not.to.eq('class')
      return true
    }
    let el = $.parseHTML( '<div class="a1"></div>' )[0];
    $(el).appendTo('body')
    let uniqueSelector = unique( el, { filter } );
    expect( uniqueSelector ).to.equal( '.a1' );

    el = $.parseHTML( '<div class="b1 a2"></div>' )[0];
    $(el).appendTo('body')
    uniqueSelector = unique( el, { filter } );
    expect( uniqueSelector ).to.equal( '.a2' );
  });

  it( 'Tag', () =>
  {
    $( 'body' ).append( '<div class="test2"><span></span></div><div class="test2"></div>' );
    const findNode = $( '.test2' ).find( 'span' ).get( 0 );
    const uniqueSelector = unique( findNode );
    expect( uniqueSelector ).to.equal( 'span' );
  } );

  it( 'Tag', () =>
  {
    $( 'body' ).append( '<div class="test5"><span></span></div><div class="test5"><span></span></div>' );
    const findNode = $( '.test5' ).find( 'span' ).get( 0 );
    const uniqueSelector = unique( findNode );
    expect( uniqueSelector ).to.equal( ':nth-child(1) > span' );
  } );

  it( 'Tag', () =>
  {
    $( 'body' ).append( '<div class="test5"><span><ul><li><a></a></li></ul></span></div><div class="test5"><span></span></div>' );
    const findNode = $( '.test5' ).find( 'a' ).get( 0 );
    const uniqueSelector = unique( findNode );
    expect( uniqueSelector ).to.equal( 'a' );
  } );

  it( 'Tag - fallback to nodeName', () =>
  {
    $( 'body' ).append(`
      <div class="test2">
        <form action="" method="get">
          <div class="form-example">
            <label for="name">Enter your name: </label>
            <input type="text" name="name" id="tagName" required />
          </div>
        </form>
      </div>
    `);

    const formNode = $( 'form' ).get( 0 );

    // JSDOM doesn't actually exhibit this behavior;
    // forcing the test to behave as a browser does.
    Object.defineProperty(formNode, 'tagName', {
      get: () => {
        return $( 'input#tagName' ).get( 0 );
      }
    })

    expect(typeof formNode.tagName).to.not.equal('string')

    const uniqueSelector = unique( formNode );
    // nodeName === 'form'
    expect( uniqueSelector ).to.equal( 'form' );
  } );

  it( 'Tag - ignored due to property override', () =>
    {
      $( 'body' ).append(`
        <div class="test2">
          <form action="" method="get">
            <div class="form-example">
              <label for="name">Enter your name: </label>
              <input type="text" name="name" id="tagName" required />
            </div>
          </form>
        </div>
      `);
  
      const formNode = $( 'form' ).get( 0 );
  
      // JSDOM doesn't actually exhibit this behavior;
      // forcing the test to behave as a browser does.
      Object.defineProperty(formNode, 'tagName', {
        get: () => {
          return $( 'input#tagName' ).get( 0 );
        }
      })
      Object.defineProperty(formNode, 'nodeName', {
        get: () => {
          return $( 'input#tagName' ).get( 0 );
        }
      })
  
      expect(typeof formNode.tagName).to.not.equal('string')
      expect(typeof formNode.nodeName).to.not.equal('string')

      const uniqueSelector = unique( formNode );
      // with nodeName overridden, the isElement check will fail
      // and the wildcard selector is returned for that element.
      // This really shouldn't happen in practice.
      expect( uniqueSelector ).to.equal( '.test2 > *' );
  } );  

  it( 'Attributes', () =>
  {
    $( 'body' ).append( '<div class="test5" test="5"></div>' );
    const findNode = $( '.test5' ).get( 0 );
    const uniqueSelector = unique( findNode, { selectorTypes : ['attributes'] } );
    expect( uniqueSelector ).to.equal( '[test="5"]' );
  } );

  it('Attributes does not consider specified attribute matchers', () => {
    $( 'body' ).append( '<div a="1" data-foo="1"></div>' );
    const el = $( 'div' ).get( 0 );
    // Add selectorTypes for `data-foo` and `attribute:a` but use filters to reject their use
    // `attributes` selector type should *not* use those attributes since they were considered
    // by other selectorType generators
    const uniqueSelector = unique( el, {
      selectorTypes : ['data-foo', 'attribute:a', 'attributes', 'nth-child'],
      filter: (type, key, value) => {
        if (type === 'attribute' && ['data-foo', 'a'].includes(key)) {
          return false
        }
        return true
      }
    } );
    expect( uniqueSelector ).to.equal( ':nth-child(2) > :nth-child(1)' );
  });

  describe('data attribute', () => {
    it( 'data-foo', () =>
    {
      $( 'body' ).append( '<div data-foo="so" class="test6"></div>' );
      const findNode = $( 'body' ).find( '.test6' ).get( 0 );
      const uniqueSelector = unique( findNode, { selectorTypes : ['data-foo'] } );
      expect( uniqueSelector ).to.equal( '[data-foo="so"]' );
    } );

    it( 'data-foo-bar-baz', () =>
    {
      $( 'body' ).append( '<div data-foo-bar-baz="so" class="test6"></div>' );
      const findNode = $( 'body' ).find( '.test6' ).get( 0 );
      const uniqueSelector = unique( findNode, { selectorTypes : ['data-foo-bar-baz'] } );
      expect( uniqueSelector ).to.equal( '[data-foo-bar-baz="so"]' );
    } );

    it( 'data-foo-bar with quotes', () =>
    {
      $( 'body' ).append( '<div data-foo-bar="button 123" class="test7"></div>' );
      const findNode = $( 'body' ).find( '.test7' ).get( 0 );
      const uniqueSelector = unique( findNode, { selectorTypes : ['data-foo-bar'] } );
      expect( uniqueSelector ).to.equal( '[data-foo-bar="button 123"]' );
    } );

    it( 'data-foo without value', () =>
    {
      $( 'body' ).append( '<div data-foo class="test7"></div>' );
      const findNode = $( 'body' ).find( '.test7' ).get( 0 );
      const uniqueSelector = unique( findNode, { selectorTypes : ['data-foo'] } );
      expect( uniqueSelector ).to.equal( '[data-foo]' );
    } );

    it('filters appropriately', () => {
      const filter = (type, key, value) => {
        if (type === 'attribute' && key === 'data-foo') {
          return value === 'abc'
        }
        return true
      }
      let el = $.parseHTML( '<div data-foo="abc" class="test1"></div>' )[0];
      $(el).appendTo('body')
      let uniqueSelector = unique( el, { filter, selectorTypes : ['data-foo', 'class'] } );
      expect( uniqueSelector ).to.equal( '[data-foo="abc"]' );

      el = $.parseHTML( '<div data-foo="def" class="test2"></div>' )[0];
      $(el).appendTo('body')
      uniqueSelector = unique( el, { filter, selectorTypes : ['data-foo', 'class'] } );
      expect( uniqueSelector ).to.equal( '.test2' );
    })
  });

  describe('standard attribute', () => {
    it('attribute without value', () => {
      $( 'body' ).append( '<div contenteditable class="test8"></div>' );
      const findNode = $( 'body' ).find( '.test8' ).get( 0 );
      const uniqueSelector = unique( findNode, { selectorTypes : ['attribute:contenteditable'] } );
      expect( uniqueSelector ).to.equal( '[contenteditable]' );
    })
    
    it('attribute with value', () => {
      $( 'body' ).append( '<div role="button" class="test9"></div>' );
      const findNode = $( 'body' ).find( '.test9' ).get( 0 );
      const uniqueSelector = unique( findNode, { selectorTypes : ['attribute:role'] } );
      expect( uniqueSelector ).to.equal( '[role="button"]' );
    })

    it('filters appropriately', () => {
      const filter = (type, key, value) => {
        if (type === 'attribute' && key === 'role') {
          return value === 'abc'
        }
        return true
      }
      let el = $.parseHTML( '<div role="abc" class="test1"></div>' )[0];
      $(el).appendTo('body')
      let uniqueSelector = unique( el, { filter, selectorTypes : ['attribute:role', 'class'] } );
      expect( uniqueSelector ).to.equal( '[role="abc"]' );

      el = $.parseHTML( '<div role="def" class="test2"></div>' )[0];
      $(el).appendTo('body')
      uniqueSelector = unique( el, { filter, selectorTypes : ['attribute:role', 'class'] } );
      expect( uniqueSelector ).to.equal( '.test2' );
    })
  })
  
  describe('name', () => {
    it( 'with value', () =>
    {
      $( 'body' ).append( '<div name="so" class="test3"></div>' );
      const findNode = $( 'body' ).find( '.test3' ).get( 0 );
      const uniqueSelector = unique( findNode );
      expect( uniqueSelector ).to.equal( '[name="so"]' );
    } );

    it( 'without value', () =>
    {
      $( 'body' ).append( '<div name class="test3"></div>' );
      const findNode = $( 'body' ).find( '.test3' ).get( 0 );
      const uniqueSelector = unique( findNode );
      expect( uniqueSelector ).to.equal( '.test3' );
    } );

    it('filters appropriately', () => {
      const filter = (type, key, value) => {
        if (type === 'attribute' && key === 'name') {
          return value === 'abc'
        }
        return true
      }
      let el = $.parseHTML( '<div name="abc" class="test1"></div>' )[0];
      $(el).appendTo('body')
      let uniqueSelector = unique( el, { filter } );
      expect( uniqueSelector ).to.equal( '[name="abc"]' );

      el = $.parseHTML( '<div name="def" class="test2"></div>' )[0];
      $(el).appendTo('body')
      uniqueSelector = unique( el, { filter } );
      expect( uniqueSelector ).to.equal( '.test2' );
    })
  })

  describe('nth-child', () => {
    it( 'builds expected selector', () =>
    {
      $( 'body' ).append( '<div><div class="test-nth-child"></div></div>' );
      const findNode = $( 'body' ).find( '.test-nth-child' ).get( 0 );
      const uniqueSelector = unique( findNode, { selectorTypes : ['nth-child'] } );
      expect( uniqueSelector ).to.equal( ':nth-child(2) > :nth-child(1) > :nth-child(1)' );
    } );

    it('filters appropriately', () => {
      const filter = (type, key, value) => {
        if (type === 'nth-child') {
          return value !== 1
        }
        return true
      }
      $( 'body' ).append( '<div><span class="test-nth-child"></span></div>' )[0];
      const findNode = $( 'body' ).find( '.test-nth-child' ).get( 0 );
      const uniqueSelector = unique( findNode, { filter, selectorTypes : ['nth-child', 'tag'] } );
      expect( uniqueSelector ).to.equal( 'span' );
    })
  })

  describe('shadow dom', () => {
    it( 'builds expected selector inside and outside shadow context', () => {
      $( 'body' ).append( '<div id="shadow-host" class="shadow-host-class"></div>' );

      const hostNode = $( '#shadow-host' ).get( 0 );
  
      const shadowRoot = hostNode.attachShadow({ mode: "open" })
      const shadowElement = hostNode.ownerDocument.createElement('div')
      shadowElement.innerHTML = `
        <div id="inner-shadow-container">
          <button id="shadow-button" class="shadow-button-class">Click Me</button>
        </div>
      `
      shadowRoot.appendChild(shadowElement);
    
      const uniqueSelectorForHost = unique( hostNode );
      expect( uniqueSelectorForHost ).to.equal( '#shadow-host' );
    
      const uniqueSelectorForShadowContent = unique ( shadowElement.querySelector('#shadow-button') )
      expect( uniqueSelectorForShadowContent ).to.equal( '#shadow-button' );
    })

    it( 'builds unique selector scoped to shadow root', () => {
      $( 'body' ).append( '<div id="shadow-host" class="shadow-host-class"></div>' );
      $( 'body' ).append( '<button class="shadow-button-class">Click Me Third</button>' );

      const hostNode = $( '#shadow-host' ).get( 0 );
  
      const shadowRoot = hostNode.attachShadow({ mode: "open" })
      const shadowElement = hostNode.ownerDocument.createElement('div')
      shadowElement.innerHTML = `
        <div id="inner-shadow-container">
          <button class="shadow-button-class">Click Me First</button>
          <button class="shadow-button-class">Click Me Second</button>
        </div>
      `
      shadowRoot.appendChild(shadowElement);
        
      const uniqueSelectorInRootDocument = unique( $( 'body' ).find( '.shadow-button-class' ).get( 0 ) );
      expect( uniqueSelectorInRootDocument ).to.equal( '.shadow-button-class' );

      const uniqueSelectorForShadowContent = unique ( shadowElement.querySelectorAll('.shadow-button-class')[0] )
      expect( uniqueSelectorForShadowContent ).to.equal( '#inner-shadow-container > :nth-child(1)' );
    })

    it( 'builds expected selector inside shadow root when first-level child selector matches nested children', () => {
      /*
      Shadow roots are capable of containing non-unique elements at the root level which, when building selectors,
      will fall back to nth-child. If there also happens to be nested content that nth-child would evaluate to non-unique.
      When creating a selector for a top-level element under a ShadowRoot which happens to fall back to nth-child we
      should prefix with the `:host` pseudo-class to prevent this.

      <div id="shadow-host">
        # shadow-root (open)
          <button />  <!-- :nth-child(1) -->
          <div> <!-- :nth-child(2) -->
            <button />  <!-- !!!!! Also matches :nth-child(1) due to being first child of `div`, thus exploding selector generation -->
          </div>
          <input />  <!-- :nth-child(3) -->
      </div>
      */
      
      $( 'body' ).append( '<div id="shadow-host" class="shadow-host-class"></div>' );

      const hostNode = $( '#shadow-host' ).get( 0 );
  
      const shadowRoot = hostNode.attachShadow({ mode: "open" })
      const topLevelButton = hostNode.ownerDocument.createElement('button')
      const nestedContainer = hostNode.ownerDocument.createElement('div')
      const topLevelInput = hostNode.ownerDocument.createElement('input')
      nestedContainer.innerHTML = '<button /><p/>'
      shadowRoot.appendChild(topLevelButton)
      shadowRoot.appendChild(nestedContainer)
      shadowRoot.appendChild(topLevelInput)
    
      const uniqueSelectorForHost = unique( hostNode );
      expect( uniqueSelectorForHost ).to.equal( '#shadow-host' );
    
      const buttons = shadowRoot.querySelectorAll('button');
      expect(buttons.length).to.equal(2);

      // Non-unique tag at shadow root level
      // - should build a :host-based selector due to conflict with nested element, no tag use
      let value = unique( buttons[0], { selectorTypes : ['tag', 'nth-child'] } );
      expect( value ).to.equal( ':host > :nth-child(1)' );
      expect( shadowRoot.querySelectorAll(value).length).to.equal(1)
      expect( shadowRoot.querySelectorAll(value)[0]).to.equal( buttons[0] );
      // - should build a :host-based nth-child selector due to conflict with nested element
      value = unique( buttons[0], { selectorTypes : ['nth-child'] } );
      expect( value ).to.equal( ':host > :nth-child(1)' );
      expect( shadowRoot.querySelectorAll(value).length).to.equal(1)
      expect( shadowRoot.querySelectorAll(value)[0]).to.equal( buttons[0] );
      
      // Nested non-unique tag
      // - should construct a normal selector with tag due to no conflict with nested element
      value = unique( buttons[1], { selectorTypes : ['tag', 'nth-child'] } );
      expect( value ).to.equal( 'div > button' );
      expect( shadowRoot.querySelectorAll(value).length).to.equal(1)
      expect( shadowRoot.querySelectorAll(value)[0]).to.equal( buttons[1] );
      // - should build not need a :host-based selector since a unique path exists
      value = unique( buttons[1], { selectorTypes : ['nth-child'] } );
      expect( value ).to.equal( ':nth-child(2) > :nth-child(1)' );
      expect( shadowRoot.querySelectorAll(value).length).to.equal(1)
      expect( shadowRoot.querySelectorAll(value)[0]).to.equal( buttons[1] );

      const inputs = shadowRoot.querySelectorAll('input');
      expect(inputs.length).to.equal(1);
      // Unique input at shadow root level
      // - should not build a :host-based selector since it's unique, should use tag
      value = unique( inputs[0], { selectorTypes : ['tag', 'nth-child'] } );
      expect( value ).to.equal( 'input' );
      expect( shadowRoot.querySelectorAll(value).length).to.equal(1)
      expect( shadowRoot.querySelectorAll(value)[0]).to.equal( inputs[0] );
      // - should not build a :host-based selector since it's unique, should use nth-child
      value = unique( inputs[0], { selectorTypes : ['nth-child'] } );
      expect( value ).to.equal( ':nth-child(3)' );
      expect( shadowRoot.querySelectorAll(value).length).to.equal(1)
      expect( shadowRoot.querySelectorAll(value)[0]).to.equal( inputs[0] );
    })
  })

  it('should return null for element with no parent', () => {
    const el = $( 'body' )[0].ownerDocument.createElement('div');
    const uniqueSelector = unique( el );
    expect( uniqueSelector ).to.equal( null );
  })

  describe('significantAncestors', () => {
    describe('all mode', () => {
      it('should include all matching ancestors with single attribute', () => {
        $( 'body' ).append(`
          <div data-cy="foo">
            <div data-cy="bar">
              <div data-cy="baz">
                <button id="my-button">Test</button>
              </div>
            </div>
          </div>
        `);
        
        const button = $( '#my-button' ).get( 0 );
        const uniqueSelector = unique( button, {
          significantAncestors: {
            attributes: [{
              attribute: 'data-cy',
              value: '*'
            }],
            type: 'all'
          }
        });
        
        expect( uniqueSelector ).to.equal( '[data-cy="foo"] [data-cy="bar"] [data-cy="baz"] #my-button' );
      });

      it('should include multiple attributes on same ancestor', () => {
        $( 'body' ).append(`
          <div data-cy="foo" data-tyler="buzz">
            <div data-cy="bar" data-tyler="is cool">
              <button id="my-button">Test</button>
            </div>
          </div>
        `);
        
        const button = $( '#my-button' ).get( 0 );
        const uniqueSelector = unique( button, {
          significantAncestors: {
            attributes: [{
              attribute: 'data-cy',
              value: '*'
            }, {
              attribute: 'data-tyler',
              value: 'is cool'
            }],
            type: 'all'
          }
        });
        
        expect( uniqueSelector ).to.equal( '[data-cy="foo"] [data-cy="bar"][data-tyler="is cool"] #my-button' );
      });

      it('should work when element itself has significant attributes', () => {
        $( 'body' ).append(`
          <div data-cy="foo">
            <button data-cy="my-button">Test</button>
          </div>
        `);
        
        const button = $( 'button' ).get( 0 );
        const uniqueSelector = unique( button, {
          significantAncestors: {
            attributes: [{
              attribute: 'data-cy',
              value: '*'
            }],
            type: 'all'
          }
        });
        
        expect( uniqueSelector ).to.equal( '[data-cy="foo"] [data-cy="my-button"]' );
      });

      it('should maintain uniqueness by adding nth-child when needed', () => {
        $( 'body' ).append(`
          <div data-cy="container">
            <button>First</button>
            <button>Second</button>
            <button>Third</button>
          </div>
        `);
        
        const secondButton = $( 'button' ).get( 1 );
        const uniqueSelector = unique( secondButton, {
          significantAncestors: {
            attributes: [{
              attribute: 'data-cy',
              value: '*'
            }],
            type: 'all'
          }
        });
        
        // Should include data-cy and add nth-child for uniqueness
        expect( uniqueSelector ).to.equal( '[data-cy="container"] > :nth-child(2)' );
      });

      it('should respect regex pattern matching', () => {
        $( 'body' ).append(`
          <div data-cy="foo" data-test="match-this">
            <div data-cy="bar" data-test="skip-this">
              <button id="btn">Test</button>
            </div>
          </div>
        `);
        
        const button = $( '#btn' ).get( 0 );
        const uniqueSelector = unique( button, {
          significantAncestors: {
            attributes: [{
              attribute: 'data-cy',
              value: '*'
            }, {
              attribute: 'data-test',
              value: 'match-.*'
            }],
            type: 'all'
          }
        });
        
        // Should include data-cy from both, but data-test only from first div
        expect( uniqueSelector ).to.equal( '[data-cy="foo"][data-test="match-this"] [data-cy="bar"] #btn' );
      });

      it('should work with no matching ancestors', () => {
        $( 'body' ).append(`
          <div>
            <button id="btn">Test</button>
          </div>
        `);
        
        const button = $( '#btn' ).get( 0 );
        const uniqueSelector = unique( button, {
          significantAncestors: {
            attributes: [{
              attribute: 'data-cy',
              value: '*'
            }],
            type: 'all'
          }
        });
        
        // Should fall back to normal selector generation
        expect( uniqueSelector ).to.equal( '#btn' );
      });
    });

    describe('closest mode', () => {
      it('should include only nearest matching ancestor', () => {
        $( 'body' ).append(`
          <div data-cy="foo">
            <div data-cy="bar">
              <div data-cy="baz">
                <button id="my-button">Test</button>
              </div>
            </div>
          </div>
        `);
        
        const button = $( '#my-button' ).get( 0 );
        const uniqueSelector = unique( button, {
          significantAncestors: {
            attributes: [{
              attribute: 'data-cy',
              value: '*'
            }],
            type: 'closest'
          }
        });
        
        expect( uniqueSelector ).to.equal( '[data-cy="baz"] #my-button' );
      });

      it('should include multiple attributes from same closest ancestor', () => {
        $( 'body' ).append(`
          <div data-cy="foo" data-tyler="buzz">
            <div data-cy="bar" data-tyler="is cool">
              <button id="my-button">Test</button>
            </div>
          </div>
        `);
        
        const button = $( '#my-button' ).get( 0 );
        const uniqueSelector = unique( button, {
          significantAncestors: {
            attributes: [{
              attribute: 'data-cy',
              value: '*'
            }, {
              attribute: 'data-tyler',
              value: 'is cool'
            }],
            type: 'closest'
          }
        });
        
        expect( uniqueSelector ).to.equal( '[data-cy="bar"][data-tyler="is cool"] #my-button' );
      });

      it('should work when element itself is the closest', () => {
        $( 'body' ).append(`
          <div data-cy="foo">
            <button data-cy="my-button" id="btn">Test</button>
          </div>
        `);
        
        const button = $( '#btn' ).get( 0 );
        const uniqueSelector = unique( button, {
          significantAncestors: {
            attributes: [{
              attribute: 'data-cy',
              value: '*'
            }],
            type: 'closest'
          }
        });
        
        expect( uniqueSelector ).to.equal( '[data-cy="my-button"]' );
      });

      it('should support per-attribute type configuration', () => {
        $( 'body' ).append(`
          <div data-cy="1">
            <div data-cy="2" data-foo="outer">
              <div data-cy="3" data-foo="inner">
                <button id="btn">Test</button>
              </div>
            </div>
          </div>
        `);
        
        const button = $( '#btn' ).get( 0 );
        const uniqueSelector = unique( button, {
          significantAncestors: {
            attributes: [
              { attribute: 'data-cy', value: '*', type: 'all' },
              { attribute: 'data-foo', value: '*', type: 'closest' }
            ]
          }
        });
        
        // data-cy uses 'all' - include all 3 ancestors (1, 2, 3)
        // data-foo uses 'closest' - include only nearest (inner on element with data-cy="3")
        // Result: element with data-cy="2" has data-foo="outer" but it's NOT the closest, so omit it
        expect( uniqueSelector ).to.equal( '[data-cy="1"] [data-cy="2"] [data-cy="3"][data-foo="inner"] #btn' );
      });
    });

    describe('caching', () => {
      it('should use significantAttributesCache when provided', () => {
        $( 'body' ).append(`
          <div data-cy="foo">
            <button id="btn1">Test 1</button>
            <button id="btn2">Test 2</button>
          </div>
        `);
        
        const cache = new Map();
        const button1 = $( '#btn1' ).get( 0 );
        const button2 = $( '#btn2' ).get( 0 );
        
        const options = {
          significantAncestors: {
            attributes: [{
              attribute: 'data-cy',
              value: '*'
            }],
            type: 'all'
          },
          significantAttributesCache: cache
        };
        
        const selector1 = unique( button1, options );
        expect( selector1 ).to.equal( '[data-cy="foo"] #btn1' );
        
        // Cache should have been populated
        expect( cache.size ).to.be.greaterThan( 0 );
        
        // Second call should reuse cache
        const selector2 = unique( button2, options );
        expect( selector2 ).to.equal( '[data-cy="foo"] #btn2' );
      });

      it('should work with same cache across different type configurations', () => {
        $( 'body' ).append(`
          <div data-cy="outer">
            <div data-cy="middle">
              <div data-cy="inner">
                <button id="btn">Test</button>
              </div>
            </div>
          </div>
        `);
        
        const cache = new Map();
        const button = $( '#btn' ).get( 0 );
        
        // First call with 'all' type - caches all ancestors
        const selector1 = unique( button, {
          significantAncestors: {
            attributes: [{ attribute: 'data-cy', value: '*' }],
            type: 'all'
          },
          significantAttributesCache: cache
        });
        expect( selector1 ).to.equal( '[data-cy="outer"] [data-cy="middle"] [data-cy="inner"] #btn' );
        
        const cacheSize = cache.size;
        expect( cacheSize ).to.be.greaterThan( 0 );
        
        // Second call with SAME element but 'closest' type
        // Should reuse cached data but apply different filtering
        const selector2 = unique( button, {
          significantAncestors: {
            attributes: [{ attribute: 'data-cy', value: '*' }],
            type: 'closest'
          },
          significantAttributesCache: cache
        });
        expect( selector2 ).to.equal( '[data-cy="inner"] #btn' );
        
        // Cache should not have grown (all data was already cached)
        expect( cache.size ).to.equal( cacheSize );
      });

      it('should cache elements without significant attributes for faster sibling lookups', () => {
        $( 'body' ).append(`
          <div data-cy="container">
            <div class="wrapper">
              <button id="btn1">Button 1</button>
              <button id="btn2">Button 2</button>
            </div>
          </div>
        `);
        
        const cache = new Map();
        const button1 = $( '#btn1' ).get( 0 );
        const button2 = $( '#btn2' ).get( 0 );
        const wrapper = button1.parentElement;
        
        // First call on btn1 - will cache btn1, wrapper, and container
        const selector1 = unique( button1, {
          significantAncestors: {
            attributes: [{ attribute: 'data-cy', value: '*' }],
            type: 'all'
          },
          significantAttributesCache: cache
        });
        expect( selector1 ).to.equal( '[data-cy="container"] #btn1' );
        
        // wrapper should be in cache even though it has no significant attributes
        expect( cache.has(wrapper) ).to.equal( true );
        const wrapperData = cache.get(wrapper);
        expect( Object.keys(wrapperData.matchedAttributes).length ).to.equal( 0 ); // No significant attrs
        expect( wrapperData.significantParents.length ).to.be.greaterThan( 0 ); // But knows about container!
        
        const cacheSize = cache.size;
        
        // Second call on btn2 (sibling of btn1)
        // Should hit cache on wrapper, avoiding full traversal
        const selector2 = unique( button2, {
          significantAncestors: {
            attributes: [{ attribute: 'data-cy', value: '*' }],
            type: 'all'
          },
          significantAttributesCache: cache
        });
        expect( selector2 ).to.equal( '[data-cy="container"] #btn2' );
        
        // Cache should have grown by only 1 (btn2), wrapper and container already cached
        expect( cache.size ).to.equal( cacheSize + 1 );
      });
    });

    describe('edge cases', () => {
      it('should handle empty attribute value', () => {
        $( 'body' ).append(`
          <div data-cy="">
            <button id="btn">Test</button>
          </div>
        `);
        
        const button = $( '#btn' ).get( 0 );
        const uniqueSelector = unique( button, {
          significantAncestors: {
            attributes: [{
              attribute: 'data-cy',
              value: '*'
            }],
            type: 'all'
          }
        });
        
        expect( uniqueSelector ).to.equal( '[data-cy=""] #btn' );
      });

      it('should handle invalid regex pattern gracefully', () => {
        $( 'body' ).append(`
          <div data-cy="foo">
            <button id="btn">Test</button>
          </div>
        `);
        
        const button = $( '#btn' ).get( 0 );
        const uniqueSelector = unique( button, {
          significantAncestors: {
            attributes: [{
              attribute: 'data-cy',
              value: '[invalid('
            }],
            type: 'all'
          }
        });
        
        // Should fall back to normal selector generation
        expect( uniqueSelector ).to.equal( '#btn' );
      });

      it('should not affect performance when option not provided', () => {
        $( 'body' ).append(`
          <div data-cy="foo">
            <button id="btn">Test</button>
          </div>
        `);
        
        const button = $( '#btn' ).get( 0 );
        const uniqueSelector = unique( button );
        
        // Should work as normal
        expect( uniqueSelector ).to.equal( '#btn' );
      });

      it('should not duplicate attributes when significant attribute is also in selectorTypes', () => {
        $( 'body' ).append(`
          <div data-test="container">
            <button data-test="btn">Button 1</button>
            <button data-test="btn">Button 2</button>
          </div>
        `);
        
        const button1 = $( 'button' ).get( 0 );
        const uniqueSelector = unique( button1, {
          selectorTypes: ['data-test', 'nth-child'],
          significantAncestors: {
            attributes: [{
              attribute: 'data-test',
              value: '*'
            }],
            type: 'all'
          }
        });
        
        // [data-test="btn"] alone is not unique, needs nth-child
        // Should not have duplicate [data-test="btn"][data-test="btn"]
        expect( uniqueSelector ).to.equal( '[data-test="container"] [data-test="btn"]:nth-child(1)' );
        // Verify no duplicates in the selector
        const matches = uniqueSelector.match(/\[data-test="btn"\]/g);
        expect( matches.length ).to.equal( 1 );
      });

      it('should maintain correct CSS selector order when combining with pseudo-selectors', () => {
        $( 'body' ).append(`
          <div data-cy="container">
            <div data-cy="wrapper">
              <span data-cy="btn">Span 1</span>
              <span data-cy="btn">Span 2</span>
            </div>
            <div data-cy="wrapper">
              <span data-cy="btn">Span 3</span>
            </div>
          </div>
        `);
        
        const span1 = $( 'span' ).get( 0 );
        const uniqueSelector = unique( span1, {
          selectorTypes: ['tag', 'nth-child'],  // Don't include data-cy in selectorTypes
          significantAncestors: {
            attributes: [{ attribute: 'data-cy', value: '*' }],
            type: 'all'
          }
        });
        
        // [data-cy="wrapper"] [data-cy="btn"] is not unique (multiple match)
        // Needs tag and/or nth-child to disambiguate
        // Correct order: tag[attributes]:pseudo
        // Should be something like: span[data-cy="btn"]:nth-child(1) or [data-cy="wrapper"]:nth-child(1) > span[data-cy="btn"]
        
        // The key test: if attributes and pseudo-selectors are combined, attributes must come before pseudo
        // Regex checks that we don't have patterns like ]:nth-child(1)span or similar
        const hasAttributeBeforePseudo = /\[data-cy="[^"]+"\]:nth-child/.test(uniqueSelector);
        const hasInvalidOrdering = /:nth-child\(\d+\)\[data-cy/.test(uniqueSelector) || /:nth-child\(\d+\)span/.test(uniqueSelector);
        
        expect( hasInvalidOrdering ).to.equal( false, 'Selector has invalid CSS ordering' );
        
        // Verify selector is valid and unique
        const root = span1.getRootNode();
        const matches = root.querySelectorAll(uniqueSelector);
        expect( matches.length ).to.equal( 1 );
        expect( matches[0] ).to.equal( span1 );
      });

      it('should avoid redundancy when combining significant attributes with regular selector', () => {
        $( 'body' ).append(`
          <div data-cy="outer">
            <div data-cy="inner">
              <span data-cy="item"></span>
              <span data-cy="item"></span>
            </div>
          </div>
        `);
        
        const span1 = $( 'span' ).get( 0 );
        const uniqueSelector = unique( span1, {
          selectorTypes: ['data-cy', 'tag', 'nth-child'],
          significantAncestors: {
            attributes: [{
              attribute: 'data-cy',
              value: '*'
            }],
            type: 'all'
          }
        });
        
        // [data-cy="item"] alone is not unique, needs nth-child
        // Should not have duplicate [data-cy="item"][data-cy="item"]
        expect( uniqueSelector ).to.equal( '[data-cy="outer"] [data-cy="inner"] [data-cy="item"]:nth-child(1)' );
        // Each data-cy="item" should appear exactly once
        const itemMatches = uniqueSelector.match(/\[data-cy="item"\]/g);
        expect( itemMatches.length ).to.equal( 1 );
      });

      it('should handle multiple significant attributes without duplication', () => {
        $( 'body' ).append(`
          <div data-test="div1" data-cy="container">
            <button data-test="btn" data-cy="btn">Button 1</button>
            <button data-test="btn" data-cy="btn">Button 2</button>
          </div>
        `);
        
        const button = $( 'button' ).get( 0 );
        const uniqueSelector = unique( button, {
          selectorTypes: ['data-test', 'data-cy', 'tag', 'nth-child'],
          significantAncestors: {
            attributes: [
              { attribute: 'data-test', value: '*' },
              { attribute: 'data-cy', value: '*' }
            ],
            type: 'all'
          }
        });
        
        // [data-test="btn"][data-cy="btn"] alone is not unique, needs nth-child
        // Should not have duplicates like [data-test="btn"][data-test="btn"]
        expect( uniqueSelector ).to.equal( '[data-test="div1"][data-cy="container"] [data-test="btn"][data-cy="btn"]:nth-child(1)' );
        // Verify no duplicates
        expect( (uniqueSelector.match(/data-test="btn"/g) || []).length ).to.equal( 1 );
        expect( (uniqueSelector.match(/data-cy="btn"/g) || []).length ).to.equal( 1 );
      });

      it('should only ignore attributes that actually matched, not all configured attributes', () => {
        $( 'body' ).append(`
          <div data-cy="container">
            <button data-other="unique-value">Button 1</button>
            <button data-other="unique-value2">Button 2</button>
          </div>
        `);
        
        const button1 = $( 'button' ).get( 0 );
        const uniqueSelector = unique( button1, {
          selectorTypes: ['data-cy', 'data-other', 'nth-child'],
          significantAncestors: {
            attributes: [
              { attribute: 'data-cy', value: '*' },
              { attribute: 'data-test', value: '*' }  // This won't match (element doesn't have it)
            ],
            type: 'all'
          }
        });
        
        // Should include data-cy from ancestor (matched significant attribute)
        // AND data-other from button (not a significant attribute, so not ignored)
        // data-test should NOT be ignored since it didn't match
        expect( uniqueSelector ).to.equal( '[data-cy="container"] [data-other="unique-value"]' );
      });

      it('should combine descendant selectors for significant ancestors with direct child selectors when needed', () => {
        $( 'body' ).append(`
          <div data-cy="outer">
            <div data-cy="inner">
              <div class="path">
                <div class="to">
                  <button>Button 1</button>
                </div>
              </div>
            </div>
            <div data-cy="inner">
              <div class="path">
                <div class="to">
                  <button>Button 2</button>
                </div>
              </div>
            </div>
          </div>
        `);
        
        const button1 = $( 'button' ).get( 0 );
        const uniqueSelector = unique( button1, {
          selectorTypes: ['data-cy', 'class', 'tag', 'nth-child'],
          significantAncestors: {
            attributes: [{ attribute: 'data-cy', value: '*' }],
            type: 'all'
          }
        });
        
        // [data-cy="outer"] [data-cy="inner"] button is NOT unique (both buttons match)
        // So it falls back to building the full path with direct child selectors
        // Result should have:
        // - Descendant selectors (space) for significant ancestors
        // - Direct child selectors (>) for the built path
        expect( uniqueSelector ).to.include( '[data-cy="outer"]' );
        expect( uniqueSelector ).to.include( '[data-cy="inner"]' );
        expect( uniqueSelector ).to.match( /\.path > \.to > button|\.path > \.to > :nth-child\(1\)/ );
        
        // Verify the selector is actually unique
        const root = button1.getRootNode();
        const matches = root.querySelectorAll(uniqueSelector);
        expect( matches.length ).to.equal( 1 );
        expect( matches[0] ).to.equal( button1 );
      });

      it('should build complete path with all direct child selectors when optimization fails', () => {
        $( 'body' ).append(`
          <div data-test="1">
            <div data-cy="outer">
              <div data-cy="inner">
                <button>Button 1</button>
              </div>
            </div>
          </div>
          <div data-test="1">
            <div data-cy="outer">
              <div data-cy="inner">
                <button>Button 2</button>
              </div>
            </div>
          </div>
        `);
        
        const button1 = $( 'button' ).get( 0 );
        const uniqueSelector = unique( button1, {
          selectorTypes: ['data-test', 'data-cy', 'tag', 'nth-child'],
          significantAncestors: {
            attributes: [{ attribute: 'data-cy', value: '*' }],
            type: 'all'
          }
        });
        
        // [data-cy="outer"] [data-cy="inner"] button is NOT unique (duplicate structure)
        // Falls back to normal iteration which builds full path with >
        // Should include ALL ancestors (both significant and non-significant) with >
        
        // Should include significant ancestors
        expect( uniqueSelector ).to.include( '[data-cy="outer"]' );
        expect( uniqueSelector ).to.include( '[data-cy="inner"]' );
        
        // Should include a non-significant ancestor selector (nth-child or data-test)
        expect( uniqueSelector ).to.match( /:nth-child\(1\)|\[data-test="1"\]/ );
        
        // Should use > for all relationships (no space descendant selectors in final result)
        // All parts should be connected with >
        expect( uniqueSelector.split(' ').filter(part => part === '>').length ).to.be.greaterThan( 2 );
        expect( uniqueSelector ).to.match( /> \[data-cy="outer"\] > \[data-cy="inner"\] > button/ );
        
        // Verify the selector is actually unique
        const root = button1.getRootNode();
        const matches = root.querySelectorAll(uniqueSelector);
        expect( matches.length ).to.equal( 1 );
        expect( matches[0] ).to.equal( button1 );
      });
    });
  });
} );
