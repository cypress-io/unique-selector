const expect = require('chai').expect
const JSDOM = require('jsdom').JSDOM
const unique = require('../lib').default

const $ = require('jquery')(new JSDOM().window)

describe('Data ID and Complex Structure Selector Tests', () => {
  beforeEach(() => {
    $('body').get(0).innerHTML = '' // Clear previous appends
  })

  it('Should prioritize data-id attribute over other selectors', () => {
    $('body').append('<div data-id="map" class="test3 other-class"></div>')
    const findNode = $('body').find('.test3').get(0)
    const uniqueSelector = unique(findNode)
    expect(uniqueSelector).to.equal('[data-id="map"]')
  })

  it('Should simplify complex nested structure selectors with duplicate data-id', () => {
    $('body').append(`
      <div class="container">
        <div class="level1">
          <div class="level2">
            <div data-sidebar="menu-button">
              <span data-id="map">My map</span>
              <span data-id="map">My map</span>
            </div>
          </div>
        </div>
      </div>
    `)

    const findNode = $('[data-id="map"]').get(0)
    const uniqueSelector = unique(findNode)
    expect(uniqueSelector).to.equal(
      '[data-sidebar="menu-button"] > :nth-child(1)'
    )
  })

  it('Should simplify complex nested structure selectors', () => {
    $('body').append(`
      <div class="container">
        <div class="level1">
          <div class="level2">
            <div data-sidebar="menu-button">
              <span data-id="map">My map</span>
            </div>
          </div>
        </div>
      </div>
    `)

    const findNode = $('[data-id="map"]').get(0)
    const uniqueSelector = unique(findNode)
    expect(uniqueSelector).to.equal('[data-id="map"]')
  })

  it('Should handle complex structure without data-id by using simplified selector', () => {
    $('body').append(`
      <div data-sidebar="content" class="flex min-h-0 flex-1">
        <div data-sidebar="group" class="relative flex w-full">
          <div data-sidebar="group-label">Plan your trip</div>
          <ul data-sidebar="menu" class="flex w-full">
            <li data-sidebar="menu-item" data-state="open">
              <a data-sidebar="menu-button" href="/user/test">
                <span class="target-element">My trips</span>
              </a>
            </li>
            <li data-sidebar="menu-item" data-state="closed">
              <a data-sidebar="menu-button" href="/map">
                <span class="target-element">My map</span>
              </a>
            </li>
          </ul>
        </div>
      </div>
    `)

    const findNode = $('.target-element').get(1)
    const uniqueSelector = unique(findNode)

    expect(uniqueSelector).to.equal(
      '[data-state="closed"] > [data-sidebar="menu-button"] > .target-element'
    )
  })

  it('Should handle the complex sidebar example correctly', () => {
    $('body').append(`
      <div data-sidebar="content" class="flex min-h-0 flex-1 flex-col gap-2 overflow-auto group-data-[collapsible=icon]:overflow-hidden bg-indigo-700 text-white">
        <div data-sidebar="group" class="relative flex w-full min-w-0 flex-col p-2">
          <div data-sidebar="group-label">Planifica Tu Viaje</div>
          <ul data-sidebar="menu" class="flex w-full min-w-0 flex-col gap-1">
            <li data-sidebar="menu-item" class="group/menu-item relative" data-state="open">
              <a data-sidebar="menu-button" href="/user/foo">
                <span>My trips</span>
              </a>
            </li>
            <li data-sidebar="menu-item" class="group/menu-item relative" data-state="closed">
              <a data-sidebar="menu-button" href="/map">
                <svg class="lucide lucide-map"></svg>
                <span data-id="map">My map</span>
              </a>
            </li>
          </ul>
        </div>
      </div>
    `)

    const findNode = $('[data-id="map"]').get(0)
    const uniqueSelector = unique(findNode)

    // Should use the data-id selector directly
    expect(uniqueSelector).to.equal('[data-id="map"]')
  })
})
