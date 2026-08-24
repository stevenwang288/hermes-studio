/**
 * Guest-page element picker for the desktop Browser preview.
 *
 * `PICKER_SCRIPT` is injected into the page via `executeJavaScriptInIsolatedWorld`.
 * Hovering outlines the node under the pointer; clicking resolves the script's
 * promise with a structured snapshot that the caller formats and inserts into
 * the chat composer. Escape, a second click on the toolbar button, or a
 * navigation cancels the pick.
 *
 * The snapshot is what a person would otherwise copy out of DevTools by hand:
 * page URL and title, tag, role, accessible name, CSS selector, XPath, the
 * attributes that identify the node, the computed colors and font, the
 * bounding box, the visible text, the surrounding block's text, and an HTML
 * excerpt.
 *
 * Two things are deliberately never captured: the value of any input (a
 * password field reports only that it is one), and `script` / `style` /
 * `noscript` / `template` bodies inside the HTML excerpt.
 */

export const PICKER_MAX_TEXT = 8_000
export const PICKER_MAX_HTML = 8_000
export const PICKER_MAX_ATTR = 240

/**
 * Injected into the guest page, so it must stay self-contained: no imports, no
 * TypeScript, and ES5 syntax only — the page may run under any engine Electron
 * hands it, and the string is evaluated as-is.
 */
