

const HIGH_SURROGATE_START = 0xd800;
const HIGH_SURROGATE_END = 0xdbff;
const LOW_SURROGATE_START = 0xdc00;
const LOW_SURROGATE_END = 0xdfff;

function isHighSurrogate(code) {
  return code >= HIGH_SURROGATE_START && code <= HIGH_SURROGATE_END;
}

function isLowSurrogate(code) {
  return code >= LOW_SURROGATE_START && code <= LOW_SURROGATE_END;
}

function splitsSurrogatePair(text, offset) {
  return offset > 0 && offset < text.length &&
    isHighSurrogate(text.charCodeAt(offset - 1)) && isLowSurrogate(text.charCodeAt(offset));
}

export function minimalTextChange(before, after) {
  before = String(before);
  after = String(after);
  if (before === after) return { from: 0, to: 0, insert: "" };

  const beforeLen = before.length;
  const afterLen = after.length;
  const commonMax = Math.min(beforeLen, afterLen);

  let start = 0;
  while (start < commonMax && before.charCodeAt(start) === after.charCodeAt(start)) {
    start++;
  }
  if (splitsSurrogatePair(before, start) || splitsSurrogatePair(after, start)) {
    start--;
  }

  let endBefore = beforeLen;
  let endAfter = afterLen;
  while (
    endBefore > start &&
    endAfter > start &&
    before.charCodeAt(endBefore - 1) === after.charCodeAt(endAfter - 1)
  ) {
    endBefore--;
    endAfter--;
  }
  if (splitsSurrogatePair(before, endBefore) || splitsSurrogatePair(after, endAfter)) {
    endBefore++;
    endAfter++;
  }

  return { from: start, to: endBefore, insert: after.slice(start, endAfter) };
}

function hasClass(el, name) {
  return !!(el && el.classList && el.classList.contains(name));
}

function validateView(view, content) {
  try {
    if (
      view &&
      !view.destroyed &&
      content &&
      view.contentDOM === content &&
      view.state &&
      view.state.doc &&
      typeof view.dispatch === "function"
    ) {
      return view;
    }
  } catch (e) {
  }
  return null;
}

function resolveViewFromContent(content) {
  if (!content) return null;
  for (const getView of [
    () => content.cmView && content.cmView.view,
    () => content.cmView && content.cmView.rootView && content.cmView.rootView.view,
    () => content.cmTile && content.cmTile.root && content.cmTile.root.view,
  ]) {
    try {
      const view = validateView(getView(), content);
      if (view) return view;
    } catch (e) {
    }
  }
  return null;
}

function resolveViewFromCmTree(el) {
  let node = el;
  while (node) {
    try {
      if (hasClass(node, "cm-content")) {
        return resolveViewFromContent(node);
      }
      if (isCmHost(node)) return resolveViewFromHost(node);
    } catch (e) {
      return null;
    }
    node = node.parentElement;
  }
  return null;
}

const CM_HOST_CLASSES = [
  "cm-editor",
  "codemirror-host",
  "bai-bai-toolkit-description-codemirror-editor",
  "bai-bai-toolkit-custom-css-codemirror-editor",
];
const CM_SOURCE_CLASSES = [
  "bai-bai-toolkit-description-source-hidden",
  "bai-bai-toolkit-custom-css-source-hidden",
];

function isNativeControl(el) {
  return !!el && (el.tagName === "TEXTAREA" || el.tagName === "INPUT");
}

function isCmHost(el) {
  return CM_HOST_CLASSES.some((name) => hasClass(el, name));
}

function resolveViewFromHost(host) {
  if (!host || !host.querySelectorAll) return null;
  const editors = hasClass(host, "cm-editor") ? [host] : host.querySelectorAll(".cm-editor");
  if (editors.length !== 1) return null;
  const content = editors[0].querySelector(".cm-content");
  const view = resolveViewFromContent(content);
  return view && view.dom === editors[0] ? view : null;
}

function findAdjacentCmEditor(el) {
  return isNativeControl(el) && isCmHost(el.nextElementSibling) ? el.nextElementSibling : null;
}

function findAdjacentTextarea(editor) {
  if (!editor) return null;
  const host = isCmHost(editor.parentElement) ? editor.parentElement : editor;
  const backing = host.previousElementSibling;
  return isNativeControl(backing) && findAdjacentCmEditor(backing) === host &&
    resolveViewFromHost(host)?.dom === editor ? backing : null;
}

export function resolveCodeMirrorForSource(source) {
  const el = normalizeElement(source);
  if (!el) return null;

  const inTree = resolveViewFromCmTree(el);
  if (inTree) return inTree;

  if (el.tagName === "TEXTAREA" || el.tagName === "INPUT") {
    const host = findAdjacentCmEditor(el);
    if (host) {
      return resolveViewFromHost(host);
    }
  }
  return null;
}

function normalizeElement(source) {
  if (!source) return null;
  if (source.nodeType === 3) return source.parentElement || null;
  return source;
}

function elementConnected(el) {
  if (!el) return false;
  if (el.isConnected === true) return true;
  if (el.isConnected === false) return false;
  const doc = el.ownerDocument;
  if (doc && typeof doc.contains === "function") return doc.contains(el);
  return true;
}

function isContentEditableElement(el) {
  if (!el) return false;
  if (el.isContentEditable === true) return true;
  const attr = el.getAttribute ? el.getAttribute("contenteditable") : null;
  return attr === "" || attr === "true" || attr === "plaintext-only";
}

function dispatchNativeInput(el) {
  if (!el || typeof el.dispatchEvent !== "function") return;
  const doc = el.ownerDocument;
  const win = doc && doc.defaultView;
  const InputCtor = win ? win.InputEvent : typeof InputEvent !== "undefined" ? InputEvent : null;
  const EventCtor = win ? win.Event : typeof Event !== "undefined" ? Event : null;
  let event;
  try {
    event = new InputCtor("input", {
      bubbles: true, composed: true, inputType: "insertReplacementText", data: null,
    });
  } catch (e) {
    event = new EventCtor("input", { bubbles: true, composed: true });
  }
  el.dispatchEvent(event);
}

function analyzeSource(source) {
  const el = normalizeElement(source);
  if (!el) return { kind: "unsupported", el: null, backing: null, view: null };

  const view = resolveCodeMirrorForSource(source);
  if (view) {
    const backing =
      el.tagName === "TEXTAREA" || el.tagName === "INPUT"
        ? el
        : findAdjacentTextarea(view.dom);
    return { kind: "codemirror", el, backing, view };
  }

  const cmHost = (el.closest && el.closest(CM_HOST_CLASSES.map((name) => `.${name}`).join(","))) ||
    findAdjacentCmEditor(el);
  if (cmHost || CM_SOURCE_CLASSES.some((name) => hasClass(el, name))) {
    const backing = el.tagName === "TEXTAREA" || el.tagName === "INPUT" ? el : null;
    return { kind: "unsupported", el, backing, view: null, host: cmHost };
  }

  if (el.tagName === "TEXTAREA") return { kind: "textarea", el, backing: el, view: null };
  if (el.tagName === "INPUT") return { kind: "input", el, backing: el, view: null };
  if (isContentEditableElement(el)) {
    return { kind: "contenteditable", el, backing: el, view: null };
  }
  return { kind: "unsupported", el, backing: null, view: null };
}

function readValue(info) {
  if (info.kind === "codemirror" && info.view) {
    return info.view.state.doc.toString();
  }
  const el = info.backing || info.el;
  if (!el) return "";
  if (info.kind === "contenteditable") return el.textContent != null ? el.textContent : "";
  return el.value != null ? el.value : "";
}

function isReadOnly(info) {
  if (info.kind === "codemirror" && info.view) {
    try {
      if (info.view.state && info.view.state.readOnly) return true;
    } catch (e) {
    }
    const content = info.view.contentDOM;
    if (
      content &&
      content.getAttribute &&
      content.getAttribute("contenteditable") === "false"
    ) {
      return true;
    }
  }
  const el = info.backing || info.el;
  if (el) {
    if (el.disabled || (el.matches && el.matches(":disabled"))) return true;
    if (el.readOnly) return true;
    if (el.getAttribute && el.getAttribute("contenteditable") === "false") return true;
    if (info.kind === "contenteditable" && el.isContentEditable === false) return true;
  }
  return false;
}

function adapterConnected(source, info) {
  const el = normalizeElement(source);
  if (!elementConnected(el)) return false;
  if (info.kind === "codemirror" && info.view) {
    if (info.view.destroyed) return false;
    if (info.view.contentDOM && !elementConnected(info.view.contentDOM)) return false;
    if (info.backing && !elementConnected(info.backing)) return false;
  }
  return true;
}

function mapOffset(pos, change, newLength, isEnd = false) {
  const delta = change.insert.length - (change.to - change.from);
  let next;
  if (pos > change.to) next = pos + delta;
  else if (pos > change.from) next = change.from + (isEnd ? change.insert.length : 0);
  else next = pos;
  return Math.max(0, Math.min(newLength, next));
}

function writeNative(info, after, change, options) {
  const el = info.backing;
  const scrollTop = el.scrollTop;
  const scrollLeft = el.scrollLeft;
  const impose = options.selection;

  const prevStart = el.selectionStart;
  const prevEnd = el.selectionEnd;
  const direction = el.selectionDirection;
  let usedRange = false;
  if (typeof el.setRangeText === "function") {
    try {
      el.setRangeText(change.insert, change.from, change.to, "preserve");
      usedRange = true;
    } catch (e) {
      if (e.name !== "InvalidStateError") throw e;
    }
  }
  if (!usedRange) el.value = after;
  if (typeof el.setSelectionRange === "function") {
    try {
      if (impose) el.setSelectionRange(impose.from, impose.to);
      else if (typeof prevStart === "number") {
        el.setSelectionRange(
          usedRange ? el.selectionStart : mapOffset(prevStart, change, el.value.length),
          usedRange ? el.selectionEnd : mapOffset(prevEnd, change, el.value.length, true),
          direction
        );
      }
    } catch (e) {
    }
  }
  try {
    dispatchNativeInput(el);
  } finally {
    if (scrollTop || scrollLeft || impose || el.ownerDocument.activeElement === el) {
      el.scrollTop = scrollTop;
      el.scrollLeft = scrollLeft;
    }
  }
}

function writeContentEditable(info, after) {
  const el = info.backing;
  const scrollTop = el.scrollTop;
  const scrollLeft = el.scrollLeft;
  el.textContent = after;
  el.scrollTop = scrollTop;
  el.scrollLeft = scrollLeft;
  dispatchNativeInput(el);
}

function writeCodeMirror(info, before, change, options) {
  const view = info.view;
  const spec = { changes: { from: change.from, to: change.to, insert: change.insert } };
  if (options.userEvent) spec.userEvent = options.userEvent;
  if (options.addToHistory === false) {
    const Transaction = view.state.update({ filter: false }).constructor;
    spec.annotations = Transaction.addToHistory.of(false);
  }
  if (options.selection) {
    spec.selection = { anchor: options.selection.from, head: options.selection.to };
  }

  notifyCodeMirrorChange(info, before, () => view.dispatch(spec));
}

function notifyCodeMirrorChange(info, before, change) {
  const view = info.view;
  const backing = info.backing;
  let emittedValue;
  const onInput = (event) => {
    if (event.target === backing) emittedValue = backing.value;
  };
  const jquery = backing?.ownerDocument?.defaultView?.jQuery;
  const jqBacking = typeof jquery === "function" ? jquery(backing) : null;
  const observeJquery = jqBacking && typeof jqBacking.on === "function" && typeof jqBacking.off === "function";
  try {
    if (backing) backing.addEventListener("input", onInput, true);
    if (observeJquery) jqBacking.on("input", onInput);
    change();
  } finally {
    if (backing) backing.removeEventListener("input", onInput, true);
    if (observeJquery) jqBacking.off("input", onInput);
  }

  const actual = view.state.doc.toString();
  if (actual === before) return;
  if (backing && elementConnected(backing) && !view.destroyed &&
      (backing.value !== actual || emittedValue !== actual)) {
    if (backing.value !== actual) backing.value = actual;
    dispatchNativeInput(backing);
  }
}

function performHistory(source, direction) {
  const info = analyzeSource(source);
  if (info.kind !== "codemirror" || !adapterConnected(source, info) || isReadOnly(info) ||
      info.view.composing || info.view.compositionStarted) return { changed: false, value: readValue(info) };
  const { view } = info;
  const before = readValue(info);
  const win = view.contentDOM.ownerDocument.defaultView;
  const mac = /Mac|iPhone|iPad|iPod/.test(win.navigator.platform);
  const redo = direction === "redo";
  const key = redo && !mac ? "y" : "z";
  const event = new win.KeyboardEvent("keydown", {
    key, code: key === "y" ? "KeyY" : "KeyZ", keyCode: key === "y" ? 89 : 90,
    which: key === "y" ? 89 : 90, ctrlKey: !mac, metaKey: mac,
    shiftKey: mac && redo, bubbles: true, cancelable: true,
  });
  let reachedEditor = false;
  const markReached = () => { reachedEditor = true; };
  const stop = event => event.stopPropagation();
  notifyCodeMirrorChange(info, before, () => {
    view.contentDOM.addEventListener("keydown", markReached);
    view.dom.addEventListener("keydown", stop);
    try {
      view.contentDOM.dispatchEvent(event);
    } finally {
      view.contentDOM.removeEventListener("keydown", markReached);
      view.dom.removeEventListener("keydown", stop);
    }
  });
  const value = readValue(info);
  return { changed: value !== before, value, unhandled: reachedEditor && !event.defaultPrevented };
}

const ERR = "[ST-QuickBar floating editor]";

function performWrite(source, text, options) {
  const info = analyzeSource(source);

  if (!adapterConnected(source, info)) {
    throw new Error(`${ERR} source is disconnected from the document`);
  }
  if (info.kind === "unsupported") {
    throw new Error(
      `${ERR} source is backed by an unsupported editor; refusing to overwrite its hidden value`
    );
  }
  if (isReadOnly(info)) {
    throw new Error(`${ERR} source is read-only`);
  }

  if (info.kind === "codemirror" && (info.view.composing || info.view.compositionStarted)) {
    throw new Error(`${ERR} source is composing; retry after composition ends`);
  }

  const current = readValue(info);
  const change = minimalTextChange(current, text);
  if (change.from === change.to && change.insert === "") {
    return { changed: false, value: current };
  }

  if (info.kind === "codemirror") writeCodeMirror(info, current, change, options);
  else if (info.kind === "contenteditable") writeContentEditable(info, text);
  else writeNative(info, text, change, options);

  const value = readValue(info);
  return { changed: value !== current, value };
}

export function createFloatingEditorAdapter(source) {
  return {
    source,
    get kind() {
      return analyzeSource(source).kind;
    },
    read() {
      return readValue(analyzeSource(source));
    },
    getRevision() {
      const info = analyzeSource(source);
      if (info.kind === "codemirror" && info.view) return info.view.state.doc;
      return readValue(info);
    },
    getSelection() {
      const info = analyzeSource(source);
      if (info.kind === "codemirror" && info.view) {
        const main = info.view.state.selection.main;
        return { from: main.from, to: main.to };
      }
      const el = info.backing;
      if (el && typeof el.selectionStart === "number") {
        return { from: el.selectionStart, to: el.selectionEnd };
      }
      return null;
    },
    isReadOnly() {
      return isReadOnly(analyzeSource(source));
    },
    isConnected() {
      return adapterConnected(source, analyzeSource(source));
    },
    history(direction) {
      if (direction !== "undo" && direction !== "redo") throw new Error("Unknown history direction");
      return performHistory(source, direction);
    },
    write(text, options = {}) {
      return performWrite(source, String(text), options || {});
    },
  };
}

