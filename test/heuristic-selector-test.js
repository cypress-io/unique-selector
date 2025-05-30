const expect = require('chai').expect
const JSDOM = require('jsdom').JSDOM
const unique = require('../lib').default

const $ = require('jquery')(new JSDOM().window)

describe('Heuristic Selector Tests', () => {
  beforeEach(() => {
    $('body').get(0).innerHTML = '' // Clear previous appends
  })

  it('Should choose a data-id attribute selector even when deeply nested', () => {
    $('body').append(`
      <div class="main-content">
        <div class="wrapper">
          <div class="panel">
            <div class="header">
              <div class="title-container">
                <h2 data-id="page-title">Welcome</h2>
              </div>
            </div>
          </div>
        </div>
      </div>
    `)

    const element = $('[data-id="page-title"]').get(0)
    const selector = unique(element)

    expect(selector).to.equal('[data-id="page-title"]')
  })

  it('Should prefer data attributes over nth-child in complex structures', () => {
    $('body').append(`
      <div data-section="main">
        <div data-component="navigation">
          <ul>
            <li><a href="#home">Home</a></li>
            <li><a href="#about">About</a></li>
            <li><a href="#contact">Contact</a></li>
          </ul>
        </div>
        <div data-component="content">
          <h1>Main Content</h1>
          <p class="intro" data-test="intro">Welcome to the site</p>
        </div>
      </div>
    `)

    const element = $('.intro').get(0)
    const selector = unique(element)

    expect(selector).to.equal('[data-test="intro"]')
  })

  it('Should prefer short selectors over long ones', () => {
    $('body').append(`
      <div class="container">
        <div class="row">
          <div class="col">
            <div class="card">
              <span class="unique-class">This is unique</span>
            </div>
          </div>
        </div>
      </div>
    `)

    const element = $('.unique-class').get(0)
    const selector = unique(element)

    expect(selector).to.equal('.unique-class')
  })

  it('Should handle elements with multiple data attributes', () => {
    $('body').append(`
      <div data-testid="container" data-component="wrapper" data-id="main">
        <span data-testid="label" data-custom="xyz">Label</span>
      </div>
    `)

    const element = $('span[data-testid="label"]').get(0)
    const selector = unique(element)

    expect(selector).to.equal('[data-testid="label"]')
  })

  it('Should handle really complex nested structures effectively', () => {
    $('body').append(`
      <div data-root="app">
        <div class="section">
          <div class="panel">
            <div class="header">
              <h2>Section Title</h2>
            </div>
            <div class="content">
              <div class="row">
                <div class="col">
                  <div class="item">
                    <div class="inner">
                      <span class="target-deep">Deep Target</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `)

    const element = $('.target-deep').get(0)
    const selector = unique(element)

    expect(selector).to.equal('.target-deep')
  })

  it('Should produce consistent results for adjacent similar elements', () => {
    $('body').append(`
      <div data-sidebar="menu">
        <ul>
          <li data-item="1"><a href="#1"><span>Item 1</span></a></li>
          <li data-item="2"><a href="#2"><span>Item 2</span></a></li>
          <li data-item="3"><a href="#3"><span>Item 3</span></a></li>
        </ul>
      </div>
    `)

    const elements = $('span').get()
    const selectors = elements.map((el) => unique(el))

    // All selectors should follow the same pattern
    const pattern = selectors[0].includes('data-item') ? 'data-item' : null

    if (pattern) {
      selectors.forEach((selector) => {
        expect(selector.includes(pattern)).to.be.true
      })
    }

    // None should use nth-child for these structured elements
    selectors.forEach((selector) => {
      expect(selector.includes(':nth-child')).to.be.false
    })
  })
})
