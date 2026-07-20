(() => {

const desktopMq = window.matchMedia('(min-width: 48rem)')

// hover-details (desktop only) [data-hover-details]
const hoverControllers = new WeakMap()

const onHoverDetailsEnter = (e) => e.currentTarget.setAttribute('open', '')
const onHoverDetailsLeave = (e) => e.currentTarget.removeAttribute('open')

const syncHoverDetails = () => {
  document.querySelectorAll('details[data-hover-details]').forEach((details) => {
    hoverControllers.get(details)?.abort()

    if (desktopMq.matches) {
      const controller = new AbortController()
      details.addEventListener('mouseenter', onHoverDetailsEnter, { signal: controller.signal })
      details.addEventListener('mouseleave', onHoverDetailsLeave, { signal: controller.signal })
      hoverControllers.set(details, controller)
    } else {
      details.removeAttribute('open')
    }
  })
}

// mobile-only details [data-mobile-only-details]
const mobileOnlyControllers = new WeakMap()

const onMobileOnlyDetailsSummaryClick = (e) => e.preventDefault()
const onMobileOnlyDetailsToggle = (e) => e.currentTarget.setAttribute('open', '')

const syncMobileOnlyDetails = () => {
  document.querySelectorAll('details[data-mobile-only-details]').forEach((details) => {
    mobileOnlyControllers.get(details)?.abort()

    const storedName =
      details.getAttribute('data-name') ?? details.getAttribute('name')

    if (storedName && !details.hasAttribute('data-name')) {
      details.setAttribute('data-name', storedName)
    }

    if (desktopMq.matches) {
      details.removeAttribute('name')
      details.setAttribute('open', '')
      const controller = new AbortController()
      const { signal } = controller

      details.querySelector('summary')?.addEventListener('click', onMobileOnlyDetailsSummaryClick, { capture: true, signal, })
      details.addEventListener('toggle', onMobileOnlyDetailsToggle, { signal })

      mobileOnlyControllers.set(details, controller)
    } else {
      if (storedName) {
        details.setAttribute('name', storedName)
      } else {
        details.removeAttribute('name')
      }
      details.removeAttribute('open')
    }
  })
}

const syncDetails = () => {
  syncHoverDetails()
  syncMobileOnlyDetails()
}

syncDetails()
desktopMq.addEventListener('change', syncDetails)

// table of contents [data-toc] + [data-toc-content]
const slugify = (text) =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'heading'

const uniqueTocId = (base, used, element) => {
  let id = base
  let n = 2
  while (
    used.has(id) ||
    (document.getElementById(id) && document.getElementById(id) !== element)
  ) {
    id = `${base}-${n++}`
  }
  used.add(id)
  return id
}

const buildTocList = (headings) => {
  const root = document.createElement('ul')

  const stack = [root]
  const usedIds = new Set()
  let count = 0

  headings.forEach((heading) => {
    const text = heading.textContent.trim()
    if (!text) return

    const level = Number(heading.tagName[1])
    const depth = level - 1

    while (stack.length > depth) stack.pop()
    while (stack.length < depth) {
      const nested = document.createElement('ul')
      const lastLi = stack[stack.length - 1].lastElementChild
      if (lastLi) {
        lastLi.appendChild(nested)
      } else {
        stack[stack.length - 1].appendChild(nested)
      }
      stack.push(nested)
    }

    const id = uniqueTocId(heading.id || slugify(text), usedIds, heading)
    heading.id = id

    const li = document.createElement('li')
    const a = document.createElement('a')
    a.href = `#${id}`
    a.textContent = text
    li.appendChild(a)
    stack[stack.length - 1].appendChild(li)
    count++
  })

  return count > 0 ? root : null
}

document.querySelectorAll('[data-toc]').forEach((nav) => {
  const section = nav.closest('.section')
  const content = section?.querySelector('[data-toc-content]')
  const list = nav.querySelector('ul')
  if (!content || !list) return

  const headings = content.querySelectorAll('h2, h3, h4, h5, h6')
  const toc = buildTocList(headings)
  if (!toc) return

  list.replaceWith(toc)
  nav.removeAttribute('hidden')
})

// set CSS custom properties from [data-height-var]
const heightVarObserver = new ResizeObserver((entries) => {
  for (const entry of entries) {
    const property = entry.target.dataset.heightVar
    if (!property) continue
    document.documentElement.style.setProperty(
      property,
      `${entry.borderBoxSize?.[0]?.blockSize ?? entry.target.offsetHeight}px`
    )
  }
})

document.querySelectorAll('[data-height-var]').forEach((el) => {
  heightVarObserver.observe(el)
})

})()
