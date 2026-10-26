const enabledBox = document.getElementById("enabled");
const siteBox = document.getElementById("site");
const siteRow = document.getElementById("site-row");
const hostLabel = document.getElementById("host");
const showButtonBox = document.getElementById("show-button");

async function init() {
  const saved = await browser.storage.local.get(["enabled", "showButton", "fullHosts"]);
  const fullHosts = Array.isArray(saved.fullHosts) ? saved.fullHosts : [];
  enabledBox.checked = saved.enabled !== false;
  showButtonBox.checked = saved.showButton !== false;

  showButtonBox.addEventListener("change", () => {
    browser.storage.local.set({ showButton: showButtonBox.checked });
  });

  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  let host = "";
  try { host = new URL(tab.url).hostname; } catch (e) {}
  if (!host) {
    siteRow.hidden = true;
  } else {
    hostLabel.textContent = host;
    siteBox.checked = fullHosts.includes(host);
  }

  enabledBox.addEventListener("change", () => {
    browser.storage.local.set({ enabled: enabledBox.checked });
  });

  siteBox.addEventListener("change", async () => {
    const current = (await browser.storage.local.get("fullHosts")).fullHosts || [];
    const next = siteBox.checked
      ? [...new Set([...current, host])]
      : current.filter((h) => h !== host);
    browser.storage.local.set({ fullHosts: next });
  });
}

init();
