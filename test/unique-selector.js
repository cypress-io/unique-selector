const expect = require('chai').expect
const JSDOM = require('jsdom').JSDOM
const unique = require('../lib').default

const $ = require('jquery')(new JSDOM().window)

describe('Unique Selector Tests', () => {
  beforeEach(() => {
    $('body').get(0).innerHTML = '' // Clear previous appends
  })

  it('ID', () => {
    $('body').append('<div id="so" class="test3"></div>')
    const findNode = $('body').find('.test3').get(0)
    const uniqueSelector = unique(findNode)
    expect(uniqueSelector).to.equal('#so')
  })

  it('ID that needs escaping', () => {
    $('body').append('<div id="123" class="test3"></div>')
    const findNode = $('body').find('.test3').get(0)
    const uniqueSelector = unique(findNode)
    expect(uniqueSelector).to.equal('#\\31 23')
  })

  it('ID filters appropriately', () => {
    const filter = (type, key, value) => {
      if (type === 'attribute' && key === 'id') {
        return /oo/.test(value)
      }
      return true
    }
    let el = $.parseHTML('<div id="foo"></div>')[0]
    $(el).appendTo('body')
    let uniqueSelector = unique(el, { filter })
    expect(uniqueSelector).to.equal('#foo')

    el = $.parseHTML('<div id="bar"></div>')[0]
    $(el).appendTo('body')
    uniqueSelector = unique(el, { filter })
    expect(uniqueSelector).to.equal('body > :nth-child(2)')
  })

  it('Class', () => {
    $('body').append('<div class="test2"></div>')
    const findNode = $('body').find('.test2').get(0)
    const uniqueSelector = unique(findNode)
    expect(uniqueSelector).to.equal('.test2')
  })

  it('Class that needs escaping', () => {
    $('body').append('<div class="@test test2"></div>')
    const findNode = $('body').find('.test2').get(0)
    const uniqueSelector = unique(findNode)
    expect(uniqueSelector).to.equal('.\\@test')
  })

  it('Classes', () => {
    $('body').append('<div class="test2"></div><div class="test2"></div>')
    const findNode = $('body').find('.test2').get(0)
    const uniqueSelector = unique(findNode)
    expect(uniqueSelector).to.equal('body > :nth-child(1)')
  })

  it('Classes', () => {
    $('body').append(
      '<div class="test2 ca cb cc cd cx"></div><div class="test2 ca cb cc cd ce"></div><div class="test2 ca cb cc cd ce"></div><div class="test2 ca cb cd ce cf cx"></div>'
    )
    const findNode = $('body').find('.test2').get(0)
    const uniqueSelector = unique(findNode)
    expect(uniqueSelector).to.equal('.cc.cx')
  })

  it('Classes with newline', () => {
    $('body').append(
      '<div class="test2\n ca\n cb\n cc\n cd\n cx"></div><div class="test2\n ca\n cb\n cc\n cd\n ce"></div><div class="test2\n ca\n cb\n cc\n cd\n ce"></div><div class="test2\n ca\n cb\n cd\n ce\n cf\n cx"></div>'
    )
    const findNode = $('body').find('.test2').get(0)
    const uniqueSelector = unique(findNode)
    expect(uniqueSelector).to.equal('.cc.cx')
  })

  it('Classes filters appropriately', () => {
    const filter = (type, key, value) => {
      if (key === 'class') {
        expect(type).to.eq('class')
        return value.startsWith('a')
      }
      expect(type).not.to.eq('class')
      return true
    }
    let el = $.parseHTML('<div class="a1"></div>')[0]
    $(el).appendTo('body')
    let uniqueSelector = unique(el, { filter })
    expect(uniqueSelector).to.equal('.a1')

    el = $.parseHTML('<div class="b1 a2"></div>')[0]
    $(el).appendTo('body')
    uniqueSelector = unique(el, { filter })
    expect(uniqueSelector).to.equal('.a2')
  })

  it('Tag', () => {
    $('body').append(
      '<div class="test2"><span></span></div><div class="test2"></div>'
    )
    const findNode = $('.test2').find('span').get(0)
    const uniqueSelector = unique(findNode)
    expect(uniqueSelector).to.equal('span')
  })

  it('Tag', () => {
    $('body').append(
      '<div class="test5"><span></span></div><div class="test5"><span></span></div>'
    )
    const findNode = $('.test5').find('span').get(0)
    const uniqueSelector = unique(findNode)
    expect(uniqueSelector).to.equal(':nth-child(1) > span')
  })

  it('Tag', () => {
    $('body').append(
      '<div class="test5"><span><ul><li><a></a></li></ul></span></div><div class="test5"><span></span></div>'
    )
    const findNode = $('.test5').find('a').get(0)
    const uniqueSelector = unique(findNode)
    expect(uniqueSelector).to.equal('a')
  })

  it('Tag - fallback to nodeName', () => {
    $('body').append(`
      <div class="test2">
        <form action="" method="get">
          <div class="form-example">
            <label for="name">Enter your name: </label>
            <input type="text" name="name" id="tagName" required />
          </div>
        </form>
      </div>
    `)

    const formNode = $('form').get(0)

    // JSDOM doesn't actually exhibit this behavior;
    // forcing the test to behave as a browser does.
    Object.defineProperty(formNode, 'tagName', {
      get: () => {
        return $('input#tagName').get(0)
      },
    })

    expect(typeof formNode.tagName).to.not.equal('string')

    const uniqueSelector = unique(formNode)
    // nodeName === 'form'
    expect(uniqueSelector).to.equal('form')
  })

  it('Tag - ignored due to property override', () => {
    $('body').append(`
        <div class="test2">
          <form action="" method="get">
            <div class="form-example">
              <label for="name">Enter your name: </label>
              <input type="text" name="name" id="tagName" required />
            </div>
          </form>
        </div>
      `)

    const formNode = $('form').get(0)

    // JSDOM doesn't actually exhibit this behavior;
    // forcing the test to behave as a browser does.
    Object.defineProperty(formNode, 'tagName', {
      get: () => {
        return $('input#tagName').get(0)
      },
    })
    Object.defineProperty(formNode, 'nodeName', {
      get: () => {
        return $('input#tagName').get(0)
      },
    })

    expect(typeof formNode.tagName).to.not.equal('string')
    expect(typeof formNode.nodeName).to.not.equal('string')

    const uniqueSelector = unique(formNode)
    // with nodeName overridden, the isElement check will fail
    // and the wildcard selector is returned for that element.
    // This really shouldn't happen in practice.
    expect(uniqueSelector).to.equal('.test2 > *')
  })

  it('Attributes', () => {
    $('body').append('<div class="test5" test="5"></div>')
    const findNode = $('.test5').get(0)
    const uniqueSelector = unique(findNode, { selectorTypes: ['attributes'] })
    expect(uniqueSelector).to.equal('[test="5"]')
  })

  it('Attributes does not consider specified attribute matchers', () => {
    $('body').append('<div a="1" data-foo="1"></div>')
    const el = $('div').get(0)
    // Add selectorTypes for `data-foo` and `attribute:a` but use filters to reject their use
    // `attributes` selector type should *not* use those attributes since they were considered
    // by other selectorType generators
    const uniqueSelector = unique(el, {
      selectorTypes: ['data-foo', 'attribute:a', 'attributes', 'nth-child'],
      filter: (type, key, value) => {
        if (type === 'attribute' && ['data-foo', 'a'].includes(key)) {
          return false
        }
        return true
      },
    })
    expect(uniqueSelector).to.equal(':nth-child(2) > :nth-child(1)')
  })

  describe('data attribute', () => {
    it('data-foo', () => {
      $('body').append('<div data-foo="so" class="test6"></div>')
      const findNode = $('body').find('.test6').get(0)
      const uniqueSelector = unique(findNode, { selectorTypes: ['data-foo'] })
      expect(uniqueSelector).to.equal('[data-foo="so"]')
    })

    it('data-foo-bar-baz', () => {
      $('body').append('<div data-foo-bar-baz="so" class="test6"></div>')
      const findNode = $('body').find('.test6').get(0)
      const uniqueSelector = unique(findNode, {
        selectorTypes: ['data-foo-bar-baz'],
      })
      expect(uniqueSelector).to.equal('[data-foo-bar-baz="so"]')
    })

    it('data-foo-bar with quotes', () => {
      $('body').append('<div data-foo-bar="button 123" class="test7"></div>')
      const findNode = $('body').find('.test7').get(0)
      const uniqueSelector = unique(findNode, {
        selectorTypes: ['data-foo-bar'],
      })
      expect(uniqueSelector).to.equal('[data-foo-bar="button 123"]')
    })

    it('data-foo without value', () => {
      $('body').append('<div data-foo class="test7"></div>')
      const findNode = $('body').find('.test7').get(0)
      const uniqueSelector = unique(findNode, { selectorTypes: ['data-foo'] })
      expect(uniqueSelector).to.equal('[data-foo]')
    })

    it('filters appropriately', () => {
      const filter = (type, key, value) => {
        if (type === 'attribute' && key === 'data-foo') {
          return value === 'abc'
        }
        return true
      }
      let el = $.parseHTML('<div data-foo="abc" class="test1"></div>')[0]
      $(el).appendTo('body')
      let uniqueSelector = unique(el, {
        filter,
        selectorTypes: ['data-foo', 'class'],
      })
      expect(uniqueSelector).to.equal('[data-foo="abc"]')

      el = $.parseHTML('<div data-foo="def" class="test2"></div>')[0]
      $(el).appendTo('body')
      uniqueSelector = unique(el, {
        filter,
        selectorTypes: ['data-foo', 'class'],
      })
      expect(uniqueSelector).to.equal('.test2')
    })
  })

  describe('standard attribute', () => {
    it('attribute without value', () => {
      $('body').append('<div contenteditable class="test8"></div>')
      const findNode = $('body').find('.test8').get(0)
      const uniqueSelector = unique(findNode, {
        selectorTypes: ['attribute:contenteditable'],
      })
      expect(uniqueSelector).to.equal('[contenteditable]')
    })

    it('attribute with value', () => {
      $('body').append('<div role="button" class="test9"></div>')
      const findNode = $('body').find('.test9').get(0)
      const uniqueSelector = unique(findNode, {
        selectorTypes: ['attribute:role'],
      })
      expect(uniqueSelector).to.equal('[role="button"]')
    })

    it('filters appropriately', () => {
      const filter = (type, key, value) => {
        if (type === 'attribute' && key === 'role') {
          return value === 'abc'
        }
        return true
      }
      let el = $.parseHTML('<div role="abc" class="test1"></div>')[0]
      $(el).appendTo('body')
      let uniqueSelector = unique(el, {
        filter,
        selectorTypes: ['attribute:role', 'class'],
      })
      expect(uniqueSelector).to.equal('[role="abc"]')

      el = $.parseHTML('<div role="def" class="test2"></div>')[0]
      $(el).appendTo('body')
      uniqueSelector = unique(el, {
        filter,
        selectorTypes: ['attribute:role', 'class'],
      })
      expect(uniqueSelector).to.equal('.test2')
    })
  })

  describe('name', () => {
    it('with value', () => {
      $('body').append('<div name="so" class="test3"></div>')
      const findNode = $('body').find('.test3').get(0)
      const uniqueSelector = unique(findNode)
      expect(uniqueSelector).to.equal('[name="so"]')
    })

    it('without value', () => {
      $('body').append('<div name class="test3"></div>')
      const findNode = $('body').find('.test3').get(0)
      const uniqueSelector = unique(findNode)
      expect(uniqueSelector).to.equal('.test3')
    })

    it('filters appropriately', () => {
      const filter = (type, key, value) => {
        if (type === 'attribute' && key === 'name') {
          return value === 'abc'
        }
        return true
      }
      let el = $.parseHTML('<div name="abc" class="test1"></div>')[0]
      $(el).appendTo('body')
      let uniqueSelector = unique(el, { filter })
      expect(uniqueSelector).to.equal('[name="abc"]')

      el = $.parseHTML('<div name="def" class="test2"></div>')[0]
      $(el).appendTo('body')
      uniqueSelector = unique(el, { filter })
      expect(uniqueSelector).to.equal('.test2')
    })
  })

  describe('nth-child', () => {
    it('builds expected selector', () => {
      $('body').append('<div><div class="test-nth-child"></div></div>')
      const findNode = $('body').find('.test-nth-child').get(0)
      const uniqueSelector = unique(findNode, { selectorTypes: ['nth-child'] })
      expect(uniqueSelector).to.equal(
        ':nth-child(2) > :nth-child(1) > :nth-child(1)'
      )
    })

    it('filters appropriately', () => {
      const filter = (type, key, value) => {
        if (type === 'nth-child') {
          return value !== 1
        }
        return true
      }
      $('body').append('<div><span class="test-nth-child"></span></div>')[0]
      const findNode = $('body').find('.test-nth-child').get(0)
      const uniqueSelector = unique(findNode, {
        filter,
        selectorTypes: ['nth-child', 'tag'],
      })
      expect(uniqueSelector).to.equal('span')
    })
  })

  describe('shadow dom', () => {
    it('builds expected selector inside and outside shadow context', () => {
      $('body').append('<div id="shadow-host" class="shadow-host-class"></div>')

      const hostNode = $('#shadow-host').get(0)

      const shadowRoot = hostNode.attachShadow({ mode: 'open' })
      const shadowElement = hostNode.ownerDocument.createElement('div')
      shadowElement.innerHTML = `
        <div id="inner-shadow-container">
          <button id="shadow-button" class="shadow-button-class">Click Me</button>
        </div>
      `
      shadowRoot.appendChild(shadowElement)

      const uniqueSelectorForHost = unique(hostNode)
      expect(uniqueSelectorForHost).to.equal('#shadow-host')

      const uniqueSelectorForShadowContent = unique(
        shadowElement.querySelector('#shadow-button')
      )
      expect(uniqueSelectorForShadowContent).to.equal('#shadow-button')
    })

    it('builds unique selector scoped to shadow root', () => {
      $('body').append('<div id="shadow-host" class="shadow-host-class"></div>')
      $('body').append(
        '<button class="shadow-button-class">Click Me Third</button>'
      )

      const hostNode = $('#shadow-host').get(0)

      const shadowRoot = hostNode.attachShadow({ mode: 'open' })
      const shadowElement = hostNode.ownerDocument.createElement('div')
      shadowElement.innerHTML = `
        <div id="inner-shadow-container">
          <button class="shadow-button-class">Click Me First</button>
          <button class="shadow-button-class">Click Me Second</button>
        </div>
      `
      shadowRoot.appendChild(shadowElement)

      const uniqueSelectorInRootDocument = unique(
        $('body').find('.shadow-button-class').get(0)
      )
      expect(uniqueSelectorInRootDocument).to.equal('.shadow-button-class')

      const uniqueSelectorForShadowContent = unique(
        shadowElement.querySelectorAll('.shadow-button-class')[0]
      )
      expect(uniqueSelectorForShadowContent).to.equal(
        '#inner-shadow-container > :nth-child(1)'
      )
    })
  })

  describe('data-attributes selector type', () => {
    it('prioritizes data-attributes by default', () => {
      $('body').append('<div data-test="selector" class="dynamic-class"></div>')
      const findNode = $('div[data-test="selector"]').get(0)
      const uniqueSelector = unique(findNode)
      expect(uniqueSelector).to.equal('[data-test="selector"]')
    })

    it('handles multiple data attributes and chooses one', () => {
      $('body').append(
        '<div data-test="selector" data-cy="button" class="dynamic-class"></div>'
      )
      const findNode = $('div[data-test="selector"]').get(0)
      const uniqueSelector = unique(findNode)
      // We should get one of the data attributes
      const possible = ['[data-test="selector"]', '[data-cy="button"]']
      expect(possible).to.include(uniqueSelector)
    })

    it('works with data attributes without values', () => {
      $('body').append('<div data-test class="dynamic-class"></div>')
      const findNode = $('div[data-test]').get(0)
      const uniqueSelector = unique(findNode)
      expect(uniqueSelector).to.equal('[data-test]')
    })

    it('falls back to other selectors when no data attributes exist', () => {
      $('body').append('<div id="static-id" class="dynamic-class"></div>')
      const findNode = $('div#static-id').get(0)
      const uniqueSelector = unique(findNode)
      expect(uniqueSelector).to.equal('#static-id')
    })

    it('combines data attributes when needed for uniqueness', () => {
      $('body').append('<div data-test="selector" data-cy="button1"></div>')
      $('body').append('<div data-test="selector" data-cy="button2"></div>')
      const findNode = $('div[data-cy="button1"]').get(0)
      const uniqueSelector = unique(findNode)
      expect(uniqueSelector).to.equal('[data-cy="button1"]')
    })
  })

  it('complex structure', () => {
    $('body').append(
      `<div data-sidebar="content" class="flex min-h-0 flex-1 flex-col gap-2 overflow-auto group-data-[collapsible=icon]:overflow-hidden bg-indigo-700 text-white">
        <a href="/planning">
          <button class="inline-flex items-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg]:size-4 [&amp;_svg]:shrink-0 dark:ring-offset-neutral-950 dark:focus-visible:ring-neutral-300 border border-neutral-200 hover:bg-neutral-100 hover:text-neutral-900 dark:border-neutral-800 dark:bg-neutral-950 dark:hover:bg-neutral-800 dark:hover:text-neutral-50 h-10 px-4 py-2 w-full justify-start mt-4 bg-indigo-100 text-indigo-900">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-plus mr-2 h-4 w-4">
              <path d="M5 12h14"></path>
              <path d="M12 5v14"></path>
            </svg>
            Create trip
          </button>
        </a>
        <div data-sidebar="group" class="relative flex w-full min-w-0 flex-col p-2">
          <div data-sidebar="group-label" class="duration-200 flex h-8 shrink-0 items-center rounded-md px-2 text-xs font-medium outline-none ring-sidebar-ring transition-[margin,opa] ease-linear focus-visible:ring-2 [&amp;>svg]:size-4 [&amp;>svg]:shrink-0 group-data-[collapsible=icon]:-mt-8 group-data-[collapsible=icon]:opacity-0 text-white">
            Plan your trip
          </div>
          <ul data-sidebar="menu" class="flex w-full min-w-0 flex-col gap-1">
            <li data-sidebar="menu-item" class="group/menu-item relative" data-state="open">
              <a data-sidebar="menu-button" data-size="default" data-active="false" class="peer/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left outline-none ring-sidebar-ring transition-[width,height,padding] focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 group-has-[[data-sidebar=menu-action]]/menu-item:pr-8 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium data-[active=true]:text-sidebar-accent-foreground data-[state=open]:hover:bg-sidebar-accent data-[state=open]:hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:!size-8 group-data-[collapsible=icon]:!p-2 [&amp;>span:last-child]:truncate [&amp;>svg]:size-4 [&amp;>svg]:shrink-0 hover:text-sidebar-accent-foreground h-8 text-sm hover:bg-indigo-100 cursor-pointer" data-state="closed" href="/user/alejandroeg">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-calendar">
                  <path d="M8 2v4"></path>
                  <path d="M16 2v4"></path>
                  <rect width="18" height="18" x="3" y="4" rx="2"></rect>
                  <path d="M3 10h18"></path>
                </svg>
                <span>My trips</span>
              </a>
            </li>
            <li data-sidebar="menu-item" class="group/menu-item relative" data-state="closed">
              <a data-sidebar="menu-button" data-size="default" data-active="false" class="peer/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left outline-none ring-sidebar-ring transition-[width,height,padding] focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 group-has-[[data-sidebar=menu-action]]/menu-item:pr-8 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium data-[active=true]:text-sidebar-accent-foreground data-[state=open]:hover:bg-sidebar-accent data-[state=open]:hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:!size-8 group-data-[collapsible=icon]:!p-2 [&amp;>span:last-child]:truncate [&amp;>svg]:size-4 [&amp;>svg]:shrink-0 hover:text-sidebar-accent-foreground h-8 text-sm hover:bg-indigo-100 cursor-pointer" data-state="closed" href="/dream-trips">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-cloud">
                  <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"></path>
                </svg>
                <span>Dream trips</span>
              </a>
            </li>
            <li data-sidebar="menu-item" class="group/menu-item relative" data-state="closed">
              <a data-sidebar="menu-button" data-size="default" data-active="false" class="peer/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left outline-none ring-sidebar-ring transition-[width,height,padding] focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 group-has-[[data-sidebar=menu-action]]/menu-item:pr-8 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium data-[active=true]:text-sidebar-accent-foreground data-[state=open]:hover:bg-sidebar-accent data-[state=open]:hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:!size-8 group-data-[collapsible=icon]:!p-2 [&amp;>span:last-child]:truncate [&amp;>svg]:size-4 [&amp;>svg]:shrink-0 hover:text-sidebar-accent-foreground h-8 text-sm hover:bg-indigo-100 cursor-pointer" data-state="closed" href="/map">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-map">
                  <path d="M14.106 5.553a2 2 0 0 0 1.788 0l3.659-1.83A1 1 0 0 1 21 4.619v12.764a1 1 0 0 1-.553.894l-4.553 2.277a2 2 0 0 1-1.788 0l-4.212-2.106a2 2 0 0 0-1.788 0l-3.659 1.83A1 1 0 0 1 3 19.381V6.618a1 1 0 0 1 .553-.894l4.553-2.277a2 2 0 0 1 1.788 0z"></path>
                  <path d="M15 5.764v15"></path>
                  <path d="M9 3.236v15"></path>
                </svg>
                <span data-id="map">My map</span>
              </a>
            </li>
            <li data-sidebar="menu-item" class="group/menu-item relative" data-state="closed">
              <a data-sidebar="menu-button" data-size="default" data-active="false" class="peer/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left outline-none ring-sidebar-ring transition-[width,height,padding] focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 group-has-[[data-sidebar=menu-action]]/menu-item:pr-8 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium data-[active=true]:text-sidebar-accent-foreground data-[state=open]:hover:bg-sidebar-accent data-[state=open]:hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:!size-8 group-data-[collapsible=icon]:!p-2 [&amp;>span:last-child]:truncate [&amp;>svg]:size-4 [&amp;>svg]:shrink-0 hover:text-sidebar-accent-foreground h-8 text-sm hover:bg-indigo-100 cursor-pointer" data-state="closed" href="/forum">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-message-circle">
                  <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"></path>
                </svg>
                <span>Forum</span>
                <span class="text-xs text-indigo-500 bg-white rounded-full px-2 py-0.5 ml-2">New</span>
              </a>
            </li>
            <li data-sidebar="menu-item" class="group/menu-item relative" data-state="closed" data-id="feed">
              <a data-sidebar="menu-button" data-size="default" data-active="false" class="peer/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left outline-none ring-sidebar-ring transition-[width,height,padding] focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 group-has-[[data-sidebar=menu-action]]/menu-item:pr-8 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium data-[active=true]:text-sidebar-accent-foreground data-[state=open]:hover:bg-sidebar-accent data-[state=open]:hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:!size-8 group-data-[collapsible=icon]:!p-2 [&amp;>span:last-child]:truncate [&amp;>svg]:size-4 [&amp;>svg]:shrink-0 hover:text-sidebar-accent-foreground h-8 text-sm hover:bg-indigo-100 cursor-pointer" data-state="closed" href="/itineraries">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-rss">
                  <path d="M4 11a9 9 0 0 1 9 9"></path>
                  <path d="M4 4a16 16 0 0 1 16 16"></path>
                  <circle cx="5" cy="19" r="1"></circle>
                </svg>
                <span>Worldwide feed</span>
              </a>
            </li>
          </ul>
        </div>
        <div data-sidebar="group" class="relative flex w-full min-w-0 flex-col p-2">
          <div data-sidebar="group-label" class="duration-200 flex h-8 shrink-0 items-center rounded-md px-2 text-xs font-medium outline-none ring-sidebar-ring transition-[margin,opa] ease-linear focus-visible:ring-2 [&amp;>svg]:size-4 [&amp;>svg]:shrink-0 group-data-[collapsible=icon]:-mt-8 group-data-[collapsible=icon]:opacity-0 text-white">
            AI assistants
          </div>
          <ul data-sidebar="menu" class="flex w-full min-w-0 flex-col gap-1">
            <li data-sidebar="menu-item" class="group/menu-item relative" data-state="closed">
              <a target="_blank" rel="noopener noreferrer" data-sidebar="menu-button" data-size="default" data-active="false" class="peer/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left outline-none ring-sidebar-ring transition-[width,height,padding] focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 group-has-[[data-sidebar=menu-action]]/menu-item:pr-8 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium data-[active=true]:text-sidebar-accent-foreground data-[state=open]:hover:bg-sidebar-accent data-[state=open]:hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:!size-8 group-data-[collapsible=icon]:!p-2 [&amp;>span:last-child]:truncate [&amp;>svg]:size-4 [&amp;>svg]:shrink-0 hover:text-sidebar-accent-foreground h-8 text-sm hover:bg-indigo-100 cursor-pointer plausible-event-name=Telegram+Assistant+Sidebar" data-state="closed" href="https://t.me/Aicotravel_bot">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-message-circle">
                  <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"></path>
                </svg>
                <span>Telegram AI</span>
              </a>
            </li>
            <li data-sidebar="menu-item" class="group/menu-item relative" data-state="closed">
              <a target="_blank" rel="noopener noreferrer" data-sidebar="menu-button" data-size="default" data-active="false" class="peer/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left outline-none ring-sidebar-ring transition-[width,height,padding] focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 group-has-[[data-sidebar=menu-action]]/menu-item:pr-8 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium data-[active=true]:text-sidebar-accent-foreground data-[state=open]:hover:bg-sidebar-accent data-[state=open]:hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:!size-8 group-data-[collapsible=icon]:!p-2 [&amp;>span:last-child]:truncate [&amp;>svg]:size-4 [&amp;>svg]:shrink-0 hover:text-sidebar-accent-foreground h-8 text-sm hover:bg-indigo-100 cursor-pointer plausible-event-name=Whatsapp+Assistant+Sidebar" data-state="closed" href="https://wa.me/+16282254030">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-phone">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                </svg>
                <span>Whatsapp AI</span>
              </a>
            </li>
          </ul>
        </div>
        <div data-sidebar="group" class="relative flex w-full min-w-0 flex-col p-2 mt-auto">
          <div data-sidebar="group-content" class="w-full text-sm">
            <button class="inline-flex items-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg]:size-4 [&amp;_svg]:shrink-0 dark:ring-offset-neutral-950 dark:focus-visible:ring-neutral-300 border border-neutral-200 hover:bg-neutral-100 hover:text-neutral-900 dark:border-neutral-800 dark:bg-neutral-950 dark:hover:bg-neutral-800 dark:hover:text-neutral-50 h-10 px-4 py-2 mb-4 bg-indigo-100 text-indigo-900 justify-between T" role="combobox" type="button" aria-haspopup="dialog" aria-expanded="false" aria-controls="radix-:rr:" data-state="closed">
              🇪🇸 Español
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevrons-up-down ml-2 h-4 w-4 shrink-0 opacity-50">
                <path d="m7 15 5 5 5-5"></path>
                <path d="m7 9 5-5 5 5"></path>
              </svg>
            </button>
            <ul data-sidebar="menu" class="flex w-full min-w-0 flex-col gap-1">
              <li data-sidebar="menu-item" class="group/menu-item relative">
                <button data-sidebar="menu-button" data-size="sm" data-active="false" class="peer/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left outline-none ring-sidebar-ring transition-[width,height,padding] focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 group-has-[[data-sidebar=menu-action]]/menu-item:pr-8 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium data-[active=true]:text-sidebar-accent-foreground data-[state=open]:hover:bg-sidebar-accent data-[state=open]:hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:!size-8 group-data-[collapsible=icon]:!p-2 [&amp;>span:last-child]:truncate [&amp;>svg]:size-4 [&amp;>svg]:shrink-0 hover:text-sidebar-accent-foreground h-7 text-xs hover:bg-indigo-100 cursor-pointer" type="button" aria-haspopup="dialog" aria-expanded="false" aria-controls="radix-:re:" data-state="closed">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-send">
                    <path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z"></path>
                    <path d="m21.854 2.147-10.94 10.939"></path>
                  </svg>
                  <span>Share your comments!</span>
                </button>
              </li>
              <li data-sidebar="menu-item" class="group/menu-item relative">
                <a href="/blog" data-sidebar="menu-button" data-size="sm" data-active="false" class="peer/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left outline-none ring-sidebar-ring transition-[width,height,padding] focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 group-has-[[data-sidebar=menu-action]]/menu-item:pr-8 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium data-[active=true]:text-sidebar-accent-foreground data-[state=open]:hover:bg-sidebar-accent data-[state=open]:hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:!size-8 group-data-[collapsible=icon]:!p-2 [&amp;>span:last-child]:truncate [&amp;>svg]:size-4 [&amp;>svg]:shrink-0 hover:text-sidebar-accent-foreground h-7 text-xs hover:bg-indigo-100 cursor-pointer">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-book-open">
                    <path d="M12 7v14"></path>
                    <path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"></path>
                  </svg>
                  <span>Blog</span>
                </a>
              </li>
              <li data-sidebar="menu-item" class="group/menu-item relative">
                <a href="/about" target="_blank" rel="noreferrer noopener" data-sidebar="menu-button" data-size="sm" data-active="false" class="peer/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left outline-none ring-sidebar-ring transition-[width,height,padding] focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 group-has-[[data-sidebar=menu-action]]/menu-item:pr-8 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium data-[active=true]:text-sidebar-accent-foreground data-[state=open]:hover:bg-sidebar-accent data-[state=open]:hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:!size-8 group-data-[collapsible=icon]:!p-2 [&amp;>span:last-child]:truncate [&amp;>svg]:size-4 [&amp;>svg]:shrink-0 hover:text-sidebar-accent-foreground h-7 text-xs hover:bg-indigo-100 cursor-pointer">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-settings2">
                    <path d="M20 7h-9"></path>
                    <path d="M14 17H5"></path>
                    <circle cx="17" cy="17" r="3"></circle>
                    <circle cx="7" cy="7" r="3"></circle>
                  </svg>
                  <span>About</span>
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>`
    )

    const element = $("[data-id='map']").get(0)
    const selected = unique(element)
    expect(selected).to.equal('[data-id="map"]')

    const feedElement = $('body').find('span:contains("Worldwide feed")').get(0)
    const feedSelector = unique(feedElement)

    expect(feedSelector).to.not.include(':nth-child(')

    expect(feedSelector.includes('data-sidebar')).to.be.true
  })
})
