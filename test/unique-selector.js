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

  describe('requiredAttributes', () => {
    it('appends required attribute to unique element selector', () => {
      $( 'body' ).append( '<div class="foo" data-test="Foo"></div>' );
      const el = $( '.foo' ).get( 0 );
      const result = unique( el, {
        requiredAttributes: [{ attributeName: 'data-test', value: '.*' }]
      });
      expect( result ).to.equal( '.foo[data-test="Foo"]' );
    });

    it('includes ancestors with matching required attributes', () => {
      $( 'body' ).append(
        '<div data-foo="foo-1"><div data-foo="foo-2"><button id="my-button"></button></div></div>'
      );
      const el = $( '#my-button' ).get( 0 );
      const result = unique( el, {
        requiredAttributes: [{ attributeName: 'data-foo', value: '.*' }]
      });
      expect( result ).to.equal( '[data-foo="foo-1"] [data-foo="foo-2"] #my-button' );
    });

    it('includes both target and ancestor required attributes', () => {
      $( 'body' ).append(
        '<div data-foo="val"><button data-test="btn"></button></div>'
      );
      const el = $( 'button' ).get( 0 );
      const result = unique( el, {
        requiredAttributes: [
          { attributeName: 'data-foo', value: '.*' },
          { attributeName: 'data-test', value: '.*' }
        ]
      });
      expect( result ).to.equal( '[data-foo="val"] button[data-test="btn"]' );
    });

    it('returns normal selector when no elements match', () => {
      $( 'body' ).append( '<div class="bar"></div>' );
      const el = $( '.bar' ).get( 0 );
      const result = unique( el, {
        requiredAttributes: [{ attributeName: 'data-test', value: '.*' }]
      });
      expect( result ).to.equal( '.bar' );
    });

    it('applies regex filtering on attribute values', () => {
      $( 'body' ).append(
        '<div data-foo="foo-1"><div data-foo="bar-2"><button id="btn"></button></div></div>'
      );
      const el = $( '#btn' ).get( 0 );
      const result = unique( el, {
        requiredAttributes: [{ attributeName: 'data-foo', value: '^foo' }]
      });
      // Only data-foo="foo-1" matches the ^foo regex, not data-foo="bar-2"
      expect( result ).to.equal( '[data-foo="foo-1"] #btn' );
    });

    it('matches multiple requiredAttributes entries', () => {
      $( 'body' ).append(
        '<div data-section="header"><div data-test="nav"><span id="item"></span></div></div>'
      );
      const el = $( '#item' ).get( 0 );
      const result = unique( el, {
        requiredAttributes: [
          { attributeName: 'data-section', value: '.*' },
          { attributeName: 'data-test', value: '.*' }
        ]
      });
      expect( result ).to.equal( '[data-section="header"] [data-test="nav"] #item' );
    });

    it('behaves normally with empty requiredAttributes array', () => {
      $( 'body' ).append( '<div class="baz"></div>' );
      const el = $( '.baz' ).get( 0 );
      const result = unique( el, {
        requiredAttributes: []
      });
      expect( result ).to.equal( '.baz' );
    });

    it('skips intermediate non-matching elements', () => {
      $( 'body' ).append(
        '<div data-foo="outer"><div class="middle"><div data-foo="inner"><button id="target"></button></div></div></div>'
      );
      const el = $( '#target' ).get( 0 );
      const result = unique( el, {
        requiredAttributes: [{ attributeName: 'data-foo', value: '.*' }]
      });
      // .middle div should be skipped, using descendant selectors
      expect( result ).to.equal( '[data-foo="outer"] [data-foo="inner"] #target' );
    });

    it('inserts required attribute before nth-child in base selector', () => {
      $( 'body' ).append(
        '<div><span data-test="a"></span><span data-test="b"></span></div>'
      );
      const el = $( 'span' ).get( 0 );
      const result = unique( el, {
        requiredAttributes: [{ attributeName: 'data-test', value: '.*' }]
      });
      expect( result ).to.equal( '[data-test="a"]:nth-child(1)' );
    });

    it('decorates required attrs into base selector with child combinators', () => {
      // Two parallel trees so that .inner and button aren't globally unique
      $( 'body' ).append(
        '<div data-test="app">' +
          '<div class="outer">' +
            '<div class="inner" data-test="inner-comp">' +
              '<button>A</button>' +
            '</div>' +
          '</div>' +
          '<div class="outer">' +
            '<div class="inner">' +
              '<button>B</button>' +
            '</div>' +
          '</div>' +
        '</div>'
      );
      const el = $( 'body' ).find( 'button' ).get( 0 );

      // Without requiredAttributes, verify the base selector uses > combinators
      const baseResult = unique( el );
      expect( baseResult ).to.equal( ':nth-child(1) > .inner > button' );

      // With requiredAttributes, data-test should be woven into the > chain
      // .inner has data-test="inner-comp" and is IN the > chain — attr should be
      // appended to its segment, not prepended as a separate ancestor.
      // data-test="app" is ABOVE the chain — prepended with descendant combinator.
      const result = unique( el, {
        requiredAttributes: [{ attributeName: 'data-test', value: '.*' }]
      });
      expect( result ).to.equal( '[data-test="app"] .inner[data-test="inner-comp"] > button' );
    });

    it('handles required attrs on multiple elements within the > chain', () => {
      $( 'body' ).append(
        '<div data-test="root">' +
          '<div class="a" data-test="section-a">' +
            '<div class="b" data-test="panel">' +
              '<span>X</span>' +
            '</div>' +
          '</div>' +
          '<div class="a" data-test="section-b">' +
            '<div class="b">' +
              '<span>Y</span>' +
            '</div>' +
          '</div>' +
        '</div>'
      );
      const el = $( 'body' ).find( 'span' ).get( 0 );

      const result = unique( el, {
        requiredAttributes: [{ attributeName: 'data-test', value: '.*' }]
      });
      // data-test="root" is above the chain, data-test="section-a" and
      // data-test="panel" are elements in the > chain
      expect( result ).to.equal( '[data-test="root"] [data-test="section-a"] .b[data-test="panel"] > span' );
    });

    it('uses cache for sibling elements', () => {
      $( 'body' ).append(
        '<div data-foo="parent"><span id="a"></span><span id="b"></span></div>'
      );
      const cache = new Map();
      const elA = $( '#a' ).get( 0 );
      const elB = $( '#b' ).get( 0 );
      const opts = {
        requiredAttributes: [{ attributeName: 'data-foo', value: '.*' }],
        requiredAttributesCache: cache,
      };

      const resultA = unique( elA, opts );
      expect( resultA ).to.equal( '[data-foo="parent"] #a' );
      // Cache should have entries after first call
      expect( cache.size ).to.be.greaterThan( 0 );

      const resultB = unique( elB, opts );
      expect( resultB ).to.equal( '[data-foo="parent"] #b' );
    });

    it('deep nesting (8 levels) with required attrs at levels 1, 3, 6', () => {
      // Duplicate nav-items force a > chain for uniqueness.
      // Required attrs at depth 1 (app), 3 (sidebar), 6 (nav-section).
      $( 'body' ).append(
        '<div data-cy="app" class="root">' +
          '<main class="layout">' +
            '<div data-cy="sidebar" class="panel">' +
              '<ul class="nav">' +
                '<li class="nav-item">' +
                  '<div data-cy="nav-section" class="section">' +
                    '<div class="item-wrapper">' +
                      '<a class="link">Link A</a>' +
                    '</div>' +
                  '</div>' +
                '</li>' +
                '<li class="nav-item">' +
                  '<div class="section">' +
                    '<div class="item-wrapper">' +
                      '<a class="link">Link B</a>' +
                    '</div>' +
                  '</div>' +
                '</li>' +
              '</ul>' +
            '</div>' +
          '</main>' +
        '</div>'
      );
      const el = $( 'body' ).find( 'a.link' ).get( 0 );

      // Base uses nth-child to disambiguate the two nav-items
      expect( unique( el ) ).to.equal(
        ':nth-child(1) > .section > .item-wrapper > .link'
      );

      // data-cy="nav-section" woven into the .section segment of the > chain,
      // data-cy="app" and data-cy="sidebar" above the chain as ancestors
      expect( unique( el, {
        requiredAttributes: [{ attributeName: 'data-cy', value: '.*' }]
      })).to.equal(
        '[data-cy="app"] [data-cy="sidebar"] .section[data-cy="nav-section"] > .item-wrapper > .link'
      );
    });

    it('sibling subtrees with target having a required attr and duplicates', () => {
      // Two card subtrees with duplicate structure. Target button has data-test.
      // Sibling button in same card + button in duplicate card.
      $( 'body' ).append(
        '<div id="app">' +
          '<div data-test="header" class="region">' +
            '<nav class="nav"><a class="logo">Logo</a></nav>' +
          '</div>' +
          '<div data-test="content" class="region">' +
            '<div class="container">' +
              '<div data-test="card" class="card">' +
                '<div class="card-body">' +
                  '<div class="row">' +
                    '<div class="col"><button class="btn" data-test="submit">Go</button></div>' +
                    '<div class="col"><button class="btn">Cancel</button></div>' +
                  '</div>' +
                '</div>' +
              '</div>' +
              '<div data-test="card" class="card">' +
                '<div class="card-body">' +
                  '<div class="row">' +
                    '<div class="col"><button class="btn" data-test="reset">Reset</button></div>' +
                  '</div>' +
                '</div>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>'
      );
      const el = $( 'button[data-test="submit"]' ).get( 0 );

      // Base needs a long > chain to disambiguate through duplicate cards and cols
      expect( unique( el ) ).to.equal(
        ':nth-child(1) > .card-body > .row > :nth-child(1) > .btn'
      );

      // data-test="submit" on target makes it unique early,
      // data-test="content" and data-test="card" above as ancestors
      expect( unique( el, {
        requiredAttributes: [{ attributeName: 'data-test', value: '.*' }]
      })).to.equal(
        '[data-test="content"] [data-test="card"] .btn[data-test="submit"]'
      );
    });

    it('regex filters out non-matching required attrs at various depths', () => {
      // data-test values at multiple levels; regex ^page- excludes "internal-layout"
      $( 'body' ).append(
        '<div data-test="page-home" class="page">' +
          '<div data-test="internal-layout" class="layout">' +
            '<div class="sidebar">' +
              '<div data-test="page-nav" class="widget">' +
                '<div class="widget-body">' +
                  '<ul class="list">' +
                    '<li class="list-item">' +
                      '<a class="action" data-test="page-link-1">L1</a>' +
                    '</li>' +
                    '<li class="list-item">' +
                      '<a class="action" data-test="page-link-2">L2</a>' +
                    '</li>' +
                  '</ul>' +
                '</div>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>'
      );
      const el = $( 'a[data-test="page-link-1"]' ).get( 0 );

      expect( unique( el ) ).to.equal( ':nth-child(1) > .action' );

      // "internal-layout" does NOT match ^page-, so it's excluded
      expect( unique( el, {
        requiredAttributes: [{ attributeName: 'data-test', value: '^page-' }]
      })).to.equal(
        '[data-test="page-home"] [data-test="page-nav"] .action[data-test="page-link-1"]'
      );
    });

    it('two requiredAttributes (data-cy + data-region) across 8 levels', () => {
      // Required attrs from two different attribute names interleaved at different levels.
      // Duplicate panes force > chain.
      $( 'body' ).append(
        '<div data-region="main" class="app">' +
          '<div data-cy="dashboard">' +
            '<div class="grid">' +
              '<div data-region="left" class="pane">' +
                '<div data-cy="widget-a" class="widget">' +
                  '<div class="widget-content">' +
                    '<div class="inner">' +
                      '<span class="value">42</span>' +
                    '</div>' +
                  '</div>' +
                '</div>' +
              '</div>' +
              '<div data-region="right" class="pane">' +
                '<div class="widget">' +
                  '<div class="widget-content">' +
                    '<div class="inner">' +
                      '<span class="value">99</span>' +
                    '</div>' +
                  '</div>' +
                '</div>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>'
      );
      const el = $( 'span.value' ).get( 0 );

      expect( unique( el ) ).to.equal(
        ':nth-child(1) > .widget > .widget-content > .inner > .value'
      );

      // data-cy="widget-a" woven into the .widget segment in the > chain,
      // data-region="main", data-cy="dashboard", data-region="left" above chain
      expect( unique( el, {
        requiredAttributes: [
          { attributeName: 'data-cy', value: '.*' },
          { attributeName: 'data-region', value: '.*' }
        ]
      })).to.equal(
        '[data-region="main"] [data-cy="dashboard"] [data-region="left"] .widget[data-cy="widget-a"] > .widget-content > .inner > .value'
      );
    });

    it('ID at intermediate level cuts chain short, required attrs above and below', () => {
      // #main-content makes the chain unique early.
      // Required attrs exist both above the ID (data-test="app") and below it (data-test="form", "email").
      $( 'body' ).append(
        '<div data-test="app">' +
          '<div class="wrapper">' +
            '<div id="main-content">' +
              '<div data-test="form" class="form">' +
                '<div class="form-group">' +
                  '<div class="input-row">' +
                    '<div class="field">' +
                      '<input type="text" data-test="email" class="input" />' +
                    '</div>' +
                    '<div class="field">' +
                      '<input type="text" class="input" />' +
                    '</div>' +
                  '</div>' +
                '</div>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>'
      );
      const el = $( 'input[data-test="email"]' ).get( 0 );

      // ID makes uniqueness easy — short base chain
      expect( unique( el ) ).to.equal( ':nth-child(1) > .input' );

      // data-test="email" on target, data-test="form" and data-test="app" as ancestors
      expect( unique( el, {
        requiredAttributes: [{ attributeName: 'data-test', value: '.*' }]
      })).to.equal(
        '[data-test="app"] [data-test="form"] .input[data-test="email"]'
      );
    });

    it('does not duplicate attribute already present via selectorTypes', () => {
      $( 'body' ).append(
        '<div data-case="supplemental_identifier_to_deconflict">' +
          '<form id="autogen_wrapper" data-cy="autogen_shippingAddress">' +
            '<h4 id="autogen_formTitle">Shipping Address</h4>' +
            '<label>First Name <input id="autogen_firstName"></label>' +
            '<label>Last Name <input id="autogen_lastName"></label>' +
          '</form>' +
          '<label>Address' +
            '<div id="mui_wrapper" class="MuiFormControl-root" data-cy="mui-shipping">' +
              '<textarea id="autogen_address"></textarea>' +
            '</div>' +
          '</label>' +
          '<div class="v-application"><div>' +
            '<div id="vuetify_wrapper" class="v-input" data-qa="vuetify-shipping">' +
              '<label>Phone Number <input id="autogen_phone"></label>' +
            '</div>' +
          '</div></div>' +
        '</div>'
      );

      const el = $( '#autogen_firstName' ).get( 0 );
      const result = unique( el, {
        selectorTypes: ['data-cy', 'id', 'class', 'tag', 'nth-child'],
        requiredAttributes: [{ attributeName: 'data-cy', value: '.*' }]
      });
      expect( result ).to.equal( '[data-cy="autogen_shippingAddress"] #autogen_firstName' );
    });

    it('does not false-match attribute name inside another attribute value', () => {
      $( 'body' ).append(
        '<div data-foo="data-cy-blargh" data-cy="real"><span id="falseMatchTarget"></span></div>'
      );
      const el = $( '#falseMatchTarget' ).get( 0 );
      const result = unique( el, {
        selectorTypes: ['data-foo', 'id', 'class', 'tag', 'nth-child'],
        requiredAttributes: [{ attributeName: 'data-cy', value: '.*' }]
      });
      expect( result ).to.equal( '[data-cy="real"] #falseMatchTarget' );
    });
  })
} );
