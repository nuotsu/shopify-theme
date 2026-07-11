(function(){

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

})();
