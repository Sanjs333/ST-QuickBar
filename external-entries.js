// Shortcuts to same-document entry points. Never move/clone source UI or
// inspect handlers, navbar drawers, or iframe/sandbox contents.
export const EXTERNAL_ENTRY_SOURCES = Object.freeze({
  wand: { label: "魔法棒入口", icon: "fa-solid fa-wand-magic-sparkles", roots: ["extensionsMenu"] },
  panel: { label: "扩展面板入口", icon: "fa-solid fa-puzzle-piece", roots: ["extensions_settings", "extensions_settings2"] },
});
// Only our stylesheet is temporarily disabled during synchronous source
// discovery. This ignores QuickBar's masking but respects the source plugin's
// own hidden/disabled/CSS state, without mutating or moving its original node.
export const SOURCE_VISIBILITY_STYLE_ID = "st-quickbar-source-visibility";
export const SOURCE_HIDDEN_ATTRIBUTE = "data-quickbar-source-hidden";
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
  // A shortcut always wins on load, even when its eye is OFF or its layout
  // is unavailable. Stale hidden-only data must never force that source off.
  const shortcuts = new Set(getExternalEntries(settings).map(entryIdentity));
  return uniqueEntries(state.hiddenOnly, source, isHiddenOnlyEntry).filter(entry => !shortcuts.has(entryIdentity(entry)));
}

export function isEntryHiddenOnly(settings, candidate) {
  return isEntryDescriptor(candidate) && getHiddenOnlyEntries(settings, candidate.source)
    .some(entry => entryIdentity(entry) === entryIdentity(candidate));
}

// Hidden-only rules have no button, shortcut, folder or floating placement.
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

// The unified switch is a batch operation. Per-entry eyes remain independent;
// new entries inherit the last unified choice, which defaults to OFF.
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
  // Collapsed menus/drawers are normal: ignore the root and its ancestors,
  // but do not bypass an entry deliberately hidden or disabled inside it.
  for (let node = element; node && node !== root; node = node.parentElement) {
    if (node.hidden || node.getAttribute("aria-disabled") === "true" || node.disabled || node.classList.contains("disabled")) return false;
    const css = node.ownerDocument.defaultView?.getComputedStyle(node);
    if (css?.display === "none") return false;
  }
  // visibility is inherited, so compare against the hidden host rather than
  // rejecting every entry in a theme that hides the collapsed menu that way.
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
  // Removing a shortcut must not revive a stale hidden-only rule from a
  // cross-mode duplicate loaded earlier.
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

export async function activateExternalEntry(doc, entry, { openPanelHost, afterLayout } = {}) {
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
  if (afterLayout) await afterLayout();
  target = resolveExternalEntry(doc, entry);
  if (!target) return false;
  const currentContent = [...target.closest(".inline-drawer").children].find(node => node.matches(".inline-drawer-content"));
  if (!currentContent || currentContent.hidden || doc.defaultView?.getComputedStyle(currentContent).display === "none") return false;
  target.scrollIntoView?.({ behavior: "smooth", block: "nearest", inline: "nearest" });
  return true;
}
