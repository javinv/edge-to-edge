// Safari gives pages a layout viewport narrower than the outer display and
// keeps its buttons in a strip at the side. The web view itself spans the
// whole display, so the page can draw under that strip if its layout
// viewport is as wide as the display. Rewriting width=device-width in the
// page's viewport tag to the display's size widens the layout viewport, and
// with it fixed and sticky elements too.
(() => {
  const MAX_GAP = 160;
  const ORIGINAL = "data-edge-to-edge-original";
  // Same size and column as Safari's own buttons in the strip.
  const BUTTON_SIZE = 48;
  const BUTTON_CENTER_FROM_EDGE = 48;
  // Safari's back/forward and Reader buttons move depending on whether
  // there is a page to go forward to, which a page cannot know; the new-tab
  // and tabs pill at the bottom stays put, so sit just above it.
  const BUTTON_BOTTOM_GAP = 157;
  const root = document.documentElement;
  const state = { enabled: true, showButton: true, disabledHosts: [] };
  let strip = 0;
  let gap = 0;

  function isOn() {
    return state.enabled && !state.disabledHosts.includes(location.hostname);
  }

  function zoomed() {
    return window.visualViewport ? visualViewport.scale > 1.01 : false;
  }

  function displayHeight() {
    const short = Math.min(screen.width, screen.height);
    const long = Math.max(screen.width, screen.height);
    return innerHeight >= innerWidth ? long : short;
  }

  function buttonTop() {
    return displayHeight() - BUTTON_BOTTOM_GAP - BUTTON_SIZE;
  }

  function displayWidth() {
    // screen.width does not always swap on rotation.
    const short = Math.min(screen.width, screen.height);
    const long = Math.max(screen.width, screen.height);
    return innerHeight >= innerWidth ? short : long;
  }

  // Visible area of the web view in points, whatever the page's zoom.
  function visibleSize() {
    const vv = window.visualViewport;
    if (!vv) return { width: innerWidth, height: innerHeight };
    return { width: Math.round(vv.width * vv.scale), height: Math.round(vv.height * vv.scale) };
  }

  function measure() {
    const missing = displayWidth() - visibleSize().width;
    return missing > 0 && missing < MAX_GAP ? missing : 0;
  }

  function parseViewport(content) {
    const props = new Map();
    for (const part of content.split(/[,;]/)) {
      const [key, value] = part.split("=").map((s) => s && s.trim().toLowerCase());
      if (key) props.set(key, value || "");
    }
    return props;
  }

  // Only pages laid out for the device width; fixed-width and desktop pages
  // are scaled by Safari and are left alone.
  function followsDeviceWidth(props) {
    const width = props.get("width");
    return width === "device-width" || (width === undefined && props.has("initial-scale"));
  }

  // What this script last wrote into each tag, to tell its own writes from
  // the page's.
  const written = new WeakMap();

  function rewrite(meta) {
    const current = meta.getAttribute("content") || "";
    if (current !== written.get(meta)) meta.setAttribute(ORIGINAL, current);
    const original = meta.getAttribute(ORIGINAL) || "";
    const props = parseViewport(original);
    let next = original;
    if (gap && followsDeviceWidth(props)) {
      props.set("width", String(displayWidth()));
      props.set("height", String(visibleSize().height));
      if (!props.has("initial-scale")) props.set("initial-scale", "1");
      next = [...props].map(([k, v]) => (v ? `${k}=${v}` : k)).join(", ");
    }
    if (next !== current) {
      written.set(meta, next);
      meta.setAttribute("content", next);
    }
  }

  function viewportTags() {
    return document.querySelectorAll('meta[name="viewport" i]');
  }

  function isPhonePage() {
    return [...viewportTags()].some((meta) =>
      followsDeviceWidth(parseViewport(meta.getAttribute(ORIGINAL) ?? meta.getAttribute("content") ?? ""))
    );
  }

  function apply() {
    // Measure only while the page has its own viewport: once it is widened
    // the strip is still there but the page can no longer see it.
    if (!zoomed() && gap === 0) strip = measure();
    gap = isOn() ? strip : 0;
    viewportTags().forEach(rewrite);
    updateButton();
  }

  // Pages add the tag while parsing, and some scripts replace it later.
  new MutationObserver((records) => {
    const changed = records.some((r) =>
      r.type === "attributes"
        ? r.target.getAttribute("content") !== written.get(r.target)
        : [...r.addedNodes].some((n) => n.nodeName === "META" || n.nodeName === "HEAD")
    );
    if (changed) apply();
  }).observe(root, { childList: true, subtree: true, attributes: true, attributeFilter: ["content"] });

  // The on/off button lives in Safari's strip. When the page is widened the
  // strip is inside its layout viewport and the button is simply fixed.
  // When it is not, WebKit clips fixed and sticky elements to the page's
  // width but still paints ordinary content past it, so the button is
  // positioned absolutely and moved after each scroll, hidden meanwhile.
  let host = null;
  let button = null;
  let settleTimer = 0;

  // Arrows pointing out to both edges, drawn like an SF Symbol.
  const ICON =
    '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.9" ' +
    'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="M3.5 12h17M7.5 7.5 3 12l4.5 4.5M16.5 7.5 21 12l-4.5 4.5"/></svg>';

  function buildButton() {
    host = document.createElement("edge-to-edge-button");
    host.style.cssText =
      "all: initial; display: block; z-index: 2147483647; pointer-events: none; " +
      // Room for the shadow: WebKit paints nothing past the element's box here.
      `width: ${BUTTON_SIZE + 12}px; height: ${BUTTON_SIZE + 14}px; transition: opacity 0.18s;`;
    const shadow = host.attachShadow({ mode: "closed" });
    shadow.innerHTML = `
      <style>
        div {
          width: ${BUTTON_SIZE}px;
          height: ${BUTTON_SIZE}px;
          box-sizing: border-box;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          /* Liquid glass as Safari draws its strip buttons: a pale body, a
             brighter top edge and a hairline rim, almost no shadow. */
          background:
            linear-gradient(180deg, rgba(255, 255, 255, 0.6), rgba(255, 255, 255, 0) 60%),
            rgba(242, 242, 247, 0.92);
          border: 0.5px solid rgba(0, 0, 0, 0.2);
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
          color: #000;
          transition: transform 0.2s cubic-bezier(0.3, 1.4, 0.6, 1), color 0.15s;
        }
        /* The blur only inside the page: past its edge WebKit does not paint
           composited layers, and backdrop-filter makes one. */
        div.inside {
          background:
            linear-gradient(180deg, rgba(255, 255, 255, 0.55), rgba(255, 255, 255, 0) 60%),
            rgba(242, 242, 247, 0.55);
          -webkit-backdrop-filter: blur(12px) saturate(1.8);
          backdrop-filter: blur(12px) saturate(1.8);
        }
        div.on { color: #007aff; }
        div.pressed { transform: scale(0.9); }
        @media (prefers-color-scheme: dark) {
          div {
            background:
              linear-gradient(180deg, rgba(255, 255, 255, 0.22), rgba(255, 255, 255, 0) 55%),
              rgba(120, 120, 126, 0.92);
            border-color: rgba(255, 255, 255, 0.3);
            box-shadow: 0 1px 4px rgba(0, 0, 0, 0.18);
            color: #fff;
          }
          div.inside {
            background:
              linear-gradient(180deg, rgba(255, 255, 255, 0.22), rgba(255, 255, 255, 0) 55%),
              rgba(120, 120, 126, 0.55);
          }
          div.on { color: #0a84ff; }
        }
      </style>
      <div role="button">${ICON}</div>`;
    button = shadow.querySelector("div");
    root.appendChild(host);
  }

  function buttonShown() {
    return !!host && host.style.display !== "none";
  }

  function placeButton() {
    if (!buttonShown()) return;
    const left = displayWidth() - BUTTON_CENTER_FROM_EDGE - BUTTON_SIZE / 2;
    if (gap) {
      host.style.position = "fixed";
      host.style.left = `${left}px`;
      host.style.top = `${buttonTop()}px`;
    } else {
      host.style.position = "absolute";
      host.style.left = `${left}px`;
      host.style.top = `${Math.round(scrollY + buttonTop())}px`;
    }
    host.style.opacity = "1";
  }

  function updateButton() {
    const show = state.enabled && state.showButton && strip > 0 && !zoomed() && isPhonePage();
    if (!show) {
      if (host) host.style.display = "none";
      return;
    }
    if (!document.body) return;
    if (!host) buildButton();
    host.style.display = "block";
    button.classList.toggle("on", isOn());
    button.classList.toggle("inside", gap > 0);
    button.setAttribute("aria-label", isOn() ? "Edge to Edge: on for this site" : "Edge to Edge: off for this site");
    placeButton();
  }

  function onScrollButton() {
    if (!buttonShown() || gap) return;
    host.style.opacity = "0";
    clearTimeout(settleTimer);
    settleTimer = setTimeout(placeButton, 160);
  }

  async function toggleSite() {
    const host = location.hostname;
    const saved = await browser.storage.local.get("disabledHosts");
    const hosts = Array.isArray(saved.disabledHosts) ? saved.disabledHosts : [];
    state.disabledHosts = hosts.includes(host) ? hosts.filter((h) => h !== host) : [...hosts, host];
    apply();
    browser.storage.local.set({ disabledHosts: state.disabledHosts });
  }

  // WebKit does not hit-test content drawn under Safari's strip, so taps on
  // the button reach the page as taps on <html>; match them by position.
  let touch = null;

  function insideButton(point) {
    if (!buttonShown() || host.style.opacity === "0") return false;
    const r = button.getBoundingClientRect();
    return point.clientX >= r.left && point.clientX <= r.right && point.clientY >= r.top && point.clientY <= r.bottom;
  }

  addEventListener(
    "touchstart",
    (e) => {
      const t = e.touches[0];
      touch = e.touches.length === 1 && insideButton(t) ? { x: t.clientX, y: t.clientY, time: e.timeStamp } : null;
      if (touch) button.classList.add("pressed");
    },
    { capture: true, passive: true }
  );

  addEventListener(
    "touchend",
    (e) => {
      if (!touch) return;
      button.classList.remove("pressed");
      const t = e.changedTouches[0];
      const moved = Math.hypot(t.clientX - touch.x, t.clientY - touch.y);
      const quick = e.timeStamp - touch.time < 800;
      touch = null;
      if (moved < 12 && quick && insideButton(t)) {
        e.preventDefault();
        toggleSite();
      }
    },
    { capture: true, passive: false }
  );

  addEventListener("touchcancel", () => {
    touch = null;
    if (button) button.classList.remove("pressed");
  });

  // A layout viewport or button wider than the page lets Safari pan it
  // sideways by the strip's width; pull it back unless the page is wider
  // than the display on its own or zoomed in.
  function onScroll() {
    if (!(gap || buttonShown()) || zoomed() || scrollX === 0) return;
    if (root.scrollWidth > displayWidth() + 1) return;
    scrollTo(0, scrollY);
  }

  apply();
  document.addEventListener("DOMContentLoaded", apply);
  // The strip moves or disappears when the phone turns: give the page its
  // own viewport back, let Safari lay it out, then measure again.
  addEventListener("orientationchange", () => {
    gap = 0;
    viewportTags().forEach(rewrite);
    setTimeout(apply, 400);
  });
  addEventListener("scroll", onScroll, { passive: true });
  addEventListener("scroll", onScrollButton, { passive: true });
  if (window.visualViewport) visualViewport.addEventListener("resize", updateButton);

  browser.storage.local.get(["enabled", "showButton", "disabledHosts"]).then((saved) => {
    if (typeof saved.enabled === "boolean") state.enabled = saved.enabled;
    if (typeof saved.showButton === "boolean") state.showButton = saved.showButton;
    if (Array.isArray(saved.disabledHosts)) state.disabledHosts = saved.disabledHosts;
    apply();
  });

  browser.storage.onChanged.addListener((changes) => {
    if (changes.enabled) state.enabled = changes.enabled.newValue !== false;
    if (changes.showButton) state.showButton = changes.showButton.newValue !== false;
    if (changes.disabledHosts) state.disabledHosts = changes.disabledHosts.newValue || [];
    apply();
  });
})();
