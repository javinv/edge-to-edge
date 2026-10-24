// Safari gives pages a layout viewport narrower than the outer display and
// keeps its buttons in a strip at the side. The web view itself spans the
// whole display, so the page can draw under that strip if its layout
// viewport is as wide as the display. Rewriting width=device-width in the
// page's viewport tag to the display's size widens the layout viewport, and
// with it fixed and sticky elements too.
(() => {
  const MAX_GAP = 160;
  const ORIGINAL = "data-edge-to-edge-original";
  const root = document.documentElement;
  const state = { enabled: true, disabledHosts: [] };
  let gap = 0;

  function isOn() {
    return state.enabled && !state.disabledHosts.includes(location.hostname);
  }

  function zoomed() {
    return window.visualViewport ? visualViewport.scale > 1.01 : false;
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

  function apply() {
    gap = isOn() ? measure() : 0;
    viewportTags().forEach(rewrite);
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

  // The wider layout viewport lets Safari pan the page sideways by the gap;
  // pull it back unless the page is wider than the display on its own or
  // zoomed in.
  function onScroll() {
    if (!gap || zoomed() || scrollX === 0) return;
    if (root.scrollWidth > displayWidth() + 1) return;
    scrollTo(0, scrollY);
  }

  apply();
  document.addEventListener("DOMContentLoaded", apply);
  addEventListener("orientationchange", () => setTimeout(apply, 300));
  addEventListener("scroll", onScroll, { passive: true });

  browser.storage.local.get(["enabled", "disabledHosts"]).then((saved) => {
    if (typeof saved.enabled === "boolean") state.enabled = saved.enabled;
    if (Array.isArray(saved.disabledHosts)) state.disabledHosts = saved.disabledHosts;
    apply();
  });

  browser.storage.onChanged.addListener((changes) => {
    if (changes.enabled) state.enabled = changes.enabled.newValue !== false;
    if (changes.disabledHosts) state.disabledHosts = changes.disabledHosts.newValue || [];
    apply();
  });
})();
