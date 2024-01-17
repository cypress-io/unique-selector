const expect = require( 'chai' ).expect;
const JSDOM = require('jsdom').JSDOM;
const unique = require('../lib').default;

const $ = require( 'jquery' )( (new JSDOM()).window );

describe( 'Unique Selector Tests', () =>
{

  it( 'ID', () =>
  {
    $( 'body' ).get( 0 ).innerHTML = ''; // Clear previous appends
    $( 'body' ).append( '<div id="so" class="test3"></div>' );
    const findNode = $( 'body' ).find( '.test3' ).get( 0 );
    const uniqueSelector = unique( findNode );
    expect( uniqueSelector ).to.equal( '#so' );
  } );

  it( 'ID that needs escaping', () =>
  {
    $( 'body' ).get( 0 ).innerHTML = ''; // Clear previous appends
    $( 'body' ).append( '<div id="123" class="test3"></div>' );
    const findNode = $( 'body' ).find( '.test3' ).get( 0 );
    const uniqueSelector = unique( findNode );
    expect( uniqueSelector ).to.equal( '#\\31 23' );
  } );

  it( 'Class', () =>
  {
    $( 'body' ).get( 0 ).innerHTML = ''; // Clear previous appends
    $( 'body' ).append( '<div class="test2"></div>' );
    const findNode = $( 'body' ).find( '.test2' ).get( 0 );
    const uniqueSelector = unique( findNode );
    expect( uniqueSelector ).to.equal( '.test2' );
  } );

  it( 'Class that needs escaping', () =>
  {
    $( 'body' ).get( 0 ).innerHTML = ''; // Clear previous appends
    $( 'body' ).append( '<div class="@test test2"></div>' );
    const findNode = $( 'body' ).find( '.test2' ).get( 0 );
    const uniqueSelector = unique( findNode );
    expect( uniqueSelector ).to.equal( '.\\@test' );
  } );

  it( 'Classes', () =>
  {
    $( 'body' ).get( 0 ).innerHTML = ''; // Clear previous appends
    $( 'body' ).append( '<div class="test2"></div><div class="test2"></div>' );
    const findNode = $( 'body' ).find( '.test2' ).get( 0 );
    const uniqueSelector = unique( findNode );
    expect( uniqueSelector ).to.equal( 'body > :nth-child(1)' );
  } );

  it( 'Classes', () =>
  {
    $( 'body' ).get( 0 ).innerHTML = ''; // Clear previous appends
    $( 'body' ).append( '<div class="test2 ca cb cc cd cx"></div><div class="test2 ca cb cc cd ce"></div><div class="test2 ca cb cc cd ce"></div><div class="test2 ca cb cd ce cf cx"></div>' );
    const findNode = $( 'body' ).find( '.test2' ).get( 0 );
    const uniqueSelector = unique( findNode );
    expect( uniqueSelector ).to.equal( '.cc.cx' );
  } );

  it( 'Classes with newline', () =>
  {
    $( 'body' ).get( 0 ).innerHTML = ''; // Clear previous appends
    $( 'body' ).append( '<div class="test2\n ca\n cb\n cc\n cd\n cx"></div><div class="test2\n ca\n cb\n cc\n cd\n ce"></div><div class="test2\n ca\n cb\n cc\n cd\n ce"></div><div class="test2\n ca\n cb\n cd\n ce\n cf\n cx"></div>' );
    const findNode = $( 'body' ).find( '.test2' ).get( 0 );
    const uniqueSelector = unique( findNode );
    expect( uniqueSelector ).to.equal( '.cc.cx' );
  } );

  it( 'Tag', () =>
  {
    $( 'body' ).get( 0 ).innerHTML = ''; // Clear previous appends
    $( 'body' ).append( '<div class="test2"><span></span></div><div class="test2"></div>' );
    const findNode = $( '.test2' ).find( 'span' ).get( 0 );
    const uniqueSelector = unique( findNode );
    expect( uniqueSelector ).to.equal( 'span' );
  } );


  it( 'Tag', () =>
  {
    $( 'body' ).get( 0 ).innerHTML = ''; // Clear previous appends
    $( 'body' ).append( '<div class="test5"><span></span></div><div class="test5"><span></span></div>' );
    const findNode = $( '.test5' ).find( 'span' ).get( 0 );
    const uniqueSelector = unique( findNode );
    expect( uniqueSelector ).to.equal( ':nth-child(1) > span' );
  } );

  it( 'Tag', () =>
  {
    $( 'body' ).get( 0 ).innerHTML = ''; // Clear previous appends
    $( 'body' ).append( '<div class="test5"><span><ul><li><a></a></li></ul></span></div><div class="test5"><span></span></div>' );
    const findNode = $( '.test5' ).find( 'a' ).get( 0 );
    const uniqueSelector = unique( findNode );
    expect( uniqueSelector ).to.equal( 'a' );
  } );

  it( 'Attributes', () =>
  {
    $( 'body' ).get( 0 ).innerHTML = ''; // Clear previous appends
    $( 'body' ).append( '<div class="test5" test="5"></div>' );
    const findNode = $( '.test5' ).get( 0 );
    const uniqueSelector = unique( findNode, { selectorTypes : ['attributes'] } );
    expect( uniqueSelector ).to.equal( '[test="5"]' );
  } );

  it( 'data-foo', () =>
  {
    $( 'body' ).get( 0 ).innerHTML = ''; // Clear previous appends
    $( 'body' ).append( '<div data-foo="so" class="test6"></div>' );
    const findNode = $( 'body' ).find( '.test6' ).get( 0 );
    const uniqueSelector = unique( findNode, { selectorTypes : ['data-foo'] } );
    expect( uniqueSelector ).to.equal( '[data-foo="so"]' );
  } );

  it( 'data-foo-bar-baz', () =>
  {
    $( 'body' ).get( 0 ).innerHTML = ''; // Clear previous appends
    $( 'body' ).append( '<div data-foo-bar-baz="so" class="test6"></div>' );
    const findNode = $( 'body' ).find( '.test6' ).get( 0 );
    const uniqueSelector = unique( findNode, { selectorTypes : ['data-foo-bar-baz'] } );
    expect( uniqueSelector ).to.equal( '[data-foo-bar-baz="so"]' );
  } );

  it( 'data-foo-bar with quotes', () =>
  {
    $( 'body' ).get( 0 ).innerHTML = ''; // Clear previous appends
    $( 'body' ).append( '<div data-foo-bar="button 123" class="test7"></div>' );
    const findNode = $( 'body' ).find( '.test7' ).get( 0 );
    const uniqueSelector = unique( findNode, { selectorTypes : ['data-foo-bar'] } );
    expect( uniqueSelector ).to.equal( '[data-foo-bar="button 123"]' );
  } );

  it( 'data-foo without value', () =>
  {
    $( 'body' ).get( 0 ).innerHTML = ''; // Clear previous appends
    $( 'body' ).append( '<div data-foo class="test7"></div>' );
    const findNode = $( 'body' ).find( '.test7' ).get( 0 );
    const uniqueSelector = unique( findNode, { selectorTypes : ['data-foo'] } );
    expect( uniqueSelector ).to.equal( '[data-foo]' );
  } );

  describe('name', () => {
    beforeEach(() => {
      $( 'body' ).get( 0 ).innerHTML = ''; // Clear previous appends
    })

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
  })
} );