export function createFloatingEditorHistory(initial, { maxEntries = 50, maxChars = 2_000_000 } = {}) {
  let current = String(initial), entries = [], pointer = 0, lastAt = 0;
  let baselineAt = Date.now();
  const selection = value => value ? { from: value.from, to: value.to } : null;
  function apply(text, entry, undo) {
    const removed = undo ? entry.insert : entry.remove;
    const inserted = undo ? entry.remove : entry.insert;
    if (text.slice(entry.from, entry.from + removed.length) !== removed) return null;
    return text.slice(0, entry.from) + inserted + text.slice(entry.from + removed.length);
  }
  function trim() {
    let size = entries.reduce((total, e) => total + e.remove.length + e.insert.length, 0);
    while (entries.length && (entries.length > maxEntries || size > maxChars)) {
      const old = entries.shift(); size -= old.remove.length + old.insert.length; pointer = Math.max(0, pointer - 1);
      baselineAt = old.at;
    }
  }
  function record(value, { beforeSelection, afterSelection, group = false, at = Date.now() } = {}) {
    value = String(value);
    if (value === current) return false;
    const diff = minimalTextChange(current, value);
    const entry = { from: diff.from, remove: current.slice(diff.from, diff.to), insert: diff.insert,
      beforeSelection: selection(beforeSelection), afterSelection: selection(afterSelection), group, at };
    entries.length = pointer;
    const previous = entries[pointer - 1];
    let merged = false;
    if (group && previous?.group && at - lastAt < 650) {
      if (!entry.remove && !previous.remove && entry.from === previous.from + previous.insert.length) {
        previous.insert += entry.insert; merged = true;
      } else if (!entry.insert && !previous.insert && entry.from + entry.remove.length === previous.from) {
        previous.from = entry.from; previous.remove = entry.remove + previous.remove; merged = true;
      } else if (!entry.insert && !previous.insert && entry.from === previous.from) {
        previous.remove += entry.remove; merged = true;
      }
      if (merged) { previous.afterSelection = entry.afterSelection; previous.at = at; }
    }
    if (!merged) { entries.push(entry); pointer++; }
    current = value; lastAt = group ? at : 0; trim(); return true;
  }
  function peek(direction) {
    const undo = direction === "undo";
    const entry = entries[undo ? pointer - 1 : pointer];
    if (!entry) return null;
    const value = apply(current, entry, undo);
    return value === null ? null : { value, selection: selection(undo ? entry.beforeSelection : entry.afterSelection) };
  }
  function accept(value, direction) {
    value = String(value);
    if (value === current) return false;
    const directions = direction ? [direction] : ["undo", "redo"];
    for (const dir of directions) {
      let candidate = current;
      if (dir === "undo") {
        for (let i = pointer - 1; i >= 0; i--) {
          candidate = apply(candidate, entries[i], true);
          if (candidate === null) break;
          if (candidate === value) { pointer = i; current = value; lastAt = 0; return true; }
        }
      } else {
        for (let i = pointer; i < entries.length; i++) {
          candidate = apply(candidate, entries[i], false);
          if (candidate === null) break;
          if (candidate === value) { pointer = i + 1; current = value; lastAt = 0; return true; }
        }
      }
    }
    if (direction === "undo") {
      const before = current;
      entries = []; pointer = 0; current = value; baselineAt = Date.now();
      record(before); pointer = 0; current = value; lastAt = 0; return true;
    }
    return record(value);
  }
  function block(direction) {
    if (direction === "undo") { entries.splice(0, pointer); pointer = 0; }
    else entries.length = pointer;
  }
  function textAt(index) {
    index = Math.max(0, Math.min(entries.length, Math.trunc(index)));
    let text = current;
    if (index < pointer) {
      for (let i = pointer - 1; i >= index; i--) { text = apply(text, entries[i], true); if (text === null) return null; }
    } else {
      for (let i = pointer; i < index; i++) { text = apply(text, entries[i], false); if (text === null) return null; }
    }
    return text;
  }
  function list() {
    const rows = [{ index: 0, at: baselineAt, insert: 0, remove: 0, from: null }];
    for (let i = 0; i < entries.length; i++) {
      const e = entries[i];
      rows.push({ index: i + 1, at: e.at, insert: e.insert.length, remove: e.remove.length, from: e.from });
    }
    return { entries: rows, position: pointer };
  }
  function changeAt(index) {
    index = Math.trunc(index);
    if (!Number.isFinite(index) || index <= 0 || index > entries.length) return null;
    const e = entries[index - 1];
    return { from: e.from, remove: e.remove, insert: e.insert };
  }
  return { record, accept, peek, block, textAt, list, changeAt,
    get canUndo() { return pointer > 0; }, get canRedo() { return pointer < entries.length; },
    get position() { return pointer; },
    get value() { return current; }, get length() { return entries.length; },
    get retainedChars() { return entries.reduce((sum, e) => sum + e.remove.length + e.insert.length, 0); } };
}

export function createFloatingEditorTimeline(initial, {
  delay = 3000, maxWait = 30000, clock = globalThis, onCommit,
  Diff = globalThis.diff_match_patch, ...limits
} = {}) {
  const history = createFloatingEditorHistory(initial, limits);
  const summaries = [];
  let pending = null, idleTimer = null, maxTimer = null, disposed = false, revision = 0, trimmed = false;
  function cancel() {
    if (idleTimer !== null) clock.clearTimeout(idleTimer);
    if (maxTimer !== null) clock.clearTimeout(maxTimer);
    idleTimer = maxTimer = null;
  }
  function flush() {
    cancel();
    const next = pending;
    pending = null;
    if (disposed || !next || !history.record(next.value, { at: next.at })) return false;
    const regions = floatingEditorChangeRegions(history.changeAt(history.position), Diff);
    summaries.push(regions.reduce((sum, region) => ({
      insert: sum.insert + region.insert.length, remove: sum.remove + region.remove.length,
    }), { insert: 0, remove: 0 }));
    if (summaries.length > history.length) {
      summaries.splice(0, summaries.length - history.length);
      trimmed = true;
    }
    revision++;
    onCommit?.();
    return true;
  }
  function queue(value, { at = Date.now() } = {}) {
    if (disposed) return;
    value = String(value);
    if (value === history.value) { cancel(); pending = null; return; }
    pending = { value, at };
    if (idleTimer !== null) clock.clearTimeout(idleTimer);
    idleTimer = clock.setTimeout(flush, delay);
    if (maxTimer === null) maxTimer = clock.setTimeout(flush, maxWait);
  }
  return {
    queue, flush,
    dispose() { cancel(); pending = null; disposed = true; },
    list() {
      const snapshot = history.list();
      snapshot.entries = snapshot.entries.map(row => row.index
        ? { ...row, ...summaries[row.index - 1] } : { ...row, trimmed });
      return { ...snapshot, revision };
    },
    textAt: index => history.textAt(index),
    changeAt: index => history.changeAt(index),
    get value() { return history.value; },
  };
}

export function floatingEditorChangeRegions(change, Diff = globalThis.diff_match_patch) {
  if (!change || !Number.isInteger(change.from) || change.from < 0 ||
      typeof change.remove !== 'string' || typeof change.insert !== 'string') return [];
  const { from, remove, insert } = change;
  if (remove === insert) return [];
  const fallback = () => [{ from, remove, insert }];
  if (!remove || !insert || remove.length + insert.length > 200000 || typeof Diff !== 'function') return fallback();
  try {
    const differ = new Diff();
    differ.Diff_Timeout = 0.025;
    const parts = differ.diff_main(remove, insert);
    if (parts.length > 4000) return fallback();
    differ.diff_cleanupSemantic(parts);
    let oldPos = 0, newPos = 0, region = null;
    const ranges = [];
    for (const [op, text] of parts) {
      if (op === 0) {
        region = null;
        oldPos += text.length;
        newPos += text.length;
      } else {
        if (!region) { region = { oldFrom: oldPos, from: newPos, oldTo: oldPos, to: newPos }; ranges.push(region); }
        if (op === -1) oldPos += text.length;
        else newPos += text.length;
        region.oldTo = oldPos;
        region.to = newPos;
      }
    }
    const normalized = [];
    for (const range of ranges) {
      if (splitsSurrogatePair(remove, range.oldFrom) || splitsSurrogatePair(insert, range.from)) {
        range.oldFrom--; range.from--;
      }
      if (splitsSurrogatePair(remove, range.oldTo) || splitsSurrogatePair(insert, range.to)) {
        range.oldTo++; range.to++;
      }
      const previous = normalized[normalized.length - 1];
      if (previous && range.from <= previous.to) {
        previous.to = Math.max(previous.to, range.to);
        previous.oldTo = Math.max(previous.oldTo, range.oldTo);
      } else normalized.push(range);
    }
    return normalized.map(r => ({ from: from + r.from,
      remove: remove.slice(r.oldFrom, r.oldTo), insert: insert.slice(r.from, r.to) }));
  } catch { return fallback(); }
}

let nextWindowId = 0;
const MIN_WIDTH = 280;
const MIN_HEIGHT = 180;
const VIEWPORT_GAP = 8;
const MIN_LAYER = 10030;
const MAX_LAYER = 10032;
const layoutHubs = new WeakMap();

function registerLayoutPanel(document, panel) {
    let hub = layoutHubs.get(document);
    if (!hub) {
        const view = document.defaultView;
        const panels = new Set();
        const pending = new Set();
        const disposers = [];
        let frame = null;
        function schedule(panel) {
            if (!panels.has(panel)) return;
            pending.add(panel);
            if (frame !== null) return;
            frame = view.requestAnimationFrame(() => {
                frame = null;
                const batch = [...pending];
                pending.clear();
                for (const current of batch) if (panels.has(current)) current.layout();
            });
        }
        function scheduleAll() {
            for (const current of panels) schedule(current);
        }
        function flushGeometry() {
            for (const current of [...panels]) if (panels.has(current)) current.flushGeometry();
        }
        function onVisibilityChange() {
            if (document.hidden) flushGeometry();
        }
        function onScroll(event) {
            for (const current of panels) if (current.element.contains(event.target)) return;
            for (const current of panels) {
                if (event.target === document || event.target?.contains?.(current.element)) schedule(current);
            }
        }
        function listen(target, type, handler, options) {
            target.addEventListener(type, handler, options);
            disposers.push(() => target.removeEventListener(type, handler, options));
        }
        listen(view, 'resize', scheduleAll);
        listen(view, 'orientationchange', scheduleAll);
        listen(view, 'blur', flushGeometry);
        listen(document, 'visibilitychange', onVisibilityChange);
        listen(document, 'scroll', onScroll, true);
        if (view.visualViewport) {
            listen(view.visualViewport, 'resize', scheduleAll);
            listen(view.visualViewport, 'scroll', scheduleAll);
        }
        hub = {
            panels,
            schedule,
            unregister(panel) {
                panels.delete(panel);
                pending.delete(panel);
                if (!pending.size && frame !== null) {
                    view.cancelAnimationFrame(frame);
                    frame = null;
                }
                if (panels.size) return;
                for (const dispose of disposers) dispose();
                layoutHubs.delete(document);
            },
        };
        layoutHubs.set(document, hub);
    }
    hub.panels.add(panel);
    return {
        schedule: () => hub.schedule(panel),
        unregister: () => hub.unregister(panel),
    };
}
const SOURCE_STYLES = {
    'font-family': 'font-family',
    'font-size': 'font-size',
    'font-weight': 'font-weight',
    'font-style': 'font-style',
    'line-height': 'line-height',
    'letter-spacing': 'letter-spacing',
    'word-spacing': 'word-spacing',
    'text-align': 'text-align',
    'text-transform': 'text-transform',
    'text-shadow': 'text-shadow',
    'direction': 'direction',
    'tab-size': 'tab-size',
    'color': 'color',
    'background-color': 'background',
    'border-top-color': 'border',
    'caret-color': 'caret',
};
const SOURCE_ATTRIBUTES = ['spellcheck', 'autocapitalize', 'autocorrect', 'autocomplete', 'wrap', 'dir', 'lang'];

export function bindFloatingEditorInteractionBoundary(element) {
    const types = ['click', 'dblclick', 'auxclick', 'contextmenu', 'mousedown', 'mouseup',
        'pointerdown', 'pointerup', 'pointercancel', 'touchstart', 'touchend', 'touchcancel'];
    const stop = event => event.stopPropagation();
    for (const type of types) element.addEventListener(type, stop, { passive: true });
    return () => {
        for (const type of types) element.removeEventListener(type, stop);
    };
}

const clamp = (value, min, max) => Math.min(Math.max(value, min), Math.max(min, max));
const text = value => String(value ?? '');
const escapeHtml = value => text(value)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