export const PICKER_SCRIPT = `(function () {
  var KEY = ${JSON.stringify('__hermesWebElementPicker')}
  var existing = window[KEY]
  if (existing && typeof existing.cancel === 'function') existing.cancel()

  var MAX_TEXT = ${PICKER_MAX_TEXT}
  var MAX_HTML = ${PICKER_MAX_HTML}
  var MAX_ATTR = ${PICKER_MAX_ATTR}

  function clip(value, max) {
    var text = String(value == null ? '' : value).replace(/\\s+/g, ' ').trim()
    return text.length > max ? text.slice(0, max) + '...' : text
  }

  function cssEscape(value) {
    if (window.CSS && typeof window.CSS.escape === 'function') return window.CSS.escape(value)
    return String(value).replace(/[^a-zA-Z0-9_-]/g, '\\\\$&')
  }

  function visibleText(node) {
    if (node instanceof HTMLInputElement) {
      if (node.type.toLowerCase() === 'password') return '[masked password input]'
      return clip(node.getAttribute('aria-label') || node.getAttribute('placeholder') || node.name || node.type, MAX_TEXT)
    }
    if (node instanceof HTMLTextAreaElement) {
      return clip(node.getAttribute('aria-label') || node.getAttribute('placeholder') || node.name || 'textarea', MAX_TEXT)
    }
    return clip(node.innerText || node.textContent, MAX_TEXT)
  }

  function impliedRole(node) {
    var tag = node.tagName.toLowerCase()
    if (tag === 'button') return 'button'
    if (tag === 'a' && node.hasAttribute('href')) return 'link'
    if (tag === 'img') return 'img'
    if (tag === 'input') {
      var type = (node.getAttribute('type') || 'text').toLowerCase()
      if (type === 'checkbox') return 'checkbox'
      if (type === 'radio') return 'radio'
      if (type === 'range') return 'slider'
      if (type === 'button' || type === 'submit' || type === 'reset') return 'button'
      return 'textbox'
    }
    if (tag === 'textarea') return 'textbox'
    if (tag === 'select') return 'combobox'
    if (tag === 'nav') return 'navigation'
    if (tag === 'main') return 'main'
    if (tag === 'form') return 'form'
    if (tag === 'header') return 'banner'
    if (tag === 'footer') return 'contentinfo'
    if (tag === 'aside') return 'complementary'
    if (tag === 'section') return 'region'
    if (tag === 'article') return 'article'
    if (tag === 'ul' || tag === 'ol') return 'list'
    if (tag === 'li') return 'listitem'
    return null
  }

  function styleFor(node) {
    var style = getComputedStyle(node)
    function hex(color) {
      if (!color) return undefined
      var parts = color.match(/rgba?\\((\\d+),\\s*(\\d+),\\s*(\\d+)(?:,\\s*([\\d.]+))?\\)/)
      if (!parts) return color.trim()
      var r = (+parts[1]).toString(16).padStart(2, '0')
      var g = (+parts[2]).toString(16).padStart(2, '0')
      var b = (+parts[3]).toString(16).padStart(2, '0')
      var a = parts[4]
      if (a !== undefined && (+a) < 1) {
        var al = Math.round((+a) * 255).toString(16).padStart(2, '0')
        return '#' + r + g + b + al
      }
      return '#' + r + g + b
    }
    return {
      color: hex(style.color),
      backgroundColor: hex(style.backgroundColor),
      fontSize: style.fontSize,
      fontFamily: style.fontFamily,
      fontWeight: style.fontWeight,
      display: style.display,
    }
  }

  function selectorFor(node) {
    if (!(node instanceof Element)) return null
    var parts = []
    var el = node
    while (el && el.nodeType === 1 && parts.length < 5) {
      var segment = ''
      var tag = el.tagName.toLowerCase()
      if (el.id) {
        segment = tag + '#' + cssEscape(el.id)
      } else {
        segment = tag
        var classes = Array.prototype.slice.call(el.classList).filter(function (c) {
          return c && !/^[._-]/.test(c) && !/[a-z]{2,}--[a-z]/i.test(c)
        }).slice(0, 3)
        if (classes.length) segment += '.' + classes.map(cssEscape).join('.')
      }
      parts.unshift(segment)
      el = el.parentElement
    }
    return parts.join(' > ')
  }

  function xpathFor(node) {
    var parts = []
    var el = node
    while (el && el.nodeType === 1) {
      var idx = 1
      var sibling = el.previousElementSibling
      while (sibling) {
        if (sibling.tagName === el.tagName) idx++
        sibling = sibling.previousElementSibling
      }
      parts.unshift(el.tagName.toLowerCase() + '[' + idx + ']')
      el = el.parentElement
      if (parts.length > 40) break
    }
    return '/' + parts.join('/')
  }

  function attributeSnapshot(node) {
    var attrs = {}
    var names = ['id', 'class', 'href', 'src', 'alt', 'title', 'name', 'type', 'role', 'aria-label', 'placeholder', 'data-testid', 'data-test', 'data-cy', 'data-id', 'data-key', 'data-value', 'target']
    for (var i = 0; i < names.length; i++) {
      var name = names[i]
      var value = node.getAttribute && node.getAttribute(name)
      if (value === null || value === undefined) continue
      if ((name === 'href' || name === 'src') && value && value.length > MAX_ATTR) {
        value = value.slice(0, MAX_ATTR) + '...'
      }
      if (name === 'class') {
        attrs[name] = String(value)
      } else {
        attrs[name] = String(value).slice(0, MAX_ATTR)
      }
    }
    var entries = Object.keys(attrs)
    if (entries.length === 0) return undefined
    return attrs
  }

  function nearbyContext(node) {
    var containers = ['article', 'section', 'main', 'form', 'nav', 'header', 'footer', 'aside', 'div']
    var el = node
    while (el && el.parentElement) {
      el = el.parentElement
      var tag = el.tagName.toLowerCase()
      if (containers.indexOf(tag) !== -1) {
        var text = el.innerText || el.textContent || ''
        text = text.replace(/\\s+/g, ' ').trim()
        if (text) return clip(text, MAX_TEXT)
      }
    }
    return null
  }

  function htmlExcerpt(node) {
    try {
      var clone = node.cloneNode(true)
      Array.prototype.forEach.call(clone.querySelectorAll('script,style,noscript,template'), function (n) { n.remove() })
      Array.prototype.forEach.call(clone.querySelectorAll('input,textarea,select'), function (n) {
        ['value', 'defaultValue'].forEach(function (a) { try { n.removeAttribute(a) } catch (e) {} })
      })
      var outer = clone.outerHTML || ''
      return outer.length > MAX_HTML ? outer.slice(0, MAX_HTML) + '...' : outer
    } catch (e) {
      return null
    }
  }

  function accessibleName(node) {
    return node.getAttribute && (node.getAttribute('aria-label') || node.getAttribute('title') || node.getAttribute('alt') || (node.getAttribute('role') ? null : null))
  }

  function snapshot(target) {
    var style = styleFor(target)
    var rect = target.getBoundingClientRect()
    var role = target.getAttribute && target.getAttribute('role')
    var tag = target.tagName.toLowerCase()
    return {
      pageUrl: location.href,
      pageTitle: document.title,
      tagName: tag,
      role: role || impliedRole(target) || undefined,
      accessibleName: accessibleName(target) || undefined,
      selector: selectorFor(target),
      xpath: xpathFor(target),
      attributes: attributeSnapshot(target),
      style: {
        color: style.color,
        backgroundColor: style.backgroundColor,
        fontSize: style.fontSize,
        fontFamily: style.fontFamily,
        fontWeight: style.fontWeight,
        display: style.display,
      },
      rect: rect && rect.width && rect.height ? { x: rect.left, y: rect.top, width: rect.width, height: rect.height } : undefined,
      text: visibleText(target),
      nearbyText: nearbyContext(target),
      htmlExcerpt: htmlExcerpt(target),
    }
  }

  var overlay = null
  var box = null
  var hover = null
  var finish = null
  var settled = false

  var PRESS_EVENTS = ['mousedown', 'mouseup', 'pointerdown', 'pointerup', 'contextmenu', 'dblclick']

  function paint(el) {
    var r = el.getBoundingClientRect()
    box.style.display = 'block'
    box.style.left = r.left + 'px'
    box.style.top = r.top + 'px'
    box.style.width = r.width + 'px'
    box.style.height = r.height + 'px'
    box.innerHTML = ''
    var badge = document.createElement('span')
    badge.className = 'picker-badge'
    badge.textContent = el.tagName.toLowerCase() + (el.id ? '#' + el.id : '')
    badge.style.cssText = 'position:absolute;top:100%;left:0;margin-top:2px;padding:2px 6px;font:600 11px/16px system-ui,sans-serif;color:#fff;background:rgba(37,99,235,.95);border-radius:4px;white-space:nowrap;'
    box.appendChild(badge)
  }

  function onMove(event) {
    if (settled) return
    overlay.style.visibility = 'hidden'
    box.style.visibility = 'hidden'
    var target = document.elementFromPoint(event.clientX, event.clientY)
    overlay.style.visibility = ''
    box.style.visibility = ''
    if (!target || target === overlay || target === box || target === document.documentElement || target === document.body) return
    if (hover !== target) {
      hover = target
      paint(target)
    } else if (hover) {
      paint(hover)
    }
  }

  function onReflow() {
    if (hover && hover.isConnected) paint(hover)
  }

  function onPress(event) {
    event.preventDefault()
    event.stopPropagation()
    event.stopImmediatePropagation()
  }

  function onClick(event) {
    event.preventDefault()
    event.stopPropagation()
    event.stopImmediatePropagation()
    if (!hover) {
      finish && finish({ status: 'cancelled' })
      return
    }
    finish && finish({ status: 'selected', element: snapshot(hover) })
  }

  function onKey(event) {
    if (event.key === 'Escape') {
      event.preventDefault()
      event.stopPropagation()
      finish && finish({ status: 'cancelled' })
    }
  }

  function teardown() {
    overlay && overlay.remove()
    if (document.documentElement) document.documentElement.style.cursor = ''
    document.removeEventListener('mousemove', onMove, true)
    document.removeEventListener('click', onClick, true)
    document.removeEventListener('keydown', onKey, true)
    PRESS_EVENTS.forEach(function (name) {
      document.removeEventListener(name, onPress, true)
    })
    window.removeEventListener('scroll', onReflow, true)
    window.removeEventListener('resize', onReflow, true)
  }

  return new Promise(function (resolve) {
    finish = function (result) {
      if (settled) return
      settled = true
      teardown()
      resolve(result)
    }
    window[KEY] = { cancel: function () { finish({ status: 'cancelled' }) } }
    document.documentElement.style.cursor = 'crosshair'
    overlay = document.createElement('div')
    overlay.style.cssText = 'position:fixed;inset:0;z-index:2147483647;cursor:crosshair;background:rgba(37,99,235,.04);'
    box = document.createElement('div')
    box.style.cssText = 'position:fixed;display:none;pointer-events:none;z-index:2147483647;border:2px solid #2563eb;background:rgba(37,99,235,.12);box-sizing:border-box;'
    document.documentElement.appendChild(overlay)
    overlay.appendChild(box)
    document.addEventListener('mousemove', onMove, true)
    document.addEventListener('click', onClick, true)
    document.addEventListener('keydown', onKey, true)
    PRESS_EVENTS.forEach(function (name) {
      document.addEventListener(name, onPress, true)
    })
    window.addEventListener('scroll', onReflow, true)
    window.addEventListener('resize', onReflow, true)
  })
})()`

export const CANCEL_PICKER_SCRIPT = `(() => {
  const picker = window.__hermesWebElementPicker
  if (picker && typeof picker.cancel === 'function') picker.cancel()
})()`