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

  it( 'Tag - filtered due to property override', () =>
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
    expect( uniqueSelector ).to.equal( '.test2 > :nth-child(1)' );
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
  })
} );