export function createFloatingEditorWindow({
    document = globalThis.document,
    source,
    title = '悬浮编辑',
    value = '',
    onInput,
    onCompositionStart,
    onCompositionEnd,
    onClose,
    requestHistory,
    onHistoryOpen,
    previewHistory,
    changeHistory,
    revertHistory,
    canPreview = false,
    geometry = null,
    onGeometryChange,
} = {}) {
    const view = document?.defaultView;
    if (!view || !document.body) throw new Error('Floating editor requires a document with a body and window.');

    const id = `ih-floating-editor-${++nextWindowId}`;
    const disposers = [];
    let destroyed = false;
    let composing = false;
    let closing = false;
    let readOnly = null;
    let pinned = false;
    let collapsed = false;
    let layoutRegistration = null;
    let gesture = null;
    let host = null;
    let observer = null;
    let copiedAttributes = [];
    let historyOpen = false;
    let historySelected = null;
    let previewOpen = false;
    let baseTitle = '悬浮编辑';
    let historySignature = null;
    let lastPreviewIndex = null;
    let lastPreviewKey = null;
    let previewValueKey = null;
    let previewText = '', previewRegions = [], previewRegionIndex = -1;
    const preferred = { x: null, y: null, width: 640, height: 440 };
    const finite = value => typeof value === "number" && Number.isFinite(value);
    if (geometry && typeof geometry === "object") {
        for (const key of ["x", "y"]) if (finite(geometry[key])) preferred[key] = clamp(geometry[key], 0, 100000);
        if (finite(geometry.width)) preferred.width = clamp(geometry.width, MIN_WIDTH, 100000);
        if (finite(geometry.height)) preferred.height = clamp(geometry.height, MIN_HEIGHT, 100000);
    }
    let geometryTimer = 0;
    let lastGeometry = "";
    const box = { x: 0, y: 0, width: 640, height: 440 };

    const element = document.createElement('section');
    element.className = 'ih-floating-editor ih-floating-editor-window';
    disposers.push(bindFloatingEditorInteractionBoundary(element));
    element.setAttribute('role', 'dialog');
    element.setAttribute('aria-modal', 'false');
    element.setAttribute('aria-labelledby', `${id}-title`);
    element.tabIndex = -1;
    for (const [property, val] of Object.entries({ position: 'fixed', inset: 'auto', margin: '0', transform: 'none', translate: 'none' })) {
        element.style.setProperty(property, val, 'important');
    }

    const header = document.createElement('header');
    header.className = 'ih-floating-editor-header';
    header.tabIndex = 0;
    header.setAttribute('role', 'group');
    header.setAttribute('aria-label', '移动悬浮窗（方向键；Shift 加速）');
    const grip = document.createElement('i');
    grip.className = 'fa-solid fa-grip-vertical ih-floating-editor-grip';
    grip.setAttribute('aria-hidden', 'true');
    const heading = document.createElement('div');
    heading.className = 'ih-floating-editor-heading';
    const titleElement = document.createElement('span');
    titleElement.className = 'ih-floating-editor-title';
    titleElement.id = `${id}-title`;
    const statusElement = document.createElement('span');
    statusElement.className = 'ih-floating-editor-status';
    statusElement.id = `${id}-status`;
    statusElement.setAttribute('role', 'status');
    statusElement.setAttribute('aria-live', 'polite');
    statusElement.setAttribute('aria-atomic', 'true');
    statusElement.hidden = true;
    const titleRow = document.createElement('div');
    titleRow.className = 'ih-floating-editor-title-row';
    titleRow.append(titleElement);
    const detailsRow = document.createElement('div');
    detailsRow.className = 'ih-floating-editor-details-row';
    const tokenMount = document.createElement('span');
    tokenMount.className = 'ih-floating-editor-token-mount';
    detailsRow.append(tokenMount, statusElement);
    heading.append(titleRow, detailsRow);
    const actions = document.createElement('div');
    actions.className = 'ih-floating-editor-actions';
    header.append(grip, heading, actions);

    function makeButton(action, label, icon, parent = actions) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'ih-floating-editor-button';
        button.dataset.action = action;
        button.setAttribute('aria-label', label);
        button.title = label;
        const glyph = document.createElement('i');
        glyph.className = `fa-solid ${icon}`;
        glyph.setAttribute('aria-hidden', 'true');
        button.append(glyph);
        parent.append(button);
        return button;
    }

    const previewButton = makeButton('preview', 'Markdown 预览', 'fa-eye');
    previewButton.setAttribute('aria-pressed', 'false');
    previewButton.setAttribute('aria-expanded', 'false');
    previewButton.setAttribute('aria-controls', `${id}-preview`);
    previewButton.hidden = !canPreview;
    previewButton.disabled = !canPreview;
    const pinButton = makeButton('pin', '固定位置和大小', 'fa-thumbtack');
    pinButton.setAttribute('aria-pressed', 'false');
    const collapseButton = makeButton('collapse', '折叠编辑器', 'fa-chevron-up');
    collapseButton.setAttribute('aria-pressed', 'false');
    collapseButton.setAttribute('aria-expanded', 'true');
    collapseButton.setAttribute('aria-controls', `${id}-body`);
    const historyButton = makeButton('history', '变更历史', 'fa-clock-rotate-left', document.createElement('div'));
    historyButton.setAttribute('aria-pressed', 'false');
    historyButton.setAttribute('aria-expanded', 'false');
    historyButton.setAttribute('aria-controls', `${id}-history`);
    historyButton.disabled = typeof requestHistory !== 'function';
    const closeButton = makeButton('close', '关闭悬浮编辑', 'fa-xmark');

    const body = document.createElement('div');
    body.className = 'ih-floating-editor-body';
    body.id = `${id}-body`;
    const textarea = document.createElement('textarea');
    textarea.className = 'text_pole ih-floating-editor-textarea';
    textarea.setAttribute('aria-labelledby', titleElement.id);
    textarea.setAttribute('aria-describedby', statusElement.id);
    textarea.value = text(value);
    body.append(textarea);

    const previewPanel = document.createElement('div');
    previewPanel.className = 'ih-floating-editor-preview';
    previewPanel.id = `${id}-preview`;
    previewPanel.hidden = true;
    previewPanel.setAttribute('role', 'document');
    previewPanel.setAttribute('aria-label', 'Markdown 预览');
    previewPanel.tabIndex = 0;
    body.append(previewPanel);
    const historyPanel = document.createElement('div');
    historyPanel.className = 'ih-floating-editor-history';
    historyPanel.id = `${id}-history`;
    historyPanel.hidden = true;
    historyPanel.setAttribute('role', 'group');
    historyPanel.setAttribute('aria-label', '变更历史');
    const historyList = document.createElement('ul');
    historyList.className = 'ih-floating-editor-history-list';
    historyList.setAttribute('role', 'listbox');
    historyList.setAttribute('aria-label', '变更记录');
    const historyPreview = document.createElement('div');
    historyPreview.className = 'ih-floating-editor-history-preview';
    const historyPreviewText = document.createElement('pre');
    historyPreviewText.className = 'ih-floating-editor-history-preview-text';
    historyPreviewText.tabIndex = 0;
    historyPreviewText.setAttribute('aria-label', '变更预览：新增为绿色，删除为红色删除线');
    const historyActions = document.createElement('div');
    historyActions.className = 'ih-floating-editor-history-actions';
    const historyLegend = document.createElement('div');
    historyLegend.className = 'ih-floating-editor-history-legend';
    for (const [cls, label] of [['added', '+ 新增'], ['removed', '− 删除']]) {
        const hint = document.createElement('span');
        hint.className = `ih-floating-editor-history-${cls}`;
        hint.textContent = label;
        historyLegend.append(hint);
    }
    const historyNavigation = document.createElement('div');
    historyNavigation.className = 'ih-floating-editor-history-navigation';
    historyNavigation.setAttribute('role', 'group');
    historyNavigation.setAttribute('aria-label', '变动位置定位');
    const previousChange = makeButton('history-prev-change', '上一处变动', 'fa-chevron-up', historyNavigation);
    const changePosition = document.createElement('span');
    changePosition.className = 'ih-floating-editor-history-position';
    changePosition.setAttribute('role', 'status');
    historyNavigation.append(changePosition);
    const nextChange = makeButton('history-next-change', '下一处变动', 'fa-chevron-down', historyNavigation);
    previousChange.disabled = nextChange.disabled = true;
    changePosition.textContent = '0 / 0';
    const historyRevert = document.createElement('button');
    historyRevert.type = 'button';
    historyRevert.className = 'ih-floating-editor-history-revert';
    historyRevert.textContent = '回到此状态';
    historyRevert.disabled = true;
    historyActions.append(historyNavigation, historyRevert);
    historyPreview.append(historyLegend, historyPreviewText, historyActions);
    historyPanel.append(historyList, historyPreview);
    body.append(historyPanel);

    element.append(header, body);
    const resizeButton = makeButton('resize', '调整大小（方向键；Shift 加速）', 'fa-up-right-and-down-left-from-center', element);
    resizeButton.classList.add('ih-floating-editor-resize');

    function listen(target, type, handler, options) {
        target.addEventListener(type, handler, options);
        disposers.push(() => target.removeEventListener(type, handler, options));
    }

    function viewport() {
        const visual = view.visualViewport;
        const width = Math.max(1, visual?.width || document.documentElement.clientWidth || view.innerWidth || 1);
        const height = Math.max(1, visual?.height || document.documentElement.clientHeight || view.innerHeight || 1);
        const gapX = Math.min(VIEWPORT_GAP, width / 4);
        const gapY = Math.min(VIEWPORT_GAP, height / 4);
        return {
            x: (visual?.offsetLeft || 0) + gapX,
            y: (visual?.offsetTop || 0) + gapY,
            width: Math.max(1, width - gapX * 2),
            height: Math.max(1, height - gapY * 2),
        };
    }

    function writeBox(x, y, width, height) {
        for (const [property, val] of Object.entries({ left: x, top: y, width, height })) {
            const value = `${val}px`;
            if (element.style.getPropertyValue(property) !== value) element.style.setProperty(property, value, 'important');
        }
    }

    function layout() {
        if (destroyed) return;
        const bounds = viewport();
        box.width = Math.min(bounds.width, Math.max(MIN_WIDTH, preferred.width));
        const rendered = element.getBoundingClientRect();
        const renderedScale = element.offsetHeight ? rendered.height / element.offsetHeight : 1;
        const chrome = view.getComputedStyle(element);
        const borderHeight = (parseFloat(chrome.borderTopWidth) || 0) + (parseFloat(chrome.borderBottomWidth) || 0);
        const headerHeight = Math.ceil((header.getBoundingClientRect().height || 44) + borderHeight * renderedScale);
        box.height = Math.min(bounds.height, collapsed ? headerHeight : Math.max(MIN_HEIGHT, preferred.height));
        box.x = clamp(preferred.x ?? box.x, bounds.x, bounds.x + bounds.width - box.width);
        box.y = clamp(preferred.y ?? box.y, bounds.y, bounds.y + bounds.height - box.height);
        writeBox(box.x, box.y, box.width, box.height);

        const rect = element.getBoundingClientRect();
        const scaleX = rect.width / box.width;
        const scaleY = rect.height / box.height;
        if (scaleX > 0 && scaleY > 0 && (
            Math.abs(rect.left - box.x) > 0.5 || Math.abs(rect.top - box.y) > 0.5 ||
            Math.abs(scaleX - 1) > 0.001 || Math.abs(scaleY - 1) > 0.001
        )) {
            writeBox(
                box.x + (box.x - rect.left) / scaleX,
                box.y + (box.y - rect.top) / scaleY,
                box.width / scaleX,
                box.height / scaleY,
            );
        }
    }

    function scheduleLayout() {
        if (!destroyed) layoutRegistration?.schedule();
    }

    function flushGeometry() {
        endGesture();
        if (geometryTimer) persistGeometry();
    }

    function requestClose() {
        if (destroyed || closing) return;
        closing = true;
        try {
            if (typeof onClose === 'function') onClose();
            else destroy();
        } finally {
            closing = false;
        }
    }

    function guardDialogCancel(event) {
        if (event.target !== host || !element.contains(document.activeElement)) return;
        event.preventDefault();
        event.stopPropagation();
        if (!composing) requestClose();
    }

    function focusTextarea() {
        if (!destroyed) textarea.focus({ preventScroll: true });
    }

    function setCollapsed(next) {
        if (destroyed || collapsed === next) return;
        endGesture();
        if (next && historyOpen) setHistoryOpen(false);
        if (next && previewOpen) setPreviewOpen(false);
        const hidingFocus = next && body.contains(document.activeElement);
        collapsed = next;
        element.classList.toggle('is-collapsed', collapsed);
        body.hidden = collapsed;
        resizeButton.hidden = collapsed;
        resizeButton.disabled = pinned || collapsed;
        collapseButton.setAttribute('aria-pressed', String(collapsed));
        collapseButton.setAttribute('aria-expanded', String(!collapsed));
        const label = collapsed ? '展开编辑器' : '折叠编辑器';
        collapseButton.title = label;
        collapseButton.setAttribute('aria-label', label);
        collapseButton.firstElementChild.className = `fa-solid ${collapsed ? 'fa-chevron-down' : 'fa-chevron-up'}`;
        layout();
        if (hidingFocus) collapseButton.focus({ preventScroll: true });
    }

    const relativeTime = at => {
        if (!Number.isFinite(at)) return '';
        const delta = Math.max(0, Date.now() - at);
        if (delta < 5000) return '刚刚';
        const sec = Math.round(delta / 1000);
        if (sec < 60) return `${sec} 秒前`;
        const min = Math.round(sec / 60);
        if (min < 60) return `${min} 分钟前`;
        const hr = Math.round(min / 60);
        if (hr < 24) return `${hr} 小时前`;
        return `${Math.round(hr / 24)} 天前`;
    };
    const changeSummary = row => {
        if (row.index === 0) return row.trimmed ? '保留的最早状态' : '打开时的内容';
        const parts = [];
        if (row.insert) parts.push(`+${row.insert}`);
        if (row.remove) parts.push(`-${row.remove}`);
        return parts.length ? `修改（${parts.join(' / ')} 字）` : '修改';
    };

    const CAP = 4000;
    function resetPreview() {
        previewText = '';
        previewRegions = [];
        previewRegionIndex = -1;
        changePosition.textContent = '0 / 0';
        previousChange.disabled = nextChange.disabled = true;
        historyPreviewText.classList.remove('has-highlight');
    }
    function renderChangeLocation(index) {
        const count = previewRegions.length;
        previewRegionIndex = count ? clamp(index, 0, count - 1) : -1;
        previousChange.disabled = previewRegionIndex <= 0;
        nextChange.disabled = previewRegionIndex < 0 || previewRegionIndex >= count - 1;
        changePosition.textContent = `${count ? previewRegionIndex + 1 : 0} / ${count}`;
        changePosition.title = count ? `第 ${previewRegionIndex + 1} 处变动，共 ${count} 处` : '此状态没有变动';
        historyPreviewText.textContent = '';
        historyPreviewText.classList.toggle('has-highlight', count > 0);
        if (!count) {
            historyPreviewText.textContent = previewText.length > CAP ? `${previewText.slice(0, CAP)}…` : previewText || '（空）';
            historyPreviewText.scrollTop = 0;
            return;
        }
        const change = previewRegions[previewRegionIndex];
        const end = change.from + change.insert.length;
        const previousEnd = previewRegionIndex > 0
            ? previewRegions[previewRegionIndex - 1].from + previewRegions[previewRegionIndex - 1].insert.length : 0;
        const nextStart = previewRegions[previewRegionIndex + 1]?.from ?? previewText.length;
        let start = Math.max(previousEnd, change.from - 400);
        let stop = Math.min(nextStart, end + 400);
        if (splitsSurrogatePair(previewText, start)) start--;
        if (splitsSurrogatePair(previewText, stop)) stop++;
        const append = value => historyPreviewText.append(document.createTextNode(value));
        if (start > 0) append('…\n');
        append(previewText.slice(start, change.from));
        const location = document.createElement('span');
        location.className = 'ih-floating-editor-history-change';
        for (const [tag, kind, value, label] of [
            ['del', 'removed', change.remove, '删除'], ['ins', 'added', change.insert, '新增'],
        ]) {
            if (!value) continue;
            const mark = document.createElement(tag);
            mark.className = `ih-floating-editor-history-${kind}`;
            mark.title = `${label} ${value.length} 字`;
            const limit = 1400;
            let edge = limit;
            if (splitsSurrogatePair(value, edge)) edge--;
            mark.textContent = value.length > limit ? `${value.slice(0, edge)}…（省略 ${value.length - edge} 字）` : value;
            location.append(mark);
        }
        historyPreviewText.append(location);
        append(previewText.slice(end, stop));
        if (stop < previewText.length) append('\n…');
        historyPreviewText.scrollTop = 0;
        const top = location.getBoundingClientRect().top - historyPreviewText.getBoundingClientRect().top;
        historyPreviewText.scrollTop = Math.max(0, top - historyPreviewText.clientHeight / 3);
    }
    function renderPreview(fullText, change) {
        previewText = fullText;
        previewRegions = floatingEditorChangeRegions(change, view.diff_match_patch);
        renderChangeLocation(0);
    }

    function previewHistoryAt(index, force = false) {
        if (destroyed) return;
        if (!force && index === historySelected && index === lastPreviewIndex && previewValueKey === lastPreviewKey) {
            return;
        }
        historySelected = index;
        let text = null;
        try { text = typeof previewHistory === 'function' ? previewHistory(index) : null; }
        catch { text = null; }
        for (const item of historyList.children) {
            const active = Number(item.dataset.index) === index;
            if (item.classList.contains('is-selected') !== active) {
                item.classList.toggle('is-selected', active);
            }
            item.setAttribute('aria-selected', String(active));
            item.tabIndex = active ? 0 : -1;
        }
        lastPreviewIndex = index;
        lastPreviewKey = previewValueKey;
        if (text === null) {
            resetPreview();
            historyPreviewText.textContent = '（此状态已无法预览）';
            historyRevert.disabled = true;
        } else {
            let change = null;
            try { change = typeof changeHistory === 'function' ? changeHistory(index) : null; }
            catch { change = null; }
            if (change && typeof change.remove === 'string' &&
                text.slice(change.from, change.from + change.insert.length) !== change.insert) {
                change = null;
            }
            renderPreview(text, change);
            historyRevert.disabled = !!readOnly || !!textarea.readOnly;
        }
    }

    function renderHistory() {
        if (destroyed || !historyOpen) return;
        let snapshot = null;
        try { snapshot = typeof requestHistory === 'function' ? requestHistory() : null; }
        catch { snapshot = null; }
        if (!snapshot || !Array.isArray(snapshot.entries) || !snapshot.entries.length) {
            if (historySignature !== 'empty') {
                historySignature = 'empty';
                historyList.textContent = '';
                const empty = document.createElement('li');
                empty.className = 'ih-floating-editor-history-empty';
                empty.textContent = '暂无变更记录。';
                historyList.append(empty);
                resetPreview();
                historyPreviewText.textContent = '';
                historyRevert.disabled = true;
                historySelected = null;
                lastPreviewIndex = null;
            }
            return;
        }
        const last = snapshot.entries[snapshot.entries.length - 1];
        const signature = `${snapshot.revision ?? ""}:${snapshot.entries.length}:${snapshot.position}:${last.index}:${last.at}:${last.insert}:${last.remove}`;
        previewValueKey = signature;
        if (signature === historySignature) {
            if (historySelected !== null) previewHistoryAt(historySelected);
            return;
        }
        historySignature = signature;
        historyList.textContent = '';
        const rows = [...snapshot.entries].reverse();
        const fragment = document.createDocumentFragment();
        for (const row of rows) {
            const item = document.createElement('li');
            item.className = 'ih-floating-editor-history-item';
            item.dataset.index = String(row.index);
            item.setAttribute('role', 'option');
            item.tabIndex = -1;
            if (row.index === snapshot.position) item.classList.add('is-current');
            const dot = document.createElement('span');
            dot.className = 'ih-floating-editor-history-dot';
            dot.setAttribute('aria-hidden', 'true');
            const label = document.createElement('span');
            label.className = 'ih-floating-editor-history-label';
            const summary = document.createElement('span');
            summary.className = 'ih-floating-editor-history-summary';
            summary.textContent = changeSummary(row) + (row.index === snapshot.position ? '（当前）' : '');
            const meta = document.createElement('span');
            meta.className = 'ih-floating-editor-history-meta';
            meta.textContent = relativeTime(row.at);
            label.append(summary, meta);
            item.append(dot, label);
            fragment.append(item);
        }
        historyList.append(fragment);
        const available = rows.map(r => r.index);
        const target = available.includes(historySelected) ? historySelected
            : (available.includes(snapshot.position) ? snapshot.position : rows[0].index);
        previewHistoryAt(target, true);
    }

    function setHistoryOpen(next) {
        next = !!next;
        if (destroyed || historyOpen === next) return;
        if (next && typeof requestHistory !== 'function') return;
        if (next) {
            if (previewOpen) setPreviewOpen(false);
            onHistoryOpen?.();
        }
        historyOpen = next;
        historySelected = null;
        historySignature = null;
        lastPreviewIndex = null;
        element.classList.toggle('is-history-open', historyOpen);
        historyPanel.hidden = !historyOpen;
        historyButton.setAttribute('aria-pressed', String(historyOpen));
        historyButton.setAttribute('aria-expanded', String(historyOpen));
        historyButton.title = historyOpen ? '返回编辑' : '变更历史';
        historyButton.setAttribute('aria-label', historyButton.title);
        historyButton.firstElementChild.className = `fa-solid ${historyOpen ? 'fa-arrow-left' : 'fa-clock-rotate-left'}`;
        titleElement.textContent = historyOpen ? '变更历史' : baseTitle;
        titleElement.title = titleElement.textContent;
        if (historyOpen) {
            renderHistory();
            historyButton.focus({ preventScroll: true });
        } else {
            historyList.textContent = '';
            resetPreview();
            historyPreviewText.textContent = '';
            historyRevert.disabled = true;
            historySignature = null;
            focusTextarea();
        }
    }

    function renderPreview() {
        const value = textarea.value;
        const win = document.defaultView;
        let html;
        try {
            const showdown = win?.showdown;
            if (showdown?.Converter) {
                const converter = new showdown.Converter({
                    emoji: true,
                    literalMidWordUnderscores: true,
                    parseImgDimensions: true,
                    tables: true,
                    underline: true,
                    simpleLineBreaks: true,
                    strikethrough: true,
                    disableForced4SpacesIndentedSublists: true,
                });
                html = converter.makeHtml(value);
            } else {
                html = `<pre>${escapeHtml(value)}</pre>`;
            }
        } catch (error) {
            console.warn('[ST-QuickBar] Markdown 预览渲染失败', error);
            html = `<pre>${escapeHtml(value)}</pre>`;
        }
        const purify = win?.DOMPurify;
        previewPanel.innerHTML = purify ? purify.sanitize(html) : `<pre>${escapeHtml(value)}</pre>`;
    }

    function setPreviewOpen(next) {
        next = !!next;
        if (destroyed || previewOpen === next) return;
        if (next && !canPreview) return;
        if (next) {
            if (historyOpen) setHistoryOpen(false);
            renderPreview();
        }
        previewOpen = next;
        element.classList.toggle('is-preview-open', previewOpen);
        previewPanel.hidden = !previewOpen;
        previewButton.setAttribute('aria-pressed', String(previewOpen));
        previewButton.setAttribute('aria-expanded', String(previewOpen));
        const label = previewOpen ? '返回编辑' : 'Markdown 预览';
        previewButton.title = label;
        previewButton.setAttribute('aria-label', label);
        previewButton.firstElementChild.className = `fa-solid ${previewOpen ? 'fa-pen' : 'fa-eye'}`;
        if (previewOpen) previewPanel.focus({ preventScroll: true });
        else { previewPanel.innerHTML = ''; focusTextarea(); }
    }

    function setPinned(next) {
        if (destroyed) return;
        endGesture();
        pinned = next;
        element.classList.toggle('is-pinned', pinned);
        pinButton.setAttribute('aria-pressed', String(pinned));
        const label = pinned ? '解除位置和大小固定' : '固定位置和大小';
        pinButton.title = label;
        pinButton.setAttribute('aria-label', label);
        header.tabIndex = pinned ? -1 : 0;
        header.setAttribute('aria-label', pinned ? '悬浮窗位置和大小已固定' : '移动悬浮窗（方向键；Shift 加速）');
        resizeButton.disabled = pinned || collapsed;
    }

    function getGeometry() {
        return Object.fromEntries(Object.entries(preferred).map(([key, value]) => [key, Math.round(value)]));
    }

    function persistGeometry() {
        if (geometryTimer) view.clearTimeout(geometryTimer);
        geometryTimer = 0;
        const geometry = getGeometry();
        const serialized = JSON.stringify(geometry);
        if (serialized === lastGeometry) return;
        lastGeometry = serialized;
        onGeometryChange?.(geometry);
    }

    function rememberVisiblePosition() {
        preferred.x = box.x;
        preferred.y = box.y;
    }

    function scheduleGeometrySave() {
        view.clearTimeout(geometryTimer);
        geometryTimer = view.setTimeout(persistGeometry, 200);
    }

    function endGesture(event) {
        if (!gesture || (event?.pointerId !== undefined && event.pointerId !== gesture.pointerId)) return;
        const previous = gesture;
        gesture = null;
        document.removeEventListener('pointermove', moveGesture, true);
        document.removeEventListener('pointerup', endGesture, true);
        document.removeEventListener('pointercancel', endGesture, true);
        previous.handle.removeEventListener('lostpointercapture', endGesture);
        element.classList.remove('is-dragging', 'is-resizing', 'is-drag-override');
        try {
            if (previous.handle.hasPointerCapture?.(previous.pointerId)) previous.handle.releasePointerCapture(previous.pointerId);
        } catch {                                                                  }
        persistGeometry();
    }

    function resizeFrom(origin, dx, dy, rtl) {
        const bounds = viewport();
        const maxWidth = rtl ? origin.x + origin.width - bounds.x : bounds.x + bounds.width - origin.x;
        const maxHeight = bounds.y + bounds.height - origin.y;
        preferred.width = clamp(origin.width + (rtl ? -dx : dx), Math.min(MIN_WIDTH, maxWidth), maxWidth);
        preferred.height = clamp(origin.height + dy, Math.min(MIN_HEIGHT, maxHeight), maxHeight);
        if (rtl) preferred.x = origin.x + origin.width - preferred.width;
        layout();
        rememberVisiblePosition();
    }

    function moveGesture(event) {
        if (!gesture || event.pointerId !== gesture.pointerId) return;
        if (event.cancelable) event.preventDefault();
        const dx = event.clientX - gesture.clientX;
        const dy = event.clientY - gesture.clientY;
        if (gesture.kind === 'move') {
            preferred.x = gesture.origin.x + dx;
            preferred.y = gesture.origin.y + dy;
            layout();
            rememberVisiblePosition();
        } else {
            resizeFrom(gesture.origin, dx, dy, gesture.rtl);
        }
    }

    function startGesture(event, kind, handle) {
        if (destroyed || gesture || event.isPrimary === false || event.button > 0 || (kind === 'resize' && collapsed)) return;
        if (kind === 'move' && event.target.closest('button, a, input, textarea, [contenteditable="true"]')) return;
        if (pinned && kind !== 'move') return;
        event.preventDefault();
        layout();
        gesture = {
            pointerId: event.pointerId,
            clientX: event.clientX,
            clientY: event.clientY,
            origin: { ...box },
            rtl: view.getComputedStyle(element).direction === 'rtl',
            kind,
            handle,
        };
        element.classList.add(kind === 'move' ? 'is-dragging' : 'is-resizing');
        if (pinned) element.classList.add('is-drag-override');
        document.addEventListener('pointermove', moveGesture, { capture: true, passive: false });
        document.addEventListener('pointerup', endGesture, true);
        document.addEventListener('pointercancel', endGesture, true);
        handle.addEventListener('lostpointercapture', endGesture);
        try { handle.setPointerCapture(event.pointerId); } catch {                                                     }
    }

    function geometryKeys(event, kind) {
        if (event.target !== event.currentTarget || pinned || composing || event.isComposing || event.altKey || event.ctrlKey || event.metaKey) return;
        const directions = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
        const delta = directions[event.key];
        if (!delta || (kind === 'resize' && collapsed)) return;
        event.preventDefault();
        event.stopPropagation();
        const step = event.shiftKey ? 32 : 8;
        if (kind === 'move') {
            preferred.x = box.x + delta[0] * step;
            preferred.y = box.y + delta[1] * step;
            layout();
            rememberVisiblePosition();
        } else {
            resizeFrom({ ...box }, delta[0] * step, delta[1] * step, view.getComputedStyle(element).direction === 'rtl');
        }
        scheduleGeometrySave();
    }

    function setValue(next) {
        if (destroyed) return;
        const normalized = text(next).replace(/\r\n?/g, '\n');
        if (normalized === textarea.value) return;
        const change = minimalTextChange(textarea.value, normalized);
        const scrollTop = textarea.scrollTop;
        const scrollLeft = textarea.scrollLeft;
        const direction = textarea.selectionDirection;
        textarea.setRangeText(change.insert, change.from, change.to, 'preserve');
        textarea.setSelectionRange(textarea.selectionStart, textarea.selectionEnd, direction);
        textarea.scrollTop = scrollTop;
        textarea.scrollLeft = scrollLeft;
        if (previewOpen) renderPreview();
    }

    function setTitle(next) {
        if (destroyed) return;
        baseTitle = text(next).trim() || '悬浮编辑';
        if (!historyOpen) {
            titleElement.textContent = baseTitle;
            titleElement.title = baseTitle;
        }
    }

    function setActive(next) {
        if (destroyed) return;
        const active = !!next;
        element.classList.toggle('is-active', active);
        element.dataset.active = String(active);
    }

    function setLayer(next) {
        if (destroyed || !Number.isFinite(next)) return;
        element.style.setProperty('z-index', String(clamp(Math.trunc(next), MIN_LAYER, MAX_LAYER)), 'important');
    }

    function setStatus(next) {
        if (destroyed) return;
        statusElement.textContent = text(next);
        statusElement.title = statusElement.textContent;
        statusElement.hidden = !statusElement.textContent;
        scheduleLayout();
    }

    function setCapacity(count, max, full) {
        if (destroyed) return;
        element.dataset.capacity = `${count}/${max}`;
        element.classList.toggle('is-at-capacity', !!full);
    }

    function setCanPreview(next) {
        next = !!next;
        if (destroyed || next === canPreview) return;
        canPreview = next;
        previewButton.hidden = !canPreview;
        previewButton.disabled = !canPreview;
        if (!canPreview && previewOpen) setPreviewOpen(false);
    }

    function setReadOnly(next) {
        next = !!next;
        if (destroyed || next === readOnly) return;
        readOnly = next;
        textarea.readOnly = !!next;
        textarea.setAttribute('aria-readonly', String(!!next));
        element.classList.toggle('is-readonly', !!next);
        if (!!next) historyRevert.disabled = true;
        if (historyOpen && historySelected !== null) previewHistoryAt(historySelected, true);
    }

    function setThemeSource(next) {
        if (destroyed) return;
        const validSource = next?.ownerDocument === document && typeof next.closest === 'function' ? next : null;
        source = validSource;
        const nextHost = source?.closest('dialog[open]') || document.body;
        if (nextHost !== host) {
            endGesture();
            const focused = element.contains(document.activeElement) ? document.activeElement : null;
            host?.removeEventListener('cancel', guardDialogCancel);
            if (host) observer?.unobserve(host);
            host = nextHost;
            host.append(element);
            host.addEventListener('cancel', guardDialogCancel);
            observer?.observe(host);
            if (focused) focused.focus({ preventScroll: true });
        }

        const nextAttributes = new Map();
        for (const name of ['mdHotkeys', 'monospace']) {
            const active = !!source?.classList.contains(name);
            if (textarea.classList.contains(name) !== active) textarea.classList.toggle(name, active);
        }
        if (source) {
            for (const attribute of source.attributes) {
                if (SOURCE_ATTRIBUTES.includes(attribute.name) || /^data-macros(?:-|$)/.test(attribute.name)) {
                    nextAttributes.set(attribute.name, attribute.value);
                }
            }
        }
        for (const name of copiedAttributes) if (!nextAttributes.has(name)) textarea.removeAttribute(name);
        for (const [name, value] of nextAttributes) if (textarea.getAttribute(name) !== value) textarea.setAttribute(name, value);
        copiedAttributes = [...nextAttributes.keys()];
        const computed = source ? view.getComputedStyle(source) : null;
        for (const [property, suffix] of Object.entries(SOURCE_STYLES)) {
            const val = computed?.getPropertyValue(property);
            const variable = `--ih-fe-editor-${suffix}`;
            if (val && element.style.getPropertyValue(variable) !== val) element.style.setProperty(variable, val);
            else if (!val && element.style.getPropertyValue(variable)) element.style.removeProperty(variable);
        }
        layout();
    }

    function focus() {
        if (destroyed) return;
        setCollapsed(false);
        focusTextarea();
    }

    function destroy() {
        if (destroyed) return;
        endGesture();
        if (geometryTimer) persistGeometry();
        destroyed = true;
        resetPreview();
        layoutRegistration?.unregister();
        layoutRegistration = null;
        observer?.disconnect();
        host?.removeEventListener('cancel', guardDialogCancel);
        for (const dispose of disposers.splice(0)) dispose();
        element.remove();
        host = null;
        source = null;
    }

    listen(textarea, 'input', event => onInput?.(textarea.value, event));
    listen(textarea, 'compositionstart', event => {
        composing = true;
        onCompositionStart?.(event);
    });
    listen(textarea, 'compositionend', event => {
        composing = false;
        onCompositionEnd?.(textarea.value, event);
    });
    listen(closeButton, 'click', event => {
        event.stopPropagation();
        requestClose();
    });
    listen(historyButton, 'click', () => {
        if (!historyButton.disabled) setHistoryOpen(!historyOpen);
    });
    listen(previewButton, 'click', () => {
        if (!previewButton.disabled) setPreviewOpen(!previewOpen);
    });
    listen(historyList, 'click', event => {
        const item = event.target.closest?.('.ih-floating-editor-history-item');
        if (item && historyList.contains(item)) previewHistoryAt(Number(item.dataset.index));
    });
    listen(historyList, 'keydown', event => {
        const items = [...historyList.querySelectorAll('.ih-floating-editor-history-item')];
        if (!items.length) return;
        const current = items.findIndex(item => Number(item.dataset.index) === historySelected);
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault();
            const base = current < 0 ? 0 : current;
            const nextIndex = event.key === 'ArrowDown' ? Math.min(items.length - 1, base + 1) : Math.max(0, base - 1);
            const target = items[nextIndex];
            if (target) { previewHistoryAt(Number(target.dataset.index)); target.focus({ preventScroll: true }); }
        } else if (event.key === 'Enter' && !historyRevert.disabled) {
            event.preventDefault();
            historyRevert.click();
        }
    });
    listen(previousChange, 'click', () => renderChangeLocation(previewRegionIndex - 1));
    listen(nextChange, 'click', () => renderChangeLocation(previewRegionIndex + 1));
    listen(historyRevert, 'click', () => {
        if (historyRevert.disabled || historySelected === null) return;
        let accepted = false;
        try { accepted = typeof revertHistory === 'function' ? !!revertHistory(historySelected) : false; }
        catch { accepted = false; }
        if (accepted) setHistoryOpen(false);
        else renderHistory();
    });
    listen(pinButton, 'click', () => setPinned(!pinned));
    listen(collapseButton, 'click', () => {
        setCollapsed(!collapsed);
        if (!collapsed) focusTextarea();
    });
    listen(header, 'pointerdown', event => startGesture(event, 'move', header));
    listen(resizeButton, 'pointerdown', event => startGesture(event, 'resize', resizeButton));
    listen(header, 'keydown', event => geometryKeys(event, 'move'));
    listen(resizeButton, 'keydown', event => geometryKeys(event, 'resize'));
    listen(element, 'keyup', event => { if (event.key.startsWith('Arrow') && geometryTimer) persistGeometry(); });
    listen(element, 'focusout', () => { if (geometryTimer) persistGeometry(); });
    listen(element, 'keydown', event => {
        if (event.key !== 'Escape') return;
        event.stopPropagation();
        if (composing || event.isComposing || event.keyCode === 229 || event.defaultPrevented) return;
        event.preventDefault();
        if (historyOpen) setHistoryOpen(false);
        else if (previewOpen) setPreviewOpen(false);
        else requestClose();
    });
    layoutRegistration = registerLayoutPanel(document, { element, layout, flushGeometry });
    if (view.ResizeObserver) {
        observer = new view.ResizeObserver(scheduleLayout);
        observer.observe(header);
    }
    const bounds = viewport();
    preferred.x ??= bounds.x + Math.max(0, bounds.width - preferred.width) / 2;
    preferred.y ??= bounds.y + Math.max(0, bounds.height - preferred.height) / 3;
    box.x = preferred.x;
    box.y = preferred.y;
    lastGeometry = JSON.stringify(getGeometry());
    setTitle(title);
    setActive(false);
    setLayer(MIN_LAYER);
    setThemeSource(source);
    scheduleLayout();

    function refreshHistory() { if (historyOpen) renderHistory(); }

    return { element, textarea, titleRow, tokenMount, historyButton, setValue, setTitle, setActive, setLayer, setStatus, setCapacity, setCanPreview, setReadOnly, setThemeSource, focus, getGeometry, refreshHistory, destroy };
}

