export const EXTERNAL_ENTRY_SOURCES = Object.freeze({
  wand: { label: "魔法棒入口", icon: "fa-solid fa-wand-magic-sparkles", roots: ["extensionsMenu"] },
  panel: { label: "扩展面板入口", icon: "fa-solid fa-puzzle-piece", roots: ["extensions_settings", "extensions_settings2"] },
});
export const SOURCE_VISIBILITY_STYLE_ID = "st-quickbar-source-visibility";
export const SOURCE_HIDDEN_ATTRIBUTE = "data-quickbar-source-hidden";
const RELATED_ATTRIBUTE = "data-quickbar-source-for";
// ID-weighted masking beats theme !important rules without changing source inline styles.
const SOURCE_VISIBILITY_CSS = `:is(#${SOURCE_VISIBILITY_STYLE_ID}#${SOURCE_VISIBILITY_STYLE_ID}, [${SOURCE_HIDDEN_ATTRIBUTE}="true"])[${SOURCE_HIDDEN_ATTRIBUTE}="true"] { display: none !important; }`;
const LAYOUT_ROOTS = "#rm_extensions_block, #input_helper_toolbar, .ih-floating-panel, .ih-floating-ball, #extensionsMenu, #extensions_settings, #extensions_settings2, .ih-folder-dropdown-portal, [data-quickbar-source-for]";

// Disable only our mask during synchronous discovery, preserving source-owned visibility.
export function withUnmaskedSourceVisibility(doc, read) {
  const sheet = doc.getElementById(SOURCE_VISIBILITY_STYLE_ID)?.sheet;
  if (!sheet) return read();
  const disabled = sheet.disabled;
  try { sheet.disabled = true; return read(); }
  finally { sheet.disabled = disabled; }
}

const KEY_PATTERN = /^external_(wand|panel)_[a-z0-9_-]+$/;
const HIDDEN_KEY_PATTERN = /^hidden_(wand|panel)_[a-z0-9_-]+$/;
const FA_FAMILIES = new Map([
  ["fa", "fa-solid"], ["fas", "fa-solid"], ["far", "fa-regular"], ["fab", "fa-brands"],
  ["fa-solid", "fa-solid"], ["fa-regular", "fa-regular"], ["fa-brands", "fa-brands"],
]);
const FA_UTILITIES = /^fa-(?:fw|fixed-width|spin|pulse|beat|bounce|fade|shake|border|inverse|stack(?:-1x|-2x)?|pull-(?:left|right)|rotate-(?:90|180|270|by)|flip(?:-horizontal|-vertical|-both)?|size-.*|xs|sm|lg|xl|2xl|\d+x|sharp|duotone|light|thin|animation.*|swap-opacity)$/;

export function normalizeEntryIcon(value) {
  if (typeof value !== "string") return "";
  const tokens = value.trim().split(/\s+/);
  const family = tokens.map(token => FA_FAMILIES.get(token)).find(Boolean) || "fa-solid";
  const glyph = tokens.find(token => /^fa-[a-z0-9-]+$/.test(token) && !FA_FAMILIES.has(token) && !FA_UTILITIES.test(token));
  return glyph ? `${family} ${glyph}` : "";
}

export function getExternalEntrySettings(settings) {
  if (!settings.externalEntries || typeof settings.externalEntries !== "object" || Array.isArray(settings.externalEntries)) settings.externalEntries = {};
  const state = settings.externalEntries;
  if (!state.hiddenOnly || typeof state.hiddenOnly !== "object" || Array.isArray(state.hiddenOnly)) state.hiddenOnly = {};
  for (const source of Object.keys(EXTERNAL_ENTRY_SOURCES)) {
    if (!Array.isArray(state[source])) state[source] = [];
    if (!Array.isArray(state.hiddenOnly[source])) state.hiddenOnly[source] = [];
  }
  if (!state.collapsed || typeof state.collapsed !== "object" || Array.isArray(state.collapsed)) state.collapsed = {};
  return state;
}

function isEntrySource(source) {
  return typeof source === "string" && Object.hasOwn(EXTERNAL_ENTRY_SOURCES, source);
}

