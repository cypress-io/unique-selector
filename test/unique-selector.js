const jsdom = require( 'mocha-jsdom' );
const expect = require( 'chai' ).expect;
import unique from '../src';

const $ = require( 'jquery' )( require( 'jsdom' ).jsdom().defaultView );

describe( 'Unique Selector Tests', () =>
{
  jsdom( { skipWindowCheck : true } );

  it( 'ID', () =>
  {
    $( 'body' ).get( 0 ).innerHTML = ''; //Clear previous appends
    $( 'body' ).append( '<div id="so" class="test3"></div>' );
    const findNode = $( 'body' ).find( '.test3' ).get( 0 );
    const uniqueSelector = unique( findNode );
    expect( uniqueSelector ).to.equal( '#so' );
  } );

  it( 'ID that needs escaping', () =>
  {
    $( 'body' ).get( 0 ).innerHTML = ''; //Clear previous appends
    $( 'body' ).append( '<div id="123" class="test3"></div>' );
    const findNode = $( 'body' ).find( '.test3' ).get( 0 );
    const uniqueSelector = unique( findNode );
    expect( uniqueSelector ).to.equal( '#\\31 23' );
  } );

  it( 'Class', () =>
  {
    $( 'body' ).get( 0 ).innerHTML = ''; //Clear previous appends
    $( 'body' ).append( '<div class="test2"></div>' );
    const findNode = $( 'body' ).find( '.test2' ).get( 0 );
    const uniqueSelector = unique( findNode );
    expect( uniqueSelector ).to.equal( '.test2' );
  } );

  it( 'Class that needs escaping', () =>
  {
    $( 'body' ).get( 0 ).innerHTML = ''; //Clear previous appends
    $( 'body' ).append( '<div class="@test test2"></div>' );
    const findNode = $( 'body' ).find( '.test2' ).get( 0 );
    const uniqueSelector = unique( findNode );
    expect( uniqueSelector ).to.equal( '.\\@test' );
  } );

  it( 'Classes', () =>
  {
    $( 'body' ).get( 0 ).innerHTML = ''; //Clear previous appends
    $( 'body' ).append( '<div class="test2"></div><div class="test2"></div>' );
    const findNode = $( 'body' ).find( '.test2' ).get( 0 );
    const uniqueSelector = unique( findNode );
    expect( uniqueSelector ).to.equal( 'body > :nth-child(1)' );
  } );

  it( 'Classes', () =>
  {
    $( 'body' ).get( 0 ).innerHTML = ''; //Clear previous appends
    $( 'body' ).append( '<div class="test2 ca cb cc cd cx"></div><div class="test2 ca cb cc cd ce"></div><div class="test2 ca cb cc cd ce"></div><div class="test2 ca cb cd ce cf cx"></div>' );
    const findNode = $( 'body' ).find( '.test2' ).get( 0 );
    const uniqueSelector = unique( findNode );
    expect( uniqueSelector ).to.equal( '.cc.cx' );
  } );

  it( 'Classes with newline', () =>
  {
    $( 'body' ).get( 0 ).innerHTML = ''; //Clear previous appends
    $( 'body' ).append( '<div class="test2\n ca\n cb\n cc\n cd\n cx"></div><div class="test2\n ca\n cb\n cc\n cd\n ce"></div><div class="test2\n ca\n cb\n cc\n cd\n ce"></div><div class="test2\n ca\n cb\n cd\n ce\n cf\n cx"></div>' );
    const findNode = $( 'body' ).find( '.test2' ).get( 0 );
    const uniqueSelector = unique( findNode );
    expect( uniqueSelector ).to.equal( '.cc.cx' );
  } );

  it( 'Tag', () =>
  {
    $( 'body' ).get( 0 ).innerHTML = ''; //Clear previous appends
    $( 'body' ).append( '<div class="test2"><span></span></div><div class="test2"></div>' );
    const findNode = $( '.test2' ).find( 'span' ).get( 0 );
    const uniqueSelector = unique( findNode );
    expect( uniqueSelector ).to.equal( 'span' );
  } );


  it( 'Tag', () =>
  {
    $( 'body' ).get( 0 ).innerHTML = ''; //Clear previous appends
    $( 'body' ).append( '<div class="test5"><span></span></div><div class="test5"><span></span></div>' );
    const findNode = $( '.test5' ).find( 'span' ).get( 0 );
    const uniqueSelector = unique( findNode );
    expect( uniqueSelector ).to.equal( ':nth-child(1) > span' );
  } );

  it( 'Tag', () =>
  {
    $( 'body' ).get( 0 ).innerHTML = ''; //Clear previous appends
    $( 'body' ).append( '<div class="test5"><span><ul><li><a></a></li></ul></span></div><div class="test5"><span></span></div>' );
    const findNode = $( '.test5' ).find( 'a' ).get( 0 );
    const uniqueSelector = unique( findNode );
    expect( uniqueSelector ).to.equal( 'a' );
  } );

  it( 'Attributes', () =>
  {
    $( 'body' ).get( 0 ).innerHTML = ''; //Clear previous appends
    $( 'body' ).append( '<div class="test5" test="5"></div>' );
    const findNode = $( '.test5' ).get( 0 );
    const uniqueSelector = unique( findNode, { selectorTypes : ['attributes'] });
    expect( uniqueSelector ).to.equal( '[test="5"]' );
  } );

  it( 'data-cy', () =>
  {
    $( 'body' ).get( 0 ).innerHTML = ''; //Clear previous appends
    $( 'body' ).append( '<div data-cy="so" class="test6"></div>' );
    const findNode = $( 'body' ).find( '.test6' ).get( 0 );
    findNode.dataset = { cy : 'so' }
    const uniqueSelector = unique( findNode, { selectorTypes : ['data-cy'] } );
    expect( uniqueSelector ).to.equal( '[data-cy=so]' );
  } );

  it( 'data-cy that needs escaping', () =>
  {
    $( 'body' ).get( 0 ).innerHTML = ''; //Clear previous appends
    $( 'body' ).append( '<div data-cy="123" class="test7"></div>' );
    const findNode = $( 'body' ).find( '.test7' ).get( 0 );
    findNode.dataset = { cy : '123' }
    const uniqueSelector = unique( findNode, { selectorTypes : ['data-cy'] } );
    expect( uniqueSelector ).to.equal( '[data-cy=\\31 23]' );
  } );

  it( 'data-test', () =>
  {
    $( 'body' ).get( 0 ).innerHTML = ''; //Clear previous appends
    $( 'body' ).append( '<div data-test="so" class="test6"></div>' );
    const findNode = $( 'body' ).find( '.test6' ).get( 0 );
    findNode.dataset = { test : 'so' }
    const uniqueSelector = unique( findNode, { selectorTypes : ['data-test'] } );
    expect( uniqueSelector ).to.equal( '[data-test=so]' );
  } );

  it( 'data-test that needs escaping', () =>
  {
    $( 'body' ).get( 0 ).innerHTML = ''; //Clear previous appends
    $( 'body' ).append( '<div data-test="123" class="test7"></div>' );
    const findNode = $( 'body' ).find( '.test7' ).get( 0 );
    findNode.dataset = { test : '123' }
    const uniqueSelector = unique( findNode, { selectorTypes : ['data-test'] } );
    expect( uniqueSelector ).to.equal( '[data-test=\\31 23]' );
  } );

  it( 'data-testid', () =>
  {
    $( 'body' ).get( 0 ).innerHTML = ''; //Clear previous appends
    $( 'body' ).append( '<div data-testid="so" class="test6"></div>' );
    const findNode = $( 'body' ).find( '.test6' ).get( 0 );
    findNode.dataset = { testid : 'so' }
    const uniqueSelector = unique( findNode, { selectorTypes : ['data-testid'] } );
    expect( uniqueSelector ).to.equal( '[data-testid=so]' );
  } );

  it( 'data-testid that needs escaping', () =>
  {
    $( 'body' ).get( 0 ).innerHTML = ''; //Clear previous appends
    $( 'body' ).append( '<div data-testid="123" class="test7"></div>' );
    const findNode = $( 'body' ).find( '.test7' ).get( 0 );
    findNode.dataset = { testid : '123' }
    const uniqueSelector = unique( findNode, { selectorTypes : ['data-testid'] } );
    expect( uniqueSelector ).to.equal( '[data-testid=\\31 23]' );
  } );

} );