const setDisabled = (button, disabled) => {
    if (button && button.disabled !== disabled) button.disabled = disabled;
};
const setAttribute = (node, name, value) => {
    if (node.getAttribute(name) !== value) node.setAttribute(name, value);
};

export function createFloatingEditorTools({
    window: panel,
    isCss = false,
    onUndo,
    onRedo,
    onFind,
    onColor,
    onSave,
    canEdit = () => true,
} = {}) {
    const { element, textarea, historyButton } = panel || {};
    const document = element?.ownerDocument;
    if (!document || !textarea || !element.contains(textarea)) {
        throw new Error('Floating editor tools require a panel and its local textarea.');
    }
    const disposers = [];
    const hadToolsClass = element.classList.contains('has-edit-tools');
    let destroyed = false, composing = false;
    const state = {
        readOnly: Boolean(textarea.readOnly),
        canUndo: false,
        canRedo: false,
        searchOpen: false,
        canSave: false,
    };

    function node(tag, className, parent) {
        const result = document.createElement(tag);
        result.className = className;
        parent?.append(result);
        return result;
    }
    function listen(target, type, handler, options) {
        target.addEventListener(type, handler, options);
        disposers.push(() => target.removeEventListener(type, handler, options));
    }
    function button(parent, action, label, icon) {
        const result = node('button', 'ih-floating-editor-button', parent);
        result.type = 'button';
        result.dataset.action = action;
        result.title = label;
        result.setAttribute('aria-label', label);
        const glyph = node('i', `fa-solid ${icon}`, result);
        glyph.setAttribute('aria-hidden', 'true');
        return result;
    }

    const footer = node('div', 'ih-floating-editor-footer ih-floating-editor-edit-actions');
    footer.setAttribute('role', 'group');
    footer.setAttribute('aria-label', '编辑工具');
    const historyActions = node('div', 'ih-floating-editor-tool-group', footer);
    const contextActions = node('div', 'ih-floating-editor-tool-group', footer);
    if (historyButton) historyActions.append(historyButton);
    const undo = button(historyActions, 'undo', '撤销', 'fa-rotate-left');
    const redo = button(historyActions, 'redo', '重做', 'fa-rotate-right');
    const find = button(contextActions, 'find', '查找 / 替换（Ctrl/⌘+F）', 'fa-magnifying-glass');
    const color = isCss ? button(contextActions, 'color', '选择颜色', 'fa-eye-dropper') : null;
    const save = typeof onSave === 'function' ? button(contextActions, 'save', '保存条目，不关闭窗口（Ctrl/⌘+S；整份预设仍需在酒馆保存）', 'fa-floppy-disk') : null;
    if (save) listen(save, 'click', () => { if (editable() && state.canSave) onSave(); });
    element.insertBefore(footer, element.querySelector(':scope > .ih-floating-editor-resize'));
    element.classList.add('has-edit-tools');

    const available = () => !destroyed && !composing && element.isConnected
        && element.contains(textarea) && !textarea.disabled && !element.classList.contains('is-collapsed');
    const writable = () => !destroyed && !composing && !textarea.disabled && !state.readOnly && !textarea.readOnly;
    const editable = () => available() && writable() && typeof canEdit === 'function' && Boolean(canEdit());
    const canFind = () => available() && typeof onFind === 'function';

    function render() {
        if (destroyed) return;
        const canWrite = writable();
        setDisabled(undo, !canWrite || !state.canUndo || typeof onUndo !== 'function');
        setDisabled(redo, !canWrite || !state.canRedo || typeof onRedo !== 'function');
        setDisabled(color, !canWrite || typeof onColor !== 'function');
        setDisabled(save, !canWrite || !state.canSave);
        setDisabled(find, composing || textarea.disabled || typeof onFind !== 'function');
        setAttribute(find, 'aria-expanded', String(state.searchOpen));
        setAttribute(find, 'aria-pressed', String(state.searchOpen));
    }
    function toggleSearch() {
        if (canFind()) onFind();
    }
    function update(nextState = {}) {
        if (destroyed) return;
        for (const key of ['readOnly', 'canUndo', 'canRedo', 'searchOpen', 'canSave']) {
            if (key in nextState) state[key] = Boolean(nextState[key]);
        }
        render();
    }
    function refresh() {}

    listen(find, 'click', toggleSearch);
    const collapse = element.querySelector('[data-action="collapse"]');
    if (collapse) listen(collapse, 'click', () => {
        if (element.classList.contains('is-collapsed') && state.searchOpen) onFind?.();
    });
    listen(undo, 'click', () => {
        if (editable() && state.canUndo && typeof onUndo === 'function') onUndo();
    });
    listen(redo, 'click', () => {
        if (editable() && state.canRedo && typeof onRedo === 'function') onRedo();
    });
    if (color) listen(color, 'click', () => {
        if (editable() && typeof onColor === 'function') onColor();
    });
    listen(textarea, 'compositionstart', () => { composing = true; render(); });
    listen(textarea, 'compositionend', () => { composing = false; render(); });
    listen(textarea, 'keydown', event => {
        if (event.defaultPrevented || composing || event.isComposing || event.keyCode === 229) return;
        if (!(event.ctrlKey || event.metaKey) || event.altKey || event.shiftKey || !['f', 'h'].includes(event.key.toLowerCase())) return;
        if (!canFind()) return;
        event.preventDefault();
        event.stopPropagation();
        onFind({ focusInput: event.key.toLowerCase() === 'h' ? 'replacement' : 'query' });
    }, true);

    function destroy() {
        if (destroyed) return;
        destroyed = true;
        for (const dispose of disposers.splice(0)) dispose();
        footer.remove();
        if (!hadToolsClass) element.classList.remove('has-edit-tools');
    }
    render();
    return { update, refresh, destroy, toggleSearch, get searchOpen() { return state.searchOpen; } };
}