function isEntryDescriptor(entry, source = entry?.source) {
  return isEntrySource(source) && !!entry && typeof entry === "object" && !Array.isArray(entry)
    && entry.source === source && typeof entry.label === "string" && !!entry.label.trim()
    && !!entry.locator && typeof entry.locator === "object" && !Array.isArray(entry.locator)
    && EXTERNAL_ENTRY_SOURCES[source].roots.includes(entry.locator.rootId)
    && ["id", "containerId", "label"].every(field => typeof entry.locator[field] === "string")
    && !!(entry.locator.id.trim() || entry.locator.containerId.trim() || entry.locator.label.trim());
}

export function isExternalEntry(entry, source = entry?.source) {
  return isEntryDescriptor(entry, source) && typeof entry.key === "string" && KEY_PATTERN.test(entry.key)
    && entry.key.startsWith(`external_${source}_`);
}

function isHiddenOnlyEntry(entry, source) {
  return isEntryDescriptor(entry, source) && typeof entry.key === "string" && HIDDEN_KEY_PATTERN.test(entry.key)
    && entry.key.startsWith(`hidden_${source}_`) && typeof entry.defaultIcon === "string"
    && !!entry.defaultIcon && normalizeEntryIcon(entry.defaultIcon) === entry.defaultIcon;
}

function uniqueEntries(state, source, validate) {
  const sources = source === undefined ? Object.keys(EXTERNAL_ENTRY_SOURCES) : isEntrySource(source) ? [source] : [];
  const result = [], keys = new Set(), identities = new Set();
  for (const type of sources) for (const entry of state[type]) {
    if (!validate(entry, type)) continue;
    const identity = entryIdentity(entry);
    if (keys.has(entry.key) || identities.has(identity)) continue;
    keys.add(entry.key); identities.add(identity); result.push(entry);
  }
  return result;
}

export function getExternalEntries(settings, source) {
  return uniqueEntries(getExternalEntrySettings(settings), source, isExternalEntry);
}

export function getHiddenOnlyEntries(settings, source) {
  const state = getExternalEntrySettings(settings);
  // Shortcut preferences take precedence over stale hidden-only rules.
  const shortcuts = new Set(getExternalEntries(settings).map(entryIdentity));
  return uniqueEntries(state.hiddenOnly, source, isHiddenOnlyEntry).filter(entry => !shortcuts.has(entryIdentity(entry)));
}

export function isEntryHiddenOnly(settings, candidate) {
  return isEntryDescriptor(candidate) && getHiddenOnlyEntries(settings, candidate.source)
    .some(entry => entryIdentity(entry) === entryIdentity(candidate));
}

export function addHiddenOnlyEntries(settings, candidates) {
  const state = getExternalEntrySettings(settings), added = [];
  if (!Array.isArray(candidates)) return added;
  const keys = new Set([...state.hiddenOnly.wand, ...state.hiddenOnly.panel].map(entry => entry?.key));
  for (const candidate of candidates) {
    if (!isEntryDescriptor(candidate) || isEntryAlreadyAdded(settings, candidate) || isEntryHiddenOnly(settings, candidate)) continue;
    const entry = {
      key: createEntryKey("hidden", candidate.source, keys), source: candidate.source,
      label: candidate.label.trim().slice(0, 160),
      defaultIcon: normalizeEntryIcon(candidate.defaultIcon) || EXTERNAL_ENTRY_SOURCES[candidate.source].icon,
      locator: copyLocator(candidate.locator),
    };
    if (!isHiddenOnlyEntry(entry, entry.source)) continue;
    state.hiddenOnly[entry.source].push(entry); added.push(entry);
  }
  return added;
}

export function removeHiddenOnlyEntry(settings, key) {
  if (typeof key !== "string" || !HIDDEN_KEY_PATTERN.test(key)) return false;
  const state = getExternalEntrySettings(settings).hiddenOnly;
  const source = HIDDEN_KEY_PATTERN.exec(key)[1], entries = state[source];
  state[source] = entries.filter(entry => entry?.key !== key);
  return state[source].length !== entries.length;
}

export function clearHiddenOnlyEntries(settings, source) {
  const state = getExternalEntrySettings(settings).hiddenOnly;
  const sources = source === undefined ? Object.keys(EXTERNAL_ENTRY_SOURCES) : isEntrySource(source) ? [source] : [];
  let removed = 0;
  for (const type of sources) { removed += state[type].length; state[type] = []; }
  return removed;
}

