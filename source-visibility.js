import {
  getExternalEntries, getHiddenOnlyEntries, resolveExternalEntry, withUnmaskedSourceVisibility,
  SOURCE_VISIBILITY_STYLE_ID, SOURCE_HIDDEN_ATTRIBUTE,
} from "./external-entries.js";

const RELATED_ATTRIBUTE = "data-quickbar-source-for";
const LAYOUT_ROOTS = "#input_helper_toolbar, .ih-floating-panel, .ih-floating-ball, #extensionsMenu, #extensions_settings, #extensions_settings2, .ih-folder-dropdown-portal, [data-quickbar-source-for]";

// Display policy only: native nodes, handlers and source-owned attributes stay
// untouched. Shortcuts need a reachable replacement; explicit hidden-only
// rules are independent of layouts, button switches and the unified eye.
export function createSourceVisibilityController({ doc = globalThis.document, getSettings, getReachableKeys, onChange = () => {}, onError = () => {} }) {
  const win = doc.defaultView;
  let started = false, destroyed = false, syncing = false, timer = null, observer = null, style = null;
  let owned = new Set();
  const report = error => { try { onError(error); } catch {} };
  const notify = () => { try { onChange(); } catch (error) { report(error); } };
  function restore() {
    let changed = owned.size > 0;
    for (const node of owned) {
      if (node.getAttribute(SOURCE_HIDDEN_ATTRIBUTE) === "true") node.removeAttribute(SOURCE_HIDDEN_ATTRIBUTE);
    }
    owned.clear();
    return changed;
  }
  function ensureStyle() {
    style = doc.getElementById(SOURCE_VISIBILITY_STYLE_ID);
    if (style && style.tagName !== "STYLE") { style = null; throw new Error("QuickBar source visibility style ID is occupied"); }
    if (!style) {
      style = doc.createElement("style"); style.id = SOURCE_VISIBILITY_STYLE_ID;
      style.textContent = `[${SOURCE_HIDDEN_ATTRIBUTE}="true"] { display: none !important; }`;
      (doc.head || doc.documentElement).append(style);
    }
  }
  function removeStyle() {
    const node = style || doc.getElementById(SOURCE_VISIBILITY_STYLE_ID);
    if (node?.tagName === "STYLE") node.remove();
    style = null;
  }
  function sync() {
    if (!started || destroyed || syncing) return;
    syncing = true;
    try {
      const settings = getSettings();
      if (!settings?.enabled) {
        const changed = restore(); removeStyle();
        if (changed) notify();
        return;
      }
      ensureStyle();
      const desired = withUnmaskedSourceVisibility(doc, () => {
        const next = new Set(), ids = new Set();
        const collect = entry => {
          const node = resolveExternalEntry(doc, entry);
          if (!node?.isConnected) return;
          next.add(node);
          if (node.id) ids.add(node.id);
        };
        for (const entry of getHiddenOnlyEntries(settings)) collect(entry);
        const shortcuts = getExternalEntries(settings)
          .filter(entry => entry.hideOriginal === true && settings.buttons?.[entry.key] !== false);
        // Hidden-only use must work without a shortcut layout provider at all.
        const reachable = new Set(shortcuts.length && typeof getReachableKeys === "function" ? getReachableKeys() || [] : []);
        for (const entry of shortcuts) if (reachable.has(entry.key)) collect(entry);
        if (ids.size) for (const node of doc.querySelectorAll(`[${RELATED_ATTRIBUTE}]`)) {
          if (node.isConnected && ids.has(node.getAttribute(RELATED_ATTRIBUTE))) next.add(node);
        }
        return next;
      });
      let changed = desired.size !== owned.size;
      for (const node of owned) if (!desired.has(node)) {
        changed = true;
        if (node.getAttribute(SOURCE_HIDDEN_ATTRIBUTE) === "true") node.removeAttribute(SOURCE_HIDDEN_ATTRIBUTE);
      }
      for (const node of desired) {
        if (!owned.has(node)) changed = true;
        // Track before writing so a partially failed sync can restore every mask.
        owned.add(node);
        if (node.getAttribute(SOURCE_HIDDEN_ATTRIBUTE) !== "true") {
          node.setAttribute(SOURCE_HIDDEN_ATTRIBUTE, "true"); changed = true;
        }
      }
      owned = desired;
      if (changed) notify();
    } catch (error) {
      const changed = restore();
      report(error);
      if (changed) notify();
    } finally { syncing = false; }
  }
  function schedule() {
    if (!started || destroyed || timer !== null) return;
    timer = win.setTimeout(() => { timer = null; sync(); }, 60);
  }
  function relevant(node) {
    if (node?.nodeType === 3) node = node.parentElement;
    if (!node || node === style) return false;
    return node === doc.documentElement || node === doc.body || node === doc.head
      || !!node.closest?.(`${LAYOUT_ROOTS}, head`);
  }
  function introduced(node) {
    return node !== style && (!!node.matches?.(LAYOUT_ROOTS) || !!node.querySelector?.(LAYOUT_ROOTS));
  }
  function start() {
    if (started || destroyed) return;
    started = true;
    try {
      // Recover orphaned masks left by an interrupted previous host instance.
      for (const node of doc.querySelectorAll(`[${SOURCE_HIDDEN_ATTRIBUTE}="true"]`)) node.removeAttribute(SOURCE_HIDDEN_ATTRIBUTE);
      if (win.MutationObserver) {
        observer = new win.MutationObserver(records => {
          if (records.some(record => relevant(record.target)
            || (record.type === "childList" && [...record.addedNodes, ...record.removedNodes].some(introduced)))) schedule();
        });
        observer.observe(doc.documentElement, { subtree: true, childList: true, characterData: true, attributes: true,
          attributeFilter: ["id", "aria-label", "title", "tabindex", "style", "class", "hidden", "disabled", "aria-disabled", "data-quickbar-hide-source-default", RELATED_ATTRIBUTE] });
      }
      win.addEventListener("resize", schedule); win.addEventListener("pagehide", destroy);
      sync();
    } catch (error) { const changed = restore(); report(error); if (changed) notify(); }
  }
  function destroy() {
    if (destroyed) return;
    destroyed = true; started = false;
    if (timer !== null) win.clearTimeout(timer);
    timer = null; observer?.disconnect(); observer = null;
    win.removeEventListener("resize", schedule); win.removeEventListener("pagehide", destroy);
    const changed = restore();
    removeStyle();
    if (changed) notify();
  }
  return Object.freeze({ start, schedule, sync, destroy });
}