const CHARACTER_DRAFT_FIELDS = new Map([
  ["description_textarea", { field: "description", label: "角色描述" }],
  ["personality_textarea", { field: "personality", label: "角色性格" }],
  ["scenario_pole", { field: "scenario", label: "场景" }],
  ["firstmessage_textarea", { field: "first_mes", label: "主开场白" }],
]);

const CHARACTER_FIELDS = new Set([
  "description_textarea", "firstmessage_textarea", "personality_textarea",
  "scenario_pole", "mes_example_textarea", "system_prompt_textarea",
  "post_history_instructions_textarea", "creator_notes_textarea", "tags_textarea",
  "depth_prompt_prompt",
]);
const EXTENSION_EDITOR_TARGET = "data-quickbar-editor-for";
const EXTENSION_EDITOR_KEY = "data-quickbar-editor-key";
const EXTENSION_EDITOR_TITLE = "data-quickbar-editor-title";
const TEXT_INPUT_TYPES = new Set(["text", "search", "url", "tel", "email"]);
const PRESET_SELECTORS = [
  "#settings_preset", "#settings_preset_openai", "#context_presets",
  "#sysprompt_select", "#instruct_presets", "#first_message_select",
];

function selectionIdentity(doc, selector) {
  const el = doc.querySelector(selector);
  return el ? `${el.value ?? ""}\u0000${el.selectedOptions?.[0]?.textContent ?? ""}` : "";
}

export function captureEditorIdentity(source, getContext = () => ({})) {
  const doc = source.ownerDocument;
  const context = getContext() || {};
  const id = source.id;
  const characterId = context.characterId ?? context.this_chid ?? null;
  const character = context.characters?.[characterId];
  const dialog = source.closest("dialog");
  const base = { source, id, dialog, kind: "generic" };
  const extensionKey = source.getAttribute?.(EXTENSION_EDITOR_KEY);
  if (extensionKey != null) {
    return { ...base, kind: "extension", extensionKey };
  }
  if (id === "customCSS") {
    return { ...base, kind: "css", theme: selectionIdentity(doc, "#themes") };
  }
  const entry = source.closest(".world_entry");
  if (entry || id.startsWith("world_entry_content_")) {
    return {
      ...base, kind: "world", entry,
      uid: entry?.getAttribute("uid") ?? entry?.dataset.uid ?? id,
      book: selectionIdentity(doc, "#world_editor_select"),
    };
  }
  if (id === "persona_description") {
    return { ...base, kind: "persona", avatar: context.userAvatar ?? context.user_avatar ?? "" };
  }
  if (CHARACTER_FIELDS.has(id) || source.closest("#form_create")) {
    return {
      ...base, kind: "character", characterId, avatar: character?.avatar ?? "",
      mode: doc.querySelector("#form_create")?.getAttribute("actiontype") ?? "",
      formAvatar: doc.querySelector("#avatar_url_pole")?.value ?? "",
      epoch: context.editorEpoch ?? 0,
    };
  }
  return {
    ...base, characterId, avatar: character?.avatar ?? "", chatId: context.chatId ?? "",
    preset: PRESET_SELECTORS.map(selector => selectionIdentity(doc, selector)).join("\u0001"),
    epoch: context.editorEpoch ?? 0,
    presetEpoch: context.presetEpoch ?? 0,
  };
}

export function sameEditorIdentity(a, b) {
  return !!a && !!b && Object.keys(a).length === Object.keys(b).length &&
    Object.keys(a).every(key => a[key] === b[key]);
}

export function editorLogicalKey(identity) {
  if (!identity) return "";
  const { source, dialog, entry, ...logical } = identity;
  return JSON.stringify(Object.entries(logical).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)));
}

function createIndependentDraftAdapter(initialValue, kind = "character-draft") {
  let value = initialValue;
  return {
    kind,
    read: () => value,
    getRevision: () => value,
    getSelection: () => null,
    isConnected: () => true,
    isReadOnly: () => false,
    write(next) { value = String(next); return { value }; },
  };
}

function editorTitle(source, maximize) {
  const extensionTitle = source.getAttribute(EXTENSION_EDITOR_TITLE)?.trim();
  if (extensionTitle) return extensionTitle.slice(0, 100);
  const names = {
    customCSS: "自定义 CSS", description_textarea: "角色描述",
    firstmessage_textarea: "开场白", personality_textarea: "角色性格",
    scenario_pole: "场景", mes_example_textarea: "对话示例",
    system_prompt_textarea: "角色系统提示词", post_history_instructions_textarea: "历史后指令",
    creator_notes_textarea: "创作者备注", tags_textarea: "标签",
    depth_prompt_prompt: "深度提示词", persona_description: "用户描述",
  };
  if (names[source.id]) return names[source.id];
  if (source.id.startsWith("world_entry_content_")) {
    const row = source.closest(".world_entry");
    const comment = row?.querySelector('[name="comment"]')?.value;
    return comment ? `世界书 · ${comment}` : `世界书条目 ${source.id.slice(20)}`;
  }
  if (source.id.endsWith("prompt_manager_popup_entry_form_prompt")) {
    const nameId = source.id.replace(/_prompt$/, "_name");
    const name = source.ownerDocument.getElementById(nameId)?.value?.trim();
    return name ? `预设 · ${name}` : "预设条目";
  }
  const label = source.labels?.[0]?.textContent || source.getAttribute("aria-label") ||
    maximize.parentElement?.querySelector("label, h3, h4, b, strong")?.textContent;
  return (label?.trim() || source.getAttribute("placeholder") || source.id || "文本编辑").slice(0, 100);
}