export function getOriginalEntryVisibilityDefault(settings) {
  const state = getExternalEntrySettings(settings);
  if (typeof state.hideOriginalByDefault !== "boolean") state.hideOriginalByDefault = false;
  return state.hideOriginalByDefault;
}
export function getOriginalEntryVisibilitySummary(settings) {
  const defaultHidden = getOriginalEntryVisibilityDefault(settings);
  const entries = getExternalEntries(settings);
  const hidden = entries.filter(entry => entry.hideOriginal === true).length;
  return { total: entries.length, hidden, defaultHidden,
    checked: entries.length ? hidden === entries.length : defaultHidden,
    indeterminate: hidden > 0 && hidden < entries.length };
}
export function setAllOriginalEntryVisibility(settings, enabled) {
  const value = enabled === true;
  getExternalEntrySettings(settings).hideOriginalByDefault = value;
  for (const entry of getExternalEntries(settings)) entry.hideOriginal = value;
  return getOriginalEntryVisibilitySummary(settings);
}

export function findExternalEntry(settings, key) {
  if (typeof key !== "string" || !KEY_PATTERN.test(key)) return null;
  return getExternalEntries(settings).find(entry => entry.key === key) || null;
}

function entryIdentity(entry) {
  const loc = entry.locator;
  return JSON.stringify([entry.source, loc.rootId, loc.id, loc.containerId, loc.label]);
}

function copyLocator(locator) {
  return { rootId: locator.rootId, id: locator.id, containerId: locator.containerId, label: locator.label };
}

function createEntryKey(prefix, source, keys) {
  let suffix = globalThis.crypto?.randomUUID?.();
  if (typeof suffix !== "string" || !/^[a-z0-9_-]+$/.test(suffix)) suffix = `${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`;
  const base = `${prefix}_${source}_${suffix}`;
  let key = base, index = 1;
  while (keys.has(key)) key = `${base}_${index++}`;
  keys.add(key);
  return key;
}

function labelFor(element, source) {
  const preferred = element.getAttribute("aria-label")?.trim();
  if (preferred) return preferred.slice(0, 160);
  const copy = element.cloneNode(true);
  copy.querySelectorAll("i, svg, .inline-drawer-icon, button, input, select, .menu_button, .ih-char-badge").forEach(node => node.remove());
  const label = (source === "panel" ? copy.querySelector("b, strong")?.textContent : "") || copy.textContent;
  return (label?.replace(/\s+/g, " ").trim() || element.getAttribute("title")?.trim() || "").slice(0, 160);
}

function iconFor(element, source) {
  for (const node of [element, ...element.querySelectorAll('[class*="fa"], svg[data-icon]')]) {
    // Disclosure chevrons are not the plugin's icon.
    if (source === "panel" && node.closest(".inline-drawer-icon, button, .menu_button")) continue;
    const svgIcon = node.getAttribute("data-icon");
    const icon = normalizeEntryIcon(svgIcon ? `${node.getAttribute("data-prefix") || "fas"} fa-${svgIcon}` : node.getAttribute("class"));
    if (icon) return icon;
  }
  return source === "wand" ? "fa-solid fa-plug" : "fa-solid fa-puzzle-piece";
}

function isAvailable(element, root) {
  // Ignore collapsed hosts, but respect hidden/disabled nodes inside them.
  for (let node = element; node && node !== root; node = node.parentElement) {
    if (node.hidden || node.getAttribute("aria-disabled") === "true" || node.disabled || node.classList.contains("disabled")) return false;
    const css = node.ownerDocument.defaultView?.getComputedStyle(node);
    if (css?.display === "none") return false;
  }
  // Distinguish inherited host visibility from a hidden source entry.
  const win = element.ownerDocument.defaultView;
  if (win?.getComputedStyle(element).visibility === "hidden" && win.getComputedStyle(root).visibility !== "hidden") return false;
  return true;
}

function candidatesFor(root, source) {
  let candidates;
  if (source === "panel") {
    candidates = [...root.querySelectorAll(".inline-drawer")]
      .filter(drawer => !root.contains(drawer.parentElement?.closest(".inline-drawer")))
      .map(drawer => [...drawer.children].find(node => node.matches(".inline-drawer-toggle, .inline-drawer-header")))
      .filter(Boolean);
  } else {
    const selector = '.list-group-item, button, [role="button"], .menu_button, a[href]';
    candidates = [...root.querySelectorAll(selector)];
    for (const child of root.children) {
      if ((child.id || child.hasAttribute("tabindex")) && !child.matches(selector) && !child.querySelector(selector)
        && !child.classList.contains("extension_container") && labelFor(child, source)) candidates.push(child);
    }
    candidates = candidates.filter(node => !root.contains(node.parentElement?.closest(selector)));
  }
  return candidates.filter(node => !node.closest(".input-helper-settings, [data-quickbar-external]")
    && isAvailable(node, root) && !!labelFor(node, source));
}

