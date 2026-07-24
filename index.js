import {
  chat,
  characters,
  this_chid,
  name1,
  event_types,
  eventSource,
  Generate,
  saveSettingsDebounced,
  getRequestHeaders,
  openCharacterChat,
} from "../../../../script.js";
import { extension_settings } from "../../../extensions.js";
import { power_user } from "../../../power-user.js";
import { executeSlashCommandsWithOptions } from "../../../slash-commands.js";

const extensionName = "ST-QuickBar";
const extensionFolderPath = `scripts/extensions/third-party/${extensionName}`;

const BUTTON_DEFS = {
  undo: { label: "撤回", icon: "fa-solid fa-rotate-left", text: null },
  redo: { label: "重做", icon: "fa-solid fa-rotate-right", text: null },
  shift: {
    label: "选中模式",
    icon: "fa-solid fa-up-down-left-right",
    text: null,
  },
  scrollToTop: {
    label: "跳转聊天顶部",
    icon: "fa-solid fa-angles-up",
    text: null,
  },
  scrollToLastAi: {
    label: "跳转AI消息顶部",
    icon: "fa-solid fa-arrow-up",
    text: null,
  },
  scrollToBottom: {
    label: "跳转聊天底部",
    icon: "fa-solid fa-arrow-down",
    text: null,
  },
  prevAiMsg: {
    label: "上一条AI消息",
    icon: "fa-solid fa-chevron-up",
    text: null,
  },
  nextAiMsg: {
    label: "下一条AI消息",
    icon: "fa-solid fa-chevron-down",
    text: null,
  },
  pagingMode: {
    label: "翻页模式",
    icon: "fa-solid fa-book-open",
    text: null,
  },
  autoScroll: {
    label: "自动滚动",
    icon: "fa-solid fa-gauge-high",
    text: null,
  },
  deleteLastMsg: {
    label: "删除最后消息",
    icon: "fa-solid fa-trash",
    text: null,
  },
  deleteLastSwipe: {
    label: "删除当前备选",
    icon: "fa-solid fa-scissors",
    text: null,
  },
  continueReply: {
    label: "继续回复",
    icon: "fa-solid fa-forward",
    text: null,
  },
  editLastMsg: {
    label: "编辑最后消息",
    icon: "bi bi-pencil-fill",
    text: null,
  },
  generateSwipe: {
    label: "生成备选回复",
    icon: "fa-solid fa-shuffle",
    text: null,
  },
  regenerateReply: {
    label: "重新生成",
    icon: "fa-solid fa-rotate",
    text: null,
  },
  chatUndo: {
    label: "撤回删除",
    icon: "fa-solid fa-trash-arrow-up",
    text: null,
  },
  hideManager: {
    label: "消息管理",
    icon: "fa-solid fa-ghost",
    text: null,
  },
  findReplace: {
    label: "查找替换",
    icon: "fa-solid fa-magnifying-glass",
    text: null,
  },
  openQRAssistant: {
    label: "QR助手面板",
    icon: "fa-solid fa-rocket",
    text: null,
  },
  openChatU8: {
    label: "智绘姬面板",
    icon: "fa-solid fa-paintbrush",
    text: null,
  },
  switchPanelProfile: {
    label: "切换面板方案",
    icon: "fa-solid fa-layer-group",
    text: null,
  },
  bottomNavMode: {
    label: "底部跳转模式",
    icon: "fa-solid fa-angle-double-down",
    text: null,
  },
  includeUserNavMode: {
    label: "包含用户消息导航",
    icon: "fa-solid fa-arrows-up-down",
    text: null,
  },
  enterDeleteMode: {
    label: "进入删除模式",
    icon: "fa-solid fa-trash-can",
    text: null,
  },
  copyText: { label: "复制", icon: "fa-solid fa-copy", text: null },
  pasteText: { label: "粘贴", icon: "fa-solid fa-paste", text: null },
  wrapToggle: {
    label: "选中包裹模式",
    icon: "fa-solid fa-object-group",
    text: null,
  },
  asterisk: { label: "双星号", icon: null, text: "**" },
  quotes: { label: "双引号", icon: null, text: '""' },
  parentheses: { label: "圆括号", icon: null, text: "()" },
  bookQuotes1: { label: "直角引号「」", icon: null, text: "「」" },
  bookQuotes2: { label: "直角引号『』", icon: null, text: "『』" },
  bookQuotes3: { label: "书名号《》", icon: null, text: "《》" },
  newline: { label: "换行", icon: "fa-solid fa-turn-down", text: null },
  user: { label: "用户标记 {{user}}", icon: "fa-solid fa-user", text: null },
  char: { label: "角色标记 {{char}}", icon: "fa-solid fa-robot", text: null },
  cursorLeft: {
    label: "光标左移",
    icon: "fa-solid fa-caret-left",
    text: null,
  },
  cursorRight: {
    label: "光标右移",
    icon: "fa-solid fa-caret-right",
    text: null,
  },
  chatManager: {
    label: "聊天管理器",
    icon: "fa-solid fa-address-book",
    text: null,
  },
  chatNew: { label: "新建聊天", icon: "fa-solid fa-comments", text: null },
  chatRename: {
    label: "重命名聊天",
    icon: "fa-solid fa-pen-to-square",
    text: null,
  },
  chatDelete: {
    label: "删除聊天",
    icon: "fa-solid fa-comment-slash",
    text: null,
  },
  chatClose: { label: "关闭聊天", icon: "fa-solid fa-xmark", text: null },
  quickHide: {
    label: "快速隐藏",
    icon: "fa-solid fa-eye-low-vision",
    text: null,
  },
  sendStop: {
    label: "发送/中止",
    icon: "fa-solid fa-paper-plane",
    text: null,
  },
  resetFloatingBall: {
    label: "重置悬浮球位置",
    icon: "fa-solid fa-arrows-to-dot",
    text: null,
  },
  colorPicker: {
    label: "取色器",
    icon: "fa-solid fa-eye-dropper",
    text: null,
  },
};

const ALL_BUTTON_KEYS = Object.keys(BUTTON_DEFS);
const INPUT_BUTTON_KEYS = new Set([
  "undo",
  "redo",
  "shift",
  "asterisk",
  "quotes",
  "parentheses",
  "bookQuotes1",
  "bookQuotes2",
  "bookQuotes3",
  "newline",
  "user",
  "char",
  "copyText",
  "pasteText",
  "cursorLeft",
  "cursorRight",
]);

function isInputButton(key) {
  if (INPUT_BUTTON_KEYS.has(key)) return true;
  if (key.startsWith("custom_")) return true;
  return false;
}

function ensureFeatherLoaded() {
  if (window.feather) return;
  if (window._ihFeatherLoading) return;
  window._ihFeatherLoading = true;
  const s = document.createElement("script");
  s.src =
    "https://cdn.jsdelivr.net/npm/feather-icons@4.29.2/dist/feather.min.js";
  s.async = true;
  s.onload = function () {
    window._ihFeatherLoading = false;
    try {
      sendStopController._update();
    } catch (e) {}
  };
  s.onerror = function () {
    window._ihFeatherLoading = false;
  };
  document.head.appendChild(s);
}

function ensureBootstrapIconsLoaded() {
  if (document.getElementById("ih-bootstrap-icons-css")) return;
  const link = document.createElement("link");
  link.id = "ih-bootstrap-icons-css";
  link.rel = "stylesheet";
  link.href =
    "https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css";
  document.head.appendChild(link);
}

function getFeatherSendSvg() {
  try {
    if (window.feather && window.feather.icons && window.feather.icons.send) {
      return window.feather.icons.send.toSvg({
        width: "1em",
        height: "1em",
        "stroke-width": 2,
      });
    }
  } catch (e) {}
  return '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-send"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 15 22 2"></polygon></svg>';
}

let _lastFocusedEditable = null;
let _savedRange = null;
let _lastFocusedForScroll = null;
function isEditableElement(el) {
  if (!el || !el.tagName) return false;
  const tag = el.tagName;
  if (tag === "TEXTAREA") return true;
  if (tag === "INPUT") {
    const type = (el.type || "text").toLowerCase();
    return [
      "text",
      "search",
      "url",
      "email",
      "tel",
      "password",
      "number",
    ].includes(type);
  }
  if (el.isContentEditable) return true;
  return false;
}

function shouldIgnoreFocusedElement(el) {
  if (!el) return true;
  try {
    const $el = $(el);
    if (
      $el.closest(
        ".ih-dialog-overlay, .input-helper-settings, #input_helper_toolbar, " +
          ".ih-find-bar, .ih-folder-dropdown-portal, .ih-floating-panel, " +
          ".shortcut-input",
      ).length
    )
      return true;
  } catch (e) {}
  return false;
}

function getInsertionTarget() {
  const editingTextarea = $("#chat .mes textarea:visible").first();
  if (editingTextarea.length) return editingTextarea[0];

  if (_lastFocusedEditable) {
    try {
      const ownerDoc = _lastFocusedEditable.ownerDocument;
      if (ownerDoc && ownerDoc.contains(_lastFocusedEditable)) {
        return _lastFocusedEditable;
      }
    } catch (e) {}
    _lastFocusedEditable = null;
  }
  return getMessageInput()[0];
}

function getCodeMirrorView(el) {
  if (!el) return null;
  let node = el;
  while (node) {
    try {
      if (
        node.classList &&
        node.classList.contains("cm-content") &&
        node.cmView
      ) {
        const v =
          node.cmView.view ||
          (node.cmView.rootView && node.cmView.rootView.view);
        if (v) return v;
      }
      if (node.classList && node.classList.contains("cm-editor")) {
        const content = node.querySelector(".cm-content");
        if (content && content.cmView) {
          const v =
            content.cmView.view ||
            (content.cmView.rootView && content.cmView.rootView.view);
          if (v) return v;
        }
        return null;
      }
    } catch (e) {
      return null;
    }
    node = node.parentElement;
  }
  return null;
}

function isExternalTarget(el) {
  if (!el) return false;
  return el !== getMessageInput()[0];
}

const defaultSettings = {
  enabled: true,
  confirmDangerousActions: false,
  toolbarPinned: false,
  toolbarBtnSize: 12,
  lastSeenChangelogVersion: "",
  autoScrollSpeed: 50,
  pagingScrollRatio: 0.93,
  autoScrollToAiOnStream: false,
  lockScrollOnGeneration: false,
  twoRowMode: false,
  twoRowOrder: "input-first",
  bottomNavMode: false,
  colorPicker: { x: null, y: null, width: 0, height: 0 },
  floatingPanel: {
    enabled: false,
    orientation: "vertical",
    displayMode: "ball",
    buttons: [],
    position: { x: null, y: null },
    ballImage: "",
    ballSize: 48,
    ballImageExpanded: "",
    ballShape: "circle",
    transparentBall: false,
    buttonSize: 12,
    panelWidth: 0,
    panelMaxHeight: 0,
    followTheme: true,
    ballProfiles: [],
    currentProfileIndex: -1,
    panelProfiles: [],
    currentPanelProfileIndex: -1,
    autoHide: false,
  },
  buttons: Object.fromEntries(
    ALL_BUTTON_KEYS.map((k) => [
      k,
      k === "scrollToTop" ||
      k === "scrollToLastAi" ||
      k === "scrollToBottom" ||
      k === "deleteLastMsg" ||
      k === "deleteLastSwipe" ||
      k === "continueReply" ||
      k === "editLastMsg" ||
      k === "regenerateReply" ||
      k === "generateSwipe" ||
      k === "chatUndo" ||
      k === "prevAiMsg" ||
      k === "nextAiMsg" ||
      k === "pagingMode" ||
      k === "autoScroll" ||
      k === "findReplace" ||
      k === "openQRAssistant" ||
      k === "openChatU8" ||
      k === "switchPanelProfile" ||
      k === "bottomNavMode" ||
      k === "includeUserNavMode" ||
      k === "enterDeleteMode" ||
      k === "copyText" ||
      k === "pasteText" ||
      k === "chatManager" ||
      k === "chatNew" ||
      k === "chatRename" ||
      k === "chatDelete" ||
      k === "chatClose" ||
      k === "cursorLeft" ||
      k === "cursorRight" ||
      k === "quickHide" ||
      k === "sendStop" ||
      k === "resetFloatingBall" ||
      k === "colorPicker"
        ? false
        : true,
    ]),
  ),
  shortcuts: Object.fromEntries(ALL_BUTTON_KEYS.map((k) => [k, ""])),
  buttonOrder: [...ALL_BUTTON_KEYS],
  customSymbols: [],
  folders: [],
  transferHistory: {},
};

const shortcutFunctionMap = {
  undo: () => historyManager.undo(),
  redo: () => historyManager.redo(),
  shift: () => shiftMode.toggle(),
  asterisk: insertAsterisk,
  quotes: insertQuotes,
  parentheses: insertParentheses,
  bookQuotes1: insertBookQuotes1,
  bookQuotes2: insertBookQuotes2,
  bookQuotes3: insertBookQuotes3,
  newline: insertNewLine,
  user: insertUserTag,
  char: insertCharTag,
  scrollToTop: doScrollToTop,
  scrollToLastAi: doScrollToLastAi,
  scrollToBottom: doScrollToBottom,
  prevAiMsg: doPrevAiMsg,
  nextAiMsg: doNextAiMsg,
  pagingMode: () => pagingController.toggle(),
  autoScroll: () => autoScrollController.toggle(),
  deleteLastMsg: doDeleteLastMsg,
  deleteLastSwipe: doDeleteLastSwipe,
  continueReply: doContinueReply,
  editLastMsg: doEditLastMsg,
  regenerateReply: doRegenerateReply,
  generateSwipe: doGenerateSwipe,
  chatUndo: () => chatUndoManager.undo(),
  hideManager: openHideManagerPanel,
  findReplace: () => findReplaceController.toggle(),
  openQRAssistant: doOpenQRAssistant,
  openChatU8: doOpenChatU8,
  switchPanelProfile: () => switchToNextPanelProfile(),
  bottomNavMode: () => bottomNavController.toggle(),
  includeUserNavMode: () => includeUserNavController.toggle(),
  wrapToggle: () => wrapModeController.toggle(),
  enterDeleteMode: () => doEnterDeleteMode(),
  copyText: () => doCopy(),
  pasteText: () => doPaste(),
  chatManager: () => doChatManager(),
  chatNew: () => doChatNew(),
  chatRename: () => doChatRename(),
  chatDelete: () => doChatDelete(),
  chatClose: () => doChatClose(),
  cursorLeft: () => doCursorLeft(),
  cursorRight: () => doCursorRight(),
  quickHide: () => quickHideController.execute(),
  sendStop: () => sendStopController.execute(),
  resetFloatingBall: () => doResetFloatingBall(),
  colorPicker: () => openColorPicker(),
};

function ihBlurToDismissKeyboard(targetEl) {
  try {
    const ae = document.activeElement;
    if (!ae) return;
    if (targetEl && ae === targetEl) return;
    if (
      ae.tagName === "TEXTAREA" ||
      ae.tagName === "INPUT" ||
      ae.isContentEditable
    ) {
      ae.blur();
    }
  } catch (e) {}
}

let _ihKeyboardLikelyVisible = false;
let _ihMaxViewportHeightForKeyboard = 0;

function ihIsMobileDevice() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent,
  );
}

function ihRefreshKeyboardVisibleState() {
  try {
    if (!window.visualViewport || !ihIsMobileDevice()) {
      _ihKeyboardLikelyVisible = false;
      return;
    }

    const vv = window.visualViewport;
    const h = vv.height || 0;

    if (h > _ihMaxViewportHeightForKeyboard) {
      _ihMaxViewportHeightForKeyboard = h;
    }

    const baseH = Math.max(
      _ihMaxViewportHeightForKeyboard || 0,
      window.innerHeight || 0,
    );

    _ihKeyboardLikelyVisible = !!(baseH && h && h < baseH - 120);
  } catch (e) {
    _ihKeyboardLikelyVisible = false;
  }
}

function ihBlurIfKeyboardAlreadyDismissed() {
  try {
    ihRefreshKeyboardVisibleState();

    if (_ihKeyboardLikelyVisible) return;

    const ae = document.activeElement;
    if (!isEditableElement(ae)) return;
    if (shouldIgnoreFocusedElement(ae)) return;

    ae.blur();
  } catch (e) {}
}

if (window.visualViewport) {
  window.visualViewport.addEventListener(
    "resize",
    ihRefreshKeyboardVisibleState,
  );
  window.visualViewport.addEventListener(
    "scroll",
    ihRefreshKeyboardVisibleState,
  );
  ihRefreshKeyboardVisibleState();
}

function ihSmoothScrollTo(el, targetTop, duration) {
  if (!el) return;
  if (duration === undefined) duration = 320;
  if (el._ihScrollRaf) {
    cancelAnimationFrame(el._ihScrollRaf);
    el._ihScrollRaf = null;
  }
  const startTop = el.scrollTop;
  const maxTop = Math.max(0, el.scrollHeight - el.clientHeight);
  const finalTop = Math.max(0, Math.min(maxTop, targetTop));
  const distance = finalTop - startTop;
  if (Math.abs(distance) < 1) {
    el.scrollTop = finalTop;
    return;
  }
  const startTime = performance.now();
  const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
  const step = (now) => {
    const elapsed = now - startTime;
    const progress = Math.min(1, elapsed / duration);
    const eased = easeOutCubic(progress);
    el.scrollTop = startTop + distance * eased;
    if (progress < 1) {
      el._ihScrollRaf = requestAnimationFrame(step);
    } else {
      el.scrollTop = finalTop;
      el._ihScrollRaf = null;
      setTimeout(() => {
        if (Math.abs(el.scrollTop - finalTop) > 2) {
          el.scrollTop = finalTop;
        }
      }, 100);
    }
  };
  el._ihScrollRaf = requestAnimationFrame(step);
}

function findActiveScrollContainer() {
  const openDialogs = document.querySelectorAll("dialog[open]");
  if (openDialogs.length > 0) {
    const dialog = openDialogs[openDialogs.length - 1];
    let start = document.activeElement;
    if (!start || !dialog.contains(start)) start = dialog;
    let el = start;
    while (el) {
      if (el.scrollHeight > el.clientHeight + 2) {
        if (el.tagName === "TEXTAREA") return el;
        const ov = getComputedStyle(el).overflowY;
        if (ov === "auto" || ov === "scroll") return el;
        if (el.tagName === "DIALOG") return el;
      }
      if (el === dialog) break;
      el = el.parentElement;
    }
    let best = dialog;
    let bestHeight = 0;
    dialog.querySelectorAll("*").forEach((c) => {
      if (c.scrollHeight > c.clientHeight + 10) {
        const ov = getComputedStyle(c).overflowY;
        if ((ov === "auto" || ov === "scroll") && c.scrollHeight > bestHeight) {
          best = c;
          bestHeight = c.scrollHeight;
        }
      }
    });
    return best;
  }

  var searchStart = document.activeElement;

  if (!isEditableElement(searchStart)) {
    if (
      _lastFocusedForScroll &&
      _lastFocusedForScroll.ownerDocument &&
      _lastFocusedForScroll.ownerDocument.contains(_lastFocusedForScroll)
    ) {
      searchStart = _lastFocusedForScroll;
    } else if (
      _lastFocusedEditable &&
      _lastFocusedEditable.ownerDocument &&
      _lastFocusedEditable.ownerDocument.contains(_lastFocusedEditable)
    ) {
      searchStart = _lastFocusedEditable;
    } else {
      searchStart = null;
    }
  }

  if (
    searchStart &&
    searchStart !== document.body &&
    searchStart.id !== "send_textarea"
  ) {
    if (
      searchStart.tagName === "TEXTAREA" &&
      searchStart.scrollHeight > searchStart.clientHeight + 2
    ) {
      return searchStart;
    }
    var el = searchStart.parentElement;
    while (el && el !== document.body) {
      if (el.id === "chat") break;
      if (el.scrollHeight > el.clientHeight + 2) {
        var ov = getComputedStyle(el).overflowY;
        if (ov === "auto" || ov === "scroll") return el;
      }
      el = el.parentElement;
    }
  }
  return document.getElementById("chat");
}

function scrollChatToElement(element, behavior = "smooth", center = false) {
  const chatEl = document.getElementById("chat");
  if (!chatEl || !element) return;
  function doScroll() {
    const chatRect = chatEl.getBoundingClientRect();
    const elemRect = element.getBoundingClientRect();
    let targetTop = chatEl.scrollTop + (elemRect.top - chatRect.top);
    if (center) {
      targetTop -= (chatEl.clientHeight - elemRect.height) / 2;
    }
    chatEl.scrollTo({ top: Math.max(0, targetTop), behavior });
  }
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      doScroll();
      setTimeout(() => {
        const chatRect = chatEl.getBoundingClientRect();
        const elemRect = element.getBoundingClientRect();
        const expectedTop = center
          ? chatRect.top + (chatEl.clientHeight - elemRect.height) / 2
          : chatRect.top;
        if (Math.abs(elemRect.top - expectedTop) > 5) {
          doScroll();
        }
      }, 250);
    });
  });
}

function ihShouldIgnoreTapTarget(target, extraClosest) {
  const $target = $(target);
  if (
    $target.is(
      "a, button, input, textarea, select, label, video, audio, iframe",
    ) ||
    $target.is(
      "[onclick], [contenteditable], [role='button'], [tabindex]:not([tabindex='-1'])",
    )
  ) {
    return true;
  }
  let closestSel =
    ".mes_buttons, .swipe_left, .swipe_right, .mes_edit_buttons, " +
    ".ih-floating-ball, .ih-floating-panel, " +
    ".qr--button, .qr--buttons";
  if (extraClosest) closestSel += ", " + extraClosest;
  if ($target.closest(closestSel).length) return true;
  if ($target.is("summary") || $target.closest("summary").length) return true;
  if (
    $target.is(".reasoning-toggle-btn") ||
    $target.closest(".reasoning-toggle-btn").length
  ) {
    return true;
  }
  if (
    $target.is(".inline-drawer-toggle, .inline-drawer-header") ||
    $target.closest(".inline-drawer-toggle, .inline-drawer-header").length
  ) {
    return true;
  }
  return false;
}

const messageNavigation = {
  _currentAiIndex: -1,
  _lastNavTime: 0,
  _pendingJump: null,

  _getAiMessages() {
    if (
      typeof includeUserNavController !== "undefined" &&
      includeUserNavController.active
    ) {
      return $("#chat .mes:visible");
    }
    return $("#chat .mes[is_user='false']:visible");
  },

  _findCurrentVisibleAiIndex() {
    const chatEl = document.getElementById("chat");
    if (!chatEl) return -1;
    const messages = this._getAiMessages();
    if (messages.length === 0) return -1;
    const chatRect = chatEl.getBoundingClientRect();
    let closestIdx = -1;
    let closestDist = Infinity;
    messages.each(function (idx) {
      const rect = this.getBoundingClientRect();
      const dist = Math.abs(rect.top - chatRect.top);
      if (dist < closestDist) {
        closestDist = dist;
        closestIdx = idx;
      }
    });
    return closestIdx;
  },

  _findCurrentBottomAlignedAiIndex() {
    const chatEl = document.getElementById("chat");
    if (!chatEl) return -1;
    const messages = this._getAiMessages();
    if (messages.length === 0) return -1;
    const chatRect = chatEl.getBoundingClientRect();
    let bestIdx = -1;
    let bestDist = Infinity;
    messages.each(function (idx) {
      const rect = this.getBoundingClientRect();
      const dist = Math.abs(rect.bottom - chatRect.bottom);
      if (dist < bestDist) {
        bestDist = dist;
        bestIdx = idx;
      }
    });
    return bestIdx;
  },

  _scrollToMsgBottom(chatEl, element) {
    requestAnimationFrame(() => {
      const rect = element.getBoundingClientRect();
      const chatRect = chatEl.getBoundingClientRect();
      let effectiveBottom = chatRect.bottom;
      const formSheld = document.getElementById("form_sheld");
      if (formSheld) {
        const formRect = formSheld.getBoundingClientRect();
        if (formRect.height > 10 && formRect.top < chatRect.bottom - 10) {
          effectiveBottom = Math.min(effectiveBottom, formRect.top - 4);
        }
      }
      const targetTop = chatEl.scrollTop + (rect.bottom - effectiveBottom);
      chatEl.scrollTo({ top: Math.max(0, targetTop), behavior: "smooth" });
    });
  },

  _getStartIndex() {
    const messages = this._getAiMessages();
    const now = Date.now();
    if (
      now - this._lastNavTime < 1500 &&
      this._currentAiIndex >= 0 &&
      this._currentAiIndex < messages.length
    ) {
      return this._currentAiIndex;
    }
    if (bottomNavController.active) {
      return this._findCurrentBottomAlignedAiIndex();
    }
    return this._findCurrentVisibleAiIndex();
  },

  goToPrev() {
    const messages = this._getAiMessages();
    if (messages.length === 0) return;
    const chatEl = document.getElementById("chat");
    if (!chatEl) return;

    if (this._pendingJump === "bottom") {
      this._pendingJump = null;
      const targetIdx = messages.length > 1 ? messages.length - 2 : 0;
      if (bottomNavController.active) {
        this._scrollToMsgBottom(chatEl, messages[targetIdx]);
      } else {
        scrollChatToElement(messages[targetIdx]);
      }
      this._currentAiIndex = targetIdx;
      this._lastNavTime = Date.now();
      return;
    }
    if (this._pendingJump === "top") {
      this._pendingJump = null;
      if (bottomNavController.active) {
        this._scrollToMsgBottom(chatEl, messages[0]);
      } else {
        scrollChatToElement(messages[0]);
      }
      this._currentAiIndex = 0;
      this._lastNavTime = Date.now();
      return;
    }

    let currentIdx = this._getStartIndex();
    const chatRect = chatEl.getBoundingClientRect();

    if (currentIdx >= 0) {
      const msgRect = messages[currentIdx].getBoundingClientRect();
      if (bottomNavController.active) {
        if (msgRect.bottom <= chatRect.bottom + 5 && currentIdx > 0) {
          currentIdx--;
        }
      } else {
        if (Math.abs(msgRect.top - chatRect.top) < 5 && currentIdx > 0) {
          currentIdx--;
        } else if (msgRect.top >= chatRect.top && currentIdx > 0) {
          currentIdx--;
        }
      }
    }
    if (currentIdx < 0) currentIdx = 0;

    if (bottomNavController.active) {
      this._scrollToMsgBottom(chatEl, messages[currentIdx]);
    } else {
      scrollChatToElement(messages[currentIdx]);
    }
    this._currentAiIndex = currentIdx;
    this._lastNavTime = Date.now();
  },

  goToNext() {
    const messages = this._getAiMessages();
    if (messages.length === 0) return;
    const chatEl = document.getElementById("chat");
    if (!chatEl) return;

    if (this._pendingJump === "top") {
      this._pendingJump = null;
      const targetIdx = messages.length > 1 ? 1 : 0;
      if (bottomNavController.active) {
        this._scrollToMsgBottom(chatEl, messages[targetIdx]);
      } else {
        scrollChatToElement(messages[targetIdx]);
      }
      this._currentAiIndex = targetIdx;
      this._lastNavTime = Date.now();
      return;
    }
    if (this._pendingJump === "bottom") {
      this._pendingJump = null;
      const targetIdx = messages.length > 1 ? messages.length - 2 : 0;
      if (bottomNavController.active) {
        this._scrollToMsgBottom(chatEl, messages[targetIdx]);
      } else {
        scrollChatToElement(messages[targetIdx]);
      }
      this._currentAiIndex = targetIdx;
      this._lastNavTime = Date.now();
      return;
    }

    let currentIdx = this._getStartIndex();
    const chatRect = chatEl.getBoundingClientRect();

    if (currentIdx >= 0) {
      const msgRect = messages[currentIdx].getBoundingClientRect();
      if (bottomNavController.active) {
        if (
          msgRect.bottom <= chatRect.bottom + 5 &&
          currentIdx < messages.length - 1
        ) {
          currentIdx++;
        }
      } else {
        if (
          msgRect.top <= chatRect.top + 5 &&
          currentIdx < messages.length - 1
        ) {
          currentIdx++;
        }
      }
    }
    if (currentIdx < 0) currentIdx = 0;
    if (currentIdx >= messages.length) currentIdx = messages.length - 1;

    if (bottomNavController.active) {
      this._scrollToMsgBottom(chatEl, messages[currentIdx]);
    } else {
      scrollChatToElement(messages[currentIdx]);
    }
    this._currentAiIndex = currentIdx;
    this._lastNavTime = Date.now();
  },
};
const quickHideController = {
  _counter: 0,
  _timer: null,
  _TIMEOUT: 5000,

  reset() {
    this._counter = 0;
    if (this._timer) {
      clearTimeout(this._timer);
      this._timer = null;
    }
    this._updateBtnState();
  },

  execute() {
    if (chat.length === 0) {
      toastr.warning("当前没有聊天消息", "", { timeOut: 800 });
      return;
    }
    this._counter++;
    const targetFloor = chat.length - this._counter;
    if (targetFloor < 0) {
      this._counter--;
      toastr.warning("已经没有更多消息可以隐藏了", "", { timeOut: 1000 });
      return;
    }
    if (this._timer) clearTimeout(this._timer);
    this._timer = setTimeout(() => {
      this.reset();
    }, this._TIMEOUT);
    executeSlashCommandsWithOptions(`/hide ${targetFloor}`);
    const msg = chat[targetFloor];
    const sender = msg ? (msg.is_user ? "用户" : msg.name || "AI") : "";
    toastr.info(
      `已隐藏倒数第${this._counter}条 (#${targetFloor} ${sender})`,
      this._counter > 1 ? "连续隐藏中…" : "",
      { timeOut: 1500 },
    );
    this._updateBtnState();
  },

  _updateBtnState() {
    const sel =
      "#input_quick_hide_btn, " +
      ".ih-folder-dropdown-portal [data-button-key='quickHide'], " +
      ".ih-floating-panel [data-button-key='quickHide']";
    $(sel).toggleClass("input-helper-btn-active", this._counter > 0);
  },
};

const sendStopController = {
  _isGeneratingNow() {
    const stopBtn = document.getElementById("mes_stop");
    return !!(stopBtn && $(stopBtn).is(":visible"));
  },

  setGenerating() {
    this._update();
    setTimeout(() => this._update(), 100);
  },

  execute() {
    if (this._isGeneratingNow()) {
      const stopBtn = document.getElementById("mes_stop");
      if (stopBtn) {
        stopBtn.click();
      } else {
        toastr.warning("找不到停止按钮", "", { timeOut: 1000 });
      }
    } else {
      const sendBtn = document.getElementById("send_but");
      if (sendBtn) {
        sendBtn.click();
      } else {
        toastr.warning("找不到发送按钮", "", { timeOut: 1000 });
      }
    }
  },

  _update() {
    const gen = this._isGeneratingNow();
    const html = gen ? '<i class="fa-solid fa-stop"></i>' : getFeatherSendSvg();
    const title = gen ? "停止生成" : "发送";
    const sel =
      "#input_send_stop_btn, " +
      ".ih-folder-dropdown-portal [data-button-key='sendStop'], " +
      ".ih-floating-panel [data-button-key='sendStop']";
    $(sel).each(function () {
      this.innerHTML = html;
      this.setAttribute("title", title);
      this.classList.toggle("input-helper-btn-active", gen);
    });
  },
};

const wrapModeController = {
  active: false,
  toggle() {
    this.active = !this.active;
    const sel =
      "#input_wrap_toggle_btn, " +
      ".ih-folder-dropdown-portal [data-button-key='wrapToggle'], " +
      ".ih-floating-panel [data-button-key='wrapToggle']";
    $(sel).toggleClass("input-helper-btn-active", this.active);
    toastr.info(
      this.active
        ? "选中包裹模式已开启：自定义按钮会包裹选中文本"
        : "选中包裹模式已关闭",
      "",
      { timeOut: 800 },
    );
  },
};

const bottomNavController = {
  active: false,
  toggle() {
    this.active = !this.active;
    try {
      getSettings().bottomNavMode = this.active;
      saveSettingsDebounced();
    } catch (e) {}
    const selector =
      "#input_bottom_nav_mode_btn, " +
      ".ih-folder-dropdown-portal [data-button-key='bottomNavMode'], " +
      ".ih-floating-panel [data-button-key='bottomNavMode']";
    $(selector).toggleClass("input-helper-btn-active", this.active);
    toastr.info(
      this.active
        ? "底部跳转模式已开启：上/下一条跳到消息底部"
        : "底部跳转模式已关闭：恢复跳到消息顶部",
      "",
      { timeOut: 1000 },
    );
  },
};
const includeUserNavController = {
  active: false,
  toggle() {
    this.active = !this.active;
    try {
      getSettings().includeUserNavMode = this.active;
      saveSettingsDebounced();
    } catch (e) {}
    const selector =
      "#input_include_user_nav_mode_btn, " +
      ".ih-folder-dropdown-portal [data-button-key='includeUserNavMode'], " +
      ".ih-floating-panel [data-button-key='includeUserNavMode']";
    $(selector).toggleClass("input-helper-btn-active", this.active);
    toastr.info(
      this.active
        ? "包含用户消息导航已开启：上/下一条会包含用户消息"
        : "包含用户消息导航已关闭：只在AI消息间跳转",
      "",
      { timeOut: 1000 },
    );
  },
};

function doEnterDeleteMode() {
  if (chat.length === 0) {
    toastr.warning("当前没有聊天消息", "", { timeOut: 800 });
    return;
  }
  const cancelBtn = document.getElementById("dialogue_del_mes_cancel");
  const inDelMode = cancelBtn && $(cancelBtn).is(":visible");
  if (inDelMode) {
    cancelBtn.click();
    toastr.info("已退出删除模式", "", { timeOut: 1000 });
  } else {
    executeSlashCommandsWithOptions("/del");
    toastr.info("已进入删除模式，再次点击退出", "", { timeOut: 1000 });
  }
  setTimeout(() => {
    const cb = document.getElementById("dialogue_del_mes_cancel");
    const isOn = cb && $(cb).is(":visible");
    const sel =
      "#input_enter_delete_mode_btn, " +
      ".ih-folder-dropdown-portal [data-button-key='enterDeleteMode'], " +
      ".ih-floating-panel [data-button-key='enterDeleteMode']";
    $(sel).toggleClass("input-helper-btn-active", !!isOn);
  }, 120);
}

const pagingController = {
  active: false,

  toggle() {
    this.active = !this.active;
    if (this.active) {
      if (
        getSettings().floatingPanel.autoHide &&
        !floatingPanelController._autoHideVisible
      ) {
        floatingPanelController._showAutoHide();
      }
    } else {
      if (
        getSettings().floatingPanel.autoHide &&
        floatingPanelController._autoHideVisible
      ) {
        floatingPanelController._hideAutoHide();
      }
    }
    $("#input_paging_mode_btn").toggleClass(
      "input-helper-btn-active",
      this.active,
    );
    $(".ih-folder-dropdown-portal [data-button-key='pagingMode']").toggleClass(
      "input-helper-btn-active",
      this.active,
    );
    $(".ih-floating-panel [data-button-key='pagingMode']").toggleClass(
      "input-helper-btn-active",
      this.active,
    );
    if (this.active) {
      this._setupTapPaging();
      const _isMob = ihIsMobileDevice();
      toastr.info(
        _isMob
          ? "翻页模式已开启，点击屏幕上/下半区翻页"
          : "翻页模式已开启，使用导航按钮或音量键翻页",
        "",
        { timeOut: 1000 },
      );
    } else {
      this._removeTapPaging();
      toastr.info("翻页模式已关闭", "", { timeOut: 1000 });
    }
  },

  _getVisibleHeight(chatEl) {
    const rect = chatEl.getBoundingClientRect();
    const visibleTop = Math.max(0, rect.top);
    const visibleBottom = Math.min(window.innerHeight, rect.bottom);
    return Math.max(visibleBottom - visibleTop, 200);
  },

  pageUp(forceEl) {
    const scrollEl = forceEl || findActiveScrollContainer();
    if (!scrollEl) return;
    const isTextLike =
      scrollEl.tagName === "TEXTAREA" || scrollEl.tagName === "INPUT";
    const pageHeight =
      this._getVisibleHeight(scrollEl) *
      (getSettings().pagingScrollRatio || 0.93);
    const newTop = Math.max(0, scrollEl.scrollTop - pageHeight);
    if (isTextLike) ihBlurToDismissKeyboard(scrollEl);
    ihSmoothScrollTo(scrollEl, newTop, 180);
  },

  pageDown(forceEl) {
    const scrollEl = forceEl || findActiveScrollContainer();
    if (!scrollEl) return;
    const isTextLike =
      scrollEl.tagName === "TEXTAREA" || scrollEl.tagName === "INPUT";
    const pageHeight =
      this._getVisibleHeight(scrollEl) *
      (getSettings().pagingScrollRatio || 0.93);
    const maxScroll = scrollEl.scrollHeight - scrollEl.clientHeight;
    const newTop = Math.min(maxScroll, scrollEl.scrollTop + pageHeight);
    if (isTextLike) ihBlurToDismissKeyboard(scrollEl);
    ihSmoothScrollTo(scrollEl, newTop, 200);
  },

  _tapTouchStart: null,
  _tapTouchMove: null,
  _tapTouchEnd: null,
  _tapClick: null,

  _setupTapPaging() {
    const chatEl = document.getElementById("chat");
    if (!chatEl) return;

    let touchStartY = 0;
    let touchMoved = false;
    let lastTouchPagingAt = 0;
    const self = this;

    function shouldIgnoreTapTarget(target) {
      return ihShouldIgnoreTapTarget(
        target,
        ".ih-folder-dropdown-portal, .ih-dialog-overlay, .ih-find-bar",
      );
    }

    function doTapPage(clientY, clientX) {
      if (!self.active) {
        return;
      }
      if (floatingPanelController._expanded) {
        const panelEl = document.querySelector(".ih-floating-panel");
        if (panelEl) {
          const panelRect = panelEl.getBoundingClientRect();
          const ballEl = document.querySelector(".ih-floating-ball");
          const ballRect = ballEl ? ballEl.getBoundingClientRect() : null;
          const inPanel =
            clientY >= panelRect.top &&
            clientY <= panelRect.bottom &&
            clientX >= panelRect.left &&
            clientX <= panelRect.right;
          const inBall =
            ballRect &&
            clientY >= ballRect.top &&
            clientY <= ballRect.bottom &&
            clientX >= ballRect.left &&
            clientX <= ballRect.right;
          if (inPanel || inBall) {
            return;
          }
        }
      }
      const chatRect = chatEl.getBoundingClientRect();
      if (clientY < chatRect.top || clientY > chatRect.bottom) {
        return;
      }
      const relativeY = clientY - chatRect.top;
      const halfHeight = chatRect.height / 2;
      if (relativeY < halfHeight) {
        self.pageUp(chatEl);
      } else {
        self.pageDown(chatEl);
      }
    }

    this._tapTouchStart = function (e) {
      if (!self.active) return;
      touchStartY = e.touches[0].clientY;
      touchMoved = false;
    };

    this._tapTouchMove = function (e) {
      if (!self.active) return;
      const y = e.touches && e.touches[0] ? e.touches[0].clientY : touchStartY;
      if (Math.abs(y - touchStartY) > 8) touchMoved = true;
    };

    this._tapTouchEnd = function (e) {
      if (!self.active) {
        return;
      }
      if (touchMoved) {
        return;
      }
      if (shouldIgnoreTapTarget(e.target)) {
        return;
      }
      const touch = e.changedTouches && e.changedTouches[0];
      if (!touch) {
        return;
      }
      lastTouchPagingAt = Date.now();
      doTapPage(touch.clientY, touch.clientX);
    };

    this._tapClick = function (e) {
      if (!self.active) return;
      if (Date.now() - lastTouchPagingAt < 450) return;
      if (shouldIgnoreTapTarget(e.target)) {
        return;
      }
      doTapPage(e.clientY, e.clientX);
    };

    chatEl.addEventListener("touchstart", this._tapTouchStart, {
      passive: true,
    });
    chatEl.addEventListener("touchmove", this._tapTouchMove, {
      passive: true,
    });
    chatEl.addEventListener("touchend", this._tapTouchEnd, {
      passive: true,
    });
    chatEl.addEventListener("click", this._tapClick, true);
  },

  _removeTapPaging() {
    const chatEl = document.getElementById("chat");
    if (!chatEl) return;
    if (this._tapTouchStart)
      chatEl.removeEventListener("touchstart", this._tapTouchStart);
    if (this._tapTouchMove)
      chatEl.removeEventListener("touchmove", this._tapTouchMove);
    if (this._tapTouchEnd)
      chatEl.removeEventListener("touchend", this._tapTouchEnd);
    if (this._tapClick)
      chatEl.removeEventListener("click", this._tapClick, true);
    this._tapTouchStart = null;
    this._tapTouchMove = null;
    this._tapTouchEnd = null;
    this._tapClick = null;
  },
};

const autoScrollController = {
  active: false,
  _paused: false,
  _isStreaming: false,
  _rafId: null,
  _lastTimestamp: null,
  _scrollAccum: 0,
  _chatEl: null,
  _boundStep: null,
  _speed: 50,
  _lastKnownScrollTop: 0,
  _lastKnownScrollEl: null,

  toggle() {
    this.active ? this.stop() : this.start();
  },

  start() {
    this.active = true;
    this._paused = false;
    this._isStreaming = false;
    this._lastTimestamp = null;
    this._scrollAccum = 0;
    this._chatEl = findActiveScrollContainer();
    this._lastKnownScrollEl = this._chatEl;
    this._lastKnownScrollTop = this._chatEl ? this._chatEl.scrollTop : 0;
    this._speed = getSettings().autoScrollSpeed || 50;
    if (!this._boundStep) {
      this._boundStep = this._step.bind(this);
    }
    this._updateActiveUI(true);
    toastr.info("自动滚动已开启，再次点击停止", "", { timeOut: 1000 });
    if (!this._chatEl) {
      toastr.warning("没有找到可滚动的目标", "", {
        timeOut: 1500,
      });
      this.active = false;
      this._updateActiveUI(false);
      return;
    }

    if (this._chatEl.scrollHeight <= this._chatEl.clientHeight) {
      toastr.warning("当前区域内容不足，无可滚动空间", "", {
        timeOut: 1500,
      });
      this.active = false;
      this._updateActiveUI(false);
      return;
    }
    this._rafId = requestAnimationFrame(this._boundStep);
  },

  stop() {
    this.active = false;
    this._paused = false;
    this._lastKnownScrollTop = 0;
    this._lastKnownScrollEl = null;
    this._cancelAnimation();
    this._updateActiveUI(false);
  },

  pause() {
    this._paused = true;
    this._cancelAnimation();
  },

  resume() {
    if (this.active) {
      if (this._rafId) {
        cancelAnimationFrame(this._rafId);
        this._rafId = null;
      }
      this._paused = false;
      this._lastTimestamp = null;
      this._scrollAccum = 0;
      this._speed = getSettings().autoScrollSpeed || 50;

      const oldEl = this._chatEl;
      const oldElAlive =
        oldEl &&
        oldEl.ownerDocument &&
        oldEl.ownerDocument.contains(oldEl) &&
        oldEl.scrollHeight > oldEl.clientHeight + 2;

      if (!oldElAlive) {
        this._chatEl = findActiveScrollContainer();
        this._lastKnownScrollEl = this._chatEl;
        this._lastKnownScrollTop = this._chatEl ? this._chatEl.scrollTop : 0;
      }

      this._rafId = requestAnimationFrame(this._boundStep);
    }
  },
  setStreaming(isStreaming) {
    this._isStreaming = isStreaming;
    if (isStreaming && this.active) {
      this.pause();
    } else if (!isStreaming && this.active) {
      this.resume();
    }
  },

  _updateActiveUI(isActive) {
    $("#input_auto_scroll_btn").toggleClass(
      "input-helper-btn-active",
      isActive,
    );
    $(".ih-folder-dropdown-portal [data-button-key='autoScroll']").toggleClass(
      "input-helper-btn-active",
      isActive,
    );
    $(".ih-floating-panel [data-button-key='autoScroll']").toggleClass(
      "input-helper-btn-active",
      isActive,
    );
  },

  _cancelAnimation() {
    if (this._rafId) {
      cancelAnimationFrame(this._rafId);
      this._rafId = null;
    }
    this._lastTimestamp = null;
    this._scrollAccum = 0;
  },

  _step(timestamp) {
    if (!this.active || this._paused || this._isStreaming) {
      this._rafId = null;
      return;
    }
    if (!this._chatEl) {
      this._chatEl = findActiveScrollContainer();
    }
    const chatEl = this._chatEl;
    if (!chatEl) {
      this._rafId = null;
      return;
    }

    const isTextLike =
      chatEl.tagName === "TEXTAREA" || chatEl.tagName === "INPUT";

    if (this._lastKnownScrollEl !== chatEl) {
      this._lastKnownScrollEl = chatEl;
      this._lastKnownScrollTop = chatEl.scrollTop;
    }

    if (
      isTextLike &&
      this._lastKnownScrollTop > 20 &&
      chatEl.scrollTop < this._lastKnownScrollTop - 20
    ) {
      chatEl.scrollTop = this._lastKnownScrollTop;

      requestAnimationFrame(() => {
        if (
          chatEl.ownerDocument?.contains(chatEl) &&
          chatEl.scrollTop < this._lastKnownScrollTop - 20
        ) {
          chatEl.scrollTop = this._lastKnownScrollTop;
        }
      });
    }
    if (!this._lastTimestamp) {
      this._lastTimestamp = timestamp;
      this._rafId = requestAnimationFrame(this._boundStep);
      return;
    }
    const elapsed = Math.min(timestamp - this._lastTimestamp, 100);
    this._lastTimestamp = timestamp;
    this._scrollAccum += this._speed * (elapsed / 1000);
    const px = Math.floor(this._scrollAccum);
    if (px >= 1) {
      this._scrollAccum -= px;
      const before = chatEl.scrollTop;
      chatEl.scrollTop += px;

      if (chatEl.scrollTop > this._lastKnownScrollTop) {
        this._lastKnownScrollTop = chatEl.scrollTop;
        this._lastKnownScrollEl = chatEl;
      }

      if (chatEl.scrollTop === before) {
        this.stop();
        toastr.info("已滚动到底部", "", { timeOut: 1000 });
        return;
      }
    }
    this._rafId = requestAnimationFrame(this._boundStep);
  },
};

const streamScrollController = {
  _shouldScroll: false,
  _isRealStream: false,
  _ready: false,
  _armTimer: null,
  _chatLengthAtStart: 0,
  _lastMesLengthAtStart: 0,

  onStreamStart(type) {
    if (!this._ready) {
      return;
    }
    if (!getSettings().autoScrollToAiOnStream) {
      return;
    }
    this._shouldScroll = true;
    this._isRealStream = false;
    this._chatLengthAtStart = chat.length;
    this._lastMesLengthAtStart =
      chat.length > 0 ? (chat[chat.length - 1].mes || "").length : 0;
  },

  onStreamToken() {
    this._isRealStream = true;
  },

  onStreamEnd() {
    if (!getSettings().autoScrollToAiOnStream) {
      this.reset();
      return;
    }
    if (!this._shouldScroll) {
      this.reset();
      return;
    }
    if (this._isRealStream) {
      this.reset();
      return;
    }
    if (scrollLockController.isActive()) {
      this.reset();
      return;
    }
    const lastMes = chat[chat.length - 1];
    const lastMesLen = lastMes ? (lastMes.mes || "").length : 0;
    const noNewMes = chat.length <= this._chatLengthAtStart;
    const noContentChange = lastMesLen === this._lastMesLengthAtStart;
    if (noNewMes && noContentChange) {
      this.reset();
      return;
    }
    if (!lastMes || lastMes.is_user) {
      this.reset();
      return;
    }
    if (lastMesLen === 0) {
      this.reset();
      return;
    }
    this.reset();
    setTimeout(() => {
      doScrollToLastAi();
    }, 400);
  },

  reset() {
    this._shouldScroll = false;
    this._isRealStream = false;
    this._chatLengthAtStart = 0;
    this._lastMesLengthAtStart = 0;
  },

  onGenerationStopped() {
    this._shouldScroll = false;
    this._isRealStream = false;
    this._chatLengthAtStart = 0;
    this._lastMesLengthAtStart = 0;
  },

  arm() {
    clearTimeout(this._armTimer);
    this._ready = false;
    this._shouldScroll = false;
    this._isRealStream = false;
    this._chatLengthAtStart = 0;
    this._armTimer = setTimeout(() => {
      this._ready = true;
    }, 3000);
  },
};

const scrollLockController = {
  _active: false,
  _chatEl: null,
  _wheelHandler: null,
  _touchHandler: null,
  _safetyTimer: null,
  _originalAutoScroll: null,

  onGenerationStart(type) {
    if (!getSettings().lockScrollOnGeneration) return;
    if (type !== "continue") return;
    const chatEl = document.getElementById("chat");
    if (!chatEl) return;
    this.release();
    this._chatEl = chatEl;
    this._active = true;

    try {
      if (
        power_user &&
        typeof power_user.auto_scroll_chat_to_bottom !== "undefined"
      ) {
        this._originalAutoScroll = power_user.auto_scroll_chat_to_bottom;
        power_user.auto_scroll_chat_to_bottom = false;
      }
    } catch (e) {
      console.warn("快捷工具栏: 无法设置 auto_scroll_chat_to_bottom", e);
    }

    this._wheelHandler = () => {
      this.release();
    };
    this._touchHandler = () => {
      this.release();
    };
    chatEl.addEventListener("wheel", this._wheelHandler, { passive: true });
    chatEl.addEventListener("touchmove", this._touchHandler, {
      passive: true,
    });

    this._safetyTimer = setTimeout(() => {
      this.release();
    }, 60000);
  },

  onGenerationEnd() {
    this.release();
  },

  isActive() {
    return this._active;
  },

  release() {
    if (!this._active) return;
    this._active = false;

    try {
      if (this._originalAutoScroll !== null && power_user) {
        power_user.auto_scroll_chat_to_bottom = this._originalAutoScroll;
      }
    } catch (e) {
      console.warn("快捷工具栏: 无法还原 auto_scroll_chat_to_bottom", e);
    }
    this._originalAutoScroll = null;

    if (this._safetyTimer) {
      clearTimeout(this._safetyTimer);
      this._safetyTimer = null;
    }
    if (this._chatEl) {
      if (this._wheelHandler)
        this._chatEl.removeEventListener("wheel", this._wheelHandler);
      if (this._touchHandler)
        this._chatEl.removeEventListener("touchmove", this._touchHandler);
    }
    this._wheelHandler = null;
    this._touchHandler = null;
    this._chatEl = null;
  },
};

const findReplaceController = {
  active: false,
  _barEl: null,
  _targetTextarea: null,
  _cmView: null,
  _matches: [],
  _currentMatchIndex: -1,
  _searchTerm: "",
  _caseSensitive: false,
  _collapsed: false,
  _liveSearchHandler: null,
  _cmInputHandler: null,

  toggle() {
    this.active ? this.close() : this.open();
  },

  open() {
    this._cmView = null;
    const editTextarea = $("#chat .mes textarea:visible").first();
    if (editTextarea.length) {
      this._targetTextarea = editTextarea;
    } else if (
      _lastFocusedEditable &&
      _lastFocusedEditable.ownerDocument &&
      _lastFocusedEditable.ownerDocument.contains(_lastFocusedEditable)
    ) {
      const cmView = getCodeMirrorView(_lastFocusedEditable);
      if (cmView) {
        this._cmView = cmView;
        this._targetTextarea = null;
      } else if (
        _lastFocusedEditable.tagName === "TEXTAREA" ||
        _lastFocusedEditable.tagName === "INPUT"
      ) {
        this._targetTextarea = $(_lastFocusedEditable);
      } else {
        this._targetTextarea = getMessageInput();
      }
    } else {
      this._targetTextarea = getMessageInput();
    }
    if (
      !this._cmView &&
      (!this._targetTextarea || !this._targetTextarea.length)
    ) {
      toastr.warning("没有可搜索的文本区域", "", { timeOut: 1000 });
      return;
    }
    this.active = true;
    this._createBar();
    this._updateActiveUI(true);
    document.body.classList.add("ih-find-active");
    setTimeout(() => {
      try {
        if (this._barEl) this._barEl.find(".ih-find-input").focus();
      } catch (e) {}
    }, 50);
  },

  close() {
    this.active = false;
    this._collapsed = false;
    if (this._searchDebounceTimer) {
      clearTimeout(this._searchDebounceTimer);
      this._searchDebounceTimer = null;
    }
    if (
      this._liveSearchHandler &&
      this._targetTextarea &&
      this._targetTextarea.length
    ) {
      try {
        this._targetTextarea[0].removeEventListener(
          "input",
          this._liveSearchHandler,
        );
      } catch (e) {}
      this._liveSearchHandler = null;
    }
    if (this._cmInputHandler && this._cmView && this._cmView.contentDOM) {
      try {
        this._cmView.contentDOM.removeEventListener(
          "input",
          this._cmInputHandler,
        );
      } catch (e) {}
      this._cmInputHandler = null;
    }
    if (this._barObserver) {
      try {
        this._barObserver.disconnect();
      } catch (e) {}
      this._barObserver = null;
    }
    if (this._focusStealGuard) {
      document.removeEventListener("focusin", this._focusStealGuard, true);
      this._focusStealGuard = null;
    }
    if (this._focusTrackHandler) {
      document.removeEventListener("focusin", this._focusTrackHandler, true);
      this._focusTrackHandler = null;
    }
    if (this._focusGuardDownHandler) {
      document.removeEventListener(
        "mousedown",
        this._focusGuardDownHandler,
        true,
      );
      document.removeEventListener(
        "touchstart",
        this._focusGuardDownHandler,
        true,
      );
      this._focusGuardDownHandler = null;
    }
    this._lastValidFocus = null;
    if (this._barEl) {
      this._barEl.remove();
      this._barEl = null;
    }
    this._targetTextarea = null;
    this._cmView = null;
    this._matches = [];
    this._currentMatchIndex = -1;
    this._searchTerm = "";
    this._lastHighlightPos = null;
    this._updateActiveUI(false);
    document.body.classList.remove("ih-find-active");
  },

  _updateActiveUI(isActive) {
    $("#input_find_replace_btn").toggleClass(
      "input-helper-btn-active",
      isActive,
    );
    $(".ih-folder-dropdown-portal [data-button-key='findReplace']").toggleClass(
      "input-helper-btn-active",
      isActive,
    );
    $(".ih-floating-panel [data-button-key='findReplace']").toggleClass(
      "input-helper-btn-active",
      isActive,
    );
  },

  _checkTarget() {
    if (this._cmView) {
      if (
        this._cmView.destroyed ||
        !this._cmView.dom ||
        !document.contains(this._cmView.dom)
      ) {
        this.close();
        toastr.warning("编辑区域已关闭", "", { timeOut: 1000 });
        return false;
      }
      return true;
    }
    if (!this._targetTextarea || !this._targetTextarea.length) {
      this.close();
      toastr.warning("编辑区域已关闭", "", { timeOut: 1000 });
      return false;
    }
    const el = this._targetTextarea[0];
    const doc = el.ownerDocument;
    if (!doc || !doc.contains(el)) {
      this.close();
      toastr.warning("编辑区域已关闭", "", { timeOut: 1000 });
      return false;
    }
    return true;
  },

  _createBar() {
    if (this._barEl) this._barEl.remove();
    const bar = $(`
            <div class="ih-find-bar" id="ih_find_bar">
                <div class="ih-find-row">
                    <div class="ih-find-input-wrap">
                        <textarea class="ih-find-input" id="ih_find_input" placeholder="查找..." rows="1"></textarea>
                        <button class="ih-find-input-fold" data-action="toggleFoldFind" title="折叠/展开" type="button"><i class="fa-solid fa-chevron-up"></i></button>
                        <button class="ih-find-input-clear" data-action="clearFind" title="清空查找内容" type="button"><i class="fa-solid fa-xmark"></i></button>
                    </div>
                    <span class="ih-find-count" id="ih_find_count"><span class="ih-find-count-cur">0</span><span class="ih-find-count-sep">/</span><span class="ih-find-count-total">0</span></span>
                    <button class="ih-find-nav-btn" data-action="prev" title="上一个 (Shift+Enter)"><i class="fa-solid fa-chevron-up"></i></button>
                    <button class="ih-find-nav-btn" data-action="next" title="下一个 (Enter)"><i class="fa-solid fa-chevron-down"></i></button>
                    <button class="ih-find-nav-btn ih-find-close-btn" data-action="close" title="关闭 (Esc)"><i class="fa-solid fa-xmark"></i></button>
                </div>
                <div class="ih-replace-row">
                    <div class="ih-find-input-wrap ih-replace-input-wrap">
  <textarea class="ih-replace-input" id="ih_replace_input" placeholder="替换为..." rows="1"></textarea>
  <button class="ih-find-input-fold" data-action="toggleFoldReplace" title="折叠/展开" type="button"><i class="fa-solid fa-chevron-up"></i></button>
  <button class="ih-find-input-clear" data-action="clearReplace" title="清空替换内容" type="button"><i class="fa-solid fa-xmark"></i></button>
</div>
                    <button class="ih-find-nav-btn ih-find-case-btn" data-action="toggleCase" title="区分大小写"><span style="font-size:11px;font-weight:bold;">Aa</span></button>
                    <button class="ih-find-action-btn" data-action="replace" title="替换当前"><i class="fa-solid fa-right-left"></i></button>
<button class="ih-find-action-btn" data-action="replaceAll" title="全部替换"><i class="fa-solid fa-repeat"></i></button>
<button class="ih-find-nav-btn ih-find-collapse-btn" data-action="toggleCollapse" title="收起到侧边/展开"><i class="fa-solid fa-angles-left ih-collapse-icon-left"></i><i class="fa-solid fa-angles-right ih-collapse-icon-right"></i></button>
                </div>
            </div>
        `);
    const openDialogs = document.querySelectorAll("dialog[open]");
    if (openDialogs.length > 0) {
      const dialogHost = openDialogs[openDialogs.length - 1];
      $(dialogHost).append(bar);
      const self = this;
      $(dialogHost).one("close", function () {
        if (self.active) self.close();
      });
    } else {
      $("body").append(bar);
    }
    this._barEl = bar;
    syncDialogTheme(bar[0]);
    generateFaIconProtectionCSS();
    const _syncClearButton = (el) => {
      if (!el) return;
      const wrap = el.closest(".ih-find-input-wrap");
      if (!wrap) return;
      wrap.classList.toggle("ih-has-value", !!el.value);
    };
    const _autoGrow = (el) => {
      if (!el) return;
      const wrap = el.closest && el.closest(".ih-find-input-wrap");
      if (wrap && wrap.classList.contains("ih-input-folded")) {
        return;
      }

      const cs = window.getComputedStyle(el);
      let lineHeight = parseFloat(cs.lineHeight);

      if (isNaN(lineHeight) || lineHeight <= 0) {
        const fontSize = parseFloat(cs.fontSize);
        lineHeight = (isNaN(fontSize) ? 13 : fontSize) * 1.5;
      }

      const paddingY =
        (parseFloat(cs.paddingTop) || 0) + (parseFloat(cs.paddingBottom) || 0);
      const borderY =
        (parseFloat(cs.borderTopWidth) || 0) +
        (parseFloat(cs.borderBottomWidth) || 0);

      const singleLineHeight = Math.ceil(lineHeight + paddingY + borderY);
      const maxHeight = 150;

      el.style.height = "auto";
      void el.offsetHeight;

      if (!el.value) {
        el.style.height = singleLineHeight + "px";
        el.scrollTop = 0;
        return;
      }

      const nextHeight = Math.min(
        Math.max(el.scrollHeight + borderY, singleLineHeight),
        maxHeight,
      );

      el.style.height = nextHeight + "px";

      if (wrap) {
        wrap.classList.toggle(
          "ih-multiline",
          nextHeight > singleLineHeight + 2,
        );
      }
    };
    bar.find('[data-action="clearFind"]').on("click", () => {
      const input = bar.find(".ih-find-input");
      const replaceInput = bar.find(".ih-replace-input");
      input.val("");
      _autoGrow(input[0]);
      _autoGrow(replaceInput[0]);
      _syncClearButton(input[0]);
      _syncClearButton(replaceInput[0]);
      input[0].focus();
      this._doSearch();
    });
    bar.find('[data-action="clearReplace"]').on("click", () => {
      const input = bar.find(".ih-replace-input");
      input.val("");
      _autoGrow(input[0]);
      _syncClearButton(input[0]);
      input[0].focus();
    });
    const _toggleFold = function (wrapEl) {
      const $wrap = $(wrapEl);
      const ta = $wrap.find("textarea")[0];
      const foldBtn = $wrap.find(".ih-find-input-fold");
      const icon = foldBtn.find("i");
      const isFolding = !$wrap.hasClass("ih-input-folded");
      $wrap.toggleClass("ih-input-folded", isFolding);
      if (isFolding) {
        icon.removeClass("fa-chevron-up").addClass("fa-chevron-down");
        if (ta) ta.style.height = "";
      } else {
        icon.removeClass("fa-chevron-down").addClass("fa-chevron-up");
        if (ta) _autoGrow(ta);
      }
    };
    bar.find('[data-action="toggleFoldFind"]').on("click", function () {
      _toggleFold($(this).closest(".ih-find-input-wrap")[0]);
    });
    bar.find('[data-action="toggleFoldReplace"]').on("click", function () {
      _toggleFold($(this).closest(".ih-find-input-wrap")[0]);
    });
    bar
      .find(".ih-find-input, .ih-replace-input")
      .each(function () {
        _autoGrow(this);
        _syncClearButton(this);
      })
      .on("input", function () {
        _autoGrow(this);
        _syncClearButton(this);
      });

    bar.find(".ih-find-input").on("input", () => {
      clearTimeout(this._searchDebounceTimer);
      this._searchDebounceTimer = setTimeout(() => {
        if (this.active) this._doSearch();
      }, 160);
    });
    bar.find('[data-action="prev"]').on("click", () => this._navigate(-1));
    bar.find('[data-action="next"]').on("click", () => this._navigate(1));
    bar.find('[data-action="toggleCase"]').on("click", () => {
      this._caseSensitive = !this._caseSensitive;
      bar
        .find(".ih-find-case-btn")
        .toggleClass("input-helper-btn-active", this._caseSensitive);
      this._doSearch();
    });
    bar.find('[data-action="close"]').on("click", () => this.close());
    bar
      .find('[data-action="toggleCollapse"]')
      .on("click", () => this._toggleCollapse());
    bar.find('[data-action="replace"]').on("click", () => this._doReplace());
    bar
      .find('[data-action="replaceAll"]')
      .on("click", () => this._doReplaceAll());
    bar.on("keydown", (e) => {
      const _isMobile = ihIsMobileDevice();
      if (e.key === "Escape") {
        e.stopPropagation();
        e.preventDefault();
        this.close();
      } else if (e.key === "Enter" && $(e.target).hasClass("ih-find-input")) {
        if (e.ctrlKey || e.metaKey) return;
        if (_isMobile) return;
        e.preventDefault();
        if (e.shiftKey) this._navigate(-1);
        else this._navigate(1);
      } else if (
        e.key === "Enter" &&
        $(e.target).hasClass("ih-replace-input")
      ) {
        if (e.ctrlKey || e.metaKey) return;
        if (_isMobile) return;
        e.preventDefault();
        this._doReplace();
      }
    });
    bar.on("mousedown", (e) => {
      e.stopPropagation();
      if (!$(e.target).closest("input, textarea").length) {
        e.preventDefault();
      }
    });
    bar.on("click", (e) => e.stopPropagation());
    bar.on("touchstart", (e) => e.stopPropagation());
    bar.on("touchend", (e) => e.stopPropagation());
    bar.on("pointerdown", (e) => e.stopPropagation());
    bar.on("pointerup", (e) => e.stopPropagation());
    if (this._targetTextarea && this._targetTextarea.length) {
      this._liveSearchHandler = this._makeLiveInputHandler();
      this._targetTextarea[0].addEventListener(
        "input",
        this._liveSearchHandler,
      );
    }
    if (this._cmView) {
      this._cmInputHandler = this._makeLiveInputHandler();
      this._cmView.contentDOM.addEventListener("input", this._cmInputHandler);
    }
    const self = this;
    this._barObserver = new MutationObserver(() => {
      if (!self.active || !self._barEl || !self._barEl[0]) return;
      const openDialogs = document.querySelectorAll("dialog[open]");
      const topHost =
        openDialogs.length > 0
          ? openDialogs[openDialogs.length - 1]
          : document.body;
      if (self._barEl[0].parentNode !== topHost) {
        topHost.appendChild(self._barEl[0]);
      }
    });
    this._barObserver.observe(document.body, {
      childList: true,
      subtree: false,
    });
    const _focusGuardLastDown = { target: null, time: 0 };
    this._focusGuardDownHandler = function (e) {
      _focusGuardLastDown.target = e.target;
      _focusGuardLastDown.time = Date.now();
    };
    document.addEventListener("mousedown", this._focusGuardDownHandler, true);
    document.addEventListener("touchstart", this._focusGuardDownHandler, {
      capture: true,
      passive: true,
    });
    const _self = this;
    this._focusTrackHandler = function (e) {
      if (!_self.active || !_self._barEl || !_self._barEl[0]) return;
      const target = e.target;
      if (!target) return;
      if (_self._barEl[0].contains(target)) {
        _self._lastValidFocus = target;
      }
    };
    document.addEventListener("focusin", this._focusTrackHandler, true);
    this._focusStealGuard = function (e) {
      if (!_self.active || !_self._barEl || !_self._barEl[0]) return;
      if (_self._suspendFocusGuard) return;
      const target = e.target;
      if (!target) return;
      if (target.id !== "send_textarea" && target.id !== "prompt_textarea")
        return;
      if (
        _focusGuardLastDown.target &&
        Date.now() - _focusGuardLastDown.time < 500
      ) {
        const dt = _focusGuardLastDown.target;
        if (dt === target || (target.contains && target.contains(dt))) return;
      }
      setTimeout(() => {
        if (!_self.active || !_self._barEl) return;
        if (_self._suspendFocusGuard) return;
        if (document.activeElement !== target) return;
        try {
          target.blur();
        } catch (err) {}
        if (
          _self._lastValidFocus &&
          _self._barEl[0].contains(_self._lastValidFocus) &&
          document.contains(_self._lastValidFocus)
        ) {
          try {
            _self._lastValidFocus.focus();
            return;
          } catch (err) {}
        }
        const findInput = _self._barEl.find(".ih-find-input");
        if (findInput && findInput.length) {
          try {
            findInput[0].focus();
          } catch (err) {}
        }
      }, 0);
    };
    document.addEventListener("focusin", this._focusStealGuard, true);
  },

  _makeLiveInputHandler() {
    const self = this;
    return function () {
      if (!self.active) return;
      if (self._isReplacing) return;
      const oldPos = self._lastHighlightPos;
      self._rebuildMatchesWithoutHighlight();
      if (self._matches.length <= 0) {
        self._currentMatchIndex = -1;
        self._updateCount();
        return;
      }
      if (oldPos !== null && oldPos !== undefined) {
        let foundIdx = -1;
        for (let i = 0; i < self._matches.length; i++) {
          if (self._matches[i] >= oldPos) {
            foundIdx = i;
            break;
          }
        }
        self._currentMatchIndex =
          foundIdx === -1 ? self._matches.length - 1 : foundIdx;
      } else {
        self._currentMatchIndex = -1;
      }
      self._updateCount();
    };
  },

  _scanMatches(text, term) {
    const searchText = this._caseSensitive ? text : text.toLowerCase();
    const searchTerm = this._caseSensitive ? term : term.toLowerCase();
    const matches = [];
    const MAX_MATCHES = 10000;
    let truncated = false;
    let pos = 0;
    while ((pos = searchText.indexOf(searchTerm, pos)) !== -1) {
      matches.push(pos);
      pos += searchTerm.length;
      if (matches.length >= MAX_MATCHES) {
        truncated = true;
        break;
      }
    }
    return { matches, truncated };
  },

  _doSearch() {
    if (this._isReplacing) return;
    try {
      const _editingTA = $("#chat .mes textarea:visible").first();
      let _candidate = null;
      if (_editingTA.length) {
        _candidate = _editingTA[0];
      } else if (
        _lastFocusedEditable &&
        _lastFocusedEditable.ownerDocument &&
        _lastFocusedEditable.ownerDocument.contains(_lastFocusedEditable) &&
        !$(_lastFocusedEditable).closest(".ih-find-bar").length
      ) {
        _candidate = _lastFocusedEditable;
      }
      if (_candidate) {
        const _curEl = this._cmView
          ? this._cmView.contentDOM
          : this._targetTextarea && this._targetTextarea[0];
        if (_candidate !== _curEl) {
          if (
            this._liveSearchHandler &&
            this._targetTextarea &&
            this._targetTextarea.length
          ) {
            try {
              this._targetTextarea[0].removeEventListener(
                "input",
                this._liveSearchHandler,
              );
            } catch (e) {}
          }
          if (this._cmInputHandler && this._cmView && this._cmView.contentDOM) {
            try {
              this._cmView.contentDOM.removeEventListener(
                "input",
                this._cmInputHandler,
              );
            } catch (e) {}
          }
          const _cm = getCodeMirrorView(_candidate);
          if (_cm) {
            this._cmView = _cm;
            this._targetTextarea = null;
            if (this._cmInputHandler) {
              _cm.contentDOM.addEventListener("input", this._cmInputHandler);
            }
          } else if (
            _candidate.tagName === "TEXTAREA" ||
            _candidate.tagName === "INPUT"
          ) {
            this._cmView = null;
            this._targetTextarea = $(_candidate);
            if (this._liveSearchHandler) {
              _candidate.addEventListener("input", this._liveSearchHandler);
            }
          }
        }
      }
    } catch (e) {}
    const term = this._barEl.find(".ih-find-input").val();
    this._searchTerm = term;
    this._matches = [];
    this._currentMatchIndex = -1;
    if (!term || !this._checkTarget()) {
      this._updateCount();
      return;
    }
    const text = this._cmView
      ? this._cmView.state.doc.toString()
      : this._targetTextarea.val();
    const _scan = this._scanMatches(text, term);
    this._matches = _scan.matches;
    if (_scan.truncated) {
      try {
        toastr.warning(
          `匹配项太多，只显示前 10000 个，建议输入更具体的关键词`,
          "",
          { timeOut: 2500 },
        );
      } catch (e) {}
    }
    if (this._matches.length > 0) {
      this._currentMatchIndex = -1;
      this._hideNoMatchHint();
    } else if (term && this._barEl) {
      this._showNoMatchHint();
    } else if (!term && this._barEl) {
      this._hideNoMatchHint();
    }
    this._hideSelectHint();
    this._updateCount();
  },

  _rebuildMatchesWithoutHighlight() {
    const term = this._barEl ? this._barEl.find(".ih-find-input").val() : "";
    this._searchTerm = term;
    this._matches = [];
    this._currentMatchIndex = -1;
    if (!term || !this._checkTarget()) {
      this._updateCount();
      this._hideNoMatchHint();
      return;
    }
    const text = this._cmView
      ? this._cmView.state.doc.toString()
      : this._targetTextarea.val();
    this._matches = this._scanMatches(text, term).matches;
    this._currentMatchIndex = -1;
    this._updateCount();
    if (this._matches.length > 0) {
      this._hideNoMatchHint();
    } else if (term) {
      this._showNoMatchHint();
    }
  },

  _toggleCollapse() {
    this._collapsed = !this._collapsed;
    if (this._barEl) {
      this._barEl.toggleClass("ih-find-bar-collapsed", this._collapsed);
    }
  },
  syncTheme() {
    if (!this.active || !this._barEl || !this._barEl[0]) return;
    try {
      syncDialogTheme(this._barEl[0]);
    } catch (e) {
      console.warn("快捷工具栏: 同步查找框主题失败", e);
    }
  },
  _navigate(direction) {
    if (this._matches.length === 0) return;
    if (!this._checkTarget()) return;
    if (this._currentMatchIndex < 0) {
      this._currentMatchIndex = direction > 0 ? 0 : this._matches.length - 1;
    } else {
      this._currentMatchIndex += direction;
      if (this._currentMatchIndex < 0)
        this._currentMatchIndex = this._matches.length - 1;
      if (this._currentMatchIndex >= this._matches.length)
        this._currentMatchIndex = 0;
    }
    this._highlightMatch(true);
    this._updateCount();
  },

  _scrollTextareaToPos(textarea, pos) {
    const fullText = textarea.value;
    const textBefore = fullText.substring(0, pos);
    const style = window.getComputedStyle(textarea);
    let targetPixelTop;
    try {
      const mirror = document.createElement("div");
      mirror.style.cssText =
        "position:absolute;visibility:hidden;pointer-events:none;" +
        "white-space:pre-wrap;word-wrap:break-word;overflow:hidden;" +
        "width:" +
        textarea.clientWidth +
        "px;" +
        "padding:" +
        style.padding +
        ";" +
        "font:" +
        style.font +
        ";" +
        "line-height:" +
        style.lineHeight +
        ";" +
        "letter-spacing:" +
        style.letterSpacing +
        ";" +
        "border:none;margin:0;box-sizing:border-box;";
      mirror.textContent = textBefore;
      document.body.appendChild(mirror);
      targetPixelTop = mirror.offsetHeight;
      document.body.removeChild(mirror);
    } catch (e) {
      const linesBefore = (textBefore.match(/\n/g) || []).length;
      let lineHeight = parseFloat(style.lineHeight);
      if (isNaN(lineHeight) || lineHeight <= 0) {
        const fontSize = parseFloat(style.fontSize);
        lineHeight = (isNaN(fontSize) ? 14 : fontSize) * 1.4;
      }
      targetPixelTop = linesBefore * lineHeight;
    }
    let _findBarH = 0;
    if (this._barEl && this._barEl[0]) {
      const _isCollapsed = this._barEl[0].classList.contains(
        "ih-find-bar-collapsed",
      );
      if (_isCollapsed) {
        _findBarH = 0;
      } else {
        _findBarH = this._barEl[0].offsetHeight || 0;
      }
    }
    const desiredScroll =
      targetPixelTop - Math.max(textarea.clientHeight * 0.4, _findBarH + 20);
    const clampedScroll = Math.max(
      0,
      Math.min(desiredScroll, textarea.scrollHeight - textarea.clientHeight),
    );
    textarea.scrollTop = clampedScroll;
  },

  _highlightMatch(shouldFocus) {
    if (shouldFocus === undefined) shouldFocus = true;
    if (this._currentMatchIndex < 0) return;
    this._hideSelectHint();
    const pos = this._matches[this._currentMatchIndex];
    const len = this._searchTerm.length;
    if (this._cmView) {
      this._cmView.dispatch({
        selection: { anchor: pos, head: pos + len },
        scrollIntoView: true,
      });
      if (shouldFocus) {
        this._suspendFocusGuard = true;
        this._cmView.focus();
        setTimeout(() => {
          this._suspendFocusGuard = false;
        }, 250);
      }
      return;
    }
    if (!this._targetTextarea || !this._targetTextarea.length) return;
    const el0 = this._targetTextarea[0];
    if (!el0.ownerDocument || !el0.ownerDocument.contains(el0)) return;
    const textarea = this._targetTextarea[0];

    if (shouldFocus) {
      this._suspendFocusGuard = true;
      textarea.focus();
      setTimeout(() => {
        this._suspendFocusGuard = false;
      }, 250);
    }
    try {
      textarea.setSelectionRange(pos, pos + len);
    } catch (e) {}
    this._scrollTextareaToPos(textarea, pos);
    this._lastHighlightPos = pos;
  },

  _updateCount() {
    if (!this._barEl) return;
    const total = this._matches.length;
    const current = total > 0 ? this._currentMatchIndex + 1 : 0;
    this._barEl.find(".ih-find-count-cur").text(current);
    this._barEl.find(".ih-find-count-total").text(total);
  },

  _showNoMatchHint() {
    if (!this._barEl) return;
    let hint = this._barEl.find(".ih-find-hint");
    if (!hint.length) {
      hint = $(
        `<div class="ih-find-hint ih-hm-status"><i class="fa-solid fa-circle-info"></i><span>没找到匹配？先点一下要搜索的编辑框</span></div>`,
      );
      this._barEl.append(hint);
      syncDialogTheme(this._barEl[0]);
    }
    hint.show();
  },

  _hideNoMatchHint() {
    if (!this._barEl) return;
    this._barEl.find(".ih-find-hint").hide();
  },
  _showSelectHint() {
    if (!this._barEl) return;
    let hint = this._barEl.find(".ih-find-select-hint");
    if (!hint.length) {
      hint = $(
        `<div class="ih-find-select-hint ih-hm-status"><i class="fa-solid fa-circle-info"></i><span>当前未选中匹配项，请先点击"下一个"（↓）选中后再替换</span></div>`,
      );
      this._barEl.append(hint);
      syncDialogTheme(this._barEl[0]);
    }
    hint.show();
  },

  _hideSelectHint() {
    if (!this._barEl) return;
    this._barEl.find(".ih-find-select-hint").hide();
  },
  _doReplace() {
    if (this._matches.length === 0) return;
    if (this._currentMatchIndex < 0) {
      this._showSelectHint();
      return;
    }
    if (!this._checkTarget()) return;
    const replaceWith = this._barEl.find(".ih-replace-input").val();
    const pos = this._matches[this._currentMatchIndex];
    const termLen = this._searchTerm.length;
    if (this._cmView) {
      this._cmView.dispatch({
        changes: { from: pos, to: pos + termLen, insert: replaceWith },
        selection: { anchor: pos, head: pos + replaceWith.length },
        scrollIntoView: true,
      });
      this._cmView.focus();
      toastr.info("已替换 1 处", "", { timeOut: 300 });
      const _oldPosCM = pos;
      this._rebuildMatchesWithoutHighlight();
      let _newIdxCM = -1;
      for (let i = 0; i < this._matches.length; i++) {
        if (this._matches[i] < _oldPosCM) _newIdxCM = i;
        else break;
      }
      this._currentMatchIndex = _newIdxCM;
      this._updateCount();
      return;
    }
    const isSendTextarea = this._targetTextarea[0] === getMessageInput()[0];
    if (isSendTextarea) saveStateBeforeAction();
    else historyManager.pushState(this._targetTextarea);
    const ta = this._targetTextarea[0];
    const _savedScroll = ta.scrollTop;
    const text = ta.value;
    const newText =
      text.substring(0, pos) + replaceWith + text.substring(pos + termLen);
    this._isReplacing = true;
    ta.value = newText;
    ta.scrollTop = _savedScroll;
    ta.dispatchEvent(new Event("input", { bubbles: true }));
    ta.scrollTop = _savedScroll;
    historyManager.pushState(this._targetTextarea);
    toastr.info("已替换 1 处", "", { timeOut: 300 });

    const _oldPos = pos;
    const _replaceLen = replaceWith.length;
    this._rebuildMatchesWithoutHighlight();
    let _newIdx = -1;
    for (let i = 0; i < this._matches.length; i++) {
      if (this._matches[i] < _oldPos) _newIdx = i;
      else break;
    }
    this._currentMatchIndex = _newIdx;
    this._updateCount();
    try {
      ta.focus();
      ta.setSelectionRange(_oldPos, _oldPos + _replaceLen);
    } catch (e) {}
    this._scrollTextareaToPos(ta, _oldPos);
    this._lastHighlightPos = _oldPos;
    setTimeout(() => {
      this._isReplacing = false;
    }, 0);
  },

  _doReplaceAll() {
    if (this._matches.length === 0) return;
    if (!this._checkTarget()) return;
    const replaceWith = this._barEl.find(".ih-replace-input").val();
    const count = this._matches.length;
    if (this._cmView) {
      const changes = this._matches.map((p) => ({
        from: p,
        to: p + this._searchTerm.length,
        insert: replaceWith,
      }));
      this._cmView.dispatch({ changes });
      toastr.success(`已替换 ${count} 处`, "", { timeOut: 800 });
      this._doSearch();
      if (this._matches.length > 0 && this._currentMatchIndex >= 0) {
        this._highlightMatch(false);
      }
      return;
    }
    const isSendTextarea = this._targetTextarea[0] === getMessageInput()[0];
    if (isSendTextarea) saveStateBeforeAction();
    else historyManager.pushState(this._targetTextarea);
    const escaped = this._searchTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(escaped, this._caseSensitive ? "g" : "gi");
    const safeReplaceWith = replaceWith.replace(/\$/g, "$$$$");
    const ta = this._targetTextarea[0];
    const _savedScroll = ta.scrollTop;
    const newText = ta.value.replace(regex, safeReplaceWith);
    this._isReplacing = true;
    ta.value = newText;
    ta.scrollTop = _savedScroll;
    ta.dispatchEvent(new Event("input", { bubbles: true }));
    ta.scrollTop = _savedScroll;
    historyManager.pushState(this._targetTextarea);
    toastr.success(`已替换 ${count} 处`, "", { timeOut: 800 });
    this._rebuildMatchesWithoutHighlight();
    setTimeout(() => {
      this._isReplacing = false;
    }, 0);
  },
};

async function pickFaIcon() {
  try {
    const result = await executeSlashCommandsWithOptions("/pick-icon");
    let icon = result?.pipe?.trim();
    if (icon === "false") return false;
    if (!icon || icon.length === 0) return "";
    if (
      !icon.startsWith("fa-solid") &&
      !icon.startsWith("fa-regular") &&
      !icon.startsWith("fa-brands")
    ) {
      icon = `fa-solid ${icon}`;
    }
    return icon;
  } catch (e) {
    console.warn("pick-icon 不可用:", e);
    return false;
  }
}

const _ihColorParseCache = new Map();
const _IH_COLOR_CACHE_MAX = 300;
function ihParseColorToRgba(str) {
  if (!str) return null;
  if (_ihColorParseCache.has(str)) return _ihColorParseCache.get(str);

  let result = null;
  const s = str.trim();
  const hex = s.match(/^#([0-9a-fA-F]{3,8})$/);
  if (hex) {
    const h = hex[1];
    let r, g, b;
    let a = 1;
    if (h.length === 3) {
      r = parseInt(h[0] + h[0], 16);
      g = parseInt(h[1] + h[1], 16);
      b = parseInt(h[2] + h[2], 16);
    } else if (h.length === 4) {
      r = parseInt(h[0] + h[0], 16);
      g = parseInt(h[1] + h[1], 16);
      b = parseInt(h[2] + h[2], 16);
      a = parseInt(h[3] + h[3], 16) / 255;
    } else if (h.length === 6) {
      r = parseInt(h.slice(0, 2), 16);
      g = parseInt(h.slice(2, 4), 16);
      b = parseInt(h.slice(4, 6), 16);
    } else if (h.length === 8) {
      r = parseInt(h.slice(0, 2), 16);
      g = parseInt(h.slice(2, 4), 16);
      b = parseInt(h.slice(4, 6), 16);
      a = parseInt(h.slice(6, 8), 16) / 255;
    }
    if (r !== undefined) {
      result = { r, g, b, a: Math.round(a * 1000) / 1000 };
    }
  }

  if (!result) {
    const rgb = s.match(/^rgba?\(([^)]+)\)$/i);
    if (rgb) {
      const parts = rgb[1]
        .split(/[,\s/]+/)
        .map((p) => p.trim())
        .filter(Boolean);
      if (parts.length >= 3) {
        result = {
          r: parseInt(parts[0]) || 0,
          g: parseInt(parts[1]) || 0,
          b: parseInt(parts[2]) || 0,
          a: parts[3] !== undefined ? parseFloat(parts[3]) : 1,
        };
      }
    }
  }

  if (!result) {
    const probe = document.createElement("div");
    probe.style.color = s;
    if (probe.style.color !== "") {
      probe.style.cssText +=
        ";position:absolute;left:-9999px;top:-9999px;visibility:hidden;";
      document.body.appendChild(probe);
      const parsed = getComputedStyle(probe).color;
      probe.remove();
      const m = parsed.match(/rgba?\(([^)]+)\)/i);
      if (m) {
        const parts = m[1]
          .split(/[,\s/]+/)
          .map((x) => x.trim())
          .filter(Boolean);
        result = {
          r: parseInt(parts[0]) || 0,
          g: parseInt(parts[1]) || 0,
          b: parseInt(parts[2]) || 0,
          a: parts[3] !== undefined ? parseFloat(parts[3]) : 1,
        };
      }
    }
  }

  if (_ihColorParseCache.size >= _IH_COLOR_CACHE_MAX) {
    const oldestKey = _ihColorParseCache.keys().next().value;
    _ihColorParseCache.delete(oldestKey);
  }
  _ihColorParseCache.set(str, result);
  return result;
}

function ihRgbToHex(r, g, b) {
  const h = (n) =>
    Math.max(0, Math.min(255, Math.round(n)))
      .toString(16)
      .padStart(2, "0");
  return "#" + h(r) + h(g) + h(b);
}

function openColorPicker() {
  const _existingCp = document.querySelector(".ih-color-picker-portal");
  if (_existingCp) {
    if (typeof _existingCp._ihClose === "function") _existingCp._ihClose();
    else _existingCp.remove();
    return;
  }
  let target = null;
  const _cpActive = document.activeElement;
  if (isEditableElement(_cpActive) && !shouldIgnoreFocusedElement(_cpActive)) {
    target = _cpActive;
  } else {
    target = getInsertionTarget();
  }
  if (!target) {
    toastr.warning("没有找到可编辑的输入框", "", { timeOut: 1200 });
    return;
  }
  let cmView = null;
  let textareaEl = null;
  if (target.isContentEditable) {
    cmView = getCodeMirrorView(target);
    if (!cmView) {
      toastr.warning("当前编辑区暂不支持取色", "", { timeOut: 1500 });
      return;
    }
  } else if (target.tagName === "TEXTAREA" || target.tagName === "INPUT") {
    textareaEl = target;
  } else {
    toastr.warning("这个编辑区暂不支持取色", "", { timeOut: 1500 });
    return;
  }
  if (target === getMessageInput()[0]) {
    _lastFocusedEditable = null;
  } else {
    _lastFocusedEditable = target;
  }

  const COLOR_RE =
    /#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{4}|[0-9a-fA-F]{3})\b|rgba?\([^)]*\)|hsla?\([^)]*\)/gi;

  const getText = () =>
    cmView ? cmView.state.doc.toString() : textareaEl.value || "";

  const scan = () => {
    const text = getText();
    const arr = [];
    COLOR_RE.lastIndex = 0;
    let m;
    while ((m = COLOR_RE.exec(text)) !== null) {
      const raw = m[0];
      const rgba = ihParseColorToRgba(raw);
      if (rgba)
        arr.push({ start: m.index, end: m.index + raw.length, raw, rgba });
      if (m.index === COLOR_RE.lastIndex) COLOR_RE.lastIndex++;
    }
    return arr;
  };

  const initial = scan();
  if (initial.length === 0) {
    toastr.info(
      "当前编辑框中未找到颜色值，请先点击目标编辑框，确认光标位于正确位置后再试",
      "",
      { timeOut: 3000 },
    );
    return;
  }

  const rgbaToStr = (rgba) => {
    if (rgba.a >= 1) return ihRgbToHex(rgba.r, rgba.g, rgba.b);
    const a = Math.round(rgba.a * 1000) / 1000;
    return `rgba(${rgba.r}, ${rgba.g}, ${rgba.b}, ${a})`;
  };

  const selectRange = (start, end) => {
    if (cmView) {
      cmView.dispatch({
        selection: { anchor: start, head: end },
        scrollIntoView: true,
      });
      cmView.focus();
    } else {
      try {
        const ae = document.activeElement;
        if (ae && ae !== textareaEl && portal[0].contains(ae)) ae.blur();
      } catch (e) {}
      try {
        textareaEl.focus({ preventScroll: true });
        textareaEl.setSelectionRange(start, end);
      } catch (e) {}
      try {
        findReplaceController._scrollTextareaToPos(textareaEl, start);
      } catch (e) {}
      requestAnimationFrame(() => {
        try {
          if (document.activeElement !== textareaEl) {
            textareaEl.focus({ preventScroll: true });
          }
          textareaEl.setSelectionRange(start, end);
          findReplaceController._scrollTextareaToPos(textareaEl, start);
        } catch (e) {}
      });
    }
  };

  const replaceRange = (start, end, newStr) => {
    if (cmView) {
      cmView.dispatch({
        changes: { from: start, to: end, insert: newStr },
        selection: { anchor: start, head: start + newStr.length },
        scrollIntoView: true,
      });
      cmView.focus();
    } else {
      const isSend = textareaEl === getMessageInput()[0];
      if (isSend) saveStateBeforeAction();
      else historyManager.pushState($(textareaEl));
      const savedScroll = textareaEl.scrollTop;
      const text = textareaEl.value;
      textareaEl.value =
        text.substring(0, start) + newStr + text.substring(end);
      textareaEl.scrollTop = savedScroll;
      textareaEl.dispatchEvent(new Event("input", { bubbles: true }));
      textareaEl.scrollTop = savedScroll;
      try {
        textareaEl.focus({ preventScroll: true });
        textareaEl.setSelectionRange(start, start + newStr.length);
        textareaEl.scrollTop = savedScroll;
      } catch (e) {}
      _lastFocusedEditable = isSend ? null : textareaEl;
      historyManager.pushState($(textareaEl));
    }
  };

  document
    .querySelectorAll(".ih-color-picker-portal")
    .forEach((el) => el.remove());
  closeAllFolderDropdowns();

  const portal = $(
    `<div class="ih-color-picker-portal"><div class="ih-cp-header"><span class="ih-cp-drag" title="按住拖动面板"><i class="fa-solid fa-grip-lines"></i></span><div class="ih-cp-header-btns"><button class="ih-cp-pin" type="button" title="固定面板：启用后点击外部不会关闭，再次点击解除"><i class="fa-solid fa-thumbtack"></i></button><button class="ih-cp-close" type="button" title="关闭取色面板"><i class="fa-solid fa-xmark"></i></button></div></div><div class="ih-cp-list"></div><div class="ih-cp-resize" title="拖动调整面板大小"><i class="fa-solid fa-up-right-and-down-left-from-center"></i></div></div>`,
  );
  const _cpSaved = getSettings().colorPicker || {};
  if (_cpSaved.width > 0) portal.css("width", _cpSaved.width + "px");
  if (_cpSaved.height > 0) portal.css("height", _cpSaved.height + "px");
  const listEl = portal.find(".ih-cp-list");
  let pinned = false;
  let activeIndex = -1;
  let cachedList = [];
  const findColorAtPos = (pos) => {
    for (let i = 0; i < cachedList.length; i++) {
      if (pos >= cachedList[i].start && pos <= cachedList[i].end) return i;
    }
    return -1;
  };
  const setActiveRow = (idx) => {
    activeIndex = idx;
    listEl.find(".ih-cp-row").removeClass("ih-cp-row-active");
    if (idx >= 0) {
      const rowEl = listEl.find(`.ih-cp-row[data-index="${idx}"]`)[0];
      if (rowEl) {
        rowEl.classList.add("ih-cp-row-active");
        rowEl.scrollIntoView({ block: "nearest" });
      }
    }
  };
  const onEditorCaret = () => {
    let pos;
    if (cmView) {
      const sel = cmView.state.selection.main;
      if (sel.from !== sel.to) return;
      pos = sel.head;
    } else if (textareaEl) {
      if (textareaEl.selectionStart !== textareaEl.selectionEnd) return;
      pos = textareaEl.selectionStart;
    } else return;
    if (pos === null || pos === undefined) return;
    const idx = findColorAtPos(pos);
    setActiveRow(idx >= 0 ? idx : -1);
    if (idx >= 0) {
      const c = cachedList[idx];
      if (cmView) {
        cmView.dispatch({ selection: { anchor: c.start, head: c.end } });
      } else if (textareaEl) {
        try {
          textareaEl.setSelectionRange(c.start, c.end);
        } catch (e) {}
      }
    }
  };

  const render = () => {
    const list = scan();
    cachedList = list;
    if (list.length === 0) {
      listEl.html(`<div class="ih-cp-empty">没有颜色了</div>`);
      return;
    }
    let html = "";
    list.forEach((c, i) => {
      const hex = ihRgbToHex(c.rgba.r, c.rgba.g, c.rgba.b);
      const alphaPct = Math.round(c.rgba.a * 100);
      const swatchBg = `rgba(${c.rgba.r},${c.rgba.g},${c.rgba.b},${c.rgba.a})`;
      html += `
        <div class="ih-cp-row${i === activeIndex ? " ih-cp-row-active" : ""}" data-index="${i}">
          <span class="ih-cp-swatch" style="--cp-bg:${swatchBg};"></span>
          <span class="ih-cp-text" title="点击跳转至编辑框中的此颜色">${ihEscapeHtml(c.raw)}</span>
          <span class="ih-cp-controls">
            <input type="color" class="ih-cp-color" value="${hex}" title="选择颜色" />
            <span class="ih-cp-alpha-wrap">
              <input type="range" class="ih-cp-alpha" min="0" max="100" value="${alphaPct}" title="透明度" />
              <span class="ih-cp-alpha-val">${alphaPct}%</span>
            </span>
          </span>
        </div>`;
    });
    listEl.html(html);
  };

  const applyRow = (rowEl) => {
    const idx = parseInt(rowEl.getAttribute("data-index"));
    const list = scan();
    if (isNaN(idx) || idx < 0 || idx >= list.length) {
      render();
      return;
    }
    const c = list[idx];
    const hex = rowEl.querySelector(".ih-cp-color").value;
    const alpha = parseInt(rowEl.querySelector(".ih-cp-alpha").value) / 100;
    const parsed = ihParseColorToRgba(hex) || { r: 0, g: 0, b: 0 };
    const rgba = { r: parsed.r, g: parsed.g, b: parsed.b, a: alpha };
    const newStr = rgbaToStr(rgba);
    replaceRange(c.start, c.end, newStr);
    const txt = rowEl.querySelector(".ih-cp-text");
    if (txt) txt.textContent = newStr;
    cachedList = scan();
    activeIndex = idx;
    setActiveRow(idx);
    selectRange(c.start, c.start + newStr.length);
  };

  const previewRow = (rowEl) => {
    const hex = rowEl.querySelector(".ih-cp-color").value;
    const alpha = parseInt(rowEl.querySelector(".ih-cp-alpha").value) / 100;
    const parsed = ihParseColorToRgba(hex) || { r: 0, g: 0, b: 0 };
    const sw = rowEl.querySelector(".ih-cp-swatch");
    if (sw)
      sw.style.setProperty(
        "--cp-bg",
        `rgba(${parsed.r},${parsed.g},${parsed.b},${alpha})`,
      );
  };

  let _cpPreviewRaf = null;
  let _cpPreviewRow = null;
  const schedulePreview = (rowEl) => {
    _cpPreviewRow = rowEl;
    if (_cpPreviewRaf) return;
    _cpPreviewRaf = requestAnimationFrame(() => {
      _cpPreviewRaf = null;
      if (_cpPreviewRow) previewRow(_cpPreviewRow);
    });
  };

  portal.on("click", ".ih-cp-row", function (e) {
    if ($(e.target).closest("input, .ih-cp-alpha-wrap, .ih-cp-controls").length)
      return;
    const idx = parseInt(this.getAttribute("data-index"));
    if (!isNaN(idx) && cachedList[idx]) {
      setActiveRow(idx);
      selectRange(cachedList[idx].start, cachedList[idx].end);
    }
  });
  portal.on("click", ".ih-cp-pin", function () {
    pinned = !pinned;
    this.classList.toggle("ih-cp-pin-active", pinned);
  });
  portal.on("input", ".ih-cp-color", function () {
    schedulePreview(this.closest(".ih-cp-row"));
  });
  portal.on("change", ".ih-cp-color", function () {
    applyRow(this.closest(".ih-cp-row"));
  });
  portal.on("input", ".ih-cp-alpha", function () {
    const row = this.closest(".ih-cp-row");
    const valEl = row.querySelector(".ih-cp-alpha-val");
    if (valEl) valEl.textContent = this.value + "%";
    schedulePreview(row);
  });
  portal.on("change", ".ih-cp-alpha", function () {
    applyRow(this.closest(".ih-cp-row"));
  });

  portal.on("mousedown", function (e) {
    if (!$(e.target).closest("input, textarea, select").length) {
      e.preventDefault();
    }
  });

  [
    "click",
    "mousedown",
    "mouseup",
    "pointerdown",
    "pointerup",
    "touchstart",
    "touchend",
  ].forEach((evt) => {
    portal[0].addEventListener(evt, (e) => e.stopPropagation(), false);
  });

  const _cpOpenDialogs = document.querySelectorAll("dialog[open]");
  const _cpHost =
    _cpOpenDialogs.length > 0
      ? _cpOpenDialogs[_cpOpenDialogs.length - 1]
      : document.body;
  $(_cpHost).append(portal);
  render();
  syncDialogTheme(portal[0]);
  generateFaIconProtectionCSS();

  const _cpHeaderEl = portal.find(".ih-cp-header")[0];
  if (_cpHeaderEl) {
    _cpHeaderEl.style.cursor = "move";
    let _cpDx = 0,
      _cpDy = 0,
      _cpOrigL = 0,
      _cpOrigT = 0;
    const _cpMove = (e) => {
      const ev = e.touches ? e.touches[0] : e;
      let nl = _cpOrigL + (ev.clientX - _cpDx);
      let nt = _cpOrigT + (ev.clientY - _cpDy);
      const w = portal[0].offsetWidth;
      const h = portal[0].offsetHeight;
      nl = Math.max(0, Math.min(window.innerWidth - w, nl));
      nt = Math.max(0, Math.min(window.innerHeight - h, nt));
      portal.css({ left: nl + "px", top: nt + "px" });
      if (e.cancelable) e.preventDefault();
    };
    const _cpUp = () => {
      document.removeEventListener("mousemove", _cpMove, true);
      document.removeEventListener("mouseup", _cpUp, true);
      document.removeEventListener("touchmove", _cpMove, true);
      document.removeEventListener("touchend", _cpUp, true);
      try {
        const _r = portal[0].getBoundingClientRect();
        const _cp = getSettings().colorPicker || {};
        _cp.x = Math.round(_r.left);
        _cp.y = Math.round(_r.top);
        getSettings().colorPicker = _cp;
        saveSettingsDebounced();
      } catch (e) {}
    };
    const _cpDown = (e) => {
      if (e.target.closest && e.target.closest(".ih-cp-header-btns")) return;
      const ev = e.touches ? e.touches[0] : e;
      const rect = portal[0].getBoundingClientRect();
      _cpOrigL = rect.left;
      _cpOrigT = rect.top;
      _cpDx = ev.clientX;
      _cpDy = ev.clientY;
      document.addEventListener("mousemove", _cpMove, true);
      document.addEventListener("mouseup", _cpUp, true);
      document.addEventListener("touchmove", _cpMove, {
        capture: true,
        passive: false,
      });
      document.addEventListener("touchend", _cpUp, true);
    };
    _cpHeaderEl.addEventListener("mousedown", _cpDown);
    _cpHeaderEl.addEventListener("touchstart", _cpDown, { passive: true });
  }

  const _cpResizeEl = portal.find(".ih-cp-resize")[0];
  if (_cpResizeEl) {
    let _rw = 0,
      _rh = 0,
      _rx = 0,
      _ry = 0;
    const _rMove = (e) => {
      const ev = e.touches ? e.touches[0] : e;
      let nw = _rw + (ev.clientX - _rx);
      let nh = _rh + (ev.clientY - _ry);
      nw = Math.max(190, Math.min(window.innerWidth * 0.96, nw));
      nh = Math.max(130, Math.min(window.innerHeight * 0.8, nh));
      portal.css({ width: nw + "px", height: nh + "px" });
      if (e.cancelable) e.preventDefault();
    };
    const _rUp = () => {
      document.removeEventListener("mousemove", _rMove, true);
      document.removeEventListener("mouseup", _rUp, true);
      document.removeEventListener("touchmove", _rMove, true);
      document.removeEventListener("touchend", _rUp, true);
      try {
        const _r = portal[0].getBoundingClientRect();
        const _cp = getSettings().colorPicker || {};
        _cp.width = Math.round(_r.width);
        _cp.height = Math.round(_r.height);
        getSettings().colorPicker = _cp;
        saveSettingsDebounced();
      } catch (e) {}
    };
    const _rDown = (e) => {
      e.stopPropagation();
      e.preventDefault();
      const ev = e.touches ? e.touches[0] : e;
      const rect = portal[0].getBoundingClientRect();
      _rw = rect.width;
      _rh = rect.height;
      _rx = ev.clientX;
      _ry = ev.clientY;
      document.addEventListener("mousemove", _rMove, true);
      document.addEventListener("mouseup", _rUp, true);
      document.addEventListener("touchmove", _rMove, {
        capture: true,
        passive: false,
      });
      document.addEventListener("touchend", _rUp, true);
    };
    _cpResizeEl.addEventListener("mousedown", _rDown);
    _cpResizeEl.addEventListener("touchstart", _rDown, { passive: false });
  }

  document.body.classList.add("ih-cp-selecting");
  const _cpCaretEl = cmView ? cmView.contentDOM : textareaEl;
  const _cpCaretHandler = onEditorCaret;
  if (_cpCaretEl) {
    _cpCaretEl.addEventListener("click", _cpCaretHandler);
    _cpCaretEl.addEventListener("mouseup", _cpCaretHandler);
  }

  const btnSel =
    "#input_color_picker_btn, " +
    ".ih-folder-dropdown-portal [data-button-key='colorPicker'], " +
    ".ih-floating-panel [data-button-key='colorPicker']";
  let anchorBtn = null;
  document.querySelectorAll(btnSel).forEach((el) => {
    if (el.offsetParent !== null) anchorBtn = el;
  });

  requestAnimationFrame(() => {
    const ddW = portal.outerWidth();
    const ddH = portal.outerHeight();
    let left, top;
    if (
      _cpSaved &&
      typeof _cpSaved.x === "number" &&
      typeof _cpSaved.y === "number"
    ) {
      left = _cpSaved.x;
      top = _cpSaved.y;
    } else if (anchorBtn) {
      const r = anchorBtn.getBoundingClientRect();
      left = r.left + r.width / 2 - ddW / 2;
      top = r.top - ddH - 6;
      if (top < 4) top = r.bottom + 6;
    } else {
      left = window.innerWidth / 2 - ddW / 2;
      top = window.innerHeight - ddH - 80;
    }
    if (left < 4) left = 4;
    if (left + ddW > window.innerWidth - 4) left = window.innerWidth - ddW - 4;
    if (top < 4) top = 4;
    if (top + ddH > window.innerHeight - 4) top = window.innerHeight - ddH - 4;
    portal.css({ left: left + "px", top: top + "px" });
  });

  const closePortal = () => {
    if (_cpPreviewRaf) {
      cancelAnimationFrame(_cpPreviewRaf);
      _cpPreviewRaf = null;
    }
    document.removeEventListener("mousedown", outside, true);
    document.removeEventListener("touchstart", outside, true);
    if (_cpCaretEl) {
      _cpCaretEl.removeEventListener("click", _cpCaretHandler);
      _cpCaretEl.removeEventListener("mouseup", _cpCaretHandler);
    }
    document.body.classList.remove("ih-cp-selecting");
    portal.remove();
  };
  portal[0]._ihClose = closePortal;
  portal.find(".ih-cp-close").on("click", closePortal);
  const outside = (e) => {
    if (pinned) return;
    if (portal[0].contains(e.target)) return;
    if (anchorBtn && anchorBtn.contains(e.target)) return;
    if (_cpCaretEl && _cpCaretEl.contains && _cpCaretEl.contains(e.target))
      return;
    closePortal();
  };
  setTimeout(() => {
    document.addEventListener("mousedown", outside, true);
    document.addEventListener("touchstart", outside, true);
  }, 60);
}

function ihApplyTextMinimalChange(el, newText) {
  const oldText = el.value || "";
  if (oldText === newText) {
    return { start: el.selectionStart || 0, end: el.selectionEnd || 0 };
  }
  let start = 0;
  const minLen = Math.min(oldText.length, newText.length);
  while (start < minLen && oldText[start] === newText[start]) start++;
  let endOld = oldText.length;
  let endNew = newText.length;
  while (
    endOld > start &&
    endNew > start &&
    oldText[endOld - 1] === newText[endNew - 1]
  ) {
    endOld--;
    endNew--;
  }
  const insert = newText.slice(start, endNew);
  if (typeof el.setRangeText === "function") {
    try {
      el.setRangeText(insert, start, endOld, "preserve");
      return { start, end: start + insert.length };
    } catch (e) {}
  }
  el.value = newText;
  return { start, end: start + insert.length };
}

const historyManager = {
  states: [],
  _undoBtnEl: null,
  _redoBtnEl: null,
  pointer: -1,
  maxHistory: 50,
  isPerformingUndoRedo: false,
  inputDebounceTimer: null,
  externalHistories: new WeakMap(),
  _sharedHistoriesByKey: new Map(),

  init() {
    const textarea = getMessageInput();
    const text = textarea.val() || "";
    const cursorPos = textarea.prop("selectionStart") || 0;
    this.states = [{ text, cursorPos }];
    this.pointer = 0;
    this.updateButtons();
  },

  _getExternalHistory(el, opts = {}) {
    if (!el) return null;
    const shareKey =
      el.classList &&
      el.classList.contains("maximized_textarea") &&
      el.dataset &&
      el.dataset.for
        ? el.dataset.for
        : el.id || "";
    let h = this.externalHistories.get(el);
    if (!h && shareKey) {
      h = this._sharedHistoriesByKey.get(shareKey);
      if (h) this.externalHistories.set(el, h);
    }
    const currentText = el.value || "";
    const cursorPos = el.selectionStart || 0;

    if (!h) {
      h = {
        states: [{ text: currentText, cursorPos }],
        pointer: 0,
        isPerformingUndoRedo: false,
        inputDebounceTimer: null,
        lastInputAt: 0,
      };
      this.externalHistories.set(el, h);
      if (shareKey) this._sharedHistoriesByKey.set(shareKey, h);
      return h;
    }

    const pointerState = h.states[h.pointer];
    const pointerText = pointerState ? pointerState.text : "";
    const recentlyTyped = Date.now() - (h.lastInputAt || 0) < 500;

    if (
      !opts.fromInput &&
      !h.isPerformingUndoRedo &&
      !recentlyTyped &&
      pointerText !== currentText
    ) {
      clearTimeout(h.inputDebounceTimer);
      h.states = [{ text: currentText, cursorPos }];
      h.pointer = 0;
      h.inputDebounceTimer = null;
    }

    return h;
  },

  ensureExternalHistory(el) {
    if (!el) return;
    if (el === getMessageInput()[0]) return;
    if (el.isContentEditable) {
      const src = this._getLogicalSource(el);
      if (src && src !== getMessageInput()[0]) {
        this._getExternalHistory(src, { fromFocus: true });
      }
      return;
    }
    this._getExternalHistory(el, { fromFocus: true });
  },

  _getLogicalSource(el) {
    if (!el) return null;
    if (
      el.classList &&
      el.classList.contains("maximized_textarea") &&
      el.dataset &&
      el.dataset.for
    ) {
      return document.getElementById(el.dataset.for) || null;
    }
    if (!el.isContentEditable) return null;
    const dialog = el.closest && el.closest("dialog");
    if (!dialog) return null;
    const ta = dialog.querySelector("textarea.maximized_textarea[data-for]");
    if (!ta || !ta.dataset.for) return null;
    return document.getElementById(ta.dataset.for) || null;
  },

  pushState(textarea) {
    const el = textarea[0] || textarea;
    if (!el) return;
    if (el === getMessageInput()[0]) {
      if (this.isPerformingUndoRedo) return;
      const text = el.value;
      const cursorPos = el.selectionStart;
      if (this.pointer >= 0 && this.states[this.pointer].text === text) return;
      if (this.pointer < this.states.length - 1) {
        this.states = this.states.slice(0, this.pointer + 1);
      }
      this.states.push({ text, cursorPos });
      if (this.states.length > this.maxHistory) this.states.shift();
      this.pointer = this.states.length - 1;
      this.updateButtons();
    } else {
      const h = this._getExternalHistory(el, { fromInput: true });
      if (h.isPerformingUndoRedo) return;
      clearTimeout(h.inputDebounceTimer);
      const text = el.value || "";
      const cursorPos = el.selectionStart || 0;
      if (h.pointer >= 0 && h.states[h.pointer].text === text) return;
      if (h.pointer < h.states.length - 1) {
        h.states = h.states.slice(0, h.pointer + 1);
      }
      h.states.push({ text, cursorPos });
      if (h.states.length > this.maxHistory) h.states.shift();
      h.pointer = h.states.length - 1;
      this.updateButtons();
    }
  },

  undo() {
    const target = getInsertionTarget();
    if (!target) return;
    if (target.isContentEditable) {
      const cmView = getCodeMirrorView(target);
      if (cmView) {
        const src = this._getLogicalSource(target);
        const sharedH = src
          ? this.externalHistories.get(src) ||
            this._sharedHistoriesByKey.get(src.id || "")
          : null;
        if (sharedH && sharedH.states && sharedH.states.length > 0) {
          clearTimeout(sharedH.inputDebounceTimer);
          const curText = cmView.state.doc.toString();
          if (
            sharedH.pointer < 0 ||
            sharedH.states[sharedH.pointer].text !== curText
          ) {
            if (sharedH.pointer < sharedH.states.length - 1) {
              sharedH.states = sharedH.states.slice(0, sharedH.pointer + 1);
            }
            sharedH.states.push({ text: curText, cursorPos: 0 });
            if (sharedH.states.length > this.maxHistory) sharedH.states.shift();
            sharedH.pointer = sharedH.states.length - 1;
          }
          if (sharedH.pointer > 0) {
            sharedH.isPerformingUndoRedo = true;
            sharedH.pointer--;
            const state = sharedH.states[sharedH.pointer];
            cmView.dispatch({
              changes: {
                from: 0,
                to: cmView.state.doc.length,
                insert: state.text,
              },
              selection: {
                anchor: Math.min(state.cursorPos, state.text.length),
              },
            });
            cmView.focus();
            setTimeout(() => {
              sharedH.isPerformingUndoRedo = false;
              this.updateButtons();
            }, 50);
            return;
          }
          this.updateButtons();
          return;
        }
        cmView.contentDOM.focus();
        const isMac = /Mac|iPhone|iPad|iPod/.test(navigator.platform);
        cmView.contentDOM.dispatchEvent(
          new KeyboardEvent("keydown", {
            key: "z",
            code: "KeyZ",
            keyCode: 90,
            which: 90,
            ctrlKey: !isMac,
            metaKey: isMac,
            bubbles: true,
            cancelable: true,
          }),
        );
        return;
      }
      target.focus();
      try {
        document.execCommand("undo");
      } catch (e) {}
      return;
    }
    if (target === getMessageInput()[0]) {
      const textarea = $(target);
      clearTimeout(this.inputDebounceTimer);
      if (
        this.pointer < 0 ||
        this.states[this.pointer].text !== textarea.val()
      ) {
        this.pushState(textarea);
      }
      if (this.pointer <= 0) return;
      this.isPerformingUndoRedo = true;
      this.pointer--;
      const state = this.states[this.pointer];
      const _savedScroll = target.scrollTop;
      ihApplyTextMinimalChange(target, state.text);
      target.scrollTop = _savedScroll;
      target.dispatchEvent(new Event("input", { bubbles: true }));
      target.scrollTop = _savedScroll;
      setTimeout(() => {
        textarea.prop("selectionStart", state.cursorPos);
        textarea.prop("selectionEnd", state.cursorPos);
        if (document.activeElement !== target) {
          target.focus({ preventScroll: true });
        }
        target.scrollTop = _savedScroll;
        this.isPerformingUndoRedo = false;
        this.updateButtons();
        if (
          typeof findReplaceController !== "undefined" &&
          findReplaceController.active &&
          findReplaceController._barEl &&
          findReplaceController._liveSearchHandler
        ) {
          findReplaceController._liveSearchHandler();
        }
      }, 0);
    } else {
      const h = this._getExternalHistory(target);
      clearTimeout(h.inputDebounceTimer);
      if (h.pointer < 0 || h.states[h.pointer].text !== target.value) {
        this.pushState($(target));
      }
      if (h.pointer <= 0) {
        target.focus();
        try {
          document.execCommand("undo");
        } catch (e) {}
        return;
      }
      h.isPerformingUndoRedo = true;
      h.pointer--;
      const state = h.states[h.pointer];
      const _savedScroll = target.scrollTop;
      const _wasFocused = document.activeElement === target;
      const _chg = ihApplyTextMinimalChange(target, state.text);
      target.scrollTop = _savedScroll;
      try {
        const _cp = _wasFocused && _chg ? _chg.end : state.cursorPos;
        target.selectionStart = _cp;
        target.selectionEnd = _cp;
      } catch (e) {}
      target.scrollTop = _savedScroll;
      target.dispatchEvent(new Event("input", { bubbles: true }));
      target.scrollTop = _savedScroll;
      requestAnimationFrame(() => {
        target.scrollTop = _savedScroll;
      });
      setTimeout(() => {
        try {
          if (_wasFocused && document.activeElement !== target) {
            target.focus({ preventScroll: true });
          }
          target.scrollTop = _savedScroll;
        } catch (e) {}
        h.isPerformingUndoRedo = false;
        this.updateButtons();
        if (
          typeof findReplaceController !== "undefined" &&
          findReplaceController.active &&
          findReplaceController._barEl
        ) {
          try {
            findReplaceController._rebuildMatchesWithoutHighlight();
          } catch (e) {}
        }
      }, 0);
    }
  },

  redo() {
    const target = getInsertionTarget();
    if (!target) return;
    if (target.isContentEditable) {
      const cmView = getCodeMirrorView(target);
      if (cmView) {
        const src = this._getLogicalSource(target);
        const sharedH = src
          ? this.externalHistories.get(src) ||
            this._sharedHistoriesByKey.get(src.id || "")
          : null;
        if (
          sharedH &&
          sharedH.states &&
          sharedH.states.length > 0 &&
          sharedH.pointer < sharedH.states.length - 1
        ) {
          clearTimeout(sharedH.inputDebounceTimer);
          sharedH.isPerformingUndoRedo = true;
          sharedH.pointer++;
          const state = sharedH.states[sharedH.pointer];
          cmView.dispatch({
            changes: {
              from: 0,
              to: cmView.state.doc.length,
              insert: state.text,
            },
            selection: { anchor: Math.min(state.cursorPos, state.text.length) },
          });
          cmView.focus();
          setTimeout(() => {
            sharedH.isPerformingUndoRedo = false;
            this.updateButtons();
          }, 50);
          return;
        }
        cmView.contentDOM.focus();
        const isMac = /Mac|iPhone|iPad|iPod/.test(navigator.platform);
        if (isMac) {
          cmView.contentDOM.dispatchEvent(
            new KeyboardEvent("keydown", {
              key: "z",
              code: "KeyZ",
              keyCode: 90,
              which: 90,
              metaKey: true,
              shiftKey: true,
              bubbles: true,
              cancelable: true,
            }),
          );
        } else {
          cmView.contentDOM.dispatchEvent(
            new KeyboardEvent("keydown", {
              key: "y",
              code: "KeyY",
              keyCode: 89,
              which: 89,
              ctrlKey: true,
              bubbles: true,
              cancelable: true,
            }),
          );
        }
        return;
      }
      target.focus();
      try {
        document.execCommand("redo");
      } catch (e) {}
      return;
    }
    if (target === getMessageInput()[0]) {
      const textarea = $(target);
      clearTimeout(this.inputDebounceTimer);
      if (
        this.pointer >= 0 &&
        this.states[this.pointer].text !== textarea.val()
      ) {
        this.pushState(textarea);
      }
      if (this.pointer >= this.states.length - 1) return;
      this.isPerformingUndoRedo = true;
      this.pointer++;
      const state = this.states[this.pointer];
      const _savedScroll = target.scrollTop;
      ihApplyTextMinimalChange(target, state.text);
      target.scrollTop = _savedScroll;
      target.dispatchEvent(new Event("input", { bubbles: true }));
      target.scrollTop = _savedScroll;
      setTimeout(() => {
        textarea.prop("selectionStart", state.cursorPos);
        textarea.prop("selectionEnd", state.cursorPos);
        if (document.activeElement !== target) {
          target.focus({ preventScroll: true });
        }
        target.scrollTop = _savedScroll;
        this.isPerformingUndoRedo = false;
        this.updateButtons();
        if (
          typeof findReplaceController !== "undefined" &&
          findReplaceController.active &&
          findReplaceController._barEl &&
          findReplaceController._liveSearchHandler
        ) {
          findReplaceController._liveSearchHandler();
        }
      }, 0);
    } else {
      const h = this._getExternalHistory(target);
      clearTimeout(h.inputDebounceTimer);
      if (h.pointer >= 0 && h.states[h.pointer].text !== target.value) {
        this.pushState($(target));
      }
      if (h.pointer >= h.states.length - 1) {
        target.focus();
        try {
          document.execCommand("redo");
        } catch (e) {}
        return;
      }
      h.isPerformingUndoRedo = true;
      h.pointer++;
      const state = h.states[h.pointer];
      const _savedScrollR = target.scrollTop;
      const _wasFocusedR = document.activeElement === target;
      const _chgR = ihApplyTextMinimalChange(target, state.text);
      target.scrollTop = _savedScrollR;
      try {
        const _cpR = _wasFocusedR && _chgR ? _chgR.end : state.cursorPos;
        target.selectionStart = _cpR;
        target.selectionEnd = _cpR;
      } catch (e) {}
      target.scrollTop = _savedScrollR;
      target.dispatchEvent(new Event("input", { bubbles: true }));
      target.scrollTop = _savedScrollR;
      requestAnimationFrame(() => {
        target.scrollTop = _savedScrollR;
      });
      setTimeout(() => {
        try {
          if (_wasFocusedR && document.activeElement !== target) {
            target.focus({ preventScroll: true });
          }
          target.scrollTop = _savedScrollR;
        } catch (e) {}
        h.isPerformingUndoRedo = false;
        this.updateButtons();
        if (
          typeof findReplaceController !== "undefined" &&
          findReplaceController.active &&
          findReplaceController._barEl
        ) {
          try {
            findReplaceController._rebuildMatchesWithoutHighlight();
          } catch (e) {}
        }
      }, 0);
    }
  },

  onBeforeInput() {
    if (this.isPerformingUndoRedo) return;
    const el = getMessageInput()[0];
    if (!el) return;
    const text = el.value || "";
    const cursorPos = el.selectionStart || 0;
    if (this.pointer < 0 || !this.states.length) {
      this.states = [{ text, cursorPos }];
      this.pointer = 0;
      this.updateButtons();
      return;
    }
    if (this.states[this.pointer].text !== text) {
      this.pushState($(el));
    }
  },

  onInput() {
    if (this.isPerformingUndoRedo) return;
    const el = getMessageInput()[0];
    if (!el) return;

    const text = el.value || "";
    if (
      this.pointer >= 0 &&
      this.states.length <= 1 &&
      this.states[this.pointer].text !== text
    ) {
      this.pushState($(el));
      return;
    }

    clearTimeout(this.inputDebounceTimer);
    this.inputDebounceTimer = setTimeout(() => {
      try {
        this.pushState(getMessageInput());
      } catch (e) {
        console.warn("快捷工具栏: 保存输入状态失败", e);
      }
    }, 350);
  },

  onExternalBeforeInput(el) {
    if (!el) return;
    if (el === getMessageInput()[0]) return;
    if (el.isContentEditable) return;

    const h = this._getExternalHistory(el);
    if (!h) return;
    if (h.isPerformingUndoRedo) return;

    const text = el.value || "";
    const cursorPos = el.selectionStart || 0;

    if (h.pointer < 0 || !h.states.length) {
      h.states = [{ text, cursorPos }];
      h.pointer = 0;
      this.updateButtons();
      return;
    }

    if (h.states[h.pointer].text !== text) {
      this.pushState($(el));
    }
  },

  onExternalInput(el) {
    const h = this._getExternalHistory(el, { fromInput: true });
    if (!h) return;
    h.lastInputAt = Date.now();
    if (h.isPerformingUndoRedo) return;

    const text = el.value || "";
    if (
      h.pointer >= 0 &&
      h.states.length <= 1 &&
      h.states[h.pointer].text !== text
    ) {
      this.pushState($(el));
      return;
    }

    clearTimeout(h.inputDebounceTimer);
    h.inputDebounceTimer = setTimeout(() => {
      try {
        if (!el || !el.ownerDocument || !el.ownerDocument.contains(el)) return;
        this.pushState($(el));
      } catch (e) {
        console.warn("快捷工具栏: 保存外部输入状态失败", e);
      }
    }, 350);
  },

  updateButtons() {
    const target = getInsertionTarget();
    let undoDisabled = true;
    let redoDisabled = true;
    if (target) {
      if (target === getMessageInput()[0]) {
        undoDisabled = this.pointer <= 0;
        redoDisabled = this.pointer >= this.states.length - 1;
      } else if (target.isContentEditable) {
        const src = this._getLogicalSource(target);
        const sharedH = src
          ? this.externalHistories.get(src) ||
            this._sharedHistoriesByKey.get(src.id || "")
          : null;
        if (sharedH && sharedH.states && sharedH.states.length > 0) {
          undoDisabled = sharedH.pointer <= 0;
          redoDisabled = sharedH.pointer >= sharedH.states.length - 1;
        } else {
          undoDisabled = false;
          redoDisabled = false;
        }
      } else {
        const h = this.externalHistories.get(target);
        if (h) {
          undoDisabled = h.pointer <= 0;
          redoDisabled = h.pointer >= h.states.length - 1;
        } else {
          undoDisabled = true;
          redoDisabled = true;
        }
      }
    }
    if (!this._undoBtnEl || !document.contains(this._undoBtnEl[0])) {
      this._undoBtnEl = $("#input_undo_btn");
    }
    if (!this._redoBtnEl || !document.contains(this._redoBtnEl[0])) {
      this._redoBtnEl = $("#input_redo_btn");
    }
    this._undoBtnEl.toggleClass("input-helper-btn-disabled", undoDisabled);
    this._redoBtnEl.toggleClass("input-helper-btn-disabled", redoDisabled);
    const hasPanels = document.querySelector(
      ".ih-folder-dropdown-portal, .ih-floating-panel",
    );
    if (!hasPanels) return;
    $(
      ".ih-folder-dropdown-portal [data-button-key='undo'], .ih-floating-panel [data-button-key='undo']",
    ).toggleClass("input-helper-btn-disabled", undoDisabled);
    $(
      ".ih-folder-dropdown-portal [data-button-key='redo'], .ih-floating-panel [data-button-key='redo']",
    ).toggleClass("input-helper-btn-disabled", redoDisabled);
  },

  clear() {
    this.states = [];
    this.pointer = -1;
    clearTimeout(this.inputDebounceTimer);
    this.init();
  },
};

const chatUndoManager = {
  _snapshots: [],
  _stableSnapshot: null,
  _autoClearTimers: [],
  _stableSnapshotTimer: null,
  _justSaved: false,
  _justSavedTimer: null,
  AUTO_CLEAR_MS: 5 * 60 * 1000,
  MAX_SNAPSHOTS: 20,

  _pushSnapshot(snapshot) {
    this._snapshots.push(snapshot);
    while (this._snapshots.length > this.MAX_SNAPSHOTS) {
      this._snapshots.shift();
      const t = this._autoClearTimers.shift();
      if (t) clearTimeout(t);
    }
    const self = this;
    const timer = setTimeout(function () {
      const realIdx = self._snapshots.indexOf(snapshot);
      if (realIdx > -1) {
        self._snapshots.splice(realIdx, 1);
        self._autoClearTimers.splice(realIdx, 1);
        self.updateButton();
      }
    }, this.AUTO_CLEAR_MS);
    this._autoClearTimers.push(timer);
    this.updateButton();
  },

  save() {
    let snapshot;
    try {
      snapshot = JSON.parse(JSON.stringify(chat));
    } catch (e) {
      console.warn("快捷工具栏: 保存聊天快照失败", e);
      return;
    }
    this._justSaved = true;
    if (this._justSavedTimer) clearTimeout(this._justSavedTimer);
    const selfRef = this;
    this._justSavedTimer = setTimeout(function () {
      selfRef._justSaved = false;
    }, 500);
    this._pushSnapshot(snapshot);
  },

  saveFromExternal() {
    if (this._justSaved) {
      this._justSaved = false;
      if (this._justSavedTimer) clearTimeout(this._justSavedTimer);
      this._justSavedTimer = null;
      return;
    }
    if (!this._stableSnapshot) return;
    if (this._stableSnapshot.length <= chat.length) return;
    let snapshot;
    try {
      snapshot = JSON.parse(JSON.stringify(this._stableSnapshot));
    } catch (e) {
      return;
    }
    this._pushSnapshot(snapshot);
  },

  saveFromRegenerate() {
    if (this._justSaved) return;
    let snapshot;
    try {
      snapshot = JSON.parse(JSON.stringify(chat));
    } catch (e) {
      return;
    }
    this._pushSnapshot(snapshot);
  },

  updateStableSnapshot(immediate) {
    clearTimeout(this._stableSnapshotTimer);
    const doIt = () => {
      try {
        this._stableSnapshot = JSON.parse(JSON.stringify(chat));
      } catch (e) {}
    };
    if (immediate) {
      doIt();
    } else {
      this._stableSnapshotTimer = setTimeout(doIt, 150);
    }
  },

  async undo() {
    if (this._snapshots.length === 0) {
      toastr.warning("没有可撤回的操作", "", { timeOut: 1000 });
      return;
    }
    const snapshot = this._snapshots.pop();
    const timer = this._autoClearTimers.pop();
    if (timer) clearTimeout(timer);
    this.updateButton();

    chat.length = 0;
    snapshot.forEach(function (msg) {
      chat.push(msg);
    });

    this._isUndoing = true;
    try {
      await executeSlashCommandsWithOptions("/forcesave");
      await executeSlashCommandsWithOptions("/chat-reload");
      const remaining = this._snapshots.length;
      if (remaining > 0) {
        toastr.success(`已撤回 1 步，剩余可撤回 ${remaining} 步`, "", {
          timeOut: 900,
        });
      } else {
        toastr.success("已撤回 1 步，无剩余可撤回步骤", "", {
          timeOut: 900,
        });
      }
    } catch (e) {
      console.error("快捷工具栏: 撤回失败", e);
      toastr.error("撤回失败", "", { timeOut: 1000 });
    } finally {
      const self = this;
      setTimeout(function () {
        self._isUndoing = false;
        self.updateStableSnapshot(true);
        self.updateButton();
      }, 1500);
    }
  },

  clear() {
    this._snapshots = [];
    this._stableSnapshot = null;
    this._autoClearTimers.forEach(function (t) {
      clearTimeout(t);
    });
    this._autoClearTimers = [];
    clearTimeout(this._stableSnapshotTimer);
    if (this._justSavedTimer) clearTimeout(this._justSavedTimer);
    this._justSavedTimer = null;
    this._justSaved = false;
    this.updateButton();
  },

  hasSnapshot() {
    return this._snapshots.length > 0;
  },

  updateButton() {
    const has = this.hasSnapshot();
    const selector =
      "#input_chat_undo_btn, " +
      ".ih-folder-dropdown-portal [data-button-key='chatUndo'], " +
      ".ih-floating-panel [data-button-key='chatUndo']";
    $(selector).toggleClass("input-helper-btn-disabled", !has);
    $(selector).toggleClass("input-helper-btn-active", has);
  },

  _watchTimer: null,
  _lastWatchedLength: 0,

  startWatcher() {
    if (this._watchTimer) return;
    this._lastWatchedLength = chat.length;
    try {
      this._lastWatchedChatId = SillyTavern.getContext().getCurrentChatId();
    } catch (e) {
      this._lastWatchedChatId = null;
    }
    const self = this;
    this._watchTimer = setInterval(function () {
      if (self._isUndoing) return;
      let curChatId = null;
      try {
        curChatId = SillyTavern.getContext().getCurrentChatId();
      } catch (e) {}
      if (curChatId !== self._lastWatchedChatId) {
        self._lastWatchedChatId = curChatId;
        self._lastWatchedLength = chat.length;
        return;
      }
      const cur = chat.length;
      const prev = self._lastWatchedLength;
      if (
        cur < prev &&
        self._stableSnapshot &&
        self._stableSnapshot.length > cur
      ) {
        try {
          const snap = JSON.parse(JSON.stringify(self._stableSnapshot));
          self._pushSnapshot(snap);
        } catch (e) {}
      }
      self._lastWatchedLength = cur;
    }, 1500);
  },

  stopWatcher() {
    if (this._watchTimer) {
      clearInterval(this._watchTimer);
      this._watchTimer = null;
    }
  },
};

const shiftMode = {
  active: false,
  anchorPos: 0,
  _handler: null,
  _targetEl: null,
  _cmView: null,
  _anchorNode: null,
  _anchorOffset: 0,
  _hintToast: null,
  _touchStartHandler: null,
  _touchMoveHandler: null,
  _touchStartX: 0,
  _touchStartY: 0,
  _touchMoved: false,

  toggle() {
    if (this.active) {
      this.deactivate();
    } else {
      this.activate();
    }
  },
  _syncButtonState() {
    $(
      "#input_shift_btn, .ih-folder-dropdown-portal [data-button-key='shift'], .ih-floating-panel [data-button-key='shift']",
    ).toggleClass("input-helper-btn-active", this.active);
  },

  activate(silent = false) {
    const target = getInsertionTarget();
    if (!target) return;
    if (target.isContentEditable) {
      const cmView = getCodeMirrorView(target);
      if (cmView) {
        this._cmView = cmView;
        this._targetEl = cmView.contentDOM;
        this.anchorPos = cmView.state.selection.main.head;
        this.active = true;
        this._handler = () => {
          if (!this.active || !this._cmView) return;
          setTimeout(() => {
            try {
              const state = this._cmView.state;
              const currentHead = state.selection.main.head;
              const anchor = this.anchorPos;
              if (currentHead !== anchor) {
                this._cmView.dispatch({
                  selection: { anchor: anchor, head: currentHead },
                });
              }
            } catch (e) {}
          }, 10);
        };
        cmView.contentDOM.addEventListener("mouseup", this._handler);
        cmView.contentDOM.addEventListener("touchend", this._handler);
      } else {
        const doc = target.ownerDocument || document;
        const win = doc.defaultView || window;
        const sel = win.getSelection();
        if (!sel || sel.rangeCount === 0) {
          this.active = false;
          this._syncButtonState();
          if (!silent)
            toastr.warning("无法获取光标位置", "", { timeOut: 1000 });
          return;
        }
        this._targetEl = target;
        this._anchorNode = sel.focusNode;
        this._anchorOffset = sel.focusOffset;
        this.active = true;
        this._handler = () => {
          if (!this.active || !this._targetEl) return;
          setTimeout(() => {
            try {
              const s = win.getSelection();
              if (!s || s.rangeCount === 0) return;
              s.setBaseAndExtent(
                this._anchorNode,
                this._anchorOffset,
                s.focusNode,
                s.focusOffset,
              );
            } catch (e) {}
          }, 10);
        };
        target.addEventListener("mouseup", this._handler);
        target.addEventListener("touchend", this._handler);
      }
    } else {
      this._targetEl = target;
      this.anchorPos = target.selectionStart || 0;
      this.active = true;

      this._touchMoved = false;
      this._touchStartHandler = (evt) => {
        if (!evt.touches || !evt.touches[0]) return;
        this._touchMoved = false;
        this._touchStartX = evt.touches[0].clientX;
        this._touchStartY = evt.touches[0].clientY;
      };

      this._touchMoveHandler = (evt) => {
        if (!evt.touches || !evt.touches[0]) return;
        const dx = Math.abs(evt.touches[0].clientX - this._touchStartX);
        const dy = Math.abs(evt.touches[0].clientY - this._touchStartY);

        if (dx > 8 || dy > 8) {
          this._touchMoved = true;
        }
      };

      this._handler = (evt) => {
        if (!this.active || !this._targetEl) return;

        if (evt && evt.type === "touchend" && this._touchMoved) {
          this._touchMoved = false;
          return;
        }

        const ta = this._targetEl;
        const now = Date.now();
        if (now - (this._lastHandlerAt || 0) < 60) {
          return;
        }
        this._lastHandlerAt = now;

        const beforeStart = ta.selectionStart;
        const beforeEnd = ta.selectionEnd;
        let pointerPos = null;

        try {
          let cx, cy;

          if (evt && evt.changedTouches && evt.changedTouches[0]) {
            cx = evt.changedTouches[0].clientX;
            cy = evt.changedTouches[0].clientY;
          } else if (evt) {
            cx = evt.clientX;
            cy = evt.clientY;
          }

          if (cx !== undefined && cy !== undefined) {
            if (document.caretPositionFromPoint) {
              const cp = document.caretPositionFromPoint(cx, cy);
              if (cp && typeof cp.offset === "number") pointerPos = cp.offset;
            } else if (document.caretRangeFromPoint) {
              const r = document.caretRangeFromPoint(cx, cy);
              if (r && typeof r.startOffset === "number")
                pointerPos = r.startOffset;
            }
          }
        } catch (e) {}

        if (pointerPos !== null) {
          try {
            const anchor = this.anchorPos;
            ta.selectionStart = Math.min(anchor, pointerPos);
            ta.selectionEnd = Math.max(anchor, pointerPos);
          } catch (e) {}
        }

        setTimeout(() => {
          if (!ta) return;

          try {
            const start = ta.selectionStart;
            const end = ta.selectionEnd;
            const anchor = this.anchorPos;
            const selectionUnchanged =
              start === beforeStart && end === beforeEnd && start !== end;

            let t;

            if (selectionUnchanged && pointerPos !== null) {
              t = pointerPos;
            } else {
              t =
                Math.abs(end - anchor) >= Math.abs(start - anchor)
                  ? end
                  : start;
            }

            ta.selectionStart = Math.min(anchor, t);
            ta.selectionEnd = Math.max(anchor, t);
          } catch (e) {}
        }, 10);
      };

      target.addEventListener("touchstart", this._touchStartHandler, {
        passive: true,
      });
      target.addEventListener("touchmove", this._touchMoveHandler, {
        passive: true,
      });
      target.addEventListener("mouseup", this._handler);
      target.addEventListener("touchend", this._handler);
    }
    this._syncButtonState();
    if (!silent) {
      if (this._hintToast) {
        toastr.clear(this._hintToast);
        this._hintToast = null;
      }

      this._hintToast = toastr.info(
        "点击文本中一个位置为起点，再点击另一个位置选中区间。",
        "选中模式已开启",
        {
          timeOut: 0,
          extendedTimeOut: 0,
          closeButton: true,
          tapToDismiss: false,
          onHidden: () => {
            this._hintToast = null;
          },
        },
      );
    }
  },

  deactivate(silent = false) {
    this.active = false;
    if (this._targetEl) {
      try {
        if (this._handler) {
          this._targetEl.removeEventListener("mouseup", this._handler);
          this._targetEl.removeEventListener("touchend", this._handler);
        }

        if (this._touchStartHandler) {
          this._targetEl.removeEventListener(
            "touchstart",
            this._touchStartHandler,
          );
        }

        if (this._touchMoveHandler) {
          this._targetEl.removeEventListener(
            "touchmove",
            this._touchMoveHandler,
          );
        }
      } catch (e) {}
    }
    this._handler = null;
    this._touchStartHandler = null;
    this._touchMoveHandler = null;
    this._touchStartX = 0;
    this._touchStartY = 0;
    this._touchMoved = false;
    this._targetEl = null;
    this._cmView = null;
    this._anchorNode = null;
    this._anchorOffset = 0;
    this._lastHandlerAt = 0;
    this._syncButtonState();
    if (!silent) {
      const oldToast = this._hintToast;
      this._hintToast = null;

      const showClosedToast = () => {
        toastr.info("选中模式已关闭", "", { timeOut: 800 });
      };

      if (oldToast) {
        toastr.clear(oldToast);
        setTimeout(showClosedToast, 0);
      } else {
        showClosedToast();
      }
    }
  },
};

const _faIconContentCache = new Map();
let _faProtectionTimer = null;
let _lastIconHash = "";
let _toolbarHeightTimer = null;

function updateToolbarMaxHeight() {
  clearTimeout(_toolbarHeightTimer);
  _toolbarHeightTimer = setTimeout(_doUpdateToolbarMaxHeight, 80);
}

function _doUpdateToolbarMaxHeight() {
  const toolbar = document.getElementById("input_helper_toolbar");
  if (!toolbar || toolbar.classList.contains("input-helper-hidden")) return;
  const sendForm = document.getElementById("send_form");
  if (!sendForm) return;

  const wasPinned = sendForm.classList.contains("ih-toolbar-pinned");
  const wasFocused = sendForm.classList.contains("textarea-focused");
  const addedClass = !wasPinned && !wasFocused;

  const origToolbarTransition = toolbar.style.transition;
  toolbar.style.transition = "none";
  toolbar.style.maxHeight = "none";
  toolbar.style.visibility = "hidden";
  if (addedClass) {
    sendForm.classList.add("ih-toolbar-pinned");
  }

  void toolbar.offsetHeight;
  const height = toolbar.scrollHeight;

  toolbar.style.maxHeight = "";
  toolbar.style.visibility = "";
  if (addedClass) sendForm.classList.remove("ih-toolbar-pinned");
  void toolbar.offsetHeight;
  toolbar.style.transition = origToolbarTransition;

  void toolbar.offsetHeight;

  if (height > 0) {
    toolbar.style.setProperty("--ih-toolbar-max-h", height + "px");
  }
}

function generateFaIconProtectionCSS() {
  clearTimeout(_faProtectionTimer);
  _faProtectionTimer = setTimeout(_doGenerateFaIconProtectionCSS, 150);
}

function _doGenerateFaIconProtectionCSS() {
  const selectors = [
    "#send_form #input_helper_toolbar",
    ".ih-folder-dropdown-portal",
    ".ih-dialog-overlay",
    ".ih-hide-manager-content",
    ".ih-find-bar",
    ".ih-floating-panel",
    ".ih-floating-ball",
  ];
  const iconElements = document.querySelectorAll(
    selectors.map((s) => `${s} [class*="fa-"]`).join(","),
  );
  const iconClasses = new Set();
  iconElements.forEach((el) => {
    el.classList.forEach((cls) => {
      if (
        cls.startsWith("fa-") &&
        cls !== "fa-solid" &&
        cls !== "fa-regular" &&
        cls !== "fa-brands"
      ) {
        iconClasses.add(cls);
      }
    });
  });
  if (iconClasses.size === 0) return;
  const newHash = [...iconClasses].sort().join(",");
  if (newHash === _lastIconHash) return;
  _lastIconHash = newHash;
  const uncached = [...iconClasses].filter(
    (cls) => !_faIconContentCache.has(cls),
  );
  if (uncached.length > 0) {
    const frag = document.createDocumentFragment();
    const probes = [];
    for (const cls of uncached) {
      const probe = document.createElement("i");
      probe.className = `fa-solid ${cls}`;
      probe.style.cssText =
        "position:absolute;left:-9999px;top:-9999px;pointer-events:none;opacity:0;";
      frag.appendChild(probe);
      probes.push({ cls, probe });
    }
    document.body.appendChild(frag);
    for (const { cls, probe } of probes) {
      const computed = window.getComputedStyle(probe, "::before");
      const contentVal = computed.getPropertyValue("content");
      if (
        !contentVal ||
        contentVal === "none" ||
        contentVal === "normal" ||
        contentVal === '""' ||
        contentVal === "''"
      ) {
        _faIconContentCache.set(cls, null);
      } else {
        _faIconContentCache.set(cls, contentVal);
      }
    }
    for (const { probe } of probes) {
      probe.remove();
    }
  }
  let css = "";
  iconClasses.forEach((cls) => {
    const contentVal = _faIconContentCache.get(cls);
    if (!contentVal) return;
    const selectorList = selectors
      .map((s) => `${s} .${cls}::before`)
      .join(",\n");
    css += `${selectorList} { content: ${contentVal} !important; }\n`;
  });
  if (css.length > 0) {
    const baseReset = selectors
      .map((s) => `${s} [class*="fa-"]::before`)
      .join(",\n");
    const selectorsForIReset = selectors.filter(
      (s) => s !== ".ih-floating-ball",
    );
    const iReset = selectorsForIReset
      .map((s) => `${s} i[class*="fa-"]`)
      .join(",\n");
    const ballIReset = `.ih-floating-ball i[class*="fa-"]`;
    const fullCSS = `
${baseReset} {
    font-family: "Font Awesome 6 Free" !important;
    font-weight: 900 !important;
    display: inline !important;
    width: auto !important;
    height: auto !important;
    background-image: none !important;
    background-size: unset !important;
    background-repeat: unset !important;
    background-position: unset !important;
    vertical-align: unset !important;
    font-size: 11px !important;
    color: inherit !important;
}
${iReset} {
    font-family: "Font Awesome 6 Free" !important;
    font-weight: 900 !important;
    font-size: 11px !important;
    color: inherit !important;
    filter: none !important;
    background: none !important;
    background-image: none !important;
    width: auto !important;
    height: auto !important;
    min-width: 0 !important;
    min-height: 0 !important;
    display: inline-block !important;
}
${ballIReset} {
    font-family: "Font Awesome 6 Free" !important;
    font-weight: 900 !important;
    color: inherit !important;
    filter: none !important;
    background: none !important;
    background-image: none !important;
}
${css}`;
    let styleEl = document.getElementById("ih-fa-icon-protection");
    if (styleEl) styleEl.remove();
    styleEl = document.createElement("style");
    styleEl.id = "ih-fa-icon-protection";
    styleEl.textContent = fullCSS;
    document.head.appendChild(styleEl);
  }
}

let _cachedBallCSSFlags = null;
function _invalidateBallCSSCache() {
  _cachedBallCSSFlags = null;
}
function _getBallCSSFlags() {
  if (_cachedBallCSSFlags === null) {
    _cachedBallCSSFlags = _computeBallCSSFlags();
  }
  return _cachedBallCSSFlags;
}
function _hasUserBallCSS() {
  return _getBallCSSFlags().hasCSS;
}
function _hasUserBallBackgroundImage() {
  return _getBallCSSFlags().hasBgImage;
}
function _computeBallCSSFlags() {
  const result = { hasCSS: false, hasBgImage: false };
  try {
    for (const sheet of document.styleSheets) {
      try {
        const href = sheet.href || "";
        if (href.includes(extensionName) || href.includes("ST-QuickBar"))
          continue;
        for (const rule of sheet.cssRules) {
          if (!rule.selectorText) continue;
          if (!rule.selectorText.includes("ih-floating-ball")) continue;
          if (rule.selectorText.includes("fa-")) continue;
          const isHoverOrActive =
            rule.selectorText.includes(":hover") ||
            rule.selectorText.includes(":active");
          const isExpanded = rule.selectorText.includes("ih-ball-expanded");
          const bgImg = rule.style.backgroundImage || "";
          const bg = rule.style.background || "";
          if (!result.hasBgImage && !isHoverOrActive && !isExpanded) {
            if (bgImg && bgImg !== "none" && bgImg.includes("url(")) {
              result.hasBgImage = true;
            } else if (bg && bg.includes("url(")) {
              result.hasBgImage = true;
            }
          }
          if (
            !result.hasCSS &&
            !isHoverOrActive &&
            !isExpanded &&
            !rule.selectorText.includes("ih-ball-custom") &&
            !rule.selectorText.includes("ih-ball-transparent")
          ) {
            if (
              bgImg &&
              bgImg !== "none" &&
              bgImg !== "" &&
              bgImg !== "(empty)"
            ) {
              result.hasCSS = true;
            } else if (bg && bg.includes("url(")) {
              result.hasCSS = true;
            } else {
              const bgColor = rule.style.backgroundColor || "";
              const border = rule.style.border || "";
              const boxShadow = rule.style.boxShadow || "";
              if (
                (bgColor &&
                  bgColor !== "transparent" &&
                  bgColor !== "rgba(0, 0, 0, 0)") ||
                (border && border !== "none") ||
                (boxShadow && boxShadow !== "none")
              ) {
                result.hasCSS = true;
              }
            }
          }
          if (result.hasCSS && result.hasBgImage) return result;
        }
      } catch (e) {}
    }
  } catch (e) {}
  return result;
}

let _cachedMessageInput = null;
function getMessageInput() {
  if (
    _cachedMessageInput &&
    _cachedMessageInput.length &&
    _cachedMessageInput[0] &&
    document.contains(_cachedMessageInput[0])
  ) {
    return _cachedMessageInput;
  }
  _cachedMessageInput = $("#send_textarea, #prompt_textarea").first();
  return _cachedMessageInput;
}

function saveStateBeforeAction() {
  clearTimeout(historyManager.inputDebounceTimer);
  historyManager.pushState(getMessageInput());
}

function getSettings() {
  return extension_settings[extensionName];
}

function ihForceSaveSettings() {
  try {
    const ctx = SillyTavern.getContext();
    if (ctx && typeof ctx.saveSettings === "function") {
      ctx.saveSettings();
      return;
    }
  } catch (e) {}
  try {
    executeSlashCommandsWithOptions("/forcesave");
  } catch (e) {}
}

function getButtonIdFromKey(key) {
  if (key.startsWith("custom_"))
    return `input_custom_${key.replace("custom_", "")}_btn`;
  if (key.startsWith("folder_"))
    return `input_folder_${key.replace("folder_", "")}_btn`;
  const map = {
    undo: "input_undo_btn",
    redo: "input_redo_btn",
    shift: "input_shift_btn",
    asterisk: "input_asterisk_btn",
    quotes: "input_quotes_btn",
    parentheses: "input_parentheses_btn",
    bookQuotes1: "input_book_quotes1_btn",
    bookQuotes2: "input_book_quotes2_btn",
    bookQuotes3: "input_book_quotes3_btn",
    newline: "input_newline_btn",
    user: "input_user_btn",
    char: "input_char_btn",
    scrollToTop: "input_scroll_top_btn",
    scrollToLastAi: "input_scroll_last_ai_btn",
    scrollToBottom: "input_scroll_bottom_btn",
    prevAiMsg: "input_prev_ai_msg_btn",
    nextAiMsg: "input_next_ai_msg_btn",
    pagingMode: "input_paging_mode_btn",
    autoScroll: "input_auto_scroll_btn",
    deleteLastMsg: "input_delete_last_msg_btn",
    deleteLastSwipe: "input_delete_last_swipe_btn",
    continueReply: "input_continue_reply_btn",
    editLastMsg: "input_edit_last_msg_btn",
    regenerateReply: "input_regenerate_reply_btn",
    generateSwipe: "input_generate_swipe_btn",
    chatUndo: "input_chat_undo_btn",
    hideManager: "input_hide_manager_btn",
    findReplace: "input_find_replace_btn",
    openQRAssistant: "input_open_qr_assistant_btn",
    openChatU8: "input_open_chatu8_btn",
    switchPanelProfile: "input_switch_panel_profile_btn",
    bottomNavMode: "input_bottom_nav_mode_btn",
    includeUserNavMode: "input_include_user_nav_mode_btn",
    enterDeleteMode: "input_enter_delete_mode_btn",
    copyText: "input_copy_text_btn",
    pasteText: "input_paste_text_btn",
    wrapToggle: "input_wrap_toggle_btn",
    chatManager: "input_chat_manager_btn",
    chatNew: "input_chat_new_btn",
    chatRename: "input_chat_rename_btn",
    chatDelete: "input_chat_delete_btn",
    chatClose: "input_chat_close_btn",
    cursorLeft: "input_cursor_left_btn",
    cursorRight: "input_cursor_right_btn",
    quickHide: "input_quick_hide_btn",
    sendStop: "input_send_stop_btn",
    resetFloatingBall: "input_reset_floating_ball_btn",
    colorPicker: "input_color_picker_btn",
  };
  return map[key] || "";
}

function getButtonDisplayHtml(key) {
  if (key.startsWith("custom_")) {
    const idx = parseInt(key.replace("custom_", ""));
    const sym = getSettings().customSymbols[idx];
    if (!sym) return "?";
    if (sym.icon) return `<i class="${ihEscapeAttr(sym.icon)}"></i>`;
    return ihEscapeHtml(sym.display || sym.name || "?");
  }
  if (key.startsWith("folder_")) {
    const idx = parseInt(key.replace("folder_", ""));
    const folder = (getSettings().folders || [])[idx];
    if (!folder) return '<i class="fa-solid fa-folder"></i>';
    if (folder.icon) return `<i class="${ihEscapeAttr(folder.icon)}"></i>`;
    if (folder.display) return ihEscapeHtml(folder.display);
    return '<i class="fa-solid fa-folder"></i>';
  }
  if (key === "sendStop") {
    return getFeatherSendSvg();
  }
  if (key === "editLastMsg") {
    return '<i class="bi bi-pencil-fill"></i>';
  }
  const def = BUTTON_DEFS[key];
  if (!def) return "?";
  if (def.icon) return `<i class="${def.icon}"></i>`;
  return def.text || "?";
}

function getButtonLabel(key) {
  if (key.startsWith("custom_")) {
    const idx = parseInt(key.replace("custom_", ""));
    const sym = getSettings().customSymbols[idx];
    return sym ? sym.name : "自定义";
  }
  if (key.startsWith("folder_")) {
    const idx = parseInt(key.replace("folder_", ""));
    const folder = (getSettings().folders || [])[idx];
    return folder ? folder.name : "文件夹";
  }
  return BUTTON_DEFS[key]?.label || key;
}

function insertPair(left, right, cursorOffset) {
  if (!getSettings().enabled) return;
  const target = getInsertionTarget();
  if (!target) return;
  const isExternal = isExternalTarget(target);

  if (target.isContentEditable) {
    const cmView = getCodeMirrorView(target);
    if (cmView) {
      const state = cmView.state;
      const { from, to } = state.selection.main;
      const selectedText = state.sliceDoc(from, to);
      const insert = left + selectedText + right;
      cmView.dispatch({
        changes: { from, to, insert },
        selection:
          selectedText.length > 0
            ? {
                anchor: from + left.length,
                head: from + left.length + selectedText.length,
              }
            : { anchor: from + left.length },
      });
      cmView.focus();
      return;
    }
    insertToContentEditable(target, left, right);
    return;
  }

  if (isExternal) historyManager.pushState($(target));
  else saveStateBeforeAction();
  const startPos = target.selectionStart || 0;
  const endPos = target.selectionEnd || 0;
  const text = target.value || "";
  const selected = text.substring(startPos, endPos);
  const insert = left + selected + right;
  const newText = text.substring(0, startPos) + insert + text.substring(endPos);
  const _savedScrollTop = target.scrollTop;

  target.value = newText;
  target.scrollTop = _savedScrollTop;
  target.dispatchEvent(new Event("input", { bubbles: true }));
  target.scrollTop = _savedScrollTop;

  requestAnimationFrame(() => {
    try {
      target.scrollTop = _savedScrollTop;
    } catch (e) {}
  });

  setTimeout(() => {
    try {
      target.scrollTop = _savedScrollTop;
      target.selectionStart = startPos + cursorOffset;
      target.selectionEnd =
        selected.length > 0
          ? startPos + cursorOffset + selected.length
          : startPos + cursorOffset;
      target.scrollTop = _savedScrollTop;
      target.focus({ preventScroll: true });
      target.scrollTop = _savedScrollTop;
    } catch (e) {}
    historyManager.pushState($(target));
    target.scrollTop = _savedScrollTop;
    requestAnimationFrame(() => {
      try {
        target.scrollTop = _savedScrollTop;
      } catch (e) {}
    });
  }, 0);
}

function insertToContentEditable(el, left, right) {
  const doc = el.ownerDocument || document;
  const win = doc.defaultView || window;
  el.focus();
  const sel = win.getSelection();
  if (sel && _savedRange) {
    try {
      if (
        _savedRange.startContainer &&
        doc.contains(_savedRange.startContainer)
      ) {
        sel.removeAllRanges();
        sel.addRange(_savedRange);
      }
    } catch (e) {}
    _savedRange = null;
  }
  if (!sel || sel.rangeCount === 0) {
    doc.execCommand("insertText", false, left + right);
    return;
  }
  const selectedText = sel.toString();
  const insertText = left + selectedText + right;
  doc.execCommand("insertText", false, insertText);
}

function insertQuotes() {
  insertPair('"', '"', 1);
}
function insertAsterisk() {
  insertPair("*", "*", 1);
}
function insertParentheses() {
  insertPair("(", ")", 1);
}
function insertBookQuotes1() {
  insertPair("「", "」", 1);
}
function insertBookQuotes2() {
  insertPair("『", "』", 1);
}
function insertBookQuotes3() {
  insertPair("《", "》", 1);
}

function insertNewLine() {
  if (!getSettings().enabled) return;
  const target = getInsertionTarget();
  if (!target) return;
  const isExternal = isExternalTarget(target);

  if (target.isContentEditable) {
    const cmView = getCodeMirrorView(target);
    if (cmView) {
      const state = cmView.state;
      const pos = state.selection.main.head;
      const line = state.doc.lineAt(pos);
      cmView.dispatch({
        changes: { from: line.to, insert: "\n" },
        selection: { anchor: line.to + 1 },
      });
      cmView.focus();
      return;
    }
    const doc = target.ownerDocument || document;
    const win = doc.defaultView || window;
    target.focus();
    const sel = win.getSelection();
    if (_savedRange) {
      try {
        sel.removeAllRanges();
        sel.addRange(_savedRange);
      } catch (e) {}
      _savedRange = null;
    }
    try {
      doc.execCommand("insertLineBreak");
    } catch (e) {
      doc.execCommand("insertHTML", false, "<br>");
    }
    return;
  }

  if (isExternal) historyManager.pushState($(target));
  else saveStateBeforeAction();
  const text = target.value || "";
  const cursorPos = target.selectionStart || 0;
  let lineEnd = text.indexOf("\n", cursorPos);
  if (lineEnd === -1) lineEnd = text.length;
  const newText = text.substring(0, lineEnd) + "\n" + text.substring(lineEnd);
  const _savedScrollTopNL = target.scrollTop;
  target.value = newText;
  target.scrollTop = _savedScrollTopNL;
  target.dispatchEvent(new Event("input", { bubbles: true }));
  target.scrollTop = _savedScrollTopNL;
  setTimeout(() => {
    try {
      target.selectionStart = lineEnd + 1;
      target.selectionEnd = lineEnd + 1;
      target.focus({ preventScroll: true });
      target.scrollTop = _savedScrollTopNL;
    } catch (e) {}
    historyManager.pushState($(target));
  }, 0);
}

function insertTag(tag) {
  if (!getSettings().enabled) return;
  const target = getInsertionTarget();
  if (!target) return;
  const isExternal = isExternalTarget(target);

  if (target.isContentEditable) {
    const cmView = getCodeMirrorView(target);
    if (cmView) {
      const state = cmView.state;
      const { from, to } = state.selection.main;
      cmView.dispatch({
        changes: { from, to, insert: tag },
        selection: { anchor: from + tag.length },
      });
      cmView.focus();
      return;
    }
    const doc = target.ownerDocument || document;
    const win = doc.defaultView || window;
    target.focus();
    const sel = win.getSelection();
    if (_savedRange) {
      try {
        sel.removeAllRanges();
        sel.addRange(_savedRange);
      } catch (e) {}
      _savedRange = null;
    }
    doc.execCommand("insertText", false, tag);
    return;
  }

  if (isExternal) historyManager.pushState($(target));
  else saveStateBeforeAction();
  const startPos = target.selectionStart || 0;
  const endPos = target.selectionEnd || 0;
  const text = target.value || "";
  const newText = text.substring(0, startPos) + tag + text.substring(endPos);
  const _savedScrollTop3 = target.scrollTop;
  target.value = newText;
  target.scrollTop = _savedScrollTop3;
  target.dispatchEvent(new Event("input", { bubbles: true }));
  target.scrollTop = _savedScrollTop3;
  setTimeout(() => {
    try {
      target.selectionStart = startPos + tag.length;
      target.selectionEnd = startPos + tag.length;
      target.focus({ preventScroll: true });
      target.scrollTop = _savedScrollTop3;
    } catch (e) {}
    historyManager.pushState($(target));
  }, 0);
}

function insertUserTag() {
  insertTag("{{user}}");
}
function insertCharTag() {
  insertTag("{{char}}");
}
function moveCursor(delta) {
  const target = getInsertionTarget();
  if (!target) return;

  if (target.isContentEditable) {
    const cmView = getCodeMirrorView(target);
    if (cmView) {
      const head = cmView.state.selection.main.head;
      const docLen = cmView.state.doc.length;
      const newPos = Math.max(0, Math.min(docLen, head + delta));
      cmView.dispatch({
        selection: { anchor: newPos },
        scrollIntoView: true,
      });
      cmView.focus();
      return;
    }
    const doc = target.ownerDocument || document;
    const win = doc.defaultView || window;
    target.focus();
    const sel = win.getSelection();
    if (!sel) return;
    try {
      sel.modify("move", delta > 0 ? "forward" : "backward", "character");
    } catch (e) {}
    return;
  }

  const len = (target.value || "").length;
  const cur = target.selectionStart || 0;
  const newPos = Math.max(0, Math.min(len, cur + delta));
  try {
    target.setSelectionRange(newPos, newPos);
    target.focus({ preventScroll: true });
  } catch (e) {}
}

function doCursorLeft() {
  moveCursor(-1);
}

function doCursorRight() {
  moveCursor(1);
}

async function doCopy() {
  const target = getInsertionTarget();
  if (!target) return;

  let selectedText = "";
  if (target.isContentEditable) {
    const cmView = getCodeMirrorView(target);
    if (cmView) {
      const { from, to } = cmView.state.selection.main;
      selectedText = cmView.state.sliceDoc(from, to);
    } else {
      const doc = target.ownerDocument || document;
      const win = doc.defaultView || window;
      const sel = win.getSelection();
      selectedText = sel ? sel.toString() : "";
    }
  } else {
    const start = target.selectionStart || 0;
    const end = target.selectionEnd || 0;
    if (start !== end) {
      selectedText = (target.value || "").substring(start, end);
    }
  }

  if (!selectedText) {
    return;
  }

  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(selectedText);
    } else {
      const ta = document.createElement("textarea");
      ta.value = selectedText;
      ta.style.cssText = "position:fixed;left:-9999px;top:-9999px;opacity:0;";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    toastr.info("已复制", "", { timeOut: 500 });
  } catch (e) {
    toastr.error("复制失败", "", { timeOut: 800 });
  }
}

async function doPaste() {
  const target = getInsertionTarget();
  if (!target) return;

  let clipText = "";
  try {
    if (navigator.clipboard && navigator.clipboard.readText) {
      clipText = await navigator.clipboard.readText();
    } else {
      toastr.warning("当前浏览器不支持剪贴板读取", "", { timeOut: 1500 });
      return;
    }
  } catch (e) {
    toastr.warning("无法读取剪贴板，请检查浏览器权限或使用 HTTPS", "", {
      timeOut: 1500,
    });
    return;
  }

  if (!clipText) {
    toastr.info("剪贴板为空", "", { timeOut: 1000 });
    return;
  }

  insertTag(clipText);
}

function doScrollToTop() {
  const scrollEl = findActiveScrollContainer();
  if (!scrollEl) return;
  const isTextLike =
    scrollEl.tagName === "TEXTAREA" || scrollEl.tagName === "INPUT";
  if (isTextLike) {
    ihBlurToDismissKeyboard(scrollEl);
    ihSmoothScrollTo(scrollEl, 0, 320);
  } else {
    scrollEl.scrollTo({ top: 0, behavior: "smooth" });
  }
  if (scrollEl === document.getElementById("chat")) {
    messageNavigation._currentAiIndex = -1;
    messageNavigation._lastNavTime = Date.now();
    messageNavigation._pendingJump = "top";
  }
}

function doScrollToLastAi() {
  const messages = $("#chat .mes[is_user='false']:visible");
  if (messages.length === 0) return;
  scrollChatToElement(messages.last()[0]);
  messageNavigation._currentAiIndex = messages.length - 1;
  messageNavigation._lastNavTime = Date.now();
}

function doScrollToBottom() {
  const scrollEl = findActiveScrollContainer();
  if (!scrollEl) return;
  const isTextLike =
    scrollEl.tagName === "TEXTAREA" || scrollEl.tagName === "INPUT";
  if (isTextLike) {
    ihBlurToDismissKeyboard(scrollEl);
    ihSmoothScrollTo(scrollEl, scrollEl.scrollHeight, 320);
  } else {
    scrollEl.scrollTo({ top: scrollEl.scrollHeight, behavior: "smooth" });
  }
  if (scrollEl === document.getElementById("chat")) {
    const aiMessages = $("#chat .mes[is_user='false']:visible");
    messageNavigation._currentAiIndex = aiMessages.length;
    messageNavigation._lastNavTime = Date.now();
    messageNavigation._pendingJump = "bottom";
  }
}

function doPrevAiMsg() {
  if (pagingController.active) pagingController.pageUp();
  else messageNavigation.goToPrev();
}

function doNextAiMsg() {
  if (pagingController.active) pagingController.pageDown();
  else messageNavigation.goToNext();
}

function doDeleteLastMsg() {
  if (chat.length === 0) return;
  if (getSettings().confirmDangerousActions) {
    const lastMsg = chat[chat.length - 1];
    const sender = lastMsg.is_user ? "你" : lastMsg.name || "AI";
    if (!confirm(`确定要删除最后一条消息吗？\n发送者: ${sender}`)) return;
  }
  chatUndoManager.save();
  executeSlashCommandsWithOptions("/del 1");
  toastr.info("已删除最后一条消息（可通过撤回按钮还原）", "", {
    timeOut: 1000,
  });
}

function doDeleteLastSwipe() {
  if (chat.length === 0) return;
  const lastMsg = chat[chat.length - 1];
  if (!lastMsg.swipes || lastMsg.swipes.length <= 1) {
    toastr.warning("没有可删除的备选回复", "", { timeOut: 1000 });
    return;
  }
  if (getSettings().confirmDangerousActions) {
    if (
      !confirm(
        `确定要删除当前备选回复吗？(${(lastMsg.swipe_id || 0) + 1}/${lastMsg.swipes.length})`,
      )
    )
      return;
  }
  chatUndoManager.save();
  executeSlashCommandsWithOptions("/delswipe");
  toastr.info("已删除当前备选回复（可通过撤回按钮还原）", "", {
    timeOut: 1000,
  });
}

function doContinueReply() {
  if (chat.length === 0) return;
  executeSlashCommandsWithOptions("/continue await=true");
}
function doEditLastMsg() {
  if (chat.length === 0) {
    toastr.warning("当前没有聊天消息", "", { timeOut: 800 });
    return;
  }
  const lastMes = $("#chat .mes").last();
  if (!lastMes.length) {
    toastr.warning("找不到最后一条消息", "", { timeOut: 800 });
    return;
  }

  const editingTextarea = lastMes.find("textarea:visible").first();
  if (editingTextarea.length) {
    const doneBtn = lastMes.find(".mes_edit_done").filter(":visible").first();

    if (doneBtn.length) {
      doneBtn.trigger("click");
      return;
    }

    toastr.warning("当前消息正在编辑，但找不到完成编辑按钮", "", {
      timeOut: 1200,
    });
    return;
  }

  const editBtn = lastMes.find(".mes_edit").first();
  if (!editBtn.length || !editBtn.is(":visible")) {
    toastr.warning("找不到编辑按钮", "", { timeOut: 800 });
    return;
  }
  scrollChatToElement(lastMes[0], "smooth", false);
  setTimeout(() => {
    editBtn.trigger("click");
  }, 200);
}

function doOpenQRAssistant() {
  const rocketBtn = document.getElementById("quick-reply-rocket-button");
  if (rocketBtn) {
    rocketBtn.click();
  } else {
    toastr.warning("未检测到 QR助手插件，请确认已安装并启用", "", {
      timeOut: 2500,
    });
  }
}

function doOpenChatU8() {
  const modal = document.querySelector("#ch-settings-modal");
  const isModalOpen = modal && $(modal).is(":visible");

  if (isModalOpen) {
    const closeBtn = document.querySelector("#ch-settings-modal-close");
    if (closeBtn) {
      closeBtn.click();
      return;
    }
  }

  const selectors = [
    "#st-chatu8-fab",
    'button[title*="悬浮球"]',
    "#st-chatu8-settings-btn",
    "#ch-settings-modal-open",
    "#st-chatu8-ai-settings-btn",
    'button[id*="chatu8"][class*="fab"]',
  ];

  for (const selector of selectors) {
    const btn = document.querySelector(selector);
    if (btn) {
      btn.click();
      return;
    }
  }

  toastr.warning("未检测到 智绘姬 插件，请确认已安装并启用", "", {
    timeOut: 3000,
  });
}

function doRegenerateReply() {
  if (chat.length === 0) return;
  Generate("regenerate");
}

function doGenerateSwipe() {
  if (chat.length === 0) return;
  const lastMsg = chat[chat.length - 1];
  if (lastMsg.is_user) {
    toastr.warning("最后一条消息是用户消息，无法生成备选", "", {
      timeOut: 1500,
    });
    return;
  }
  const $lastMes = $("#chat .mes").last();
  const $swipeRight = $lastMes.find(".swipe_right");
  if ($swipeRight.length && $swipeRight.is(":visible")) {
    $swipeRight.trigger("click");
    return;
  }
  try {
    Generate("swipe");
  } catch (e) {
    console.error("生成备选回复失败", e);
    toastr.error("生成备选回复失败，请检查酒馆版本", "", { timeOut: 1500 });
  }
}

function insertCustomSymbol(symbol) {
  if (!getSettings().enabled) return;
  const target = getInsertionTarget();
  if (!target) return;
  function _calcCursorPos(sym) {
    if (sym.cursorPos === "start") return 0;
    if (sym.cursorPos === "end") return sym.symbol.length;
    if (sym.cursorPos === "middle") return Math.floor(sym.symbol.length / 2);
    return parseInt(sym.cursorPos) || 0;
  }
  const _splitPos = _calcCursorPos(symbol);
  const _leftPart = symbol.symbol.substring(0, _splitPos);
  const _rightPart = symbol.symbol.substring(_splitPos);
  let _hasSelection = false;
  if (target.isContentEditable) {
    const cmView = getCodeMirrorView(target);
    if (cmView) {
      const sel = cmView.state.selection.main;
      _hasSelection = sel.from !== sel.to;
    } else {
      const doc = target.ownerDocument || document;
      const win = doc.defaultView || window;
      const s = win.getSelection();
      _hasSelection = s && s.toString().length > 0;
    }
  } else {
    _hasSelection = (target.selectionStart || 0) !== (target.selectionEnd || 0);
  }
  if (
    (symbol.wrapMode || wrapModeController.active) &&
    _hasSelection &&
    _leftPart.length > 0 &&
    _rightPart.length > 0
  ) {
    insertPair(_leftPart, _rightPart, _leftPart.length);
    return;
  }
  const isExternal = isExternalTarget(target);

  if (target.isContentEditable) {
    const cmView = getCodeMirrorView(target);
    if (cmView) {
      const state = cmView.state;
      const { from, to } = state.selection.main;
      let cp;
      if (symbol.cursorPos === "start") cp = 0;
      else if (symbol.cursorPos === "end") cp = symbol.symbol.length;
      else if (symbol.cursorPos === "middle")
        cp = Math.floor(symbol.symbol.length / 2);
      else cp = parseInt(symbol.cursorPos) || 0;
      cmView.dispatch({
        changes: { from, to, insert: symbol.symbol },
        selection: { anchor: from + cp },
      });
      cmView.focus();
      return;
    }
    const doc = target.ownerDocument || document;
    const win = doc.defaultView || window;
    target.focus();
    const sel = win.getSelection();
    if (_savedRange) {
      try {
        sel.removeAllRanges();
        sel.addRange(_savedRange);
      } catch (e) {}
      _savedRange = null;
    }
    doc.execCommand("insertText", false, symbol.symbol);
    return;
  }

  if (isExternal) historyManager.pushState($(target));
  else saveStateBeforeAction();
  const startPos = target.selectionStart || 0;
  const endPos = target.selectionEnd || 0;
  const text = target.value || "";
  const newText =
    text.substring(0, startPos) + symbol.symbol + text.substring(endPos);
  const _savedScrollTop2 = target.scrollTop;
  target.value = newText;
  target.dispatchEvent(new Event("input", { bubbles: true }));
  setTimeout(() => {
    let cursorPos;
    if (symbol.cursorPos === "start") cursorPos = startPos;
    else if (symbol.cursorPos === "end")
      cursorPos = startPos + symbol.symbol.length;
    else if (symbol.cursorPos === "middle")
      cursorPos = startPos + Math.floor(symbol.symbol.length / 2);
    else cursorPos = startPos + (parseInt(symbol.cursorPos) || 0);
    try {
      target.selectionStart = cursorPos;
      target.selectionEnd = cursorPos;
      target.focus({ preventScroll: true });
      target.scrollTop = _savedScrollTop2;
    } catch (e) {}
    historyManager.pushState($(target));
  }, 0);
}

function ihEscapeHtml(value) {
  if (value == null) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function ihEscapeAttr(value) {
  return ihEscapeHtml(value);
}

function isMessageHidden(msg) {
  if (!msg || !msg.is_system) return false;
  if (msg.is_user) return true;
  if (msg.force_avatar) return true;
  if (msg.swipes && msg.swipes.length > 1) return true;
  if (msg.extra && msg.extra.api) return true;
  if (msg.extra && msg.extra.model) return true;
  if (msg.name && (!msg.extra || msg.extra.type !== "narrator")) return true;
  return false;
}

function getHiddenStatus() {
  const total = chat.length;
  if (total === 0) return { hidden: [], total: 0, summary: "当前没有消息" };
  const hidden = [];
  for (let i = 0; i < total; i++) {
    if (isMessageHidden(chat[i])) hidden.push(i);
  }
  if (hidden.length === 0)
    return { hidden, total, summary: `无隐藏消息（共 ${total} 条）` };
  const ranges = [];
  let start = hidden[0],
    end = hidden[0];
  for (let i = 1; i < hidden.length; i++) {
    if (hidden[i] === end + 1) {
      end = hidden[i];
    } else {
      ranges.push(start === end ? `${start}` : `${start}~${end}`);
      start = hidden[i];
      end = hidden[i];
    }
  }
  ranges.push(start === end ? `${start}` : `${start}~${end}`);
  return {
    hidden,
    total,
    summary: `已隐藏 ${ranges.join(", ")}（共 ${hidden.length} 条 / 总 ${total} 条）`,
  };
}

async function _doHideUnhideRange(from, to, isHide) {
  if (from === "" && to === "") return;
  const total = chat.length;
  const f = from === "" ? 0 : parseInt(from);
  const t = to === "" ? total - 1 : parseInt(to);
  if (isNaN(f) || isNaN(t) || f < 0 || t >= total || f > t) {
    toastr.error(`无效范围: ${f} ~ ${t}（总消息 0~${total - 1}）`, "", {
      timeOut: 2500,
    });
    return;
  }
  await executeSlashCommandsWithOptions(
    `/${isHide ? "hide" : "unhide"} ${f}-${t}`,
  );
  await new Promise((r) => setTimeout(r, 300));
  toastr.success(`${isHide ? "已隐藏" : "已取消隐藏"} ${f} ~ ${t}`, "", {
    timeOut: 1000,
  });
}

async function doHideRange(from, to) {
  return _doHideUnhideRange(from, to, true);
}

async function doUnhideRange(from, to) {
  return _doHideUnhideRange(from, to, false);
}

async function _doHideUnhideOne(floor, isHide) {
  const total = chat.length;
  const f = parseInt(floor);
  if (isNaN(f) || f < 0 || f >= total) {
    toastr.error(`无效楼层: ${floor}（总消息 0~${total - 1}）`, "", {
      timeOut: 2500,
    });
    return;
  }
  await executeSlashCommandsWithOptions(`/${isHide ? "hide" : "unhide"} ${f}`);
  await new Promise((r) => setTimeout(r, 300));
  toastr.success(`${isHide ? "已隐藏楼层" : "已取消隐藏楼层"} ${f}`, "", {
    timeOut: 1000,
  });
}

async function doHideOne(floor) {
  return _doHideUnhideOne(floor, true);
}

async function doUnhideOne(floor) {
  return _doHideUnhideOne(floor, false);
}

async function doKeepRecent(count) {
  const total = chat.length;
  const n = parseInt(count);
  if (isNaN(n) || n <= 0) {
    toastr.error("请输入正整数", "", { timeOut: 1000 });
    return;
  }
  if (n >= total) {
    await executeSlashCommandsWithOptions(`/unhide 0-${total - 1}`);
    await new Promise((r) => setTimeout(r, 300));
    toastr.info("消息总数不超过设定值，已显示全部", "", { timeOut: 1000 });
    return;
  }
  const hideEnd = total - n - 1;
  const showStart = total - n;
  await executeSlashCommandsWithOptions(`/hide 0-${hideEnd}`);
  await executeSlashCommandsWithOptions(`/unhide ${showStart}-${total - 1}`);
  await new Promise((r) => setTimeout(r, 300));
  toastr.success(`已隐藏 0~${hideEnd}，保留最近 ${n} 条`, "", {
    timeOut: 1500,
  });
}

async function doHideAll() {
  const total = chat.length;
  if (total === 0) return;
  await executeSlashCommandsWithOptions(`/hide 0-${total - 1}`);
  await new Promise((r) => setTimeout(r, 300));
  toastr.success("已隐藏全部消息", "", { timeOut: 1000 });
}

async function doUnhideAll() {
  const total = chat.length;
  if (total === 0) return;
  await executeSlashCommandsWithOptions(`/unhide 0-${total - 1}`);
  await new Promise((r) => setTimeout(r, 300));
  toastr.success("已显示全部消息", "", { timeOut: 1000 });
}

function openBeautyPromptPanel() {
  const promptText = `帮我写一段 CSS 美化 SillyTavern 快捷工具栏插件的样式，可以包括工具栏容器和/或按钮。

## 插件信息

插件通过 JS 给 #send_form 添加/移除 .textarea-focused 类来控制工具栏展开收起。
展开选择器为：#send_form.textarea-focused .input-helper-toolbar
固定展开选择器为：#send_form.ih-toolbar-pinned .input-helper-toolbar
外部输入框聚焦展开选择器为：#send_form.ih-external-focused .input-helper-toolbar
（当用户点击其他位置的输入框（如沙盒网页里的输入框）时，工具栏也会展开，方便插入内容到那些输入框）

插件按钮的默认样式供参考（你可以按需覆盖其中任何属性）：
- display: inline-flex，内容自适应宽度
- padding: 2px 6px，font-size: 12px
- background-color / border / color 跟随酒馆主题变量
- border-radius: 5px
- flex-shrink: 0（防止按钮被挤压）

## 双栏模式

工具栏支持双栏排列（在插件设置中开启）。
开启双栏模式后，\`#input_helper_toolbar\` 会自动获得 \`.ih-two-row-active\` class。

## 选择器

### 容器（可选，只写视觉属性）
- #input_helper_toolbar

### 按钮（三个状态）
- 默认：#input_helper_toolbar button.input-helper-btn
- 悬停：#input_helper_toolbar button.input-helper-btn:hover
- 按下：#input_helper_toolbar button.input-helper-btn:active

### 查找替换栏按钮（可选）
- 导航按钮默认：.ih-find-bar .ih-find-nav-btn
- 导航按钮悬停：.ih-find-bar .ih-find-nav-btn:hover
- 操作按钮默认：.ih-find-bar .ih-find-action-btn
- 操作按钮悬停：.ih-find-bar .ih-find-action-btn:hover
- Aa 区分大小写按钮：.ih-find-bar .ih-find-case-btn
- 折叠按钮：.ih-find-bar .ih-find-collapse-btn
- 折叠按钮左/右图标：.ih-collapse-icon-left / .ih-collapse-icon-right
- 计数三段：.ih-find-count-cur / .ih-find-count-sep / .ih-find-count-total

### 查找替换栏折叠态（可选）
当用户点击折叠按钮后，整个查找框会收成屏幕左侧的窄竖条，只显示
展开按钮、上/下导航、计数三个元素。折叠按钮默认使用双左箭头/双右箭头图标表示收起和展开。
如果你需要美化这个折叠态：
- 折叠态容器：.ih-find-bar.ih-find-bar-collapsed
- 折叠态里的按钮：.ih-find-bar.ih-find-bar-collapsed .ih-find-nav-btn
- 折叠态里的计数（变成竖排）：.ih-find-bar.ih-find-bar-collapsed .ih-find-count

注意：折叠态的容器位置（left/top/width/min-width）由插件控制，
不要覆盖这些定位属性，只写视觉相关的 background/border/box-shadow 等。

### 文件夹下拉面板（可选）
- 面板容器（只写视觉属性）：.ih-folder-dropdown-portal
- 面板按钮默认：.ih-folder-dropdown-portal .input-helper-btn
- 面板按钮悬停：.ih-folder-dropdown-portal .input-helper-btn:hover

### 悬浮球（可选）
- 默认：.ih-floating-ball
- 展开状态：.ih-floating-ball.ih-ball-expanded
- 悬停：.ih-floating-ball:hover
- 按下：.ih-floating-ball:active

### 悬浮面板（可选）
- 面板容器（只写视觉属性）：.ih-floating-panel
- 面板按钮默认：.ih-floating-panel .input-helper-btn
- 面板按钮悬停：.ih-floating-panel .input-helper-btn:hover
- 面板按钮按下：.ih-floating-panel .input-helper-btn:active

悬浮面板有三种方向：
- vertical：按钮竖向排列，面板优先向悬浮球左/右侧展开
- vertical-down：按钮竖向排列，面板根据空间向下/向上展开
- horizontal：按钮横向排列，面板根据空间向下/向上展开

### 双栏模式（可选）
工具栏开启双栏模式后，\`#input_helper_toolbar\` 会自动获得 \`.ih-two-row-active\` class，
内部会生成 \`.ih-two-row-container\` 容器，包含两行：
- 符号栏：.ih-two-row.ih-two-row-input
- 功能栏：.ih-two-row.ih-two-row-function
这两行各自可以横向滚动。如果需要在双栏模式下微调各行样式，可以使用以上选择器。
注意不要改变 flex-direction 等布局属性。

## 重要约束（必须遵守）

1. **不要写 display 属性**
   插件通过 JS 的 \`.toggle()\` / \`.hide()\` 控制按钮显示隐藏（设置 \`display: none\`）。
   如果你写了 \`display: inline-flex !important\`，会覆盖 JS 设置的 \`display: none\`，
   导致用户在插件设置里关闭的按钮仍然显示。
   查找替换折叠按钮内部也有两个图标（收起图标和展开图标），同样依赖 display 切换显示，
   不要用全局 CSS 强行覆盖 \`.ih-collapse-icon-left\` 或 \`.ih-collapse-icon-right\` 的 display。
   如果确实需要写 display，绝对不能加 !important。

2. **容器样式只能写视觉属性**
   如果你要给 \`#input_helper_toolbar\` 写样式，只允许写以下视觉属性：
   - ✅ 允许：background、border、border-radius、box-shadow、backdrop-filter
   - ❌ 禁止：display、flex-direction、justify-content、align-items、gap、
     overflow、max-height、opacity、pointer-events、transition、padding、margin、
     width、height、position、z-index、flex-wrap

   禁止的这些属性由插件的伸缩逻辑控制，覆盖后会导致：
   - \`justify-content: center\` → 移动端按钮溢出时左侧第一个按钮被裁切
   - \`max-height\` / \`opacity\` / \`pointer-events\` → 伸缩动画失效
   - \`overflow\` → 移动端无法横向滑动
   - \`flex-wrap\` → 破坏单栏横向滚动及双栏垂直排列逻辑

   如果你不需要修改容器外观，可以完全不写容器样式。

3. **不要用 :hover 或 :focus-within 控制工具栏展开**
   插件的伸缩逻辑通过 JS 给 #send_form 添加以下类来控制：
   - .textarea-focused：发送框聚焦时
   - .ih-external-focused：外部输入框（如沙盒网页输入框）聚焦时
   - .ih-toolbar-pinned：固定展开模式
   只在用户手动点击输入框时才触发展开。
   不要写 \`#send_form:hover\` 或 \`#send_form:focus-within\` 来控制工具栏的
   max-height、opacity、pointer-events 等展开属性，否则会导致：
   - 鼠标划过输入区域时工具栏意外弹出
   - 点击输入栏内其他插件按钮时工具栏意外弹出
   如果你需要覆盖展开状态的样式，使用：
   \`#send_form.textarea-focused .input-helper-toolbar\`
   \`#send_form.ih-external-focused .input-helper-toolbar\`
   或固定展开时使用：
   \`#send_form.ih-toolbar-pinned .input-helper-toolbar\`

4. **不要写 background-clip: text**
   如果你的美化 CSS 里有其他选择器用了 \`background-clip: text\` + \`color: transparent\`
   的组合（通常用于图标渐变效果），请确保这些选择器不会命中快捷工具栏的按钮。
   否则按钮文字会变透明看不见。

5. **中文符号按钮的特殊样式**
   插件通过 JS 检测按钮文本中的 CJK 字符（中日韩文字及符号），对纯文本按钮（无图标）自动应用
   \`letter-spacing: -1px\` 和 \`padding: 3px\` 的 inline style + !important 来收窄按钮宽度。
   这会影响「」『』《》三个内置按钮，以及任何显示文字包含中文的自定义按钮。
   悬浮面板中的 CJK 按钮也有类似的 padding 收窄处理。
   由于是 inline style + !important，外部 CSS 无法覆盖这些属性。
   通常不需要单独处理这些按钮。

6. **每条属性加 !important**（display 除外）
   因为需要覆盖插件默认样式，所有属性都需要 !important。
   唯一例外是 display 属性，原因见第 1 条。

7. **容器高度由 CSS 变量 \`--ih-toolbar-max-h\` 控制**
   插件 JS 会动态计算工具栏内容高度并设置这个变量。
   不要用固定的 \`max-height\` 值覆盖它，否则双栏模式下按钮会被裁切。

8. **不要写查找替换栏的容器样式**
   不要给 \`.ih-find-bar\` 写任何样式。
   查找替换栏由插件控制显示/隐藏和定位，覆盖后会导致动画和定位异常。
   如果需要美化查找栏内的按钮，使用上述「查找替换栏按钮」部分提供的选择器。

9. **悬浮球样式约束**
   如果你要给 \`.ih-floating-ball\` 写样式：
   - ✅ 允许：background、background-color、background-image、background-size、
     background-position、background-repeat、border、border-color、
     box-shadow、opacity、backdrop-filter、filter、color、outline、transition
   - ❌ 禁止：position、z-index、width、height、top、left、right、
     bottom、transform、border-radius
   悬浮球的 width/height 由大小滑块设置，border-radius 由形状选项控制，
   position/top/left 由拖拽位置决定。

   如果用户需要用 CSS 实现纯图片球，需要注意：
   - 不要在插件设置里填图片URL（否则 <img> 会和 background-image 重复显示）
   - 不要勾选透明背景（CSS 自己处理）
   - 必须同时关闭 background、border、box-shadow、backdrop-filter、outline 全家桶，否则会看到一圈"透明背景板"或光晕
   - background-size 用 contain 保持图片原比例不裁切，用 cover 会裁切两侧
   - 如果发现圆形悬浮球的图片四个角被圆形边界裁掉了一圈，是因为 background-size: contain 会让图片贴着容器边缘铺满，而圆形容器会切掉超出圆形的四角。解决办法是把 background-size 改成一个百分比（如 90%），主动让图片缩小、四周留出安全边距，数值越小留白越多。插件内置图片方式默认就是让图片只占圆形球的 90% 来留边，CSS 方式需要你自己加这个边距
   - 需要隐藏默认省略号图标：\`.ih-floating-ball > i { display: none !important; }\`（如果发现三个点仍未隐藏，说明选择器权重不够，改用更具体的写法：\`.ih-floating-ball i[class*="fa-"] { display: none !important; }\`）
   - 如果要给展开状态使用另一张图，请写 \`.ih-floating-ball.ih-ball-expanded { background-image: url("展开图") !important; }\`
   - 如果当前美化不想区分展开状态，可以不要写 \`.ih-ball-expanded\`，插件会继续使用默认球图

   注意：用户可以在插件设置里切换「跟随美化」开关。
   - 开启「跟随美化」：全局 CSS 可以接管悬浮球外观；如果 CSS 给 \`.ih-floating-ball\` 写了 background-image，插件会优先使用 CSS 背景图，不再显示插件设置里的球图片
   - 关闭「跟随美化」：插件自定义设置（图片、透明背景、形状等）优先，外部 CSS 对悬浮球的控制会被限制
   - 如果只想给展开状态换图，请同时写默认态 \`.ih-floating-ball\`，再写展开态 \`.ih-floating-ball.ih-ball-expanded\`，避免收起状态没有图片

   如果悬浮球设置了自定义图片（走插件内置方式），球内部会有一个 <img> 元素，
   CSS 背景色/背景图会被图片遮住。美化有图片的球时，
   建议用 border、box-shadow、outline 等不会被遮挡的属性做外框装饰。

10. **悬浮面板样式约束**
   如果你要给 \`.ih-floating-panel\` 写样式：
   - ✅ 允许：border、border-color、border-radius、box-shadow、opacity、
     backdrop-filter、filter、outline
   - ⚠️ 谨慎：background、background-color、background-image、color
   - ❌ 禁止：position、z-index、width、height、top、left、right、
     bottom、transform
   面板的位置由插件根据悬浮球位置自动计算，width/height 由内容撑开。
   border-radius 允许自由设置（与悬浮球不同）。

   如果希望悬浮面板继续跟随插件 JS 读取到的酒馆主题背景/文字色，
   不要在全局 CSS 里给 \`.ih-floating-panel\` 写：
   \`background\`、\`background-color\`、\`background-image\`、\`color\`，
   尤其不要加 \`!important\`。
   推荐只美化边框、圆角、阴影、透明度、滤镜等装饰属性。
   如果用户明确想让全局 CSS 完全接管面板外观，才可以写 background/color。

## 风格要求

我的美化整体配色风格是 [在这里描述你的配色风格]。
请匹配这个风格自由设计外观，三个状态之间要有柔和的视觉反馈变化。
可以自由发挥，包括但不限于配色、圆角、阴影、边框、大小、形状等。

## 输出格式

直接给我一段可以粘贴的 CSS 代码块，用 /* ===快捷工具栏=== */ 开头做注释标记。`;

  const { overlay, escHandler } = createDialogOverlay();
  const content = $(`
        <div class="ih-beauty-prompt-content">
            <h3 style="margin:0 0 14px;display:flex;align-items:center;gap:8px;font-size:15px;">
                <i class="fa-solid fa-palette"></i> 快捷工具栏美化指南
            </h3>
            <div style="font-size:11px;opacity:0.6;margin-bottom:12px;line-height:1.6;">
                将下方提示词复制给 AI，并在「风格要求」处填写配色风格描述，即可生成匹配当前主题的快捷工具栏美化 CSS。
            </div>
            <div class="ih-beauty-prompt-box">
                <pre class="ih-beauty-prompt-text"></pre>
            </div>
            <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:14px;">
                <button class="ih-hm-btn ih-hm-btn-ok" id="ih_beauty_copy"><i class="fa-solid fa-copy"></i> 复制提示词</button>
                <button class="ih-hm-btn ih-hm-btn-close" id="ih_beauty_close">关闭</button>
            </div>
        </div>
    `);
  content.find(".ih-beauty-prompt-text").text(promptText);
  overlay.append(content);
  syncDialogTheme(content[0]);
  content.on("click", (e) => e.stopPropagation());
  generateFaIconProtectionCSS();
  const closeDialog = () => {
    document.removeEventListener("keydown", escHandler, true);
    overlay.remove();
  };
  overlay.off("click").on("click", (e) => {
    if (e.target === overlay[0]) closeDialog();
  });
  content.find("#ih_beauty_close").on("click", closeDialog);
  content.find("#ih_beauty_copy").on("click", function () {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard
          .writeText(promptText)
          .then(() => {
            toastr.success("已复制到剪贴板", "", { timeOut: 500 });
          })
          .catch(() => {
            fallbackCopy(promptText);
          });
      } else {
        fallbackCopy(promptText);
      }
    } catch (e) {
      fallbackCopy(promptText);
    }
  });
  function fallbackCopy(text) {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.cssText = "position:fixed;left:-9999px;top:-9999px;opacity:0;";
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand("copy");
      toastr.success("已复制到剪贴板", "", { timeOut: 500 });
    } catch (e2) {
      toastr.error("复制失败，请手动选择复制", "", { timeOut: 1000 });
    }
    document.body.removeChild(ta);
  }
}

let _latestRemoteVersion = "";

function compareVersions(a, b) {
  const pa = String(a || "")
    .split(".")
    .map((n) => parseInt(n) || 0);
  const pb = String(b || "")
    .split(".")
    .map((n) => parseInt(n) || 0);
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i++) {
    if ((pa[i] || 0) > (pb[i] || 0)) return 1;
    if ((pa[i] || 0) < (pb[i] || 0)) return -1;
  }
  return 0;
}

async function checkRemoteUpdate() {
  try {
    const localResp = await fetch(
      `/scripts/extensions/third-party/${extensionName}/manifest.json`,
    );
    if (!localResp.ok) return;
    const localManifest = await localResp.json();
    const localVersion = localManifest.version || "";
    const homePage = localManifest.homePage || localManifest.homepage || "";
    const match = homePage.match(/github\.com\/([^/]+)\/([^/.]+)/);
    if (!match) return;
    const owner = match[1];
    const repo = match[2];
    let remoteVersion = "";
    for (const branch of ["main", "master"]) {
      try {
        const url = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/manifest.json?t=${Date.now()}`;
        const resp = await fetch(url, { cache: "no-cache" });
        if (resp.ok) {
          const m = await resp.json();
          remoteVersion = m.version || "";
          if (remoteVersion) break;
        }
      } catch (e) {}
    }
    if (!remoteVersion) return;
    _latestRemoteVersion = remoteVersion;
    if (compareVersions(remoteVersion, localVersion) > 0) {
      const s = getSettings();
      if (s.lastSeenChangelogVersion !== remoteVersion) {
        const badge = document.getElementById("ih_new_badge");
        if (badge) {
          badge.style.display = "inline-block";
          badge.title = `发现新版本 v${remoteVersion}（当前 v${localVersion}），请在扩展管理器中更新`;
        }
      }
    }
  } catch (e) {
    console.warn("快捷工具栏: 远程版本检查失败", e);
  }
}

const CHANGELOG_VERSION = "3.1.0";
const CHANGELOG_HTML = `
<h4 style="margin:14px 0 6px;font-size:13px;color:var(--SmartThemeQuoteColor,cornflowerblue);">v3.1.0</h4>
<ul style="margin:4px 0;padding-left:18px;font-size:12px;line-height:1.7;">
  <li><b>消息管理新增「搜索」标签</b>：可直接检索聊天消息，无需逐层翻找，支持搜索当前聊天档、指定聊天档或同一角色的全部聊天档。</li>
  <li><b>支持多聊天档联合搜索</b>：搜索结果会按聊天档分组展示，并标出命中楼层、发送者、匹配次数及关键词上下文。</li>
  <li><b>关键词高亮与完整预览</b>：命中内容会在摘要中高亮显示；同一条消息包含多处匹配时可逐处切换，也可打开完整内容预览并依次定位所有高亮位置。</li>
  <li><b>快速跳转</b>：点击搜索结果右侧的定位按钮，可直接跳转至当前聊天对应楼层；其他聊天档的结果会自动打开目标聊天并定位到命中消息。</li>
  <li><b>搜索范围与大小写控制</b>：可随时切换当前、指定或全部聊天档，并通过 Aa 按钮启用区分大小写搜索。</li>
  <li><b>指定聊天档多选</b>：支持一次选择多个聊天档进行定向检索，最近使用过的聊天档会优先显示，查找支线、旧剧情和角色设定更省事。</li>
  <li><b>搜索结果转存篮</b>：可将来自不同聊天档的搜索结果加入转存篮，统一复制或移动至目标聊天档，适合整理散落剧情、片段归档和跨档合并。</li>
  <li><b>搜索缓存优化</b>：已读取的聊天档会短暂缓存，重复搜索时减少文件读取等待，同时避免不同角色之间的缓存混用。</li>
</ul>
`;

function setupChangelogAutoPopup() {
  const drawer = document.querySelector(
    ".input-helper-settings .inline-drawer",
  );
  if (!drawer) return;
  if (drawer._ihChangelogBound) return;
  drawer._ihChangelogBound = true;
  const toggle = drawer.querySelector(".inline-drawer-toggle");
  if (!toggle) return;
  toggle.addEventListener("click", function () {
    setTimeout(() => {
      const s = getSettings();
      if (s.lastSeenChangelogVersion === CHANGELOG_VERSION) return;
      const content = drawer.querySelector(".inline-drawer-content");
      if (!content) return;
      if (content.offsetHeight > 0) {
        openChangelogPanel();
      }
    }, 250);
  });
}

function openChangelogPanel() {
  const latestKnown =
    _latestRemoteVersion &&
    compareVersions(_latestRemoteVersion, CHANGELOG_VERSION) > 0
      ? _latestRemoteVersion
      : CHANGELOG_VERSION;
  getSettings().lastSeenChangelogVersion = latestKnown;
  saveSettingsDebounced();
  const badge = document.getElementById("ih_new_badge");
  if (badge) badge.style.display = "none";
  const { overlay, escHandler } = createDialogOverlay();
  const content = $(`
    <div class="ih-help-panel-content">
      <h3 style="margin:0 0 12px;display:flex;align-items:center;gap:8px;font-size:15px;">
        <i class="fa-solid fa-clipboard-list"></i> 更新日志
        <span style="margin-left:auto;font-size:12px;opacity:0.7;font-weight:normal;color:var(--SmartThemeQuoteColor,cornflowerblue);">v${CHANGELOG_VERSION}</span>
      </h3>
      <div style="font-size:12px;line-height:1.8;opacity:0.92;">
        ${CHANGELOG_HTML}
      </div>
      <div style="display:flex;justify-content:flex-end;margin-top:16px;">
        <button class="ih-hm-btn ih-hm-btn-close" id="ih_changelog_close">关闭</button>
      </div>
    </div>
  `);
  overlay.append(content);
  syncDialogTheme(content[0]);
  content.on("click", (e) => e.stopPropagation());
  generateFaIconProtectionCSS();
  const closeDialog = () => {
    document.removeEventListener("keydown", escHandler, true);
    overlay.remove();
  };
  overlay.off("click").on("click", (e) => {
    if (e.target === overlay[0]) closeDialog();
  });
  content.find("#ih_changelog_close").on("click", closeDialog);
}

function openHelpPanel() {
  const { overlay, escHandler } = createDialogOverlay();
  const helpText = `
<h3 style="margin:0 0 12px;display:flex;align-items:center;gap:8px;font-size:15px;">
    <i class="fa-solid fa-circle-question"></i> 快捷工具栏 使用说明
</h3>
<div style="font-size:12px;line-height:1.8;opacity:0.92;">

<h4 style="margin:8px 0 8px;font-size:14px;font-weight:700;border-bottom:1px solid color-mix(in srgb, currentColor 30%, transparent);padding-bottom:4px;"><i class="fa-solid fa-info-circle"></i> 关于工具栏</h4>
<p>工具栏默认在聚焦聊天输入框时展开，离开后自动收起。可在设置面板顶部开启<q>「工具栏固定展开」</q>使其始终保持展开状态。</p>
<p><b>移动端开合手势</b>：点击输入框时工具栏会展开。在工具栏上向上滑动可展开、向下滑动可收起并收回键盘，便于单手操作。</p>

<h4 style="margin:18px 0 8px;font-size:14px;font-weight:700;border-bottom:1px solid color-mix(in srgb, currentColor 30%, transparent);padding-bottom:4px;"><i class="fa-solid fa-globe"></i> 外部输入框支持</h4>
<p>工具栏不仅作用于聊天输入框。当光标位于以下位置时，符号按钮、撤回/重做、查找替换等功能会作用于该位置：</p>
<ul>
    <li>聊天消息的编辑框</li>
    <li>角色卡定义、世界书条目、预设内容等编辑器</li>
    <li>酒馆沙盒网页或 iframe 中的输入框</li>
    <li>CodeMirror 代码编辑器</li>
    <li>contentEditable 区域</li>
</ul>
<p>滚动类功能（跳转顶部/底部、翻页等）会自动作用于光标所在的可滚动容器，而非默认的聊天区。</p>

<h4 style="margin:18px 0 8px;font-size:14px;font-weight:700;border-bottom:1px solid color-mix(in srgb, currentColor 30%, transparent);padding-bottom:4px;"><i class="fa-solid fa-pen"></i> 编辑功能</h4>

<p style="margin:10px 0 4px;font-weight:600;"><i class="fa-solid fa-rotate-left"></i> 撤回 / 重做</p>
<p>支持多步撤回和重做，最多保留 50 步历史。外部编辑框拥有独立的历史记录。若同一个 textarea 被酒馆复用于编辑不同内容，插件会自动重建历史，避免不同页面之间的撤回历史相互干扰。</p>

<p style="margin:10px 0 4px;font-weight:600;"><i class="fa-solid fa-up-down-left-right"></i> 选中模式</p>
<p>移动端文本选择辅助工具。开启后，先在输入框中点击一个位置作为起点，再点击另一个位置，插件会将两点之间的文本全部选中。再次点击按钮关闭该模式。</p>

<p style="margin:10px 0 4px;font-weight:600;"><i class="fa-solid fa-caret-left"></i><i class="fa-solid fa-caret-right"></i> 光标左移 / 右移</p>
<p>移动端精确移动光标的辅助按钮。点击一次移动一个字符，长按可连续移动（约 0.35 秒后触发连续移动，松开按钮停止）。光标移动不会触发输入事件，不会影响撤销历史。默认关闭，可在<q>「按钮管理」</q>中启用。</p>

<p style="margin:10px 0 4px;font-weight:600;"><i class="fa-solid fa-object-group"></i> 选中包裹模式</p>
<p>全局开关。开启后，自定义按钮的<q>「插入内容」</q>会按照设置的<q>「光标位置」</q>拆分为左右两半，自动包裹选中的文本。例如：自定义内容为 <code>**粗体**</code>，光标位置设为<q>「中间」</q>，开启此模式后选中 abc 再点击按钮，会变为 <code>**abc**</code>。</p>
<p>原生的 **、<q>""</q>、() 等内置符号按钮本身即为包裹模式，不受此开关影响。如需仅对个别按钮启用，可在编辑该自定义按钮时勾选其专属的<q>「选中包裹」</q>选项。</p>
<p style="margin:10px 0 4px;font-weight:600;"><i class="fa-solid fa-copy"></i> 复制 / 粘贴</p>
<p><b>复制</b>：复制当前输入框或编辑区域中选中的文本。</p>
<p><b>粘贴</b>：读取系统剪贴板内容并插入至当前光标位置。需要浏览器允许剪贴板权限，通常要求 HTTPS 或 localhost 环境。</p>
<p>两个按钮默认关闭，可在<q>「按钮管理」</q>中启用，也支持绑定快捷键。</p>
<p style="margin:10px 0 4px;font-weight:600;"><i class="fa-solid fa-eye-dropper"></i> 取色器</p>
<p>自动扫描当前输入框或编辑区域中的颜色值（支持 #十六进制、rgb / rgba、hsl / hsla 写法），并在一个可拖动的面板中列出，便于预览和修改。</p>
<ul>
    <li>点击某一行的颜色文本，可跳转并选中编辑框中对应的颜色，便于定位</li>
    <li>点击色块旁的取色按钮更换颜色，拖动滑块调整透明度，修改后自动写回编辑框</li>
    <li>面板支持拖动位置、拖动右下角调整大小；点击图钉按钮固定后，点击面板外部不会自动关闭，适合连续修改多个颜色</li>
    <li>将光标移动到编辑框中某个颜色上，面板会自动高亮对应行</li>
</ul>
<p>默认关闭，可在<q>「按钮管理」</q>中启用，也支持绑定快捷键。适合美化 CSS、调整配色时使用。</p>

<p style="margin:10px 0 4px;font-weight:600;"><i class="fa-solid fa-magnifying-glass"></i> 查找替换</p>
<p>在输入框、正在编辑的消息以及当前聚焦的外部输入框（包括 CodeMirror 编辑器）中查找和替换文本。</p>
<p>键盘操作：</p>
<ul>
    <li>Enter：跳转至下一个匹配项</li>
    <li>Shift+Enter：跳转至上一个匹配项</li>
    <li>Esc：关闭查找栏</li>
    <li>点击 Aa：切换是否区分大小写</li>
</ul>
<p>普通 textarea 中查找到的当前匹配会显示可视高亮。即使点击<q>「替换为」</q>输入框，当前匹配位置也会保持标记。</p>
<p><b>移动端折叠模式</b>：点击替换行最右侧的折叠按钮（双左箭头），可将查找框折叠为屏幕左侧的窄竖条，仅保留展开按钮、上/下导航、当前/总数。点击展开按钮（双右箭头）恢复完整面板。折叠状态下搜索状态、匹配位置、跨弹窗跟随等行为完全保留。</p>

<p style="margin:10px 0 4px;font-weight:600;"><i class="fa-solid fa-puzzle-piece"></i> 自定义内容</p>
<p>在设置面板中可添加自定义快捷输入按钮，点击后在输入框中插入预设内容。</p>
<p><b>插入内容</b>支持多种形式：</p>
<ul>
    <li>短符号：如 <code>**</code>、<code><q>「」</q></code>、<code><br></code></li>
    <li>宏或标签：如 <code>{{user}}</code>、<code><request:></code></li>
    <li>常用短语：签名、固定问候语等</li>
    <li>整段模板：剧情模板、人设片段、格式化指令等（支持多行）</li>
</ul>
<p>插入长段落时，建议为<q>「按钮显示」</q>填写简短文字或选择 Font Awesome 图标，避免按钮过宽。</p>
<p><b>光标位置</b>可设为开头/中间/结尾/自定义偏移。对于模板文本，自定义偏移可使光标自动定位到需要补充内容的位置。</p>
<p><b>选中包裹</b>勾选后：当输入框中已选中文本时点击此按钮，会按<q>「光标位置」</q>将插入内容拆分为左右两段包裹选区。例如内容为 <code>**符号**</code>、光标位置=中间，选中 hello 后点击按钮，将变为 <code>**hello**</code>。未选中文本时按正常方式插入。此为按钮专属设置，无需开启全局的<q>「选中包裹模式」</q>。</p>

<h4 style="margin:18px 0 8px;font-size:14px;font-weight:700;border-bottom:1px solid color-mix(in srgb, currentColor 30%, transparent);padding-bottom:4px;"><i class="fa-solid fa-compass"></i> 导航功能</h4>

<p style="margin:10px 0 4px;font-weight:600;">跳转按钮</p>
<ul>
    <li><i class="fa-solid fa-angles-up"></i> 跳转聊天顶部</li>
    <li><i class="fa-solid fa-arrow-down"></i> 跳转聊天底部</li>
    <li><i class="fa-solid fa-arrow-up"></i> 跳转 AI 消息顶部：滚动至最新一条 AI 回复的顶部</li>
    <li><i class="fa-solid fa-chevron-up"></i> / <i class="fa-solid fa-chevron-down"></i> 上 / 下一条 AI 消息</li>
</ul>

<p style="margin:10px 0 4px;font-weight:600;"><i class="fa-solid fa-book-open"></i> 翻页模式</p>
<p>开启后，上/下一条按钮变为翻页操作。</p>
<ul>
    <li><b>移动端</b>：点击聊天区域上半部分向上翻页，下半部分向下翻页</li>
    <li><b>音量键</b>：单击音量上/下键翻页（需安装 Key Mapper），双击音量上键跳转至最新 AI 消息顶部，双击音量下键跳转至聊天底部</li>
</ul>
<p>可在设置中通过<q>「翻页滚动高度」</q>调整每次翻页的距离，100% 约等于一屏高度，数值越小每次翻页距离越短，数值越大距离越长。</p>
<p>翻页模式开启时，若悬浮球设置了<q>「自动隐藏」</q>将自动显示以便操作，关闭翻页模式后恢复隐藏。</p>

<p style="margin:10px 0 4px;font-weight:600;"><i class="fa-solid fa-gauge-high"></i> 自动滚动</p>
<p>以设定速度自动向下滚动，适用于阅读长文。可在设置中调整<q>「自动滚动速度」</q>（单位 px/s）。用户手动滚动时自动暂停，2 秒后恢复。</p>

<p style="margin:10px 0 4px;font-weight:600;"><i class="fa-solid fa-angle-double-down"></i> 底部跳转模式</p>
<p>开启后，上/下一条消息跳转改为对齐消息底部而非顶部，适用于从底部向上浏览的阅读习惯。</p>

<p style="margin:10px 0 4px;font-weight:600;"><i class="fa-solid fa-arrows-up-down"></i> 包含用户消息导航</p>
<p>默认上/下一条按钮仅在 AI 消息间跳转。开启此模式后会同时跳转到用户消息。可与<q>「底部跳转模式」</q>叠加使用。</p>

<p style="margin:10px 0 4px;font-weight:600;">非流自动跳转至 AI 消息顶部</p>
<p>在设置中开启此选项后，非流式模式下 AI 生成回复完毕将自动滚动至该条消息的顶部，便于从头阅读长回复。流式输出时不受影响。</p>

<p style="margin:10px 0 4px;font-weight:600;"><i class="fa-solid fa-lock"></i> 续写时锁定滚动位置</p>
<p>在设置中开启此选项后，使用<q>「继续回复」</q>续写期间，聊天区域的滚动位置将被锁定。普通生成、重新生成、切换备选等其他场景不受影响。手动滚动（滑动或滚轮）将解除锁定。</p>

<h4 style="margin:18px 0 8px;font-size:14px;font-weight:700;border-bottom:1px solid color-mix(in srgb, currentColor 30%, transparent);padding-bottom:4px;"><i class="fa-solid fa-wand-magic-sparkles"></i> 消息操作</h4>

<p style="margin:10px 0 4px;font-weight:600;">基础操作按钮</p>
<ul>
    <li><i class="fa-solid fa-trash"></i> <b>删除最后消息</b>：删除聊天中的最后一条消息</li>
    <li><i class="fa-solid fa-scissors"></i> <b>删除当前备选</b>：删除最后一条消息的当前 Swipe</li>
    <li><i class="fa-solid fa-forward"></i> <b>继续回复</b>：让 AI 继续生成上一条回复</li>
    <li><i class="fa-solid fa-pencil"></i> <b>编辑最后消息</b>：自动滚动至末尾并进入编辑模式，等同于自动点击该消息的编辑按钮</li>
    <li><i class="fa-solid fa-rotate"></i> <b>重新生成</b>：重新生成最后一条 AI 回复</li>
    <li><i class="fa-solid fa-shuffle"></i> <b>生成备选回复</b>：为最后一条 AI 消息生成一条新的备选回复（Swipe）</li>
    <li><i class="fa-solid fa-paper-plane"></i> <b>发送 / 中止</b>：发送和停止合并为一个按钮。空闲时显示发送图标，点击等同于点击酒馆原生发送按钮，将输入框内容发送出去；AI 生成中时自动切换为停止图标并高亮，点击即中止生成。图标会实时跟随酒馆状态自动切换。默认关闭，可在<q>「按钮管理」</q>中启用。</li>
</ul>

<p style="margin:10px 0 4px;font-weight:600;"><i class="fa-solid fa-trash-arrow-up"></i> 撤回删除</p>
<p>在执行删除消息或删除备选等操作后，点击此按钮可撤回至操作前的状态。快照保留 5 分钟，过期或切换聊天后自动清除。最多保留 20 步快照，可连续撤回多次操作。</p>
<p style="margin:10px 0 4px;font-weight:600;"><i class="fa-solid fa-eye-low-vision"></i> 快速隐藏</p>
<p>一键快速隐藏最近的消息。第一次点击隐藏最后一条消息，继续点击依次向前隐藏倒数第二条、第三条……便于快速清理最近的消息上下文。</p>
<p>5 秒无操作后计数自动重置，下次点击将重新从最后一条开始。切换聊天时也会自动重置。按钮处于激活状态（高亮）时表示当前有连续隐藏记录。</p>
<p style="margin:10px 0 4px;font-weight:600;"><i class="fa-solid fa-trash-can"></i> 进入删除模式</p>
<p>一键进入或退出酒馆原生的消息多选删除模式。进入后可勾选多条消息批量删除。再次点击按钮退出删除模式。</p>

<p style="margin:10px 0 4px;font-weight:600;"><i class="fa-solid fa-triangle-exclamation"></i> 删除操作前弹窗确认</p>
<p>在设置中开启此选项后，所有涉及删除的操作（删除最后消息、删除备选、批量删除、删除聊天等）执行前将弹出二次确认弹窗，避免误操作。</p>

<h4 style="margin:18px 0 8px;font-size:14px;font-weight:700;border-bottom:1px solid color-mix(in srgb, currentColor 30%, transparent);padding-bottom:4px;"><i class="fa-solid fa-ghost"></i> 消息管理面板</h4>
<p>统一的消息管理面板，包含六个标签页：</p>

<p style="margin:10px 0 4px;font-weight:600;">隐藏</p>
<p>管理哪些消息对 AI 可见。支持单条隐藏/显示/跳转、范围隐藏/显示、保留最近 N 条可见、勾选多条批量隐藏/显示。隐藏的消息不会发送给 AI。</p>

<p style="margin:10px 0 4px;font-weight:600;">删除</p>
<p>可勾选任意多条消息（包括不连续楼层），或按范围批量删除。删除前将自动保存快照，5 分钟内可通过<q>「撤回删除」</q>恢复。</p>

<p style="margin:10px 0 4px;font-weight:600;">移动</p>
<p>勾选要移动的消息（可多条，包括不连续楼层），输入目标楼层号后点击移动，选中的消息将整体转移至目标位置。移动前自动保存快照，可通过<q>「撤回删除」</q>恢复。</p>
<p>输入目标楼层时，列表中会以箭头标记显示<q>「插入到此」</q>的落点，便于确认位置。</p>

<p style="margin:10px 0 4px;font-weight:600;">插入</p>
<p>在指定楼层插入一条空白消息，支持选择角色身份（用户、AI 角色、旁白/系统）。插入后自动跳转至该楼层并进入编辑状态，可直接输入内容。操作前自动保存快照，可通过<q>「撤回删除」</q>恢复。</p>
<p>典型用途：在对话中间补充遗漏的内容、手动添加旁白/系统指令、在特定位置注入上下文等。</p>

<p style="margin:10px 0 4px;font-weight:600;">转存</p>
<p>将当前聊天中的消息复制或移动至<b>同一角色的其他聊天档</b>。适用于将某段剧情迁移至新聊天中延续、将偏离主线的分支整理至独立存档、或将正文中生成的额外场景楼层转移至专属存档等场景。</p>
<p>转存面板采用上下分栏：</p>
<ul>
    <li><b>上方</b>为当前聊天，勾选需要转出的消息（可使用共享的全选、反选、范围选择等工具）</li>
    <li><b>下方</b>为目标聊天档预览，点击某条消息（或其前方的 <i class="fa-solid fa-crosshairs"></i> 落点按钮）即可将插入位置设定至该消息之前，也可点击最底部的<q>「追加到末尾」</q></li>
</ul>
<p><b>操作步骤</b>：切换至<q>「转存」</q>标签 → 上方勾选消息 → 选择目标聊天档 → 下方点击某条消息设为落点 → 点击<q>「复制」</q>或<q>「移动」</q>，完成后自动打开目标聊天。</p>
<p><b>复制与移动的区别</b>：复制会在原聊天中保留这些消息；移动会将这些消息从当前聊天中删除（数据并未丢失，仅转移至目标聊天档）。</p>
<p><b>转存方向（上 / 下切换）</b>：列表工具栏的<q>「已选 X 条」</q>右侧有一个<q>「上 / 下」</q>切换按钮，用于决定转存方向：</p>
<ul>
    <li>切换至<q>「上」</q>：从当前聊天转出至目标聊天档。上方显示勾选框（选择要转出的消息），下方为目标聊天档预览（点击某条消息设定插入落点），完成后自动打开目标聊天。</li>
    <li>切换至<q>「下」</q>：将其他聊天档中的消息转入当前聊天。下方显示勾选框（选择要转入的消息），上方显示当前聊天并标注插入落点（点击某条消息设定位置），完成后停留在当前聊天。</li>
</ul>
<p>全选、反选、范围选择、清除等操作会作用于当前显示勾选框的列表；倒序、楼层跳转、回到顶部、回到底部也会随方向切换同步调整。</p>
<p><b>目标档预览编辑</b>：下方每条消息的铅笔按钮可直接修改该楼层内容，保存后将写回目标聊天档文件。</p>
<p style="margin:10px 0 4px;font-weight:600;">搜索</p>
<p>按关键词检索聊天消息，支持当前聊天档、指定聊天档和同一角色的全部聊天档三种范围，并可通过 <q>Aa</q> 按钮切换是否区分大小写。</p>
<p>搜索结果会按聊天档分组显示命中楼层、发送者、匹配次数和上下文摘要。点击结果右侧的定位按钮可打开对应聊天并跳转至命中楼层；眼睛按钮可预览完整消息，并依次定位其中的所有匹配位置。</p>
<p>搜索结果右侧的转存按钮可将消息加入转存篮。转存篮支持收集多个聊天档中的消息，再统一复制或移动至指定聊天档。</p>
<p><b>注意</b>：指定聊天档和全部聊天档搜索目前仅支持单角色聊天，不支持群聊。</p>
<ul>
    <li>隐藏、删除、移动、插入和转存标签共用同一工具栏：全选、反选、范围选择、清除；搜索标签使用独立的搜索与转存篮工具</li>
    <li>勾选状态和滚动位置在标签页之间保留，切换标签不会丢失</li>
    <li>输入楼层号时列表会实时高亮对应消息：单条使用强调色、范围使用主题色、保留最近使用绿色</li>
    <li>每条消息的箭头按钮可一键跳转至原聊天位置</li>
    <li>每条消息的编辑按钮（铅笔图标）可直接修改该楼层内容，保存后聊天界面实时更新，无需刷新或重新进入聊天</li>
    <li>消息倒序按钮可切换列表显示方向，便于从最新消息向前浏览管理</li>
    <li>列表工具栏内置回到顶部、回到底部按钮以及楼层跳转框，输入楼层号并回车或点击跳转，列表将平滑滚动并将目标消息居中显示</li>
    <li>顶部「Token」徽章：点击展开显示当前聊天总 Token 数（数字在上、tokens 在下），再次点击收起；开启后，每条消息临时显示该楼层的 Token 数</li>
    <li>采用按需渲染，大量消息时也能保持流畅</li>
</ul>

<h4 style="margin:18px 0 8px;font-size:14px;font-weight:700;border-bottom:1px solid color-mix(in srgb, currentColor 30%, transparent);padding-bottom:4px;"><i class="fa-solid fa-address-book"></i> 聊天管理</h4>
<ul>
    <li><i class="fa-solid fa-address-book"></i> <b>聊天管理器</b>：打开当前角色或群聊的聊天列表</li>
    <li><i class="fa-solid fa-comments"></i> <b>新建聊天</b>：与当前角色开启一个全新的聊天</li>
    <li><i class="fa-solid fa-pen-to-square"></i> <b>重命名聊天</b>：弹窗输入新名称，回车或点击确定即可完成重命名</li>
    <li><i class="fa-solid fa-comment-slash"></i> <b>删除聊天</b>：删除当前聊天，删除前自动保存快照</li>
    <li><i class="fa-solid fa-xmark"></i> <b>关闭聊天</b>：关闭当前聊天并返回角色选择页</li>
</ul>
<p><b>删除聊天的撤回机制</b>：删除后会弹出<q>「点击此处撤回」</q>的提示（5 分钟内有效），点击即可恢复。</p>
<p><b>注意</b>：删除聊天会实际从酒馆中删除文件，5 分钟撤回窗口过期后无法恢复。重要聊天建议提前备份。</p>

<h4 style="margin:18px 0 8px;font-size:14px;font-weight:700;border-bottom:1px solid color-mix(in srgb, currentColor 30%, transparent);padding-bottom:4px;"><i class="fa-solid fa-folder"></i> 按钮分组</h4>
<p>可将按钮收纳至文件夹中，工具栏仅显示一个折叠按钮，点击后展开内部按钮。</p>
<p><b>设置方式</b>：在设置中将按钮拖动至文件夹上方即可放入文件夹，从文件夹中的按钮拖出即可移回主工具栏。也可使用<q>「移出文件夹」</q>按钮快速移回。</p>
<p>文件夹按钮放入悬浮面板后，展开子菜单时将自动选择弹出方向并避开屏幕边缘。</p>
<p><b>展开方向</b>：点击文件夹旁的方向按钮，可切换横向/竖向排列。子按钮较少时横排节省空间，较多时竖排便于查找。工具栏和悬浮面板中的文件夹均适用。</p>
<p><b>展开保持（图钉）</b>：点击文件夹旁的图钉按钮，可切换该文件夹展开后的关闭方式。开启固定（图钉高亮）后，展开的子菜单点击外部不会自动关闭，适用于连续插入符号、括号等操作；未开启固定时点击外部会自动收起，适用于单次点击即完成的功能按钮。再次点击文件夹本身可随时手动关闭。此设置对每个文件夹独立保存。</p>

<h4 style="margin:18px 0 8px;font-size:14px;font-weight:700;border-bottom:1px solid color-mix(in srgb, currentColor 30%, transparent);padding-bottom:4px;"><i class="fa-solid fa-circle-dot"></i> 悬浮面板</h4>

<p style="margin:10px 0 4px;font-weight:600;">基础说明</p>
<p>开启后将显示一个可拖拽的悬浮球或固定面板。可将导航跳转等功能按钮添加至面板。已添加至悬浮面板的按钮不会在主工具栏中重复显示。面板中的按钮支持拖拽排序。</p>
<ul>
    <li><b>悬浮球模式</b>：点击展开面板，点击其他区域自动收起</li>
    <li><b>固定面板模式</b>：常驻显示，可拖动手柄移动位置</li>
</ul>

<p style="margin:10px 0 4px;font-weight:600;">面板方向</p>
<ul>
    <li><b>竖向（侧边展开）</b>：按钮竖向排列，面板优先向悬浮球左右两侧展开</li>
    <li><b>竖向（上下展开）</b>：按钮竖向排列，面板根据空间向上或向下展开</li>
    <li><b>横向（上下展开）</b>：按钮横向单行排列，面板根据空间向上或向下展开，按钮过多时横向滚动</li>
    <li><b>自定义（侧边展开）</b>：面板使用设定宽度/高度，按钮按多列多行自动换行，优先向悬浮球左右两侧展开</li>
    <li><b>自定义（上下展开）</b>：面板使用设定宽度/高度，按钮按多列多行自动换行，并根据空间向上或向下展开</li>
</ul>

<p style="margin:10px 0 4px;font-weight:600;">悬浮球外观</p>
<ul>
    <li>支持自定义图片 URL（GIF / JPG / PNG）</li>
    <li>支持单独设置展开状态的图片，留空则使用默认图片</li>
    <li>形状可选圆形或方形</li>
    <li>大小可在 32~80px 范围内调整</li>
    <li><b>透明背景</b>：仅在上传了自定义图片时生效，开启后悬浮球的边框、阴影、背景色都将隐藏，只显示图片本身</li>
    <li><b>跟随美化</b>：开启后全局 CSS 可控制悬浮球外观；关闭后插件自定义设置优先于美化 CSS</li>
</ul>

<p style="margin:10px 0 4px;font-weight:600;">面板方案</p>
<p>可创建多套面板按钮配置（例如<q>「全屏模式」</q>使用翻页按钮、<q>「编辑模式」</q>使用符号按钮），可通过设置面板中的方案管理器切换，或将<q>「切换面板方案」</q>按钮添加至工具栏或悬浮面板中循环切换，也支持绑定快捷键。</p>
<p><b>面板方案保存以下五项设置</b>：</p>
<ul>
    <li>面板按钮列表（按钮内容及排列顺序）</li>
    <li>面板方向（竖向 / 横向 / 自定义）</li>
    <li>面板按钮大小</li>
    <li>面板宽度</li>
    <li>面板最大高度</li>
</ul>

<p style="margin:10px 0 4px;font-weight:600;">图片方案</p>
<p>悬浮球的外观由独立的图片方案管理，与面板方案分开切换。</p>
<p><b>图片方案保存以下六项设置</b>：</p>
<ul>
    <li>悬浮球图片 URL</li>
    <li>展开状态图片 URL</li>
    <li>球大小</li>
    <li>球形状（圆形 / 方形）</li>
    <li>透明背景开关</li>
    <li>跟随美化开关</li>
</ul>

<p style="margin:10px 0 4px;font-weight:600;"><i class="fa-solid fa-eye-slash"></i> 自动隐藏</p>
<p>开启后悬浮球或面板默认处于隐藏状态，点击屏幕任意空白位置即可切换显示或隐藏（包括聊天区域、抽屉空白处等）。点击悬浮球、面板自身、输入框、按钮、链接、弹窗等交互元素时不会触发切换。</p>
<p>翻页模式开启时将自动显示悬浮球，关闭翻页后自动隐藏。</p>

<p style="margin:10px 0 4px;font-weight:600;">移动端使用提示</p>
<ul>
    <li>悬浮球可自由拖动至屏幕任意位置，位置会自动保存</li>
    <li>设置面板顶部的<q>「重置位置」</q>按钮（图钉图标）可将悬浮球或面板恢复至默认位置，适用于悬浮球被拖出屏幕边缘无法找回的情况</li>
    <li>面板会自动避开手机软键盘；键盘弹出时若面板高度过大，将自动添加滚动条而不会被裁切</li>
    <li>展开后的面板会自动选择空间充足的方向（左 / 右 / 上 / 下）</li>
    <li>若上下空间均不足，将限制最大高度并添加滚动条</li>
    <li>悬浮球与展开后的面板默认会自动绑定至当前打开的弹窗内，关闭弹窗后返回主界面</li>
    <li>开启<q>「自动隐藏」</q>时，切换聊天或切换角色等操作将保持当前的隐藏 / 显示状态</li>
</ul>

<p style="margin:10px 0 4px;font-weight:600;">常见问题</p>
<ul>
    <li><b>面板不可见但悬浮球仍在</b>：请确认是否已开启自动隐藏，点击聊天区域即可重新显示</li>
    <li><b>美化 CSS 无法控制悬浮球</b>：请在设置中开启<q>「跟随美化」</q>开关</li>
</ul>

<h4 style="margin:18px 0 8px;font-size:14px;font-weight:700;border-bottom:1px solid color-mix(in srgb, currentColor 30%, transparent);padding-bottom:4px;"><i class="fa-solid fa-rocket"></i> 其他功能</h4>

<p style="margin:10px 0 4px;font-weight:600;"><i class="fa-solid fa-rocket"></i> QR 助手面板</p>
<p>点击 QR 助手按钮可快速打开 Quick Reply 助手面板（需安装 QR 助手插件）。</p>

<p style="margin:10px 0 4px;font-weight:600;">
  <i class="fa-solid fa-paintbrush"></i>
  智绘姬面板
</p>
<p>点击智绘姬面板按钮可快速打开智绘姬生图插件面板（需先安装并启用 <a href="https://github.com/damoshen123/st-chatu8" target="_blank">智绘姬</a> 插件）。</p>
<p style="margin:10px 0 4px;font-weight:600;"><i class="fa-solid fa-arrows-to-dot"></i> 重置悬浮球位置</p>
<p>将此按钮添加至工具栏后，点击即可将悬浮球/悬浮面板重置为默认位置，适用于悬浮球被拖出屏幕边缘无法找回的情况。功能与设置面板中的<q>「重置位置」</q>按钮相同。</p>

<p style="margin:10px 0 4px;font-weight:600;"><i class="fa-solid fa-palette"></i> 美化指南</p>
<p>在设置面板底部点击<q>「美化指南」</q>按钮，可获取一段提示词。将提示词复制给 AI 并填写配色风格描述，即可生成匹配主题的快捷工具栏美化 CSS。</p>

<h4 style="margin:18px 0 8px;font-size:14px;font-weight:700;border-bottom:1px solid color-mix(in srgb, currentColor 30%, transparent);padding-bottom:4px;"><i class="fa-solid fa-keyboard"></i> 快捷键</h4>
<p>在按钮管理中，点击每个按钮右侧的快捷键输入框，按下所需的组合键即可绑定。按 Esc 键清除。</p>

<p style="margin:10px 0 4px;font-weight:600;">生效范围</p>
<ul>
    <li><b>输入类快捷键</b>（符号插入、撤回重做等）：仅在发送输入框聚焦时生效</li>
    <li><b>导航 / 操作类快捷键</b>（翻页、滚动、删除等）：在聊天界面全局生效</li>
    <li>在设置面板等其他输入框中输入内容时不会误触</li>
</ul>
<p>移动端不显示快捷键设置。</p>
</div>
`;
  const content = $(`
        <div class="ih-help-panel-content">
            ${helpText}
            <div style="display:flex;justify-content:flex-end;margin-top:16px;">
                <button class="ih-hm-btn ih-hm-btn-close" id="ih_help_close">关闭</button>
            </div>
        </div>
    `);
  overlay.append(content);
  syncDialogTheme(content[0]);
  content.on("click", (e) => e.stopPropagation());
  generateFaIconProtectionCSS();
  const closeDialog = () => {
    document.removeEventListener("keydown", escHandler, true);
    overlay.remove();
  };
  overlay.off("click").on("click", (e) => {
    if (e.target === overlay[0]) closeDialog();
  });
  content.find("#ih_help_close").on("click", closeDialog);
}
function openMgrEditDialog(floor, onSaved) {
  if (floor < 0 || floor >= chat.length) {
    toastr.warning("楼层不存在", "", { timeOut: 1000 });
    return;
  }
  const msg = chat[floor];
  const sender = msg.name || (msg.is_user ? "User" : "AI");
  const { overlay, escHandler } = createDialogOverlay();
  const content = $(`
    <div class="ih-mgr-edit-content">
      <h3><i class="fa-solid fa-pen"></i> 编辑楼层 #${floor}<span style="font-size:12px;opacity:0.6;font-weight:normal;margin-left:6px;">${ihEscapeHtml(sender)}</span></h3>
      <textarea id="ih_mgr_edit_textarea" class="ih-mgr-edit-textarea" placeholder="在此编辑消息内容..."></textarea>
      <div class="ih-mgr-edit-actions">
        <button class="ih-hm-btn" id="ih_mgr_edit_cancel">取消</button>
        <button class="ih-hm-btn ih-hm-btn-ok" id="ih_mgr_edit_save"><i class="fa-solid fa-check"></i> 保存</button>
      </div>
    </div>
  `);
  content.find("#ih_mgr_edit_textarea").val(String(msg.mes || ""));
  overlay.append(content);
  syncDialogTheme(content[0]);
  content.on("click", (e) => e.stopPropagation());
  generateFaIconProtectionCSS();
  const closeDialog = () => {
    document.removeEventListener("keydown", escHandler, true);
    overlay.remove();
  };
  overlay.off("click").on("click", (e) => {
    if (e.target === overlay[0]) closeDialog();
  });
  content.find("#ih_mgr_edit_cancel").on("click", closeDialog);
  content.find("#ih_mgr_edit_save").on("click", async () => {
    if (floor < 0 || floor >= chat.length) {
      toastr.error("楼层已不存在，保存失败", "", { timeOut: 1500 });
      closeDialog();
      return;
    }
    const newText = content.find("#ih_mgr_edit_textarea").val();
    const m = chat[floor];
    m.mes = newText;
    if (
      Array.isArray(m.swipes) &&
      typeof m.swipe_id === "number" &&
      m.swipe_id >= 0 &&
      m.swipe_id < m.swipes.length
    ) {
      m.swipes[m.swipe_id] = newText;
    }
    try {
      const ctx = SillyTavern.getContext();
      if (typeof ctx.updateMessageBlock === "function") {
        ctx.updateMessageBlock(floor, m);
      } else {
        const $mesText = $(`#chat .mes[mesid="${floor}"] .mes_text`);
        if ($mesText.length && typeof ctx.messageFormatting === "function") {
          const formatted = ctx.messageFormatting(
            m.mes,
            m.name,
            m.is_system,
            m.is_user,
            floor,
          );
          $mesText.empty().append(formatted);
        }
      }
    } catch (e) {
      console.warn("快捷工具栏: 更新消息显示失败", e);
    }
    closeDialog();
    try {
      await executeSlashCommandsWithOptions("/forcesave");
      toastr.success(`已保存楼层 #${floor}`, "", { timeOut: 1000 });
    } catch (e) {
      console.error("快捷工具栏: 保存楼层失败", e);
      toastr.error("保存失败", "", { timeOut: 1500 });
    }
    if (typeof onSaved === "function") onSaved();
  });
  setTimeout(() => {
    const ta = content.find("#ih_mgr_edit_textarea")[0];
    if (ta) ta.focus();
  }, 100);
}

const _IH_SEARCH_CACHE = new Map();
const _IH_SEARCH_CACHE_TTL = 30 * 60 * 1000; // 缓存有效期：30 分钟，想更久就调大（单位毫秒），越久越占内存
const _IH_SEARCH_CACHE_MAX = 300; // 最多缓存多少个聊天档，防止内存吃太多，聊天档特别多可再调大

function _ihGetSearchCacheKey(fileName) {
  let avatar = "";
  try {
    const chid = this_chid;
    const character =
      chid !== undefined && chid !== null ? characters[chid] : null;
    avatar = character?.avatar || "";
  } catch (e) {}
  return `${avatar}::${String(fileName || "")}`;
}

function _ihGetSearchCache(fileName) {
  const cacheKey = _ihGetSearchCacheKey(fileName);
  const item = _IH_SEARCH_CACHE.get(cacheKey);
  if (!item) return null;
  if (Date.now() - item.time > _IH_SEARCH_CACHE_TTL) {
    _IH_SEARCH_CACHE.delete(cacheKey);
    return null;
  }
  return item.messages;
}

function _ihSetSearchCache(fileName, messages) {
  const now = Date.now();
  for (const [k, v] of _IH_SEARCH_CACHE) {
    if (now - v.time > _IH_SEARCH_CACHE_TTL) _IH_SEARCH_CACHE.delete(k);
  }
  while (_IH_SEARCH_CACHE.size >= _IH_SEARCH_CACHE_MAX) {
    const oldest = _IH_SEARCH_CACHE.keys().next().value;
    _IH_SEARCH_CACHE.delete(oldest);
  }
  const cacheKey = _ihGetSearchCacheKey(fileName);
  _IH_SEARCH_CACHE.set(cacheKey, { messages, time: now });
}

function _ihDeleteSearchCache(fileName) {
  _IH_SEARCH_CACHE.delete(_ihGetSearchCacheKey(fileName));
}

function openHideManagerPanel() {
  if (chat.length === 0) {
    toastr.warning("当前没有聊天消息", "", { timeOut: 1000 });
    return;
  }
  const { overlay, escHandler } = createDialogOverlay();
  const total = chat.length;

  const sharedState = {
    selected: new Set(),
    rangeStart: null,
    rangeMode: false,
    activeTab: "hide",
    scrollTop: 0,
    reverseOrder: false,
    jumpHighlight: null,
    _jumpHlTimer: null,
    showToken: false,
    tokenCache: new Map(),
    transferTargetChat: null,
    transferTargetHeader: null,
    transferInsertAt: null,
    transferLoading: false,
    _transferListLoaded: false,
    manageTarget: "upper",
    transferReverseOrder: false,
    transferJumpHighlight: null,
    _transferJumpHlTimer: null,
    transferSelected: new Set(),
    transferRangeStart: null,
    transferRangeMode: false,
    transferUpperInsertAt: null,
    searchQuery: "",
    searchScope: "current",
    searchCaseSensitive: false,
    searchResults: [],
    searchExpanded: {},
    searchLoading: false,
    searchDone: false,
    _searchProgress: "",
    searchSpecifiedFiles: [],
    searchBasket: [],
    _searchLocateIndex: -1,
    searchEverRun: false,
    _searchRunId: 0,
  };

  const ROW_HEIGHT = 36;
  const BUFFER = 6;

  const initStatus = getHiddenStatus();

  const content = $(`
    <div class="ih-mgr-content">
      <div class="ih-mgr-header">
        <h3><i class="fa-solid fa-ghost"></i> 消息管理</h3>
        <span class="ih-mgr-total-badge">${total} 条消息</span>
        <button class="ih-mgr-close-x" id="ih_mgr_close" title="关闭"><i class="fa-solid fa-xmark"></i></button>
      </div>

      <div class="ih-mgr-tabs">
        <button class="ih-mgr-tab ih-mgr-tab-active" data-tab="hide">
          <i class="fa-solid fa-eye-slash"></i><span>隐藏</span>
        </button>
        <button class="ih-mgr-tab" data-tab="delete">
          <i class="fa-solid fa-trash"></i><span>删除</span>
        </button>
        <button class="ih-mgr-tab" data-tab="move">
          <i class="fa-solid fa-arrows-up-down"></i><span>移动</span>
        </button>
        <button class="ih-mgr-tab" data-tab="insert">
          <i class="fa-solid fa-plus-circle"></i><span>插入</span>
        </button>
        <button class="ih-mgr-tab" data-tab="transfer">
          <i class="fa-solid fa-right-left"></i><span>转存</span>
        </button>
        <button class="ih-mgr-tab" data-tab="search">
          <i class="fa-solid fa-magnifying-glass"></i><span>搜索</span>
        </button>
      </div>

      <div class="ih-mgr-tab-panel" data-panel="hide">
        <div class="ih-mgr-status" id="ih_mgr_hide_status">
          <i class="fa-solid fa-circle-info"></i>
          <span>${initStatus.summary}</span>
        </div>

        <div class="ih-mgr-inline-row ih-mgr-inline-row-oneline">
          <label class="ih-mgr-inline-label">单条</label>
          <input type="number" id="ih_mgr_specific_floor" class="ih-mgr-input" placeholder="楼层号" min="0" max="${total - 1}" />
          <button class="ih-mgr-btn ih-mgr-btn-mini ih-mgr-btn-icon ih-mgr-input-clear-btn" title="清除输入" data-clear-targets="ih_mgr_specific_floor"><i class="fa-solid fa-eraser"></i></button>
          <div class="ih-mgr-inline-actions">
            <button class="ih-mgr-btn ih-mgr-btn-warn" id="ih_mgr_hide_one"><i class="fa-solid fa-eye-slash"></i> 隐藏</button>
            <button class="ih-mgr-btn ih-mgr-btn-ok" id="ih_mgr_unhide_one"><i class="fa-solid fa-eye"></i> 显示</button>
            <button class="ih-mgr-btn ih-mgr-btn-ok" id="ih_mgr_jump_one"><i class="fa-solid fa-location-arrow"></i> 跳转</button>
          </div>
        </div>

        <div class="ih-mgr-inline-row ih-mgr-inline-row-oneline">
          <label class="ih-mgr-inline-label">范围</label>
          <input type="number" id="ih_mgr_range_from" class="ih-mgr-input" placeholder="起始" min="0" max="${total - 1}" />
          <span class="ih-mgr-arrow">→</span>
          <input type="number" id="ih_mgr_range_to" class="ih-mgr-input" placeholder="结束" min="0" max="${total - 1}" />
          <button class="ih-mgr-btn ih-mgr-btn-mini ih-mgr-btn-icon ih-mgr-input-clear-btn" title="清除输入" data-clear-targets="ih_mgr_range_from,ih_mgr_range_to"><i class="fa-solid fa-eraser"></i></button>
          <div class="ih-mgr-inline-actions">
            <button class="ih-mgr-btn ih-mgr-btn-warn" id="ih_mgr_do_range_hide"><i class="fa-solid fa-eye-slash"></i> 隐藏</button>
            <button class="ih-mgr-btn ih-mgr-btn-ok" id="ih_mgr_do_range_unhide"><i class="fa-solid fa-eye"></i> 显示</button>
          </div>
        </div>

        <div class="ih-mgr-inline-row ih-mgr-inline-row-oneline">
          <label class="ih-mgr-inline-label">保留最近</label>
          <input type="number" id="ih_mgr_keep_recent" class="ih-mgr-input" placeholder="条数" min="1" />
          <span class="ih-mgr-hint-inline">条可见</span>
          <button class="ih-mgr-btn ih-mgr-btn-mini ih-mgr-btn-icon ih-mgr-input-clear-btn" title="清除输入" data-clear-targets="ih_mgr_keep_recent"><i class="fa-solid fa-eraser"></i></button>
          <div class="ih-mgr-inline-actions">
            <button class="ih-mgr-btn ih-mgr-btn-ok" id="ih_mgr_do_keep"><i class="fa-solid fa-filter"></i> 执行</button>
          </div>
        </div>
      </div>

      <div class="ih-mgr-tab-panel" data-panel="delete" style="display:none;">
        <div class="ih-mgr-status">
          <i class="fa-solid fa-circle-info"></i>
          <span>勾选要删除的消息，或用范围选择批量框选</span>
        </div>

        <div class="ih-mgr-inline-row ih-mgr-inline-row-oneline">
          <label class="ih-mgr-inline-label">范围删除</label>
          <input type="number" id="ih_mgr_del_from" class="ih-mgr-input" placeholder="从" min="0" max="${total - 1}" />
          <span class="ih-mgr-arrow">→</span>
          <input type="number" id="ih_mgr_del_to" class="ih-mgr-input" placeholder="到" min="0" max="${total - 1}" />
          <button class="ih-mgr-btn ih-mgr-btn-mini ih-mgr-btn-icon ih-mgr-input-clear-btn" title="清除输入" data-clear-targets="ih_mgr_del_from,ih_mgr_del_to"><i class="fa-solid fa-eraser"></i></button>
          <div class="ih-mgr-inline-actions">
            <button class="ih-mgr-btn ih-mgr-btn-warn" id="ih_mgr_del_range_confirm"><i class="fa-solid fa-trash"></i> 删除</button>
          </div>
        </div>
      </div>

      <div class="ih-mgr-tab-panel" data-panel="move" style="display:none;">
        <div class="ih-mgr-status">
          <i class="fa-solid fa-circle-info"></i>
          <span>勾选要移动的消息（可多条），输入目标楼层后点移动</span>
        </div>

        <div class="ih-mgr-inline-row">
          <label class="ih-mgr-inline-label">目标楼层</label>
          <input type="number" id="ih_mgr_mv_target" class="ih-mgr-input" placeholder="楼层号" min="0" max="${total}" />
          <button class="ih-mgr-btn ih-mgr-btn-mini ih-mgr-btn-icon ih-mgr-input-clear-btn" title="清除输入" data-clear-targets="ih_mgr_mv_target"><i class="fa-solid fa-eraser"></i></button>
          <div class="ih-mgr-inline-actions">
            <button class="ih-mgr-btn ih-mgr-btn-ok" id="ih_mgr_mv_confirm"><i class="fa-solid fa-arrows-up-down"></i> 移动</button>
          </div>
        </div>
      </div>
      <div class="ih-mgr-tab-panel" data-panel="insert" style="display:none;">
        <div class="ih-mgr-status">
          <i class="fa-solid fa-circle-info"></i>
          <span>在指定楼层插入一条空白消息，插入后自动跳转并进入编辑状态</span>
        </div>

        <div class="ih-mgr-inline-row">
          <label class="ih-mgr-inline-label">插入位置</label>
          <input type="number" id="ih_mgr_insert_floor" class="ih-mgr-input" placeholder="楼层号" min="0" max="${total}" />
          <span class="ih-mgr-hint-inline">新消息将出现在此楼层</span>
        </div>

        <div class="ih-mgr-inline-row">
          <label class="ih-mgr-inline-label">消息角色</label>
          <select id="ih_mgr_insert_role" style="padding:5px 8px;border:1px solid var(--SmartThemeBorderColor);border-radius:5px;background:var(--SmartThemeBlurTintColor);color:var(--SmartThemeBodyColor);font-size:12px;min-width:100px;">
            <option value="user">用户</option>
            <option value="char">AI角色</option>
            <option value="narrator">旁白/系统</option>
          </select>
          <div class="ih-mgr-inline-actions">
            <button class="ih-mgr-btn ih-mgr-btn-ok ih-mgr-btn-primary" id="ih_mgr_insert_confirm"><i class="fa-solid fa-plus"></i> 插入</button>
          </div>
        </div>
      </div>

      <div class="ih-mgr-tab-panel" data-panel="transfer" style="display:none;">
        <div class="ih-mgr-status">
          <i class="fa-solid fa-circle-info"></i>
          <span>「上/下」按钮切换转存方向：显示勾选框的一侧为消息来源，另一侧点击某条消息设定插入落点</span>
        </div>

        <div class="ih-mgr-basket-banner" id="ih_mgr_basket_banner" style="display:none;">
          <i class="fa-solid fa-basket-shopping"></i>
          <span class="ih-mgr-basket-text">转存篮：0 条</span>
          <button class="ih-mgr-btn ih-mgr-btn-mini ih-mgr-transfer-basket-locate" id="ih_mgr_transfer_basket_locate" title="切换到搜索tab并依次定位篮里的消息"><i class="fa-solid fa-crosshairs"></i> <span class="ih-search-locate-count">0/0</span></button>
          <button class="ih-mgr-btn ih-mgr-btn-mini ih-mgr-basket-clear" id="ih_mgr_basket_clear" title="清空转存篮"><i class="fa-solid fa-trash"></i></button>
        </div>

        <div class="ih-mgr-inline-row ih-mgr-transfer-current-row">
          <label class="ih-mgr-inline-label">当前聊天档</label>
          <span class="ih-mgr-transfer-current" id="ih_mgr_transfer_current" title="正在从这个聊天档转存">—</span>
        </div>

        <div class="ih-mgr-inline-row">
          <label class="ih-mgr-inline-label">目标聊天档</label>
          <div class="ih-mgr-select2" id="ih_mgr_transfer_select2">
            <div class="ih-mgr-select2-display" id="ih_mgr_transfer_display" tabindex="0">
              <span class="ih-mgr-select2-text">加载中…</span>
              <i class="fa-solid fa-chevron-down ih-mgr-select2-caret"></i>
            </div>
            <div class="ih-mgr-select2-dropdown" id="ih_mgr_transfer_dropdown">
              <div class="ih-mgr-select2-search-wrap">
                <i class="fa-solid fa-magnifying-glass"></i>
                <input type="text" class="ih-mgr-select2-search ih-fp-transparent-input" id="ih_mgr_transfer_search" placeholder="搜索聊天档…" />
                <button class="ih-mgr-select2-search-clear" id="ih_mgr_transfer_search_clear" title="清空搜索"><i class="fa-solid fa-xmark"></i></button>
              </div>
              <div class="ih-mgr-select2-list" id="ih_mgr_transfer_options"></div>
            </div>
          </div>
          <button class="ih-mgr-btn ih-mgr-btn-mini ih-mgr-btn-icon" id="ih_mgr_transfer_clear_selected" title="清除已选聊天档"><i class="fa-solid fa-eraser"></i></button>
        </div>
      </div>
      <div class="ih-mgr-tab-panel" data-panel="search" style="display:none;">
        <div class="ih-mgr-status">
          <i class="fa-solid fa-circle-info"></i>
          <span>选择搜索范围并输入关键词，点击结果右侧的定位按钮可跳转至对应楼层；搜索范围仅包含当前角色的聊天档</span>
        </div>
          <div class="ih-mgr-search-bar">
            <div class="ih-mgr-search-scope">
              <button class="ih-mgr-search-scope-btn ih-mgr-search-scope-active" data-scope="current"><i class="fa-solid fa-comment"></i> 当前聊天档</button>
              <button class="ih-mgr-search-scope-btn" data-scope="specified"><i class="fa-solid fa-file-lines"></i> 指定聊天档</button>
              <button class="ih-mgr-search-scope-btn" data-scope="all"><i class="fa-solid fa-layer-group"></i> 全部聊天档</button>
            </div>
            <div class="ih-mgr-search-specified" style="display:none;">
              <div class="ih-mgr-select2" id="ih_mgr_search_select2">
                <div class="ih-mgr-select2-display" id="ih_mgr_search_display" tabindex="0">
                  <span class="ih-mgr-select2-text">加载中…</span>
                  <i class="fa-solid fa-chevron-down ih-mgr-select2-caret"></i>
                </div>
                <div class="ih-mgr-select2-dropdown" id="ih_mgr_search_dropdown">
                  <div class="ih-mgr-select2-search-wrap">
                    <i class="fa-solid fa-magnifying-glass"></i>
                    <input type="text" class="ih-mgr-select2-search ih-fp-transparent-input" id="ih_mgr_search_s2_search" placeholder="搜索聊天档…" />
                    <button class="ih-mgr-select2-search-clear" id="ih_mgr_search_s2_clear" title="清空搜索"><i class="fa-solid fa-xmark"></i></button>
                  </div>
                  <div class="ih-mgr-select2-list" id="ih_mgr_search_options"></div>
                </div>
              </div>
              <button class="ih-mgr-btn ih-mgr-btn-mini ih-mgr-btn-icon" id="ih_mgr_search_clear_selected" title="清除已选聊天档"><i class="fa-solid fa-eraser"></i></button>
            </div>
          <div class="ih-mgr-search-input-row">
            <div class="ih-mgr-search-input-wrap">
              <input type="text" id="ih_mgr_search_input" class="ih-mgr-search-input ih-fp-transparent-input" placeholder="输入关键词…" />
              <button class="ih-mgr-search-input-clear" id="ih_mgr_search_clear" title="清空"><i class="fa-solid fa-xmark"></i></button>
            </div>
            <button class="ih-mgr-search-case-btn" id="ih_mgr_search_case" title="区分大小写"><span>Aa</span></button>
            <button class="ih-mgr-btn ih-mgr-btn-ok ih-mgr-btn-primary" id="ih_mgr_search_go"><i class="fa-solid fa-magnifying-glass"></i> 搜索</button>
          </div>
        </div>
        <div class="ih-mgr-search-status" id="ih_mgr_search_status" style="display:none;"></div>
        <div class="ih-mgr-basket-banner" id="ih_mgr_search_basket_bar" style="display:none;">
          <i class="fa-solid fa-basket-shopping"></i>
          <span class="ih-mgr-basket-text ih-search-basket-text">转存篮：0 条</span>
          <button class="ih-mgr-btn ih-mgr-btn-mini ih-mgr-search-basket-locate" id="ih_mgr_search_basket_locate" title="依次定位并高亮转存篮里的消息"><i class="fa-solid fa-crosshairs"></i> <span class="ih-search-locate-count">0/0</span></button>
          <button class="ih-mgr-btn ih-mgr-btn-mini ih-mgr-basket-clear" id="ih_mgr_search_basket_clear" title="清空转存篮"><i class="fa-solid fa-trash"></i></button>
        </div>
        <div class="ih-mgr-search-results" id="ih_mgr_search_results">
          <div class="ih-search-empty">输入关键词后点击搜索</div>
        </div>
      </div>
      <div class="ih-mgr-shared-list-area">
        <div class="ih-mgr-toolbar">
          <span class="ih-mgr-count" id="ih_mgr_count">已选 0 条</span>
          <button class="ih-mgr-btn ih-mgr-btn-mini ih-mgr-manage-toggle" id="ih_mgr_manage_toggle" title="切换工具栏管理对象（上方当前聊天 / 下方目标聊天）" style="display:none;">
            <i class="fa-solid fa-arrow-up"></i><span class="ih-mgr-manage-toggle-text">上</span>
          </button>
          <div class="ih-mgr-btn-scroll">
          <div class="ih-mgr-btn-group ih-mgr-select-group">
            <button class="ih-mgr-btn ih-mgr-btn-mini ih-mgr-btn-icon" id="ih_mgr_reverse_order" title="消息倒序"><i class="fa-solid fa-arrow-down-wide-short"></i></button>

            <button class="ih-mgr-btn ih-mgr-btn-mini ih-mgr-btn-icon" id="ih_mgr_select_all" title="全选"><i class="fa-solid fa-check-double"></i></button>
            <button class="ih-mgr-btn ih-mgr-btn-mini ih-mgr-btn-icon" id="ih_mgr_invert" title="反选"><i class="fa-solid fa-repeat"></i></button>
            <button class="ih-mgr-btn ih-mgr-btn-mini ih-mgr-btn-icon" id="ih_mgr_range_toggle" title="范围选择"><i class="fa-solid fa-arrows-left-right-to-line"></i></button>
            <button class="ih-mgr-btn ih-mgr-btn-mini ih-mgr-btn-icon" id="ih_mgr_clear" title="清除选择"><i class="fa-solid fa-eraser"></i></button>
          </div>
          <div class="ih-mgr-nav-group">
            <div class="ih-mgr-jump-box">
              <input type="number" id="ih_mgr_jump_floor" class="ih-mgr-jump-input" placeholder="楼层" min="0" max="${total - 1}" />
              <button class="ih-mgr-jump-go" id="ih_mgr_jump_go" title="跳转到该楼层"><i class="fa-solid fa-location-arrow"></i></button>
            </div>
            <div class="ih-mgr-scroll-seg">
              <button class="ih-mgr-seg-btn" id="ih_mgr_scroll_top" title="回到顶部"><i class="fa-solid fa-angles-up"></i></button>
              <button class="ih-mgr-seg-btn" id="ih_mgr_scroll_bottom" title="回到底部"><i class="fa-solid fa-angles-down"></i></button>
            </div>
          </div>
          </div>
          <span class="ih-mgr-total-badge ih-mgr-token-total" id="ih_mgr_token_total" title="点击计算 Token 数（再次点击收起）">
            <span class="ih-mgr-token-idle"><i class="fa-solid fa-calculator"></i> Token</span>
            <span class="ih-mgr-token-active">
              <span class="ih-mgr-token-total-num">…</span>
              <span class="ih-mgr-token-unit">tokens</span>
            </span>
          </span>
        </div>

        <div class="ih-mgr-list-wrap">
          <div class="ih-mgr-msg-list ih-mgr-vlist" id="ih_mgr_vlist">
            <div class="ih-mgr-vlist-spacer-top"></div>
            <div class="ih-mgr-vlist-rows"></div>
            <div class="ih-mgr-vlist-spacer-bottom"></div>
          </div>
        </div>

        <div class="ih-mgr-footer-actions ih-mgr-footer-split" data-footer="hide">
          <div class="ih-mgr-action-group">
            <div class="ih-mgr-btn-group">
              <button class="ih-mgr-btn ih-mgr-btn-ghost ih-mgr-btn-ghost-warn" id="ih_mgr_do_hide_all"><i class="fa-solid fa-eye-slash"></i> 全部隐藏</button>
              <button class="ih-mgr-btn ih-mgr-btn-ghost ih-mgr-btn-ghost-ok" id="ih_mgr_do_unhide_all"><i class="fa-solid fa-eye"></i> 全部显示</button>
            </div>
          </div>
          <div class="ih-mgr-action-group">
            <div class="ih-mgr-btn-group">
              <button class="ih-mgr-btn ih-mgr-btn-warn ih-mgr-btn-primary" id="ih_mgr_hide_selected"><i class="fa-solid fa-eye-slash"></i> 隐藏所选</button>
              <button class="ih-mgr-btn ih-mgr-btn-ok ih-mgr-btn-primary" id="ih_mgr_unhide_selected"><i class="fa-solid fa-eye"></i> 显示所选</button>
            </div>
          </div>
        </div>

        <div class="ih-mgr-footer-actions" data-footer="delete" style="display:none;">
          <button class="ih-mgr-btn ih-mgr-btn-warn ih-mgr-btn-primary" id="ih_mgr_del_confirm"><i class="fa-solid fa-trash"></i> 删除选中</button>
        </div>
      </div>

      <div class="ih-mgr-transfer-area">
        <div class="ih-mgr-transfer-target-label">
          <i class="fa-solid fa-arrow-down-long" id="ih_mgr_transfer_target_arrow"></i>
          <span id="ih_mgr_transfer_target_label_text">目标聊天档预览（点击某条消息＝插入到该消息前）</span>
        </div>
        <div class="ih-mgr-transfer-list-wrap">
          <div class="ih-mgr-transfer-target-list" id="ih_mgr_transfer_target_list">
            <div class="ih-mgr-tvlist-spacer-top"></div>
            <div class="ih-mgr-tvlist-rows"></div>
            <div class="ih-mgr-tvlist-spacer-bottom"></div>
            <div class="ih-mgr-tvlist-tail"><div class="ih-mgr-transfer-empty">请在上方选择目标聊天档</div></div>
          </div>
        </div>
        <div class="ih-mgr-transfer-footer">
          <div class="ih-mgr-btn-group">
            <button class="ih-mgr-btn ih-mgr-btn-ok ih-mgr-btn-primary" id="ih_mgr_transfer_copy"><i class="fa-solid fa-copy"></i> 复制</button>
            <button class="ih-mgr-btn ih-mgr-btn-warn ih-mgr-btn-primary" id="ih_mgr_transfer_move"><i class="fa-solid fa-scissors"></i> 移动</button>
          </div>
        </div>
      </div>
    </div>
  `);

  overlay.append(content);
  syncDialogTheme(content[0]);
  content.on("click", (e) => e.stopPropagation());
  generateFaIconProtectionCSS();

  let _mgrToolbarResizeObserver = null;
  let _mgrToolbarResizeRaf = null;

  function _syncMgrToolbarHeight() {
    const toolbar = content.find(".ih-mgr-toolbar")[0];
    if (!toolbar) return;

    let maxHeight = 0;
    const heightTargets = toolbar.querySelectorAll(
      ".ih-mgr-btn, .ih-mgr-jump-box, .ih-mgr-scroll-seg, .ih-mgr-count, .ih-mgr-token-total",
    );

    heightTargets.forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (rect.height > maxHeight) maxHeight = rect.height;
    });

    if (maxHeight > 0) {
      const safeHeight = Math.ceil(maxHeight) + 4;
      toolbar.style.setProperty(
        "--ih-mgr-toolbar-content-h",
        safeHeight + "px",
      );
    }
  }

  function _scheduleMgrToolbarHeightSync() {
    if (_mgrToolbarResizeRaf) {
      cancelAnimationFrame(_mgrToolbarResizeRaf);
    }

    _mgrToolbarResizeRaf = requestAnimationFrame(() => {
      _mgrToolbarResizeRaf = null;
      _syncMgrToolbarHeight();
    });
  }

  if (typeof ResizeObserver !== "undefined") {
    _mgrToolbarResizeObserver = new ResizeObserver(
      _scheduleMgrToolbarHeightSync,
    );

    content
      .find(
        ".ih-mgr-toolbar, .ih-mgr-btn, .ih-mgr-jump-box, .ih-mgr-scroll-seg, .ih-mgr-count, .ih-mgr-token-total",
      )
      .each(function () {
        _mgrToolbarResizeObserver.observe(this);
      });
  }

  setTimeout(_scheduleMgrToolbarHeightSync, 0);

  const vlistEl = content.find("#ih_mgr_vlist")[0];
  const spacerTopEl = content.find(".ih-mgr-vlist-spacer-top")[0];
  const spacerBottomEl = content.find(".ih-mgr-vlist-spacer-bottom")[0];
  const rowsEl = content.find(".ih-mgr-vlist-rows")[0];

  function getHighlightSet() {
    const set = {
      ranges: [],
      singles: new Set(),
      keep: new Set(),
      insertAbove: -1,
      insertBelow: -1,
    };
    if (sharedState.activeTab === "hide") {
      const single = content.find("#ih_mgr_specific_floor").val();
      if (single !== "") {
        const f = parseInt(single);
        if (!isNaN(f) && f >= 0 && f < total) set.singles.add(f);
      }
      const fv = content.find("#ih_mgr_range_from").val();
      const tv = content.find("#ih_mgr_range_to").val();
      if (fv !== "" || tv !== "") {
        const f = fv === "" ? 0 : parseInt(fv);
        const t = tv === "" ? total - 1 : parseInt(tv);
        if (!isNaN(f) && !isNaN(t)) {
          const lo = Math.max(0, Math.min(f, t));
          const hi = Math.min(total - 1, Math.max(f, t));
          set.ranges.push([lo, hi]);
        }
      }
      const keepVal = content.find("#ih_mgr_keep_recent").val();
      if (keepVal !== "") {
        const n = parseInt(keepVal);
        if (!isNaN(n) && n > 0 && n < total) {
          for (let i = total - n; i < total; i++) set.keep.add(i);
        }
      }
    } else if (sharedState.activeTab === "delete") {
      const fv = content.find("#ih_mgr_del_from").val();
      const tv = content.find("#ih_mgr_del_to").val();
      if (fv !== "" || tv !== "") {
        const f = fv === "" ? 0 : parseInt(fv);
        const t = tv === "" ? total - 1 : parseInt(tv);
        if (!isNaN(f) && !isNaN(t)) {
          const lo = Math.max(0, Math.min(f, t));
          const hi = Math.min(total - 1, Math.max(f, t));
          set.ranges.push([lo, hi]);
        }
      }
    } else if (sharedState.activeTab === "move") {
      const tv = content.find("#ih_mgr_mv_target").val();
      if (tv !== "") {
        const t = parseInt(tv);
        if (!isNaN(t) && t >= 0 && t < total) set.insertAbove = t;
        else if (!isNaN(t) && t >= total && total > 0)
          set.insertBelow = total - 1;
      }
    } else if (sharedState.activeTab === "insert") {
      const iv = content.find("#ih_mgr_insert_floor").val();
      if (iv !== "") {
        const t = parseInt(iv);
        if (!isNaN(t) && t >= 0 && t < total) set.insertAbove = t;
        else if (!isNaN(t) && t >= total && total > 0)
          set.insertBelow = total - 1;
      }
    } else if (
      sharedState.activeTab === "transfer" &&
      sharedState.manageTarget === "lower"
    ) {
      const t =
        sharedState.transferUpperInsertAt == null
          ? total
          : sharedState.transferUpperInsertAt;
      if (t >= 0 && t < total) set.insertAbove = t;
      else if (t >= total && total > 0) set.insertBelow = total - 1;
    }
    return set;
  }

  function isInRanges(floor, ranges) {
    for (const [a, b] of ranges) if (floor >= a && floor <= b) return true;
    return false;
  }

  function buildRowHtml(floor, hl) {
    const msg = chat[floor];
    if (!msg) return "";
    const rawMes = String(msg?.mes || "");
    const sender = ihEscapeHtml(msg.name || (msg.is_user ? "User" : "AI"));
    const previewText = rawMes.replace(/\s+/g, " ").substring(0, 60);
    const preview = ihEscapeHtml(previewText);
    const truncate = rawMes.length > 60 ? "..." : "";
    let previewHtml;
    if (sharedState.showToken) {
      if (sharedState.tokenCache.has(floor)) {
        previewHtml = `<span class="ih-mgr-msg-preview ih-mgr-msg-token" data-floor="${floor}">${sharedState.tokenCache.get(floor)} tokens</span>`;
      } else {
        previewHtml = `<span class="ih-mgr-msg-preview ih-mgr-msg-token" data-floor="${floor}" data-pending="1">计算中…</span>`;
      }
    } else {
      previewHtml = `<span class="ih-mgr-msg-preview">${preview}${truncate}</span>`;
    }
    const hidden = isMessageHidden(msg);
    const isChecked = sharedState.selected.has(floor);
    if (!hl) hl = getHighlightSet();
    const cls = ["ih-mgr-msg-item"];
    if (hidden) cls.push("ih-mgr-msg-is-hidden");
    if (isChecked) cls.push("ih-mgr-msg-checked");
    if (hl.singles.has(floor)) cls.push("ih-mgr-highlight-single");
    else if (isInRanges(floor, hl.ranges)) cls.push("ih-mgr-highlight");
    if (hl.keep.has(floor)) cls.push("ih-mgr-highlight-keep");
    if (hl.insertAbove === floor) cls.push("ih-mgr-move-insert-above");
    if (hl.insertBelow === floor) cls.push("ih-mgr-move-insert-below");
    if (sharedState.rangeStart === floor) cls.push("ih-mgr-range-start");
    if (sharedState.jumpHighlight === floor) cls.push("ih-mgr-jump-highlight");
    const ghost = hidden
      ? '<span class="ih-mgr-msg-ghost"><i class="fa-solid fa-ghost"></i></span>'
      : "";
    return `
      <div class="${cls.join(" ")}" data-floor="${floor}" style="height:${ROW_HEIGHT}px;">
        <span class="ih-mgr-msg-check"><input type="checkbox" data-floor="${floor}" ${isChecked ? "checked" : ""} /></span>
        <span class="ih-mgr-msg-lead">
          <button class="ih-mgr-msg-jump" data-floor="${floor}" title="跳转到此消息"><i class="fa-solid fa-location-arrow"></i></button>
          <span class="ih-mgr-msg-floor">#${floor}</span>
        </span>
        <span class="ih-mgr-msg-sender">${sender}</span>
        ${previewHtml}
        <button class="ih-mgr-msg-edit" data-floor="${floor}" title="编辑此楼层"><i class="fa-solid fa-pen"></i></button>
        ${ghost}
      </div>
    `;
  }

  function renderVisible() {
    const scrollTop = vlistEl.scrollTop;
    const viewH = vlistEl.clientHeight || 400;
    const startIdx = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - BUFFER);
    const endIdx = Math.min(
      total,
      Math.ceil((scrollTop + viewH) / ROW_HEIGHT) + BUFFER,
    );
    spacerTopEl.style.height = startIdx * ROW_HEIGHT + "px";
    spacerBottomEl.style.height = (total - endIdx) * ROW_HEIGHT + "px";
    const hl = getHighlightSet();
    let html = "";
    for (let i = startIdx; i < endIdx; i++) {
      const floor = sharedState.reverseOrder ? total - 1 - i : i;
      html += buildRowHtml(floor, hl);
    }
    rowsEl.innerHTML = html;
    if (sharedState.showToken) computeTokensForVisible();
  }
  function _getTokenizerCtx() {
    try {
      const ctx = SillyTavern.getContext();
      if (ctx && typeof ctx.getTokenCountAsync === "function") return ctx;
    } catch (e) {}
    return null;
  }

  async function computeTokensForVisible() {
    const ctx = _getTokenizerCtx();
    if (!ctx) return;
    const pending = rowsEl.querySelectorAll(
      '.ih-mgr-msg-token[data-pending="1"]',
    );
    for (const el of pending) {
      const floor = parseInt(el.dataset.floor);
      if (isNaN(floor) || !chat[floor]) continue;
      el.removeAttribute("data-pending");
      try {
        const count = await ctx.getTokenCountAsync(
          String(chat[floor].mes || ""),
        );
        sharedState.tokenCache.set(floor, count);
        if (el.ownerDocument && el.ownerDocument.contains(el)) {
          el.textContent = count + " tokens";
        }
      } catch (e) {}
    }
  }

  async function computeTotalTokens() {
    const numEl = content.find(".ih-mgr-token-total-num");
    const ctx = _getTokenizerCtx();
    if (!ctx) {
      numEl.text("不可用");
      return;
    }
    numEl.html('<i class="fa-solid fa-spinner fa-spin"></i>');
    let sum = 0;
    for (let i = 0; i < total; i++) {
      if (!sharedState.showToken) return;
      const msg = chat[i];
      if (!msg) continue;
      let count;
      if (sharedState.tokenCache.has(i)) {
        count = sharedState.tokenCache.get(i);
      } else {
        try {
          count = await ctx.getTokenCountAsync(String(msg.mes || ""));
          sharedState.tokenCache.set(i, count);
        } catch (e) {
          count = 0;
        }
      }
      sum += count;
    }
    if (sharedState.showToken) numEl.text(sum.toLocaleString());
  }

  let _renderRaf = null;
  let _isRendering = false;
  function scheduleRender() {
    if (_renderRaf) return;
    if (_isRendering) return;
    _renderRaf = requestAnimationFrame(() => {
      _renderRaf = null;
      _isRendering = true;
      const prevScrollTop = vlistEl.scrollTop;
      try {
        renderVisible();
        if (Math.abs(vlistEl.scrollTop - prevScrollTop) > 2) {
          vlistEl.scrollTop = prevScrollTop;
        }
      } catch (e) {
        console.warn("快捷工具栏: 消息列表渲染失败", e);
      }
      requestAnimationFrame(() => {
        _isRendering = false;
      });
    });
  }

  vlistEl.addEventListener(
    "scroll",
    () => {
      if (_isRendering) return;
      sharedState.scrollTop = vlistEl.scrollTop;
      scheduleRender();
    },
    { passive: true },
  );

  function scrollListToFloor(floor) {
    if (floor === null || floor === undefined || isNaN(floor) || floor < 0)
      return;
    if (floor >= total) {
      const toBottom = sharedState.reverseOrder ? 0 : vlistEl.scrollHeight;
      vlistEl.scrollTo({ top: toBottom, behavior: "smooth" });
      return;
    }
    const displayIndex = sharedState.reverseOrder ? total - 1 - floor : floor;
    const targetTop =
      displayIndex * ROW_HEIGHT - vlistEl.clientHeight / 2 + ROW_HEIGHT / 2;
    vlistEl.scrollTo({ top: Math.max(0, targetTop), behavior: "smooth" });
  }

  function _getActiveSel() {
    if (
      sharedState.activeTab === "transfer" &&
      sharedState.manageTarget === "lower"
    ) {
      return {
        set: sharedState.transferSelected,
        total: (sharedState.transferTargetChat || []).length,
        isLower: true,
      };
    }
    return { set: sharedState.selected, total: total, isLower: false };
  }

  function updateCount() {
    const a = _getActiveSel();
    content.find("#ih_mgr_count").text(`已选 ${a.set.size} 条`);
    content
      .find("#ih_mgr_reverse_order")
      .toggleClass(
        "ih-mgr-btn-active",
        sharedState.manageTarget === "lower"
          ? sharedState.transferReverseOrder
          : sharedState.reverseOrder,
      );
    const allBtn = content.find("#ih_mgr_select_all");
    if (a.total > 0 && a.set.size === a.total) {
      allBtn
        .html('<i class="fa-solid fa-square-xmark"></i>')
        .attr("title", "取消全选")
        .addClass("ih-mgr-btn-active");
    } else {
      allBtn
        .html('<i class="fa-solid fa-check-double"></i>')
        .attr("title", "全选")
        .removeClass("ih-mgr-btn-active");
    }
  }

  function refreshList() {
    if (
      sharedState.activeTab === "transfer" &&
      sharedState.manageTarget === "lower"
    ) {
      renderTransferTarget();
    } else {
      renderVisible();
    }
    updateCount();
  }

  setTimeout(() => {
    renderVisible();
    if (sharedState.scrollTop > 0) vlistEl.scrollTop = sharedState.scrollTop;
    updateCount();
  }, 0);

  const closeDialog = () => {
    if (sharedState._jumpHlTimer) clearTimeout(sharedState._jumpHlTimer);

    if (_mgrToolbarResizeObserver) {
      _mgrToolbarResizeObserver.disconnect();
      _mgrToolbarResizeObserver = null;
    }

    if (_mgrToolbarResizeRaf) {
      cancelAnimationFrame(_mgrToolbarResizeRaf);
      _mgrToolbarResizeRaf = null;
    }

    document.removeEventListener("keydown", escHandler, true);
    overlay.remove();
  };
  overlay.off("click").on("click", (e) => {
    if (e.target === overlay[0]) closeDialog();
  });
  content.find("#ih_mgr_close").on("click", closeDialog);

  content.on("click", ".ih-mgr-input-clear-btn", function () {
    const targetsStr = $(this).attr("data-clear-targets") || "";
    targetsStr
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .forEach((id) => {
        const el = document.getElementById(id);
        if (el) {
          el.value = "";
          el.dispatchEvent(new Event("input", { bubbles: true }));
        }
      });
  });

  content.on("click", ".ih-mgr-tab", function () {
    const tab = $(this).data("tab");
    sharedState.scrollTop = vlistEl.scrollTop;
    sharedState.activeTab = tab;
    sharedState.rangeStart = null;
    sharedState.rangeMode = false;
    content.find(".ih-mgr-tab").removeClass("ih-mgr-tab-active");
    $(this).addClass("ih-mgr-tab-active");
    content
      .find(".ih-mgr-shared-list-area")
      .toggleClass("ih-mgr-insert-mode", tab === "insert");
    content.toggleClass("ih-mgr-transfer-active", tab === "transfer");
    if (tab !== "transfer") {
      sharedState.manageTarget = "upper";
      content.removeClass("ih-mgr-manage-lower");
    }
    content.find("#ih_mgr_manage_toggle").toggle(tab === "transfer");
    _syncManageToggleUI();
    content.find(".ih-mgr-tab-panel").hide();
    content.find(`.ih-mgr-tab-panel[data-panel="${tab}"]`).show();
    content.find(".ih-mgr-shared-list-area").toggle(tab !== "search");
    if (tab === "search") renderSearchResults();
    content.find(".ih-mgr-footer-actions").hide();
    if (tab === "hide" || tab === "delete") {
      content
        .find(`.ih-mgr-footer-actions[data-footer="${tab}"]`)
        .css("display", "");
    }
    content
      .find(".ih-mgr-shared-list-area")
      .toggleClass("ih-mgr-range-mode", false);
    content.find("#ih_mgr_range_toggle").removeClass("ih-mgr-btn-active");
    refreshList();
    if (tab === "transfer") {
      if (!sharedState._transferListLoaded) {
        sharedState._transferListLoaded = true;
        loadTransferChatList();
      }
      renderTransferTarget();
      _updateBasketBanner();
    }
    setTimeout(() => {
      vlistEl.scrollTop = sharedState.scrollTop;
      renderVisible();
    }, 0);
  });

  content.on("click", ".ih-mgr-msg-jump", function (e) {
    e.stopPropagation();
    e.preventDefault();
    const floor = parseInt($(this).data("floor"));
    if (isNaN(floor)) return;
    closeDialog();
    const chatEl = document.getElementById("chat");
    if (!chatEl) return;
    const mesEl = chatEl.querySelector(`.mes[mesid="${floor}"]`);
    if (mesEl) {
      const r = mesEl.getBoundingClientRect();
      const useCenter = r.height < chatEl.clientHeight - 40;
      scrollChatToElement(mesEl, "smooth", useCenter);
    } else {
      executeSlashCommandsWithOptions(`/chat-jump ${floor}`);
    }
    toastr.info(`已跳转到楼层 ${floor}`, "", { timeOut: 1000 });
  });
  content.on("click", ".ih-mgr-msg-edit", function (e) {
    e.stopPropagation();
    e.preventDefault();
    const floor = parseInt($(this).data("floor"));
    if (isNaN(floor)) return;
    openMgrEditDialog(floor, () => {
      sharedState.scrollTop = vlistEl.scrollTop;
      refreshList();
      setTimeout(() => {
        vlistEl.scrollTop = sharedState.scrollTop;
        renderVisible();
      }, 0);
    });
  });

  rowsEl.addEventListener("click", function (e) {
    const item = e.target.closest(".ih-mgr-msg-item");
    if (!item) return;
    if (e.target.closest(".ih-mgr-msg-jump")) return;
    if (e.target.closest(".ih-mgr-msg-edit")) return;
    if (sharedState.activeTab === "insert") return;
    const floor = parseInt(item.dataset.floor);
    if (isNaN(floor)) return;

    if (
      sharedState.activeTab === "transfer" &&
      sharedState.manageTarget === "lower"
    ) {
      sharedState.transferUpperInsertAt = floor >= total ? null : floor;
      renderVisible();
      return;
    }

    if (sharedState.rangeMode) {
      e.preventDefault();
      e.stopPropagation();
      if (sharedState.rangeStart === null) {
        sharedState.rangeStart = floor;
        renderVisible();
      } else {
        const a = Math.min(sharedState.rangeStart, floor);
        const b = Math.max(sharedState.rangeStart, floor);
        for (let i = a; i <= b; i++) sharedState.selected.add(i);
        sharedState.rangeStart = null;
        sharedState.rangeMode = false;
        content
          .find(".ih-mgr-shared-list-area")
          .removeClass("ih-mgr-range-mode");
        content.find("#ih_mgr_range_toggle").removeClass("ih-mgr-btn-active");
        refreshList();
      }
      return;
    }

    if (e.target.matches("input[type=checkbox]")) {
      if (e.target.checked) sharedState.selected.add(floor);
      else sharedState.selected.delete(floor);
      item.classList.toggle("ih-mgr-msg-checked", e.target.checked);
      updateCount();
      return;
    }

    if (sharedState.selected.has(floor)) sharedState.selected.delete(floor);
    else sharedState.selected.add(floor);
    refreshList();
  });

  content.find("#ih_mgr_scroll_top").on("click", () => {
    const el =
      sharedState.manageTarget === "lower"
        ? content.find("#ih_mgr_transfer_target_list")[0]
        : vlistEl;
    if (el) el.scrollTo({ top: 0, behavior: "smooth" });
  });
  content.find("#ih_mgr_scroll_bottom").on("click", () => {
    const el =
      sharedState.manageTarget === "lower"
        ? content.find("#ih_mgr_transfer_target_list")[0]
        : vlistEl;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  });
  const _doMgrJumpFloor = () => {
    const v = content.find("#ih_mgr_jump_floor").val();
    if (v === "") {
      toastr.warning("请输入要跳转的楼层号", "", { timeOut: 1000 });
      return;
    }
    const f = parseInt(v);
    if (sharedState.manageTarget === "lower") {
      const arr = sharedState.transferTargetChat || [];
      if (arr.length === 0) {
        toastr.warning("目标聊天档还没加载", "", { timeOut: 1200 });
        return;
      }
      if (isNaN(f) || f < 0 || f >= arr.length) {
        toastr.warning(`楼层超出范围（0~${arr.length - 1}）`, "", {
          timeOut: 1200,
        });
        return;
      }
      sharedState.transferJumpHighlight = f;
      scrollTransferToFloor(f);
      renderTransferTarget();
      if (sharedState._transferJumpHlTimer)
        clearTimeout(sharedState._transferJumpHlTimer);
      sharedState._transferJumpHlTimer = setTimeout(() => {
        sharedState.transferJumpHighlight = null;
        renderTransferTarget();
      }, 3000);
      return;
    }
    if (isNaN(f) || f < 0 || f >= total) {
      toastr.warning(`楼层超出范围（0~${total - 1}）`, "", { timeOut: 1200 });
      return;
    }
    sharedState.jumpHighlight = f;
    scrollListToFloor(f);
    renderVisible();
    if (sharedState._jumpHlTimer) clearTimeout(sharedState._jumpHlTimer);
    sharedState._jumpHlTimer = setTimeout(() => {
      sharedState.jumpHighlight = null;
      if (
        vlistEl &&
        vlistEl.ownerDocument &&
        vlistEl.ownerDocument.contains(vlistEl)
      ) {
        renderVisible();
      }
    }, 3000);
  };
  content.find("#ih_mgr_jump_go").on("click", _doMgrJumpFloor);
  content.find("#ih_mgr_jump_floor").on("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      _doMgrJumpFloor();
    }
  });
  content.find("#ih_mgr_reverse_order").on("click", () => {
    if (sharedState.manageTarget === "lower") {
      sharedState.transferReverseOrder = !sharedState.transferReverseOrder;
      const tl = content.find("#ih_mgr_transfer_target_list")[0];
      if (tl) tl.scrollTop = 0;
      renderTransferTarget();
      content
        .find("#ih_mgr_reverse_order")
        .toggleClass("ih-mgr-btn-active", sharedState.transferReverseOrder);
      return;
    }
    sharedState.reverseOrder = !sharedState.reverseOrder;
    sharedState.scrollTop = 0;
    vlistEl.scrollTop = 0;
    refreshList();
  });
  content.find("#ih_mgr_token_total").on("click", function () {
    sharedState.showToken = !sharedState.showToken;
    $(this).toggleClass("ih-token-on", sharedState.showToken);
    renderVisible();
    if (sharedState.showToken) {
      computeTokensForVisible();
      computeTotalTokens();
    }
  });
  content.find("#ih_mgr_select_all").on("click", () => {
    const a = _getActiveSel();
    if (a.total > 0 && a.set.size === a.total) {
      a.set.clear();
    } else {
      for (let i = 0; i < a.total; i++) a.set.add(i);
    }
    refreshList();
  });

  content.find("#ih_mgr_invert").on("click", () => {
    const a = _getActiveSel();
    for (let i = 0; i < a.total; i++) {
      if (a.set.has(i)) a.set.delete(i);
      else a.set.add(i);
    }
    refreshList();
  });

  content.find("#ih_mgr_clear").on("click", () => {
    _getActiveSel().set.clear();
    refreshList();
  });

  content.find("#ih_mgr_range_toggle").on("click", function () {
    if (
      sharedState.activeTab === "transfer" &&
      sharedState.manageTarget === "lower"
    ) {
      sharedState.transferRangeMode = !sharedState.transferRangeMode;
      if (!sharedState.transferRangeMode) sharedState.transferRangeStart = null;
      $(this).toggleClass("ih-mgr-btn-active", sharedState.transferRangeMode);
      content
        .find(".ih-mgr-transfer-target-list")
        .toggleClass("ih-mgr-range-mode", sharedState.transferRangeMode);
      if (sharedState.transferRangeMode) {
        toastr.info("范围选择：点起点，再点终点，中间自动勾选", "", {
          timeOut: 1500,
        });
      }
      renderTransferTarget();
      return;
    }
    sharedState.rangeMode = !sharedState.rangeMode;
    if (!sharedState.rangeMode) sharedState.rangeStart = null;
    $(this).toggleClass("ih-mgr-btn-active", sharedState.rangeMode);
    content
      .find(".ih-mgr-shared-list-area")
      .toggleClass("ih-mgr-range-mode", sharedState.rangeMode);
    if (sharedState.rangeMode) {
      toastr.info("范围选择：点击起点，再点击终点，中间自动勾选", "", {
        timeOut: 1500,
      });
    }
    renderVisible();
  });

  function bindHighlightInput(selector) {
    content.on("input", selector, function () {
      const v = $(this).val();
      if (v !== "") scrollListToFloor(parseInt(v));
      renderVisible();
    });
  }
  bindHighlightInput("#ih_mgr_specific_floor");
  bindHighlightInput("#ih_mgr_keep_recent");
  bindHighlightInput("#ih_mgr_mv_target");
  bindHighlightInput("#ih_mgr_insert_floor");
  function bindRangeSelectInput(fromId, toId) {
    content.on("input", `#${fromId}, #${toId}`, function () {
      const v = $(this).val();
      if (v !== "") scrollListToFloor(parseInt(v));
      const fv = content.find(`#${fromId}`).val();
      const tv = content.find(`#${toId}`).val();
      sharedState.selected.clear();
      if (fv !== "" || tv !== "") {
        const f = fv === "" ? 0 : parseInt(fv);
        const t = tv === "" ? total - 1 : parseInt(tv);
        if (!isNaN(f) && !isNaN(t)) {
          const lo = Math.max(0, Math.min(f, t));
          const hi = Math.min(total - 1, Math.max(f, t));
          for (let i = lo; i <= hi; i++) sharedState.selected.add(i);
        }
      }
      refreshList();
    });
  }
  bindRangeSelectInput("ih_mgr_range_from", "ih_mgr_range_to");
  bindRangeSelectInput("ih_mgr_del_from", "ih_mgr_del_to");

  function getSortedSelected() {
    return Array.from(sharedState.selected).sort((a, b) => a - b);
  }

  function mergeToRanges(floors) {
    if (floors.length === 0) return [];
    const sorted = [...floors].sort((a, b) => a - b);
    const ranges = [];
    let start = sorted[0],
      end = sorted[0];
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i] === end + 1) end = sorted[i];
      else {
        ranges.push([start, end]);
        start = sorted[i];
        end = sorted[i];
      }
    }
    ranges.push([start, end]);
    return ranges;
  }

  content.find("#ih_mgr_hide_one").on("click", async () => {
    const v = content.find("#ih_mgr_specific_floor").val();
    if (v === "") {
      toastr.warning("请输入楼层号", "", { timeOut: 1000 });
      return;
    }
    await doHideOne(v);
    const s = getHiddenStatus();
    content.find("#ih_mgr_hide_status span").text(s.summary);
    refreshList();
  });
  content.find("#ih_mgr_unhide_one").on("click", async () => {
    const v = content.find("#ih_mgr_specific_floor").val();
    if (v === "") {
      toastr.warning("请输入楼层号", "", { timeOut: 1000 });
      return;
    }
    await doUnhideOne(v);
    const s = getHiddenStatus();
    content.find("#ih_mgr_hide_status span").text(s.summary);
    refreshList();
  });
  content.find("#ih_mgr_jump_one").on("click", () => {
    const v = content.find("#ih_mgr_specific_floor").val();
    if (v === "") {
      toastr.warning("请输入楼层号", "", { timeOut: 1000 });
      return;
    }
    const floor = parseInt(v);
    if (isNaN(floor) || floor < 0 || floor >= chat.length) {
      toastr.error(`无效楼层（范围 0~${chat.length - 1}）`, "", {
        timeOut: 2000,
      });
      return;
    }
    closeDialog();
    const chatEl = document.getElementById("chat");
    if (!chatEl) return;
    const mesEl = chatEl.querySelector(`.mes[mesid="${floor}"]`);
    if (mesEl) {
      const r = mesEl.getBoundingClientRect();
      const useCenter = r.height < chatEl.clientHeight - 40;
      scrollChatToElement(mesEl, "smooth", useCenter);
    } else {
      executeSlashCommandsWithOptions(`/chat-jump ${floor}`);
    }
    toastr.info(`已跳转到楼层 ${floor}`, "", { timeOut: 1000 });
  });
  content.find("#ih_mgr_do_range_hide").on("click", async () => {
    await doHideRange(
      content.find("#ih_mgr_range_from").val(),
      content.find("#ih_mgr_range_to").val(),
    );
    const s = getHiddenStatus();
    content.find("#ih_mgr_hide_status span").text(s.summary);
    refreshList();
  });
  content.find("#ih_mgr_do_range_unhide").on("click", async () => {
    await doUnhideRange(
      content.find("#ih_mgr_range_from").val(),
      content.find("#ih_mgr_range_to").val(),
    );
    const s = getHiddenStatus();
    content.find("#ih_mgr_hide_status span").text(s.summary);
    refreshList();
  });
  content.find("#ih_mgr_do_keep").on("click", async () => {
    await doKeepRecent(content.find("#ih_mgr_keep_recent").val());
    const s = getHiddenStatus();
    content.find("#ih_mgr_hide_status span").text(s.summary);
    refreshList();
  });
  content.find("#ih_mgr_do_hide_all").on("click", async () => {
    await doHideAll();
    const s = getHiddenStatus();
    content.find("#ih_mgr_hide_status span").text(s.summary);
    refreshList();
  });
  content.find("#ih_mgr_do_unhide_all").on("click", async () => {
    await doUnhideAll();
    const s = getHiddenStatus();
    content.find("#ih_mgr_hide_status span").text(s.summary);
    refreshList();
  });

  async function batchHideUnhide(isHide) {
    const selected = getSortedSelected();
    if (selected.length === 0) {
      toastr.warning("还没选中任何消息哦", "", { timeOut: 1000 });
      return;
    }
    const ranges = mergeToRanges(selected);
    const cmdName = isHide ? "/hide" : "/unhide";
    for (const [a, b] of ranges) {
      if (a === b) await executeSlashCommandsWithOptions(`${cmdName} ${a}`);
      else await executeSlashCommandsWithOptions(`${cmdName} ${a}-${b}`);
    }
    await new Promise((r) => setTimeout(r, 200));
    toastr.success(
      `已${isHide ? "隐藏" : "显示"} ${selected.length} 条消息`,
      "",
      { timeOut: 1500 },
    );
    const s = getHiddenStatus();
    content.find("#ih_mgr_hide_status span").text(s.summary);
    refreshList();
  }

  content
    .find("#ih_mgr_hide_selected")
    .on("click", () => batchHideUnhide(true));
  content
    .find("#ih_mgr_unhide_selected")
    .on("click", () => batchHideUnhide(false));

  content.find("#ih_mgr_del_range_confirm").on("click", async () => {
    const fv = content.find("#ih_mgr_del_from").val();
    const tv = content.find("#ih_mgr_del_to").val();
    if (fv === "" || tv === "") {
      toastr.warning("请输入起始和结束楼层", "", { timeOut: 1200 });
      return;
    }
    const f = parseInt(fv);
    const t = parseInt(tv);
    if (isNaN(f) || isNaN(t) || f < 0 || t < 0 || f >= total || t >= total) {
      toastr.error(`无效楼层（范围 0~${total - 1}）`, "", { timeOut: 1800 });
      return;
    }
    const lo = Math.min(f, t);
    const hi = Math.max(f, t);
    const count = hi - lo + 1;
    if (getSettings().confirmDangerousActions) {
      if (!confirm(`确定删除楼层 ${lo} 到 ${hi} 共 ${count} 条消息吗？`))
        return;
    }
    chatUndoManager.save();
    closeDialog();
    for (let i = hi; i >= lo; i--) chat.splice(i, 1);
    try {
      await executeSlashCommandsWithOptions("/forcesave");
      await executeSlashCommandsWithOptions("/chat-reload");
      toastr.success(`已删除 ${count} 条消息（可点撤回按钮还原）`, "", {
        timeOut: 2000,
      });
    } catch (e) {
      console.error("快捷工具栏: 删除失败", e);
      toastr.error("删除失败，请尝试撤回", "", { timeOut: 1500 });
    }
  });

  content.find("#ih_mgr_del_confirm").on("click", async () => {
    const selected = getSortedSelected();
    if (selected.length === 0) {
      toastr.warning("还没选中任何消息哦", "", { timeOut: 1000 });
      return;
    }
    if (getSettings().confirmDangerousActions) {
      if (
        !confirm(
          `确定删除选中的 ${selected.length} 条消息吗？\n楼层：${selected.join(", ")}`,
        )
      )
        return;
    }
    chatUndoManager.save();
    closeDialog();
    const reversed = [...selected].sort((a, b) => b - a);
    for (const f of reversed) chat.splice(f, 1);
    try {
      await executeSlashCommandsWithOptions("/forcesave");
      await executeSlashCommandsWithOptions("/chat-reload");
      toastr.success(
        `已删除 ${selected.length} 条消息（可通过撤回按钮还原）`,
        "",
        {
          timeOut: 2000,
        },
      );
    } catch (e) {
      console.error("快捷工具栏: 删除失败", e);
      toastr.error("删除失败，请尝试撤回", "", { timeOut: 1500 });
    }
  });

  content.find("#ih_mgr_mv_confirm").on("click", async () => {
    const selected = getSortedSelected();
    if (selected.length === 0) {
      toastr.warning("请至少勾选一条要移动的消息", "", { timeOut: 1200 });
      return;
    }
    const tv = content.find("#ih_mgr_mv_target").val();
    if (tv === "") {
      toastr.warning("请输入目标楼层", "", { timeOut: 1200 });
      return;
    }
    const target = parseInt(tv);
    if (isNaN(target) || target < 0 || target > total) {
      toastr.error(`无效楼层（范围 0~${total}）`, "", { timeOut: 1800 });
      return;
    }
    if (selected.length === 1 && selected[0] === target) {
      toastr.info("选中和目标是同一楼层哦", "", { timeOut: 1000 });
      return;
    }
    if (getSettings().confirmDangerousActions) {
      if (
        !confirm(
          `确定把 ${selected.length} 条消息移动到楼层 ${target} 的位置吗？`,
        )
      )
        return;
    }
    chatUndoManager.save();
    const toMove = selected.map((f) => chat[f]);
    for (let i = selected.length - 1; i >= 0; i--) chat.splice(selected[i], 1);
    let newTarget = target;
    for (const f of selected) if (f < target) newTarget--;
    newTarget = Math.max(0, Math.min(chat.length, newTarget));
    chat.splice(newTarget, 0, ...toMove);
    closeDialog();
    try {
      await executeSlashCommandsWithOptions("/forcesave");
      await executeSlashCommandsWithOptions("/chat-reload");
      toastr.success(
        `已移动 ${selected.length} 条消息到楼层 ${target}（可撤回还原）`,
        "",
        { timeOut: 2000 },
      );
    } catch (e) {
      console.error("快捷工具栏: 移动失败", e);
      toastr.error("移动失败，请尝试撤回", "", { timeOut: 1500 });
    }
  });
  content.find("#ih_mgr_insert_confirm").on("click", async () => {
    const floorVal = content.find("#ih_mgr_insert_floor").val();
    if (floorVal === "") {
      toastr.warning("请输入插入位置", "", { timeOut: 1200 });
      return;
    }
    const insertAt = parseInt(floorVal);
    if (isNaN(insertAt) || insertAt < 0 || insertAt > chat.length) {
      toastr.error(`无效楼层（范围 0~${chat.length}）`, "", { timeOut: 1800 });
      return;
    }
    const role = content.find("#ih_mgr_insert_role").val();
    let ctx;
    try {
      ctx = SillyTavern.getContext();
    } catch (e) {
      ctx = {};
    }
    const userName = ctx.name1 || "You";
    const charName = ctx.name2 || "Character";
    let newMsg;
    if (role === "user") {
      newMsg = {
        name: userName,
        is_user: true,
        is_system: false,
        mes: "",
        send_date: Date.now(),
        extra: {},
      };
    } else if (role === "char") {
      newMsg = {
        name: charName,
        is_user: false,
        is_system: false,
        mes: "",
        send_date: Date.now(),
        extra: {},
      };
    } else {
      newMsg = {
        name: "",
        is_user: false,
        is_system: true,
        mes: "",
        send_date: Date.now(),
        extra: { type: "narrator" },
      };
    }
    chatUndoManager.save();
    chat.splice(insertAt, 0, newMsg);
    closeDialog();
    try {
      await executeSlashCommandsWithOptions("/forcesave");
      await executeSlashCommandsWithOptions("/chat-reload");
      toastr.success(`已在楼层 ${insertAt} 插入空白消息`, "", {
        timeOut: 1500,
      });
      setTimeout(() => {
        const chatEl = document.getElementById("chat");
        if (!chatEl) return;
        const mesEl = chatEl.querySelector(`.mes[mesid="${insertAt}"]`);
        if (mesEl) {
          scrollChatToElement(mesEl, "smooth", false);
          setTimeout(() => {
            const editBtn = $(mesEl).find(".mes_edit").first();
            if (editBtn.length && editBtn.is(":visible")) {
              editBtn.trigger("click");
            }
          }, 400);
        }
      }, 600);
    } catch (e) {
      console.error("快捷工具栏: 插入消息失败", e);
      toastr.error("插入失败，请尝试撤回", "", { timeOut: 1500 });
    }
  });
  function _getTransferChar() {
    let groupId = null;
    try {
      groupId = SillyTavern.getContext().groupId;
    } catch (e) {}
    if (groupId) return { group: true };
    const chid = this_chid;
    const character =
      chid !== undefined && chid !== null ? characters[chid] : null;
    if (!character || !character.avatar) return null;
    return {
      character,
      avatar: character.avatar,
      chatFile: character.chat,
    };
  }

  let _transferAllOptions = [];
  let _transferSelectedValue = "";

  function _getTransferHistory() {
    const info = _getTransferChar();
    if (!info || info.group || !info.avatar) return [];
    const all = getSettings().transferHistory || {};
    const arr = all[info.avatar];
    return Array.isArray(arr) ? arr : [];
  }

  function _pushTransferHistory(fileNameWithExt) {
    const info = _getTransferChar();
    if (!info || info.group || !info.avatar) return;
    const all = getSettings().transferHistory || {};
    let arr = Array.isArray(all[info.avatar]) ? all[info.avatar] : [];
    arr = arr.filter((x) => x !== fileNameWithExt);
    arr.unshift(fileNameWithExt);
    arr = arr.slice(0, 5);
    all[info.avatar] = arr;
    getSettings().transferHistory = all;
    saveSettingsDebounced();
  }

  function _getTransferTargetValue() {
    return _transferSelectedValue;
  }

  function _setTransferSelected(fileNameWithExt) {
    _transferSelectedValue = fileNameWithExt || "";
    const opt = _transferAllOptions.find(
      (o) => o.value === _transferSelectedValue,
    );
    const displayText = opt ? opt.label : "请选择目标聊天档…";
    content
      .find("#ih_mgr_transfer_display .ih-mgr-select2-text")
      .text(displayText);
    _closeTransferDropdown();
    loadTransferTarget(_transferSelectedValue);
  }

  function _renderTransferOptions(filterText) {
    const listEl = content.find("#ih_mgr_transfer_options")[0];
    if (!listEl) return;
    const kw = String(filterText || "")
      .trim()
      .toLowerCase();
    const history = _getTransferHistory();
    const matched = _transferAllOptions.filter(
      (o) => !kw || o.label.toLowerCase().includes(kw),
    );
    let html = "";
    if (!kw) {
      const historyOpts = history
        .map((h) => _transferAllOptions.find((o) => o.value === h))
        .filter(Boolean);
      if (historyOpts.length > 0) {
        html += `<div class="ih-mgr-select2-group">最近使用</div>`;
        historyOpts.forEach((o) => {
          html += `<div class="ih-mgr-select2-opt" data-value="${ihEscapeAttr(o.value)}"><i class="fa-solid fa-clock-rotate-left"></i> ${ihEscapeHtml(o.label)}</div>`;
        });
        html += `<div class="ih-mgr-select2-group">全部聊天档</div>`;
      }
    }
    if (matched.length === 0) {
      html += `<div class="ih-mgr-select2-empty">没有匹配的聊天档</div>`;
    } else {
      matched.forEach((o) => {
        html += `<div class="ih-mgr-select2-opt${o.value === _transferSelectedValue ? " ih-mgr-select2-opt-active" : ""}" data-value="${ihEscapeAttr(o.value)}">${ihEscapeHtml(o.label)}</div>`;
      });
    }
    listEl.innerHTML = html;
  }

  function _openTransferDropdown() {
    content.find("#ih_mgr_transfer_select2").addClass("ih-mgr-select2-open");
    content.find("#ih_mgr_transfer_search").val("");
    content.find("#ih_mgr_transfer_search_clear").removeClass("ih-visible");
    _renderTransferOptions("");
    const dd = content.find("#ih_mgr_transfer_dropdown")[0];
    const select2El = content.find("#ih_mgr_transfer_select2")[0];
    if (dd && select2El) {
      const panelEl = content[0];
      const panelStyle = window.getComputedStyle(panelEl);
      const panelPadLeft = parseFloat(panelStyle.paddingLeft) || 0;
      const panelPadRight = parseFloat(panelStyle.paddingRight) || 0;
      const panelRect = panelEl.getBoundingClientRect();
      const selRect = select2El.getBoundingClientRect();
      const contentLeft = panelRect.left + panelPadLeft;
      const contentRight = panelRect.right - panelPadRight;
      dd.style.left = contentLeft - selRect.left + "px";
      const width = contentRight - contentLeft;
      if (width > 0) dd.style.width = width + "px";
    }
    if (dd) syncDialogTheme(dd);
    generateFaIconProtectionCSS();
    setTimeout(() => {
      const si = content.find("#ih_mgr_transfer_search")[0];
      if (si) si.focus();
    }, 30);
  }

  function _closeTransferDropdown() {
    content.find("#ih_mgr_transfer_select2").removeClass("ih-mgr-select2-open");
  }

  async function loadTransferChatList() {
    const actionBtns = content.find(
      "#ih_mgr_transfer_copy, #ih_mgr_transfer_move",
    );
    const curEl = content.find("#ih_mgr_transfer_current");
    const displayText = content.find(
      "#ih_mgr_transfer_display .ih-mgr-select2-text",
    );
    const info = _getTransferChar();
    _transferAllOptions = [];
    _transferSelectedValue = "";
    if (!info) {
      displayText.text("无法获取当前角色");
      actionBtns.prop("disabled", true);
      curEl.text("—");
      return;
    }
    if (info.group) {
      displayText.text("群聊暂不支持转存");
      actionBtns.prop("disabled", true);
      curEl.text("群聊暂不支持");
      return;
    }
    curEl.text(String(info.chatFile || "—"));
    displayText.text("加载中…");
    let chats = [];
    try {
      const resp = await fetch("/api/characters/chats", {
        method: "POST",
        headers: getRequestHeaders(),
        body: JSON.stringify({ avatar_url: info.avatar }),
      });
      if (resp.ok) {
        const data = await resp.json();
        if (data && typeof data === "object" && !data.error) {
          chats = Object.values(data);
        }
      }
    } catch (e) {
      console.error("快捷工具栏: 获取聊天档列表失败", e);
    }
    const currentChat = String(info.chatFile || "");
    chats.forEach((c) => {
      if (!c || !c.file_name) return;
      const nameNoExt = String(c.file_name).replace(/\.jsonl$/i, "");
      if (nameNoExt === currentChat) return;
      const count = c.message_count != null ? `（${c.message_count}条）` : "";
      _transferAllOptions.push({
        value: c.file_name,
        label: nameNoExt + count,
      });
    });
    if (_transferAllOptions.length === 0) {
      displayText.text("没有其他聊天档可选");
      actionBtns.prop("disabled", true);
      return;
    }
    displayText.text("请选择目标聊天档…");
    actionBtns.prop("disabled", false);
  }

  async function _fetchTargetChat(nameNoExt) {
    const info = _getTransferChar();
    if (!info || info.group) return null;
    const resp = await fetch("/api/chats/get", {
      method: "POST",
      headers: getRequestHeaders(),
      cache: "no-cache",
      body: JSON.stringify({
        ch_name: info.character.name,
        file_name: nameNoExt,
        avatar_url: info.avatar,
      }),
    });
    if (!resp.ok) throw new Error("读取失败");
    const data = await resp.json();
    if (Array.isArray(data) && data.length > 0) {
      return { header: data[0], messages: data.slice(1) };
    }
    return { header: null, messages: [] };
  }

  function _transferBuildRow(floor, insertAt) {
    const arr = sharedState.transferTargetChat || [];
    const msg = arr[floor];
    if (!msg) return "";
    const sender = ihEscapeHtml(msg.name || (msg.is_user ? "User" : "AI"));
    const rawMes = String(msg.mes || "");
    const preview =
      ihEscapeHtml(rawMes.replace(/\s+/g, " ").substring(0, 60)) +
      (rawMes.length > 60 ? "..." : "");
    const hidden = isMessageHidden(msg);
    const isLower = sharedState.manageTarget === "lower";
    const isChecked = sharedState.transferSelected.has(floor);
    const cls = ["ih-mgr-tmsg-item"];
    if (hidden) cls.push("ih-mgr-msg-is-hidden");
    if (!isLower && insertAt === floor) cls.push("ih-mgr-tmsg-insert-above");
    if (isLower && isChecked) cls.push("ih-mgr-tmsg-checked");
    if (isLower && sharedState.transferRangeStart === floor)
      cls.push("ih-mgr-tmsg-range-start");
    if (sharedState.transferJumpHighlight === floor)
      cls.push("ih-mgr-jump-highlight");
    const ghost = hidden
      ? '<span class="ih-mgr-msg-ghost"><i class="fa-solid fa-ghost"></i></span>'
      : "";
    return `
      <div class="${cls.join(" ")}" data-tfloor="${floor}" style="height:${ROW_HEIGHT}px;">
        <span class="ih-mgr-tmsg-check"><input type="checkbox" data-tfloor="${floor}" ${isChecked ? "checked" : ""} /></span>
        <span class="ih-mgr-msg-lead">
          <button class="ih-mgr-tmsg-jump" data-tfloor="${floor}" title="打开目标聊天档并跳转到此消息"><i class="fa-solid fa-location-arrow"></i></button>
          <span class="ih-mgr-msg-floor">#${floor}</span>
        </span>
        <span class="ih-mgr-msg-sender">${sender}</span>
        <span class="ih-mgr-msg-preview">${preview}</span>
        <button class="ih-mgr-tmsg-edit" data-tfloor="${floor}" title="编辑此楼层（保存后写回目标聊天档）"><i class="fa-solid fa-pen"></i></button>
        ${ghost}
      </div>`;
  }

  function renderTransferTarget() {
    const listEl = content.find("#ih_mgr_transfer_target_list")[0];
    if (!listEl) return;
    const spacerTop = listEl.querySelector(".ih-mgr-tvlist-spacer-top");
    const spacerBottom = listEl.querySelector(".ih-mgr-tvlist-spacer-bottom");
    const rowsHost = listEl.querySelector(".ih-mgr-tvlist-rows");
    const tail = listEl.querySelector(".ih-mgr-tvlist-tail");
    if (!spacerTop || !spacerBottom || !rowsHost || !tail) return;

    if (sharedState.transferLoading) {
      spacerTop.style.height = "0px";
      spacerBottom.style.height = "0px";
      rowsHost.innerHTML = "";
      tail.innerHTML = '<div class="ih-mgr-transfer-empty">加载中…</div>';
      return;
    }
    const arr = sharedState.transferTargetChat;
    if (!arr) {
      spacerTop.style.height = "0px";
      spacerBottom.style.height = "0px";
      rowsHost.innerHTML = "";
      tail.innerHTML =
        '<div class="ih-mgr-transfer-empty">请在上方选择目标聊天档</div>';
      return;
    }
    const total2 = arr.length;
    const insertAt =
      sharedState.transferInsertAt == null
        ? total2
        : sharedState.transferInsertAt;
    const scrollTop = listEl.scrollTop;
    const viewH = listEl.clientHeight || 300;
    const startIdx = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - BUFFER);
    const endIdx = Math.min(
      total2,
      Math.ceil((scrollTop + viewH) / ROW_HEIGHT) + BUFFER,
    );
    spacerTop.style.height = startIdx * ROW_HEIGHT + "px";
    spacerBottom.style.height = (total2 - endIdx) * ROW_HEIGHT + "px";
    let html = "";
    for (let i = startIdx; i < endIdx; i++) {
      const floor = sharedState.transferReverseOrder ? total2 - 1 - i : i;
      html += _transferBuildRow(floor, insertAt);
    }
    rowsHost.innerHTML = html;
    const endActive = insertAt >= total2 ? " ih-mgr-tmsg-end-active" : "";
    tail.innerHTML = `<div class="ih-mgr-tmsg-end${endActive}" data-tfloor="${total2}"><i class="fa-solid fa-arrow-down-long"></i> 追加到末尾（共 ${total2} 条）</div>`;
  }

  function scrollTransferToFloor(floor) {
    const listEl = content.find("#ih_mgr_transfer_target_list")[0];
    const arr = sharedState.transferTargetChat || [];
    if (!listEl || floor < 0 || floor >= arr.length) return;
    const displayIndex = sharedState.transferReverseOrder
      ? arr.length - 1 - floor
      : floor;
    const targetTop =
      displayIndex * ROW_HEIGHT - listEl.clientHeight / 2 + ROW_HEIGHT / 2;
    listEl.scrollTo({ top: Math.max(0, targetTop), behavior: "smooth" });
  }

  async function loadTransferTarget(fileNameWithExt) {
    sharedState.transferSelected.clear();
    sharedState.transferRangeStart = null;
    sharedState.transferRangeMode = false;
    content.find("#ih_mgr_range_toggle").removeClass("ih-mgr-btn-active");
    content
      .find(".ih-mgr-transfer-target-list")
      .removeClass("ih-mgr-range-mode");
    updateCount();
    if (!fileNameWithExt) {
      sharedState.transferTargetChat = null;
      sharedState.transferTargetHeader = null;
      sharedState.transferInsertAt = null;
      renderTransferTarget();
      return;
    }
    sharedState.transferLoading = true;
    renderTransferTarget();
    const nameNoExt = String(fileNameWithExt).replace(/\.jsonl$/i, "");
    try {
      const result = await _fetchTargetChat(nameNoExt);
      sharedState.transferTargetHeader = result.header;
      sharedState.transferTargetChat = result.messages;
      sharedState.transferInsertAt = null;
    } catch (e) {
      console.error("快捷工具栏: 读取目标聊天档失败", e);
      sharedState.transferTargetChat = null;
      sharedState.transferTargetHeader = null;
      toastr.error("读取目标聊天档失败", "", { timeOut: 1500 });
    } finally {
      sharedState.transferLoading = false;
      renderTransferTarget();
    }
  }

  content.on("click", "#ih_mgr_transfer_display", function (e) {
    e.stopPropagation();
    const isOpen = content
      .find("#ih_mgr_transfer_select2")
      .hasClass("ih-mgr-select2-open");
    if (isOpen) {
      _closeTransferDropdown();
    } else {
      if (_transferAllOptions.length === 0) return;
      _openTransferDropdown();
    }
  });
  content.on("input", "#ih_mgr_transfer_search", function () {
    const v = $(this).val();
    content
      .find("#ih_mgr_transfer_search_clear")
      .toggleClass("ih-visible", !!String(v).length);
    _renderTransferOptions(v);
  });
  content.on("click", "#ih_mgr_transfer_search_clear", function (e) {
    e.stopPropagation();
    const si = content.find("#ih_mgr_transfer_search");
    si.val("");
    content.find("#ih_mgr_transfer_search_clear").removeClass("ih-visible");
    _renderTransferOptions("");
    si.focus();
  });
  content.on(
    "click",
    "#ih_mgr_transfer_options .ih-mgr-select2-opt",
    function () {
      const val = $(this).attr("data-value");
      if (val) _setTransferSelected(val);
    },
  );
  content.on("click", "#ih_mgr_transfer_dropdown", function (e) {
    e.stopPropagation();
  });
  content.find("#ih_mgr_transfer_clear_selected").on("click", () => {
    _setTransferSelected("");
  });
  function _syncManageToggleUI() {
    const isLower = sharedState.manageTarget === "lower";
    const btn = content.find("#ih_mgr_manage_toggle");
    btn
      .find("i")
      .attr(
        "class",
        isLower ? "fa-solid fa-arrow-down" : "fa-solid fa-arrow-up",
      );
    btn.find(".ih-mgr-manage-toggle-text").text(isLower ? "下" : "上");
    btn.toggleClass("ih-mgr-btn-active", isLower);
    content.toggleClass("ih-mgr-manage-lower", isLower);
    updateCount();
    _updateTransferDirectionUI();
  }

  function _updateTransferDirectionUI() {
    const isLower = sharedState.manageTarget === "lower";
    if (isLower) {
      content
        .find("#ih_mgr_transfer_target_label_text")
        .text("来源聊天档预览（勾选要转入当前聊天的消息）");
      content
        .find("#ih_mgr_transfer_target_arrow")
        .attr("class", "fa-solid fa-arrow-up-long");
      content
        .find("#ih_mgr_transfer_copy")
        .html('<i class="fa-solid fa-copy"></i> 复制至当前');
      content
        .find("#ih_mgr_transfer_move")
        .html('<i class="fa-solid fa-scissors"></i> 移动至当前');
    } else {
      content
        .find("#ih_mgr_transfer_target_label_text")
        .text("目标聊天档预览（点击某条消息＝插入到该消息前）");
      content
        .find("#ih_mgr_transfer_target_arrow")
        .attr("class", "fa-solid fa-arrow-down-long");
      content
        .find("#ih_mgr_transfer_copy")
        .html('<i class="fa-solid fa-copy"></i> 复制');
      content
        .find("#ih_mgr_transfer_move")
        .html('<i class="fa-solid fa-scissors"></i> 移动');
    }
    generateFaIconProtectionCSS();
    renderVisible();
    renderTransferTarget();
  }

  content.find("#ih_mgr_manage_toggle").on("click", () => {
    sharedState.manageTarget =
      sharedState.manageTarget === "lower" ? "upper" : "lower";
    sharedState.rangeMode = false;
    sharedState.rangeStart = null;
    sharedState.transferRangeMode = false;
    sharedState.transferRangeStart = null;
    content.find(".ih-mgr-shared-list-area").removeClass("ih-mgr-range-mode");
    content
      .find(".ih-mgr-transfer-target-list")
      .removeClass("ih-mgr-range-mode");
    content.find("#ih_mgr_range_toggle").removeClass("ih-mgr-btn-active");
    _syncManageToggleUI();
  });

  const _transferListEl = content.find("#ih_mgr_transfer_target_list")[0];
  if (_transferListEl) {
    let _tRaf = null;
    _transferListEl.addEventListener(
      "scroll",
      () => {
        if (_tRaf) return;
        _tRaf = requestAnimationFrame(() => {
          _tRaf = null;
          renderTransferTarget();
        });
      },
      { passive: true },
    );
  }

  function _setTransferInsert(f) {
    const arr = sharedState.transferTargetChat || [];
    sharedState.transferInsertAt = f >= arr.length ? null : f;
    renderTransferTarget();
  }

  content.on("click", ".ih-mgr-tmsg-item, .ih-mgr-tmsg-end", function (e) {
    if ($(e.target).closest(".ih-mgr-tmsg-edit").length) return;
    if ($(e.target).closest(".ih-mgr-tmsg-jump").length) return;
    const f = parseInt($(this).attr("data-tfloor"));
    if (isNaN(f)) return;

    if (sharedState.manageTarget === "lower") {
      if ($(this).hasClass("ih-mgr-tmsg-end")) return;
      if (sharedState.transferRangeMode) {
        if (sharedState.transferRangeStart === null) {
          sharedState.transferRangeStart = f;
          renderTransferTarget();
        } else {
          const a = Math.min(sharedState.transferRangeStart, f);
          const b = Math.max(sharedState.transferRangeStart, f);
          for (let i = a; i <= b; i++) sharedState.transferSelected.add(i);
          sharedState.transferRangeStart = null;
          sharedState.transferRangeMode = false;
          content
            .find(".ih-mgr-transfer-target-list")
            .removeClass("ih-mgr-range-mode");
          content.find("#ih_mgr_range_toggle").removeClass("ih-mgr-btn-active");
          renderTransferTarget();
          updateCount();
        }
        return;
      }
      if ($(e.target).is("input[type=checkbox]")) {
        if (e.target.checked) sharedState.transferSelected.add(f);
        else sharedState.transferSelected.delete(f);
      } else {
        if (sharedState.transferSelected.has(f))
          sharedState.transferSelected.delete(f);
        else sharedState.transferSelected.add(f);
      }
      renderTransferTarget();
      updateCount();
      return;
    }

    _setTransferInsert(f);
  });
  content.on("click", ".ih-mgr-tmsg-jump", async function (e) {
    e.stopPropagation();
    const f = parseInt($(this).attr("data-tfloor"));
    if (isNaN(f)) return;
    const info = _getTransferChar();
    const targetFile = _getTransferTargetValue();
    if (!info || info.group || !targetFile) {
      toastr.warning("请先选择目标聊天档", "", { timeOut: 1200 });
      return;
    }
    const nameNoExt = String(targetFile).replace(/\.jsonl$/i, "");
    closeDialog();
    try {
      if (typeof openCharacterChat === "function") {
        await openCharacterChat(nameNoExt);
      } else {
        info.character.chat = nameNoExt;
        await executeSlashCommandsWithOptions("/chat-reload");
      }
      setTimeout(() => {
        const chatEl = document.getElementById("chat");
        if (!chatEl) return;
        const mesEl = chatEl.querySelector(`.mes[mesid="${f}"]`);
        if (mesEl) {
          const r = mesEl.getBoundingClientRect();
          const useCenter = r.height < chatEl.clientHeight - 40;
          scrollChatToElement(mesEl, "smooth", useCenter);
        } else {
          executeSlashCommandsWithOptions(`/chat-jump ${f}`);
        }
      }, 600);
    } catch (e2) {
      console.error("快捷工具栏: 打开目标聊天档跳转失败", e2);
      toastr.warning("打开目标聊天档失败，请手动切换", "", { timeOut: 2000 });
    }
  });
  content.on("click", ".ih-mgr-tmsg-edit", function (e) {
    e.stopPropagation();
    e.preventDefault();
    const f = parseInt($(this).attr("data-tfloor"));
    const arr = sharedState.transferTargetChat || [];
    if (isNaN(f) || !arr[f]) return;
    openTransferEditDialog(f);
  });

  function openTransferEditDialog(floor) {
    const arr = sharedState.transferTargetChat || [];
    const msg = arr[floor];
    if (!msg) return;
    const info = _getTransferChar();
    const targetFile = _getTransferTargetValue();
    if (!info || info.group || !targetFile) {
      toastr.warning("无法编辑目标楼层", "", { timeOut: 1200 });
      return;
    }
    const sender = msg.name || (msg.is_user ? "User" : "AI");
    const { overlay, escHandler } = createDialogOverlay();
    const dlg = $(`
      <div class="ih-mgr-edit-content">
        <h3><i class="fa-solid fa-pen"></i> 编辑目标楼层 #${floor}<span style="font-size:12px;opacity:0.6;font-weight:normal;margin-left:6px;">${ihEscapeHtml(sender)}</span></h3>
        <textarea class="ih-mgr-edit-textarea" placeholder="在此编辑消息内容..."></textarea>
        <div class="ih-mgr-edit-actions">
          <button class="ih-hm-btn" data-act="cancel">取消</button>
          <button class="ih-hm-btn ih-hm-btn-ok" data-act="save"><i class="fa-solid fa-check"></i> 保存</button>
        </div>
      </div>
    `);
    dlg.find("textarea").val(String(msg.mes || ""));
    overlay.append(dlg);
    syncDialogTheme(dlg[0]);
    dlg.on("click", (e) => e.stopPropagation());
    generateFaIconProtectionCSS();
    const close = () => {
      document.removeEventListener("keydown", escHandler, true);
      overlay.remove();
    };
    overlay.off("click").on("click", (e) => {
      if (e.target === overlay[0]) close();
    });
    dlg.find('[data-act="cancel"]').on("click", close);
    dlg.find('[data-act="save"]').on("click", async () => {
      const newText = dlg.find("textarea").val();
      msg.mes = newText;
      if (
        Array.isArray(msg.swipes) &&
        typeof msg.swipe_id === "number" &&
        msg.swipe_id >= 0 &&
        msg.swipe_id < msg.swipes.length
      ) {
        msg.swipes[msg.swipe_id] = newText;
      }
      const nameNoExt = String(targetFile).replace(/\.jsonl$/i, "");
      const header = sharedState.transferTargetHeader || {
        user_name: name1 || "User",
        character_name: info.character.name,
        create_date: new Date().toISOString(),
        chat_metadata: {},
      };
      let ok = false;
      try {
        const resp = await fetch("/api/chats/save", {
          method: "POST",
          headers: getRequestHeaders(),
          cache: "no-cache",
          body: JSON.stringify({
            ch_name: info.character.name,
            file_name: nameNoExt,
            chat: [header, ...arr],
            avatar_url: info.avatar,
            force: true,
          }),
        });
        ok = resp.ok;
      } catch (e) {
        console.error("快捷工具栏: 写回目标楼层失败", e);
      }
      close();
      if (ok) {
        _ihDeleteSearchCache(targetFile);
        renderTransferTarget();
        toastr.success(`已保存目标楼层 #${floor}`, "", { timeOut: 1000 });
      } else {
        toastr.error("保存失败", "", { timeOut: 1500 });
      }
    });
    setTimeout(() => {
      const ta = dlg.find("textarea")[0];
      if (ta) ta.focus();
    }, 100);
  }

  async function doTransfer(isMove) {
    const info = _getTransferChar();
    if (!info || info.group) {
      toastr.warning("当前无法转存", "", { timeOut: 1200 });
      return;
    }
    const targetFile = _getTransferTargetValue();
    if (!targetFile) {
      toastr.warning("请先选择目标聊天档", "", { timeOut: 1200 });
      return;
    }
    if (sharedState.manageTarget === "lower") {
      return _doTransferIntoCurrent(isMove, info, targetFile);
    }
    const selected = getSortedSelected();
    if (selected.length === 0) {
      toastr.warning("请先在上方勾选要转存的消息", "", { timeOut: 1200 });
      return;
    }
    const nameNoExt = String(targetFile).replace(/\.jsonl$/i, "");
    let header = null;
    let targetMsgs = [];
    try {
      const result = await _fetchTargetChat(nameNoExt);
      header = result.header;
      targetMsgs = result.messages;
    } catch (e) {
      console.error("快捷工具栏: 转存前读取目标失败", e);
      toastr.error("读取目标聊天档失败，转存已取消", "", { timeOut: 1800 });
      return;
    }
    if (!header) {
      header = {
        user_name: name1 || "User",
        character_name: info.character.name,
        create_date: new Date().toISOString(),
        chat_metadata: {},
      };
    }
    if (getSettings().confirmDangerousActions) {
      const modeText = isMove ? "移动" : "复制";
      const extra = isMove ? "\n（移动后这些消息将从当前聊天中删除）" : "";
      if (
        !confirm(
          `确定将选中的 ${selected.length} 条消息${modeText}至「${nameNoExt}」吗？${extra}`,
        )
      )
        return;
    }
    let toTransfer;
    try {
      toTransfer = JSON.parse(JSON.stringify(selected.map((f) => chat[f])));
    } catch (e) {
      toastr.error("消息数据异常，转存失败", "", { timeOut: 1500 });
      return;
    }
    let insertAt =
      sharedState.transferInsertAt == null
        ? targetMsgs.length
        : sharedState.transferInsertAt;
    insertAt = Math.max(0, Math.min(targetMsgs.length, insertAt));
    targetMsgs.splice(insertAt, 0, ...toTransfer);
    const jumpToFloor = insertAt;
    const transferCount = toTransfer.length;
    let saveOk = false;
    try {
      const saveResp = await fetch("/api/chats/save", {
        method: "POST",
        headers: getRequestHeaders(),
        cache: "no-cache",
        body: JSON.stringify({
          ch_name: info.character.name,
          file_name: nameNoExt,
          chat: [header, ...targetMsgs],
          avatar_url: info.avatar,
          force: true,
        }),
      });
      saveOk = saveResp.ok;
    } catch (e) {
      console.error("快捷工具栏: 写入目标聊天档失败", e);
    }
    if (!saveOk) {
      toastr.error("写入目标聊天档失败，转存已取消", "", { timeOut: 1800 });
      return;
    }
    _ihSetSearchCache(targetFile, targetMsgs);
    _pushTransferHistory(targetFile);
    if (isMove) {
      const reversed = [...selected].sort((a, b) => b - a);
      for (const f of reversed) chat.splice(f, 1);
      try {
        await executeSlashCommandsWithOptions("/forcesave");
      } catch (e) {
        console.error("快捷工具栏: 保存当前聊天失败", e);
      }
    }
    closeDialog();
    toastr.success(
      `已${isMove ? "移动" : "复制"} ${selected.length} 条消息到「${nameNoExt}」，正在打开…`,
      "",
      { timeOut: 1500 },
    );
    try {
      if (typeof openCharacterChat === "function") {
        await openCharacterChat(nameNoExt);
      } else {
        info.character.chat = nameNoExt;
        await executeSlashCommandsWithOptions("/chat-reload");
      }
      setTimeout(() => {
        const chatEl = document.getElementById("chat");
        if (!chatEl) return;
        const mesEl = chatEl.querySelector(`.mes[mesid="${jumpToFloor}"]`);
        if (mesEl) {
          const r = mesEl.getBoundingClientRect();
          const useCenter = r.height < chatEl.clientHeight - 40;
          scrollChatToElement(mesEl, "smooth", useCenter);
        } else {
          executeSlashCommandsWithOptions(`/chat-jump ${jumpToFloor}`);
        }
        setTimeout(() => {
          const flashChatEl = document.getElementById("chat");
          if (!flashChatEl) return;
          const flashed = [];
          for (let i = 0; i < transferCount; i++) {
            const el = flashChatEl.querySelector(
              `.mes[mesid="${jumpToFloor + i}"]`,
            );
            if (el) {
              el.classList.add("ih-transfer-landed");
              flashed.push(el);
            }
          }
          setTimeout(() => {
            flashed.forEach((el) => el.classList.remove("ih-transfer-landed"));
          }, 2200);
        }, 400);
      }, 600);
    } catch (e) {
      console.error("快捷工具栏: 打开目标聊天档失败", e);
      toastr.warning("转存成功，但自动打开失败，请手动切换聊天", "", {
        timeOut: 2000,
      });
    }
  }

  async function _doTransferIntoCurrent(isMove, info, targetFile) {
    const selected = Array.from(sharedState.transferSelected).sort(
      (a, b) => a - b,
    );
    if (selected.length === 0) {
      toastr.warning("请先在下方勾选要转入当前聊天的消息", "", {
        timeOut: 1200,
      });
      return;
    }
    const nameNoExt = String(targetFile).replace(/\.jsonl$/i, "");
    let header = null;
    let srcMsgs = [];
    try {
      const result = await _fetchTargetChat(nameNoExt);
      header = result.header;
      srcMsgs = result.messages;
    } catch (e) {
      console.error("快捷工具栏: 转存前读取来源档失败", e);
      toastr.error("读取来源聊天档失败，转存已取消", "", { timeOut: 1800 });
      return;
    }
    const maxIdx = srcMsgs.length - 1;
    const validSelected = selected.filter((f) => f >= 0 && f <= maxIdx);
    if (validSelected.length === 0) {
      toastr.warning("选中的楼层在来源聊天档中已不存在", "", { timeOut: 1500 });
      return;
    }
    if (getSettings().confirmDangerousActions) {
      const modeText = isMove ? "移动" : "复制";
      const extra = isMove ? "\n（移动后这些消息将从来源聊天档中删除）" : "";
      if (
        !confirm(
          `确定将来源聊天档「${nameNoExt}」中选中的 ${validSelected.length} 条消息${modeText}至当前聊天吗？${extra}`,
        )
      )
        return;
    }
    let toTransfer;
    try {
      toTransfer = JSON.parse(
        JSON.stringify(validSelected.map((f) => srcMsgs[f])),
      );
    } catch (e) {
      toastr.error("消息数据异常，转存失败", "", { timeOut: 1500 });
      return;
    }
    let newSrc = null;
    if (isMove) {
      if (!header) {
        header = {
          user_name: name1 || "User",
          character_name: info.character.name,
          create_date: new Date().toISOString(),
          chat_metadata: {},
        };
      }
      newSrc = [...srcMsgs];
      const reversed = [...validSelected].sort((a, b) => b - a);
      for (const f of reversed) newSrc.splice(f, 1);
    }
    let insertAt =
      sharedState.transferUpperInsertAt == null
        ? chat.length
        : sharedState.transferUpperInsertAt;
    insertAt = Math.max(0, Math.min(chat.length, insertAt));
    const jumpToFloor = insertAt;
    const transferCount = toTransfer.length;
    const currentChatBackup = JSON.parse(JSON.stringify(chat));
    chatUndoManager.save();
    chat.splice(insertAt, 0, ...toTransfer);

    try {
      await executeSlashCommandsWithOptions("/forcesave");
    } catch (e) {
      console.error("快捷工具栏: 保存当前聊天失败", e);
      chat.length = 0;
      currentChatBackup.forEach((msg) => chat.push(msg));
      try {
        await executeSlashCommandsWithOptions("/forcesave");
        await executeSlashCommandsWithOptions("/chat-reload");
      } catch (rollbackError) {
        console.error("快捷工具栏: 恢复当前聊天失败", rollbackError);
      }
      toastr.error("当前聊天保存失败，本次转存已撤销", "", {
        timeOut: 2000,
      });
      return;
    }

    let sourceDeleteFailed = false;
    if (isMove) {
      try {
        const resp = await fetch("/api/chats/save", {
          method: "POST",
          headers: getRequestHeaders(),
          cache: "no-cache",
          body: JSON.stringify({
            ch_name: info.character.name,
            file_name: nameNoExt,
            chat: [header, ...newSrc],
            avatar_url: info.avatar,
            force: true,
          }),
        });
        if (!resp.ok) {
          throw new Error(`HTTP ${resp.status}`);
        }
        _ihSetSearchCache(targetFile, newSrc);
      } catch (e) {
        sourceDeleteFailed = true;
        console.error("快捷工具栏: 从来源档删除失败", e);
      }
    }

    _pushTransferHistory(targetFile);
    closeDialog();
    try {
      await executeSlashCommandsWithOptions("/chat-reload");
      if (sourceDeleteFailed) {
        toastr.warning(
          `已将 ${transferCount} 条消息保存到当前聊天，但来源聊天档删除失败；消息仍保留在原处，请核对后再手动删除`,
          "",
          { timeOut: 3500 },
        );
      } else {
        toastr.success(
          `已${isMove ? "移动" : "复制"} ${transferCount} 条消息到当前聊天`,
          "",
          { timeOut: 1500 },
        );
      }
      setTimeout(() => {
        const chatEl = document.getElementById("chat");
        if (!chatEl) return;
        const mesEl = chatEl.querySelector(`.mes[mesid="${jumpToFloor}"]`);
        if (mesEl) {
          const r = mesEl.getBoundingClientRect();
          const useCenter = r.height < chatEl.clientHeight - 40;
          scrollChatToElement(mesEl, "smooth", useCenter);
        } else {
          executeSlashCommandsWithOptions(`/chat-jump ${jumpToFloor}`);
        }
        setTimeout(() => {
          const flashChatEl = document.getElementById("chat");
          if (!flashChatEl) return;
          const flashed = [];
          for (let i = 0; i < transferCount; i++) {
            const el = flashChatEl.querySelector(
              `.mes[mesid="${jumpToFloor + i}"]`,
            );
            if (el) {
              el.classList.add("ih-transfer-landed");
              flashed.push(el);
            }
          }
          setTimeout(() => {
            flashed.forEach((el) => el.classList.remove("ih-transfer-landed"));
          }, 2200);
        }, 400);
      }, 600);
    } catch (e) {
      console.error("转入当前聊天失败", e);
      toastr.error("转存失败", "", { timeOut: 1500 });
    }
  }
  content.find("#ih_mgr_transfer_copy").on("click", () => {
    if (sharedState.searchBasket.length > 0) _doBasketCopy();
    else doTransfer(false);
  });
  content.find("#ih_mgr_transfer_move").on("click", () => {
    if (sharedState.searchBasket.length > 0) _doBasketMove();
    else doTransfer(true);
  });
  function _updateBasketBanner() {
    const n = sharedState.searchBasket.length;
    content.toggleClass("ih-mgr-has-basket", n > 0);
    const banner = content.find("#ih_mgr_basket_banner");
    if (n > 0) {
      banner.css("display", "flex");
      banner
        .find(".ih-mgr-basket-text")
        .text(`转存篮：${n} 条 · 选好目标档和落点后点下方「复制/移动」`);
    } else {
      banner.hide();
    }
    const searchBar = content.find("#ih_mgr_search_basket_bar");
    if (n > 0) {
      searchBar.css("display", "flex");
      searchBar.find(".ih-search-basket-text").text(`转存篮：${n} 条`);
    } else {
      searchBar.hide();
    }
    _updateSearchLocateBtn();
  }

  function _clearBasket() {
    sharedState.searchBasket = [];
    sharedState._searchLocateIndex = -1;
    _updateBasketBanner();
    if (sharedState.activeTab === "search") renderSearchResults();
    toastr.info("已清空转存篮", "", { timeOut: 800 });
  }
  content.find("#ih_mgr_basket_clear").on("click", _clearBasket);
  content.find("#ih_mgr_search_basket_clear").on("click", _clearBasket);

  function _updateSearchLocateBtn() {
    const n = sharedState.searchBasket.length;
    const idx = sharedState._searchLocateIndex;
    const cur = typeof idx === "number" && idx >= 0 && idx < n ? idx + 1 : 0;
    content.find(".ih-search-locate-count").text(cur + "/" + n);
  }

  function _switchSearchScope(scope) {
    if (sharedState.searchScope === scope) return;
    sharedState.searchScope = scope;
    content
      .find(".ih-mgr-search-scope-btn")
      .removeClass("ih-mgr-search-scope-active");
    content
      .find(`.ih-mgr-search-scope-btn[data-scope="${scope}"]`)
      .addClass("ih-mgr-search-scope-active");
    content.find(".ih-mgr-search-specified").toggle(scope === "specified");
    if (scope === "specified" && !_searchS2Loaded) {
      _loadSearchChatList();
    }
  }

  function _scrollHighlightSearchItem(item) {
    const area = content.find("#ih_mgr_search_results")[0];
    if (!area) return;
    const fileVal = item.file || "";
    let target = null;
    area.querySelectorAll(".ih-search-item").forEach((el) => {
      if (
        parseInt(el.getAttribute("data-floor")) === item.floor &&
        (el.getAttribute("data-file") || "") === fileVal
      ) {
        target = el;
      }
    });
    area
      .querySelectorAll(".ih-search-item.ih-search-locate-hl")
      .forEach((el) => el.classList.remove("ih-search-locate-hl"));
    if (target) {
      target.scrollIntoView({ block: "center", behavior: "smooth" });
      target.classList.add("ih-search-locate-hl");
    } else {
      toastr.info("这条消息在搜索结果里没找到（可能已被删除）", "", {
        timeOut: 1500,
      });
    }
  }

  function _isBasketItemInResults(item) {
    const gid = item.file || "__current__";
    const group = sharedState.searchResults.find(
      (g) => (g.fileName || "__current__") === gid,
    );
    if (!group) return false;
    return group.matches.some((m) => m.floor === item.floor);
  }

  async function _searchLocateNext() {
    const basket = sharedState.searchBasket;
    if (basket.length === 0) {
      toastr.info("转存篮是空的", "", { timeOut: 1000 });
      return;
    }
    let idx = sharedState._searchLocateIndex;
    if (typeof idx !== "number" || idx < 0 || idx >= basket.length) idx = 0;
    else idx = (idx + 1) % basket.length;
    sharedState._searchLocateIndex = idx;
    _updateSearchLocateBtn();
    const item = basket[idx];
    const gid = item.file || "__current__";

    if (!sharedState.searchDone || !_isBasketItemInResults(item)) {
      const kw = String(
        content.find("#ih_mgr_search_input").val() || "",
      ).trim();
      if (!kw) {
        toastr.info("请先在搜索框输入关键词再定位", "", { timeOut: 1800 });
        return;
      }
      _switchSearchScope(item.file ? "all" : "current");
      await runSearch();
    }

    if (sharedState.searchExpanded[gid] === false) {
      sharedState.searchExpanded[gid] = true;
      renderSearchResults();
    }
    setTimeout(() => {
      _scrollHighlightSearchItem(item);
    }, 80);
  }

  content.find("#ih_mgr_search_basket_locate").on("click", function (e) {
    e.stopPropagation();
    _searchLocateNext();
  });

  content.find("#ih_mgr_transfer_basket_locate").on("click", function (e) {
    e.stopPropagation();
    if (sharedState.searchBasket.length === 0) {
      toastr.info("转存篮是空的", "", { timeOut: 1000 });
      return;
    }
    content.find('.ih-mgr-tab[data-tab="search"]').trigger("click");
    setTimeout(() => {
      _searchLocateNext();
    }, 120);
  });

  async function _doBasketCopy() {
    const info = _getTransferChar();
    if (!info || info.group) {
      toastr.warning("当前无法转存", "", { timeOut: 1200 });
      return;
    }
    const targetFile = _getTransferTargetValue();
    if (!targetFile) {
      toastr.warning("请先选择目标聊天档", "", { timeOut: 1200 });
      return;
    }
    if (sharedState.searchBasket.length === 0) {
      toastr.warning("转存篮是空的", "", { timeOut: 1200 });
      return;
    }
    const basket = [...sharedState.searchBasket];
    const bySource = {};
    basket.forEach((b) => {
      bySource[b.file] = null;
    });
    for (const file of Object.keys(bySource)) {
      if (file === "") {
        bySource[file] = chat;
      } else {
        const nameNoExt = String(file).replace(/\.jsonl$/i, "");
        try {
          const r = await _fetchTargetChat(nameNoExt);
          bySource[file] = r.messages;
        } catch (e) {
          console.error("快捷工具栏: 读取来源聊天档失败", e);
          toastr.error(`读取来源「${nameNoExt}」失败，转存已取消`, "", {
            timeOut: 1800,
          });
          return;
        }
      }
    }
    let toTransfer = [];
    try {
      basket.forEach((b) => {
        const arr = bySource[b.file];
        if (arr && arr[b.floor]) {
          toTransfer.push(JSON.parse(JSON.stringify(arr[b.floor])));
        }
      });
    } catch (e) {
      toastr.error("消息数据异常，转存失败", "", { timeOut: 1500 });
      return;
    }
    if (toTransfer.length === 0) {
      toastr.warning("转存篮里的消息在来源中已不存在", "", { timeOut: 1500 });
      return;
    }
    const nameNoExt = String(targetFile).replace(/\.jsonl$/i, "");
    let header = null;
    let targetMsgs = [];
    try {
      const result = await _fetchTargetChat(nameNoExt);
      header = result.header;
      targetMsgs = result.messages;
    } catch (e) {
      console.error("快捷工具栏: 转存前读取目标失败", e);
      toastr.error("读取目标聊天档失败，转存已取消", "", { timeOut: 1800 });
      return;
    }
    if (!header) {
      header = {
        user_name: name1 || "User",
        character_name: info.character.name,
        create_date: new Date().toISOString(),
        chat_metadata: {},
      };
    }
    if (getSettings().confirmDangerousActions) {
      if (
        !confirm(
          `确定将转存篮中的 ${toTransfer.length} 条消息复制至「${nameNoExt}」吗？`,
        )
      )
        return;
    }
    let insertAt =
      sharedState.transferInsertAt == null
        ? targetMsgs.length
        : sharedState.transferInsertAt;
    insertAt = Math.max(0, Math.min(targetMsgs.length, insertAt));
    targetMsgs.splice(insertAt, 0, ...toTransfer);
    const jumpToFloor = insertAt;
    const transferCount = toTransfer.length;
    let saveOk = false;
    try {
      const saveResp = await fetch("/api/chats/save", {
        method: "POST",
        headers: getRequestHeaders(),
        cache: "no-cache",
        body: JSON.stringify({
          ch_name: info.character.name,
          file_name: nameNoExt,
          chat: [header, ...targetMsgs],
          avatar_url: info.avatar,
          force: true,
        }),
      });
      saveOk = saveResp.ok;
    } catch (e) {
      console.error("快捷工具栏: 写入目标聊天档失败", e);
    }
    if (!saveOk) {
      toastr.error("写入目标聊天档失败，转存已取消", "", { timeOut: 1800 });
      return;
    }
    _ihSetSearchCache(targetFile, targetMsgs);
    _pushTransferHistory(targetFile);
    sharedState.searchBasket = [];
    closeDialog();
    toastr.success(
      `已复制 ${transferCount} 条消息到「${nameNoExt}」，正在打开…`,
      "",
      { timeOut: 1500 },
    );
    try {
      if (typeof openCharacterChat === "function") {
        await openCharacterChat(nameNoExt);
      } else {
        info.character.chat = nameNoExt;
        await executeSlashCommandsWithOptions("/chat-reload");
      }
      setTimeout(() => {
        const chatEl = document.getElementById("chat");
        if (!chatEl) return;
        const mesEl = chatEl.querySelector(`.mes[mesid="${jumpToFloor}"]`);
        if (mesEl) {
          const r = mesEl.getBoundingClientRect();
          const useCenter = r.height < chatEl.clientHeight - 40;
          scrollChatToElement(mesEl, "smooth", useCenter);
        } else {
          executeSlashCommandsWithOptions(`/chat-jump ${jumpToFloor}`);
        }
        setTimeout(() => {
          const flashChatEl = document.getElementById("chat");
          if (!flashChatEl) return;
          const flashed = [];
          for (let i = 0; i < transferCount; i++) {
            const el = flashChatEl.querySelector(
              `.mes[mesid="${jumpToFloor + i}"]`,
            );
            if (el) {
              el.classList.add("ih-transfer-landed");
              flashed.push(el);
            }
          }
          setTimeout(() => {
            flashed.forEach((el) => el.classList.remove("ih-transfer-landed"));
          }, 2200);
        }, 400);
      }, 600);
    } catch (e) {
      console.error("快捷工具栏: 打开目标聊天档失败", e);
      toastr.warning("转存成功，但自动打开失败，请手动切换聊天", "", {
        timeOut: 2000,
      });
    }
  }
  async function _doBasketMove() {
    const info = _getTransferChar();
    if (!info || info.group) {
      toastr.warning("当前无法转存", "", { timeOut: 1200 });
      return;
    }
    const targetFile = _getTransferTargetValue();
    if (!targetFile) {
      toastr.warning("请先选择目标聊天档", "", { timeOut: 1200 });
      return;
    }
    if (sharedState.searchBasket.length === 0) {
      toastr.warning("转存篮是空的", "", { timeOut: 1200 });
      return;
    }
    const targetNameNoExt = String(targetFile).replace(/\.jsonl$/i, "");
    const basket = [...sharedState.searchBasket];
    const curChatName = String(info.chatFile || "");
    const targetIsSource = basket.some((b) => {
      if (b.file === "") return curChatName === targetNameNoExt;
      return String(b.file).replace(/\.jsonl$/i, "") === targetNameNoExt;
    });
    if (targetIsSource) {
      toastr.warning(
        "转存篮里有来自目标聊天档自己的消息，无法移动到它自己，请改用复制或去掉这些消息",
        "",
        { timeOut: 3000 },
      );
      return;
    }
    const bySource = {};
    basket.forEach((b) => {
      bySource[b.file] = null;
    });
    for (const file of Object.keys(bySource)) {
      if (file === "") {
        bySource[file] = { header: null, messages: chat };
      } else {
        const nameNoExt = String(file).replace(/\.jsonl$/i, "");
        try {
          const r = await _fetchTargetChat(nameNoExt);
          bySource[file] = { header: r.header, messages: r.messages };
        } catch (e) {
          console.error("快捷工具栏: 读取来源聊天档失败", e);
          toastr.error(`读取来源「${nameNoExt}」失败，移动已取消`, "", {
            timeOut: 1800,
          });
          return;
        }
      }
    }
    let toTransfer = [];
    try {
      basket.forEach((b) => {
        const arr = bySource[b.file].messages;
        if (arr && arr[b.floor]) {
          toTransfer.push(JSON.parse(JSON.stringify(arr[b.floor])));
        }
      });
    } catch (e) {
      toastr.error("消息数据异常，移动失败", "", { timeOut: 1500 });
      return;
    }
    if (toTransfer.length === 0) {
      toastr.warning("转存篮里的消息在来源中已不存在", "", { timeOut: 1500 });
      return;
    }
    let header = null;
    let targetMsgs = [];
    try {
      const result = await _fetchTargetChat(targetNameNoExt);
      header = result.header;
      targetMsgs = result.messages;
    } catch (e) {
      console.error("快捷工具栏: 转存前读取目标失败", e);
      toastr.error("读取目标聊天档失败，移动已取消", "", { timeOut: 1800 });
      return;
    }
    if (!header) {
      header = {
        user_name: name1 || "User",
        character_name: info.character.name,
        create_date: new Date().toISOString(),
        chat_metadata: {},
      };
    }
    if (getSettings().confirmDangerousActions) {
      if (
        !confirm(
          `确定将转存篮中的 ${toTransfer.length} 条消息移动至「${targetNameNoExt}」吗？\n（这些消息会从各自来源聊天档中删除，来自其他聊天档的删除无法撤回）`,
        )
      )
        return;
    }
    let insertAt =
      sharedState.transferInsertAt == null
        ? targetMsgs.length
        : sharedState.transferInsertAt;
    insertAt = Math.max(0, Math.min(targetMsgs.length, insertAt));
    targetMsgs.splice(insertAt, 0, ...toTransfer);
    const jumpToFloor = insertAt;
    const transferCount = toTransfer.length;
    let saveOk = false;
    try {
      const saveResp = await fetch("/api/chats/save", {
        method: "POST",
        headers: getRequestHeaders(),
        cache: "no-cache",
        body: JSON.stringify({
          ch_name: info.character.name,
          file_name: targetNameNoExt,
          chat: [header, ...targetMsgs],
          avatar_url: info.avatar,
          force: true,
        }),
      });
      saveOk = saveResp.ok;
    } catch (e) {
      console.error("快捷工具栏: 写入目标聊天档失败", e);
    }
    if (!saveOk) {
      toastr.error("写入目标聊天档失败，移动已取消", "", { timeOut: 1800 });
      return;
    }
    _ihSetSearchCache(targetFile, targetMsgs);
    const floorsBySource = {};
    basket.forEach((b) => {
      if (!floorsBySource[b.file]) floorsBySource[b.file] = [];
      floorsBySource[b.file].push(b.floor);
    });
    if (Object.prototype.hasOwnProperty.call(floorsBySource, "")) {
      chatUndoManager.save();
    }
    const sourceDeleteFailures = [];
    const currentChatBackup = Object.prototype.hasOwnProperty.call(
      floorsBySource,
      "",
    )
      ? JSON.parse(JSON.stringify(chat))
      : null;
    let currentChatChanged = false;

    for (const file of Object.keys(floorsBySource)) {
      const floors = [...new Set(floorsBySource[file])].sort((a, b) => b - a);

      if (file === "") {
        floors.forEach((f) => {
          if (f >= 0 && f < chat.length) chat.splice(f, 1);
        });
        currentChatChanged = true;
        continue;
      }

      const nameNoExt = String(file).replace(/\.jsonl$/i, "");
      const src = bySource[file];
      const newMsgs = [...src.messages];

      floors.forEach((f) => {
        if (f >= 0 && f < newMsgs.length) newMsgs.splice(f, 1);
      });

      const srcHeader = src.header || {
        user_name: name1 || "User",
        character_name: info.character.name,
        create_date: new Date().toISOString(),
        chat_metadata: {},
      };

      try {
        const resp = await fetch("/api/chats/save", {
          method: "POST",
          headers: getRequestHeaders(),
          cache: "no-cache",
          body: JSON.stringify({
            ch_name: info.character.name,
            file_name: nameNoExt,
            chat: [srcHeader, ...newMsgs],
            avatar_url: info.avatar,
            force: true,
          }),
        });

        if (!resp.ok) {
          throw new Error(`HTTP ${resp.status}`);
        }

        _ihSetSearchCache(file, newMsgs);
      } catch (e) {
        sourceDeleteFailures.push(nameNoExt);
        console.error("快捷工具栏: 从来源档删除失败 " + nameNoExt, e);
      }
    }

    if (currentChatChanged) {
      try {
        await executeSlashCommandsWithOptions("/forcesave");
      } catch (e) {
        console.error("快捷工具栏: 保存当前来源聊天失败", e);

        if (currentChatBackup) {
          chat.length = 0;
          currentChatBackup.forEach((msg) => chat.push(msg));

          try {
            await executeSlashCommandsWithOptions("/forcesave");
          } catch (rollbackError) {
            console.error("快捷工具栏: 恢复当前来源聊天失败", rollbackError);
          }
        }

        sourceDeleteFailures.push("当前聊天档");
      }
    }

    _pushTransferHistory(targetFile);
    sharedState.searchBasket = [];
    closeDialog();
    if (sourceDeleteFailures.length > 0) {
      toastr.warning(
        `目标聊天档已保存 ${transferCount} 条消息，但有 ${sourceDeleteFailures.length} 个来源聊天档删除失败；消息仍保留在原处，请核对后再手动删除，正在打开目标聊天…`,
        "",
        { timeOut: 4500 },
      );
    } else {
      toastr.success(
        `已移动 ${transferCount} 条消息到「${targetNameNoExt}」，正在打开…`,
        "",
        { timeOut: 1500 },
      );
    }
    try {
      if (typeof openCharacterChat === "function") {
        await openCharacterChat(targetNameNoExt);
      } else {
        info.character.chat = targetNameNoExt;
        await executeSlashCommandsWithOptions("/chat-reload");
      }
      setTimeout(() => {
        const chatEl = document.getElementById("chat");
        if (!chatEl) return;
        const mesEl = chatEl.querySelector(`.mes[mesid="${jumpToFloor}"]`);
        if (mesEl) {
          const r = mesEl.getBoundingClientRect();
          const useCenter = r.height < chatEl.clientHeight - 40;
          scrollChatToElement(mesEl, "smooth", useCenter);
        } else {
          executeSlashCommandsWithOptions(`/chat-jump ${jumpToFloor}`);
        }
        setTimeout(() => {
          const flashChatEl = document.getElementById("chat");
          if (!flashChatEl) return;
          const flashed = [];
          for (let i = 0; i < transferCount; i++) {
            const el = flashChatEl.querySelector(
              `.mes[mesid="${jumpToFloor + i}"]`,
            );
            if (el) {
              el.classList.add("ih-transfer-landed");
              flashed.push(el);
            }
          }
          setTimeout(() => {
            flashed.forEach((el) => el.classList.remove("ih-transfer-landed"));
          }, 2200);
        }, 400);
      }, 600);
    } catch (e) {
      console.error("快捷工具栏: 打开目标聊天档失败", e);
      toastr.warning("移动成功，但自动打开失败，请手动切换聊天", "", {
        timeOut: 2000,
      });
    }
  }

  function _searchScanMsg(rawText, kw, caseSensitive) {
    const hay = caseSensitive ? rawText : rawText.toLowerCase();
    const needle = caseSensitive ? kw : kw.toLowerCase();
    const positions = [];
    let pos = 0;
    while ((pos = hay.indexOf(needle, pos)) !== -1) {
      positions.push(pos);
      pos += needle.length || 1;
      if (positions.length >= 50) break;
    }
    return positions;
  }

  function _searchBuildSnippet(rawText, matchIndex, kwLen) {
    const CONTEXT_BUFFER = 120;
    const start = Math.max(0, matchIndex - CONTEXT_BUFFER);
    const end = Math.min(rawText.length, matchIndex + kwLen + CONTEXT_BUFFER);
    const before = rawText.substring(start, matchIndex).replace(/\s+/g, " ");
    const mid = rawText.substring(matchIndex, matchIndex + kwLen);
    const after = rawText
      .substring(matchIndex + kwLen, end)
      .replace(/\s+/g, " ");
    const prefix = start > 0 ? "…" : "";
    const suffix = end < rawText.length ? "…" : "";
    return (
      prefix +
      ihEscapeHtml(before) +
      '<mark class="ih-search-hl">' +
      ihEscapeHtml(mid) +
      "</mark>" +
      ihEscapeHtml(after) +
      suffix
    );
  }

  function _searchInMessages(messages, kw, caseSensitive) {
    const out = [];
    if (!Array.isArray(messages)) return out;
    for (let i = 0; i < messages.length; i++) {
      const m = messages[i];
      if (!m) continue;
      const raw = String(m.mes || "");
      if (!raw) continue;
      const positions = _searchScanMsg(raw, kw, caseSensitive);
      if (positions.length > 0) {
        out.push({
          floor: i,
          sender: m.name || (m.is_user ? "User" : "AI"),
          count: positions.length,
          positions: positions,
          rawText: raw,
          kwLen: kw.length,
          hlIndex: 0,
        });
      }
    }
    return out;
  }

  function renderSearchResults() {
    const area = content.find("#ih_mgr_search_results")[0];
    if (!area) return;
    _updateBasketBanner();
    const statusEl = content.find("#ih_mgr_search_status");
    if (sharedState.searchLoading) {
      statusEl
        .html(
          '<i class="fa-solid fa-spinner fa-spin"></i><span>' +
            ihEscapeHtml(sharedState._searchProgress || "正在搜索…") +
            "</span>",
        )
        .show();
      area.innerHTML = "";
      return;
    }
    if (!sharedState.searchDone) {
      statusEl.hide();
      area.innerHTML =
        '<div class="ih-search-empty">输入关键词后点击搜索</div>';
      return;
    }
    const totalMatches = sharedState.searchResults.reduce(
      (a, g) => a + g.matches.length,
      0,
    );
    if (totalMatches === 0) {
      statusEl
        .html(
          '<i class="fa-solid fa-circle-info"></i><span>没有找到包含「' +
            ihEscapeHtml(sharedState.searchQuery) +
            "」的消息</span>",
        )
        .show();
      area.innerHTML =
        '<div class="ih-search-empty">换个关键词或切换搜索范围试试</div>';
      return;
    }
    statusEl
      .html(
        '<i class="fa-solid fa-circle-check"></i><span>共找到 ' +
          totalMatches +
          " 处匹配（" +
          sharedState.searchResults.length +
          " 个聊天档）</span>",
      )
      .show();
    let html = "";
    sharedState.searchResults.forEach((group) => {
      const gid = group.fileName || "__current__";
      const expanded = sharedState.searchExpanded[gid] !== false;
      const fileAttr = group.fileName ? ihEscapeAttr(group.fileName) : "";
      html +=
        '<div class="ih-search-group" data-gid="' + ihEscapeAttr(gid) + '">';
      html +=
        '<div class="ih-search-group-header" data-gid="' +
        ihEscapeAttr(gid) +
        '">';
      html +=
        '<button class="ih-search-toggle" data-gid="' +
        ihEscapeAttr(gid) +
        '"><i class="fa-solid ' +
        (expanded ? "fa-chevron-down" : "fa-chevron-right") +
        '"></i></button>';
      html +=
        '<span class="ih-search-group-name">' +
        (group.isCurrent
          ? '<i class="fa-solid fa-star" style="opacity:0.55;margin-right:5px;"></i>'
          : "") +
        ihEscapeHtml(group.label) +
        "</span>";
      html +=
        '<span class="ih-search-group-count">' +
        group.matches.length +
        " 处</span>";
      html += "</div>";
      html +=
        '<div class="ih-search-group-body" style="display:' +
        (expanded ? "flex" : "none") +
        ';">';
      group.matches.forEach((mt) => {
        const hlIdx = mt.hlIndex || 0;
        const cnt =
          mt.count > 1
            ? '<span class="ih-search-hit-count">×' + mt.count + "</span>"
            : "";
        const switchBtn =
          mt.count > 1
            ? '<button class="ih-search-switch" data-gid="' +
              ihEscapeAttr(gid) +
              '" data-floor="' +
              mt.floor +
              '" title="切换到下一处匹配">' +
              (hlIdx + 1) +
              "/" +
              mt.count +
              ' <i class="fa-solid fa-arrow-right"></i></button>'
            : "";
        const _bkFile = group.fileName || "";
        const _inBasket = sharedState.searchBasket.some(
          (b) => b.file === _bkFile && b.floor === mt.floor,
        );
        const basketBtn =
          '<button class="ih-search-basket' +
          (_inBasket ? " ih-search-basket-active" : "") +
          '" data-file="' +
          fileAttr +
          '" data-floor="' +
          mt.floor +
          '" data-sender="' +
          ihEscapeAttr(mt.sender) +
          '" title="' +
          (_inBasket ? "从转存篮移除" : "加入转存篮") +
          '"><i class="fa-solid fa-' +
          (_inBasket ? "check" : "right-left") +
          '"></i></button>';
        const snippetHtml = _searchBuildSnippet(
          mt.rawText,
          mt.positions[hlIdx],
          mt.kwLen,
        );
        html +=
          '<div class="ih-search-item" data-floor="' +
          mt.floor +
          '" data-file="' +
          fileAttr +
          '">';
        html +=
          '<div class="ih-search-item-head"><span class="ih-search-item-floor">#' +
          mt.floor +
          '</span><span class="ih-search-item-sender">' +
          ihEscapeHtml(mt.sender) +
          "</span>" +
          cnt +
          '<span class="ih-search-actions">' +
          switchBtn +
          basketBtn +
          '<button class="ih-search-preview" data-gid="' +
          ihEscapeAttr(gid) +
          '" data-floor="' +
          mt.floor +
          '" title="预览完整内容"><i class="fa-solid fa-eye"></i></button>' +
          '<button class="ih-search-jump" data-floor="' +
          mt.floor +
          '" data-file="' +
          fileAttr +
          '" title="跳转到此消息"><i class="fa-solid fa-location-arrow"></i></button>' +
          "</span></div>";
        html += '<div class="ih-search-item-snippet">' + snippetHtml + "</div>";
        html += "</div>";
      });
      html += "</div></div>";
    });
    area.innerHTML = html;
    generateFaIconProtectionCSS();
  }

  async function runSearch() {
    const kw = String(content.find("#ih_mgr_search_input").val() || "").trim();
    if (!kw) {
      toastr.warning("请先输入关键词", "", { timeOut: 1200 });
      return;
    }
    const runId = ++sharedState._searchRunId;
    sharedState.searchEverRun = true;
    sharedState.searchQuery = kw;
    const caseSensitive = sharedState.searchCaseSensitive;
    sharedState.searchResults = [];
    sharedState.searchDone = false;
    sharedState.searchExpanded = {};

    if (sharedState.searchScope === "current") {
      const matches = _searchInMessages(chat, kw, caseSensitive);
      if (matches.length > 0) {
        let curName = "当前聊天档";
        try {
          curName = SillyTavern.getContext().getCurrentChatId() || "当前聊天档";
        } catch (e) {}
        sharedState.searchResults.push({
          fileName: null,
          label: curName,
          isCurrent: true,
          matches,
        });
        sharedState.searchExpanded["__current__"] = true;
      }
      sharedState.searchDone = true;
      renderSearchResults();
      return;
    }

    if (sharedState.searchScope === "specified") {
      const files = sharedState.searchSpecifiedFiles || [];
      if (files.length === 0) {
        toastr.warning("请先选择要搜索的聊天档", "", { timeOut: 1500 });
        return;
      }
      const info2 = _getTransferChar();
      if (!info2 || info2.group) {
        toastr.warning("指定聊天档搜索暂不支持群聊", "", { timeOut: 1800 });
        return;
      }
      sharedState.searchLoading = true;
      renderSearchResults();
      const totalSpec = files.length;
      let doneSpec = 0;
      const specResults = [];
      for (const fileWithExt of files) {
        const nameNoExt2 = String(fileWithExt).replace(/\.jsonl$/i, "");
        doneSpec++;
        let msgs2 = _ihGetSearchCache(fileWithExt);
        if (!msgs2) {
          sharedState._searchProgress =
            "正在读取 " + doneSpec + "/" + totalSpec + "：" + nameNoExt2;
          renderSearchResults();
          try {
            const result = await _fetchTargetChat(nameNoExt2);
            if (runId !== sharedState._searchRunId) return;
            msgs2 = result.messages;
            _ihSetSearchCache(fileWithExt, msgs2);
          } catch (e) {
            if (runId !== sharedState._searchRunId) return;
            console.warn("快捷工具栏: 搜索指定聊天档失败 " + nameNoExt2, e);
            continue;
          }
        }
        if (runId !== sharedState._searchRunId) return;
        const matches2 = _searchInMessages(msgs2, kw, caseSensitive);
        if (matches2.length > 0) {
          specResults.push({
            fileName: fileWithExt,
            label: nameNoExt2,
            isCurrent: false,
            matches: matches2,
          });
          sharedState.searchExpanded[fileWithExt] = files.length === 1;
          _pushTransferHistory(fileWithExt);
        }
      }
      sharedState.searchResults = specResults;
      sharedState.searchLoading = false;
      sharedState.searchDone = true;
      sharedState._searchProgress = "";
      renderSearchResults();
      return;
    }

    const info = _getTransferChar();
    if (!info || info.group) {
      toastr.warning("全部聊天档搜索暂不支持群聊", "", { timeOut: 1800 });
      return;
    }
    sharedState.searchLoading = true;
    sharedState._searchProgress = "正在获取聊天档列表…";
    renderSearchResults();
    let chats = [];
    try {
      const resp = await fetch("/api/characters/chats", {
        method: "POST",
        headers: getRequestHeaders(),
        body: JSON.stringify({ avatar_url: info.avatar }),
      });
      if (resp.ok) {
        const data = await resp.json();
        if (data && typeof data === "object" && !data.error) {
          chats = Object.values(data);
        }
      }
    } catch (e) {
      if (runId !== sharedState._searchRunId) return;
      console.error("快捷工具栏: 获取聊天档列表失败", e);
    }
    if (runId !== sharedState._searchRunId) return;
    const currentChatName = String(info.chatFile || "");
    const fileList = chats.map((c) => c && c.file_name).filter(Boolean);
    const results = [];
    const curMatches = _searchInMessages(chat, kw, caseSensitive);
    if (curMatches.length > 0) {
      results.push({
        fileName: null,
        label: currentChatName || "当前聊天档",
        isCurrent: true,
        matches: curMatches,
      });
      sharedState.searchExpanded["__current__"] = true;
    }
    const total2 = fileList.length;
    let done = 0;
    for (const fn of fileList) {
      const nameNoExt = String(fn).replace(/\.jsonl$/i, "");
      done++;
      if (nameNoExt === currentChatName) continue;
      let msgs = _ihGetSearchCache(fn);
      if (!msgs) {
        sharedState._searchProgress =
          "正在读取 " + done + "/" + total2 + "：" + nameNoExt;
        renderSearchResults();
        try {
          const result = await _fetchTargetChat(nameNoExt);
          if (runId !== sharedState._searchRunId) return;
          msgs = result.messages;
          _ihSetSearchCache(fn, msgs);
        } catch (e) {
          if (runId !== sharedState._searchRunId) return;
          console.warn("快捷工具栏: 搜索聊天档失败 " + nameNoExt, e);
          continue;
        }
      }
      if (runId !== sharedState._searchRunId) return;
      const matches = _searchInMessages(msgs, kw, caseSensitive);
      if (matches.length > 0) {
        results.push({
          fileName: fn,
          label: nameNoExt,
          isCurrent: false,
          matches,
        });
        sharedState.searchExpanded[fn] = false;
      }
    }
    sharedState.searchResults = results;
    sharedState.searchLoading = false;
    sharedState.searchDone = true;
    sharedState._searchProgress = "";
    renderSearchResults();
  }

  content.on("click", ".ih-mgr-search-scope-btn", function () {
    const scope = $(this).data("scope");
    if (scope === sharedState.searchScope) return;
    sharedState._searchRunId++;
    sharedState.searchScope = scope;
    content
      .find(".ih-mgr-search-scope-btn")
      .removeClass("ih-mgr-search-scope-active");
    $(this).addClass("ih-mgr-search-scope-active");
    content.find(".ih-mgr-search-specified").toggle(scope === "specified");
    if (scope === "specified" && !_searchS2Loaded) {
      _loadSearchChatList();
    }
    sharedState.searchDone = false;
    sharedState.searchResults = [];
    sharedState._searchLocateIndex = -1;
    renderSearchResults();
    const kw = String(content.find("#ih_mgr_search_input").val() || "").trim();
    if (kw && sharedState.searchEverRun) {
      if (
        scope === "specified" &&
        (sharedState.searchSpecifiedFiles || []).length === 0
      )
        return;
      runSearch();
    }
  });

  content.find("#ih_mgr_search_case").on("click", function () {
    sharedState.searchCaseSensitive = !sharedState.searchCaseSensitive;
    $(this).toggleClass("ih-mgr-btn-active", sharedState.searchCaseSensitive);
  });

  content.find("#ih_mgr_search_go").on("click", () => runSearch());
  content.find("#ih_mgr_search_input").on("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      runSearch();
    }
  });

  content.find("#ih_mgr_search_input").on("input", function () {
    content
      .find("#ih_mgr_search_clear")
      .toggleClass("ih-visible", !!String($(this).val()).length);
  });
  content.find("#ih_mgr_search_clear").on("click", function () {
    const inp = content.find("#ih_mgr_search_input");
    inp.val("");
    $(this).removeClass("ih-visible");
    inp.focus();
  });
  let _searchAllOptions = [];
  let _searchS2Loaded = false;

  function _renderSearchS2Options(filterText) {
    const listEl = content.find("#ih_mgr_search_options")[0];
    if (!listEl) return;
    const kw = String(filterText || "")
      .trim()
      .toLowerCase();
    const selected = sharedState.searchSpecifiedFiles || [];
    const matched = _searchAllOptions.filter(
      (o) => !kw || o.label.toLowerCase().includes(kw),
    );
    const selectedOpts = matched.filter((o) => selected.includes(o.value));
    const unselectedOpts = matched.filter((o) => !selected.includes(o.value));
    let html = "";
    if (selectedOpts.length > 0) {
      html += `<div class="ih-mgr-select2-group">已选 ${selected.length} 个</div>`;
      selectedOpts.forEach((o) => {
        html += `<div class="ih-mgr-select2-opt ih-mgr-select2-opt-active" data-value="${ihEscapeAttr(o.value)}"><i class="fa-solid fa-check"></i> ${ihEscapeHtml(o.label)}</div>`;
      });
    }
    if (!kw) {
      const history = _getTransferHistory();
      const historyOpts = history
        .map((h) => _searchAllOptions.find((o) => o.value === h))
        .filter(Boolean)
        .filter((o) => !selected.includes(o.value));
      if (historyOpts.length > 0) {
        html += `<div class="ih-mgr-select2-group">最近使用</div>`;
        historyOpts.forEach((o) => {
          html += `<div class="ih-mgr-select2-opt" data-value="${ihEscapeAttr(o.value)}"><i class="fa-solid fa-clock-rotate-left"></i> ${ihEscapeHtml(o.label)}</div>`;
        });
      }
    }
    if (unselectedOpts.length === 0 && selectedOpts.length === 0) {
      html += `<div class="ih-mgr-select2-empty">没有匹配的聊天档</div>`;
    } else if (unselectedOpts.length > 0) {
      html += `<div class="ih-mgr-select2-group">${selectedOpts.length > 0 ? "未选" : "全部聊天档"}</div>`;
      unselectedOpts.forEach((o) => {
        html += `<div class="ih-mgr-select2-opt" data-value="${ihEscapeAttr(o.value)}">${ihEscapeHtml(o.label)}</div>`;
      });
    }
    listEl.innerHTML = html;
  }

  function _openSearchS2Dropdown() {
    content.find("#ih_mgr_search_select2").addClass("ih-mgr-select2-open");
    content.find("#ih_mgr_search_s2_search").val("");
    content.find("#ih_mgr_search_s2_clear").removeClass("ih-visible");
    _renderSearchS2Options("");
    const dd = content.find("#ih_mgr_search_dropdown")[0];
    const select2El = content.find("#ih_mgr_search_select2")[0];
    if (dd && select2El) {
      const panelEl = content[0];
      const panelStyle = window.getComputedStyle(panelEl);
      const panelPadLeft = parseFloat(panelStyle.paddingLeft) || 0;
      const panelPadRight = parseFloat(panelStyle.paddingRight) || 0;
      const panelRect = panelEl.getBoundingClientRect();
      const selRect = select2El.getBoundingClientRect();
      const contentLeft = panelRect.left + panelPadLeft;
      const contentRight = panelRect.right - panelPadRight;
      dd.style.left = contentLeft - selRect.left + "px";
      const width = contentRight - contentLeft;
      if (width > 0) dd.style.width = width + "px";
    }
    if (dd) syncDialogTheme(dd);
    generateFaIconProtectionCSS();
    setTimeout(() => {
      const si = content.find("#ih_mgr_search_s2_search")[0];
      if (si) si.focus();
    }, 30);
  }

  function _closeSearchS2Dropdown() {
    content.find("#ih_mgr_search_select2").removeClass("ih-mgr-select2-open");
  }

  async function _loadSearchChatList() {
    const displayText = content.find(
      "#ih_mgr_search_display .ih-mgr-select2-text",
    );
    const info = _getTransferChar();
    _searchAllOptions = [];
    if (!info) {
      displayText.text("无法获取当前角色");
      return;
    }
    if (info.group) {
      displayText.text("群聊暂不支持");
      return;
    }
    displayText.text("加载中…");
    let chats = [];
    try {
      const resp = await fetch("/api/characters/chats", {
        method: "POST",
        headers: getRequestHeaders(),
        body: JSON.stringify({ avatar_url: info.avatar }),
      });
      if (resp.ok) {
        const data = await resp.json();
        if (data && typeof data === "object" && !data.error) {
          chats = Object.values(data);
        }
      }
    } catch (e) {
      console.error("快捷工具栏: 获取聊天档列表失败", e);
    }
    const currentChat = String(info.chatFile || "");
    chats.forEach((c) => {
      if (!c || !c.file_name) return;
      const nameNoExt = String(c.file_name).replace(/\.jsonl$/i, "");
      if (nameNoExt === currentChat) return;
      const count = c.message_count != null ? `（${c.message_count}条）` : "";
      _searchAllOptions.push({ value: c.file_name, label: nameNoExt + count });
    });
    _searchS2Loaded = true;
    if (_searchAllOptions.length === 0) {
      displayText.text("没有其他聊天档可选");
      return;
    }
    _updateSearchS2DisplayText();
  }

  function _updateSearchS2DisplayText() {
    const n = (sharedState.searchSpecifiedFiles || []).length;
    let text;
    if (n === 0) {
      text = _searchAllOptions.length
        ? "请选择要搜索的聊天档…"
        : "没有其他聊天档可选";
    } else if (n === 1) {
      const opt = _searchAllOptions.find(
        (o) => o.value === sharedState.searchSpecifiedFiles[0],
      );
      text = opt ? opt.label : "已选 1 个";
    } else {
      text = `已选 ${n} 个聊天档`;
    }
    content.find("#ih_mgr_search_display .ih-mgr-select2-text").text(text);
  }

  function _toggleSearchSpecified(fileWithExt) {
    if (!fileWithExt) return;
    const arr = sharedState.searchSpecifiedFiles;
    const idx = arr.indexOf(fileWithExt);
    if (idx > -1) arr.splice(idx, 1);
    else arr.push(fileWithExt);
    _updateSearchS2DisplayText();
    _renderSearchS2Options(content.find("#ih_mgr_search_s2_search").val());
  }

  content.on("click", "#ih_mgr_search_display", function (e) {
    e.stopPropagation();
    const isOpen = content
      .find("#ih_mgr_search_select2")
      .hasClass("ih-mgr-select2-open");
    if (isOpen) {
      _closeSearchS2Dropdown();
    } else {
      if (_searchAllOptions.length === 0) return;
      _openSearchS2Dropdown();
    }
  });
  content.on("input", "#ih_mgr_search_s2_search", function () {
    const v = $(this).val();
    content
      .find("#ih_mgr_search_s2_clear")
      .toggleClass("ih-visible", !!String(v).length);
    _renderSearchS2Options(v);
  });
  content.on("click", "#ih_mgr_search_s2_clear", function (e) {
    e.stopPropagation();
    const si = content.find("#ih_mgr_search_s2_search");
    si.val("");
    content.find("#ih_mgr_search_s2_clear").removeClass("ih-visible");
    _renderSearchS2Options("");
    si.focus();
  });
  content.on(
    "click",
    "#ih_mgr_search_options .ih-mgr-select2-opt",
    function () {
      const val = $(this).attr("data-value");
      if (val) _toggleSearchSpecified(val);
    },
  );
  content.on("click", "#ih_mgr_search_dropdown", function (e) {
    e.stopPropagation();
  });
  content.find("#ih_mgr_search_clear_selected").on("click", function () {
    sharedState.searchSpecifiedFiles = [];
    _updateSearchS2DisplayText();
    if (
      content.find("#ih_mgr_search_select2").hasClass("ih-mgr-select2-open")
    ) {
      _renderSearchS2Options(content.find("#ih_mgr_search_s2_search").val());
    }
  });
  content.on("click", ".ih-search-group-header", function (e) {
    if ($(e.target).closest(".ih-search-toggle").length) return;
    const gid = $(this).data("gid");
    sharedState.searchExpanded[gid] =
      sharedState.searchExpanded[gid] === false ? true : false;
    renderSearchResults();
  });
  content.on("click", ".ih-search-toggle", function (e) {
    e.stopPropagation();
    const gid = $(this).data("gid");
    sharedState.searchExpanded[gid] =
      sharedState.searchExpanded[gid] === false ? true : false;
    renderSearchResults();
  });

  content.on("click", ".ih-search-jump", async function (e) {
    e.stopPropagation();

    const floor = parseInt($(this).attr("data-floor"));
    const fileName = $(this).attr("data-file");
    if (isNaN(floor)) return;
    const nameNoExt = fileName ? String(fileName).replace(/\.jsonl$/i, "") : "";
    closeDialog();
    if (!nameNoExt) {
      const chatEl = document.getElementById("chat");
      if (!chatEl) return;
      const mesEl = chatEl.querySelector(`.mes[mesid="${floor}"]`);
      if (mesEl) {
        const r = mesEl.getBoundingClientRect();
        const useCenter = r.height < chatEl.clientHeight - 40;
        scrollChatToElement(mesEl, "smooth", useCenter);
      } else {
        executeSlashCommandsWithOptions(`/chat-jump ${floor}`);
      }
      toastr.info(`已跳转到楼层 ${floor}`, "", { timeOut: 1000 });
      return;
    }
    const info = _getTransferChar();
    if (!info || info.group) {
      toastr.warning("无法打开该聊天档", "", { timeOut: 1500 });
      return;
    }
    try {
      if (typeof openCharacterChat === "function") {
        await openCharacterChat(nameNoExt);
      } else {
        info.character.chat = nameNoExt;
        await executeSlashCommandsWithOptions("/chat-reload");
      }
      setTimeout(() => {
        const chatEl = document.getElementById("chat");
        if (!chatEl) return;
        const mesEl = chatEl.querySelector(`.mes[mesid="${floor}"]`);
        if (mesEl) {
          const r = mesEl.getBoundingClientRect();
          const useCenter = r.height < chatEl.clientHeight - 40;
          scrollChatToElement(mesEl, "smooth", useCenter);
        } else {
          executeSlashCommandsWithOptions(`/chat-jump ${floor}`);
        }
      }, 600);
    } catch (e2) {
      console.error("快捷工具栏: 打开聊天档跳转失败", e2);
      toastr.warning("打开聊天档失败，请手动切换聊天", "", { timeOut: 2000 });
    }
  });

  content.on("click", ".ih-search-switch", function (e) {
    e.stopPropagation();
    const gid = $(this).attr("data-gid");
    const floor = parseInt($(this).attr("data-floor"));
    const group = sharedState.searchResults.find(
      (g) => (g.fileName || "__current__") === gid,
    );
    if (!group) return;
    const mt = group.matches.find((m) => m.floor === floor);
    if (!mt || !mt.positions || mt.positions.length <= 1) return;
    mt.hlIndex = ((mt.hlIndex || 0) + 1) % mt.positions.length;
    renderSearchResults();
  });

  content.on("click", ".ih-search-preview", function (e) {
    e.stopPropagation();
    const gid = $(this).attr("data-gid");
    const floor = parseInt($(this).attr("data-floor"));
    if (isNaN(floor)) return;
    const group = sharedState.searchResults.find(
      (g) => (g.fileName || "__current__") === gid,
    );
    if (!group) return;
    const mt = group.matches.find((m) => m.floor === floor);
    if (!mt) return;
    openSearchPreviewDialog(mt, group);
  });

  content.on("click", ".ih-search-basket", function (e) {
    e.stopPropagation();
    const file = $(this).attr("data-file") || "";
    const floor = parseInt($(this).attr("data-floor"));
    const sender = $(this).attr("data-sender") || "";
    if (isNaN(floor)) return;
    const idx = sharedState.searchBasket.findIndex(
      (b) => b.file === file && b.floor === floor,
    );
    if (idx > -1) sharedState.searchBasket.splice(idx, 1);
    else sharedState.searchBasket.push({ file, floor, sender });
    sharedState._searchLocateIndex = -1;
    renderSearchResults();
    _updateBasketBanner();
  });

  function _searchBuildFullHtml(rawText, positions, kwLen) {
    let html = "";
    let last = 0;
    for (const p of positions) {
      if (p < last) continue;
      html += ihEscapeHtml(rawText.substring(last, p));
      html +=
        '<mark class="ih-search-hl">' +
        ihEscapeHtml(rawText.substring(p, p + kwLen)) +
        "</mark>";
      last = p + kwLen;
    }
    html += ihEscapeHtml(rawText.substring(last));
    return html;
  }

  function openSearchPreviewDialog(mt, group) {
    const { overlay, escHandler } = createDialogOverlay();
    const fullHtml = _searchBuildFullHtml(mt.rawText, mt.positions, mt.kwLen);
    const srcLabel = group.isCurrent
      ? "当前聊天档"
      : ihEscapeHtml(group.label || "");
    const dlg = $(
      '<div class="ih-search-preview-content">' +
        '<h3><i class="fa-solid fa-eye"></i> 楼层 #' +
        mt.floor +
        ' 完整内容<span class="ih-search-preview-sub">' +
        ihEscapeHtml(mt.sender) +
        " · " +
        srcLabel +
        '</span><span class="ih-search-preview-count" id="ih_search_prev_count">共 ' +
        mt.count +
        " 处</span></h3>" +
        '<div class="ih-search-preview-box"><div class="ih-search-preview-text">' +
        fullHtml +
        "</div></div>" +
        '<div class="ih-search-preview-actions">' +
        '<button class="ih-hm-btn ih-hm-btn-ok" data-act="locate"><i class="fa-solid fa-crosshairs"></i> 定位高亮</button>' +
        '<button class="ih-hm-btn ih-hm-btn-close" data-act="close">关闭</button>' +
        "</div>" +
        "</div>",
    );
    overlay.append(dlg);
    syncDialogTheme(dlg[0]);
    dlg.on("click", (e) => e.stopPropagation());
    generateFaIconProtectionCSS();
    const close = () => {
      document.removeEventListener("keydown", escHandler, true);
      overlay.remove();
    };
    overlay.off("click").on("click", (e) => {
      if (e.target === overlay[0]) close();
    });
    let _locIdx = -1;
    dlg.find('[data-act="locate"]').on("click", function () {
      const box = dlg.find(".ih-search-preview-box")[0];
      const marks = dlg[0].querySelectorAll(".ih-search-hl");
      if (!box || !marks.length) return;
      _locIdx = (_locIdx + 1) % marks.length;
      const target = marks[_locIdx];
      const boxRect = box.getBoundingClientRect();
      const tRect = target.getBoundingClientRect();
      box.scrollTop +=
        tRect.top - boxRect.top - box.clientHeight / 2 + tRect.height / 2;
      marks.forEach((m) => m.classList.remove("ih-search-hl-active"));
      target.classList.add("ih-search-hl-active");
      dlg
        .find("#ih_search_prev_count")
        .text(_locIdx + 1 + "/" + marks.length + " 处");
    });
    dlg.find('[data-act="close"]').on("click", close);
  }
}

function doChatManager() {
  const btn = document.getElementById("option_select_chat");
  if (btn) btn.click();
  else toastr.warning("找不到聊天管理器入口", "", { timeOut: 1200 });
}

function doChatNew() {
  const btn = document.getElementById("option_start_new_chat");
  if (btn) btn.click();
  else toastr.warning("找不到新建聊天入口", "", { timeOut: 1200 });
}

function doChatClose() {
  const btn = document.getElementById("option_close_chat");
  if (btn) btn.click();
  else toastr.warning("找不到关闭聊天入口", "", { timeOut: 1200 });
}

function doResetFloatingBall() {
  const fp = getSettings().floatingPanel;
  if (!fp || !fp.enabled) {
    toastr.warning("悬浮球/悬浮面板还没开启哦", "", { timeOut: 1500 });
    return;
  }
  fp.position = { x: null, y: null };
  saveSettingsDebounced();
  floatingPanelController.refresh();
  toastr.info("悬浮球位置已重置", "", { timeOut: 1000 });
}

async function doChatRename() {
  const ctx = SillyTavern.getContext();
  const currentChatName = ctx.getCurrentChatId();
  if (!currentChatName) {
    toastr.warning("当前没有打开聊天", "", { timeOut: 1200 });
    return;
  }
  const { overlay, escHandler } = createDialogOverlay();
  const safeName = ihEscapeAttr(currentChatName);
  const content = $(`
    <div class="ih-jump-dialog-content">
      <h3><i class="fa-solid fa-pen-to-square"></i> 重命名聊天</h3>
      <div class="ih-jump-body">
        <div class="ih-hm-row">
          <input type="text" id="ih_cr_input" class="ih-hm-input" style="width:100%;" value="${safeName}" />
        </div>
      </div>
      <div class="ih-jump-actions">
        <button class="ih-hm-btn" id="ih_cr_cancel">取消</button>
        <button class="ih-hm-btn ih-hm-btn-ok" id="ih_cr_ok"><i class="fa-solid fa-check"></i> 确定</button>
      </div>
    </div>
  `);
  overlay.append(content);
  syncDialogTheme(content[0]);
  content.on("click", (e) => e.stopPropagation());
  generateFaIconProtectionCSS();
  const closeDialog = () => {
    document.removeEventListener("keydown", escHandler, true);
    overlay.remove();
  };
  overlay.off("click").on("click", (e) => {
    if (e.target === overlay[0]) closeDialog();
  });
  content.find("#ih_cr_cancel").on("click", closeDialog);
  const doRename = async () => {
    const newName = String(content.find("#ih_cr_input").val() || "").trim();
    if (!newName || newName === currentChatName) {
      closeDialog();
      return;
    }
    closeDialog();
    try {
      if (typeof ctx.renameChat === "function") {
        await ctx.renameChat(currentChatName, newName);
        toastr.success("已重命名", "", { timeOut: 1000 });
      } else {
        await executeSlashCommandsWithOptions(`/renamechat ${newName}`);
        toastr.success("已重命名", "", { timeOut: 1000 });
      }
    } catch (e) {
      console.error("重命名失败", e);
      toastr.error("重命名失败：" + (e?.message || e), "", { timeOut: 1500 });
    }
  };
  content.find("#ih_cr_ok").on("click", doRename);
  content.find("#ih_cr_input").on("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      doRename();
    }
  });
  setTimeout(() => {
    const inp = content.find("#ih_cr_input")[0];
    if (inp) {
      inp.focus();
      try {
        inp.select();
      } catch (e) {}
    }
  }, 100);
}

async function doChatDelete() {
  const ctx = SillyTavern.getContext();
  const currentChatName = ctx.getCurrentChatId();
  if (!currentChatName) {
    toastr.warning("当前没有打开聊天", "", { timeOut: 1200 });
    return;
  }
  if (getSettings().confirmDangerousActions) {
    const ok = await new Promise((resolve) => {
      const { overlay, escHandler } = createDialogOverlay();
      const content = $(`
        <div class="ih-jump-dialog-content">
          <h3><i class="fa-solid fa-triangle-exclamation"></i> 删除当前聊天</h3>
          <div style="font-size:12px;line-height:1.7;margin-bottom:14px;">
            确定删除聊天 <b>${ihEscapeHtml(currentChatName)}</b> 吗？<br>
            <span style="color:rgba(255,120,120,0.9);">此操作不可恢复！</span>
          </div>
          <div class="ih-jump-actions">
            <button class="ih-hm-btn" id="ih_cd_cancel">取消</button>
            <button class="ih-hm-btn ih-hm-btn-warn" id="ih_cd_ok"><i class="fa-solid fa-trash"></i> 删除</button>
          </div>
        </div>
      `);
      overlay.append(content);
      syncDialogTheme(content[0]);
      content.on("click", (e) => e.stopPropagation());
      generateFaIconProtectionCSS();
      const close = (val) => {
        document.removeEventListener("keydown", escHandler, true);
        overlay.remove();
        resolve(val);
      };
      overlay.off("click").on("click", (e) => {
        if (e.target === overlay[0]) close(false);
      });
      content.find("#ih_cd_cancel").on("click", () => close(false));
      content.find("#ih_cd_ok").on("click", () => close(true));
    });
    if (!ok) return;
  }
  const snapshot = {
    name: currentChatName,
    messages: JSON.parse(JSON.stringify(chat)),
  };
  const _origToastrWarning = toastr.warning;
  const _origToastrError = toastr.error;
  const _toastFilter = function (orig) {
    return function (msg, title, opts) {
      const text =
        (typeof msg === "string" ? msg : "") +
        (typeof title === "string" ? title : "");
      if (
        /超时|timeout|time\s*out/i.test(text) &&
        /chat|聊天|delete|删除/i.test(text)
      ) {
        return;
      }
      return orig.call(this, msg, title, opts);
    };
  };
  toastr.warning = _toastFilter(_origToastrWarning);
  toastr.error = _toastFilter(_origToastrError);
  const _restoreToastr = () => {
    toastr.warning = _origToastrWarning;
    toastr.error = _origToastrError;
  };

  try {
    await executeSlashCommandsWithOptions("/delchat");
    setTimeout(_restoreToastr, 1500);
    toastr.success(
      `已删除聊天"${snapshot.name}"，点击此处撤回（5 分钟内有效）`,
      "",
      {
        timeOut: 0,
        extendedTimeOut: 0,
        closeButton: true,
        tapToDismiss: false,
        onclick: async () => {
          try {
            chat.length = 0;
            snapshot.messages.forEach((m) => chat.push(m));
            await executeSlashCommandsWithOptions("/forcesave");
            await executeSlashCommandsWithOptions(
              `/renamechat ${snapshot.name}`,
            );
            await executeSlashCommandsWithOptions("/chat-reload");
            toastr.success(`已恢复聊天"${snapshot.name}"`, "", {
              timeOut: 1500,
            });
          } catch (err) {
            console.error("撤回删除聊天失败", err);
            toastr.error("撤回失败：" + (err?.message || err), "", {
              timeOut: 2000,
            });
          }
        },
      },
    );
  } catch (e) {
    _restoreToastr();
    console.error("删除聊天失败", e);
    toastr.error("删除失败", "", { timeOut: 1500 });
  }
}

const floatingPanelController = {
  _panelEl: null,
  _ballEl: null,
  _isDragging: false,
  _expanded: false,
  _imageRefreshTimer: null,
  _dialogObserver: null,
  _dialogDebounceTimer: null,
  _currentDialogHost: null,
  _autoHideVisible: true,
  _lastViewportChangeTime: 0,
  _ahLastToggleTime: 0,
  _lastToggleTime: 0,
  _maxSeenViewportHeight: 0,
  _ahTouchStart: null,
  _ahTouchMove: null,
  _ahTouchEnd: null,
  _ahDocClick: null,
  _ahChatClick: null,
  _ahTextareaFocus: null,

  init() {
    if (this._panelEl || this._ballEl) this.destroy();
    if (!getSettings().enabled) return;
    const fp = getSettings().floatingPanel;
    if (!fp || !fp.enabled) return;
    if (fp.displayMode === "ball") {
      this._createBall();
    }
    this._createPanel();
    this._updateVisibility();
    this._setupAutoHide();
    this._setupDialogDetection();
    this._setupKeyboardAdaptation();
    this._setupWindowResize();
  },

  destroy() {
    this._removeOutsideClose();
    this._removeAutoHide();
    this._removeDialogDetection();
    this._removeKeyboardAdaptation();
    this._removeWindowResize();
    this._lastBallOnlyKey = null;
    this._lastRepositionKey = null;
    if (this._panelEl) {
      this._panelEl.remove();
      this._panelEl = null;
    }
    if (this._ballEl) {
      this._ballEl.remove();
      this._ballEl = null;
    }
    this._expanded = false;
  },

  _createBall() {
    const fp = getSettings().floatingPanel;
    const size = fp.ballSize || 48;
    const isSquare = fp.ballShape === "square";
    const ballRadius = isSquare ? "10px" : "50%";
    let innerHtml;
    let _ballUseCustomClass = false;
    const _hasThemeCSS = _hasUserBallCSS();
    const _userHasBgImage = _hasUserBallBackgroundImage();
    const _shouldUseCssOnly = !!(fp.followTheme && _userHasBgImage);

    if (fp.ballImage && !_shouldUseCssOnly) {
      const imgSizePercent = isSquare ? 100 : 90;
      const safeBallImage = ihEscapeAttr(fp.ballImage);
      innerHtml = `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;overflow:hidden;border-radius:${ballRadius};"><img src="${safeBallImage}" draggable="false" ondragstart="return false;" style="width:${imgSizePercent}%;height:${imgSizePercent}%;object-fit:contain;pointer-events:none;-webkit-user-drag:none;user-drag:none;" /></div>`;
      _ballUseCustomClass = true;
    } else if (_shouldUseCssOnly) {
      innerHtml = `<i class="fa-solid fa-ellipsis" style="font-size:${Math.max(14, size / 3)}px;"></i>`;
      _ballUseCustomClass = false;
    } else if (fp.followTheme && _hasThemeCSS) {
      innerHtml = `<i class="fa-solid fa-ellipsis" style="font-size:${Math.max(14, size / 3)}px;"></i>`;
      _ballUseCustomClass = false;
    } else {
      innerHtml = `<i class="fa-solid fa-ellipsis" style="font-size:${Math.max(14, size / 3)}px;"></i>`;
      _ballUseCustomClass = !fp.followTheme || !_hasThemeCSS;
    }
    const ball = $(
      `<div class="ih-floating-ball" style="width:${size}px;height:${size}px;border-radius:${ballRadius};">${innerHtml}</div>`,
    );
    if (_ballUseCustomClass) {
      ball.addClass("ih-ball-custom");
      if (fp.transparentBall && fp.ballImage) {
        ball.addClass("ih-ball-transparent");
      }
    }
    if (_ballUseCustomClass && fp.ballImage) {
      ball.addClass("ih-ball-image-only");
    }
    $("body").append(ball);
    [
      "click",
      "mousedown",
      "mouseup",
      "pointerdown",
      "pointerup",
      "touchstart",
      "touchend",
    ].forEach((evt) => {
      ball[0].addEventListener(evt, (e) => e.stopPropagation(), false);
    });
    this._ballEl = ball;
    ball[0].addEventListener(
      "dragstart",
      (e) => {
        e.preventDefault();
        return false;
      },
      false,
    );
    ball[0].setAttribute("draggable", "false");
    ball.css({
      "-webkit-user-drag": "none",
      "user-drag": "none",
      "-webkit-user-select": "none",
      "user-select": "none",
      "touch-action": "none",
    });
    const pos = fp.position;
    if (pos.x !== null && pos.y !== null) {
      const _vw = window.innerWidth || 0;
      const _vh = window.innerHeight || 0;
      const _bs = fp.ballSize || 48;
      let _px = pos.x;
      let _py = pos.y;
      if (_vw > 120 && _vh > 120) {
        const _maxX = Math.max(0, _vw - _bs);
        const _maxY = Math.max(0, _vh - _bs);
        if (_px < 0 || _py < 0 || _px > _maxX || _py > _maxY) {
          _px = Math.max(0, Math.min(_maxX, _px));
          _py = Math.max(0, Math.min(_maxY, _py));
          fp.position = { x: Math.round(_px), y: Math.round(_py) };
          saveSettingsDebounced();
        }
      }
      ball.css({ left: _px + "px", top: _py + "px" });
    } else {
      requestAnimationFrame(() => {
        const fallbackX = window.innerWidth - (fp.ballSize || 48) - 16;
        ball.css({ left: fallbackX + "px", top: "200px" });
      });
    }
    this._setupDrag(ball, true, null, () => {
      this.toggleExpand();
    });
    ball.on("click", (e) => {
      if (this._isDragging) return;
      e.stopPropagation();
      this.toggleExpand();
    });
  },

  _isWrapPanelOrientation(orientation) {
    return orientation === "wrap-side" || orientation === "wrap-down";
  },

  _applyWrapPanelGrid(panel, fp) {
    if (!panel || !panel[0]) return;
    const size = fp.buttonSize || 12;
    const gap = Math.max(4, Math.round(size * 0.35));
    const ph = Math.max(4, Math.round(size * 0.5));
    const textMaxWidth = Math.ceil(size * 2.1 + ph * 2 + 4);

    panel[0].style.setProperty("display", "flex", "important");
    panel[0].style.setProperty("flex-direction", "row", "important");
    panel[0].style.setProperty("flex-wrap", "wrap", "important");
    panel[0].style.setProperty("gap", `${gap}px`, "important");
    panel[0].style.setProperty("align-items", "flex-start", "important");
    panel[0].style.setProperty("align-content", "flex-start", "important");
    panel[0].style.removeProperty("grid-template-columns");
    panel[0].style.removeProperty("grid-auto-rows");
    panel[0].style.removeProperty("justify-items");

    panel.find(".ih-fp-btn").each(function () {
      const hasIcon = !!this.querySelector("i, svg");
      const hasText = Array.from(this.childNodes).some(function (n) {
        return n.nodeType === 3 && n.textContent.trim().length > 0;
      });
      const isIconOnly = hasIcon && !hasText;

      this.style.setProperty("width", "auto", "important");
      this.style.setProperty("height", "auto", "important");
      this.style.removeProperty("min-width");
      this.style.setProperty("box-sizing", "border-box", "important");
      this.style.setProperty("justify-content", "center", "important");
      this.style.setProperty("align-items", "center", "important");
      this.style.setProperty("border-radius", "8px", "important");

      if (isIconOnly) {
        this.style.removeProperty("max-width");
        this.style.setProperty("white-space", "nowrap", "important");
        this.style.setProperty("overflow", "visible", "important");
        this.style.removeProperty("overflow-wrap");
        this.style.removeProperty("word-break");
        this.style.removeProperty("text-overflow");
        this.style.removeProperty("line-height");
        this.style.removeProperty("text-align");
      } else {
        const btnText = (this.textContent || "").trim();
        const isCjkText = /[\u3400-\u9FFF\u3040-\u30FF\uAC00-\uD7AF]/.test(
          btnText,
        );
        const maxWidthForThisBtn = isCjkText
          ? Math.ceil(size * 2.1 + ph * 2)
          : textMaxWidth;

        this.style.setProperty(
          "max-width",
          `${maxWidthForThisBtn}px`,
          "important",
        );
        this.style.setProperty("white-space", "normal", "important");
        this.style.setProperty("overflow", "hidden", "important");
        this.style.setProperty("overflow-wrap", "anywhere", "important");
        this.style.setProperty("word-break", "break-word", "important");
        this.style.setProperty("text-overflow", "clip", "important");
        this.style.setProperty("line-height", "1.25", "important");
        this.style.setProperty("text-align", "center", "important");
      }
    });
  },

  _createPanel() {
    const fp = getSettings().floatingPanel;
    const isWrapPanel = this._isWrapPanelOrientation(fp.orientation);
    const panelLayoutClass =
      fp.orientation === "horizontal" || isWrapPanel
        ? "ih-fp-horizontal"
        : "ih-fp-vertical";
    const panel = $(
      `<div class="ih-floating-panel ${panelLayoutClass}"></div>`,
    );
    if (isWrapPanel) {
      this._applyWrapPanelGrid(panel, fp);
      panel[0].style.setProperty("overflow-x", "hidden", "important");
      panel[0].style.setProperty("overflow-y", "auto", "important");
    } else if (fp.orientation === "horizontal") {
      panel[0].style.setProperty("flex-direction", "row", "important");
      panel[0].style.setProperty("flex-wrap", "nowrap", "important");
      panel[0].style.setProperty("align-items", "center", "important");
      panel[0].style.setProperty("overflow-x", "auto", "important");
      panel[0].style.setProperty("overflow-y", "hidden", "important");
    } else {
      panel[0].style.setProperty("flex-direction", "column", "important");
      panel[0].style.setProperty("flex-wrap", "nowrap", "important");
      panel[0].style.setProperty("align-items", "stretch", "important");
      panel[0].style.setProperty("overflow-y", "auto", "important");
      panel[0].style.setProperty("overflow-x", "hidden", "important");
    }
    panel[0].style.setProperty(
      "-webkit-overflow-scrolling",
      "touch",
      "important",
    );
    panel[0].style.setProperty(
      "transition",
      "top 0.1s ease-out, left 0.1s ease-out, max-height 0.1s ease-out",
      "important",
    );
    const buttons = fp.buttons || [];
    if (buttons.length === 0) {
      panel.append(
        `<div style="padding:8px;font-size:11px;opacity:0.5;white-space:nowrap;">请在设置中添加按钮</div>`,
      );
    }
    buttons.forEach((bKey) => {
      if (bKey.startsWith("folder_")) {
        const fi = parseInt(bKey.replace("folder_", ""));
        const folder = (getSettings().folders || [])[fi];
        if (!folder) return;
        let iconHtml;
        if (folder.icon)
          iconHtml = `<i class="${ihEscapeAttr(folder.icon)}"></i>`;
        else if (folder.display) iconHtml = ihEscapeHtml(folder.display);
        else iconHtml = `<i class="fa-solid fa-folder"></i>`;
        const folderLabel = folder.name || "文件夹";
        const btn = $(
          `<button class="input-helper-btn ih-fp-btn ih-folder-btn" data-button-key="${ihEscapeAttr(bKey)}" data-folder-index="${fi}" title="${ihEscapeAttr(folderLabel)}">${iconHtml}</button>`,
        );
        btn.on("click", function (e) {
          e.preventDefault();
          e.stopPropagation();
          const existing = $(
            `.ih-folder-dropdown-portal[data-folder-index="${fi}"]`,
          );
          if (existing.length) closeAllFolderDropdowns();
          else openFolderDropdown($(this), fi, true);
        });
        this._applyButtonSize(btn[0], fp.buttonSize || 12);
        panel.append(btn);
        return;
      }
      const displayHtml = getButtonDisplayHtml(bKey);
      const label = getButtonLabel(bKey);
      const btn = $(
        `<button class="input-helper-btn ih-fp-btn" data-button-key="${ihEscapeAttr(bKey)}" title="${ihEscapeAttr(label)}">${displayHtml}</button>`,
      );
      bindButtonAction(btn, bKey);
      this._applyButtonSize(btn[0], fp.buttonSize || 12);
      panel.append(btn);
    });
    if (isWrapPanel) {
      this._applyWrapPanelGrid(panel, fp);
    }
    if (fp.displayMode === "fixed") {
      const handle = $(
        `<div class="ih-fp-handle" title="拖拽移动"><i class="fa-solid fa-grip-vertical"></i></div>`,
      );
      panel.prepend(handle);
      this._setupDrag(panel, false, handle);
      const pos = fp.position;
      if (pos.x !== null && pos.y !== null) {
        panel.css({ left: pos.x + "px", top: pos.y + "px" });
      } else {
        panel.css({ right: "16px", top: "200px" });
      }
    }
    $("body").append(panel);
    if (fp.panelWidth && fp.panelWidth > 0) {
      panel.css("width", fp.panelWidth + "px");
    }
    if (fp.displayMode === "fixed") {
      requestAnimationFrame(() => {
        if (panel && panel[0]) {
          const _initVh =
            (window.visualViewport && window.visualViewport.height) ||
            window.innerHeight;
          const _initTop = panel[0].getBoundingClientRect().top;
          panel.css(
            "max-height",
            this._clampMaxH(_initVh - _initTop - 10) + "px",
          );
        }
      });
    }
    [
      "click",
      "mousedown",
      "mouseup",
      "pointerdown",
      "pointerup",
      "touchstart",
      "touchend",
    ].forEach((evt) => {
      panel[0].addEventListener(evt, (e) => e.stopPropagation(), false);
    });
    panel[0].addEventListener("mousedown", (e) => e.preventDefault(), false);
    this._panelEl = panel;
    if (fp.displayMode === "ball") {
      panel.hide();
    }
    syncDialogTheme(panel[0]);
    syncToolbarButtonStyles(panel);
    panel
      .find("[data-button-key='pagingMode']")
      .toggleClass("input-helper-btn-active", pagingController.active);
    panel
      .find("[data-button-key='autoScroll']")
      .toggleClass("input-helper-btn-active", autoScrollController.active);
    panel
      .find("[data-button-key='findReplace']")
      .toggleClass("input-helper-btn-active", findReplaceController.active);
    sendStopController._update();
    historyManager.updateButtons();
    generateFaIconProtectionCSS();
  },

  _setupDrag(el, isBall, handle, onTap) {
    const dragTarget = handle || el;
    let startX, startY, origX, origY, moved;
    const onStart = (e) => {
      if (e.type === "mousedown" && e.button !== 0) return;
      e.preventDefault();
      el.addClass("ih-dragging");
      void el[0].offsetHeight;
      const _origTransition = el[0].style.transition;
      el[0].style.setProperty("transition", "none", "important");
      el.data("ih-orig-transition", _origTransition);
      const ev = e.touches ? e.touches[0] : e;
      const parsedLeft = parseFloat(el[0].style.left);
      const parsedTop = parseFloat(el[0].style.top);
      if (!isNaN(parsedLeft) && !isNaN(parsedTop)) {
        origX = parsedLeft;
        origY = parsedTop;
      } else {
        const rect = el[0].getBoundingClientRect();
        origX = rect.left;
        origY = rect.top;
      }
      startX = ev.clientX;
      startY = ev.clientY;
      moved = false;
      this._isDragging = false;
      const onMove = (e2) => {
        const ev2 = e2.touches ? e2.touches[0] : e2;
        const dx = ev2.clientX - startX;
        const dy = ev2.clientY - startY;
        const threshold = e2.touches ? 16 : 5;
        if (!moved && Math.abs(dx) < threshold && Math.abs(dy) < threshold)
          return;
        if (!moved) {
          moved = true;
          this._isDragging = true;
          if (isBall && this._expanded) {
            if (
              this._lastViewportChangeTime &&
              Date.now() - this._lastViewportChangeTime < 600
            ) {
              return;
            }
            this._expanded = false;
            if (this._panelEl) this._panelEl.stop(true).hide();
            if (this._ballEl) this._ballEl.removeClass("ih-ball-expanded");
            this._updateBallImage();
            this._removeOutsideClose();
            closeAllFolderDropdowns();
          }
        }
        e2.preventDefault();
        let newX = origX + dx;
        let newY = origY + dy;
        const vw =
          (window.visualViewport && window.visualViewport.width) ||
          window.innerWidth;
        const vh =
          (window.visualViewport && window.visualViewport.height) ||
          window.innerHeight;
        newX = Math.max(0, Math.min(vw - el[0].offsetWidth, newX));
        newY = Math.max(0, Math.min(vh - el[0].offsetHeight, newY));
        el.css({
          left: newX + "px",
          top: newY + "px",
          right: "auto",
          bottom: "auto",
        });
      };
      const onEnd = (endEvent) => {
        document.removeEventListener("mousemove", onMove, true);
        document.removeEventListener("mouseup", onEnd, true);
        document.removeEventListener("touchmove", onMove, true);
        document.removeEventListener("touchend", onEnd, true);
        document.removeEventListener("touchcancel", onEnd, true);
        el.removeClass("ih-dragging");
        const _orig = el.data("ih-orig-transition") || "";
        if (_orig) {
          el[0].style.setProperty("transition", _orig, "important");
        } else {
          el[0].style.removeProperty("transition");
          if (el.hasClass("ih-floating-panel")) {
            el[0].style.setProperty(
              "transition",
              "top 0.1s ease-out, left 0.1s ease-out, max-height 0.1s ease-out",
              "important",
            );
          }
        }
        el.removeData("ih-orig-transition");
        if (moved) {
          const rect2 = el[0].getBoundingClientRect();
          const fp = getSettings().floatingPanel;
          fp.position = {
            x: Math.round(rect2.left),
            y: Math.round(rect2.top),
          };
          saveSettingsDebounced();
          setTimeout(() => {
            this._isDragging = false;
          }, 50);
        } else {
          this._isDragging = false;
          if (
            typeof onTap === "function" &&
            endEvent &&
            endEvent.type === "touchend"
          ) {
            onTap();
          }
        }
      };
      document.addEventListener("mousemove", onMove, true);
      document.addEventListener("mouseup", onEnd, true);
      document.addEventListener("touchmove", onMove, {
        passive: false,
        capture: true,
      });
      document.addEventListener("touchend", onEnd, true);
      document.addEventListener("touchcancel", onEnd, true);
    };
    dragTarget.on("mousedown", onStart);
    dragTarget.on("touchstart", onStart);
  },

  toggleExpand() {
    const now = Date.now();
    if (now - (this._lastToggleTime || 0) < 400) {
      return;
    }
    this._lastToggleTime = now;
    this._expanded = !this._expanded;
    if (!this._panelEl || !this._ballEl) return;
    if (this._expanded) {
      if (getSettings().floatingPanel.autoHide) {
        this._autoHideVisible = true;
        if (this._ballEl) {
          this._ballEl.stop(true).css({
            visibility: "",
            "pointer-events": "",
            opacity: "0.85",
          });
        }
      }
      const panelDisplay = "flex";
      this._panelEl.css({
        visibility: "hidden",
        display: panelDisplay,
        "max-height": "",
      });
      const panelWidth = this._panelEl.outerWidth();
      const panelHeight = this._panelEl.outerHeight();
      this._panelEl.css({ display: "none", visibility: "" });
      const ballRect = this._ballEl[0].getBoundingClientRect();
      const fp = getSettings().floatingPanel;

      let minTop = 4;
      const topBarEl =
        document.getElementById("top-bar") ||
        document.getElementById("top-settings-holder");
      if (topBarEl) {
        const rect = topBarEl.getBoundingClientRect();
        if (rect.bottom > 0) {
          minTop = rect.bottom + 10;
        }
      }

      const vv = window.visualViewport;
      const viewportTop = vv ? vv.offsetTop : 0;
      const viewportBottom = vv ? vv.offsetTop + vv.height : window.innerHeight;
      const effectiveMinTop = Math.max(minTop, viewportTop + 4);
      const effectiveMaxBottom = viewportBottom - 4;
      const availableHeight = effectiveMaxBottom - effectiveMinTop;

      let panelLeft, panelTop;
      const spaceLeftBall = ballRect.left - 8;
      const spaceRightBall = window.innerWidth - ballRect.right - 8;
      const canFitLeft = spaceLeftBall >= panelWidth + 4;
      const canFitRight = spaceRightBall >= panelWidth + 4;
      const preferSidePanel =
        fp.orientation === "vertical" || fp.orientation === "wrap-side";
      if (preferSidePanel && (canFitLeft || canFitRight)) {
        panelLeft = canFitLeft
          ? ballRect.left - panelWidth - 8
          : ballRect.right + 8;
        panelTop = ballRect.top;
        if (panelTop + panelHeight > effectiveMaxBottom) {
          panelTop = ballRect.bottom - panelHeight;
        }
      } else {
        panelLeft = ballRect.left + ballRect.width / 2 - panelWidth / 2;
        const spaceBelow = effectiveMaxBottom - ballRect.bottom - 8;
        const spaceAbove = ballRect.top - effectiveMinTop - 8;
        if (spaceBelow >= panelHeight || spaceBelow >= spaceAbove) {
          panelTop = ballRect.bottom + 8;
        } else {
          panelTop = ballRect.top - panelHeight - 8;
        }
      }

      panelLeft = Math.max(
        4,
        Math.min(window.innerWidth - panelWidth - 4, panelLeft),
      );

      if (panelHeight >= availableHeight) {
        panelTop = effectiveMinTop;
        this._panelEl.css(
          "max-height",
          this._clampMaxH(availableHeight) + "px",
        );
      } else {
        panelTop = Math.max(
          effectiveMinTop,
          Math.min(effectiveMaxBottom - panelHeight, panelTop),
        );
      }

      const panelR = panelLeft + panelWidth;
      const panelB = panelTop + Math.min(panelHeight, availableHeight);
      const overlapsBall = !(
        panelR <= ballRect.left - 2 ||
        panelLeft >= ballRect.right + 2 ||
        panelB <= ballRect.top - 2 ||
        panelTop >= ballRect.bottom + 2
      );
      if (overlapsBall) {
        const spaceBelowBall = effectiveMaxBottom - ballRect.bottom - 8;
        const spaceAboveBall = ballRect.top - effectiveMinTop - 8;
        panelLeft = Math.max(
          4,
          Math.min(
            window.innerWidth - panelWidth - 4,
            ballRect.left + ballRect.width / 2 - panelWidth / 2,
          ),
        );
        if (spaceBelowBall >= spaceAboveBall && spaceBelowBall > 60) {
          panelTop = ballRect.bottom + 8;
          if (panelHeight > spaceBelowBall) {
            this._panelEl.css(
              "max-height",
              this._clampMaxH(spaceBelowBall) + "px",
            );
          }
        } else if (spaceAboveBall > 60) {
          if (panelHeight > spaceAboveBall) {
            this._panelEl.css(
              "max-height",
              this._clampMaxH(spaceAboveBall) + "px",
            );
            panelTop = effectiveMinTop;
          } else {
            panelTop = ballRect.top - panelHeight - 8;
          }
        } else {
          panelTop = ballRect.bottom + 8;
          const remaining = effectiveMaxBottom - panelTop;
          if (remaining > 0 && panelHeight > remaining) {
            this._panelEl.css("max-height", this._clampMaxH(remaining) + "px");
          }
        }
      }

      this._panelEl[0].style.setProperty("transition", "none", "important");
      this._panelEl.css({
        left: panelLeft + "px",
        top: panelTop + "px",
        right: "auto",
      });
      if (
        !this._panelEl[0].style.maxHeight ||
        this._panelEl[0].style.maxHeight === ""
      ) {
        this._panelEl.css(
          "max-height",
          this._clampMaxH(availableHeight) + "px",
        );
      }
      this._panelEl.stop(true).fadeIn(60, () => {
        if (this._panelEl && this._panelEl[0]) {
          this._panelEl.css("display", panelDisplay);
        }
      });
      const _selfPanel = this._panelEl[0];
      setTimeout(() => {
        _selfPanel.style.setProperty(
          "transition",
          "top 0.1s ease-out, left 0.1s ease-out, max-height 0.1s ease-out",
          "important",
        );
      }, 80);
      if (this._ballEl) this._ballEl.addClass("ih-ball-expanded");
      this._panelEl
        .find(".ih-fp-btn")
        .toggleClass("input-helper-btn-active", false);
      this._panelEl
        .find("[data-button-key='pagingMode']")
        .toggleClass("input-helper-btn-active", pagingController.active);
      this._panelEl
        .find("[data-button-key='autoScroll']")
        .toggleClass("input-helper-btn-active", autoScrollController.active);
    } else {
      this._panelEl.stop(true).fadeOut(50);
      this._removeOutsideClose();
      if (this._ballEl) this._ballEl.removeClass("ih-ball-expanded");
      closeAllFolderDropdowns();
    }
    this._updateBallImage();
  },
  _clampMaxH(h) {
    const userH = getSettings().floatingPanel.panelMaxHeight;
    const clamped = Math.max(60, h);
    return userH && userH > 0 ? Math.min(clamped, userH) : clamped;
  },
  _applyButtonSize(el, size) {
    el.style.setProperty("flex-shrink", "0", "important");

    const pv = Math.max(2, Math.round(size * 0.25));
    let ph = Math.max(4, Math.round(size * 0.5));
    const text = (el.textContent || "").trim();
    const shouldNarrowTextButton = new Set(["「」", "『』", "《》"]).has(text);
    if (shouldNarrowTextButton) {
      ph = Math.max(2, Math.round(size * 0.17));
    }

    el.style.setProperty("font-size", `${size}px`, "important");
    var _hasIcon = el.querySelector("i, svg");
    var _hasText = Array.from(el.childNodes).some(function (n) {
      return n.nodeType === 3 && n.textContent.trim().length > 0;
    });
    var _isIconOnly = _hasIcon && !_hasText;
    if (_isIconOnly) {
      var pvIcon = Math.max(3, Math.round(size * 0.38));
      var phIcon = Math.max(6, Math.round(size * 0.65));
      el.style.setProperty("padding", `${pvIcon}px ${phIcon}px`, "important");
      el.style.setProperty("white-space", "nowrap", "important");
      el.style.removeProperty("min-width");
      el.style.removeProperty("max-width");
      el.style.removeProperty("overflow-wrap");
      el.style.removeProperty("word-break");
      el.style.removeProperty("line-height");
      el.style.removeProperty("text-align");
    } else {
      const maxTextWidth = Math.ceil(size * 3.2 + ph * 2 + 4);
      const isCjkText = /[\u3400-\u9FFF\u3040-\u30FF\uAC00-\uD7AF]/.test(text);
      const maxWidthForThisBtn = isCjkText
        ? Math.ceil(size * 2.1 + ph * 2)
        : maxTextWidth;

      el.style.setProperty("box-sizing", "border-box", "important");
      el.style.setProperty("padding", `${pv}px ${ph}px`, "important");
      el.style.setProperty("white-space", "normal", "important");
      el.style.setProperty("overflow-wrap", "anywhere", "important");
      el.style.setProperty("word-break", "break-word", "important");
      el.style.removeProperty("min-width");
      el.style.setProperty("max-width", `${maxWidthForThisBtn}px`, "important");
      el.style.setProperty("line-height", "1.25", "important");
      el.style.setProperty("text-align", "center", "important");
    }
    el.querySelectorAll("i").forEach(function (icon) {
      icon.style.setProperty("font-size", size + "px", "important");
    });
  },
  _updateBallImage() {
    if (!this._ballEl) return;
    const fp = getSettings().floatingPanel;

    if (fp.followTheme && _hasUserBallBackgroundImage()) {
      return;
    }

    if (!fp.ballImage) return;
    const img = this._ballEl.find("img");
    if (!img.length) return;
    const expandedImg = fp.ballImageExpanded && fp.ballImageExpanded.trim();
    if (expandedImg) {
      img.attr(
        "src",
        ihEscapeAttr(this._expanded ? expandedImg : fp.ballImage),
      );
    } else {
      img.attr("src", fp.ballImage);
    }
  },

  _outsideCloseHandler: null,

  _setupOutsideClose() {
    this._removeOutsideClose();
    const self = this;
    setTimeout(() => {
      if (!self._expanded) return;
      self._outsideCloseHandler = function (e) {
        if (!self._expanded) return;
        if (
          self._panelEl &&
          self._panelEl[0] &&
          self._panelEl[0].contains(e.target)
        )
          return;
        if (
          self._ballEl &&
          self._ballEl[0] &&
          self._ballEl[0].contains(e.target)
        )
          return;
        if (isEditableElement(e.target)) return;
        if (
          self._lastViewportChangeTime &&
          Date.now() - self._lastViewportChangeTime < 600
        )
          return;
        const _delBtn = document.getElementById("dialogue_del_mes_cancel");
        if (_delBtn && $(_delBtn).is(":visible")) return;
        if ($(e.target).closest(".mes, #chat").length) {
          const _delBtn2 = document.getElementById("dialogue_del_mes_cancel");
          if (_delBtn2 && $(_delBtn2).is(":visible")) return;
        }
        if (
          $(e.target).closest(
            "dialog[open], .drawer-content, .inline-drawer-content, " +
              "#extensions_settings, #extensions_settings2, " +
              "#top-settings-holder, #WorldInfo, .world_entry, " +
              ".popup, #shadow_popup, .mes_edit_buttons, " +
              "#input_helper_toolbar, .ih-find-bar, " +
              ".ih-folder-dropdown-portal, .ih-dialog-overlay, " +
              ".input-helper-settings, .range-block, " +
              ".ih-color-picker-portal",
          ).length
        )
          return;
        self.toggleExpand();
      };
      document.addEventListener("click", self._outsideCloseHandler, true);
      document.addEventListener("touchend", self._outsideCloseHandler, true);
    }, 250);
  },

  _removeOutsideClose() {
    if (this._outsideCloseHandler) {
      document.removeEventListener("click", this._outsideCloseHandler, true);
      document.removeEventListener("touchend", this._outsideCloseHandler, true);
      this._outsideCloseHandler = null;
    }
  },

  _updateVisibility() {
    const fp = getSettings().floatingPanel;
    if (!fp.enabled) {
      this.destroy();
      return;
    }
  },

  _setupAutoHide() {
    const fp = getSettings().floatingPanel;
    if (!fp.autoHide) {
      this._autoHideVisible = true;
      return;
    }
    this._autoHideVisible = false;
    this._applyAutoHideState();
    const chatEl = document.getElementById("chat");
    if (!chatEl) return;
    let touchStartY = 0;
    let touchMoved = false;
    let ahTouchHandled = false;
    const self = this;
    this._ahTouchStart = function (e) {
      touchStartY = e.touches[0].clientY;
      touchMoved = false;
    };
    this._ahTouchMove = function () {
      touchMoved = true;
    };
    this._ahTouchEnd = function (e) {
      if (touchMoved) return;
      if (pagingController.active) return;
      if (ihShouldIgnoreTapTarget(e.target)) return;
      if (Date.now() - (self._ahLastToggleTime || 0) < 350) return;
      ahTouchHandled = true;
      setTimeout(() => {
        ahTouchHandled = false;
      }, 350);
      self._ahLastToggleTime = Date.now();
      if (self._autoHideVisible) {
        self._hideAutoHide();
      } else {
        self._showAutoHide();
      }
    };
    this._ahChatClick = function (e) {
      if (Date.now() - (self._ahLastToggleTime || 0) < 350) return;
      if (ahTouchHandled) return;
      if (pagingController.active) return;
      if (ihShouldIgnoreTapTarget(e.target)) return;
      if (floatingPanelController._expanded) return;
      self._ahLastToggleTime = Date.now();
      if (self._autoHideVisible) {
        self._hideAutoHide();
      } else {
        self._showAutoHide();
      }
    };
    this._ahDocClick = function (e) {
      if (Date.now() - (self._ahLastToggleTime || 0) < 350) return;
      const $target = $(e.target);
      if (
        $target.closest(
          ".ih-floating-ball, .ih-floating-panel, #chat, #send_form, #form_sheld, " +
            "dialog[open], .popup, #shadow_popup, " +
            ".ih-folder-dropdown-portal, .ih-dialog-overlay, " +
            ".input-helper-settings, #extensions_settings, #extensions_settings2, " +
            ".ih-find-bar",
        ).length
      )
        return;
      if (
        $target.is(
          "a, button, input, textarea, select, label, video, audio, iframe",
        ) ||
        $target.is(
          "[onclick], [contenteditable], [role='button'], [tabindex]:not([tabindex='-1'])",
        )
      ) {
        return;
      }
      if (floatingPanelController._expanded) return;
      self._ahLastToggleTime = Date.now();
      if (self._autoHideVisible) {
        self._hideAutoHide();
      } else {
        self._showAutoHide();
      }
    };
    chatEl.addEventListener("touchstart", this._ahTouchStart, {
      passive: true,
    });
    chatEl.addEventListener("touchmove", this._ahTouchMove, {
      passive: true,
    });
    chatEl.addEventListener("touchend", this._ahTouchEnd, {
      passive: true,
    });
    chatEl.addEventListener("click", this._ahChatClick);
    document.addEventListener("click", this._ahDocClick, true);
    const sendTextarea = document.getElementById("send_textarea");
    if (sendTextarea) {
      this._ahTextareaFocus = function () {
        if (!self._autoHideVisible) {
          self._showAutoHide();
        }
      };
      sendTextarea.addEventListener("focus", this._ahTextareaFocus);
      sendTextarea.addEventListener("click", this._ahTextareaFocus);
    }
  },

  _removeAutoHide() {
    const chatEl = document.getElementById("chat");
    if (chatEl) {
      if (this._ahTouchStart)
        chatEl.removeEventListener("touchstart", this._ahTouchStart);
      if (this._ahTouchMove)
        chatEl.removeEventListener("touchmove", this._ahTouchMove);
      if (this._ahTouchEnd)
        chatEl.removeEventListener("touchend", this._ahTouchEnd);
      if (this._ahChatClick)
        chatEl.removeEventListener("click", this._ahChatClick);
    }
    if (this._ahDocClick)
      document.removeEventListener("click", this._ahDocClick, true);
    const sendTextarea = document.getElementById("send_textarea");
    if (sendTextarea) {
      if (this._ahTextareaFocus) {
        sendTextarea.removeEventListener("focus", this._ahTextareaFocus);
        sendTextarea.removeEventListener("click", this._ahTextareaFocus);
      }
    }
    this._ahTextareaFocus = null;
    this._ahTouchStart = null;
    this._ahTouchMove = null;
    this._ahTouchEnd = null;
    this._ahChatClick = null;
    this._ahDocClick = null;
    this._autoHideVisible = true;
  },

  _showAutoHide() {
    const wasVisible = this._autoHideVisible;
    this._autoHideVisible = true;
    const target = this._ballEl || this._panelEl;
    if (target) {
      target.stop(true).css({ visibility: "", "pointer-events": "" });
      if (wasVisible) {
        target.css("opacity", "0.85");
      } else {
        target.animate({ opacity: 0.85 }, 200);
      }
    }
    if (this._panelEl) {
      this._panelEl
        .find("[data-button-key='pagingMode']")
        .toggleClass("input-helper-btn-active", pagingController.active);
      this._panelEl
        .find("[data-button-key='autoScroll']")
        .toggleClass("input-helper-btn-active", autoScrollController.active);
      this._panelEl
        .find("[data-button-key='findReplace']")
        .toggleClass("input-helper-btn-active", findReplaceController.active);
      historyManager.updateButtons();
    }
  },

  _hideAutoHide() {
    if (!this._autoHideVisible) return;
    this._autoHideVisible = false;
    if (this._expanded) {
      this._expanded = false;
      if (this._panelEl) this._panelEl.stop(true).hide();
      if (this._ballEl) this._ballEl.removeClass("ih-ball-expanded");
      this._updateBallImage();
      this._removeOutsideClose();
      closeAllFolderDropdowns();
    }
    const target = this._ballEl || this._panelEl;
    const self = this;
    if (target) {
      target.stop(true).animate({ opacity: 0 }, 150, function () {
        if (self._autoHideVisible) return;
        $(this).css({
          visibility: "hidden",
          "pointer-events": "none",
        });
      });
    }
  },
  _vvResizeHandler: null,
  _savedTopBeforeKeyboard: null,

  _setupKeyboardAdaptation() {
    if (!window.visualViewport) return;
    const self = this;
    let debounceTimer = null;
    let lastAdjustTime = 0;
    this._maxSeenViewportHeight = Math.max(
      window.visualViewport.height,
      window.innerHeight,
      screen.height || 0,
    );
    this._vvResizeHandler = function () {
      self._lastViewportChangeTime = Date.now();
      const now = Date.now();
      if (!lastAdjustTime || now - lastAdjustTime > 200) {
        lastAdjustTime = now;
        clearTimeout(debounceTimer);
        self._adjustForKeyboard();
        debounceTimer = setTimeout(() => {
          self._adjustForKeyboard();
        }, 30);
      } else {
        lastAdjustTime = now;
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          self._adjustForKeyboard();
        }, 30);
      }
    };
    window.visualViewport.addEventListener("resize", this._vvResizeHandler);
  },

  _winResizeHandler: null,

  _setupWindowResize() {
    const self = this;
    this._winResizeHandler = function () {
      self._clampToViewport();
    };
    this._orientationHandler = function () {
      self._maxSeenViewportHeight = null;
      self._clampToViewport();
    };
    window.addEventListener("resize", this._winResizeHandler);
    window.addEventListener("orientationchange", this._orientationHandler);
  },

  _removeWindowResize() {
    if (this._winResizeHandler) {
      window.removeEventListener("resize", this._winResizeHandler);
      this._winResizeHandler = null;
    }
    if (this._orientationHandler) {
      window.removeEventListener("orientationchange", this._orientationHandler);
      this._orientationHandler = null;
    }
  },

  _clampToViewport() {
    const vv = window.visualViewport;
    const vw = (vv && vv.width) || window.innerWidth || 0;
    const vh = (vv && vv.height) || window.innerHeight || 0;
    if (!vw || !vh || vw < 120 || vh < 120) {
      return;
    }
    const target = this._ballEl || this._panelEl;
    if (target && target.length) {
      const el = target[0];
      const w = el.offsetWidth || 0;
      const h = el.offsetHeight || 0;
      if (w && h) {
        let left = parseFloat(el.style.left);
        let top = parseFloat(el.style.top);
        if (!isNaN(left) && !isNaN(top)) {
          const maxLeft = Math.max(0, vw - w);
          const maxTop = Math.max(0, vh - h);
          const newLeft = Math.max(0, Math.min(maxLeft, left));
          const newTop = Math.max(0, Math.min(maxTop, top));
          if (Math.abs(newLeft - left) > 1 || Math.abs(newTop - top) > 1) {
            el.style.left = newLeft + "px";
            el.style.top = newTop + "px";
            const fp = getSettings().floatingPanel;
            fp.position = { x: Math.round(newLeft), y: Math.round(newTop) };
            saveSettingsDebounced();
          }
        }
      }
    }
  },

  _removeKeyboardAdaptation() {
    if (this._vvResizeHandler && window.visualViewport) {
      window.visualViewport.removeEventListener(
        "resize",
        this._vvResizeHandler,
      );
    }
    this._vvResizeHandler = null;
    this._savedTopBeforeKeyboard = null;
  },

  _repositionPanel() {
    if (!this._panelEl || !this._ballEl || !this._expanded) return;
    if (!this._panelEl.is(":visible")) return;
    const ballRectQuick = this._ballEl[0].getBoundingClientRect();
    if (ballRectQuick.width < 10 || ballRectQuick.height < 10) {
      return;
    }
    const posKey = `${ballRectQuick.top.toFixed(0)}_${ballRectQuick.left.toFixed(0)}_${window.innerWidth}_${(window.visualViewport && window.visualViewport.height) || window.innerHeight}`;
    if (this._lastRepositionKey === posKey) return;
    this._lastRepositionKey = posKey;
    const ballOnlyKey = `${ballRectQuick.top.toFixed(0)}_${ballRectQuick.left.toFixed(0)}_${ballRectQuick.width.toFixed(0)}`;
    const prevBallOnlyKey = this._lastBallOnlyKey;
    this._lastBallOnlyKey = ballOnlyKey;
    const currentTopParsed = parseFloat(this._panelEl[0].style.top);
    if (prevBallOnlyKey === ballOnlyKey && !isNaN(currentTopParsed)) {
      let _minTopFast = 4;
      const _topBarFast =
        document.getElementById("top-bar") ||
        document.getElementById("top-settings-holder");
      if (_topBarFast) {
        const _r = _topBarFast.getBoundingClientRect();
        if (_r.bottom > 0) _minTopFast = _r.bottom + 10;
      }
      const _vvFast = window.visualViewport;
      const _vTopFast = _vvFast ? _vvFast.offsetTop : 0;
      const _vBottomFast = _vvFast
        ? _vvFast.offsetTop + _vvFast.height
        : window.innerHeight;
      const _effMinTopFast = Math.max(_minTopFast, _vTopFast + 4);
      const _effMaxBottomFast = _vBottomFast - 4;
      if (
        currentTopParsed >= _effMinTopFast &&
        currentTopParsed < _effMaxBottomFast - 60
      ) {
        const _allowedH = _effMaxBottomFast - currentTopParsed;
        this._panelEl.css("max-height", this._clampMaxH(_allowedH) + "px");
        return;
      }
    }

    const fp = getSettings().floatingPanel;
    const ballRect = this._ballEl[0].getBoundingClientRect();
    const panelWidth = this._panelEl.outerWidth();
    const panelHeight = this._panelEl.outerHeight();

    let minTop = 4;
    const topBarEl =
      document.getElementById("top-bar") ||
      document.getElementById("top-settings-holder");
    if (topBarEl) {
      const rect = topBarEl.getBoundingClientRect();
      if (rect.bottom > 0) minTop = rect.bottom + 10;
    }

    const vv = window.visualViewport;
    const viewportTop = vv ? vv.offsetTop : 0;
    const viewportBottom = vv ? vv.offsetTop + vv.height : window.innerHeight;
    const effectiveMinTop = Math.max(minTop, viewportTop + 4);
    const effectiveMaxBottom = viewportBottom - 4;
    const availableHeight = effectiveMaxBottom - effectiveMinTop;

    let panelLeft, panelTop;
    const spaceLeft = ballRect.left;
    const spaceRight = window.innerWidth - ballRect.right;

    const preferSidePanel =
      fp.orientation === "vertical" || fp.orientation === "wrap-side";

    if (
      preferSidePanel &&
      (spaceLeft >= panelWidth + 12 || spaceRight >= panelWidth + 12)
    ) {
      if (spaceLeft >= panelWidth + 12) {
        panelLeft = ballRect.left - panelWidth - 8;
      } else {
        panelLeft = ballRect.right + 8;
      }
      panelTop = ballRect.top;
      if (panelTop + panelHeight > effectiveMaxBottom) {
        panelTop = effectiveMaxBottom - panelHeight;
      }
    } else {
      panelLeft = ballRect.left + ballRect.width / 2 - panelWidth / 2;
      panelTop = ballRect.bottom + 8;
      if (panelTop + panelHeight > effectiveMaxBottom) {
        panelTop = ballRect.top - panelHeight - 8;
      }
    }

    panelLeft = Math.max(
      4,
      Math.min(window.innerWidth - panelWidth - 4, panelLeft),
    );

    const _kbOpen =
      vv &&
      this._maxSeenViewportHeight &&
      vv.height < this._maxSeenViewportHeight - 50;
    if (panelHeight >= availableHeight || _kbOpen) {
      this._panelEl.css("max-height", this._clampMaxH(availableHeight) + "px");
      panelTop = Math.max(
        effectiveMinTop,
        Math.min(
          effectiveMaxBottom - Math.min(panelHeight, availableHeight),
          panelTop,
        ),
      );
    } else {
      panelTop = Math.max(
        effectiveMinTop,
        Math.min(effectiveMaxBottom - panelHeight, panelTop),
      );
      const naturalHeight = this._panelEl[0].scrollHeight;
      if (naturalHeight && naturalHeight <= availableHeight - 20) {
        this._panelEl.css(
          "max-height",
          this._clampMaxH(availableHeight) + "px",
        );
      }
    }

    const panelR = panelLeft + panelWidth;
    const panelB = panelTop + Math.min(panelHeight, availableHeight);
    const overlapsBall = !(
      panelR <= ballRect.left - 2 ||
      panelLeft >= ballRect.right + 2 ||
      panelB <= ballRect.top - 2 ||
      panelTop >= ballRect.bottom + 2
    );
    if (overlapsBall) {
      const spaceBelowBall = effectiveMaxBottom - ballRect.bottom - 8;
      const spaceAboveBall = ballRect.top - effectiveMinTop - 8;
      panelLeft = Math.max(
        4,
        Math.min(
          window.innerWidth - panelWidth - 4,
          ballRect.left + ballRect.width / 2 - panelWidth / 2,
        ),
      );
      if (spaceBelowBall >= spaceAboveBall && spaceBelowBall > 60) {
        panelTop = ballRect.bottom + 8;
        if (panelHeight > spaceBelowBall) {
          this._panelEl.css(
            "max-height",
            this._clampMaxH(spaceBelowBall) + "px",
          );
        }
      } else if (spaceAboveBall > 60) {
        if (panelHeight > spaceAboveBall) {
          this._panelEl.css(
            "max-height",
            this._clampMaxH(spaceAboveBall) + "px",
          );
          panelTop = effectiveMinTop;
        } else {
          panelTop = ballRect.top - panelHeight - 8;
        }
      } else {
        panelTop = ballRect.bottom + 8;
        const remaining = effectiveMaxBottom - panelTop;
        if (remaining > 0 && panelHeight > remaining) {
          this._panelEl.css("max-height", this._clampMaxH(remaining) + "px");
        }
      }
    }

    this._panelEl.css({
      left: panelLeft + "px",
      top: panelTop + "px",
      right: "auto",
    });

    void this._panelEl[0].offsetHeight;
    const finalRealH = this._panelEl[0].offsetHeight;
    const finalRealT = parseFloat(this._panelEl[0].style.top) || 0;
    if (finalRealT + finalRealH > effectiveMaxBottom + 1) {
      const overflow = finalRealT + finalRealH - effectiveMaxBottom;
      let fixedTop = finalRealT;
      let fixedMaxH = finalRealH - overflow;
      if (fixedMaxH < 60) {
        fixedTop = effectiveMinTop;
        fixedMaxH = effectiveMaxBottom - effectiveMinTop;
      } else if (fixedTop < effectiveMinTop) {
        fixedTop = effectiveMinTop;
        fixedMaxH = effectiveMaxBottom - effectiveMinTop;
      }
      this._panelEl.css({
        top: fixedTop + "px",
        "max-height": this._clampMaxH(fixedMaxH) + "px",
      });
    }
  },

  _adjustForKeyboard() {
    if (!window.visualViewport) return;
    this._lastViewportChangeTime = Date.now();
    const vv = window.visualViewport;
    const vvBottom = vv.offsetTop + vv.height;
    const fullHeight = Math.max(window.innerHeight, screen.height || 0);
    const keyboardVisible =
      vv.height < fullHeight * 0.7 ||
      (this._maxSeenViewportHeight &&
        vv.height < this._maxSeenViewportHeight * 0.85);
    if (
      !this._maxSeenViewportHeight ||
      vv.height > this._maxSeenViewportHeight
    ) {
      this._maxSeenViewportHeight = vv.height;
    }

    const target = this._ballEl || this._panelEl;
    if (target && target.length) {
      const elTop = parseFloat(target[0].style.top);
      const elHeight = target[0].offsetHeight;

      if (!isNaN(elTop)) {
        if (elTop + elHeight > vvBottom - 10) {
          if (this._savedTopBeforeKeyboard === null) {
            this._savedTopBeforeKeyboard = elTop;
          }
          let minTop = 50;
          const topBarEl =
            document.getElementById("top-bar") ||
            document.getElementById("top-settings-holder");
          if (topBarEl) {
            const rect = topBarEl.getBoundingClientRect();
            if (rect.bottom > 0) {
              minTop = rect.bottom + 10;
            }
          }

          const newTop = Math.max(minTop, vv.offsetTop + 10);
          target.css("top", newTop + "px");
        } else if (this._savedTopBeforeKeyboard !== null && !keyboardVisible) {
          target.css("top", this._savedTopBeforeKeyboard + "px");
          this._savedTopBeforeKeyboard = null;
        }
      }
    }

    if (this._panelEl && this._panelEl.length) {
      if (keyboardVisible) {
        this._panelEl.css({
          "overflow-y": "auto",
          "overflow-x": "hidden",
        });
      } else {
        this._panelEl.css({
          "overflow-y": "",
          "overflow-x": "",
        });
      }
      if (!this._ballEl) {
        const _fpTop = parseFloat(this._panelEl[0].style.top);
        if (!isNaN(_fpTop)) {
          const _fpMaxH = vvBottom - _fpTop - 10;
          if (_fpMaxH > 0) {
            this._panelEl.css("max-height", this._clampMaxH(_fpMaxH) + "px");
          }
        }
      }
    }

    if (this._expanded && this._ballEl && this._panelEl) {
      this._lastRepositionKey = null;
      this._repositionPanel();
    }
  },

  _setupDialogDetection() {
    if (this._dialogObserver) return;
    const self = this;
    this._dialogObserver = new MutationObserver(() => {
      if (self._dialogDebounceTimer) return;
      self._dialogDebounceTimer = setTimeout(() => {
        self._dialogDebounceTimer = null;
        self._updateDialogHost();
      }, 200);
    });
    this._dialogObserver.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["open"],
    });
    this._updateDialogHost();
  },

  _removeDialogDetection() {
    if (this._dialogObserver) {
      this._dialogObserver.disconnect();
      this._dialogObserver = null;
    }
    if (this._dialogDebounceTimer) clearTimeout(this._dialogDebounceTimer);
    this._dialogDebounceTimer = null;
    if (this._currentDialogHost) {
      this._moveElementsToBody();
      this._currentDialogHost = null;
    }
  },

  _updateDialogHost() {
    const openDialogs = document.querySelectorAll("dialog[open]");
    const topDialog =
      openDialogs.length > 0 ? openDialogs[openDialogs.length - 1] : null;
    if (topDialog === this._currentDialogHost) return;
    this._currentDialogHost = topDialog;
    if (topDialog) {
      this._moveElementsToDialog(topDialog);
    } else {
      this._moveElementsToBody();
    }
  },

  _moveElementsToDialog(dialog) {
    const self = this;
    if (
      this._ballEl &&
      this._ballEl[0] &&
      this._ballEl[0].parentNode !== dialog
    ) {
      dialog.appendChild(this._ballEl[0]);
    }
    if (
      this._panelEl &&
      this._panelEl[0] &&
      this._panelEl[0].parentNode !== dialog
    ) {
      dialog.appendChild(this._panelEl[0]);
    }
    if (dialog._ihCloseHandler) {
      dialog.removeEventListener("close", dialog._ihCloseHandler);
    }
    dialog._ihCloseHandler = function () {
      if (self._currentDialogHost === dialog) {
        self._currentDialogHost = undefined;
      }
      self._moveElementsToBody();
      const remaining = document.querySelectorAll("dialog[open]");
      if (remaining.length > 0) {
        const next = remaining[remaining.length - 1];
        self._currentDialogHost = next;
        self._moveElementsToDialog(next);
      } else {
        self._currentDialogHost = null;
      }
    };
    dialog.addEventListener("close", dialog._ihCloseHandler);
    setTimeout(() => {
      if (self._currentDialogHost !== dialog) return;
      self._clampToViewport();
      if (self._expanded) {
        self._lastRepositionKey = null;
        self._lastBallOnlyKey = null;
        self._repositionPanel();
      }
    }, 350);
  },

  _moveElementsToBody() {
    if (
      this._ballEl &&
      this._ballEl[0] &&
      this._ballEl[0].parentNode !== document.body
    ) {
      document.body.appendChild(this._ballEl[0]);
    }
    if (
      this._panelEl &&
      this._panelEl[0] &&
      this._panelEl[0].parentNode !== document.body
    ) {
      document.body.appendChild(this._panelEl[0]);
    }
    const self = this;
    requestAnimationFrame(() => {
      if (self._currentDialogHost) return;
      self._clampToViewport();
      if (self._expanded) {
        self._lastRepositionKey = null;
        self._lastBallOnlyKey = null;
        self._repositionPanel();
      }
    });
  },

  _applyAutoHideState() {
    const target = this._ballEl || this._panelEl;
    if (!target) return;
    if (this._autoHideVisible) {
      target.css({
        visibility: "",
        opacity: "",
        "pointer-events": "",
      });
    } else {
      target.css({
        visibility: "hidden",
        opacity: "0",
        "pointer-events": "none",
      });
      if (this._expanded) {
        this._expanded = false;
        if (this._panelEl) this._panelEl.stop(true).hide();
        if (this._ballEl) this._ballEl.removeClass("ih-ball-expanded");
        this._updateBallImage();
      }
    }
  },

  getFloatingButtons() {
    const fp = getSettings().floatingPanel;
    if (!fp || !fp.enabled) return new Set();
    return new Set(fp.buttons || []);
  },

  refresh() {
    const fp = getSettings().floatingPanel;
    const _now = Date.now();
    if (this._lastRefreshTime && _now - this._lastRefreshTime < 200) {
      clearTimeout(this._refreshDebounceTimer);
      this._refreshDebounceTimer = setTimeout(() => this.refresh(), 200);
      return;
    }
    this._lastRefreshTime = _now;
    if (!fp || !fp.enabled || !getSettings().enabled) {
      this.destroy();
      return;
    }
    const wasExpanded = this._expanded;
    if (this._ballEl || this._panelEl) {
      this.destroy();
    }
    this.init();
    if (wasExpanded) {
      const self = this;
      setTimeout(() => {
        self._lastToggleTime = 0;
        self.toggleExpand();
      }, 60);
    }
  },
  syncTheme() {
    try {
      _cachedToolbarStyles = null;
      _cachedToolbarStylesTime = 0;
      if (this._panelEl && this._panelEl[0]) {
        const pEl = this._panelEl[0];
        pEl.style.removeProperty("backdrop-filter");
        pEl.style.removeProperty("-webkit-backdrop-filter");
        pEl.style.removeProperty("box-shadow");
        pEl.style.removeProperty("border-color");
      }
      if (this._ballEl && this._ballEl[0]) {
        const fp = getSettings().floatingPanel;
        const currentClasses = this._ballEl[0].className;
        const _hasThemeCSS = _hasUserBallCSS();
        const _userHasBgImage = _hasUserBallBackgroundImage();
        const _shouldUseCssOnly = !!(fp.followTheme && _userHasBgImage);
        let expectedCustom = false;
        if (fp.ballImage && !_shouldUseCssOnly) {
          expectedCustom = true;
        } else if (!_shouldUseCssOnly && (!fp.followTheme || !_hasThemeCSS)) {
          expectedCustom = true;
        }
        const hasCustomNow = currentClasses.includes("ih-ball-custom");
        if (expectedCustom !== hasCustomNow) {
          this.refresh();
          return;
        }
      }

      if (this._panelEl && this._panelEl[0]) {
        syncDialogTheme(this._panelEl[0]);
        syncToolbarButtonStyles(this._panelEl);
        this._panelEl
          .find("[data-button-key='pagingMode']")
          .toggleClass("input-helper-btn-active", pagingController.active);
        this._panelEl
          .find("[data-button-key='autoScroll']")
          .toggleClass("input-helper-btn-active", autoScrollController.active);
        this._panelEl
          .find("[data-button-key='findReplace']")
          .toggleClass("input-helper-btn-active", findReplaceController.active);
        historyManager.updateButtons();
      }
    } catch (e) {
      console.warn("快捷工具栏: 同步面板主题失败", e);
    }
  },
  refreshPanelOnly() {
    const fp = getSettings().floatingPanel;
    if (!fp || !fp.enabled || !getSettings().enabled) return;
    if (!this._panelEl) {
      this.refresh();
      return;
    }
    const wasExpanded = this._expanded;
    const wasVisible = this._panelEl.is(":visible");
    this._panelEl.remove();
    this._panelEl = null;
    this._expanded = false;
    this._createPanel();
    if (this._currentDialogHost && this._panelEl && this._panelEl[0]) {
      if (this._panelEl[0].parentNode !== this._currentDialogHost) {
        this._currentDialogHost.appendChild(this._panelEl[0]);
      }
    }
    if (fp.displayMode === "ball" && this._panelEl) {
      this._panelEl.hide();
      if (wasExpanded && wasVisible) {
        setTimeout(() => this.toggleExpand(), 30);
      }
    }
  },
};
function bindRepeatableButton(btn, action) {
  let holdTimer = null;
  let repeatTimer = null;
  let repeating = false;
  let suppressClickUntil = 0;
  let suppressMouseUntil = 0;
  let touchStartX = 0;
  let touchStartY = 0;

  const HOLD_DELAY = 350;
  const REPEAT_INTERVAL = 60;

  const stopRepeat = () => {
    if (holdTimer) {
      clearTimeout(holdTimer);
      holdTimer = null;
    }
    if (repeatTimer) {
      clearInterval(repeatTimer);
      repeatTimer = null;
    }
    if (repeating) {
      suppressClickUntil = Date.now() + 200;
    }
    repeating = false;
  };

  const startRepeat = () => {
    stopRepeat();
    action();
    holdTimer = setTimeout(() => {
      repeating = true;
      repeatTimer = setInterval(action, REPEAT_INTERVAL);
    }, HOLD_DELAY);
  };

  btn.on("mousedown", function (e) {
    if (e.button !== 0) return;
    if (Date.now() < suppressMouseUntil) {
      e.preventDefault();
      return;
    }
    e.preventDefault();
    startRepeat();
  });
  btn.on("mouseup mouseleave", function () {
    if (Date.now() < suppressMouseUntil) return;
    stopRepeat();
  });

  if (btn[0]) {
    btn[0].addEventListener(
      "touchstart",
      function (e) {
        e.preventDefault();
        const t = e.touches[0];
        touchStartX = t.clientX;
        touchStartY = t.clientY;
        suppressMouseUntil = Date.now() + 600;
        startRepeat();
      },
      { passive: false },
    );
  }
  btn.on("touchmove", function (e) {
    const t = e.originalEvent.touches[0];
    const dx = Math.abs(t.clientX - touchStartX);
    const dy = Math.abs(t.clientY - touchStartY);
    if (dx > 10 || dy > 10) {
      stopRepeat();
    }
  });
  btn.on("touchend touchcancel", function () {
    suppressMouseUntil = Date.now() + 600;
    stopRepeat();
  });

  btn.on("click", function (e) {
    if (Date.now() < suppressClickUntil) {
      e.preventDefault();
      e.stopPropagation();
    }
  });
}

function getActionForKey(key) {
  if (shortcutFunctionMap[key]) return shortcutFunctionMap[key];
  if (key.startsWith("custom_")) {
    const idx = parseInt(key.replace("custom_", ""));
    const sym = (getSettings().customSymbols || [])[idx];
    if (sym) return () => insertCustomSymbol(sym);
  }
  return null;
}

function bindButtonAction(btn, key) {
  const isMobile = ihIsMobileDevice();
  const action = getActionForKey(key);
  if (!action) return;

  if (key === "cursorLeft" || key === "cursorRight") {
    bindRepeatableButton(btn, action);
    return;
  }
  if (isMobile) {
    btn
      .on("touchstart", function (e) {
        const touch = e.originalEvent.touches[0];
        $(this).data("touchStartX", touch.clientX);
        $(this).data("touchStartY", touch.clientY);
      })
      .on("touchend", function (e) {
        const touch = e.originalEvent.changedTouches[0];
        const dx = Math.abs(touch.clientX - $(this).data("touchStartX"));
        const dy = Math.abs(touch.clientY - $(this).data("touchStartY"));
        if (dx > 10 || dy > 10) return;
        e.preventDefault();
        const scrollKeys = new Set([
          "scrollToTop",
          "scrollToBottom",
          "scrollToLastAi",
          "prevAiMsg",
          "nextAiMsg",
          "pagingMode",
          "autoScroll",
          "bottomNavMode",
        ]);

        const isScrollKey = scrollKeys.has(key);
        const refocusTarget = getInsertionTarget();

        if (isScrollKey) {
          ihBlurIfKeyboardAlreadyDismissed();
        }

        action();

        if (!isScrollKey && isInputButton(key)) {
          setTimeout(() => {
            try {
              if (
                refocusTarget &&
                refocusTarget.ownerDocument &&
                refocusTarget.ownerDocument.contains(refocusTarget) &&
                !shouldIgnoreFocusedElement(refocusTarget)
              ) {
                refocusTarget.focus({ preventScroll: true });
              }
            } catch (e) {}
          }, 10);
        }
      });
  } else {
    btn.on("click", action);
  }
}

let _cachedThemeSample = null;
let _cachedThemeSampleTime = 0;
const _THEME_SAMPLE_TTL = 60000;

function _getThemeSample() {
  const now = Date.now();
  if (_cachedThemeSample && now - _cachedThemeSampleTime < _THEME_SAMPLE_TTL) {
    return _cachedThemeSample;
  }
  try {
    const rootDoc = (window.parent && window.parent.document) || document;
    const rootWin = (window.parent && window.parent.defaultView) || window;
    const samples = rootDoc.querySelectorAll(".drawer-content");
    if (!samples.length) return null;
    const drawerEl = samples[0];
    const drawerCs = rootWin.getComputedStyle(drawerEl);
    const probeCss =
      "position:absolute;left:-9999px;top:-9999px;pointer-events:none;opacity:0;width:1px;height:1px;";
    const result = {
      color: drawerCs.color,
      bgColor: drawerCs.backgroundColor,
      bgImage: "",
      bgSize: "",
      bgPos: "",
      bgRepeat: "",
      tintColor: "",
    };
    for (const el of samples) {
      const cs = rootWin.getComputedStyle(el);
      if (cs.backgroundImage && cs.backgroundImage !== "none") {
        result.bgImage = cs.backgroundImage;
        result.bgSize = cs.backgroundSize || "cover";
        result.bgPos = cs.backgroundPosition || "center";
        result.bgRepeat = cs.backgroundRepeat || "no-repeat";
        break;
      }
    }
    const pcs = rootWin.getComputedStyle(rootDoc.documentElement);
    const rawColor = pcs.getPropertyValue("--SmartThemeBlurTintColor").trim();
    if (rawColor) {
      const d = document.createElement("div");
      d.style.cssText = "color:" + rawColor + ";display:none;";
      document.body.appendChild(d);
      const parsed = getComputedStyle(d).color;
      document.body.removeChild(d);
      const m = parsed.match(
        /rgba?\(\s*(\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/,
      );
      if (m) {
        const a = m[4] !== undefined ? parseFloat(m[4]) : 1;
        result.tintColor = `rgba(${m[1]},${m[2]},${m[3]},${Math.max(a, 0.82)})`;
      }
    }
    const probeInput = rootDoc.createElement("input");
    probeInput.type = "text";
    probeInput.style.cssText = probeCss;
    drawerEl.appendChild(probeInput);
    result.inputColor = rootWin.getComputedStyle(probeInput).color;
    probeInput.remove();
    result.inputBg = drawerCs.backgroundColor;
    const probeBtn = rootDoc.createElement("div");
    probeBtn.className = "menu_button";
    probeBtn.textContent = "x";
    probeBtn.style.cssText = probeCss;
    drawerEl.appendChild(probeBtn);
    const btnCs = rootWin.getComputedStyle(probeBtn);
    result.btnColor = btnCs.color;
    result.btnBg = btnCs.backgroundColor;
    result.btnBoxShadow = btnCs.boxShadow;
    result.btnBorderRadius = btnCs.borderRadius;
    result.btnBorderStyle = btnCs.borderStyle;
    result.btnBorderWidth = btnCs.borderWidth;
    result.btnBorderColor = btnCs.borderColor;
    result.btnBgImage = btnCs.backgroundImage;
    result.btnBgSize = btnCs.backgroundSize;
    result.btnBgPosition = btnCs.backgroundPosition;
    result.btnBgRepeat = btnCs.backgroundRepeat;
    result.btnTextShadow = btnCs.textShadow;
    probeBtn.remove();
    const probeSelect = rootDoc.createElement("select");
    probeSelect.style.cssText = probeCss;
    drawerEl.appendChild(probeSelect);
    const selCs = rootWin.getComputedStyle(probeSelect);
    result.selColor = selCs.color;
    result.selBg = selCs.backgroundColor;
    result.selBgImage = selCs.backgroundImage;
    result.selBgSize = selCs.backgroundSize;
    result.selBgPos = selCs.backgroundPosition;
    result.selBgRepeat = selCs.backgroundRepeat;
    result.selBoxShadow = selCs.boxShadow;
    result.selBorderStyle = selCs.borderStyle;
    result.selBorderWidth = selCs.borderWidth;
    result.selBorderColor = selCs.borderColor;
    result.selBorderRadius = selCs.borderRadius;
    probeSelect.remove();
    _cachedThemeSample = result;
    _cachedThemeSampleTime = now;
    return result;
  } catch (e) {
    return null;
  }
}

function _invalidateThemeSample() {
  _cachedThemeSample = null;
  _cachedThemeSampleTime = 0;
}

function syncDialogTheme(contentEl, options) {
  if (!contentEl) return;
  options = options || {};
  const skipBg = options.skipBg === true;
  const s = _getThemeSample();
  if (!s) return;
  try {
    if (!skipBg) {
      contentEl.style.removeProperty("background-color");
      contentEl.style.removeProperty("color");
      contentEl.style.removeProperty("background-image");
      contentEl.style.removeProperty("background-size");
      contentEl.style.removeProperty("background-position");
      contentEl.style.removeProperty("background-repeat");
    }
    contentEl
      .querySelectorAll(
        "input, textarea, select, button, .menu_button, .ih-folder-chip, .input-helper-btn, .button-preview, .ih-hm-status, .ih-beauty-prompt-box, .shortcut-input",
      )
      .forEach(function (el) {
        el.style.removeProperty("color");
        el.style.removeProperty("background-color");
      });
    contentEl
      .querySelectorAll("button:not(.input-helper-btn), .menu_button")
      .forEach(function (el) {
        if (
          el.classList.contains("button-preview") ||
          el.classList.contains("ih-folder-chip")
        )
          return;
        el.style.removeProperty("box-shadow");
        el.style.removeProperty("border-radius");
        el.style.removeProperty("border-style");
        el.style.removeProperty("border-width");
        el.style.removeProperty("border-color");
        el.style.removeProperty("background-image");
        el.style.removeProperty("background-size");
        el.style.removeProperty("background-position");
        el.style.removeProperty("background-repeat");
        el.style.removeProperty("text-shadow");
      });
    contentEl
      .querySelectorAll(
        "select, .ih-mgr-select2-display, .ih-mgr-select2-dropdown",
      )
      .forEach(function (el) {
        el.style.removeProperty("background-image");
        el.style.removeProperty("background-size");
        el.style.removeProperty("background-position");
        el.style.removeProperty("background-repeat");
        el.style.removeProperty("box-shadow");
        el.style.removeProperty("border-style");
        el.style.removeProperty("border-width");
        el.style.removeProperty("border-color");
        el.style.removeProperty("border-radius");
      });
  } catch (e) {}
  try {
    if (!skipBg) {
      if (s.bgImage) {
        contentEl.style.backgroundImage = s.bgImage;
        contentEl.style.backgroundSize = s.bgSize;
        contentEl.style.backgroundPosition = s.bgPos;
        contentEl.style.backgroundRepeat = s.bgRepeat;
      }
      if (s.tintColor) {
        contentEl.style.setProperty(
          "background-color",
          s.tintColor,
          "important",
        );
      }
      if (s.color) {
        contentEl.style.setProperty("color", s.color, "important");
      }
    }
    contentEl
      .querySelectorAll(
        "input[type='text'], input[type='number'], textarea, .ih-hm-status, .ih-beauty-prompt-box, .shortcut-input",
      )
      .forEach(function (el) {
        if (el.classList && el.classList.contains("ih-fp-transparent-input")) {
          if (s.inputColor)
            el.style.setProperty("color", s.inputColor, "important");
          el.style.setProperty("background-color", "transparent", "important");
          return;
        }
        if (s.inputColor)
          el.style.setProperty("color", s.inputColor, "important");
        if (
          s.inputBg &&
          s.inputBg !== "rgba(0, 0, 0, 0)" &&
          s.inputBg !== "transparent"
        ) {
          el.style.setProperty("background-color", s.inputBg, "important");
        }
      });
    contentEl
      .querySelectorAll(
        "button, .menu_button, .ih-folder-chip, .input-helper-btn, .button-preview",
      )
      .forEach(function (el) {
        if (
          el.classList.contains("button-preview") &&
          el.closest("#integrated_button_settings")
        ) {
          el.style.setProperty("background-color", "transparent", "important");
          if (s.color) el.style.setProperty("color", s.color, "important");
          return;
        }
        if (el.classList.contains("ih-folder-chip")) {
          el.style.setProperty("background-color", "transparent", "important");
          if (s.color) el.style.setProperty("color", s.color, "important");
          return;
        }
        if (s.btnColor) el.style.setProperty("color", s.btnColor, "important");
        if (
          s.btnBg &&
          s.btnBg !== "rgba(0, 0, 0, 0)" &&
          s.btnBg !== "transparent"
        ) {
          el.style.setProperty("background-color", s.btnBg, "important");
        }
        if (el.classList.contains("input-helper-btn")) return;
        if (s.btnBgImage && s.btnBgImage !== "none") {
          el.style.setProperty("background-image", s.btnBgImage, "important");
          if (s.btnBgSize)
            el.style.setProperty("background-size", s.btnBgSize, "important");
          if (s.btnBgPosition)
            el.style.setProperty(
              "background-position",
              s.btnBgPosition,
              "important",
            );
          if (s.btnBgRepeat)
            el.style.setProperty(
              "background-repeat",
              s.btnBgRepeat,
              "important",
            );
        }
        if (s.btnBoxShadow && s.btnBoxShadow !== "none") {
          el.style.setProperty("box-shadow", s.btnBoxShadow, "important");
        }
        if (s.btnBorderRadius && s.btnBorderRadius !== "0px") {
          el.style.setProperty("border-radius", s.btnBorderRadius, "important");
        }
        if (
          s.btnBorderStyle &&
          s.btnBorderStyle !== "none" &&
          s.btnBorderWidth &&
          s.btnBorderWidth !== "0px"
        ) {
          el.style.setProperty("border-style", s.btnBorderStyle, "important");
          el.style.setProperty("border-width", s.btnBorderWidth, "important");
          if (s.btnBorderColor)
            el.style.setProperty("border-color", s.btnBorderColor, "important");
        }
        if (s.btnTextShadow && s.btnTextShadow !== "none") {
          el.style.setProperty("text-shadow", s.btnTextShadow, "important");
        }
      });
    contentEl
      .querySelectorAll(
        "select, .ih-mgr-select2-display, .ih-mgr-select2-dropdown",
      )
      .forEach(function (el) {
        if (s.selColor) el.style.setProperty("color", s.selColor, "important");
        if (
          s.selBg &&
          s.selBg !== "rgba(0, 0, 0, 0)" &&
          s.selBg !== "transparent"
        ) {
          el.style.setProperty("background-color", s.selBg, "important");
        }
        if (s.selBgImage && s.selBgImage !== "none") {
          el.style.setProperty("background-image", s.selBgImage, "important");
          if (s.selBgSize)
            el.style.setProperty("background-size", s.selBgSize, "important");
          if (s.selBgPos)
            el.style.setProperty(
              "background-position",
              s.selBgPos,
              "important",
            );
          if (s.selBgRepeat)
            el.style.setProperty(
              "background-repeat",
              s.selBgRepeat,
              "important",
            );
        }
        if (s.selBoxShadow && s.selBoxShadow !== "none") {
          el.style.setProperty("box-shadow", s.selBoxShadow, "important");
        }
        if (
          s.selBorderStyle &&
          s.selBorderStyle !== "none" &&
          s.selBorderWidth &&
          s.selBorderWidth !== "0px"
        ) {
          el.style.setProperty("border-style", s.selBorderStyle, "important");
          el.style.setProperty("border-width", s.selBorderWidth, "important");
          if (s.selBorderColor)
            el.style.setProperty("border-color", s.selBorderColor, "important");
        }
        if (s.selBorderRadius && s.selBorderRadius !== "0px") {
          el.style.setProperty("border-radius", s.selBorderRadius, "important");
        }
      });
  } catch (e) {}
}

function createDialogOverlay() {
  closeAllFolderDropdowns();
  const overlay = $(`<div class="ih-dialog-overlay"></div>`);
  overlay.css("visibility", "hidden");
  $("body").append(overlay);
  setTimeout(function () {
    overlay.css("visibility", "");
  }, 0);
  const el = overlay[0];
  [
    "click",
    "mousedown",
    "mouseup",
    "pointerdown",
    "pointerup",
    "touchstart",
    "touchend",
  ].forEach((evt) => {
    el.addEventListener(evt, (e) => e.stopPropagation(), false);
  });
  let escHandler;
  const closeOverlay = () => {
    if (escHandler) {
      document.removeEventListener("keydown", escHandler, true);
    }
    overlay.remove();
  };
  overlay[0]._ihCloseOverlay = closeOverlay;
  overlay.on("click", function (e) {
    if ($(e.target).hasClass("ih-dialog-overlay")) closeOverlay();
  });
  escHandler = (e) => {
    if (e.key === "Escape") {
      e.stopImmediatePropagation();
      e.preventDefault();
      closeOverlay();
    }
  };
  document.addEventListener("keydown", escHandler, true);
  return { overlay, escHandler };
}

function getFolderedButtons() {
  const folders = getSettings().folders || [];
  const inFolder = new Set();
  folders.forEach((f) => (f.buttons || []).forEach((b) => inFolder.add(b)));
  return inFolder;
}

let _updateVisibilityTimer = null;
function updateButtonVisibilityDebounced() {
  clearTimeout(_updateVisibilityTimer);
  _updateVisibilityTimer = setTimeout(() => updateButtonVisibility(), 80);
}

let _cachedToolbarStyles = null;
let _cachedToolbarStylesTime = 0;

const _SYNCED_BTN_PROPS = [
  "backgroundImage",
  "backgroundSize",
  "backgroundPosition",
  "backgroundRepeat",
  "boxShadow",
  "textShadow",
  "borderStyle",
  "borderWidth",
  "borderImage",
  "fontFamily",
  "fontWeight",
  "letterSpacing",
  "backdropFilter",
  "webkitBackdropFilter",
];

function syncToolbarButtonStyles(targetContainer) {
  targetContainer.find(".input-helper-btn").each(function () {
    const el = this;
    for (const prop of _SYNCED_BTN_PROPS) {
      el.style[prop] = "";
    }
  });

  const now = Date.now();
  const CACHE_TTL = 5000;
  if (!_cachedToolbarStyles || now - _cachedToolbarStylesTime > CACHE_TTL) {
    const referenceBtn = $("#input_helper_toolbar .input-helper-btn:visible")
      .not(".ih-folder-btn")
      .first();
    if (!referenceBtn.length) return;
    const refStyle = window.getComputedStyle(referenceBtn[0]);
    const hasCustomBg =
      refStyle.backgroundImage && refStyle.backgroundImage !== "none";
    const hasCustomShadow = refStyle.boxShadow && refStyle.boxShadow !== "none";
    const hasBackdrop =
      refStyle.backdropFilter && refStyle.backdropFilter !== "none";
    if (!hasCustomBg && !hasCustomShadow && !hasBackdrop) {
      _cachedToolbarStyles = null;
      _cachedToolbarStylesTime = now;
      return;
    }
    const styleMap = {};
    _SYNCED_BTN_PROPS.forEach((prop) => {
      const val = refStyle.getPropertyValue(
        prop.replace(/([A-Z])/g, "-$1").toLowerCase(),
      );
      if (val && val !== "none" && val !== "normal" && val !== "") {
        styleMap[prop] = val;
      }
    });
    _cachedToolbarStyles = Object.keys(styleMap).length > 0 ? styleMap : null;
    _cachedToolbarStylesTime = now;
  }
  if (!_cachedToolbarStyles) return;
  targetContainer.find(".input-helper-btn").each(function () {
    const el = this;
    for (const [prop, val] of Object.entries(_cachedToolbarStyles)) {
      el.style[prop] = val;
    }
  });
}

function closeAllFolderDropdowns() {
  const portals = document.querySelectorAll(".ih-folder-dropdown-portal");
  if (portals.length === 0) return;
  portals.forEach((el) => el.remove());
}

function closeNonPersistFolderDropdowns() {
  const portals = document.querySelectorAll(
    ".ih-folder-dropdown-portal:not(.ih-folder-dropdown-persist)",
  );
  portals.forEach((el) => el.remove());
}

function openFolderDropdown(folderBtn, fi, fromFloating) {
  closeAllFolderDropdowns();
  const settings = getSettings();
  const buttons = settings.buttons;
  const folder = settings.folders[fi];
  if (!folder) return;
  const layoutClass =
    folder.dropdownLayout === "vertical" ? " ih-folder-dropdown-vertical" : "";
  const persistClass = folder.dropdownPersist
    ? " ih-folder-dropdown-persist"
    : "";
  const dropdown = $(
    `<div class="ih-folder-dropdown-portal${layoutClass}${persistClass}" data-folder-index="${fi}"></div>`,
  );
  let floatingButtons;
  if (fromFloating) {
    const fpBtns = floatingPanelController.getFloatingButtons();
    floatingButtons = new Set();
    fpBtns.forEach((bk) => {
      if (!bk.startsWith("folder_")) floatingButtons.add(bk);
    });
  } else {
    floatingButtons = floatingPanelController.getFloatingButtons();
  }
  (folder.buttons || []).forEach((bKey) => {
    if (buttons[bKey] === false) return;
    if (floatingButtons.has(bKey)) return;
    let displayHtml = getButtonDisplayHtml(bKey);
    const label = getButtonLabel(bKey);
    if (bKey.startsWith("custom_")) {
      const idx = parseInt(bKey.replace("custom_", ""));
      const sym = (getSettings().customSymbols || [])[idx];
      if (sym) {
        const displayText = sym.display || "";
        const fallbackText = displayText || sym.name || "";
        if (sym.icon && displayText) {
          displayHtml = `<i class="${ihEscapeAttr(sym.icon)}"></i> <span style="margin-left:2px;">${ihEscapeHtml(displayText)}</span>`;
        } else if (sym.icon) {
          displayHtml = `<i class="${ihEscapeAttr(sym.icon)}"></i>`;
        } else if (fallbackText) {
          displayHtml = ihEscapeHtml(fallbackText);
        }
      }
    }
    const btn = $(
      `<button class="input-helper-btn" data-button-key="${ihEscapeAttr(bKey)}" title="${ihEscapeAttr(label)}">${displayHtml}</button>`,
    );
    bindButtonAction(btn, bKey);
    btn.on("mousedown", function (e) {
      e.preventDefault();
    });
    dropdown.append(btn);
  });
  if (dropdown.children().length === 0) {
    dropdown.remove();
    return;
  }
  const _fdOpenDialogs = document.querySelectorAll("dialog[open]");
  const _fdHost =
    _fdOpenDialogs.length > 0
      ? _fdOpenDialogs[_fdOpenDialogs.length - 1]
      : document.body;
  $(_fdHost).append(dropdown);
  syncToolbarButtonStyles(dropdown);
  syncDialogTheme(dropdown[0]);
  [
    "click",
    "mousedown",
    "mouseup",
    "pointerdown",
    "pointerup",
    "touchstart",
    "touchend",
  ].forEach((evt) => {
    dropdown[0].addEventListener(evt, (e) => e.stopPropagation(), false);
  });
  const btnRect = folderBtn[0].getBoundingClientRect();
  const ddWidth = dropdown.outerWidth();
  const ddHeight = dropdown.outerHeight();
  let left, top;
  if (fromFloating) {
    const panelEl =
      floatingPanelController._panelEl && floatingPanelController._panelEl[0];
    const anchorRect = panelEl ? panelEl.getBoundingClientRect() : btnRect;
    const spaceLeft = anchorRect.left;
    const spaceRight = window.innerWidth - anchorRect.right;
    const canFitRight = spaceRight >= ddWidth + 12;
    const canFitLeft = spaceLeft >= ddWidth + 12;
    if (canFitRight && spaceRight >= spaceLeft) {
      left = anchorRect.right + 6;
    } else if (canFitLeft) {
      left = anchorRect.left - ddWidth - 6;
    } else if (canFitRight) {
      left = anchorRect.right + 6;
    } else if (spaceRight >= spaceLeft) {
      left = window.innerWidth - ddWidth - 4;
    } else {
      left = 4;
    }
    top = btnRect.top;
    if (top + ddHeight > window.innerHeight - 4) {
      top = window.innerHeight - ddHeight - 4;
    }
    if (top < 4) {
      top = 4;
      if (ddHeight > window.innerHeight - 8) {
        dropdown.css("max-height", window.innerHeight - 8 + "px");
        dropdown.css("overflow-y", "auto");
      }
    }
    if (left < 4) left = 4;
    if (left + ddWidth > window.innerWidth - 4)
      left = window.innerWidth - ddWidth - 4;
  } else {
    left = btnRect.left + btnRect.width / 2 - ddWidth / 2;
    top = btnRect.top - ddHeight - 6;
    if (left < 4) left = 4;
    if (left + ddWidth > window.innerWidth - 4)
      left = window.innerWidth - ddWidth - 4;
    if (top < 4) top = btnRect.bottom + 6;
  }
  dropdown.css({
    position: "fixed",
    left: left + "px",
    top: top + "px",
    zIndex: 10001,
  });
  historyManager.updateButtons();
  dropdown
    .find("[data-button-key='pagingMode']")
    .toggleClass("input-helper-btn-active", pagingController.active);
  dropdown
    .find("[data-button-key='autoScroll']")
    .toggleClass("input-helper-btn-active", autoScrollController.active);
}

function applyCJKNarrowToToolbar() {
  const toolbar = document.getElementById("input_helper_toolbar");
  if (!toolbar) return;

  const narrowTextButtons = new Set(["「」", "『』", "《》"]);

  toolbar
    .querySelectorAll(".input-helper-btn, .custom-symbol-button")
    .forEach((btn) => {
      const hasIcon = !!btn.querySelector("i, svg");
      const text = (btn.textContent || "").trim();
      const shouldNarrow = !hasIcon && narrowTextButtons.has(text);

      if (shouldNarrow) {
        btn.dataset.cjkDone = "1";
        btn.style.setProperty("letter-spacing", "-1px", "important");
        btn.style.setProperty("padding", "3px", "important");
        btn.style.setProperty("min-width", "0", "important");
      } else {
        if (btn.dataset.cjkDone === "1") {
          delete btn.dataset.cjkDone;
        }
        btn.style.removeProperty("letter-spacing");
        btn.style.removeProperty("min-width");
        btn.style.removeProperty("padding");
      }
    });
}

function applyToolbarButtonSize() {
  const size = getSettings().toolbarBtnSize || 12;
  const toolbar = document.getElementById("input_helper_toolbar");
  if (!toolbar) return;
  const pv = Math.max(2, Math.round(size * 0.25));
  const ph = Math.max(4, Math.round(size * 0.5));
  const textSize = Math.max(8, size - 1);
  toolbar.querySelectorAll(".input-helper-btn").forEach((btn) => {
    const hasIcon = !!btn.querySelector("i, svg");
    btn.style.setProperty(
      "font-size",
      (hasIcon ? size : textSize) + "px",
      "important",
    );
    btn.querySelectorAll("i").forEach((icon) => {
      icon.style.setProperty("font-size", size + "px", "important");
    });
    const isCJKNarrow = btn.dataset.cjkDone === "1" && !btn.querySelector("i");
    if (!isCJKNarrow) {
      btn.style.setProperty("padding", `${pv}px ${ph}px`, "important");
    }
  });
  updateToolbarMaxHeight();
}

function toolbarHasVisibleButtons() {
  const settings = getSettings();
  const buttons = settings.buttons;
  const order = settings.buttonOrder || [];
  const folderedButtons = getFolderedButtons();
  const floatingButtons = floatingPanelController.getFloatingButtons();
  for (const key of order) {
    if (key.startsWith("folder_")) {
      const fi = parseInt(key.replace("folder_", ""));
      const folder = (settings.folders || [])[fi];
      if (!folder) continue;
      if (buttons[key] === false) continue;
      if (floatingButtons.has(key)) continue;
      const visibleInFolder = (folder.buttons || []).some((bk) => {
        if (buttons[bk] === false) return false;
        if (floatingButtons.has(bk)) return false;
        return true;
      });
      if (visibleInFolder) return true;
      continue;
    }
    if (folderedButtons.has(key)) continue;
    if (floatingButtons.has(key)) continue;
    if (buttons[key] !== false) return true;
  }
  return false;
}

function buildToolbar() {
  const toolbar = $("#input_helper_toolbar");
  const toolbarNext = toolbar.next();
  const toolbarParent = toolbar.parent();
  toolbar.detach();
  const settings = getSettings();
  const buttons = settings.buttons;
  const order = settings.buttonOrder || [];
  const folders = settings.folders || [];
  const folderedButtons = getFolderedButtons();
  const floatingButtons = floatingPanelController.getFloatingButtons();

  toolbar.find(".ih-folder-btn").remove();
  closeAllFolderDropdowns();

  const existingTwoRow = toolbar.find(".ih-two-row-container");
  if (existingTwoRow.length) {
    existingTwoRow
      .find(".input-helper-btn, .custom-symbol-button")
      .each(function () {
        toolbar.append(this);
      });
    existingTwoRow.remove();
  }

  toolbar.children(".input-helper-btn, .custom-symbol-button").hide();

  folders.forEach((folder, fi) => {
    const folderKey = `folder_${fi}`;
    $(`#input_folder_${fi}_btn`).remove();
    if (buttons[folderKey] === false) return;
    if (floatingButtons.has(folderKey)) return;

    const visibleButtonsInFolder = (folder.buttons || []).filter((bKey) => {
      if (buttons[bKey] === false) return false;
      if (floatingButtons.has(bKey)) return false;
      return true;
    });
    if (visibleButtonsInFolder.length === 0) return;

    let iconHtml;
    if (folder.icon) iconHtml = `<i class="${ihEscapeAttr(folder.icon)}"></i>`;
    else if (folder.display)
      iconHtml = `<span>${ihEscapeHtml(folder.display)}</span>`;
    else iconHtml = `<i class="fa-solid fa-folder"></i>`;
    const labelText = folder.name || "";
    const safeLabelText = ihEscapeHtml(labelText);
    const safeLabelAttr = ihEscapeAttr(labelText || "文件夹");
    const labelHtml = safeLabelText
      ? `<span class="ih-folder-label">${safeLabelText}</span>`
      : "";
    const folderBtn = $(`
            <button id="input_folder_${fi}_btn" class="input-helper-btn ih-folder-btn" title="${safeLabelAttr}" data-folder-index="${fi}">
                ${iconHtml}${labelHtml}<i class="fa-solid fa-ellipsis-vertical ih-folder-dots"></i>
            </button>
        `);
    toolbar.append(folderBtn);
    folderBtn.on("mousedown", function (e) {
      e.preventDefault();
    });
    folderBtn.on("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      const existing = $(
        `.ih-folder-dropdown-portal[data-folder-index="${fi}"]`,
      );
      if (existing.length) closeAllFolderDropdowns();
      else openFolderDropdown($(this), fi);
    });
    if (!order.includes(folderKey)) order.push(folderKey);
  });

  if (settings.twoRowMode) {
    const container = $(`<div class="ih-two-row-container"></div>`);
    const row1 = $(`<div class="ih-two-row ih-two-row-input"></div>`);
    const row2 = $(`<div class="ih-two-row ih-two-row-function"></div>`);
    order.forEach((key) => {
      if (key.startsWith("folder_")) {
        const fi = parseInt(key.replace("folder_", ""));
        const btn = toolbar.find(`#input_folder_${fi}_btn`);
        if (btn.length) {
          row2.append(btn);
          btn.show();
        }
        return;
      }
      if (folderedButtons.has(key)) return;
      if (floatingButtons.has(key)) return;
      const btnId = getButtonIdFromKey(key);
      if (btnId) {
        const btn = toolbar.find(`#${btnId}`);
        if (btn.length && buttons[key] !== false) {
          if (isInputButton(key)) row1.append(btn);
          else row2.append(btn);
          btn.show();
        }
      }
    });
    if (settings.twoRowOrder === "function-first") {
      container.append(row2, row1);
    } else {
      container.append(row1, row2);
    }
    if (row1.children().length === 0) row1.hide();
    if (row2.children().length === 0) row2.hide();
    toolbar.append(container);
  } else {
    order.forEach((key) => {
      if (key.startsWith("folder_")) {
        const fi = parseInt(key.replace("folder_", ""));
        const btn = toolbar.find(`#input_folder_${fi}_btn`);
        if (btn.length) {
          toolbar.append(btn);
          btn.show();
        }
        return;
      }
      if (folderedButtons.has(key)) return;
      if (floatingButtons.has(key)) return;
      const btnId = getButtonIdFromKey(key);
      if (btnId) {
        const btn = toolbar.find(`#${btnId}`);
        if (btn.length) {
          toolbar.append(btn);
          btn.toggle(buttons[key] !== false);
        }
      }
    });
  }

  toolbar.toggleClass("ih-two-row-active", !!settings.twoRowMode);
  if (toolbarNext.length) toolbarNext.before(toolbar);
  else toolbarParent.append(toolbar);
  generateFaIconProtectionCSS();
  applyCJKNarrowToToolbar();
  applyToolbarButtonSize();
  updateToolbarMaxHeight();
  $("#input_bottom_nav_mode_btn").toggleClass(
    "input-helper-btn-active",
    bottomNavController.active,
  );
  if (settings.enabled && toolbarHasVisibleButtons()) {
    toolbar.removeClass("input-helper-hidden");
  } else {
    toolbar.addClass("input-helper-hidden");
  }
}

function toggleFolderCollapse(fi) {
  const folder = (getSettings().folders || [])[fi];
  if (!folder) return;
  folder.collapsed = !folder.collapsed;
  saveSettingsDebounced();
  const childrenDiv = $(`.ih-folder-children[data-folder-index="${fi}"]`);
  const chevronBtn = $(`.ih-folder-chevron[data-folder-index="${fi}"]`);
  const folderRow = $(`.ih-folder-row[data-folder-index="${fi}"]`);
  childrenDiv.toggleClass("ih-collapsed", folder.collapsed);
  folderRow.toggleClass("ih-folder-row-collapsed", folder.collapsed);
  const icon = chevronBtn.find("i");
  if (folder.collapsed)
    icon.removeClass("fa-chevron-down").addClass("fa-chevron-right");
  else icon.removeClass("fa-chevron-right").addClass("fa-chevron-down");
}

function makeSettingsRow(key, opts) {
  const settings = getSettings();
  const isChecked = settings.buttons[key] !== false ? "checked" : "";
  const shortcutVal = settings.shortcuts[key] || "";
  const displayHtml = opts.displayHtml || getButtonDisplayHtml(key);
  const label = opts.label || getButtonLabel(key);
  let extraBtns = "";
  if (opts.isCustom) {
    extraBtns = `
            <button class="custom-edit-btn" title="编辑" data-index="${opts.customIndex}"><i class="fa-solid fa-pen"></i></button>
            <button class="custom-delete-btn" title="删除" data-index="${opts.customIndex}"><i class="fa-solid fa-trash"></i></button>
        `;
  }
  if (opts.isChild) {
    extraBtns += `<button class="ih-child-remove-btn" title="移出文件夹" data-button-key="${key}" data-folder-index="${opts.folderIndex}"><i class="fa-solid fa-right-from-bracket"></i></button>`;
  }
  const extraClass = opts.isChild ? " ih-child-row" : "";
  const row = $(`
        <div class="integrated-button-row${extraClass}" data-button-key="${key}" ${opts.isCustom ? 'data-custom="true"' : ""} ${opts.isChild ? 'data-is-child="true"' : ""}>
            <span class="drag-handle"><i class="fa-solid fa-grip-vertical"></i></span>
            <input id="enable_${key}_btn" type="checkbox" ${isChecked} />
            <div class="button-preview">${displayHtml}</div>
            <label for="enable_${key}_btn">${label}</label>
            ${extraBtns}
            <input id="shortcut_${key}" class="shortcut-input" type="text" value="${shortcutVal}" placeholder="快捷键" readonly />
            <button class="shortcut-clear-btn" data-target="shortcut_${key}" title="清除快捷键"><i class="fa-solid fa-xmark"></i></button>
        </div>
    `);
  row.find(`#enable_${key}_btn`).on("change", function () {
    getSettings().buttons[key] = $(this).prop("checked");
    saveSettingsDebounced();
    updateButtonVisibilityDebounced();
  });
  if (opts.isCustom) {
    row.find(".custom-edit-btn").on("click", function () {
      editCustomSymbol($(this).data("index"));
    });
    row.find(".custom-delete-btn").on("click", function () {
      deleteCustomSymbol($(this).data("index"));
    });
  }
  if (opts.isChild) {
    row.find(".ih-child-remove-btn").on("click", function () {
      const fi = parseInt($(this).data("folder-index"));
      const bKey = $(this).data("button-key");
      const btns = getSettings().folders[fi].buttons;
      const idx = btns.indexOf(bKey);
      if (idx > -1) btns.splice(idx, 1);
      saveSettingsDebounced();
      renderSettingsPanel();
      buildToolbar();
    });
  }
  return row;
}

function renderSettingsPanel() {
  const container = $("#integrated_button_settings");
  container.empty();
  const settings = getSettings();
  const order = settings.buttonOrder || [];
  const folders = settings.folders || [];
  const folderedButtons = getFolderedButtons();
  const customSymbols = settings.customSymbols || [];
  customSymbols.forEach((_, i) => {
    const bk = `custom_${i}`;
    if (!order.includes(bk)) order.push(bk);
    if (settings.buttons[bk] === undefined) settings.buttons[bk] = true;
    if (settings.shortcuts[bk] === undefined) settings.shortcuts[bk] = "";
    shortcutFunctionMap[bk] = () => insertCustomSymbol(customSymbols[i]);
  });
  folders.forEach((_, fi) => {
    const fk = `folder_${fi}`;
    if (!order.includes(fk)) order.push(fk);
    if (settings.buttons[fk] === undefined) settings.buttons[fk] = true;
  });
  order.forEach((key) => {
    if (folderedButtons.has(key)) return;
    if (key.startsWith("folder_")) {
      const fi = parseInt(key.replace("folder_", ""));
      const folder = folders[fi];
      if (!folder) return;
      const isChecked = settings.buttons[key] !== false ? "checked" : "";
      const iconDisplay = folder.icon
        ? `<i class="${ihEscapeAttr(folder.icon)}"></i>`
        : folder.display
          ? ihEscapeHtml(folder.display)
          : '<i class="fa-solid fa-folder"></i>';
      const safeFolderNameText = ihEscapeHtml(folder.name || "文件夹");
      const isCollapsed = folder.collapsed === true;
      const chevronIcon = isCollapsed ? "fa-chevron-right" : "fa-chevron-down";
      const folderRow = $(`
                <div class="integrated-button-row ih-folder-row ${isCollapsed ? "ih-folder-row-collapsed" : ""}" data-button-key="${key}" data-folder-row="true" data-folder-index="${fi}">
                    <span class="drag-handle"><i class="fa-solid fa-grip-vertical"></i></span>
                    <input id="enable_${key}_btn" type="checkbox" ${isChecked} />
                    <div class="button-preview">${iconDisplay}</div>
                    <span class="ih-folder-label-text" data-folder-index="${fi}"><i class="fa-solid fa-folder" style="margin-right:4px;opacity:0.5;"></i>${safeFolderNameText}</span>
                    <button class="ih-folder-chevron" data-folder-index="${fi}" title="展开/收起">
                        <i class="fa-solid ${chevronIcon}"></i>
                    </button>
                </div>
            `);
      folderRow.find(`#enable_${key}_btn`).on("change", function () {
        getSettings().buttons[key] = $(this).prop("checked");
        saveSettingsDebounced();
        updateButtonVisibilityDebounced();
      });
      folderRow.find(".ih-folder-label-text").on("click", function (e) {
        e.stopPropagation();
        toggleFolderCollapse(parseInt($(this).data("folder-index")));
      });
      folderRow.find(".ih-folder-chevron").on("click", function (e) {
        e.stopPropagation();
        toggleFolderCollapse(parseInt($(this).data("folder-index")));
      });
      container.append(folderRow);
      const childrenDiv = $(
        `<div class="ih-folder-children ${isCollapsed ? "ih-collapsed" : ""}" data-folder-index="${fi}"></div>`,
      );
      (folder.buttons || []).forEach((bKey) => {
        const isCustom = bKey.startsWith("custom_");
        const customIdx = isCustom ? parseInt(bKey.replace("custom_", "")) : -1;
        const row = makeSettingsRow(bKey, {
          isChild: true,
          folderIndex: fi,
          isCustom,
          customIndex: customIdx,
        });
        childrenDiv.append(row);
      });
      const addBtn = $(
        `<div class="menu_button menu_button_icon ih-folder-inline-add" data-folder-index="${fi}" style="cursor:pointer;width:100%;justify-content:center;margin-top:2px;"><i class="fa-solid fa-plus"></i><span>添加按钮到此文件夹</span></div>`,
      );
      addBtn.on("click", function () {
        showButtonPicker(parseInt($(this).data("folder-index")));
      });
      childrenDiv.append(addBtn);
      container.append(childrenDiv);
      return;
    }
    const isCustom = key.startsWith("custom_");
    const customIdx = isCustom ? parseInt(key.replace("custom_", "")) : -1;
    const row = makeSettingsRow(key, { isCustom, customIndex: customIdx });
    container.append(row);
  });
  setupShortcutInputs();
  initSortable();
  try {
    const _settingsPanel = document.querySelector(".input-helper-settings");
    if (_settingsPanel) {
      syncDialogTheme(_settingsPanel, { skipBg: true });
    }
  } catch (e) {}
}

function getBallProfileData() {
  const fp = getSettings().floatingPanel;
  return {
    ballImage: fp.ballImage || "",
    ballImageExpanded: fp.ballImageExpanded || "",
    ballSize: fp.ballSize || 48,
    ballShape: fp.ballShape || "circle",
    transparentBall: fp.transparentBall || false,
    followTheme: fp.followTheme !== false,
  };
}

function applyBallProfileData(data) {
  const fp = getSettings().floatingPanel;
  fp.ballImage = data.ballImage || "";
  fp.ballImageExpanded = data.ballImageExpanded || "";
  fp.ballSize = data.ballSize || 48;
  fp.ballShape = data.ballShape || "circle";
  fp.transparentBall = data.transparentBall || false;
  fp.followTheme = data.followTheme !== false;
}

function createBallProfile(name) {
  const fp = getSettings().floatingPanel;
  if (!fp.ballProfiles) fp.ballProfiles = [];
  const data = {
    name: name,
    ballImage: "",
    ballImageExpanded: "",
    ballSize: 48,
    ballShape: "circle",
    transparentBall: false,
    followTheme: true,
  };
  fp.ballProfiles.push(data);
  fp.currentProfileIndex = fp.ballProfiles.length - 1;
  applyBallProfileData(data);
  saveSettingsDebounced();
  renderFloatingPanelSettings();
  floatingPanelController.refresh();
  toastr.success(`已创建空白方案"${name}"，请自定义后保存`, "", {
    timeOut: 1800,
  });
}

function saveBallProfile(index) {
  const fp = getSettings().floatingPanel;
  if (!fp.ballProfiles || !fp.ballProfiles[index]) return;
  const name = fp.ballProfiles[index].name;
  const data = getBallProfileData();
  data.name = name;
  fp.ballProfiles[index] = data;
  saveSettingsDebounced();
  toastr.success(`已保存方案"${name}"`, "", { timeOut: 1000 });
}

function _isBallProfileDirty() {
  const fp = getSettings().floatingPanel;
  const idx = fp.currentProfileIndex;
  if (idx < 0 || !fp.ballProfiles || !fp.ballProfiles[idx]) return false;
  const saved = fp.ballProfiles[idx];
  const cur = getBallProfileData();
  if ((saved.ballImage || "") !== (cur.ballImage || "")) return true;
  if ((saved.ballImageExpanded || "") !== (cur.ballImageExpanded || ""))
    return true;
  if ((saved.ballSize || 48) !== (cur.ballSize || 48)) return true;
  if ((saved.ballShape || "circle") !== (cur.ballShape || "circle"))
    return true;
  if (!!saved.transparentBall !== !!cur.transparentBall) return true;
  if ((saved.followTheme !== false) !== (cur.followTheme !== false))
    return true;
  return false;
}

function loadBallProfile(index) {
  const fp = getSettings().floatingPanel;
  if (!fp.ballProfiles || !fp.ballProfiles[index]) return;
  const data = fp.ballProfiles[index];
  fp.currentProfileIndex = index;
  applyBallProfileData(data);
  saveSettingsDebounced();
  renderFloatingPanelSettings();
  floatingPanelController.refresh();
  toastr.info(`已切换到方案"${data.name}"`, "", { timeOut: 1000 });
}

function renameBallProfile(index, newName) {
  const fp = getSettings().floatingPanel;
  if (!fp.ballProfiles || !fp.ballProfiles[index]) return;
  fp.ballProfiles[index].name = newName;
  saveSettingsDebounced();
  renderFloatingPanelSettings();
  toastr.success(`已重命名为"${newName}"`, "", { timeOut: 1000 });
}

function deleteBallProfile(index) {
  const fp = getSettings().floatingPanel;
  if (!fp.ballProfiles || !fp.ballProfiles[index]) return;
  const name = fp.ballProfiles[index].name;
  const wasCurrent = fp.currentProfileIndex === index;
  fp.ballProfiles.splice(index, 1);

  if (fp.ballProfiles.length === 0) {
    fp.currentProfileIndex = -1;
    applyBallProfileData({
      ballImage: "",
      ballImageExpanded: "",
      ballSize: 48,
      ballShape: "circle",
      transparentBall: false,
      followTheme: true,
    });
  } else if (wasCurrent) {
    const newIndex = Math.min(index, fp.ballProfiles.length - 1);
    fp.currentProfileIndex = newIndex;
    applyBallProfileData(fp.ballProfiles[newIndex]);
  } else if (fp.currentProfileIndex > index) {
    fp.currentProfileIndex -= 1;
  }
  saveSettingsDebounced();
  toastr.info(`已删除"${name}"`, "", { timeOut: 1000 });

  setTimeout(() => {
    renderFloatingPanelSettings();
    floatingPanelController.refresh();
  }, 0);
}

function getPanelProfileData() {
  const fp = getSettings().floatingPanel;
  return {
    buttons: [...(fp.buttons || [])],
    orientation: fp.orientation || "vertical",
    buttonSize: fp.buttonSize || 12,
    panelWidth: fp.panelWidth || 0,
    panelMaxHeight: fp.panelMaxHeight || 0,
  };
}

function _isPanelProfileDirty() {
  const fp = getSettings().floatingPanel;
  const idx = fp.currentPanelProfileIndex;
  if (idx < 0 || !fp.panelProfiles || !fp.panelProfiles[idx]) return false;
  const saved = fp.panelProfiles[idx];
  const cur = getPanelProfileData();
  const sb = saved.buttons || [];
  const cb = cur.buttons || [];
  if (sb.length !== cb.length) return true;
  for (let i = 0; i < cb.length; i++) {
    if (sb[i] !== cb[i]) return true;
  }
  if ((saved.orientation || "vertical") !== cur.orientation) return true;
  if ((saved.buttonSize || 12) !== cur.buttonSize) return true;
  if ((saved.panelWidth || 0) !== cur.panelWidth) return true;
  if ((saved.panelMaxHeight || 0) !== cur.panelMaxHeight) return true;
  return false;
}

function applyPanelProfileData(data) {
  const fp = getSettings().floatingPanel;
  fp.buttons = [...(data.buttons || [])];
  fp.orientation = data.orientation || "vertical";
  fp.buttonSize = data.buttonSize || 12;
  fp.panelWidth = data.panelWidth || 0;
  fp.panelMaxHeight = data.panelMaxHeight || 0;
}

function createPanelProfile(name) {
  const fp = getSettings().floatingPanel;
  if (!fp.panelProfiles) fp.panelProfiles = [];
  const data = {
    name: name,
    buttons: [],
    orientation: fp.orientation || "vertical",
    buttonSize: 12,
    panelWidth: 0,
    panelMaxHeight: 0,
  };
  fp.panelProfiles.push(data);
  fp.currentPanelProfileIndex = fp.panelProfiles.length - 1;
  fp.buttons = [];
  fp.buttonSize = 12;
  saveSettingsDebounced();
  renderFloatingPanelSettings();
  floatingPanelController.refresh();
  buildToolbar();
  toastr.success(`已创建空方案"${name}"，请添加按钮`, "", { timeOut: 1000 });
}

function savePanelProfile(index) {
  const fp = getSettings().floatingPanel;
  if (!fp.panelProfiles || !fp.panelProfiles[index]) return;
  const name = fp.panelProfiles[index].name;
  const data = getPanelProfileData();
  data.name = name;
  fp.panelProfiles[index] = data;
  saveSettingsDebounced();
  toastr.success(`已保存面板方案"${name}"`, "", { timeOut: 1000 });
}

function loadPanelProfile(index) {
  const fp = getSettings().floatingPanel;
  if (!fp.panelProfiles || !fp.panelProfiles[index]) return;
  if (_isPanelProfileDirty()) {
    const curIdx = fp.currentPanelProfileIndex;
    if (curIdx >= 0 && fp.panelProfiles[curIdx]) {
      const curData = getPanelProfileData();
      curData.name = fp.panelProfiles[curIdx].name;
      fp.panelProfiles[curIdx] = curData;
    }
  }
  const data = fp.panelProfiles[index];
  applyPanelProfileData(data);
  fp.currentPanelProfileIndex = index;
  saveSettingsDebounced();
  renderFloatingPanelSettings();
  floatingPanelController.refreshPanelOnly();
  buildToolbar();
  toastr.info(`已切换到面板方案"${data.name}"`, "", { timeOut: 1000 });
}

function renamePanelProfile(index, newName) {
  const fp = getSettings().floatingPanel;
  if (!fp.panelProfiles || !fp.panelProfiles[index]) return;
  fp.panelProfiles[index].name = newName;
  saveSettingsDebounced();
  renderFloatingPanelSettings();
  toastr.success(`已重命名为"${newName}"`, "", { timeOut: 1000 });
}

function deletePanelProfile(index) {
  const fp = getSettings().floatingPanel;
  if (!fp.panelProfiles || !fp.panelProfiles[index]) return;
  const name = fp.panelProfiles[index].name;
  const wasCurrent = fp.currentPanelProfileIndex === index;
  fp.panelProfiles.splice(index, 1);

  if (fp.panelProfiles.length === 0) {
    fp.panelProfiles.push({
      name: "默认方案",
      buttons: [],
      orientation: fp.orientation || "vertical",
      buttonSize: 12,
      panelWidth: 0,
      panelMaxHeight: 0,
    });
    fp.currentPanelProfileIndex = 0;
    fp.buttons = [];
    fp.buttonSize = 12;
  } else if (wasCurrent) {
    const newIndex = Math.min(index, fp.panelProfiles.length - 1);
    fp.currentPanelProfileIndex = newIndex;
    applyPanelProfileData(fp.panelProfiles[newIndex]);
  } else if (fp.currentPanelProfileIndex > index) {
    fp.currentPanelProfileIndex -= 1;
  }
  saveSettingsDebounced();
  toastr.info(`已删除"${name}"`, "", { timeOut: 1000 });

  setTimeout(() => {
    renderFloatingPanelSettings();
    floatingPanelController.refreshPanelOnly();
    buildToolbar();
  }, 0);
}

function switchToNextPanelProfile() {
  const fp = getSettings().floatingPanel;
  if (!fp.panelProfiles || fp.panelProfiles.length === 0) {
    toastr.warning("还没有任何面板方案，请先在设置里创建", "", {
      timeOut: 2000,
    });
    return;
  }
  const cur = fp.currentPanelProfileIndex ?? -1;
  const next = (cur + 1) % fp.panelProfiles.length;
  loadPanelProfile(next);
}

function renderFloatingPanelSettings() {
  const container = $("#ih_floating_panel_settings");
  if (!container.length) return;
  container.off();
  container.empty();
  const fp = getSettings().floatingPanel || {};
  const allKeys = [...ALL_BUTTON_KEYS];
  const customSymbols = getSettings().customSymbols || [];
  customSymbols.forEach((_, i) => allKeys.push(`custom_${i}`));
  const allFolders = getSettings().folders || [];
  allFolders.forEach((_, i) => allKeys.push(`folder_${i}`));
  const content = $(`
        <div class="ih-fp-settings-body">
            <div class="ih-hm-group" style="border-bottom:none;">
                <div class="ih-hm-row" style="gap:8px;">
                    <div style="flex:1;display:flex;flex-direction:column;gap:4px;">
                        <div style="font-size:11px;opacity:0.75;">方向</div>
                        <select id="ih_fp_orientation" style="padding:5px 8px;border:1px solid var(--SmartThemeBorderColor);border-radius:5px;background:var(--SmartThemeBlurTintColor);color:var(--SmartThemeBodyColor);font-size:12px;">
                            <option value="vertical" ${fp.orientation === "vertical" ? "selected" : ""}>竖向（侧边展开）</option>
                            <option value="vertical-down" ${fp.orientation === "vertical-down" ? "selected" : ""}>竖向（上下展开）</option>
                            <option value="horizontal" ${fp.orientation === "horizontal" ? "selected" : ""}>横向（上下展开）</option>
                            <option value="wrap-side" ${fp.orientation === "wrap-side" ? "selected" : ""}>自定义（侧边展开）</option>
                            <option value="wrap-down" ${fp.orientation === "wrap-down" ? "selected" : ""}>自定义（上下展开）</option>
                        </select>
                    </div>
                    <div style="flex:1;display:flex;flex-direction:column;gap:4px;">
                        <div style="font-size:11px;opacity:0.75;">显示</div>
                        <select id="ih_fp_display_mode" style="padding:5px 8px;border:1px solid var(--SmartThemeBorderColor);border-radius:5px;background:var(--SmartThemeBlurTintColor);color:var(--SmartThemeBodyColor);font-size:12px;">
                            <option value="ball" ${fp.displayMode === "ball" ? "selected" : ""}>悬浮球</option>
                            <option value="fixed" ${fp.displayMode === "fixed" ? "selected" : ""}>固定面板</option>
                        </select>
                    </div>
                </div>
            </div>
            <div class="ih-hm-group" id="ih_fp_ball_profile_group" style="display:${fp.displayMode === "ball" ? "block" : "none"};padding-top:0;margin-top:-4px;">
                <div class="ih-hm-group-label">图片方案</div>
                <div class="ih-hm-row" style="gap:4px;flex-wrap:wrap;">
                    <select id="ih_fp_profile_select" style="flex:1;min-width:100px;padding:5px 8px;border:1px solid var(--SmartThemeBorderColor);border-radius:5px;background:var(--SmartThemeBlurTintColor);color:var(--SmartThemeBodyColor);font-size:12px;">
                        ${(fp.ballProfiles || []).length === 0 ? `<option value="-1" selected>（还没有方案，点 + 新建一个）</option>` : (fp.ballProfiles || []).map((p, i) => `<option value="${i}" ${fp.currentProfileIndex === i ? "selected" : ""}>${ihEscapeHtml(p.name)}</option>`).join("")}
                    </select>
                    <div class="menu_button menu_button_icon" id="ih_fp_profile_new" title="新建方案" style="cursor:pointer;margin-left:0;"><i class="fa-solid fa-plus"></i></div>
                    <div class="menu_button menu_button_icon" id="ih_fp_profile_save" title="保存到当前方案" style="cursor:pointer;margin-left:0;"><i class="fa-solid fa-floppy-disk"></i></div>
                    <div class="menu_button menu_button_icon" id="ih_fp_profile_rename" title="重命名" style="cursor:pointer;margin-left:0;"><i class="fa-solid fa-pen"></i></div>
                    <div class="menu_button menu_button_icon" id="ih_fp_profile_delete" title="删除方案" style="cursor:pointer;margin-left:0;"><i class="fa-solid fa-trash"></i></div>
                </div>
            </div>
            <div class="ih-hm-group" id="ih_fp_ball_settings" style="display:${fp.displayMode === "ball" ? "block" : "none"};padding-top:0;margin-top:-4px;">
                <div class="ih-hm-group-label">悬浮球设置</div>
                <div class="ih-hm-row" style="gap:6px;align-items:center;">
                    <label style="font-size:11px;flex-shrink:0;">形状</label>
                    <select id="ih_fp_ball_shape" style="width:62px;padding:4px 6px;border:1px solid var(--SmartThemeBorderColor);border-radius:5px;background:var(--SmartThemeBlurTintColor);color:var(--SmartThemeBodyColor);font-size:12px;flex-shrink:0;">
                        <option value="circle" ${(fp.ballShape || "circle") === "circle" ? "selected" : ""}>圆形</option>
                        <option value="square" ${fp.ballShape === "square" ? "selected" : ""}>方形</option>
                    </select>
                    <label style="font-size:11px;flex-shrink:0;margin-left:4px;">大小</label>
                    <input type="range" id="ih_fp_ball_size" min="32" max="80" value="${fp.ballSize || 48}" style="flex:1;min-width:50px;accent-color:var(--SmartThemeQuoteColor,cornflowerblue);" />
                    <input type="number" id="ih_fp_ball_size_input" min="32" max="80" value="${fp.ballSize || 48}" style="width:48px;padding:3px 4px;border:1px solid var(--SmartThemeBorderColor);border-radius:4px;background:var(--SmartThemeBlurTintColor);color:var(--SmartThemeBodyColor);font-size:11px;text-align:center;" />
                    <span style="font-size:11px;flex-shrink:0;opacity:0.6;">px</span>
                </div>
                <div class="ih-hm-row" style="margin-top:6px;">
                    <input type="text" id="ih_fp_ball_image" class="ih-fp-transparent-input" placeholder="自定义图片URL（支持 GIF / JPG / PNG）" value="${fp.ballImage || ""}" style="flex:1;padding:5px 8px;border:1px solid var(--SmartThemeBorderColor);border-radius:5px;background:transparent;color:var(--SmartThemeBodyColor);font-size:11px;" />
                </div>
                <div class="ih-hm-row" style="margin-top:4px;">
                    <input type="text" id="ih_fp_ball_image_expanded" class="ih-fp-transparent-input" placeholder="展开状态图片URL（可选，留空则用上面的图片）" value="${fp.ballImageExpanded || ""}" style="flex:1;padding:5px 8px;border:1px solid var(--SmartThemeBorderColor);border-radius:5px;background:transparent;color:var(--SmartThemeBodyColor);font-size:11px;" />
                </div>
                <div class="ih-switch-row" style="margin-top:6px;">
                    <label class="ih-switch-label" style="font-size:12px;">
                        <i class="fa-solid fa-eye-slash" style="width:16px;text-align:center;opacity:0.6;"></i>
                        透明背景（需要自定义图片）
                    </label>
                    <label class="ih-toggle">
                        <input id="ih_fp_transparent_ball" type="checkbox" ${fp.transparentBall ? "checked" : ""} />
                        <span class="ih-toggle-slider"></span>
                    </label>
                </div>
                                <div style="font-size:10px;opacity:0.5;margin-top:2px;padding-left:22px;line-height:1.5;">
                    开启后悬浮球的边框、阴影、背景色都会隐藏，只显示图片本身
                </div>
                <div class="ih-switch-row" style="margin-top:6px;">
                    <label class="ih-switch-label" style="font-size:12px;">
                        <i class="fa-solid fa-palette" style="width:16px;text-align:center;opacity:0.6;"></i>
                        跟随美化
                    </label>
                    <label class="ih-toggle">
                        <input id="ih_fp_follow_theme" type="checkbox" ${fp.followTheme ? "checked" : ""} />
                        <span class="ih-toggle-slider"></span>
                    </label>
                </div>
                <div style="font-size:10px;opacity:0.5;margin-top:2px;padding-left:22px;line-height:1.5;">
                    开启：美化CSS可控制悬浮球外观<br>关闭：插件自定义设置（图片等）优先于美化CSS
                </div>
            </div>
            <div class="ih-hm-group" style="padding-top:0;margin-top:-4px;">
                <div class="ih-switch-row">
                    <label class="ih-switch-label" style="font-size:12px;">
                        <i class="fa-solid fa-eye-slash" style="width:16px;text-align:center;opacity:0.6;"></i>
                        自动隐藏
                    </label>
                    <label class="ih-toggle">
                        <input id="ih_fp_auto_hide" type="checkbox" ${fp.autoHide ? "checked" : ""} />
                        <span class="ih-toggle-slider"></span>
                    </label>
                </div>
                <div style="font-size:10px;opacity:0.5;margin-top:2px;padding-left:22px;line-height:1.5;">
                    开启：点击聊天区域显示/隐藏，点击其他区域自动隐藏
                </div>
            </div>
            <div class="ih-hm-group" id="ih_fp_btn_size_group">
                <div class="ih-hm-group-label">面板按钮大小</div>
                <div class="ih-hm-row" style="gap:6px;align-items:center;">
                    <input type="range" id="ih_fp_btn_size" min="10" max="30" value="${fp.buttonSize || 12}" style="flex:1;min-width:80px;accent-color:var(--SmartThemeQuoteColor,cornflowerblue);" />
                    <input type="number" id="ih_fp_btn_size_input" min="10" max="30" value="${fp.buttonSize || 12}" style="width:48px;padding:3px 4px;border:1px solid var(--SmartThemeBorderColor);border-radius:4px;background:var(--SmartThemeBlurTintColor);color:var(--SmartThemeBodyColor);font-size:11px;text-align:center;" />
                    <span style="font-size:11px;flex-shrink:0;opacity:0.6;">px</span>
                </div>
            </div>
            <div class="ih-hm-group" style="padding-top:0;margin-top:-4px;">
                <div class="ih-hm-group-label">面板尺寸</div>
                <div class="ih-hm-row" style="gap:6px;align-items:center;">
                    <label style="font-size:11px;flex-shrink:0;">宽度</label>
                    <input type="range" id="ih_fp_panel_width" min="0" max="500" value="${fp.panelWidth || 0}" style="flex:1;min-width:60px;accent-color:var(--SmartThemeQuoteColor,cornflowerblue);" />
                    <input type="number" id="ih_fp_panel_width_input" min="0" max="500" value="${fp.panelWidth || 0}" style="width:48px;padding:3px 4px;border:1px solid var(--SmartThemeBorderColor);border-radius:4px;background:var(--SmartThemeBlurTintColor);color:var(--SmartThemeBodyColor);font-size:11px;text-align:center;" />
                    <span style="font-size:11px;flex-shrink:0;opacity:0.6;">px</span>
                </div>
                <div class="ih-hm-row" style="gap:6px;align-items:center;margin-top:4px;">
                    <label style="font-size:11px;flex-shrink:0;">高度</label>
                    <input type="range" id="ih_fp_panel_max_height" min="0" max="800" value="${fp.panelMaxHeight || 0}" style="flex:1;min-width:60px;accent-color:var(--SmartThemeQuoteColor,cornflowerblue);" />
                    <input type="number" id="ih_fp_panel_max_height_input" min="0" max="800" value="${fp.panelMaxHeight || 0}" style="width:48px;padding:3px 4px;border:1px solid var(--SmartThemeBorderColor);border-radius:4px;background:var(--SmartThemeBlurTintColor);color:var(--SmartThemeBodyColor);font-size:11px;text-align:center;" />
                    <span style="font-size:11px;flex-shrink:0;opacity:0.6;">px</span>
                </div>
                <div style="font-size:10px;opacity:0.5;margin-top:4px;line-height:1.5;">0 = 自动（由内容撑开）。换行模式建议设置宽度；设了高度后内容超出会上下滚动</div>
            </div>
            <div class="ih-hm-group" style="padding-top:0;margin-top:-4px;">
                <div class="ih-hm-group-label">面板方案</div>
                <div class="ih-hm-row" style="gap:4px;flex-wrap:wrap;">
                    <select id="ih_fp_panel_profile_select" style="flex:1;min-width:100px;padding:5px 8px;border:1px solid var(--SmartThemeBorderColor);border-radius:5px;background:var(--SmartThemeBlurTintColor);color:var(--SmartThemeBodyColor);font-size:12px;">
                        ${(fp.panelProfiles || []).map((p, i) => `<option value="${i}" ${fp.currentPanelProfileIndex === i ? "selected" : ""}>${ihEscapeHtml(p.name)}</option>`).join("")}
                    </select>
                    <div class="menu_button menu_button_icon" id="ih_fp_panel_profile_new" title="新建方案" style="cursor:pointer;margin-left:0;"><i class="fa-solid fa-plus"></i></div>
                    <div class="menu_button menu_button_icon" id="ih_fp_panel_profile_save" title="保存到当前方案" style="cursor:pointer;margin-left:0;"><i class="fa-solid fa-floppy-disk"></i></div>
                    <div class="menu_button menu_button_icon" id="ih_fp_panel_profile_rename" title="重命名" style="cursor:pointer;margin-left:0;"><i class="fa-solid fa-pen"></i></div>
                    <div class="menu_button menu_button_icon" id="ih_fp_panel_profile_delete" title="删除方案" style="cursor:pointer;margin-left:0;"><i class="fa-solid fa-trash"></i></div>
                </div>
                <div style="font-size:10px;opacity:0.5;margin-top:4px;line-height:1.5;">
                    保存当前面板按钮配置为方案，可放入"切换面板方案"按钮快速切换
                </div>
            </div>
            <div class="ih-hm-group">
                <div class="ih-hm-group-label">面板中的按钮</div>
                <div class="ih-folder-button-list" id="ih_fp_button_list">
                    ${(fp.buttons || [])
                      .map(
                        (bKey) => `
                        <span class="ih-folder-chip ih-fp-sortable-chip" data-button-key="${bKey}">
                            <i class="fa-solid fa-grip-vertical ih-fp-chip-drag"></i>
                            ${getButtonDisplayHtml(bKey)} ${getButtonLabel(bKey)}
                            <i class="fa-solid fa-xmark ih-fp-chip-remove" data-button-key="${bKey}"></i>
                        </span>
                    `,
                      )
                      .join("")}
                    <button class="ih-folder-add-button-btn" id="ih_fp_add_button">
                        <i class="fa-solid fa-plus"></i> 添加
                    </button>
                    <button class="ih-folder-add-button-btn" id="ih_fp_clear_buttons" style="border-color:rgba(255,100,100,0.45);color:rgba(255,120,120,0.9);">
                        <i class="fa-solid fa-broom"></i> 清空
                    </button>
                </div>
            </div>
        </div>
    `);
  container.append(content);
  try {
    const chipList = container.find("#ih_fp_button_list");
    if (chipList.sortable) {
      try {
        if (chipList.hasClass("ui-sortable")) {
          chipList.sortable("destroy");
        }
      } catch (e) {}
      chipList.sortable({
        items: "> .ih-fp-sortable-chip",
        handle: ".ih-fp-chip-drag",
        delay: 150,
        tolerance: "pointer",
        stop: function () {
          const newOrder = [];
          chipList.find(".ih-fp-sortable-chip").each(function () {
            newOrder.push($(this).data("button-key"));
          });
          getSettings().floatingPanel.buttons = newOrder;
          saveSettingsDebounced();
          floatingPanelController.refresh();
          buildToolbar();
        },
      });
    }
  } catch (e) {
    console.warn("快捷工具栏: 悬浮面板按钮排序初始化失败", e);
  }
  container.on("change", "#ih_fp_orientation", function () {
    getSettings().floatingPanel.orientation = $(this).val();
    saveSettingsDebounced();
    floatingPanelController.refresh();
  });
  container.on("change", "#ih_fp_display_mode", function () {
    getSettings().floatingPanel.displayMode = $(this).val();
    saveSettingsDebounced();
    const isBall = $(this).val() === "ball";
    $("#ih_fp_ball_settings").toggle(isBall);
    $("#ih_fp_ball_profile_group").toggle(isBall);
    floatingPanelController.refresh();
  });
  function _applyBallSizeLive(rawVal) {
    let val = parseInt(rawVal);
    if (isNaN(val)) val = 48;
    val = Math.max(32, Math.min(80, val));
    getSettings().floatingPanel.ballSize = val;
    $("#ih_fp_ball_size").val(val);
    $("#ih_fp_ball_size_input").val(val);
    saveSettingsDebounced();
    const ball = floatingPanelController._ballEl;
    if (ball && ball.length) {
      ball.css({ width: val + "px", height: val + "px" });
      ball.find("i.fa-ellipsis").css("font-size", Math.max(14, val / 3) + "px");
    }
  }
  function _applyBtnSizeLive(rawVal) {
    let val = parseInt(rawVal);
    if (isNaN(val)) val = 12;
    val = Math.max(10, Math.min(30, val));
    getSettings().floatingPanel.buttonSize = val;
    $("#ih_fp_btn_size").val(val);
    $("#ih_fp_btn_size_input").val(val);
    saveSettingsDebounced();
    const panel = floatingPanelController._panelEl;
    if (panel && panel.length) {
      const ctrl = floatingPanelController;
      panel.find(".ih-fp-btn").each(function () {
        ctrl._applyButtonSize(this, val);
      });
      if (
        ctrl._isWrapPanelOrientation(getSettings().floatingPanel.orientation)
      ) {
        ctrl._applyWrapPanelGrid(panel, getSettings().floatingPanel);
      }
      if (ctrl._expanded) {
        ctrl._lastRepositionKey = null;
        ctrl._repositionPanel();
      }
    }
  }
  container.on("input", "#ih_fp_ball_size", function () {
    _applyBallSizeLive($(this).val());
  });
  container.on("input change", "#ih_fp_ball_size_input", function () {
    _applyBallSizeLive($(this).val());
  });
  container.on("input", "#ih_fp_btn_size", function () {
    _applyBtnSizeLive($(this).val());
  });
  container.on("input change", "#ih_fp_btn_size_input", function () {
    _applyBtnSizeLive($(this).val());
  });
  function _applyPanelWidthLive(rawVal) {
    let val = parseInt(rawVal);
    if (isNaN(val)) val = 0;
    val = Math.max(0, Math.min(500, val));
    getSettings().floatingPanel.panelWidth = val;
    $("#ih_fp_panel_width").val(val);
    $("#ih_fp_panel_width_input").val(val);
    saveSettingsDebounced();
    const panel = floatingPanelController._panelEl;
    if (panel && panel.length) {
      if (val > 0) {
        panel.css("width", val + "px");
      } else {
        panel.css("width", "");
      }
      if (
        floatingPanelController._isWrapPanelOrientation(
          getSettings().floatingPanel.orientation,
        )
      ) {
        floatingPanelController._applyWrapPanelGrid(
          panel,
          getSettings().floatingPanel,
        );
      }
      if (floatingPanelController._expanded) {
        floatingPanelController._lastRepositionKey = null;
        floatingPanelController._repositionPanel();
      }
    }
  }
  function _applyPanelMaxHeightLive(rawVal) {
    let val = parseInt(rawVal);
    if (isNaN(val)) val = 0;
    val = Math.max(0, Math.min(800, val));
    getSettings().floatingPanel.panelMaxHeight = val;
    $("#ih_fp_panel_max_height").val(val);
    $("#ih_fp_panel_max_height_input").val(val);
    saveSettingsDebounced();
    const panel = floatingPanelController._panelEl;
    if (panel && panel.length) {
      if (val > 0) {
        panel.css("max-height", val + "px");
      } else {
        panel.css("max-height", "");
      }
    }
  }
  container.on("input", "#ih_fp_panel_width", function () {
    _applyPanelWidthLive($(this).val());
  });
  container.on("input change", "#ih_fp_panel_width_input", function () {
    _applyPanelWidthLive($(this).val());
  });
  container.on("input", "#ih_fp_panel_max_height", function () {
    _applyPanelMaxHeightLive($(this).val());
  });
  container.on("input change", "#ih_fp_panel_max_height_input", function () {
    _applyPanelMaxHeightLive($(this).val());
  });
  container.on("change", "#ih_fp_ball_shape", function () {
    getSettings().floatingPanel.ballShape = $(this).val();
    saveSettingsDebounced();
    floatingPanelController.refresh();
  });
  container.on("change", "#ih_fp_profile_select", function () {
    const idx = parseInt($(this).val());
    if (idx >= 0) {
      const fp = getSettings().floatingPanel;
      if (_isBallProfileDirty()) {
        const curIdx = fp.currentProfileIndex;
        if (curIdx >= 0 && fp.ballProfiles[curIdx]) {
          const curData = getBallProfileData();
          curData.name = fp.ballProfiles[curIdx].name;
          fp.ballProfiles[curIdx] = curData;
        }
      }
      loadBallProfile(idx);
    } else {
      getSettings().floatingPanel.currentProfileIndex = -1;
      saveSettingsDebounced();
    }
  });
  container.on("click", "#ih_fp_profile_new", function () {
    const name = prompt("输入方案名称：");
    if (!name || !name.trim()) return;
    createBallProfile(name.trim());
  });
  container.on("click", "#ih_fp_profile_save", function () {
    const idx = getSettings().floatingPanel.currentProfileIndex;
    if (idx < 0) {
      toastr.warning("请先选择或新建一个方案", "", { timeOut: 1000 });
      return;
    }
    saveBallProfile(idx);
  });
  container.on("click", "#ih_fp_profile_rename", function () {
    const idx = getSettings().floatingPanel.currentProfileIndex;
    if (idx < 0) {
      toastr.warning("请先选择一个方案", "", { timeOut: 1000 });
      return;
    }
    const current = getSettings().floatingPanel.ballProfiles[idx];
    const name = prompt("输入新名称：", current.name);
    if (!name || !name.trim()) return;
    renameBallProfile(idx, name.trim());
  });
  container.on("click", "#ih_fp_profile_delete", function () {
    const idx = getSettings().floatingPanel.currentProfileIndex;
    if (idx < 0) {
      toastr.warning("请先选择一个方案", "", { timeOut: 1000 });
      return;
    }
    if (
      !confirm(
        `确定删除方案"${getSettings().floatingPanel.ballProfiles[idx].name}"吗？`,
      )
    )
      return;
    deleteBallProfile(idx);
  });
  container.on("input", "#ih_fp_ball_image", function () {
    getSettings().floatingPanel.ballImage = $(this).val().trim();
    saveSettingsDebounced();
    clearTimeout(floatingPanelController._imageRefreshTimer);
    floatingPanelController._imageRefreshTimer = setTimeout(() => {
      const ball = floatingPanelController._ballEl;
      const fp = getSettings().floatingPanel;
      const shouldUseCssOnly = !!(
        fp.followTheme && _hasUserBallBackgroundImage()
      );

      if (ball && ball.length && fp.ballImage && !shouldUseCssOnly) {
        const img = ball.find("img");
        if (img.length) {
          img.attr("src", ihEscapeAttr(fp.ballImage));
          return;
        }
      }

      floatingPanelController.refresh();
    }, 600);
  });
  container.on("input", "#ih_fp_ball_image_expanded", function () {
    getSettings().floatingPanel.ballImageExpanded = $(this).val().trim();
    saveSettingsDebounced();
  });
  container.on("change", "#ih_fp_transparent_ball", function () {
    getSettings().floatingPanel.transparentBall = $(this).prop("checked");
    saveSettingsDebounced();
    floatingPanelController.refresh();
  });
  container.on("change", "#ih_fp_follow_theme", function () {
    getSettings().floatingPanel.followTheme = $(this).prop("checked");
    saveSettingsDebounced();
    floatingPanelController.refresh();
  });
  container.on("change", "#ih_fp_auto_hide", function () {
    getSettings().floatingPanel.autoHide = $(this).prop("checked");
    saveSettingsDebounced();
    floatingPanelController.refresh();
  });
  container.on("click", ".ih-fp-chip-remove", function () {
    const bKey = $(this).data("button-key");
    const btns = getSettings().floatingPanel.buttons;
    const idx = btns.indexOf(bKey);
    if (idx > -1) btns.splice(idx, 1);
    saveSettingsDebounced();
    renderFloatingPanelSettings();
    floatingPanelController.refresh();
    buildToolbar();
  });
  container.on("click", "#ih_fp_add_button", function () {
    const fpButtons = new Set(getSettings().floatingPanel.buttons || []);
    const fpFolders = getSettings().folders || [];
    const allSubButtons = new Set();
    fpFolders.forEach((f) => {
      (f.buttons || []).forEach((bk) => allSubButtons.add(bk));
    });
    const standaloneAvailable = allKeys.filter(
      (k) =>
        !k.startsWith("folder_") && !fpButtons.has(k) && !allSubButtons.has(k),
    );
    const folderAvailable = fpFolders
      .map((f, i) => ({ folder: f, index: i, key: `folder_${i}` }))
      .filter((o) => !fpButtons.has(o.key));

    const standaloneHtml = standaloneAvailable
      .map(
        (k) => `
          <div class="ih-picker-item" data-key="${k}" data-selected="false">
            <input type="checkbox" style="margin:0;flex-shrink:0;pointer-events:none;" />
            <span class="bp-preview">${getButtonDisplayHtml(k)}</span>
            <span>${getButtonLabel(k)}</span>
          </div>
        `,
      )
      .join("");

    const foldersHtml = folderAvailable
      .map(({ folder, key }) => {
        const iconHtml = folder.icon
          ? `<i class="${ihEscapeAttr(folder.icon)}"></i>`
          : folder.display
            ? ihEscapeHtml(folder.display)
            : '<i class="fa-solid fa-folder"></i>';
        let addedCount = 0;
        const subItems = (folder.buttons || [])
          .map((subKey) => {
            const alreadyAdded = fpButtons.has(subKey);
            if (alreadyAdded) addedCount++;
            const disabledAttr = alreadyAdded ? 'data-disabled="true"' : "";
            const styleAttr = alreadyAdded
              ? 'style="opacity:0.45;pointer-events:none;"'
              : "";
            const cbDisabled = alreadyAdded ? "disabled" : "";
            const addedTag = alreadyAdded
              ? '<span class="ih-picker-already-added">已在面板</span>'
              : "";
            return `
              <div class="ih-picker-item ih-picker-sub-item" data-key="${ihEscapeAttr(subKey)}" data-parent-folder="${key}" data-selected="false" ${disabledAttr} ${styleAttr}>
                <input type="checkbox" ${cbDisabled} style="margin:0;flex-shrink:0;pointer-events:none;" />
                <span class="bp-preview" style="margin-left:14px;">${getButtonDisplayHtml(subKey)}</span>
                <span>${getButtonLabel(subKey)}</span>
                ${addedTag}
              </div>
            `;
          })
          .join("");
        const totalSub = (folder.buttons || []).length;
        const subCountText =
          addedCount > 0
            ? `${totalSub - addedCount}/${totalSub} 个可选`
            : `${totalSub} 个`;
        return `
          <div class="ih-picker-folder-group" data-folder-key="${key}">
            <div class="ih-picker-folder-header">
              <button class="ih-picker-folder-toggle" data-folder-key="${key}" type="button" title="展开/折叠子按钮">
                <i class="fa-solid fa-chevron-right"></i>
              </button>
              <div class="ih-picker-item ih-picker-folder-row" data-key="${key}" data-selected="false">
                <input type="checkbox" style="margin:0;flex-shrink:0;pointer-events:none;" />
                <span class="bp-preview">${iconHtml}</span>
                <span>${ihEscapeHtml(folder.name || "文件夹")}</span>
                <span class="ih-picker-folder-count">${subCountText}</span>
              </div>
            </div>
            <div class="ih-picker-folder-children" data-folder-key="${key}" style="display:none;">
              ${subItems || '<div style="padding:6px 12px;font-size:11px;opacity:0.5;">空文件夹</div>'}
            </div>
          </div>
        `;
      })
      .join("");

    const isEmpty = !standaloneHtml && !foldersHtml;
    const { overlay, escHandler } = createDialogOverlay();
    const pickerContent = $(`
      <div class="ih-picker-dialog-content">
        <h4 style="margin:0 0 12px;font-size:14px;font-weight:600;display:flex;align-items:center;gap:6px;">
          <i class="fa-solid fa-circle-plus"></i> 添加按钮到悬浮面板
        </h4>
        <div class="ih-picker-list">
          ${standaloneHtml}
          ${standaloneHtml && foldersHtml ? '<div class="ih-picker-divider"></div>' : ""}
          ${foldersHtml}
          ${isEmpty ? '<div style="padding:8px;opacity:0.6;font-size:12px;">没有可用的按钮了</div>' : ""}
        </div>
        <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:12px;">
          <button class="ih-picker-confirm-btn" style="padding:5px 16px;border:1px solid rgba(100,149,237,0.5);background-color:rgba(100,149,237,0.3);color:var(--SmartThemeBodyColor);border-radius:5px;cursor:pointer;font-size:12px;">确定</button>
        </div>
      </div>
    `);
    overlay.append(pickerContent);
    syncDialogTheme(pickerContent[0]);
    pickerContent.on("click", (e) => e.stopPropagation());
    const closePicker = () => {
      if (overlay && overlay[0] && overlay[0]._ihCloseOverlay) {
        overlay[0]._ihCloseOverlay();
      } else {
        document.removeEventListener("keydown", escHandler, true);
        overlay.remove();
      }
    };
    overlay.off("click").on("click", (e) => {
      if (e.target === overlay[0]) closePicker();
    });

    pickerContent.on("click", ".ih-picker-folder-toggle", function (e) {
      e.stopPropagation();
      const fkey = $(this).attr("data-folder-key");
      const childrenEl = pickerContent.find(
        `.ih-picker-folder-children[data-folder-key="${fkey}"]`,
      );
      const icon = $(this).find("i");
      if (childrenEl.is(":visible")) {
        childrenEl.hide();
        icon.removeClass("fa-chevron-down").addClass("fa-chevron-right");
      } else {
        childrenEl.show();
        icon.removeClass("fa-chevron-right").addClass("fa-chevron-down");
      }
    });

    pickerContent.on("click", ".ih-picker-item", function (e) {
      if ($(this).attr("data-disabled") === "true") return;
      const isSel = $(this).attr("data-selected") === "true";
      $(this).attr("data-selected", String(!isSel));
      $(this).find("input[type='checkbox']").prop("checked", !isSel);
      $(this).css("background-color", !isSel ? "rgba(100,149,237,0.2)" : "");
      if ($(this).hasClass("ih-picker-folder-row")) {
        const fkey = $(this).attr("data-key");
        const childrenEl = pickerContent.find(
          `.ih-picker-folder-children[data-folder-key="${fkey}"]`,
        );
        const subItems = childrenEl.find(".ih-picker-sub-item");
        if (!isSel) {
          subItems.each(function () {
            $(this).attr("data-locked-by-folder", "true");
            $(this).css({ opacity: "0.4", "pointer-events": "none" });
            const cb = $(this).find("input[type='checkbox']");
            cb.prop("disabled", true);
            if ($(this).attr("data-selected") === "true") {
              $(this).attr("data-selected", "false");
              cb.prop("checked", false);
              $(this).css("background-color", "");
            }
          });
        } else {
          subItems.each(function () {
            if ($(this).attr("data-locked-by-folder") === "true") {
              $(this).removeAttr("data-locked-by-folder");
              $(this).css({ opacity: "", "pointer-events": "" });
              $(this).find("input[type='checkbox']").prop("disabled", false);
            }
          });
        }
      }
    });

    pickerContent.find(".ih-picker-confirm-btn").on("click", function () {
      const rawSelected = [];
      pickerContent
        .find(".ih-picker-item[data-selected='true']")
        .each(function () {
          rawSelected.push($(this).attr("data-key"));
        });
      const selectedFolderKeys = rawSelected.filter((k) =>
        k.startsWith("folder_"),
      );
      const subToExclude = new Set();
      selectedFolderKeys.forEach((fk) => {
        const fi = parseInt(fk.replace("folder_", ""));
        const folder = fpFolders[fi];
        if (folder && Array.isArray(folder.buttons)) {
          folder.buttons.forEach((sub) => subToExclude.add(sub));
        }
      });
      const selected = rawSelected.filter((k) => !subToExclude.has(k));

      closePicker();

      if (selected.length > 0) {
        if (!getSettings().floatingPanel.buttons)
          getSettings().floatingPanel.buttons = [];
        selected.forEach((k) => getSettings().floatingPanel.buttons.push(k));
        saveSettingsDebounced();

        setTimeout(() => {
          try {
            renderFloatingPanelSettings();
            floatingPanelController.refresh();
            buildToolbar();
          } catch (e) {
            console.error("快捷工具栏: 添加悬浮面板按钮后刷新失败", e);
            toastr.error("按钮已添加，但刷新面板失败，请尝试重新打开设置", "", {
              timeOut: 1800,
            });
          }
        }, 0);
      }
    });
  });
  container.on("click", "#ih_fp_clear_buttons", function () {
    const buttons = getSettings().floatingPanel.buttons || [];
    if (buttons.length === 0) {
      toastr.info("已经是空的啦", "", { timeOut: 1200 });
      return;
    }
    if (!confirm("确定清空悬浮面板中的所有按钮吗？\n按钮将返回主工具栏。"))
      return;
    getSettings().floatingPanel.buttons = [];
    saveSettingsDebounced();
    renderFloatingPanelSettings();
    floatingPanelController.refresh();
    buildToolbar();
  });
  container.on("change", "#ih_fp_panel_profile_select", function () {
    const idx = parseInt($(this).val());
    if (idx >= 0) {
      loadPanelProfile(idx);
    } else {
      getSettings().floatingPanel.currentPanelProfileIndex = -1;
      saveSettingsDebounced();
    }
  });
  container.on("click", "#ih_fp_panel_profile_new", function () {
    const name = prompt("输入面板方案名称：");
    if (!name || !name.trim()) return;
    createPanelProfile(name.trim());
  });
  container.on("click", "#ih_fp_panel_profile_save", function () {
    const idx = getSettings().floatingPanel.currentPanelProfileIndex;
    if (idx < 0) {
      toastr.warning("请先选择或新建一个方案", "", { timeOut: 1000 });
      return;
    }
    savePanelProfile(idx);
  });
  container.on("click", "#ih_fp_panel_profile_rename", function () {
    const idx = getSettings().floatingPanel.currentPanelProfileIndex;
    if (idx < 0) {
      toastr.warning("请先选择一个方案", "", { timeOut: 1000 });
      return;
    }
    const current = getSettings().floatingPanel.panelProfiles[idx];
    const name = prompt("输入新名称：", current.name);
    if (!name || !name.trim()) return;
    renamePanelProfile(idx, name.trim());
  });
  container.on("click", "#ih_fp_panel_profile_delete", function () {
    const idx = getSettings().floatingPanel.currentPanelProfileIndex;
    if (idx < 0) {
      toastr.warning("请先选择一个方案", "", { timeOut: 1000 });
      return;
    }
    if (
      !confirm(
        `确定删除方案"${getSettings().floatingPanel.panelProfiles[idx].name}"吗？`,
      )
    )
      return;
    deletePanelProfile(idx);
  });
  try {
    const _settingsPanel = document.querySelector(".input-helper-settings");
    if (_settingsPanel) {
      syncDialogTheme(_settingsPanel, { skipBg: true });
    }
  } catch (e) {}
}

function renderFolderSettings() {
  const container = $("#folder_settings_list");
  container.empty();
  const folders = getSettings().folders || [];
  folders.forEach((folder, fi) => {
    const iconDisplay = folder.icon
      ? `<i class="${ihEscapeAttr(folder.icon)}"></i>`
      : ihEscapeHtml(folder.display || "📁");
    const safeFolderName = ihEscapeAttr(folder.name || "");
    const card = $(`
            <div class="ih-folder-setting-card" data-folder-index="${fi}">
                <div class="ih-folder-setting-header">
                    <div class="menu_button menu_button_icon ih-folder-icon-btn" data-folder-index="${fi}" title="选择图标" style="cursor:pointer;">${iconDisplay}</div>
                    <input type="text" class="ih-folder-name-input" value="${safeFolderName}" placeholder="文件夹名称" data-folder-index="${fi}" />
                    <div class="menu_button menu_button_icon ih-folder-layout-btn" data-folder-index="${fi}" title="展开方向（横向/竖向）" style="cursor:pointer;"><i class="fa-solid ${folder.dropdownLayout === "vertical" ? "fa-arrows-up-down" : "fa-arrows-left-right"}"></i></div>
                    <div class="menu_button menu_button_icon ih-folder-persist-btn" data-folder-index="${fi}" title="${folder.dropdownPersist ? "展开后：点外部不会自动关闭（点击切换）" : "展开后：点外部会自动关闭（点击切换）"}" style="cursor:pointer;${folder.dropdownPersist ? "opacity:1;border-color:var(--SmartThemeQuoteColor,cornflowerblue);box-shadow:0 0 5px color-mix(in srgb,var(--SmartThemeQuoteColor,cornflowerblue) 55%,transparent);" : "opacity:0.5;"}"><i class="fa-solid fa-thumbtack"></i></div>
                    <div class="menu_button menu_button_icon ih-folder-delete-btn" data-folder-index="${fi}" title="删除文件夹" style="cursor:pointer;"><i class="fa-solid fa-trash"></i></div>
                </div>
                <div class="ih-folder-button-list" data-folder-index="${fi}">
                    ${(folder.buttons || [])
                      .map(
                        (bKey) => `
                        <span class="ih-folder-chip ih-folder-sortable-chip" data-button-key="${bKey}" data-folder-index="${fi}">
                            <i class="fa-solid fa-grip-vertical ih-fp-chip-drag"></i>
                            ${getButtonDisplayHtml(bKey)} ${getButtonLabel(bKey)}
                            <i class="fa-solid fa-xmark ih-chip-remove" data-button-key="${bKey}" data-folder-index="${fi}"></i>
                        </span>
                    `,
                      )
                      .join("")}
                    <button class="ih-folder-add-button-btn" data-folder-index="${fi}"><i class="fa-solid fa-plus"></i> 添加</button>
                    <button class="ih-folder-add-button-btn ih-folder-clear-btn" data-folder-index="${fi}" style="border-color:rgba(255,100,100,0.45);color:rgba(255,120,120,0.9);"><i class="fa-solid fa-broom"></i> 清空</button>
                </div>
            </div>
        `);
    container.append(card);
  });
  container
    .off("input", ".ih-folder-name-input")
    .on("input", ".ih-folder-name-input", function () {
      const fi = parseInt($(this).data("folder-index"));
      getSettings().folders[fi].name = $(this).val();
      saveSettingsDebounced();
      buildToolbar();
    });
  container
    .off("click", ".ih-folder-layout-btn")
    .on("click", ".ih-folder-layout-btn", function () {
      const fi = parseInt($(this).data("folder-index"));
      const folder = getSettings().folders[fi];
      folder.dropdownLayout =
        folder.dropdownLayout === "vertical" ? "horizontal" : "vertical";
      saveSettingsDebounced();
      renderFolderSettings();
      closeAllFolderDropdowns();
    });
  container
    .off("click", ".ih-folder-persist-btn")
    .on("click", ".ih-folder-persist-btn", function () {
      const fi = parseInt($(this).data("folder-index"));
      const folder = getSettings().folders[fi];
      folder.dropdownPersist = !folder.dropdownPersist;
      saveSettingsDebounced();
      renderFolderSettings();
      closeAllFolderDropdowns();
      toastr.info(
        folder.dropdownPersist
          ? "该文件夹展开后，点击面板外部不会自动关闭"
          : "该文件夹展开后，点击面板外部会自动关闭",
        "",
        { timeOut: 1200 },
      );
    });
  container
    .off("click", ".ih-folder-delete-btn")
    .on("click", ".ih-folder-delete-btn", function () {
      const fi = parseInt($(this).data("folder-index"));
      if (!confirm("确定删除该文件夹吗？文件夹内的按钮将恢复为独立显示。"))
        return;
      const oldFolderKey = `folder_${fi}`;
      const oldOrder = [...getSettings().buttonOrder];
      const oldButtons = { ...getSettings().buttons };
      const oldShortcuts = { ...getSettings().shortcuts };
      const order = oldOrder.filter((k) => k !== oldFolderKey);
      getSettings().folders.splice(fi, 1);
      const newButtons = {};
      const newShortcuts = {};
      const newOrder = [];
      for (const k of order) {
        if (k.startsWith("folder_")) {
          const oldFi = parseInt(k.replace("folder_", ""));
          const newFi = oldFi > fi ? oldFi - 1 : oldFi;
          const newKey = `folder_${newFi}`;
          newOrder.push(newKey);
          newButtons[newKey] = oldButtons[k];
          newShortcuts[newKey] = oldShortcuts[k] || "";
        } else {
          newOrder.push(k);
          newButtons[k] = oldButtons[k];
          newShortcuts[k] = oldShortcuts[k] || "";
        }
      }
      getSettings().folders.forEach((_, newFi) => {
        const nk = `folder_${newFi}`;
        if (newButtons[nk] === undefined) newButtons[nk] = true;
        if (!newOrder.includes(nk)) newOrder.push(nk);
      });
      for (const k of Object.keys(oldButtons)) {
        if (!k.startsWith("folder_") && newButtons[k] === undefined)
          newButtons[k] = oldButtons[k];
      }
      for (const k of Object.keys(oldShortcuts)) {
        if (!k.startsWith("folder_") && newShortcuts[k] === undefined)
          newShortcuts[k] = oldShortcuts[k];
      }
      getSettings().buttons = newButtons;
      getSettings().shortcuts = newShortcuts;
      getSettings().buttonOrder = newOrder;
      saveSettingsDebounced();
      renderFolderSettings();
      renderSettingsPanel();
      buildToolbar();
    });
  container
    .off("click", ".ih-chip-remove")
    .on("click", ".ih-chip-remove", function () {
      const fi = parseInt($(this).data("folder-index"));
      const bKey = $(this).data("button-key");
      const btns = getSettings().folders[fi].buttons;
      const idx = btns.indexOf(bKey);
      if (idx > -1) btns.splice(idx, 1);
      saveSettingsDebounced();
      renderFolderSettings();
      renderSettingsPanel();
      buildToolbar();
    });
  container
    .off("click", ".ih-folder-add-button-btn:not(.ih-folder-clear-btn)")
    .on(
      "click",
      ".ih-folder-add-button-btn:not(.ih-folder-clear-btn)",
      function () {
        showButtonPicker(parseInt($(this).data("folder-index")));
      },
    );
  container
    .off("click", ".ih-folder-clear-btn")
    .on("click", ".ih-folder-clear-btn", function () {
      const fi = parseInt($(this).data("folder-index"));
      const folder = getSettings().folders[fi];
      if (!folder || !(folder.buttons || []).length) {
        toastr.info("已经是空的啦", "", { timeOut: 1200 });
        return;
      }
      if (
        !confirm(
          `确定清空文件夹"${folder.name}"中的所有按钮吗？\n按钮将返回主工具栏。`,
        )
      )
        return;
      folder.buttons = [];
      saveSettingsDebounced();
      renderFolderSettings();
      renderSettingsPanel();
      buildToolbar();
    });
  try {
    container.find(".ih-folder-button-list").each(function () {
      const listEl = $(this);
      const fi = parseInt(listEl.data("folder-index"));
      if (listEl.sortable) {
        try {
          if (listEl.hasClass("ui-sortable")) {
            listEl.sortable("destroy");
          }
        } catch (e) {}
        listEl.sortable({
          items: "> .ih-folder-sortable-chip",
          handle: ".ih-fp-chip-drag",
          delay: 150,
          tolerance: "pointer",
          stop: function () {
            const newOrder = [];
            listEl.find(".ih-folder-sortable-chip").each(function () {
              newOrder.push($(this).data("button-key"));
            });
            getSettings().folders[fi].buttons = newOrder;
            saveSettingsDebounced();
            renderSettingsPanel();
            buildToolbar();
          },
        });
      }
    });
  } catch (e) {
    console.warn("快捷工具栏: 分组按钮排序初始化失败", e);
  }
  container
    .off("click", ".ih-folder-icon-btn")
    .on("click", ".ih-folder-icon-btn", async function () {
      const fi = parseInt($(this).data("folder-index"));
      const icon = await pickFaIcon();
      if (icon === false) return;
      if (icon) {
        getSettings().folders[fi].icon = icon;
        getSettings().folders[fi].display = "";
        saveSettingsDebounced();
        renderFolderSettings();
        renderSettingsPanel();
        buildToolbar();
      } else {
        const display = prompt(
          "输入文件夹显示文字（如 emoji）：",
          getSettings().folders[fi].display || "📁",
        );
        if (display !== null) {
          getSettings().folders[fi].display = display;
          getSettings().folders[fi].icon = "";
          saveSettingsDebounced();
          renderFolderSettings();
          renderSettingsPanel();
          buildToolbar();
        }
      }
    });
  try {
    const _settingsPanel = document.querySelector(".input-helper-settings");
    if (_settingsPanel) {
      syncDialogTheme(_settingsPanel, { skipBg: true });
    }
  } catch (e) {}
}

function showButtonPicker(folderIndex) {
  const folderedButtons = getFolderedButtons();
  const allKeys = [...ALL_BUTTON_KEYS];
  const customSymbols = getSettings().customSymbols || [];
  customSymbols.forEach((_, i) => allKeys.push(`custom_${i}`));
  const available = allKeys.filter((k) => !folderedButtons.has(k));
  const { overlay, escHandler } = createDialogOverlay();
  const content = $(`
        <div class="ih-picker-dialog-content">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
                <h4 style="margin:0;font-size:14px;font-weight:600;display:flex;align-items:center;gap:6px;">
                    <i class="fa-solid fa-folder-plus"></i> 选择要添加到文件夹的按钮
                </h4>
                <button class="ih-picker-close-btn" title="关闭" style="background:none;border:none;color:var(--SmartThemeBodyColor);cursor:pointer;font-size:16px;padding:2px 6px;opacity:0.6;">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </div>
            <div class="ih-picker-list">
                ${available
                  .map(
                    (k) => `
                    <div class="ih-picker-item" data-key="${k}" data-selected="false">
                        <input type="checkbox" style="margin:0;flex-shrink:0;pointer-events:none;" />
                        <span class="bp-preview">${getButtonDisplayHtml(k)}</span>
                        <span>${getButtonLabel(k)}</span>
                    </div>
                `,
                  )
                  .join("")}
                ${available.length === 0 ? '<div style="padding:8px;opacity:0.6;font-size:12px;">所有按钮都已分配到文件夹中</div>' : ""}
            </div>
            <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:12px;">
                <button class="ih-picker-confirm-btn" style="padding:5px 16px;border:1px solid rgba(100,149,237,0.5);background-color:rgba(100,149,237,0.3);color:var(--SmartThemeBodyColor);border-radius:5px;cursor:pointer;font-size:12px;">确定</button>
            </div>
        </div>
    `);
  overlay.append(content);
  syncDialogTheme(content[0]);
  content.on("click", function (e) {
    e.stopPropagation();
  });
  generateFaIconProtectionCSS();
  const closeDialog = function () {
    if (overlay && overlay[0] && overlay[0]._ihCloseOverlay) {
      overlay[0]._ihCloseOverlay();
    } else {
      document.removeEventListener("keydown", escHandler, true);
      overlay.remove();
    }
  };
  content.find(".ih-picker-close-btn").on("click", closeDialog);
  overlay.off("click").on("click", function (e) {
    if (e.target === overlay[0]) closeDialog();
  });
  content.on("click", ".ih-picker-item", function () {
    const isSelected = $(this).attr("data-selected") === "true";
    $(this).attr("data-selected", String(!isSelected));
    $(this).find("input[type='checkbox']").prop("checked", !isSelected);
    $(this).css("background-color", !isSelected ? "rgba(100,149,237,0.2)" : "");
  });
  content.find(".ih-picker-confirm-btn").on("click", function () {
    const selectedKeys = [];
    content.find(".ih-picker-item[data-selected='true']").each(function () {
      selectedKeys.push($(this).data("key"));
    });

    closeDialog();

    if (selectedKeys.length > 0) {
      if (!getSettings().folders[folderIndex].buttons)
        getSettings().folders[folderIndex].buttons = [];
      selectedKeys.forEach((key) =>
        getSettings().folders[folderIndex].buttons.push(key),
      );
      saveSettingsDebounced();

      setTimeout(() => {
        try {
          renderFolderSettings();
          renderSettingsPanel();
          buildToolbar();
        } catch (e) {
          console.error("快捷工具栏: 添加文件夹按钮后刷新失败", e);
          toastr.error("按钮已添加，但刷新设置失败，请尝试重新打开设置", "", {
            timeOut: 1800,
          });
        }
      }, 0);
    }
  });
}

function updateButtonVisibility() {
  const settings = getSettings();
  const buttons = settings.buttons;
  const folderedButtons = getFolderedButtons();
  for (const key of ALL_BUTTON_KEYS) {
    const btnId = getButtonIdFromKey(key);
    if (btnId) {
      if (folderedButtons.has(key)) $(`#${btnId}`).hide();
      else $(`#${btnId}`).toggle(buttons[key] !== false);
    }
  }
  if (buttons.shift === false && shiftMode.active) shiftMode.deactivate();
  const customSymbols = settings.customSymbols || [];
  customSymbols.forEach((_, i) => {
    const bk = `custom_${i}`;
    if (folderedButtons.has(bk)) $(`#input_custom_${i}_btn`).hide();
    else $(`#input_custom_${i}_btn`).toggle(buttons[bk] !== false);
  });
  const floatingButtons = floatingPanelController.getFloatingButtons();
  floatingButtons.forEach((key) => {
    const btnId = getButtonIdFromKey(key);
    if (btnId) $(`#${btnId}`).hide();
  });
  const allHidden = Object.keys(buttons).every((k) => buttons[k] === false);
  if (!settings.enabled || allHidden) {
    $("#input_helper_toolbar").addClass("input-helper-hidden");
  } else {
    $("#input_helper_toolbar").removeClass("input-helper-hidden");
    buildToolbar();
  }
}

function loadCustomSymbolButtons() {
  const customSymbols = getSettings().customSymbols || [];
  $(".custom-symbol-button").remove();
  customSymbols.forEach((symbol, index) => {
    const buttonId = `input_custom_${index}_btn`;
    $(`#${buttonId}`).remove();
    const displayContent = getButtonDisplayHtml(`custom_${index}`);
    const safeTitle = ihEscapeAttr(symbol.name || "自定义");
    const button = $(
      `<button id="${buttonId}" class="input-helper-btn custom-symbol-button" title="${safeTitle}" data-index="${index}">${displayContent}</button>`,
    );
    $("#input_helper_toolbar").append(button);
    bindButtonAction(button, `custom_${index}`);
    if (!getSettings().buttonOrder.includes(`custom_${index}`))
      getSettings().buttonOrder.push(`custom_${index}`);
    if (getSettings().buttons[`custom_${index}`] === undefined)
      getSettings().buttons[`custom_${index}`] = true;
    if (getSettings().shortcuts[`custom_${index}`] === undefined)
      getSettings().shortcuts[`custom_${index}`] = "";
    shortcutFunctionMap[`custom_${index}`] = () =>
      insertCustomSymbol(customSymbols[index]);
  });
  renderSettingsPanel();
  renderFloatingPanelSettings();
  buildToolbar();
  if (floatingPanelController._panelEl && getSettings().floatingPanel.enabled) {
    floatingPanelController.refreshPanelOnly();
  }
}

function editCustomSymbol(index) {
  showCustomSymbolDialog(getSettings().customSymbols[index], index);
}

function deleteCustomSymbol(index) {
  if (!confirm("确定要删除这个自定义符号吗？")) return;
  const symbols = getSettings().customSymbols;
  const deletedKey = `custom_${index}`;
  const folders = getSettings().folders || [];
  folders.forEach((f) => {
    f.buttons = (f.buttons || []).filter((bk) => bk !== deletedKey);
    f.buttons = f.buttons.map((bk) => {
      if (bk.startsWith("custom_")) {
        const bIdx = parseInt(bk.replace("custom_", ""));
        if (bIdx > index) return `custom_${bIdx - 1}`;
      }
      return bk;
    });
  });
  symbols.splice(index, 1);
  const fpBtns = getSettings().floatingPanel.buttons || [];
  getSettings().floatingPanel.buttons = fpBtns
    .filter((bk) => bk !== deletedKey)
    .map((bk) => {
      if (bk.startsWith("custom_")) {
        const bIdx = parseInt(bk.replace("custom_", ""));
        if (bIdx > index) return `custom_${bIdx - 1}`;
      }
      return bk;
    });
  const panelProfiles = getSettings().floatingPanel.panelProfiles || [];
  panelProfiles.forEach((profile) => {
    if (profile.buttons) {
      profile.buttons = profile.buttons
        .filter((bk) => bk !== deletedKey)
        .map((bk) => {
          if (bk.startsWith("custom_")) {
            const bIdx = parseInt(bk.replace("custom_", ""));
            if (bIdx > index) return `custom_${bIdx - 1}`;
          }
          return bk;
        });
    }
  });
  const orderIdx = getSettings().buttonOrder.indexOf(deletedKey);
  if (orderIdx > -1) getSettings().buttonOrder.splice(orderIdx, 1);
  delete getSettings().buttons[deletedKey];
  delete getSettings().shortcuts[deletedKey];
  $(`#input_custom_${index}_btn`).remove();
  delete shortcutFunctionMap[deletedKey];
  const newButtons = {};
  const newShortcuts = {};
  const newOrder = [];
  for (const k of getSettings().buttonOrder) {
    if (k.startsWith("custom_")) {
      const oldIdx = parseInt(k.replace("custom_", ""));
      if (oldIdx > index) {
        const newKey = `custom_${oldIdx - 1}`;
        newOrder.push(newKey);
        newButtons[newKey] = getSettings().buttons[k];
        newShortcuts[newKey] = getSettings().shortcuts[k] || "";
        delete shortcutFunctionMap[k];
        shortcutFunctionMap[newKey] = () =>
          insertCustomSymbol(getSettings().customSymbols[oldIdx - 1]);
      } else {
        newOrder.push(k);
        newButtons[k] = getSettings().buttons[k];
        newShortcuts[k] = getSettings().shortcuts[k] || "";
      }
    } else {
      newOrder.push(k);
      newButtons[k] = getSettings().buttons[k];
      newShortcuts[k] = getSettings().shortcuts[k] || "";
    }
  }
  for (const k of Object.keys(getSettings().buttons)) {
    if (/^custom_\d+$/.test(k)) continue;
    if (newButtons[k] === undefined) newButtons[k] = getSettings().buttons[k];
  }
  for (const k of Object.keys(getSettings().shortcuts)) {
    if (/^custom_\d+$/.test(k)) continue;
    if (newShortcuts[k] === undefined)
      newShortcuts[k] = getSettings().shortcuts[k];
  }
  getSettings().buttons = newButtons;
  getSettings().shortcuts = newShortcuts;
  getSettings().buttonOrder = newOrder;
  saveSettingsDebounced();
  ihForceSaveSettings();
  loadCustomSymbolButtons();
  renderFolderSettings();
  renderFloatingPanelSettings();
  floatingPanelController.refresh();
  updateButtonVisibility();
}

function showCustomSymbolDialog(existingSymbol = null, editIndex = -1) {
  const currentIcon = existingSymbol?.icon || "";
  const safeName = ihEscapeAttr(existingSymbol ? existingSymbol.name : "");
  const safeSymbol = ihEscapeHtml(existingSymbol ? existingSymbol.symbol : "");
  const safeDisplay = ihEscapeAttr(
    existingSymbol ? existingSymbol.display : "",
  );
  const safeCurrentIcon = ihEscapeAttr(currentIcon);
  const { overlay, escHandler } = createDialogOverlay();
  const content = $(`
        <div class="custom-symbol-dialog-content">
            <h3><i class="fa-solid fa-puzzle-piece"></i> ${existingSymbol ? "编辑自定义内容" : "添加自定义内容"}</h3>
            <div style="font-size:11px;opacity:0.65;margin-bottom:12px;line-height:1.6;">
                可以插入符号、宏标签、常用短语或整段模板文本。插入长段落时，建议给「按钮显示」填一个简短文字或选择图标，避免按钮太宽
            </div>
            <div class="custom-symbol-form">
                <div class="form-group">
                    <label>名称</label>
                    <input type="text" id="custom_symbol_name" value="${safeName}" placeholder="设置面板标签和悬停提示">
                </div>
                <div class="form-group form-group-textarea">
                    <label>插入内容</label>
                    <textarea id="custom_symbol_symbol" rows="4" placeholder="点击后实际插入的文本，支持多行段落">${safeSymbol}</textarea>
                </div>
                <div class="form-group">
                    <label>按钮显示</label>
                    <input type="text" id="custom_symbol_display" value="${safeDisplay}" placeholder="按钮上显示的文字（推荐简短）">
                    <div class="menu_button menu_button_icon" id="custom_symbol_pick_icon" title="选择 FA 图标" style="cursor:pointer;">
                        ${currentIcon ? `<i class="${safeCurrentIcon}"></i>` : '<i class="fa-solid fa-icons"></i>'}<span>图标</span>
                    </div>
                </div>

                <input type="hidden" id="custom_symbol_icon" value="${safeCurrentIcon}" />
                <div class="form-group">
                    <label>选中包裹</label>
                    <label style="display:flex;align-items:center;gap:6px;font-size:12px;cursor:pointer;flex:1;">
                        <input type="checkbox" id="custom_symbol_wrap_mode" ${existingSymbol?.wrapMode ? "checked" : ""} />
                        <span style="opacity:0.8;">选中文本时按光标位置切成左右两半包裹</span>
                    </label>
                </div>
                <div class="form-group">
                    <label>光标位置</label>
                    <select id="custom_symbol_cursor">
                        <option value="start" ${existingSymbol?.cursorPos === "start" ? "selected" : ""}>开始</option>
                        <option value="middle" ${!existingSymbol || existingSymbol.cursorPos === "middle" ? "selected" : ""}>中间</option>
                        <option value="end" ${existingSymbol?.cursorPos === "end" ? "selected" : ""}>结尾</option>
                        <option value="custom" ${existingSymbol && !["start", "middle", "end"].includes(existingSymbol.cursorPos) ? "selected" : ""}>自定义</option>
                    </select>
                    <input type="number" id="custom_symbol_cursor_pos" value="${existingSymbol && !["start", "middle", "end"].includes(existingSymbol.cursorPos) ? existingSymbol.cursorPos : "1"}" min="0" style="display:${existingSymbol && !["start", "middle", "end"].includes(existingSymbol.cursorPos) ? "inline-block" : "none"};width:60px;">
                </div>
            </div>
            <div class="custom-symbol-buttons">
                <div id="custom_symbol_cancel" class="menu_button menu_button_icon" style="cursor:pointer;"><span>取消</span></div>
                <div id="custom_symbol_save" class="menu_button menu_button_icon" style="cursor:pointer;"><i class="fa-solid fa-check"></i><span>保存</span></div>
            </div>
        </div>
    `);
  overlay.empty().append(content);
  syncDialogTheme(content[0]);
  content.on("click", function (e) {
    e.stopPropagation();
  });
  generateFaIconProtectionCSS();
  overlay.off("click").on("click", function (e) {
    if (e.target === overlay[0]) {
      document.removeEventListener("keydown", escHandler, true);
      overlay.remove();
    }
  });
  $("#custom_symbol_cursor").on("change", function () {
    $("#custom_symbol_cursor_pos").toggle($(this).val() === "custom");
  });
  $("#custom_symbol_pick_icon").on("click", async function () {
    const icon = await pickFaIcon();
    if (icon) {
      $("#custom_symbol_icon").val(icon);
      $(this).html(`<i class="${icon}"></i><span>图标</span>`);
    }
  });
  $("#custom_symbol_cancel").on("click", function () {
    document.removeEventListener("keydown", escHandler, true);
    overlay.remove();
  });
  $("#custom_symbol_save").on("click", function () {
    const name = $("#custom_symbol_name").val().trim();
    const symbol = $("#custom_symbol_symbol").val();
    const display = $("#custom_symbol_display").val();
    const icon = $("#custom_symbol_icon").val() || "";
    let cursorPos = $("#custom_symbol_cursor").val();
    if (cursorPos === "custom")
      cursorPos = $("#custom_symbol_cursor_pos").val();
    if (!name || !symbol) {
      alert("请输入名称和插入内容！");
      return;
    }
    const wrapMode = $("#custom_symbol_wrap_mode").prop("checked");
    const symbolObj = { name, symbol, display, icon, cursorPos, wrapMode };
    if (editIndex >= 0) getSettings().customSymbols[editIndex] = symbolObj;
    else {
      if (!getSettings().customSymbols) getSettings().customSymbols = [];
      getSettings().customSymbols.push(symbolObj);
    }
    saveSettingsDebounced();
    ihForceSaveSettings();

    document.removeEventListener("keydown", escHandler, true);
    overlay.remove();

    setTimeout(() => {
      try {
        loadCustomSymbolButtons();
      } catch (e) {
        console.error("快捷工具栏: 保存自定义内容后刷新失败", e);
        toastr.error("内容已保存，但刷新按钮失败，请尝试重新打开设置", "", {
          timeOut: 1800,
        });
      }
    }, 0);
  });
}

function onEnableInputChange() {
  const value = $("#enable_input_helper").prop("checked");
  getSettings().enabled = value;
  saveSettingsDebounced();
  if (value) {
    updateButtonVisibility();
    floatingPanelController.refresh();
    chatUndoManager.startWatcher();
  } else {
    $("#input_helper_toolbar").addClass("input-helper-hidden");
    if (shiftMode.active) shiftMode.deactivate();
    if (autoScrollController.active) autoScrollController.stop();
    if (findReplaceController.active) findReplaceController.close();
    if (pagingController.active) pagingController.toggle();
    scrollLockController.release();
    floatingPanelController.destroy();
    closeAllFolderDropdowns();
    chatUndoManager.stopWatcher();
  }
}

function applyToolbarPinnedState() {
  const pinned = !!getSettings().toolbarPinned;
  $("#send_form").toggleClass("ih-toolbar-pinned", pinned);
}

function setupShortcutInputs() {
  $(".shortcut-input")
    .off("keydown")
    .on("keydown", function (e) {
      e.preventDefault();
      let keys = [];
      if (e.ctrlKey) keys.push("Ctrl");
      if (e.metaKey) keys.push("Meta");
      if (e.altKey) keys.push("Alt");
      if (e.shiftKey) keys.push("Shift");
      if (!["Control", "Alt", "Shift", "Meta", "Escape"].includes(e.key)) {
        keys.push(e.key.length === 1 ? e.key.toUpperCase() : e.key);
      }
      if (e.key === "Escape") {
        $(this).val("");
        const sk = $(this).attr("id").replace("shortcut_", "");
        getSettings().shortcuts[sk] = "";
        saveSettingsDebounced();
        return;
      }
      if (keys.length <= 1) return;
      const shortcutString = keys.join("+");
      $(this).val(shortcutString);
      const sk = $(this).attr("id").replace("shortcut_", "");
      for (const key of Object.keys(getSettings().shortcuts)) {
        if (key !== sk && getSettings().shortcuts[key] === shortcutString) {
          getSettings().shortcuts[key] = "";
          $(`#shortcut_${key}`).val("");
          toastr.info(
            `快捷键 ${shortcutString} 已从"${getButtonLabel(key)}"改绑到"${getButtonLabel(sk)}"`,
            "",
            { timeOut: 1500 },
          );
        }
      }
      getSettings().shortcuts[sk] = shortcutString;
      saveSettingsDebounced();
    });
  $(".shortcut-clear-btn")
    .off("click")
    .on("click", function () {
      const targetId = $(this).data("target");
      $(`#${targetId}`).val("");
      const sk = targetId.replace("shortcut_", "");
      getSettings().shortcuts[sk] = "";
      saveSettingsDebounced();
    });
}

function handleGlobalShortcuts(e) {
  if (
    !getSettings().enabled ||
    $(document.activeElement).hasClass("shortcut-input")
  )
    return;
  let keys = [];
  if (e.ctrlKey) keys.push("Ctrl");
  if (e.metaKey) keys.push("Meta");
  if (e.altKey) keys.push("Alt");
  if (e.shiftKey) keys.push("Shift");
  if (e.key && !["Control", "Alt", "Shift", "Meta"].includes(e.key)) {
    keys.push(e.key.length === 1 ? e.key.toUpperCase() : e.key);
  }
  if (keys.length <= 1) return;
  const shortcutString = keys.join("+");
  const shortcuts = getSettings().shortcuts;
  for (const key in shortcuts) {
    if (shortcuts[key] === shortcutString) {
      const isSendTextarea = document.activeElement === getMessageInput()[0];
      if (key === "colorPicker") {
      } else if (isInputButton(key)) {
        if (!isSendTextarea) return;
      } else {
        const tag = document.activeElement?.tagName;
        const isEditable =
          tag === "INPUT" ||
          tag === "TEXTAREA" ||
          document.activeElement?.isContentEditable;
        if (isEditable && !isSendTextarea) return;
      }
      e.preventDefault();
      const action = getActionForKey(key);
      if (action) action();
      return;
    }
  }
}

function initSortable() {
  try {
    if (!$("#integrated_button_settings").sortable) return;
    try {
      if ($("#integrated_button_settings").hasClass("ui-sortable")) {
        $("#integrated_button_settings").sortable("destroy");
      }
    } catch (e) {}
    $("#integrated_button_settings").sortable({
      handle: ".drag-handle",
      axis: "y",
      delay: 150,
      items: "> .integrated-button-row",
      connectWith: ".ih-folder-children",
      start: function (_, ui) {
        const key = ui.item.attr("data-button-key");
        if (key && key.startsWith("folder_")) {
          const fi = parseInt(key.replace("folder_", ""));
          const folder = (getSettings().folders || [])[fi];
          if (!folder || !folder.collapsed) {
            $(`.ih-folder-children[data-folder-index="${fi}"]`).addClass(
              "ih-collapsed",
            );
          }
        }
        ui.item.data("ih-source", "root");
        ui.item.data("ih-source-folder", null);
      },
      receive: function (_, ui) {
        const key = ui.item.attr("data-button-key");
        if (!key) return;
        if (key.startsWith("folder_")) {
          $(this).sortable("cancel");
          return;
        }
        const srcFi = ui.item.data("ih-source-folder");
        if (srcFi !== null && srcFi !== undefined) {
          const srcFolder = getSettings().folders[srcFi];
          if (srcFolder) {
            const idx = srcFolder.buttons.indexOf(key);
            if (idx > -1) srcFolder.buttons.splice(idx, 1);
          }
          ui.item.removeClass("ih-child-row");
          ui.item.removeAttr("data-is-child");
          ui.item.find(".ih-child-remove-btn").remove();
          const newOrder = [];
          $("#integrated_button_settings")
            .children(".integrated-button-row")
            .each(function () {
              const k = $(this).attr("data-button-key");
              if (k) newOrder.push(k);
            });
          getSettings().buttonOrder = newOrder;
          saveSettingsDebounced();
        }
      },
      stop: function () {
        const newOrder = [];
        const container = $("#integrated_button_settings");
        container.children(".integrated-button-row").each(function () {
          const key = $(this).attr("data-button-key");
          if (key) {
            newOrder.push(key);
          }
        });
        getSettings().buttonOrder = newOrder;
        saveSettingsDebounced();
        container
          .children(".integrated-button-row[data-folder-row='true']")
          .each(function () {
            const fi = parseInt($(this).attr("data-folder-index"));
            const childrenDiv = $(
              `.ih-folder-children[data-folder-index="${fi}"]`,
            );
            if (childrenDiv.length) $(this).after(childrenDiv);
          });
        setTimeout(() => {
          renderFolderSettings();
          renderSettingsPanel();
          buildToolbar();
        }, 50);
      },
    });
    $(".ih-folder-children").each(function () {
      const fi = parseInt($(this).attr("data-folder-index"));
      try {
        if ($(this).hasClass("ui-sortable")) {
          $(this).sortable("destroy");
        }
      } catch (e) {}
      $(this).sortable({
        handle: ".drag-handle",
        axis: "y",
        delay: 150,
        items: "> .integrated-button-row",
        connectWith: "#integrated_button_settings, .ih-folder-children",
        start: function (_, ui) {
          const key = ui.item.attr("data-button-key");
          if (key && key.startsWith("folder_")) {
            $(this).sortable("cancel");
            return;
          }
          ui.item.data("ih-source", "folder");
          ui.item.data("ih-source-folder", fi);
        },
        receive: function (_, ui) {
          const key = ui.item.attr("data-button-key");
          if (!key) return;
          if (key.startsWith("folder_")) {
            $(this).sortable("cancel");
            return;
          }
          const targetFi = parseInt($(this).attr("data-folder-index"));
          const srcFi = ui.item.data("ih-source-folder");
          if (srcFi !== null && srcFi !== undefined) {
            const srcFolder = getSettings().folders[srcFi];
            if (srcFolder) {
              const idx = srcFolder.buttons.indexOf(key);
              if (idx > -1) srcFolder.buttons.splice(idx, 1);
            }
          } else {
            const orderIdx = getSettings().buttonOrder.indexOf(key);
            if (orderIdx > -1) getSettings().buttonOrder.splice(orderIdx, 1);
          }
          if (!getSettings().folders[targetFi].buttons)
            getSettings().folders[targetFi].buttons = [];
          if (!ui.item.hasClass("ih-child-row"))
            ui.item.addClass("ih-child-row");
          const newChildOrder = [];
          $(this)
            .children(".integrated-button-row")
            .each(function () {
              const k = $(this).attr("data-button-key");
              if (k) newChildOrder.push(k);
            });
          getSettings().folders[targetFi].buttons = newChildOrder;
          saveSettingsDebounced();
        },
        stop: function () {
          const targetFi = parseInt($(this).attr("data-folder-index"));
          const newChildOrder = [];
          $(this)
            .children(".integrated-button-row")
            .each(function () {
              const key = $(this).attr("data-button-key");
              if (key) newChildOrder.push(key);
            });
          getSettings().folders[targetFi].buttons = newChildOrder;
          saveSettingsDebounced();
          setTimeout(() => {
            renderSettingsPanel();
            buildToolbar();
          }, 50);
        },
      });
    });
  } catch (error) {
    console.error("初始化按钮排序功能失败:", error);
  }
}

async function loadSettings() {
  extension_settings[extensionName] = extension_settings[extensionName] || {};
  if (Object.keys(extension_settings[extensionName]).length === 0) {
    Object.assign(
      extension_settings[extensionName],
      structuredClone(defaultSettings),
    );
  }
  const s = getSettings();
  if (!s.buttons) s.buttons = {};
  for (const [key, val] of Object.entries(defaultSettings.buttons)) {
    if (s.buttons[key] === undefined) s.buttons[key] = val;
  }
  if (!s.shortcuts) s.shortcuts = {};
  for (const key of Object.keys(defaultSettings.shortcuts)) {
    if (s.shortcuts[key] === undefined) s.shortcuts[key] = "";
  }
  if (!s.buttonOrder) s.buttonOrder = [...defaultSettings.buttonOrder];
  const obsoleteKeys = ["tab", "chatList", "multiSelectDelete", "jumpToFloor"];
  obsoleteKeys.forEach((k) => {
    const idx = s.buttonOrder.indexOf(k);
    if (idx > -1) s.buttonOrder.splice(idx, 1);
    delete s.buttons[k];
    delete s.shortcuts[k];
  });
  for (const key of defaultSettings.buttonOrder) {
    if (!s.buttonOrder.includes(key)) s.buttonOrder.push(key);
  }
  if (!s.customSymbols) s.customSymbols = [];
  if (!s.folders) s.folders = [];
  if (!s.transferHistory || typeof s.transferHistory !== "object")
    s.transferHistory = {};
  if (!s.colorPicker) s.colorPicker = { x: null, y: null, width: 0, height: 0 };
  if (s.enabled === undefined) s.enabled = true;
  if (s.confirmDangerousActions === undefined)
    s.confirmDangerousActions = false;
  if (s.toolbarPinned === undefined) s.toolbarPinned = false;
  if (s.toolbarBtnSize === undefined) s.toolbarBtnSize = 12;
  if (s.pagingScrollRatio === undefined) s.pagingScrollRatio = 0.93;
  if (s.autoScrollSpeed === undefined) s.autoScrollSpeed = 50;
  if (s.autoScrollToAiOnStream === undefined) s.autoScrollToAiOnStream = false;
  if (s.lockScrollOnGeneration === undefined) s.lockScrollOnGeneration = false;
  if (s.twoRowMode === undefined) s.twoRowMode = false;
  if (s.twoRowOrder === undefined) s.twoRowOrder = "input-first";
  if (s.lastSeenChangelogVersion === undefined) s.lastSeenChangelogVersion = "";
  setTimeout(() => {
    const verEl = document.getElementById("ih_version_label");
    if (verEl) verEl.textContent = `v${CHANGELOG_VERSION}`;
    if (s.lastSeenChangelogVersion !== CHANGELOG_VERSION) {
      const badge = document.getElementById("ih_new_badge");
      if (badge) badge.style.display = "inline-block";
    }
    setupChangelogAutoPopup();
  }, 100);
  setTimeout(() => {
    checkRemoteUpdate();
  }, 800);
  if (s.bottomNavMode === undefined) s.bottomNavMode = false;
  bottomNavController.active = !!s.bottomNavMode;
  $(
    "#input_bottom_nav_mode_btn, " +
      ".ih-folder-dropdown-portal [data-button-key='bottomNavMode'], " +
      ".ih-floating-panel [data-button-key='bottomNavMode']",
  ).toggleClass("input-helper-btn-active", bottomNavController.active);
  if (s.includeUserNavMode === undefined) s.includeUserNavMode = false;
  includeUserNavController.active = !!s.includeUserNavMode;
  $(
    "#input_include_user_nav_mode_btn, " +
      ".ih-folder-dropdown-portal [data-button-key='includeUserNavMode'], " +
      ".ih-floating-panel [data-button-key='includeUserNavMode']",
  ).toggleClass("input-helper-btn-active", includeUserNavController.active);
  if (!s.floatingPanel) {
    s.floatingPanel = structuredClone(defaultSettings.floatingPanel);
  }
  if (s.floatingPanel.enabled === undefined) s.floatingPanel.enabled = false;
  if (s.floatingPanel.orientation === undefined)
    s.floatingPanel.orientation = "vertical";
  if (s.floatingPanel.displayMode === undefined)
    s.floatingPanel.displayMode = "ball";
  if (!s.floatingPanel.buttons) s.floatingPanel.buttons = [];
  if (!s.floatingPanel.position)
    s.floatingPanel.position = { x: null, y: null };
  if (s.floatingPanel.ballImage === undefined) s.floatingPanel.ballImage = "";
  if (s.floatingPanel.ballImageExpanded === undefined)
    s.floatingPanel.ballImageExpanded = "";
  if (s.floatingPanel.ballSize === undefined) s.floatingPanel.ballSize = 48;
  if (s.floatingPanel.ballShape === undefined)
    s.floatingPanel.ballShape = "circle";
  if (s.floatingPanel.transparentBall === undefined)
    s.floatingPanel.transparentBall = false;
  if (s.floatingPanel.followTheme === undefined)
    s.floatingPanel.followTheme = true;
  if (s.floatingPanel.buttonSize === undefined) s.floatingPanel.buttonSize = 12;
  if (s.floatingPanel.panelWidth === undefined) s.floatingPanel.panelWidth = 0;
  if (s.floatingPanel.panelMaxHeight === undefined)
    s.floatingPanel.panelMaxHeight = 0;
  if (!s.floatingPanel.ballProfiles) s.floatingPanel.ballProfiles = [];
  if (s.floatingPanel.currentProfileIndex === undefined)
    s.floatingPanel.currentProfileIndex = -1;
  if (!s.floatingPanel.panelProfiles) s.floatingPanel.panelProfiles = [];
  if (s.floatingPanel.currentPanelProfileIndex === undefined)
    s.floatingPanel.currentPanelProfileIndex = -1;
  if (s.floatingPanel.panelProfiles.length === 0) {
    s.floatingPanel.panelProfiles.push({
      name: "默认方案",
      buttons: [...(s.floatingPanel.buttons || [])],
      orientation: s.floatingPanel.orientation || "vertical",
      buttonSize: s.floatingPanel.buttonSize || 12,
      panelWidth: s.floatingPanel.panelWidth || 0,
      panelMaxHeight: s.floatingPanel.panelMaxHeight || 0,
    });
    s.floatingPanel.currentPanelProfileIndex = 0;
  }
  s.floatingPanel.panelProfiles.forEach((profile) => {
    if (profile.panelWidth === undefined) profile.panelWidth = 0;
    if (profile.panelMaxHeight === undefined) profile.panelMaxHeight = 0;
    if (profile.buttonSize === undefined) profile.buttonSize = 12;
    if (profile.orientation === undefined) profile.orientation = "vertical";
    if (!Array.isArray(profile.buttons)) profile.buttons = [];
  });
  if (s.floatingPanel.autoHide === undefined) s.floatingPanel.autoHide = false;
  s.folders.forEach((folder) => {
    if (folder.collapsed === undefined) folder.collapsed = false;
    if (!Array.isArray(folder.buttons)) folder.buttons = [];
    if (folder.icon === undefined) folder.icon = "";
    if (folder.display === undefined) folder.display = "";
    if (folder.name === undefined) folder.name = "文件夹";
    if (folder.dropdownLayout === undefined)
      folder.dropdownLayout = "horizontal";
    if (folder.dropdownPersist === undefined) folder.dropdownPersist = false;
  });
  $("#enable_input_helper").prop("checked", s.enabled);
  $("#enable_confirm_dangerous").prop("checked", s.confirmDangerousActions);
  $("#enable_toolbar_pinned").prop("checked", s.toolbarPinned);
  $("#toolbar_btn_size").val(s.toolbarBtnSize);
  $("#toolbar_btn_size_input").val(s.toolbarBtnSize);
  $("#auto_scroll_speed").val(s.autoScrollSpeed || 50);
  $("#auto_scroll_speed_input").val(s.autoScrollSpeed || 50);
  $("#paging_scroll_ratio").val(
    Math.round((s.pagingScrollRatio || 0.93) * 100),
  );
  $("#paging_scroll_ratio_input").val(
    Math.round((s.pagingScrollRatio || 0.93) * 100),
  );
  $("#enable_auto_scroll_ai_stream").prop("checked", s.autoScrollToAiOnStream);
  $("#enable_lock_scroll_generation").prop("checked", s.lockScrollOnGeneration);
  $("#enable_two_row_mode").prop("checked", s.twoRowMode);
  $("#enable_floating_panel").prop("checked", s.floatingPanel.enabled);
  loadCustomSymbolButtons();
  renderFolderSettings();
  renderFloatingPanelSettings();
  updateButtonVisibility();
  applyToolbarPinnedState();
  try {
    const _settingsPanel = document.querySelector(".input-helper-settings");
    if (_settingsPanel) {
      syncDialogTheme(_settingsPanel, { skipBg: true });
    }
  } catch (e) {}
  floatingPanelController.init();
  chatUndoManager.startWatcher();
}
function setupToolbarSwipeCollapse() {
  let startY = 0;
  let startX = 0;
  let tracking = false;

  document.addEventListener(
    "touchstart",
    function (e) {
      if (!e.touches || !e.touches[0]) return;
      const $t = $(e.target);
      if (
        $t.closest(
          ".ih-floating-ball, .ih-floating-panel, .ih-folder-dropdown-portal, " +
            ".ih-dialog-overlay, .ih-find-bar, dialog[open], .popup, #shadow_popup",
        ).length
      ) {
        tracking = false;
        return;
      }
      startY = e.touches[0].clientY;
      startX = e.touches[0].clientX;
      tracking = true;
    },
    { passive: true },
  );

  document.addEventListener(
    "touchend",
    function (e) {
      if (!tracking) return;
      tracking = false;
      if (getSettings().toolbarPinned) return;
      const sendForm = document.getElementById("send_form");
      if (!sendForm) return;
      if (
        !sendForm.classList.contains("textarea-focused") &&
        !sendForm.classList.contains("ih-external-focused")
      ) {
        return;
      }
      const t = e.changedTouches && e.changedTouches[0];
      if (!t) return;
      const dy = t.clientY - startY;
      const dx = t.clientX - startX;
      if (dy > 40 && Math.abs(dy) > Math.abs(dx) * 1.5) {
        sendForm.classList.remove("textarea-focused");
        sendForm.classList.remove("ih-external-focused");
        const ae = document.activeElement;
        if (
          ae &&
          (ae.tagName === "TEXTAREA" ||
            ae.tagName === "INPUT" ||
            ae.isContentEditable)
        ) {
          ae.blur();
        }
      }
    },
    { passive: true },
  );
}

function setupTextareaFocusTracking() {
  const textarea = document.getElementById("send_textarea");
  if (!textarea) return;
  let userInitiatedFocus = false;
  textarea.addEventListener("mousedown", function () {
    userInitiatedFocus = true;
  });
  textarea.addEventListener("touchstart", function () {
    userInitiatedFocus = true;
    if (!$("#send_form").hasClass("textarea-focused"))
      $("#send_form").addClass("textarea-focused");
  });
  let _ihPageReadyAt = Date.now();
  textarea.addEventListener("focus", function () {
    if (userInitiatedFocus) {
      $("#send_form").addClass("textarea-focused");
    } else if (Date.now() - _ihPageReadyAt < 1500) {
      return;
    }
    userInitiatedFocus = false;
  });
  textarea.addEventListener("blur", function () {
    setTimeout(() => {
      const active = document.activeElement;
      const toolbar = document.getElementById("input_helper_toolbar");
      if (toolbar && toolbar.contains(active)) return;
      if (getSettings().toolbarPinned) return;
      $("#send_form").removeClass("textarea-focused");
    }, 150);
  });
  textarea.addEventListener("click", function () {
    if (!$("#send_form").hasClass("textarea-focused"))
      $("#send_form").addClass("textarea-focused");
  });
  const toolbar = document.getElementById("input_helper_toolbar");
  if (toolbar) {
    toolbar.addEventListener("mousedown", function (e) {
      if (_lastFocusedEditable && _lastFocusedEditable.isContentEditable) {
        try {
          const doc = _lastFocusedEditable.ownerDocument || document;
          const win = doc.defaultView || window;
          const sel = win.getSelection();
          if (sel && sel.rangeCount > 0) {
            _savedRange = sel.getRangeAt(0).cloneRange();
          }
        } catch (err) {}
      }
      if ($(e.target).closest(".ih-folder-btn").length) return;
      e.preventDefault();
    });
  }
  if (
    textarea &&
    document.activeElement === textarea &&
    getSettings().toolbarPinned
  ) {
    $("#send_form").addClass("textarea-focused");
  }
}

function setupInputTracking() {
  $(document).off(
    "beforeinput.inputHelper",
    "#send_textarea, #prompt_textarea",
  );
  $(document).off("input.inputHelper", "#send_textarea, #prompt_textarea");

  $(document).on(
    "beforeinput.inputHelper",
    "#send_textarea, #prompt_textarea",
    function () {
      historyManager.onBeforeInput();
    },
  );

  $(document).on(
    "input.inputHelper",
    "#send_textarea, #prompt_textarea",
    function () {
      historyManager.onInput();
      if (shiftMode.active) shiftMode.deactivate();
    },
  );
}

function setupGlobalDropdownClose() {
  let lastViewportChangeTime = 0;
  if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", function () {
      lastViewportChangeTime = Date.now();
    });
  }
  $(document).on("click", function (e) {
    if (Date.now() - lastViewportChangeTime < 500) return;
    if (
      !$(e.target).closest(".ih-folder-btn").length &&
      !$(e.target).closest(".ih-folder-dropdown-portal").length
    ) {
      closeNonPersistFolderDropdowns();
    }
  });
}

function setupGlobalFocusTracking() {
  const sendForm = document.getElementById("send_form");
  const sendTextarea = document.getElementById("send_textarea");

  function markExternalFocused() {
    if (sendForm) sendForm.classList.add("ih-external-focused");
  }

  function clearExternalFocused() {
    if (sendForm) sendForm.classList.remove("ih-external-focused");
  }

  function isOurUiElement(el) {
    if (!el) return false;
    try {
      if (el.ownerDocument !== document) return false;
      return (
        $(el).closest(
          "#input_helper_toolbar, .ih-find-bar, .ih-folder-dropdown-portal, " +
            ".ih-floating-panel, .ih-floating-ball, .ih-dialog-overlay, " +
            ".input-helper-settings, #extensions_settings, #extensions_settings2, " +
            ".ih-color-picker-portal",
        ).length > 0
      );
    } catch (e) {
      return false;
    }
  }

  function handleOutsideInteraction(e) {
    const target = e.target;
    if (!target) return;
    if (isEditableElement(target)) return;
    if (isOurUiElement(target)) return;
    if (target === sendTextarea) return;
    _lastFocusedEditable = null;
    clearExternalFocused();
  }

  document.addEventListener(
    "focusin",
    function (e) {
      const el = e.target;
      if (!isEditableElement(el)) {
        return;
      }
      try {
        const $el = $(el);
        if (
          !$el.closest(
            ".ih-dialog-overlay, #input_helper_toolbar, " +
              ".ih-find-bar, .ih-folder-dropdown-portal, .ih-floating-panel, " +
              ".shortcut-input",
          ).length
        ) {
          _lastFocusedForScroll = el;
        }
      } catch (ex) {}
      if (shouldIgnoreFocusedElement(el)) {
        return;
      }
      if (el === sendTextarea) {
        clearExternalFocused();
        return;
      }
      _lastFocusedEditable = el;
      markExternalFocused();
      historyManager.ensureExternalHistory(el);
      historyManager.updateButtons();
      if (shiftMode.active) {
        const cmView = getCodeMirrorView(el);
        const nextTarget = cmView ? cmView.contentDOM : el;
        if (shiftMode._targetEl && shiftMode._targetEl !== nextTarget) {
          shiftMode.deactivate(true);
          setTimeout(() => {
            if (
              el.ownerDocument &&
              el.ownerDocument.contains(el) &&
              !shouldIgnoreFocusedElement(el)
            ) {
              _lastFocusedEditable = el;
              shiftMode.activate(true);
            }
          }, 0);
        }
      }
      if (findReplaceController.active && findReplaceController._barEl) {
        setTimeout(() => {
          try {
            if (!findReplaceController.active) return;
            if (!el.ownerDocument || !el.ownerDocument.contains(el)) return;
            if (shouldIgnoreFocusedElement(el)) return;
            findReplaceController._doSearch();
          } catch (e) {}
        }, 0);
      }
    },
    true,
  );
  document.addEventListener(
    "beforeinput",
    function (e) {
      const el = e.target;
      if (!isEditableElement(el)) return;
      if (shouldIgnoreFocusedElement(el)) return;
      if (el === sendTextarea) return;
      if (el.isContentEditable) return;
      historyManager.onExternalBeforeInput(el);
    },
    true,
  );

  document.addEventListener(
    "input",
    function (e) {
      const el = e.target;
      if (!isEditableElement(el)) return;
      if (shouldIgnoreFocusedElement(el)) return;
      if (el === sendTextarea) return;
      if (el.isContentEditable) return;
      historyManager.onExternalInput(el);
    },
    true,
  );

  document.addEventListener("mousedown", handleOutsideInteraction, true);
  document.addEventListener("touchstart", handleOutsideInteraction, {
    capture: true,
    passive: true,
  });

  function attachToIframe(iframe) {
    try {
      const doc = iframe.contentDocument;
      if (!doc || doc.__ihFocusAttached) return;
      doc.__ihFocusAttached = true;
      doc.addEventListener(
        "focusin",
        function (e) {
          const el = e.target;
          if (!isEditableElement(el)) return;
          _lastFocusedEditable = el;
          markExternalFocused();
          historyManager.ensureExternalHistory(el);
          historyManager.updateButtons();
        },
        true,
      );
      doc.addEventListener(
        "beforeinput",
        function (e) {
          const el = e.target;
          if (!isEditableElement(el)) return;
          if (el.isContentEditable) return;
          historyManager.onExternalBeforeInput(el);
        },
        true,
      );
      doc.addEventListener(
        "input",
        function (e) {
          const el = e.target;
          if (!isEditableElement(el)) return;
          if (el.isContentEditable) return;
          historyManager.onExternalInput(el);
        },
        true,
      );
      doc.addEventListener(
        "mousedown",
        function (e) {
          const target = e.target;
          if (!target) return;
          if (isEditableElement(target)) return;
          _lastFocusedEditable = null;
          clearExternalFocused();
        },
        true,
      );
      doc.addEventListener(
        "touchstart",
        function (e) {
          const target = e.target;
          if (!target) return;
          if (isEditableElement(target)) return;
          _lastFocusedEditable = null;
          clearExternalFocused();
        },
        { capture: true, passive: true },
      );

      doc.querySelectorAll("iframe").forEach((nestedIfr) => {
        attachToIframe(nestedIfr);
        nestedIfr.addEventListener("load", () => attachToIframe(nestedIfr));
      });

      try {
        const nestedObs = new MutationObserver((muts) => {
          muts.forEach((m) => {
            m.addedNodes.forEach((n) => {
              if (!n.tagName) return;
              if (n.tagName === "IFRAME") {
                attachToIframe(n);
                n.addEventListener("load", () => attachToIframe(n));
              } else if (n.querySelectorAll) {
                n.querySelectorAll("iframe").forEach((ifr) => {
                  attachToIframe(ifr);
                  ifr.addEventListener("load", () => attachToIframe(ifr));
                });
              }
            });
          });
        });
        if (doc.body) {
          nestedObs.observe(doc.body, { childList: true, subtree: true });
        } else {
          iframe.addEventListener("load", () => {
            try {
              if (doc.body) {
                nestedObs.observe(doc.body, { childList: true, subtree: true });
              }
            } catch (e) {}
          });
        }
      } catch (e) {}
    } catch (err) {}
  }

  document.querySelectorAll("iframe").forEach(attachToIframe);
  document.querySelectorAll("iframe").forEach((ifr) => {
    ifr.addEventListener("load", () => attachToIframe(ifr));
  });

  try {
    let _iframeScanTimer = null;
    const scanAllIframes = () => {
      document.querySelectorAll("iframe").forEach((ifr) => {
        attachToIframe(ifr);
        if (!ifr.__ihLoadBound) {
          ifr.__ihLoadBound = true;
          ifr.addEventListener("load", () => attachToIframe(ifr));
        }
      });
    };
    const obs = new MutationObserver(() => {
      clearTimeout(_iframeScanTimer);
      _iframeScanTimer = setTimeout(scanAllIframes, 300);
    });
    obs.observe(document.body, { childList: true, subtree: true });
  } catch (e) {}
}

function setupVolumeKeyPaging() {
  const DOUBLE_TAP_MS = 350;
  let lastPageUpTime = 0;
  let lastPageDownTime = 0;
  let pageUpPending = null;
  let pageDownPending = null;
  document.addEventListener(
    "keydown",
    function (e) {
      if (!getSettings().enabled) return;
      if (!pagingController.active) return;
      if (e.repeat) return;
      if (e.key === "PageUp" || e.key === "AudioVolumeUp") {
        e.preventDefault();
        const now = Date.now();
        if (now - lastPageUpTime < DOUBLE_TAP_MS) {
          clearTimeout(pageUpPending);
          pageUpPending = null;
          lastPageUpTime = 0;
          doScrollToLastAi();
          toastr.info("跳转到AI最新消息", "", { timeOut: 1000 });
        } else {
          lastPageUpTime = now;
          clearTimeout(pageUpPending);
          pageUpPending = setTimeout(() => {
            pagingController.pageUp();
            pageUpPending = null;
          }, DOUBLE_TAP_MS);
        }
      } else if (e.key === "PageDown" || e.key === "AudioVolumeDown") {
        e.preventDefault();
        const now = Date.now();
        if (now - lastPageDownTime < DOUBLE_TAP_MS) {
          clearTimeout(pageDownPending);
          pageDownPending = null;
          lastPageDownTime = 0;
          doScrollToBottom();
          toastr.info("跳转到聊天底部", "", { timeOut: 1000 });
        } else {
          lastPageDownTime = now;
          clearTimeout(pageDownPending);
          pageDownPending = setTimeout(() => {
            pagingController.pageDown();
            pageDownPending = null;
          }, DOUBLE_TAP_MS);
        }
      }
    },
    true,
  );
}

function setupNavFlagClearOnUserScroll() {
  const chatEl = document.getElementById("chat");
  if (!chatEl) return;
  const clearFlag = () => {
    if (messageNavigation._pendingJump !== null) {
      messageNavigation._pendingJump = null;
    }
  };
  chatEl.addEventListener("wheel", clearFlag, { passive: true });
  chatEl.addEventListener("touchmove", clearFlag, { passive: true });
}

function setupAutoScrollPauseOnUserScroll() {
  let userScrollTimeout = null;
  let pausedEl = null;
  let pausedTop = 0;

  const pauseAndScheduleResume = (e) => {
    if (!autoScrollController.active) return;

    const currentEl =
      autoScrollController._chatEl || findActiveScrollContainer();
    if (!currentEl) return;

    if (
      e &&
      e.target &&
      currentEl !== e.target &&
      !currentEl.contains(e.target)
    ) {
      return;
    }

    pausedEl = currentEl;
    pausedTop = currentEl.scrollTop;

    autoScrollController.pause();

    clearTimeout(userScrollTimeout);
    userScrollTimeout = setTimeout(() => {
      if (
        pausedEl &&
        pausedEl.ownerDocument &&
        pausedEl.ownerDocument.contains(pausedEl)
      ) {
        autoScrollController._chatEl = pausedEl;

        if (pausedEl.scrollTop === 0 && pausedTop > 20) {
          pausedEl.scrollTop = pausedTop;
        }

        autoScrollController._lastKnownScrollEl = pausedEl;
        autoScrollController._lastKnownScrollTop = Math.max(
          pausedEl.scrollTop,
          pausedTop,
        );
      }

      autoScrollController.resume();
    }, 2000);
  };

  document.addEventListener("wheel", pauseAndScheduleResume, {
    passive: true,
    capture: true,
  });

  document.addEventListener("touchmove", pauseAndScheduleResume, {
    passive: true,
    capture: true,
  });
}

jQuery(async () => {
  const hiddenCSS = document.createElement("style");
  hiddenCSS.textContent = `
        #form_sheld #send_form #input_helper_toolbar.input-helper-toolbar.input-helper-hidden,
        #form_sheld #send_form.textarea-focused #input_helper_toolbar.input-helper-toolbar.input-helper-hidden,
        #input_helper_toolbar.input-helper-hidden,
        #send_form.textarea-focused #input_helper_toolbar.input-helper-hidden {
            display: none !important;
            max-height: 0 !important;
            opacity: 0 !important;
            overflow: hidden !important;
            padding: 0 !important;
            margin: 0 !important;
            border: none !important;
            pointer-events: none !important;
        }
        #input_helper_toolbar .input-helper-btn i[class*="fa-"],
        #input_helper_toolbar .ih-folder-btn i[class*="fa-"] {
            font-size: 11px !important;
            color: inherit !important;
            visibility: visible !important;
        }
        .ih-mgr-shared-list-area.ih-mgr-insert-mode .ih-mgr-msg-check {
            display: none !important;
        }
        .ih-mgr-shared-list-area.ih-mgr-insert-mode #ih_mgr_select_all,
        .ih-mgr-shared-list-area.ih-mgr-insert-mode #ih_mgr_invert,
        .ih-mgr-shared-list-area.ih-mgr-insert-mode #ih_mgr_range_toggle,
        .ih-mgr-shared-list-area.ih-mgr-insert-mode #ih_mgr_clear,
        .ih-mgr-shared-list-area.ih-mgr-insert-mode #ih_mgr_count {
            display: none !important;
        }
    `;
  document.head.appendChild(hiddenCSS);
  ensureFeatherLoaded();
  ensureBootstrapIconsLoaded();
  extension_settings[extensionName] = extension_settings[extensionName] || {};
  const settingsHtml = await $.get(`${extensionFolderPath}/settings.html`);
  $("#extensions_settings2").prepend(settingsHtml);

  const toolbarHtml = await $.get(`${extensionFolderPath}/toolbar.html`);
  if ($("#qr--bar").length) {
    $("#qr--bar").after(toolbarHtml);
    $("#send_form").css("display", "flex");
    $("#send_form").css("flex-direction", "column");
    $("#qr--bar").css("order", "1");
    $("#input_helper_toolbar").css("order", "2");
  } else {
    $("#file_form").after(toolbarHtml);
  }

  const isMobile = ihIsMobileDevice();
  if (isMobile) {
    $("#input_helper_toolbar").on("mousedown", function (e) {
      if ($(e.target).closest(".ih-folder-btn").length) return;
      e.preventDefault();
    });
  }

  if (!$("#input_edit_last_msg_btn").length) {
    const editLastBtn = $(
      '<button id="input_edit_last_msg_btn" class="input-helper-btn" title="编辑最后消息"><i class="bi bi-pencil-fill"></i></button>',
    );
    $("#input_helper_toolbar").append(editLastBtn);
  }
  if (!$("#input_generate_swipe_btn").length) {
    const generateSwipeBtn = $(
      '<button id="input_generate_swipe_btn" class="input-helper-btn" title="生成备选回复"><i class="fa-solid fa-shuffle"></i></button>',
    );
    $("#input_helper_toolbar").append(generateSwipeBtn);
  }
  if (!$("#input_open_qr_assistant_btn").length) {
    const qrAssistantBtn = $(
      '<button id="input_open_qr_assistant_btn" class="input-helper-btn" title="QR助手面板"><i class="fa-solid fa-rocket"></i></button>',
    );
    $("#input_helper_toolbar").append(qrAssistantBtn);
  }
  if (!$("#input_open_chatu8_btn").length) {
    const chatU8Btn = $(
      '<button id="input_open_chatu8_btn" class="input-helper-btn" title="智绘姬面板"><i class="fa-solid fa-paintbrush"></i></button>',
    );
    $("#input_helper_toolbar").append(chatU8Btn);
  }
  if (!$("#input_switch_panel_profile_btn").length) {
    const switchPanelBtn = $(
      '<button id="input_switch_panel_profile_btn" class="input-helper-btn" title="切换面板方案"><i class="fa-solid fa-layer-group"></i></button>',
    );
    $("#input_helper_toolbar").append(switchPanelBtn);
  }
  if (!$("#input_bottom_nav_mode_btn").length) {
    const bottomNavBtn = $(
      '<button id="input_bottom_nav_mode_btn" class="input-helper-btn" title="底部跳转模式"><i class="fa-solid fa-angle-double-down"></i></button>',
    );
    $("#input_helper_toolbar").append(bottomNavBtn);
  }
  if (!$("#input_include_user_nav_mode_btn").length) {
    const includeUserNavBtn = $(
      '<button id="input_include_user_nav_mode_btn" class="input-helper-btn" title="包含用户消息导航"><i class="fa-solid fa-arrows-up-down"></i></button>',
    );
    $("#input_helper_toolbar").append(includeUserNavBtn);
  }
  if (!$("#input_enter_delete_mode_btn").length) {
    const enterDelBtn = $(
      '<button id="input_enter_delete_mode_btn" class="input-helper-btn" title="进入删除模式"><i class="fa-solid fa-trash-can"></i></button>',
    );
    $("#input_helper_toolbar").append(enterDelBtn);
  }
  if (!$("#input_copy_text_btn").length) {
    const copyBtn = $(
      '<button id="input_copy_text_btn" class="input-helper-btn" title="复制"><i class="fa-solid fa-copy"></i></button>',
    );
    $("#input_helper_toolbar").append(copyBtn);
  }
  if (!$("#input_paste_text_btn").length) {
    const pasteBtn = $(
      '<button id="input_paste_text_btn" class="input-helper-btn" title="粘贴"><i class="fa-solid fa-paste"></i></button>',
    );
    $("#input_helper_toolbar").append(pasteBtn);
  }
  if (!$("#input_wrap_toggle_btn").length) {
    const wrapBtn = $(
      '<button id="input_wrap_toggle_btn" class="input-helper-btn" title="选中包裹模式"><i class="fa-solid fa-object-group"></i></button>',
    );
    $("#input_helper_toolbar").append(wrapBtn);
  }
  if (!$("#input_cursor_left_btn").length) {
    const cursorLeftBtn = $(
      '<button id="input_cursor_left_btn" class="input-helper-btn" title="光标左移（按住连续移动）"><i class="fa-solid fa-caret-left"></i></button>',
    );
    $("#input_helper_toolbar").append(cursorLeftBtn);
  }
  if (!$("#input_cursor_right_btn").length) {
    const cursorRightBtn = $(
      '<button id="input_cursor_right_btn" class="input-helper-btn" title="光标右移（按住连续移动）"><i class="fa-solid fa-caret-right"></i></button>',
    );
    $("#input_helper_toolbar").append(cursorRightBtn);
  }
  if (!$("#input_chat_undo_btn").length) {
    const chatUndoBtn = $(
      '<button id="input_chat_undo_btn" class="input-helper-btn input-helper-btn-disabled" title="撤回删除"><i class="fa-solid fa-trash-arrow-up"></i></button>',
    );
    $("#input_helper_toolbar").append(chatUndoBtn);
  }
  if (!$("#input_chat_manager_btn").length) {
    $("#input_helper_toolbar").append(
      '<button id="input_chat_manager_btn" class="input-helper-btn" title="聊天管理器"><i class="fa-solid fa-address-book"></i></button>',
    );
  }
  if (!$("#input_chat_new_btn").length) {
    $("#input_helper_toolbar").append(
      '<button id="input_chat_new_btn" class="input-helper-btn" title="新建聊天"><i class="fa-solid fa-comments"></i></button>',
    );
  }
  if (!$("#input_chat_rename_btn").length) {
    $("#input_helper_toolbar").append(
      '<button id="input_chat_rename_btn" class="input-helper-btn" title="重命名聊天"><i class="fa-solid fa-pen-to-square"></i></button>',
    );
  }
  if (!$("#input_chat_delete_btn").length) {
    $("#input_helper_toolbar").append(
      '<button id="input_chat_delete_btn" class="input-helper-btn" title="删除聊天"><i class="fa-solid fa-comment-slash"></i></button>',
    );
  }
  if (!$("#input_chat_close_btn").length) {
    $("#input_helper_toolbar").append(
      '<button id="input_chat_close_btn" class="input-helper-btn" title="关闭聊天"><i class="fa-solid fa-xmark"></i></button>',
    );
  }
  if (!$("#input_quick_hide_btn").length) {
    $("#input_helper_toolbar").append(
      '<button id="input_quick_hide_btn" class="input-helper-btn" title="快速隐藏（连续点击依次隐藏更多消息）"><i class="fa-solid fa-eye-low-vision"></i></button>',
    );
  }
  if (!$("#input_find_replace_btn").length) {
    $("#input_helper_toolbar").append(
      '<button id="input_find_replace_btn" class="input-helper-btn" title="查找替换"><i class="fa-solid fa-magnifying-glass"></i></button>',
    );
  }
  if (!$("#input_send_stop_btn").length) {
    const sendStopBtn = $(
      '<button id="input_send_stop_btn" class="input-helper-btn" title="发送"></button>',
    );
    sendStopBtn.html(getFeatherSendSvg());
    $("#input_helper_toolbar").append(sendStopBtn);
  }

  if (!$("#input_reset_floating_ball_btn").length) {
    const resetBallBtn = $(
      '<button id="input_reset_floating_ball_btn" class="input-helper-btn" title="重置悬浮球位置"><i class="fa-solid fa-arrows-to-dot"></i></button>',
    );
    $("#input_helper_toolbar").append(resetBallBtn);
  }

  if (!$("#input_color_picker_btn").length) {
    const colorPickerBtn = $(
      '<button id="input_color_picker_btn" class="input-helper-btn" title="取色器"><i class="fa-solid fa-eye-dropper"></i></button>',
    );
    $("#input_helper_toolbar").append(colorPickerBtn);
  }

  ALL_BUTTON_KEYS.forEach((key) => {
    const btnId = getButtonIdFromKey(key);
    const btn = $(`#${btnId}`);
    if (btn.length) bindButtonAction(btn, key);
  });
  sendStopController._update();

  $("#enable_input_helper").on("change", onEnableInputChange);
  $("#enable_confirm_dangerous").on("change", function () {
    getSettings().confirmDangerousActions = $(this).prop("checked");
    saveSettingsDebounced();
  });

  if (!$("#enable_toolbar_pinned").length) {
    const pinnedRow = $(`
            <div class="ih-switch-row">
                <label class="ih-switch-label" for="enable_toolbar_pinned">
                    <i class="fa-solid fa-thumbtack"></i>
                    工具栏固定展开
                </label>
                <label class="ih-toggle">
                    <input id="enable_toolbar_pinned" type="checkbox" />
                    <span class="ih-toggle-slider"></span>
                </label>
            </div>
        `);
    const dangerRow = $("#enable_confirm_dangerous").closest(".ih-switch-row");
    if (dangerRow.length) dangerRow.after(pinnedRow);
    else $(".input-helper-settings .ih-section-main").first().append(pinnedRow);
  }

  $("#enable_toolbar_pinned").on("change", function () {
    getSettings().toolbarPinned = $(this).prop("checked");
    saveSettingsDebounced();
    applyToolbarPinnedState();
  });

  $(document).on("change", "#enable_auto_scroll_ai_stream", function () {
    getSettings().autoScrollToAiOnStream = $(this).prop("checked");
    saveSettingsDebounced();
  });

  if (!$("#enable_lock_scroll_generation").length) {
    const lockScrollRow = $(`
            <div class="ih-switch-row">
                <label class="ih-switch-label" for="enable_lock_scroll_generation">
                    <i class="fa-solid fa-lock"></i>
                    续写时锁定滚动位置
                </label>
                <label class="ih-toggle">
                    <input id="enable_lock_scroll_generation" type="checkbox" />
                    <span class="ih-toggle-slider"></span>
                </label>
            </div>
        `);
    const streamRow = $("#enable_auto_scroll_ai_stream").closest(
      ".ih-switch-row",
    );
    if (streamRow.length) streamRow.after(lockScrollRow);
    else
      $(".input-helper-settings .ih-section-main")
        .first()
        .append(lockScrollRow);
  }
  $("#enable_lock_scroll_generation").prop(
    "checked",
    getSettings().lockScrollOnGeneration,
  );
  $(document).on("change", "#enable_lock_scroll_generation", function () {
    getSettings().lockScrollOnGeneration = $(this).prop("checked");
    saveSettingsDebounced();
  });

  $(document).on("change", "#enable_two_row_mode", function () {
    getSettings().twoRowMode = $(this).prop("checked");
    saveSettingsDebounced();
    buildToolbar();
    $("#ih_two_row_order_row").toggle($(this).prop("checked"));
  });

  if (!$("#ih_two_row_order_row").length) {
    const orderRow = $(`
            <div class="ih-switch-row" id="ih_two_row_order_row" style="display:${getSettings().twoRowMode ? "flex" : "none"};">
                <label class="ih-switch-label" style="font-size:12px;">
                    <i class="fa-solid fa-arrow-up-arrow-down" style="width:16px;text-align:center;opacity:0.6;"></i>
                    栏位顺序
                </label>
                <select id="ih_two_row_order" style="width:auto;padding:4px 8px;border:1px solid var(--SmartThemeBorderColor);border-radius:5px;background:var(--SmartThemeBlurTintColor);color:var(--SmartThemeBodyColor);font-size:12px;">
                    <option value="input-first" ${getSettings().twoRowOrder === "input-first" ? "selected" : ""}>字符栏在上</option>
                    <option value="function-first" ${getSettings().twoRowOrder === "function-first" ? "selected" : ""}>功能栏在上</option>
                </select>
            </div>
        `);
    const twoRowToggle = $("#enable_two_row_mode").closest(".ih-switch-row");
    if (twoRowToggle.length) twoRowToggle.after(orderRow);
  }

  $(document).on("change", "#ih_two_row_order", function () {
    getSettings().twoRowOrder = $(this).val();
    saveSettingsDebounced();
    buildToolbar();
  });

  $(document).on("change", "#enable_floating_panel", function () {
    getSettings().floatingPanel.enabled = $(this).prop("checked");
    saveSettingsDebounced();
    floatingPanelController.refresh();
    buildToolbar();
  });
  const leftContainer = $("#ih_settings_top_left");
  if (leftContainer.length) {
    const beautyBtn =
      $(`<div id="ih_open_beauty_prompt_btn" class="menu_button menu_button_icon" title="获取美化 CSS 的提示词" style="cursor:pointer;">
            <i class="fa-solid fa-palette"></i>
            <span>美化指南</span>
        </div>`);
    leftContainer.append(beautyBtn);
  }
  $("#ih_open_changelog_btn, #ih_open_help_btn").each(function () {
    const $b = $(this);
    if (!$b.hasClass("menu_button")) $b.addClass("menu_button");
    if (!$b.hasClass("menu_button_icon")) $b.addClass("menu_button_icon");
    $b.css("cursor", "pointer");
  });

  $(document).on("click", "#ih_open_beauty_prompt_btn", function () {
    openBeautyPromptPanel();
  });
  $(document).on("click", "#ih_open_changelog_btn", function () {
    openChangelogPanel();
  });
  $(document).on("click", "#ih_open_help_btn", function () {
    openHelpPanel();
  });
  $(document).on("click", "#ih_fp_reset_pos_header", function (e) {
    e.stopPropagation();
    getSettings().floatingPanel.position = { x: null, y: null };
    saveSettingsDebounced();
    floatingPanelController.refresh();
    toastr.info("悬浮面板位置已重置", "", { timeOut: 1000 });
  });
  $(document).on("input", "#auto_scroll_speed", function () {
    const val = parseInt($(this).val());
    getSettings().autoScrollSpeed = val;
    $("#auto_scroll_speed_input").val(val);
    saveSettingsDebounced();
    autoScrollController._speed = val;
  });
  $(document).on("input change", "#auto_scroll_speed_input", function () {
    let val = parseInt($(this).val());
    if (isNaN(val)) val = 50;
    val = Math.max(1, Math.min(1000, val));
    $(this).val(val);
    getSettings().autoScrollSpeed = val;
    $("#auto_scroll_speed").val(val);
    saveSettingsDebounced();
    autoScrollController._speed = val;
  });

  $(document).on("input", "#toolbar_btn_size", function () {
    let val = parseInt($(this).val());
    if (isNaN(val)) val = 12;
    val = Math.max(8, Math.min(24, val));
    getSettings().toolbarBtnSize = val;
    $("#toolbar_btn_size_input").val(val);
    saveSettingsDebounced();
    applyToolbarButtonSize();
  });

  $(document).on("input change", "#toolbar_btn_size_input", function () {
    let val = parseInt($(this).val());
    if (isNaN(val)) val = 12;
    val = Math.max(8, Math.min(24, val));
    $(this).val(val);
    getSettings().toolbarBtnSize = val;
    $("#toolbar_btn_size").val(Math.max(10, Math.min(20, val)));
    saveSettingsDebounced();
    applyToolbarButtonSize();
  });

  $(document).on("input", "#paging_scroll_ratio", function () {
    let val = parseInt($(this).val());
    if (isNaN(val)) val = 93;
    val = Math.max(10, Math.min(200, val));
    getSettings().pagingScrollRatio = val / 100;
    $("#paging_scroll_ratio_input").val(val);
    saveSettingsDebounced();
  });

  $(document).on("input change", "#paging_scroll_ratio_input", function () {
    let val = parseInt($(this).val());
    if (isNaN(val)) val = 93;
    val = Math.max(10, Math.min(200, val));
    $(this).val(val);
    getSettings().pagingScrollRatio = val / 100;
    $("#paging_scroll_ratio").val(Math.max(30, Math.min(120, val)));
    saveSettingsDebounced();
  });
  $("#add_custom_symbol_btn").on("click", function () {
    showCustomSymbolDialog();
  });
  $("#open_hide_manager_btn").on("click", openHideManagerPanel);

  $(".ih-collapsible").each(function () {
    const header = $(this);
    const targetId = header.data("target");
    const body = $(`#${targetId}`);
    header.addClass("ih-collapsed");
    body.addClass("ih-body-collapsed");
    header.on("click", function (e) {
      if ($(e.target).closest(".ih-header-toggle").length) return;
      header.toggleClass("ih-collapsed");
      if (header.hasClass("ih-collapsed")) {
        body.addClass("ih-body-collapsed");
      } else {
        body.removeClass("ih-body-collapsed");
        body.css("max-height", "none");
      }
    });
  });

  $("#add_folder_btn").on("click", function () {
    if (!getSettings().folders) getSettings().folders = [];
    getSettings().folders.push({
      name: `文件夹 ${getSettings().folders.length + 1}`,
      icon: "",
      display: "",
      buttons: [],
      collapsed: false,
      dropdownLayout: "horizontal",
      dropdownPersist: false,
    });
    saveSettingsDebounced();
    renderFolderSettings();
    renderSettingsPanel();
    buildToolbar();
  });

  try {
    await loadSettings();
  } catch (e) {
    console.error("快捷工具栏: loadSettings 出错", e);
  }

  try {
    let _themeChangeTimer = null;
    const themeObserver = new MutationObserver((mutations) => {
      const relevant = mutations.some((m) => {
        if (m.type === "attributes" && m.attributeName === "style") {
          const tag = m.target.tagName;
          if (tag === "HTML" || tag === "BODY") return true;
          return false;
        }
        if (m.type === "childList") {
          const isThemeRelated = (n) => {
            if (!n.tagName) return false;
            if (n.id === "ih-fa-icon-protection") return false;
            if (n.tagName === "SCRIPT") return false;
            if (n.tagName !== "STYLE" && n.tagName !== "LINK") return false;
            if (n.id === "dynamic-styles") return true;
            if (n.id === "dynamic-extension-styles") return true;
            if (n.id === "custom-style") return true;
            return false;
          };
          for (const n of m.addedNodes) if (isThemeRelated(n)) return true;
          for (const n of m.removedNodes) if (isThemeRelated(n)) return true;
        }
        return false;
      });
      if (!relevant) return;
      clearTimeout(_themeChangeTimer);
      _themeChangeTimer = setTimeout(() => {
        _invalidateThemeSample();
        _invalidateBallCSSCache();
        _cachedToolbarStyles = null;
        _cachedToolbarStylesTime = 0;
        if (floatingPanelController._isDragging) return;
        floatingPanelController.syncTheme();
        findReplaceController.syncTheme();
        updateToolbarMaxHeight();
        try {
          document
            .querySelectorAll(".ih-dialog-overlay > div")
            .forEach((el) => syncDialogTheme(el));
        } catch (e) {}
        try {
          const _sp = document.querySelector(".input-helper-settings");
          if (_sp) syncDialogTheme(_sp, { skipBg: true });
        } catch (e) {}
      }, 600);
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["style"],
    });
    themeObserver.observe(document.head, {
      childList: true,
      subtree: true,
    });
  } catch (e) {
    console.warn("快捷工具栏: 主题监听初始化失败", e);
  }

  setupTextareaFocusTracking();
  setupToolbarSwipeCollapse();
  setupGlobalDropdownClose();
  setupGlobalFocusTracking();
  try {
    const delCancelBtn = document.getElementById("dialogue_del_mes_cancel");
    const delOkBtn = document.getElementById("dialogue_del_mes_ok");
    const syncDelBtnState = () => {
      const cb = document.getElementById("dialogue_del_mes_cancel");
      const isOn = cb && $(cb).is(":visible");
      const sel =
        "#input_enter_delete_mode_btn, " +
        ".ih-folder-dropdown-portal [data-button-key='enterDeleteMode'], " +
        ".ih-floating-panel [data-button-key='enterDeleteMode']";
      $(sel).toggleClass("input-helper-btn-active", !!isOn);
    };
    if (delCancelBtn) {
      const obs = new MutationObserver(syncDelBtnState);
      obs.observe(delCancelBtn, {
        attributes: true,
        attributeFilter: ["style", "class"],
      });
      delCancelBtn.addEventListener("click", () =>
        setTimeout(syncDelBtnState, 100),
      );
    }
    if (delOkBtn) {
      delOkBtn.addEventListener("click", () =>
        setTimeout(syncDelBtnState, 100),
      );
    }
  } catch (e) {
    console.warn("快捷工具栏: 删除模式监听失败", e);
  }
  setupVolumeKeyPaging();
  try {
    if (
      typeof window.eventOn === "function" &&
      typeof window.iframe_events !== "undefined"
    ) {
      window.eventOn(
        window.iframe_events.MESSAGE_IFRAME_RENDER_ENDED,
        function (iframe_name) {
          setTimeout(() => {
            document.querySelectorAll("iframe").forEach((ifr) => {
              try {
                const doc = ifr.contentDocument;
                if (!doc || doc.__ihFocusAttached) return;
                doc.__ihFocusAttached = true;
                doc.addEventListener(
                  "focusin",
                  function (e) {
                    const el = e.target;
                    if (!isEditableElement(el)) return;
                    _lastFocusedEditable = el;
                    if (document.getElementById("send_form")) {
                      document
                        .getElementById("send_form")
                        .classList.add("ih-external-focused");
                    }
                    historyManager.ensureExternalHistory(el);
                    historyManager.updateButtons();
                  },
                  true,
                );
                doc.addEventListener(
                  "beforeinput",
                  function (e) {
                    const el = e.target;
                    if (!isEditableElement(el)) return;
                    if (el.isContentEditable) return;
                    historyManager.onExternalBeforeInput(el);
                  },
                  true,
                );
                doc.addEventListener(
                  "input",
                  function (e) {
                    const el = e.target;
                    if (!isEditableElement(el)) return;
                    if (el.isContentEditable) return;
                    historyManager.onExternalInput(el);
                  },
                  true,
                );
                doc.addEventListener(
                  "mousedown",
                  function (e) {
                    const target = e.target;
                    if (!target || isEditableElement(target)) return;
                    _lastFocusedEditable = null;
                    const sf = document.getElementById("send_form");
                    if (sf) sf.classList.remove("ih-external-focused");
                  },
                  true,
                );
                doc.addEventListener(
                  "touchstart",
                  function (e) {
                    const target = e.target;
                    if (!target || isEditableElement(target)) return;
                    _lastFocusedEditable = null;
                    const sf = document.getElementById("send_form");
                    if (sf) sf.classList.remove("ih-external-focused");
                  },
                  { capture: true, passive: true },
                );
              } catch (err) {}
            });
          }, 50);
        },
      );
    }
  } catch (e) {
    console.warn("快捷工具栏: 无法监听酒馆助手 iframe 事件", e);
  }
  setupAutoScrollPauseOnUserScroll();
  setupNavFlagClearOnUserScroll();

  historyManager.init();
  setupInputTracking();
  streamScrollController.arm();

  $(document).on("keydown", handleGlobalShortcuts);

  if (!getSettings().enabled) {
    $("#input_helper_toolbar").addClass("input-helper-hidden");
  }

  $(document).on("keydown", function (e) {
    if (
      $(".ih-dialog-overlay").length &&
      e.key === "Enter" &&
      !e.ctrlKey &&
      !e.shiftKey &&
      !e.altKey
    ) {
      if (
        $(document.activeElement).is("input") &&
        !$(document.activeElement).is("textarea")
      ) {
        $("#custom_symbol_save").click();
      }
    }
  });

  try {
    if (event_types.CHARACTER_EDITED) {
      eventSource.on(event_types.CHARACTER_EDITED, function () {
        historyManager._sharedHistoriesByKey.clear();
      });
    }
    eventSource.on(event_types.CHAT_CHANGED, function () {
      historyManager.clear();
      historyManager._sharedHistoriesByKey.clear();
      let currentChatIdForUndo = null;
      try {
        currentChatIdForUndo = SillyTavern.getContext().getCurrentChatId();
      } catch (e) {
        currentChatIdForUndo = null;
      }
      const previousChatIdForUndo = chatUndoManager._lastWatchedChatId;
      const chatReallyChanged =
        previousChatIdForUndo !== null &&
        previousChatIdForUndo !== undefined &&
        currentChatIdForUndo !== previousChatIdForUndo;

      if (!chatUndoManager._isUndoing && chatReallyChanged) {
        chatUndoManager.clear();
      }
      chatUndoManager._lastWatchedLength = chat.length;
      chatUndoManager._lastWatchedChatId = currentChatIdForUndo;
      if (shiftMode.active) shiftMode.deactivate();
      if (autoScrollController.active) autoScrollController.stop();
      if (findReplaceController.active) findReplaceController.close();
      scrollLockController.release();
      streamScrollController.arm();
      messageNavigation._currentAiIndex = -1;
      messageNavigation._lastNavTime = 0;
      messageNavigation._pendingJump = null;
      quickHideController.reset();
      setupInputTracking();
      _lastFocusedEditable = null;
      _lastFocusedForScroll = null;
      _savedRange = null;
      floatingPanelController.refresh();
      _cachedMessageInput = null;
      setTimeout(() => {
        historyManager.init();
        chatUndoManager.updateStableSnapshot(true);
      }, 200);
    });

    setTimeout(() => {
      chatUndoManager.updateStableSnapshot(true);
    }, 300);

    const _stableSnapshotEvents = [
      event_types.MESSAGE_RECEIVED,
      event_types.USER_MESSAGE_RENDERED,
      event_types.CHARACTER_MESSAGE_RENDERED,
      event_types.MESSAGE_EDITED,
      event_types.MESSAGE_SWIPED,
      event_types.GENERATION_ENDED,
    ];
    _stableSnapshotEvents.forEach((ev) => {
      if (!ev) return;
      try {
        eventSource.on(ev, function () {
          chatUndoManager.updateStableSnapshot();
        });
      } catch (e) {}
    });

    if (event_types.MESSAGE_DELETED) {
      try {
        eventSource.on(event_types.MESSAGE_DELETED, function () {
          chatUndoManager.saveFromExternal();
          setTimeout(() => chatUndoManager.updateStableSnapshot(true), 200);
        });
      } catch (e) {}
    }

    eventSource.on(event_types.GENERATION_STARTED, function (type) {
      if (type === "regenerate") {
        chatUndoManager.saveFromRegenerate();
      }
      autoScrollController.setStreaming(true);
      streamScrollController.onStreamStart(type);
      scrollLockController.onGenerationStart(type);
      sendStopController.setGenerating();
    });

    eventSource.on(event_types.GENERATION_ENDED, function () {
      autoScrollController.setStreaming(false);
      scrollLockController.onGenerationEnd();
      streamScrollController.onStreamEnd();
      sendStopController.setGenerating();
    });

    eventSource.on(event_types.GENERATION_STOPPED, function () {
      autoScrollController.setStreaming(false);
      streamScrollController.onGenerationStopped();
      scrollLockController.release();
      sendStopController.setGenerating();
    });

    eventSource.on(event_types.CHARACTER_MESSAGE_RENDERED, function () {
      autoScrollController.setStreaming(false);
    });

    if (event_types.STREAM_TOKEN_RECEIVED) {
      eventSource.on(event_types.STREAM_TOKEN_RECEIVED, function () {
        streamScrollController.onStreamToken();
      });
    }
  } catch (e) {
    console.warn("快捷工具栏: 无法监听事件", e);
  }
  window.addEventListener("resize", updateToolbarMaxHeight);
  eventSource.on("st_quickbar_reset_floating_ball", () =>
    doResetFloatingBall(),
  );
  console.log("快捷工具栏插件已加载");
});