export function createFloatingEditorController({
  document: doc = globalThis.document,
  getContext = () => ({}),
  isEnabled = () => true,
  notify = () => {},
  getGeometry = () => null,
  saveGeometry = () => {},
  openColorPicker = null,
  openFindReplace = null,
  onHistoryChange = null,
  characterDescriptionStore = null,
  onCharacterDescriptionSaved = null,
  characterFieldStore = characterDescriptionStore,
  onCharacterFieldSaved = onCharacterDescriptionSaved,
  presetEntryStore = null,
  createTokenCounter = null,
} = {}) {
  const win = doc.defaultView;
  const MAX_WINDOWS = 3;
  const CHARACTER_AUTOSAVE_DELAY = 700;
  const CHARACTER_AUTOSAVE_RETRIES = 2;
  const buttons = new Map();
  const maximizers = new Set();
  const ownedButtons = new WeakSet();
  const ownedPairs = new WeakSet();
  const pendingRoots = new Set();
  const PAIR = ".ih-floating-editor-actions-pair";
  const NATIVE_MAXIMIZE = ".editor_maximize[data-for]";
  const MAXIMIZE = `${NATIVE_MAXIMIZE}, [${EXTENSION_EDITOR_TARGET}]`;
  const LAUNCH = ".ih-floating-editor-launch";
  const EDITABLE = "textarea, input, [contenteditable]";
  const sessions = new Map();
  const toolTargets = new WeakMap();
  let nextSessionId = 0;
  let activeId = null;
  let colorOwnerId = null;
  let findOwner = null;
  let observer = null;
  let scanFrame = 0;
  let timer = 0;
  let running = false;
  let observing = false;
  let retryUnresolved = false;
  let themeObserver = null;
  let themeFrame = 0;

  function resolveSource(maximize) {
    if (!maximize?.isConnected || !maximize.matches(MAXIMIZE) ||
        maximize.closest(".ih-floating-editor")) return null;
    const explicit = maximize.getAttribute(EXTENSION_EDITOR_TARGET);
    const native = maximize.matches(NATIVE_MAXIMIZE);
    const id = explicit ?? maximize.getAttribute("data-for");
    if (!id || (native && explicit !== null && explicit !== maximize.getAttribute("data-for"))) return null;
    const source = doc.getElementById(id);
    if (!source || source.closest(".ih-floating-editor") || !source.matches(EDITABLE)) return null;
    if (source.tagName === "INPUT" && !TEXT_INPUT_TYPES.has(source.type)) return null;
    const key = source.getAttribute(EXTENSION_EDITOR_KEY);
    if (key !== null && !key.trim()) return null;
    return source;
  }

  const sessionList = () => [...sessions.values()];
  const activeSession = () => (activeId != null ? sessions.get(activeId) : null);
  function sessionForSource(source) {
    for (const s of sessions.values()) if (!s.characterDraft && !s.presetDraft && s.source === source) return s;
    return null;
  }

  function invalidate(s, message = "编辑对象已切换或原面板已关闭；此窗口已锁定，可复制内容后重新打开。") {
    if (!s || s.invalid) return;
    s.timeline.flush();
    s.invalid = true;
    const dialog = s.identity.dialog;
    if (dialog && (!dialog.isConnected || !dialog.open)) s.window.setThemeSource(null);
    s.window.setReadOnly(true);
    releaseColorOwner(s);
    releaseFindReplace(s, false);
    updateTools(s, true);
    s.window.setStatus(message);
    stopSessionSource(s);
    maybeStopPolling();
    notify(message);
  }

  function sessionIsValid(s) {
    if (!s || s.invalid || sessions.get(s.id) !== s || !s.window?.textarea.isConnected) return false;
    if (s.characterDraft || s.presetDraft) return isEnabled();
    const dialog = s.identity.dialog;
    const displayed = resolveCodeMirrorForSource(s.source)?.dom || s.source;
    return isEnabled() && displayed.getClientRects().length > 0 &&
      win.getComputedStyle(displayed).visibility !== "hidden" &&
      s.adapter.isConnected() && s.adapter.kind !== "unsupported" &&
      resolveSource(s.maximize) === s.source &&
      (!dialog || (dialog.isConnected && dialog.open)) &&
      sameEditorIdentity(s.identity, captureEditorIdentity(s.source, getContext));
  }

  function valid(s) {
    if (!s || s.invalid || sessions.get(s.id) !== s) return false;
    const host = (s.characterDraft || s.presetDraft) && s.window?.element.parentElement;
    if (host?.tagName === "DIALOG" && (!host.isConnected || !host.open)) s.window.setThemeSource(null);
    if (!sessionIsValid(s)) {
      invalidate(s);
      return false;
    }
    return true;
  }

  function sync(s) {
    if (!s || s.writing || !valid(s)) return;
    if (s.characterDraft) { updateCharacterDraft(s); updateTools(s); return; }
    if (s.presetDraft) { updatePresetDraft(s); updateTools(s); return; }
    s.window.setReadOnly(s.adapter.isReadOnly());
    const title = editorTitle(s.source, s.maximize);
    if (title !== s.title) { s.title = title; s.window.setTitle(title); }
    if (s.composing || s.sourceComposing || resolveCodeMirrorForSource(s.source)?.composing) { updateTools(s); return; }
    try {
      const revision = s.adapter.getRevision();
      if (revision !== s.revision) {
        const value = typeof revision === "string" ? revision : s.adapter.read();
        const valueChanged = value !== s.lastValue;
        s.history.accept(value);
        s.window.setValue(value);
        s.lastValue = value;
        s.syncedValue = value;
        if (valueChanged) s.timeline.queue(value);
        s.revision = revision;
        s.lastSelection = selectedRange(s);
        s.tools?.refresh();
        updateTools(s, valueChanged);
      } else updateTools(s);
    } catch (error) {
      console.warn("[ST-QuickBar] 悬浮编辑同步失败", error);
      invalidate(s, "源编辑器已不可用；窗口已锁定，可复制内容。 ");
    }
  }

  function write(s, value, options = {}) {
    if (!s || s.writing || !valid(s) || s.composing) return false;
    const revision = s.adapter.getRevision();
    if (s.sourceComposing || (!s.characterDraft && !s.presetDraft && resolveCodeMirrorForSource(s.source)?.composing) ||
        (revision !== s.revision && s.adapter.read() !== s.lastValue)) {
      invalidate(s, "原框同时发生了修改；已暂停同步，保留两边内容以避免覆盖。 ");
      return;
    }
    if (s.adapter.isReadOnly()) {
      s.window.setReadOnly(true);
      s.window.setValue(s.adapter.read());
      return;
    }
    try {
      s.writing = true;
      const result = s.adapter.write(value, {
        userEvent: options.userEvent || "input.type", addToHistory: options.addToHistory,
      });
      // A source input handler can close/switch its panel during a successful
      // write. Remember accepted text before checking the binding again.
      if (!s.characterDraft && !s.presetDraft) s.syncedValue = result.value;
      if (!valid(s)) return;
      const valueChanged = result.value !== s.lastValue;
      if (options.historyDirection) s.history.accept(result.value, options.historyDirection);
      else s.history.record(result.value, {
        beforeSelection: s.beforeSelection || s.lastSelection,
        afterSelection: selectedRange(s), group: options.group === true,
      });
      s.lastValue = result.value;
      if (valueChanged) {
        s.timeline.queue(result.value);
        if (options.historyDirection || options.userEvent === "input.restore") s.timeline.flush();
      }
      s.revision = s.adapter.getRevision();
      if (result.value !== value) s.window.setValue(result.value);
      s.lastSelection = selectedRange(s);
      s.beforeSelection = null;
      s.tools?.refresh();
      if (s.characterDraft) {
        if (valueChanged) { s.characterDraft.retryCount = 0; scheduleCharacterSave(s); }
        updateCharacterDraft(s);
      }
      if (s.presetDraft) updatePresetDraft(s);
      updateTools(s, valueChanged);
      return true;
    } catch (error) {
      console.warn("[ST-QuickBar] 悬浮编辑写回失败", error);
      invalidate(s, "无法安全写回源编辑器；窗口已锁定，可复制内容。 ");
    } finally {
      s.writing = false;
    }
  }

  function selectedRange(s) {
    const field = s.window.textarea;
    return { from: field.selectionStart, to: field.selectionEnd };
  }

  function editable(s) {
    const cm = s.characterDraft || s.presetDraft ? null : resolveCodeMirrorForSource(s.source);
    return !s.characterDraft?.closing && !s.presetDraft?.closing && !s.presetDraft?.saving && !s.composing && !s.sourceComposing && !cm?.composing &&
      !cm?.compositionStarted && !s.adapter.isReadOnly();
  }

  function canEdit(s) {
    return valid(s) && editable(s);
  }

  function getHistoryState(s, checkIdentity = true) {
    const current = checkIdentity ? sessionIsValid(s) :
      sessions.get(s.id) === s && !s.invalid && s.window.textarea.isConnected;
    const readOnly = !current || !editable(s);
    return { canUndo: !readOnly && s.history.canUndo, canRedo: !readOnly && s.history.canRedo, readOnly };
  }

  function updateTools(s, forceHistory = false) {
    if (!s) return;
    s.tokenCounter?.refresh();
    const state = getHistoryState(s, false);
    if (state.readOnly) releaseColorOwner(s);
    s.tools?.update({ ...state, searchOpen: !!s.findOwner,
      canSave: !!s.presetDraft && !s.presetDraft.closing && !s.presetDraft.saving && !s.composing && !s.invalid &&
        (presetDraftDirty(s) || !!s.presetDraft.error),
    });
    const key = `${state.canUndo}/${state.canRedo}/${state.readOnly}`;
    if (typeof onHistoryChange !== "function" || s.notifyingHistory || (!forceHistory && s.historyStateKey === key)) return;
    s.historyStateKey = key;
    s.notifyingHistory = true;
    try { onHistoryChange(s.window.textarea); }
    catch (error) { console.warn("[ST-QuickBar] 悬浮编辑历史状态通知失败", error); }
    finally { s.notifyingHistory = false; }
  }

  function applyEdit(s, { value, selection, expectedValue } = {}, options = {}) {
    if (!canEdit(s) || s.writing || typeof value !== "string") return false;
    if (expectedValue !== undefined && expectedValue !== s.window.textarea.value) return false;
    if (s.adapter.read() !== s.lastValue || s.window.textarea.value !== s.lastValue) {
      sync(s); s.tools?.refresh(); return false;
    }
    s.timeline.flush();
    s.beforeSelection = selectedRange(s);
    s.window.setValue(value);
    if (selection) s.window.textarea.setSelectionRange(selection.from, selection.to);
    const accepted = write(s, value, { userEvent: "input.replace", ...options });
    if (accepted) s.window.textarea.focus({ preventScroll: true });
    return accepted === true;
  }

  function runHistory(s, direction) {
    if ((direction !== "undo" && direction !== "redo") || !canEdit(s) || s.writing) return false;
    sync(s);
    if (!canEdit(s)) return false;
    s.timeline.flush();
    const candidate = s.history.peek(direction);
    if (!candidate) { updateTools(s); return false; }
    if (s.adapter.kind !== "codemirror") return applyEdit(s, candidate, { historyDirection: direction, userEvent: direction });
    let valueChanged = false;
    try {
      s.writing = true;
      const result = s.adapter.history(direction);
      s.syncedValue = result.value;
      if (!valid(s)) return false;
      if (!result.changed) {
        if (result.unhandled) {
          s.writing = false;
          return applyEdit(s, candidate, {
            historyDirection: direction, userEvent: direction, addToHistory: false,
          });
        }
        s.history.block(direction);
        return false;
      }
      valueChanged = result.value !== s.lastValue;
      s.history.accept(result.value, direction);
      s.window.setValue(result.value);
      const selection = s.adapter.getSelection();
      if (selection) s.window.textarea.setSelectionRange(selection.from, selection.to);
      s.lastValue = result.value;
      if (valueChanged) { s.timeline.queue(result.value); s.timeline.flush(); }
      s.revision = s.adapter.getRevision();
      s.lastSelection = selectedRange(s);
      s.beforeSelection = null;
      s.tools.refresh();
      s.window.textarea.focus({ preventScroll: true });
      return true;
    } catch (error) {
      console.warn("[ST-QuickBar] 悬浮编辑撤销/重做失败", error);
      notify("此编辑器未能执行撤销/重做，内容未被强行替换。 ");
      return false;
    } finally { s.writing = false; updateTools(s, valueChanged); }
  }

  function releaseColorOwner(s) {
    if (colorOwnerId !== s.id) { s.colorClose?.(); s.colorClose = null; return; }
    const close = s.colorClose;
    s.colorClose = null;
    colorOwnerId = null;
    close?.();
  }

  function showColorPicker(s) {
    if (!canEdit(s) || s.source.id !== "customCSS") return;
    if (colorOwnerId === s.id && s.colorClose) { releaseColorOwner(s); return; }
    if (typeof openColorPicker !== "function") return;
    if (colorOwnerId != null) { const owner = sessions.get(colorOwnerId); if (owner) releaseColorOwner(owner); }
    sync(s);
    if (!canEdit(s)) return;
    const generation = s.generation;
    colorOwnerId = s.id;
    const closePicker = openColorPicker({
      target: s.window.textarea,
      anchor: s.window.element.querySelector('[data-action="color"]'),
      isValid: () => sessions.get(s.id) === s && s.generation === generation && colorOwnerId === s.id && canEdit(s),
      replaceRange: (from, to, text) => {
        if (sessions.get(s.id) !== s || s.generation !== generation || colorOwnerId !== s.id || !canEdit(s)) return false;
        const value = s.window.textarea.value;
        return applyEdit(s, { value: value.slice(0, from) + text + value.slice(to), selection: { from, to: from + text.length } });
      },
      onClose: () => { if (colorOwnerId === s.id) colorOwnerId = null; s.colorClose = null; },
    });
    s.colorClose = typeof closePicker === "function" ? closePicker : null;
    if (!s.colorClose && colorOwnerId === s.id) colorOwnerId = null;
  }

  function releaseFindReplace(s, refresh = true) {
    const owner = s.findOwner;
    const close = s.findClose;
    s.findOwner = null;
    s.findClose = null;
    if (findOwner === owner) findOwner = null;
    try { close?.(); }
    catch (error) { console.warn("[ST-QuickBar] 悬浮编辑查找关闭失败", error); }
    if (refresh && (owner || close)) updateTools(s);
  }

  function showFindReplace(s, { focusInput = null } = {}) {
    if (!valid(s)) return false;
    if (s.findOwner && !focusInput) { releaseFindReplace(s); return false; }
    if (typeof openFindReplace !== "function") return false;
    sync(s);
    if (!valid(s)) return false;
    if (s.findOwner && focusInput) {
      const owner = s.findOwner;
      try {
        const close = openFindReplace({ target: s.window.textarea, keepOpen: true, focusInput });
        return typeof close === "function" && s.findOwner === owner && valid(s);
      } catch (error) {
        console.warn("[ST-QuickBar] 悬浮编辑查找聚焦失败", error);
        return false;
      }
    }
    if (findOwner) releaseFindReplace(findOwner.session);
    if (!valid(s)) return false;
    const owner = { session: s };
    s.findOwner = findOwner = owner;
    const onClose = () => {
      if (s.findOwner !== owner) return;
      s.findOwner = null;
      s.findClose = null;
      if (findOwner === owner) findOwner = null;
      updateTools(s);
    };
    let close;
    try {
      close = openFindReplace({
        target: s.window.textarea,
        anchor: s.window.element.querySelector('[data-action="find"]'),
        focusInput,
        onClose,
      });
    } catch (error) {
      onClose();
      console.warn("[ST-QuickBar] 悬浮编辑查找打开失败", error);
      return false;
    }
    if (typeof close !== "function") { onClose(); return false; }
    if (s.findOwner !== owner || !valid(s)) {
      try { close(); }
      catch (error) { console.warn("[ST-QuickBar] 悬浮编辑查找关闭失败", error); }
      return false;
    }
    s.findClose = close;
    updateTools(s);
    return true;
  }

  function restore(s) {
    if (!valid(s)) return;
    if (!win.confirm(s.characterDraft ? "恢复此窗口打开时的内容？恢复后会自动保存到对应角色。" : "恢复此窗口打开时的内容？这会实时写回原编辑框，不会关闭窗口。")) return;
    if (!valid(s)) return;
    sync(s);
    if (!valid(s)) return;
    s.timeline.flush();
    s.window.setValue(s.initialValue);
    write(s, s.initialValue, { userEvent: "input.restore" });
    s.window.setThemeSource(s.source);
  }

  function historySnapshot(s) {
    if (!s || s.invalid || sessions.get(s.id) !== s || !s.window?.textarea.isConnected) return null;
    try { return s.timeline.list(); }
    catch (error) { console.warn("[ST-QuickBar] 变更历史读取失败", error); return null; }
  }

  function historyPreview(s, index) {
    if (!s || sessions.get(s.id) !== s) return null;
    try { return s.timeline.textAt(index); }
    catch (error) { console.warn("[ST-QuickBar] 变更历史预览失败", error); return null; }
  }

  function historyChange(s, index) {
    if (!s || sessions.get(s.id) !== s) return null;
    try { return s.timeline.changeAt(index); }
    catch (error) { console.warn("[ST-QuickBar] 变更历史差异读取失败", error); return null; }
  }

  function historyRevert(s, index) {
    if (!valid(s) || !canEdit(s) || s.writing) return false;
    let target = null;
    try { target = s.timeline.textAt(index); }
    catch (error) { console.warn("[ST-QuickBar] 变更历史回退失败", error); return false; }
    if (target === null) return false;
    sync(s);
    if (!valid(s) || !canEdit(s)) return false;
    s.timeline.flush();
    if (target === s.lastValue) return true;
    s.beforeSelection = selectedRange(s);
    s.window.setValue(target);
    return write(s, target, { userEvent: "input.restore" }) === true;
  }

  function stopSessionSource(s) {
    cancelCharacterSave(s);
    s.timeline.dispose();
    win.jQuery?.(s.window.textarea).off(".ihFloatingEditor");
    s.stopSource?.();
    s.stopSource = null;
    s.sourceComposing = false;
  }

  function setActive(id) {
    if (activeId === id) { restack(); return; }
    activeId = id;
    for (const s of sessions.values()) s.window.setActive(s.id === id);
    restack();
  }

  function restack() {
    const order = sessionList();
    order.sort((a, b) =>
      (a.id === activeId ? 1 : 0) - (b.id === activeId ? 1 : 0) ||
      (a.openedAt - b.openedAt) || (a.id - b.id));
    const base = 10030;
    order.forEach((s, index) => s.window.setLayer(base + Math.min(index, MAX_WINDOWS - 1)));
  }

  function updateCapacityHints() {
    const full = sessions.size >= MAX_WINDOWS;
    for (const s of sessions.values()) s.window.setCapacity?.(sessions.size, MAX_WINDOWS, full);
  }

  function characterDraftDirty(s) {
    const draft = s.characterDraft;
    if (!draft) return false;
    if (draft.confirmedValue === null || draft.uncertain) return true;
    return s.window.textarea.value !== draft.confirmedValue.replace(/\r\n?/g, "\n");
  }

  function updateCharacterDraft(s) {
    const draft = s.characterDraft;
    if (!draft || s.invalid || sessions.get(s.id) !== s) return;
    const dirty = characterDraftDirty(s);
    const state = draft.saving || draft.closing ? "saving" : draft.loading ? "loading" : draft.error ? "error" : dirty ? "dirty" : "saved";
    const status = draft.closing ? "正在自动保存并关闭…" : draft.saving ? "自动保存中…" : draft.loading ? "正在同步角色内容…" : draft.error ||
      (dirty ? "自动保存 · 等待输入结束…" : "自动保存 · 已保存");
    const title = draft.name + " · " + draft.label + (dirty ? " *" : "");
    if (s.title !== title) { s.title = title; s.window.setTitle(title); }
    const key = state + status;
    if (draft.statusKey !== key) {
      draft.statusKey = key;
      s.window.element.dataset.saveState = state;
      s.window.setStatus(status);
    }
  }

  function cancelCharacterSave(s) {
    const draft = s?.characterDraft;
    if (!draft) return;
    win.clearTimeout(draft.saveTimer);
    draft.saveTimer = 0;
  }

  function scheduleCharacterSave(s, delay = CHARACTER_AUTOSAVE_DELAY) {
    const draft = s?.characterDraft;
    if (!draft) return;
    cancelCharacterSave(s);
    if (sessions.get(s.id) !== s || s.invalid || draft.closing || !characterDraftDirty(s)) return;
    draft.saveTimer = win.setTimeout(() => {
      draft.saveTimer = 0;
      if (sessions.get(s.id) !== s || s.invalid || draft.closing || !isEnabled()) return;
      if (s.composing || draft.loading || draft.saving) return;
      if (draft.baseline === null) loadCharacterDraft(s);
      else saveCharacterDraft(s);
    }, delay);
  }

  function retryCharacterSave(s) {
    const draft = s.characterDraft;
    if (!draft || s.invalid || draft.closing || draft.retryCount >= CHARACTER_AUTOSAVE_RETRIES) return;
    scheduleCharacterSave(s, ++draft.retryCount * 1000);
  }

  function retryPendingCharacterSaves() {
    for (const s of sessions.values()) if (s.characterDraft && !s.invalid && characterDraftDirty(s)) {
      s.characterDraft.retryCount = 0;
      scheduleCharacterSave(s, 0);
    }
  }

  function currentCharacterField(draft) {
    const { avatar, sourceId, label } = draft;
    if (doc.querySelector("#form_create")?.getAttribute("actiontype") !== "editcharacter" ||
        doc.querySelector("#avatar_url_pole")?.value !== avatar) return null;
    const source = doc.getElementById(sourceId);
    if (!source?.isConnected) return null;
    const adapter = createFloatingEditorAdapter(source);
    if (adapter.kind === "unsupported" || adapter.isReadOnly() || resolveCodeMirrorForSource(source)?.composing) {
      throw Object.assign(new Error("原" + label + "编辑框暂时不可写或正在组字。"), { code: "source-busy" });
    }
    return { source, adapter, value: adapter.read() };
  }

  function checkCharacterSource(s, desired) {
    const draft = s.characterDraft;
    const current = currentCharacterField(draft);
    if (current && ![draft.nativeValue, draft.baseline, desired].includes(current.value)) {
      throw Object.assign(new Error("原" + draft.label + "编辑框也发生了修改。"), { code: "conflict" });
    }
    return current;
  }

  function publishCharacterField(s, snapshot, allowedValues) {
    if (typeof onCharacterFieldSaved === "function") onCharacterFieldSaved(snapshot);
    const current = currentCharacterField(s.characterDraft);
    if (!current || current.value === snapshot.value) return;
    if (!allowedValues.includes(current.value)) {
      throw Object.assign(new Error("角色文件已保存，但原框又有更新的修改；未覆盖原框。"), { code: "conflict" });
    }
    if (current.adapter.kind === "codemirror") {
      current.adapter.write(snapshot.value, { userEvent: "input.quickbar-save", addToHistory: false });
    } else {
      const change = minimalTextChange(current.value, snapshot.value);
      current.source.setRangeText(change.insert, change.from, change.to, "preserve");
    }
    if (current.adapter.read() !== snapshot.value) throw new Error("角色文件已保存，但原编辑器未接受同步。");
  }

  function pauseCharacterSave(s, error) {
    const draft = s.characterDraft;
    const latest = error.latest;
    if (latest?.avatar === draft.avatar && (latest.field ?? "description") === draft.field && typeof latest.value === "string") {
      draft.confirmedValue = latest.value;
      draft.uncertain = false;
      try { publishCharacterField(s, latest, [draft.nativeValue, draft.baseline]); }
      catch {                                                               }
    }
    draft.error = (error.message || "编辑内容发生冲突。") + " 已暂停自动同步，内容保留，可复制后关闭并重新打开。";
    invalidate(s, draft.error);
  }

  function loadCharacterDraft(s) {
    const draft = s.characterDraft;
    if (!draft || !valid(s)) return Promise.resolve(false);
    if (draft.loading) return draft.loadPromise;
    draft.loading = true;
    draft.error = "";
    updateCharacterDraft(s);
    draft.loadPromise = (async () => {
      let loaded = false, retryable = false;
      try {
        let snapshot = await characterFieldStore.load(draft.avatar, draft.field);
        if (sessions.get(s.id) !== s || s.invalid) return false;
        if (snapshot.value.replace(/\r\n?/g, "\n") !== s.initialValue) {
          await new Promise(resolve => win.setTimeout(resolve, CHARACTER_AUTOSAVE_DELAY));
          if (sessions.get(s.id) !== s || s.invalid) return false;
          snapshot = await characterFieldStore.load(draft.avatar, draft.field);
        }
        if (sessions.get(s.id) !== s || s.invalid) return false;
        draft.confirmedValue = snapshot.value;
        draft.uncertain = false;
        draft.name = snapshot.name;
        if (snapshot.value.replace(/\r\n?/g, "\n") !== s.initialValue) {
          pauseCharacterSave(s, { message: "服务器内容与打开时不同。", latest: snapshot });
          return false;
        }
        draft.baseline = snapshot.value;
        draft.retryCount = 0;
        loaded = true;
        return true;
      } catch (error) {
        if (sessions.get(s.id) !== s || s.invalid) return false;
        retryable = ["network", "busy"].includes(error.code);
        draft.error = (error.message || "读取失败。") + " 内容已保留，自动保存尚未完成。";
        notify(draft.error);
        return false;
      } finally {
        draft.loading = false;
        draft.retryable = retryable;
        updateCharacterDraft(s);
        updateTools(s);
        if (loaded) scheduleCharacterSave(s);
        else if (retryable) retryCharacterSave(s);
      }
    })();
    return draft.loadPromise;
  }

  function saveCharacterDraft(s) {
    const draft = s.characterDraft;
    if (!draft || !valid(s) || s.composing) return Promise.resolve(false);
    if (draft.saving) return draft.savePromise;
    if (draft.loading || draft.baseline === null) return Promise.resolve(false);
    if (!characterDraftDirty(s)) return Promise.resolve(true);
    cancelCharacterSave(s);
    const value = s.lastValue;
    let writeStarted = false, verified = false, completed = false, retryable = false;
    draft.saving = true;
    draft.error = "";
    updateCharacterDraft(s);
    draft.savePromise = (async () => {
      try {
        let sourceBeforeSave = checkCharacterSource(s, value);
        const snapshot = await characterFieldStore.save({
          avatar: draft.avatar, field: draft.field, baseline: draft.baseline, value,
          beforeWrite: () => {
            if (!valid(s)) throw new Error("编辑窗口已关闭或停用，未提交保存。");
            sourceBeforeSave = checkCharacterSource(s, value);
            writeStarted = true;
          },
        });
        const previousBaseline = draft.baseline;
        draft.baseline = snapshot.value;
        draft.confirmedValue = snapshot.value;
        draft.uncertain = false;
        verified = true;
        draft.name = snapshot.name;
        publishCharacterField(s, snapshot, [sourceBeforeSave?.value, draft.nativeValue, previousBaseline, value]);
        draft.nativeValue = snapshot.value;
        draft.retryCount = 0;
        completed = true;
        return true;
      } catch (error) {
        if (writeStarted && !verified) draft.uncertain = true;
        if (error.code === "conflict" || error.code === "missing" || error.latest || verified) {
          pauseCharacterSave(s, error);
        } else {
          retryable = ["network", "verify", "busy", "source-busy"].includes(error.code);
          draft.error = (error.message || "自动保存失败。") + " 内容已保留，保存尚未确认。";
          notify(draft.error);
        }
        return false;
      } finally {
        draft.saving = false;
        draft.retryable = retryable;
        updateCharacterDraft(s);
        updateTools(s);
        if (completed || (!s.invalid && s.lastValue !== value)) scheduleCharacterSave(s);
        else if (retryable) retryCharacterSave(s);
      }
    })();
    return draft.savePromise;
  }

  function presetDraftDirty(s) {
    const draft = s?.presetDraft;
    if (!draft) return false;
    const baseline = draft.baseline.replace(/\r\n?/g, "\n");
    if (draft.uncertain || s.window.textarea.value !== baseline) return true;
    try {
      return presetEntryStore.current(draft).value.replace(/\r\n?/g, "\n") !== baseline;
    } catch {
      return !!draft.savedEver;
    }
  }

  function hasRecoverableDraft(s) {
    return characterDraftDirty(s) || presetDraftDirty(s) ||
      // Live-sync editors have no separate save step. Losing the source does
      // not make already synchronized (or untouched) text an unsaved draft.
      (!s.characterDraft && !s.presetDraft &&
        s.window.textarea.value !== s.syncedValue.replace(/\r\n?/g, "\n"));
  }

  function updatePresetDraft(s) {
    const draft = s.presetDraft;
    if (!draft) return;
    const dirty = presetDraftDirty(s);
    let state = dirty ? "dirty" : "saved";
    let status = dirty ? "独立草稿 · 关闭时自动保存" : "条目已同步 · 仍需保存预设";
    if (draft.error) { state = "error"; status = draft.error; }
    if (draft.closing || draft.saving) { state = "saving"; status = draft.closing ? "正在保存并关闭…" : "正在保存条目，请稍候…"; }
    else if (!draft.error) {
      try { presetEntryStore.current(draft); }
      catch (error) { state = "dirty"; status = error.message + " 草稿可继续编辑，内容不会清空。"; }
    }
    const title = draft.name + (dirty ? " *" : "") + " · 预设「" + draft.preset + "」";
    if (title !== s.title) { s.title = title; s.window.setTitle(title); }
    const statusKey = state + status;
    if (draft.statusKey !== statusKey) {
      draft.statusKey = statusKey;
      s.window.element.dataset.saveState = state;
      s.window.setStatus(status);
    }
  }

  function currentPresetSource(s) {
    const draft = s.presetDraft;
    const source = doc.getElementById(draft.sourceId);
    if (!source?.isConnected || source.closest('dialog:not([open])')) return null;
    const cm = resolveCodeMirrorForSource(source);
    const visibleEditor = cm?.dom || source;
    const popup = source.closest('[id$="prompt_manager_popup"]');
    if (!visibleEditor.getClientRects().length || (popup && !popup.classList.contains("openDrawer"))) return null;
    let binding;
    try { binding = presetEntryStore.capture(source); } catch { return null; }
    if (binding?.key !== s.logicalKey) return null;
    const adapter = createFloatingEditorAdapter(source);
    if (adapter.kind === "unsupported" || adapter.isReadOnly() || resolveCodeMirrorForSource(source)?.composing) {
      throw new Error("原条目编辑器暂时不可写或正在组字，请稍后重试。");
    }
    return { source, adapter, value: adapter.read() };
  }

  function checkPresetSources(s, desired) {
    const draft = s.presetDraft;
    presetEntryStore.current(draft);
    const current = currentPresetSource(s);
    const mirrors = current ? [current] : [];
    if (current && ![draft.nativeValue, draft.baseline, desired].includes(current.value)) {
      throw new Error("原条目编辑框也有修改，未覆盖任何一边。请复制保留两边内容后重新打开条目。");
    }
    if (["main", "nsfw", "jailbreak"].includes(draft.identifier)) {
      const source = doc.getElementById(draft.identifier + "_prompt_quick_edit_textarea");
      if (source?.isConnected) {
        const adapter = createFloatingEditorAdapter(source);
        const value = adapter.read();
        if (adapter.kind === "unsupported" || adapter.isReadOnly() || resolveCodeMirrorForSource(source)?.composing ||
            ![draft.baseline, desired].some(allowed => allowed.replace(/\r\n?/g, "\n") === value)) {
          throw new Error("对应快捷编辑框也有修改或正在组字，未覆盖其内容；请先保留两边修改。");
        }
        mirrors.push({ source, adapter, value });
      }
    }
    return mirrors;
  }

  function savePresetDraft(s) {
    const draft = s?.presetDraft;
    if (!draft || !valid(s) || s.composing) return Promise.resolve(false);
    if (draft.saving) return draft.savePromise;
    if (!presetDraftDirty(s) && !draft.error) return Promise.resolve(true);
    const value = s.window.textarea.value;
    draft.saving = true;
    draft.error = "";
    s.window.setReadOnly(true);
    updatePresetDraft(s);
    updateTools(s);
    draft.savePromise = (async () => {
      try {
        checkPresetSources(s, value);
        const snapshot = await presetEntryStore.save({ ...draft, value });
        if (sessions.get(s.id) !== s) return false;
        let mirrors = [];
        try { mirrors = checkPresetSources(s, value); }
        catch (error) { draft.error = "条目已保存；" + error.message; }
        draft.baseline = snapshot.value;
        draft.name = snapshot.name;
        draft.uncertain = false;
        draft.savedEver = true;
        for (const current of mirrors) if (current.value !== snapshot.value) {
          try { current.adapter.write(snapshot.value, { userEvent: "input.quickbar-save", addToHistory: false }); }
          catch { draft.error = "条目已保存，但原框未能同步；请重新打开原条目，避免用旧值覆盖。"; }
        }
        draft.nativeValue = snapshot.value;
        return true;
      } catch (error) {
        if (error.uncertain) draft.uncertain = true;
        draft.error = (error.message || "保存条目失败。") + " 草稿已保留，未覆盖其他条目。";
        notify(draft.error);
        return false;
      } finally {
        draft.saving = false;
        draft.savePromise = null;
        if (sessions.get(s.id) === s) {
          s.window.setReadOnly(s.invalid || draft.closing);
          updatePresetDraft(s);
          updateTools(s);
        }
      }
    })();
    return draft.savePromise;
  }

  function closePresetSession(s) {
    const draft = s.presetDraft;
    if (draft.closePromise) return draft.closePromise;
    if (s.composing && !s.invalid) { s.composing = false; write(s, s.window.textarea.value); }
    draft.closing = true;
    s.window.setReadOnly(true);
    updatePresetDraft(s);
    updateTools(s);
    draft.closePromise = (async () => {
      try {
        if (draft.saving) await draft.savePromise;
        if (sessions.get(s.id) !== s) return true;
        if (presetDraftDirty(s) || draft.error) await savePresetDraft(s);
        if (sessions.get(s.id) !== s) return true;
        if ((presetDraftDirty(s) || draft.error) && !win.confirm(
          "「" + draft.name + " · " + draft.preset + "」自动保存未完成或发生冲突。取消关闭可保留草稿并重试；确定放弃并关闭？"
        )) return false;
        return closeSession(s, true);
      } catch (error) {
        draft.error = (error.message || "自动保存未完成。") + " 草稿已保留，请稍后重试。";
        notify(draft.error);
        return false;
      } finally {
        if (sessions.get(s.id) === s) {
          draft.closing = false;
          draft.closePromise = null;
          s.window.setReadOnly(s.invalid);
          updatePresetDraft(s);
          updateTools(s);
        }
      }
    })();
    return draft.closePromise;
  }

  async function flushCharacterSave(s) {
    const draft = s.characterDraft;
    cancelCharacterSave(s);
    if (draft.loading) await draft.loadPromise;
    if (draft.saving) await draft.savePromise;
    if (!characterDraftDirty(s)) return true;
    if (s.invalid) return false;
    if (draft.baseline === null && !await loadCharacterDraft(s)) return false;
    return saveCharacterDraft(s);
  }

  function closeCharacterSession(s) {
    const draft = s.characterDraft;
    if (draft.closePromise) return draft.closePromise;
    if (s.composing && !s.invalid) { s.composing = false; write(s, s.window.textarea.value); }
    draft.closing = true;
    cancelCharacterSave(s);
    s.window.setReadOnly(true);
    updateCharacterDraft(s);
    updateTools(s);
    draft.closePromise = (async () => {
      try {
        await flushCharacterSave(s);
        if (sessions.get(s.id) !== s) return true;
        if (characterDraftDirty(s) && !win.confirm("「" + draft.name + " · " + draft.label + "」尚未保存成功。内容仍保留在窗口中；确定放弃这些内容并关闭？")) return false;
        return closeSession(s, true);
      } finally {
        if (sessions.get(s.id) === s) {
          draft.closing = false;
          draft.closePromise = null;
          s.window.setReadOnly(s.invalid);
          updateCharacterDraft(s);
          updateTools(s);
          if (draft.retryable) retryCharacterSave(s);
        }
      }
    })();
    return draft.closePromise;
  }

  async function flushAndCloseAll() {
    for (const s of sessionList()) {
      if (sessions.get(s.id) === s && !await closeSession(s)) return false;
    }
    return true;
  }

  function canCloseSessions(list) {
    if (list.some(s => s.characterDraft?.saving || s.characterDraft?.closing || s.presetDraft?.saving || s.presetDraft?.closing)) {
      notify("编辑内容正在保存，请等待结果后再关闭。");
      return false;
    }
    for (const s of list) {
      if (!s.characterDraft && !s.presetDraft && s.composing && !s.invalid) {
        s.composing = false;
        write(s, s.window.textarea.value);
      }
    }
    const dirty = list.filter(hasRecoverableDraft);
    return !dirty.length || win.confirm("「" + dirty.map(s => s.title).join("、") + "」有未自动保存或未同步到原编辑框的内容。取消关闭后可重试或复制保留；确定丢弃并关闭？");
  }

  function closeSession(s, confirmed = false) {
    if (!s || !sessions.has(s.id)) return false;
    if (!confirmed && s.characterDraft) return closeCharacterSession(s);
    if (!confirmed && s.presetDraft) return closePresetSession(s);
    if (!confirmed && !canCloseSessions([s])) return false;
    if (s.composing && !s.invalid) {
      s.composing = false;
      write(s, s.window.textarea.value);
    }
    s.timeline.flush();
    sessions.delete(s.id);
    s.tokenCounter?.destroy();
    s.generation++;
    releaseColorOwner(s);
    releaseFindReplace(s, false);
    stopSessionSource(s);
    updateTools(s, true);
    s.tools?.destroy();
    s.window.destroy();
    if (s.button?.isConnected) s.button.setAttribute("aria-pressed", "false");
    if (activeId === s.id) {
      activeId = null;
      const remaining = sessionList().sort((a, b) => b.openedAt - a.openedAt)[0];
      if (remaining) setActive(remaining.id);
    }
    if (!sessions.size) {
      stopThemeTracking();
      win.clearInterval(timer);
      timer = 0;
    }
    restack();
    updateCapacityHints();
    maybeStopPolling();
    return true;
  }

  function closeAll() {
    const list = sessionList();
    if (!canCloseSessions(list)) return false;
    for (const s of list) closeSession(s, true);
    return true;
  }

  function close() {
    const s = activeSession() || sessionList()[0];
    return s ? closeSession(s) : true;
  }

  function maybeStopPolling() {
    if (!sessions.size) { win.clearInterval(timer); timer = 0; return; }
    const anyLive = sessionList().some(s => !s.invalid);
    if (!anyLive) { win.clearInterval(timer); timer = 0; }
  }

  function ensurePolling() {
    if (timer || !sessions.size) return;
    timer = win.setInterval(() => {
      if (doc.hidden) return;
      for (const s of sessionList()) if (!s.invalid) sync(s);
    }, 250);
  }

  function readSlots() {
    const raw = getGeometry();
    const slots = [null, null, null];
    if (!raw || typeof raw !== "object") return slots;
    const finite = v => typeof v === "number" && Number.isFinite(v);
    const sane = g => g && typeof g === "object" &&
      finite(g.x) && finite(g.y) && finite(g.width) && finite(g.height) ? { x: g.x, y: g.y, width: g.width, height: g.height } : null;
    if (Array.isArray(raw.slots)) {
      for (let i = 0; i < MAX_WINDOWS; i++) slots[i] = sane(raw.slots[i]);
    } else if (finite(raw.x) || finite(raw.width)) {
      slots[0] = sane(raw);
    }
    return slots;
  }

  function occupiedSlots() {
    const used = new Set();
    for (const s of sessions.values()) if (s.slot != null) used.add(s.slot);
    return used;
  }

  function pickSlot(s) {
    const used = occupiedSlots();
    for (let i = 0; i < MAX_WINDOWS; i++) if (!used.has(i)) return i;
    return 0;
  }

  function getSlotGeometry(slot) {
    const slots = readSlots();
    const base = slots[slot];
    if (base) return base;
    const fallback = slots.find(Boolean);
    if (!fallback) return null;
    const step = 28 * slot;
    return { x: fallback.x + step, y: fallback.y + step, width: fallback.width, height: fallback.height };
  }

  function saveSlotGeometry(s, geometry) {
    if (s.slot == null) return;
    const slots = readSlots();
    slots[s.slot] = geometry;
    saveGeometry({ version: 2, slots, ...geometry });
  }

  function open(maximize) {
    if (!isEnabled() || !maximize?.isConnected) return null;
    const source = resolveSource(maximize);
    if (!source) return null;
    let presetBinding = null;
    if (presetEntryStore?.isSource(source)) {
      try { presetBinding = presetEntryStore.capture(source); }
      catch (error) { notify(error.message || "无法确认预设条目，请先在原面板保存条目。"); return null; }
      if (!presetBinding) { notify("此预设条目暂不支持独立悬浮编辑，请先在原面板保存条目。"); return null; }
    }
    const existingBySource = presetBinding ? null : sessionForSource(source);
    if (existingBySource && valid(existingBySource)) {
      setActive(existingBySource.id);
      existingBySource.window.focus();
      return existingBySource;
    }
    const identity = captureEditorIdentity(source, getContext);
    const definition = CHARACTER_DRAFT_FIELDS.get(source.id);
    const character = definition && identity.kind === "character" &&
      identity.mode === "editcharacter" && identity.formAvatar && characterFieldStore
      ? getContext()?.characters?.find(item => item.avatar === identity.formAvatar) : null;
    const key = presetBinding?.key || (character ? JSON.stringify(["character-field", character.avatar, definition.field]) : editorLogicalKey(identity));
    const existingByKey = sessionList().find(s => !s.invalid && s.logicalKey === key && valid(s));
    if (existingByKey) {
      if (existingByKey.characterDraft || existingByKey.presetDraft) {
        existingByKey.source = source;
        existingByKey.maximize = maximize;
        existingByKey.button = buttons.get(maximize);
        syncTheme(existingByKey);
      }
      setActive(existingByKey.id);
      existingByKey.window.focus();
      return existingByKey;
    }
    let adapter = createFloatingEditorAdapter(source);
    if (adapter.kind === "unsupported") {
      notify("此编辑框由暂不支持的编辑器接管，请使用原生放大按钮。 ");
      return null;
    }
    if (sessions.size >= MAX_WINDOWS) {
      notify(`已打开 ${MAX_WINDOWS} 个悬浮编辑窗，请先关闭一个再打开新的。`);
      return null;
    }
    const value = adapter.read();
    const characterDraft = character && !adapter.isReadOnly() ? {
      avatar: character.avatar, name: character.name || character.avatar,
      field: definition.field, label: definition.label, sourceId: source.id,
      baseline: null, confirmedValue: null, uncertain: false,
      nativeValue: value, loading: false, saving: false, error: "",
      saveTimer: 0, retryCount: 0, retryable: false, closing: false, loadPromise: null, savePromise: null, closePromise: null,
    } : null;
    const presetDraft = presetBinding && !adapter.isReadOnly() ? {
      ...presetBinding, sourceId: source.id, nativeValue: value,
      saving: false, closing: false, uncertain: false, error: "", savePromise: null, closePromise: null, statusKey: "",
    } : null;
    if (presetBinding && !presetDraft) { notify("原条目不可编辑，未创建悬浮草稿。"); return null; }
    if (characterDraft || presetDraft) adapter = createIndependentDraftAdapter(value, presetDraft ? "preset-draft" : "character-draft");
    const s = {
      id: ++nextSessionId, generation: 0, openedAt: Date.now(),
      source, maximize, adapter, identity, characterDraft, presetDraft, logicalKey: key,
      title: presetDraft ? presetDraft.name + " · 预设「" + presetDraft.preset + "」" : characterDraft ? characterDraft.name + " · " + characterDraft.label : editorTitle(source, maximize),
      initialValue: value, lastValue: value, syncedValue: value, revision: adapter.getRevision(),
      invalid: false, composing: false, sourceComposing: false, writing: false,
      syncQueued: false,
      button: buttons.get(maximize), window: null, tools: null, colorClose: null,
      findClose: null, findOwner: null, stopSource: null,
      historyStateKey: null, notifyingHistory: false,
      history: createFloatingEditorHistory(value), beforeSelection: null, lastSelection: null,
    };
    s.timeline = createFloatingEditorTimeline(value, {
      clock: win, onCommit: () => s.window?.refreshHistory(),
    });
    sessions.set(s.id, s);
    s.slot = pickSlot(s);
    s.window = createFloatingEditorWindow({
      document: doc, source, title: s.title, value,
      geometry: getSlotGeometry(s.slot),
      canPreview: identity.kind !== "css" && source.id !== "customCSS",
      onGeometryChange: geometry => {
        try { saveSlotGeometry(s, geometry); } catch (error) { console.warn("[ST-QuickBar] 窗口位置保存失败", error); }
      },
      onInput: (text, event) => {
        if (sessions.get(s.id) !== s) return;
        if (event?.isComposing || s.composing) return;
        write(s, text, { group: event?.inputType === "insertText" || event?.inputType?.startsWith("deleteContent") });
      },
      onCompositionStart: () => { if (sessions.get(s.id) === s) { sync(s); s.composing = true; updateTools(s); } },
      onCompositionEnd: (text) => {
        if (sessions.get(s.id) !== s) return;
        s.composing = false;
        write(s, text);
        if (s.characterDraft) scheduleCharacterSave(s);
        updateTools(s);
      },
      onClose: () => closeSession(s),
      onHistoryOpen: () => { sync(s); s.timeline.flush(); },
      requestHistory: () => historySnapshot(s),
      previewHistory: index => historyPreview(s, index),
      changeHistory: index => historyChange(s, index),
      revertHistory: index => historyRevert(s, index),
    });
    if (typeof createTokenCounter === "function") {
      try {
        s.tokenCounter = createTokenCounter({
          document: doc, source, mount: s.window.tokenMount, clock: win,
          read: () => ({ text: s.window.textarea.value, identity: s.logicalKey, composing: s.composing }),
          isActive: () => sessions.get(s.id) === s && s.window.textarea.isConnected && !doc.hidden,
        });
      } catch (error) { console.warn("[ST-QuickBar] 编辑器 token 计数初始化失败", error); }
    }
    toolTargets.set(s.window.textarea, {
      target: s.window.textarea,
      isValid: () => valid(s),
      canEdit: () => canEdit(s),
      replace: edit => applyEdit(s, edit),
      history: direction => runHistory(s, direction),
      find: options => showFindReplace(s, options),
      getHistoryState: () => getHistoryState(s),
    });
    s.lastSelection = adapter.getSelection() || { from: 0, to: 0 };
    s.tools = createFloatingEditorTools({
      window: s.window, isCss: source.id === "customCSS",
      onUndo: () => { if (sessions.get(s.id) === s) runHistory(s, "undo"); },
      onRedo: () => { if (sessions.get(s.id) === s) runHistory(s, "redo"); },
      onColor: () => { if (sessions.get(s.id) === s) showColorPicker(s); },
      canEdit: () => sessions.get(s.id) === s && canEdit(s),
      onFind: options => showFindReplace(s, options),
      onSave: presetDraft ? () => savePresetDraft(s) : undefined,
    });
    s.window.element.addEventListener("keydown", event => {
      if (event.target !== s.window.textarea || !(event.ctrlKey || event.metaKey) || event.altKey ||
          event.isComposing || s.composing || event.keyCode === 229) return;
      const key = event.key.toLowerCase();
      if (key === "s" && !event.shiftKey && s.presetDraft) {
        event.preventDefault(); event.stopImmediatePropagation();
        savePresetDraft(s); return;
      }
      if (key !== "z" && key !== "y") return;
      event.preventDefault(); event.stopImmediatePropagation();
      if (sessions.get(s.id) === s) runHistory(s, key === "y" || event.shiftKey ? "redo" : "undo");
    }, true);
    s.window.element.addEventListener("pointerdown", () => { if (sessions.get(s.id) === s) setActive(s.id); }, true);
    s.window.element.addEventListener("focusin", () => { if (sessions.get(s.id) === s) setActive(s.id); });

    win.jQuery?.(s.window.textarea).on("input.ihFloatingEditor", event => {
      if (!event.originalEvent && sessions.get(s.id) === s) write(s, s.window.textarea.value);
    });
    const jqSource = !characterDraft && !presetDraft && win.jQuery?.(s.source);
    if (jqSource) {
      const onInput = event => { if (!event.originalEvent) queueSync(s); };
      jqSource.on("input.ihFloatingEditor change.ihFloatingEditor", onInput);
      s.stopSource = () => jqSource.off("input.ihFloatingEditor change.ihFloatingEditor", onInput);
    }
    s.window.textarea.addEventListener("blur", () => {
      if (sessions.get(s.id) === s && !s.composing) {
        s.timeline.flush();
        if (s.characterDraft) scheduleCharacterSave(s, 0);
      }
    });
    s.window.textarea.addEventListener("beforeinput", () => {
      if (sessions.get(s.id) === s && !s.composing) { sync(s); s.beforeSelection = selectedRange(s); }
    });
    if (maximize.hasAttribute("data-tab")) {
      s.window.textarea.addEventListener("keydown", event => {
        if (event.key !== "Tab" || event.ctrlKey || event.metaKey || event.altKey ||
          event.isComposing || s.composing || s.window.textarea.readOnly) return;
        event.preventDefault();
        const field = s.window.textarea;
        const start = field.selectionStart;
        const end = field.selectionEnd;
        const text = field.value;
        if (!event.shiftKey && !text.slice(start, end).includes("\n")) {
          field.setRangeText("\t", start, end, "end");
        } else {
          const lineStart = text.lastIndexOf("\n", start - 1) + 1;
          const selected = text.slice(lineStart, end);
          const lines = selected.split("\n");
          const changed = lines.map(line => event.shiftKey ? line.replace(/^\t|^ {1,4}/, "") : `\t${line}`);
          const replacement = changed.join("\n");
          const firstDelta = changed[0].length - lines[0].length;
          field.setRangeText(replacement, lineStart, end, "preserve");
          field.setSelectionRange(Math.max(lineStart, start + firstDelta), Math.max(lineStart, end + replacement.length - selected.length));
        }
        field.dispatchEvent(new win.Event("input", { bubbles: true }));
      });
    }
    const selection = adapter.getSelection();
    if (selection) s.window.textarea.setSelectionRange(selection.from, selection.to);
    s.window.setReadOnly(adapter.isReadOnly());
    updateTools(s);
    s.window.setStatus(source.id === "customCSS"
      ? "实时生效 · Ctrl/⌘+Alt+Backspace 恢复打开时内容"
      : "实时同步 · 关闭不撤销修改");
    if (characterDraft) {
      s.window.element.classList.add("is-character-draft");
      loadCharacterDraft(s);
    }
    if (presetDraft) { s.window.element.classList.add("is-preset-draft"); updatePresetDraft(s); }
    s.button?.setAttribute("aria-pressed", "true");
    updateCapacityHints();
    setActive(s.id);
    ensurePolling();
    startThemeTracking();
    if (themeObserver && s.source.isConnected) themeObserver.observe(s.source, { attributes: true, attributeFilter: ["style", "class"] });
    syncTheme(s);
    s.window.focus();
    return s;
  }

  function detachButton(maximize, button) {
    const pair = button.parentElement;
    if (ownedPairs.has(pair) && pair?.matches(PAIR) && maximize.parentElement === pair && pair.parentNode) {
      pair.replaceWith(maximize);
    } else {
      button.remove();
      if (pair?.matches(PAIR) && !pair.childElementCount) pair.remove();
    }
  }

  function styleLauncher(maximize, button) {
    const external = maximize.hasAttribute(EXTENSION_EDITOR_TARGET);
    const classes = external
      ? ["right_menu_button", "menu_button"].filter(name => maximize.classList.contains(name))
      : [...maximize.classList].filter(name =>
          name !== "editor_maximize" && !name.startsWith("fa-") && name !== "fa" &&
          name !== "fas" && name !== "far" && !name.startsWith("ih-floating-editor"));
    if (external) classes.push("ih-floating-editor-launch--external");
    for (const name of ["fa-fw", "fa-lg", "fa-sm", "fa-xs", "fa-2xs", "fa-xl", "fa-2xl"]) {
      if (maximize.classList.contains(name)) classes.push(name);
    }
    const className = ["ih-floating-editor-launch", "fa-solid", "fa-up-right-from-square", ...classes].join(" ");
    if (button.className !== className) button.className = className;
  }

  function ensureLauncher(maximize) {
    if (!maximize.isConnected || !maximize.matches(MAXIMIZE)) return;
    maximizers.add(maximize);
    const source = resolveSource(maximize);
    if (!source) return;
    let button = buttons.get(maximize);
    if (!button) {
      button = doc.createElement("i");
      bindFloatingEditorInteractionBoundary(button);
      button.tabIndex = 0;
      button.setAttribute("role", "button");
      button.title = "悬浮编辑";
      button.setAttribute("aria-label", "悬浮编辑");
      button.setAttribute("aria-pressed", "false");
      button.addEventListener("click", event => {
        event.preventDefault();
        event.stopPropagation();
        open(maximize);
      });
      button.addEventListener("keydown", event => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        event.stopPropagation();
        button.click();
      });
      buttons.set(maximize, button);
      ownedButtons.add(button);
    }
    styleLauncher(maximize, button);
    if (maximize.hasAttribute(EXTENSION_EDITOR_TARGET)) {
      const oldPair = maximize.parentElement;
      if (ownedPairs.has(oldPair) && oldPair.matches(PAIR)) oldPair.replaceWith(maximize);
      if (maximize.previousElementSibling !== button) maximize.before(button);
      return;
    }
    let pair = maximize.parentElement;
    if (!pair.matches(PAIR)) {
      pair = doc.createElement("span");
      pair.className = "ih-floating-editor-actions-pair";
      ownedPairs.add(pair);
      maximize.before(pair);
      pair.append(button, maximize);
    } else {
      ownedPairs.add(pair);
      if (maximize.previousElementSibling !== button) maximize.before(button);
    }
  }

  function cleanupLaunchers() {
    for (const maximize of maximizers) {
      const source = resolveSource(maximize);
      if (!source) {
        const button = buttons.get(maximize);
        if (button) { detachButton(maximize, button); buttons.delete(maximize); }
        if (!maximize.isConnected || !maximize.matches(MAXIMIZE)) maximizers.delete(maximize);
      }
    }
  }

  function discover(root) {
    if (root !== doc && (!root.isConnected || root.closest?.(".ih-floating-editor"))) return;
    const removeClone = button => { if (!ownedButtons.has(button)) button.remove(); };
    if (root.matches?.(LAUNCH)) removeClone(root);
    root.querySelectorAll?.(LAUNCH).forEach(removeClone);
    if (root.matches?.(MAXIMIZE)) ensureLauncher(root);
    root.querySelectorAll?.(MAXIMIZE).forEach(ensureLauncher);
  }

  function flushDiscovery() {
    scanFrame = 0;
    if (!running || !isEnabled()) return;
    cleanupLaunchers();
    const roots = [...pendingRoots];
    pendingRoots.clear();
    for (const root of roots) {
      if (!roots.some(other => other !== root && other.contains(root))) discover(root);
    }
    if (retryUnresolved) {
      retryUnresolved = false;
      for (const maximize of maximizers) if (!buttons.has(maximize)) ensureLauncher(maximize);
    }
  }

  function scheduleDiscovery(root) {
    if (root) pendingRoots.add(root);
    if (!scanFrame && running) scanFrame = win.requestAnimationFrame(flushDiscovery);
  }

  function queueSync(s) {
    if (!s || s.writing || s.invalid || s.syncQueued) return;
    s.syncQueued = true;
    win.queueMicrotask(() => { s.syncQueued = false; if (sessions.get(s.id) === s) sync(s); });
  }

  function isSourceEventFor(s, target) {
    if (!s || s.characterDraft || s.presetDraft || !target?.closest) return false;
    const source = s.source;
    if (target === source || source.contains(target)) return true;
    const cm = target.closest(".cm-editor");
    return !!cm && resolveCodeMirrorForSource(source)?.dom === cm;
  }

  function inAnyWindow(target) {
    for (const s of sessions.values()) if (s.window.element.contains(target)) return true;
    return false;
  }

  function onSourceEvent(event) {
    if (!sessions.size || inAnyWindow(event.target)) return;
    const target = event.target;
    if (target.matches?.("#themes")) scheduleThemeSync();
    const shared = target.matches?.(
      "#world_editor_select, #themes, #avatar_url_pole, " + PRESET_SELECTORS.join(", ")
    );
    for (const s of sessions.values()) {
      if (s.writing || s.invalid) continue;
      if (isSourceEventFor(s, target) || shared) queueSync(s);
    }
  }

  function onComposition(event) {
    if (!sessions.size || inAnyWindow(event.target)) return;
    const target = event.target;
    const cm = target.closest?.(".cm-editor");
    for (const s of sessions.values()) {
      if (s.characterDraft || s.presetDraft) continue;
      if (target === s.source ||
        (cm && (cm.previousElementSibling === s.source || cm.nextElementSibling === s.source ||
          cm.parentElement?.previousElementSibling === s.source))) {
        s.sourceComposing = event.type === "compositionstart";
        updateTools(s);
        if (!s.sourceComposing) queueSync(s);
      }
    }
  }

  function onKey(event) {
    if (!sessions.size || !(event.ctrlKey || event.metaKey) || !event.altKey || event.isComposing) return;
    let target = null;
    for (const s of sessions.values()) if (s.window.element.contains(doc.activeElement)) { target = s; break; }
    target = target || activeSession();
    if (!target) return;
    if (event.key === "Backspace" && target.identity.kind === "css") {
      event.preventDefault(); event.stopImmediatePropagation(); restore(target);
    } else if (event.key === "Escape") {
      event.preventDefault(); event.stopImmediatePropagation(); closeSession(target);
    }
  }

  function syncTheme(only) {
    if (!sessions.size) return;
    const apply = s => {
      const source = s.source;
      const dialog = source.closest("dialog");
      s.window.setThemeSource(source.isConnected && (!dialog || dialog.open) ? source : null);
    };
    if (only) apply(only);
    else for (const s of sessions.values()) apply(s);
  }

  function scheduleThemeSync() {
    if (!sessions.size || themeFrame) return;
    themeFrame = win.requestAnimationFrame(() => {
      themeFrame = 0;
      if (!sessions.size) return;
      for (const s of sessionList()) sync(s);
      syncTheme();
    });
  }

  function onStylesheetLoad(event) {
    if (event.target.matches?.('link[rel="stylesheet"]')) scheduleThemeSync();
  }

  function startThemeTracking() {
    if (themeObserver) return;
    themeObserver = new win.MutationObserver(mutations => {
      if (mutations.some(m => m.type === "attributes" ||
        m.target.nodeName === "STYLE" || m.target.parentElement?.nodeName === "STYLE" ||
        [...m.addedNodes, ...m.removedNodes].some(node => node.nodeType === 1 && node.matches("style, link[rel='stylesheet']")))) scheduleThemeSync();
    });
    themeObserver.observe(doc.documentElement, { attributes: true, attributeFilter: ["style", "class"] });
    themeObserver.observe(doc.body, { attributes: true, attributeFilter: ["style", "class"] });
    themeObserver.observe(doc.head, { childList: true, subtree: true, characterData: true,
      attributes: true, attributeFilter: ["href", "media", "disabled"] });
    for (const s of sessions.values()) {
      if (s.source.isConnected) themeObserver.observe(s.source, { attributes: true, attributeFilter: ["style", "class"] });
    }
    doc.addEventListener("load", onStylesheetLoad, true);
  }

  function stopThemeTracking() {
    themeObserver?.disconnect();
    themeObserver = null;
    win.cancelAnimationFrame(themeFrame);
    themeFrame = 0;
    doc.removeEventListener("load", onStylesheetLoad, true);
  }

  function stopObserving() {
    observer?.disconnect();
    observing = false;
    win.cancelAnimationFrame(scanFrame);
    scanFrame = 0;
    pendingRoots.clear();
    retryUnresolved = false;
  }

  function refresh() {
    if (!running) return;
    if (!isEnabled()) {
      if (!closeAll()) return;
      stopObserving();
      for (const [maximize, button] of buttons) detachButton(maximize, button);
      buttons.clear();
      maximizers.clear();
      return;
    }
    cleanupLaunchers();
    discover(doc);
    if (!observing) {
      observer.observe(doc.body, { childList: true, subtree: true, attributes: true,
        attributeFilter: ["data-for", EXTENSION_EDITOR_TARGET, EXTENSION_EDITOR_KEY, EXTENSION_EDITOR_TITLE,
          "id", "type", "actiontype", "open", "disabled", "readonly", "uid", "contenteditable"] });
      observing = true;
    }
    for (const s of sessionList()) sync(s);
    syncTheme();
  }

  function refreshTokenCounts(options) {
    for (const s of sessions.values()) s.tokenCounter?.refresh(options);
  }

  function onBeforeUnload(event) {
    if (!sessionList().some(s => s.characterDraft?.saving || s.presetDraft?.saving || hasRecoverableDraft(s))) return;
    event.preventDefault();
    event.returnValue = "";
  }

  function start() {
    if (running) return;
    running = true;
    observer = new win.MutationObserver(mutations => {
      if (!isEnabled()) return;
      const dirty = new Set();
      for (const m of mutations) {
        if (m.target.closest?.(".ih-floating-editor")) continue;
        if (m.type === "attributes") {
          const target = m.target;
          if (m.attributeName === EXTENSION_EDITOR_TARGET ||
              (m.attributeName === "data-for" && (target.matches(".editor_maximize") || maximizers.has(target)))) {
            scheduleDiscovery(target);
          } else if (["id", "type", "contenteditable", EXTENSION_EDITOR_KEY].includes(m.attributeName) &&
              (target.matches(EDITABLE) || m.attributeName === "contenteditable")) {
            retryUnresolved = true;
            scheduleDiscovery();
          }
          for (const s of sessions.values()) {
            if (target === s.source || target.contains(s.source) || target === s.maximize ||
                target === s.identity.entry || target === s.identity.dialog) dirty.add(s);
          }
          continue;
        }
        for (const node of m.addedNodes) {
          if (node.nodeType !== 1 || node.closest?.(".ih-floating-editor")) continue;
          if (ownedButtons.has(node) || ownedPairs.has(node)) continue;
          if (buttons.has(node) && node.previousElementSibling === buttons.get(node) &&
              (node.parentElement.matches(PAIR) || node.hasAttribute(EXTENSION_EDITOR_TARGET))) continue;
          if (node.matches(MAXIMIZE + ", " + LAUNCH + ", " + PAIR) || node.querySelector(MAXIMIZE + ", " + LAUNCH)) scheduleDiscovery(node);
          if (node.matches(EDITABLE) || node.querySelector(EDITABLE)) {
            retryUnresolved = true;
            scheduleDiscovery();
          }
          if (node.matches(".cm-editor, .codemirror-host, .bai-bai-toolkit-description-codemirror-editor, .bai-bai-toolkit-custom-css-codemirror-editor")) {
            for (const s of sessions.values()) dirty.add(s);
          }
        }
        for (const node of m.removedNodes) {
          if (node.nodeType !== 1 || node.isConnected) continue;
          if (node.matches(EDITABLE) || node.querySelector(EDITABLE)) scheduleDiscovery();
          for (const s of sessions.values()) {
            if (node === s.source || node.contains(s.source) ||
                node === s.maximize || node.contains(s.maximize)) dirty.add(s);
          }
          if (node.matches(MAXIMIZE + ", " + LAUNCH + ", " + PAIR) || node.querySelector(MAXIMIZE + ", " + LAUNCH)) {
            scheduleDiscovery();
            for (const [maximize, button] of buttons) {
              if (maximize.isConnected && !button.isConnected) scheduleDiscovery(maximize);
            }
          }
        }
      }
      for (const s of dirty) queueSync(s);
    });
    doc.addEventListener("input", onSourceEvent, true);
    doc.addEventListener("change", onSourceEvent, true);
    doc.addEventListener("compositionstart", onComposition, true);
    doc.addEventListener("compositionend", onComposition, true);
    doc.addEventListener("keydown", onKey, true);
    win.addEventListener("beforeunload", onBeforeUnload);
    win.addEventListener("online", retryPendingCharacterSaves);
    refresh();
  }

  function destroy() {
    if (!closeAll()) return false;
    running = false;
    stopObserving();
    observer = null;
    for (const [maximize, button] of buttons) detachButton(maximize, button);
    buttons.clear();
    maximizers.clear();
    doc.removeEventListener("input", onSourceEvent, true);
    doc.removeEventListener("change", onSourceEvent, true);
    doc.removeEventListener("compositionstart", onComposition, true);
    doc.removeEventListener("compositionend", onComposition, true);
    doc.removeEventListener("keydown", onKey, true);
    win.removeEventListener("beforeunload", onBeforeUnload);
    win.removeEventListener("online", retryPendingCharacterSaves);
    return true;
  }

  return {
    start, refresh, syncTheme, open, close, closeAll, flushAndCloseAll, destroy, refreshTokenCounts,
    getToolTarget: element => toolTargets.get(element) || null,
    get active() { return activeSession(); },
    get sessions() { return sessionList(); },
    get count() { return sessions.size; },
    get max() { return MAX_WINDOWS; },
  };
}