function describeUnmaskedCandidates(doc, source) {
  const result = [];
  for (const rootId of EXTERNAL_ENTRY_SOURCES[source]?.roots || []) {
    const root = doc.getElementById(rootId);
    if (!root) continue;
    const candidates = candidatesFor(root, source);
    for (const element of candidates) {
      let anchor = element.parentElement;
      while (anchor && anchor !== root && !anchor.id) anchor = anchor.parentElement;
      const id = element.id || "";
      const containerId = !id && anchor && anchor !== root ? anchor.id : "";
      const siblings = containerId ? candidates.filter(node => anchor.contains(node)) : candidates;
      // Never persist positional selectors; an anonymous label must be unique.
      const locatorLabel = id || (containerId && siblings.length === 1) ? "" : labelFor(element, source);
      const descriptor = {
        source, label: labelFor(element, source), defaultIcon: iconFor(element, source),
        hideOriginal: element.getAttribute("data-quickbar-hide-source-default") === "true",
        locator: { rootId, id, containerId, label: locatorLabel },
      };
      result.push({ descriptor, element });
    }
  }
  return result;
}

function describeCandidates(doc, source) {
  return withUnmaskedSourceVisibility(doc, () => describeUnmaskedCandidates(doc, source));
}

export function scanExternalEntries(doc, source) {
  const records = describeCandidates(doc, source);
  const counts = new Map();
  records.forEach(({ descriptor }) => {
    const id = entryIdentity(descriptor);
    counts.set(id, (counts.get(id) || 0) + 1);
  });
  return records.filter(({ descriptor }) => counts.get(entryIdentity(descriptor)) === 1).map(({ descriptor }) => descriptor);
}

export function resolveExternalEntry(doc, entry) {
  if (!isEntryDescriptor(entry)) return null;
  const matches = describeCandidates(doc, entry.source).filter(({ descriptor }) => entryIdentity(descriptor) === entryIdentity(entry));
  return matches.length === 1 ? matches[0].element : null;
}

export function isEntryAlreadyAdded(settings, candidate) {
  return isEntryDescriptor(candidate) && getExternalEntries(settings, candidate.source).some(entry => entryIdentity(entry) === entryIdentity(candidate));
}

export function addExternalEntries(settings, candidates) {
  const state = getExternalEntrySettings(settings);
  const hideOriginalByDefault = getOriginalEntryVisibilityDefault(settings);
  if (!Array.isArray(settings.buttonOrder)) settings.buttonOrder = [];
  if (!settings.buttons) settings.buttons = {};
  if (!settings.shortcuts) settings.shortcuts = {};
  const added = [];
  if (!Array.isArray(candidates)) return added;
  const keys = new Set([...state.wand, ...state.panel].map(entry => entry?.key));
  for (const candidate of candidates) {
    if (!isEntryDescriptor(candidate) || isEntryAlreadyAdded(settings, candidate)) continue;
    const entry = { ...candidate, locator: copyLocator(candidate.locator), key: createEntryKey("external", candidate.source, keys), icon: "" };
    if (!isExternalEntry(entry)) continue;
    entry.defaultIcon = normalizeEntryIcon(entry.defaultIcon) || EXTERNAL_ENTRY_SOURCES[entry.source].icon;
    entry.hideOriginal = hideOriginalByDefault;
    state[entry.source].push(entry);
    settings.buttonOrder.push(entry.key);
    settings.buttons[entry.key] = true;
    settings.shortcuts[entry.key] = "";
    const identity = entryIdentity(entry);
    state.hiddenOnly[entry.source] = state.hiddenOnly[entry.source]
      .filter(item => !isEntryDescriptor(item, entry.source) || entryIdentity(item) !== identity);
    added.push(entry);
  }
  return added;
}

export function removeExternalEntry(settings, key) {
  const entry = findExternalEntry(settings, key);
  if (!entry) return false;
  const state = getExternalEntrySettings(settings);
  state[entry.source] = state[entry.source].filter(item => item?.key !== key);
  // Do not revive a stale hidden-only rule when removing its shortcut.
  const identity = entryIdentity(entry);
  state.hiddenOnly[entry.source] = state.hiddenOnly[entry.source]
    .filter(item => !isEntryDescriptor(item, entry.source) || entryIdentity(item) !== identity);
  const without = list => Array.isArray(list) ? list.filter(item => item !== key) : list;
  settings.buttonOrder = without(settings.buttonOrder);
  delete settings.buttons?.[key];
  delete settings.shortcuts?.[key];
  (settings.folders || []).forEach(folder => { folder.buttons = without(folder.buttons); });
  Object.keys(settings.charButtons || {}).forEach(char => { settings.charButtons[char] = without(settings.charButtons[char]); });
  if (settings.floatingPanel) {
    settings.floatingPanel.buttons = without(settings.floatingPanel.buttons);
    (settings.floatingPanel.panelProfiles || []).forEach(profile => { profile.buttons = without(profile.buttons); });
  }
  return true;
}

export async function activateExternalEntry(doc, entry, { openPanelHost, afterLayout, onPanelOpened } = {}) {
  let target = resolveExternalEntry(doc, entry);
  if (!target) return false;
  if (entry.source === "wand") {
    target.click();
    return true;
  }
  if (!openPanelHost || await openPanelHost() === false) return false;
  // Opening the host may cause the plugin to re-render its settings.
  target = resolveExternalEntry(doc, entry);
  if (!target) return false;
  const content = [...target.closest(".inline-drawer").children].find(node => node.matches(".inline-drawer-content"));
  if (!content) return false;
  if (content.hidden || doc.defaultView?.getComputedStyle(content).display === "none") target.click();
  // Reveal before scrolling; the click may have rebuilt the source UI.
  const openingTarget = resolveExternalEntry(doc, entry);
  const openingContent = openingTarget && [...openingTarget.closest(".inline-drawer").children]
    .find(node => node.matches(".inline-drawer-content"));
  if (openingContent && !openingContent.hidden && doc.defaultView?.getComputedStyle(openingContent).display !== "none") onPanelOpened?.(entry);
  if (afterLayout) await afterLayout();
  target = resolveExternalEntry(doc, entry);
  if (!target) return false;
  const currentContent = [...target.closest(".inline-drawer").children].find(node => node.matches(".inline-drawer-content"));
  if (!currentContent || currentContent.hidden || doc.defaultView?.getComputedStyle(currentContent).display === "none") return false;
  // Confirm again after layout in case expansion was asynchronous or rebuilt UI.
  onPanelOpened?.(entry);
  target.scrollIntoView?.({ behavior: "smooth", block: "nearest", inline: "nearest" });
  return true;
}

// Script-owned buttons remain runtime-only and outside saved layouts.
export function createScriptButtonRegistry({ isAvailable = () => true, onChange = () => {}, onError = () => {} } = {}) {
  const entries = new Map();
  const running = new Set();
  const notify = () => { try { onChange(); } catch (error) { onError(error); } };
  function isActive(id) {
    const entry = entries.get(id);
    if (!entry) return false;
    try { return !!isAvailable(entry); } catch { return false; }
  }
  function registerExternalButton(descriptor) {
    if (!descriptor || typeof descriptor.id !== "string" || !/^[a-z][a-z0-9_-]{0,63}$/.test(descriptor.id)
      || typeof descriptor.label !== "string" || !descriptor.label.trim() || typeof descriptor.action !== "function"
      || (descriptor.placement !== undefined && !["toolbar", "floating"].includes(descriptor.placement))) {
      throw new TypeError("Invalid QuickBar script button descriptor");
    }
    const entry = Object.freeze({
      id: descriptor.id, key: `script_${descriptor.id}`, label: descriptor.label.trim().slice(0, 160),
      icon: normalizeEntryIcon(descriptor.icon) || "fa-solid fa-plug",
      placement: descriptor.placement || "toolbar", action: descriptor.action,
    });
    entries.set(entry.id, entry);
    const handle = Object.freeze({
      id: entry.id, key: entry.key,
      isActive: () => entries.get(entry.id) === entry && isActive(entry.id),
      unregister() {
        // A stale script's cleanup must not remove its replacement's callback.
        if (entries.get(entry.id) !== entry) return;
        entries.delete(entry.id); notify();
      },
    });
    notify();
    return handle;
  }
  function unregisterExternalButton(id) {
    if (entries.delete(id)) notify();
  }
  async function activate(key) {
    const entry = get(key);
    if (!entry || !isActive(entry.id) || running.has(key)) return false;
    running.add(key);
    try { await entry.action(); return true; }
    catch (error) { try { onError(error); } catch {} return false; }
    finally { running.delete(key); }
  }
  function get(key) {
    if (typeof key !== "string" || !key.startsWith("script_")) return null;
    return entries.get(key.slice(7)) || null;
  }
  function list(placement) {
    return [...entries.values()].filter(entry => (!placement || entry.placement === placement) && isActive(entry.id));
  }
  function clear() { entries.clear(); notify(); }
  return Object.freeze({ registerExternalButton, unregisterExternalButton, get, list, activate, clear });
}

// Shortcuts require a reachable replacement; hidden-only rules do not.
export function createSourceVisibilityController({ doc = globalThis.document, getSettings, getReachableKeys, onChange = () => {}, onError = () => {} }) {
  const win = doc.defaultView;
  let started = false, destroyed = false, syncing = false, timer = null, observer = null, style = null;
  let owned = new Set(), openedPanels = new Set();
  const report = error => { try { onError(error); } catch {} };
  const notify = () => { try { onChange(); } catch (error) { report(error); } };
  function restore() {
    let changed = owned.size > 0;
    for (const node of owned) {
      if (node.getAttribute(SOURCE_HIDDEN_ATTRIBUTE) === "true") node.removeAttribute(SOURCE_HIDDEN_ATTRIBUTE);
    }
    owned.clear(); openedPanels.clear();
    return changed;
  }
  function ensureStyle() {
    style = doc.getElementById(SOURCE_VISIBILITY_STYLE_ID);
    if (style && style.tagName !== "STYLE") { style = null; throw new Error("QuickBar source visibility style ID is occupied"); }
    if (!style) {
      style = doc.createElement("style"); style.id = SOURCE_VISIBILITY_STYLE_ID;
      (doc.head || doc.documentElement).append(style);
    }
    if (style.textContent !== SOURCE_VISIBILITY_CSS) style.textContent = SOURCE_VISIBILITY_CSS;
  }
  function removeStyle() {
    const node = style || doc.getElementById(SOURCE_VISIBILITY_STYLE_ID);
    if (node?.tagName === "STYLE") node.remove();
    style = null;
  }
  function isPanelOpen(header) {
    const host = header?.closest("#rm_extensions_block");
    if (!host?.isConnected || !host.classList.contains("openDrawer") || host.hidden
      || win.getComputedStyle(host).display === "none") return false;
    const drawer = header.closest(".inline-drawer");
    const content = [...drawer.children].find(node => node.matches(".inline-drawer-content"));
    // The chevron closes before the native slide animation finishes.
    return !!content && !content.hidden && win.getComputedStyle(content).display !== "none"
      && !header.querySelector(".inline-drawer-icon")?.classList.contains("down");
  }
  function revealPanel(entry) {
    if (!started || destroyed || entry?.source !== "panel") return;
    openedPanels.add(entry.key);
    // Apply before activation scrolls to the header, not on the next observer tick.
    sync();
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
        const next = new Set(), ids = new Set(), activePanels = new Set(), revealedHeaders = new Set();
        const entries = getExternalEntries(settings);
        for (const entry of entries) {
          if (entry.source !== "panel" || !openedPanels.has(entry.key) || settings.buttons?.[entry.key] === false) continue;
          const node = resolveExternalEntry(doc, entry);
          if (!isPanelOpen(node)) continue;
          activePanels.add(entry.key); revealedHeaders.add(node);
        }
        // Native reopening must not resume an expired QuickBar reveal session.
        openedPanels = activePanels;
        const collect = (entry, allowReveal = false) => {
          const node = resolveExternalEntry(doc, entry);
          if (!node?.isConnected) return;
          if (!allowReveal || !revealedHeaders.has(node)) next.add(node);
          // Revealing a panel header must not reveal its alternate entries.
          if (node.id) ids.add(node.id);
        };
        for (const entry of getHiddenOnlyEntries(settings)) collect(entry);
        const shortcuts = entries
          .filter(entry => entry.hideOriginal === true && settings.buttons?.[entry.key] !== false);
        // Hidden-only use must work without a shortcut layout provider at all.
        const reachable = new Set(shortcuts.length && typeof getReachableKeys === "function" ? getReachableKeys() || [] : []);
        for (const entry of shortcuts) if (reachable.has(entry.key)) collect(entry, true);
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
  return Object.freeze({ start, schedule, sync, revealPanel, destroy });
}
