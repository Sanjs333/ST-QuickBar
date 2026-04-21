import {
  chat,
  eventSource,
  event_types,
  saveSettingsDebounced,
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
  asterisk: { label: "双星号", icon: null, text: "**" },
  quotes: { label: "双引号", icon: null, text: '""' },
  parentheses: { label: "圆括号", icon: null, text: "()" },
  bookQuotes1: { label: "直角引号「」", icon: null, text: "「」" },
  bookQuotes2: { label: "直角引号『』", icon: null, text: "『』" },
  bookQuotes3: { label: "书名号《》", icon: null, text: "《》" },
  newline: { label: "换行", icon: "fa-solid fa-turn-down", text: null },
  user: { label: "用户标记 {{user}}", icon: "fa-solid fa-user", text: null },
  char: { label: "角色标记 {{char}}", icon: "fa-solid fa-robot", text: null },
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
  regenerateReply: {
    label: "重新生成",
    icon: "fa-solid fa-rotate",
    text: null,
  },
  hideManager: {
    label: "消息隐藏管理",
    icon: "fa-solid fa-ghost",
    text: null,
  },
  jumpToFloor: {
    label: "跳转到指定楼层",
    icon: "fa-solid fa-location-dot",
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
]);

function isInputButton(key) {
  if (INPUT_BUTTON_KEYS.has(key)) return true;
  if (key.startsWith("custom_")) return true;
  return false;
}

const defaultSettings = {
  enabled: true,
  confirmDangerousActions: false,
  toolbarPinned: false,
  autoScrollSpeed: 50,
  autoScrollToAiOnStream: false,
  lockScrollOnGeneration: false,
  twoRowMode: false,
  twoRowOrder: "input-first",
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
    followTheme: true,
    collapsed: true,
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
      k === "regenerateReply" ||
      k === "prevAiMsg" ||
      k === "nextAiMsg" ||
      k === "pagingMode" ||
      k === "autoScroll" ||
      k === "jumpToFloor" ||
      k === "findReplace" ||
      k === "openQRAssistant"
        ? false
        : true,
    ]),
  ),
  shortcuts: Object.fromEntries(ALL_BUTTON_KEYS.map((k) => [k, ""])),
  buttonOrder: [...ALL_BUTTON_KEYS],
  customSymbols: [],
  folders: [],
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
  regenerateReply: doRegenerateReply,
  hideManager: openHideManagerPanel,
  jumpToFloor: doJumpToFloor,
  findReplace: () => findReplaceController.toggle(),
  openQRAssistant: doOpenQRAssistant,
};

function scrollChatToElement(element, behavior = "smooth", center = false) {
  const chatEl = document.getElementById("chat");
  if (!chatEl || !element) return;
  const chatRect = chatEl.getBoundingClientRect();
  const elemRect = element.getBoundingClientRect();
  let targetTop = chatEl.scrollTop + (elemRect.top - chatRect.top);
  if (center) {
    targetTop -= (chatEl.clientHeight - elemRect.height) / 2;
  }
  chatEl.scrollTo({ top: Math.max(0, targetTop), behavior });
}

const messageNavigation = {
  _currentAiIndex: -1,
  _lastNavTime: 0,

  _getAiMessages() {
    return $("#chat .mes[is_user='false']");
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
    return this._findCurrentVisibleAiIndex();
  },

  goToPrev() {
    const messages = this._getAiMessages();
    if (messages.length === 0) return;
    const chatEl = document.getElementById("chat");
    if (!chatEl) return;
    let currentIdx = this._getStartIndex();
    const chatRect = chatEl.getBoundingClientRect();
    if (currentIdx >= 0) {
      const msgRect = messages[currentIdx].getBoundingClientRect();
      if (Math.abs(msgRect.top - chatRect.top) < 5 && currentIdx > 0) {
        currentIdx--;
      } else if (msgRect.top >= chatRect.top && currentIdx > 0) {
        currentIdx--;
      }
    }
    if (currentIdx < 0) currentIdx = 0;
    scrollChatToElement(messages[currentIdx]);
    this._currentAiIndex = currentIdx;
    this._lastNavTime = Date.now();
  },

  goToNext() {
    const messages = this._getAiMessages();
    if (messages.length === 0) return;
    const chatEl = document.getElementById("chat");
    if (!chatEl) return;
    let currentIdx = this._getStartIndex();
    const chatRect = chatEl.getBoundingClientRect();
    if (currentIdx >= 0) {
      const msgRect = messages[currentIdx].getBoundingClientRect();
      if (msgRect.top <= chatRect.top + 5 && currentIdx < messages.length - 1) {
        currentIdx++;
      }
    }
    if (currentIdx < 0) currentIdx = 0;
    if (currentIdx >= messages.length) currentIdx = messages.length - 1;
    scrollChatToElement(messages[currentIdx]);
    this._currentAiIndex = currentIdx;
    this._lastNavTime = Date.now();
  },
};

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
      const _isMob =
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent,
        );
      toastr.info(
        _isMob
          ? "翻页模式已开启，点击屏幕上/下半区翻页"
          : "翻页模式已开启，使用导航按钮或音量键翻页",
        "",
        { timeOut: 1500 },
      );
    } else {
      this._removeTapPaging();
      toastr.info("翻页模式已关闭", "", { timeOut: 1500 });
    }
  },

  _getVisibleHeight(chatEl) {
    const rect = chatEl.getBoundingClientRect();
    const visibleTop = Math.max(0, rect.top);
    const visibleBottom = Math.min(window.innerHeight, rect.bottom);
    return Math.max(visibleBottom - visibleTop, 200);
  },

  pageUp() {
    const chatEl = document.getElementById("chat");
    if (!chatEl) return;
    const pageHeight = this._getVisibleHeight(chatEl) * 0.93;
    const newTop = Math.max(0, chatEl.scrollTop - pageHeight);
    chatEl.scrollTo({ top: newTop, behavior: "smooth" });
  },

  pageDown() {
    const chatEl = document.getElementById("chat");
    if (!chatEl) return;
    const pageHeight = this._getVisibleHeight(chatEl) * 0.93;
    const maxScroll = chatEl.scrollHeight - chatEl.clientHeight;
    const newTop = Math.min(maxScroll, chatEl.scrollTop + pageHeight);
    chatEl.scrollTo({ top: newTop, behavior: "smooth" });
  },
  _tapTouchStart: null,
  _tapTouchMove: null,
  _tapTouchEnd: null,

  _setupTapPaging() {
    const isMobile =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent,
      );
    if (!isMobile) return;
    const chatEl = document.getElementById("chat");
    if (!chatEl) return;
    let touchStartY = 0;
    let touchMoved = false;
    const self = this;
    this._tapTouchStart = function (e) {
      touchStartY = e.touches[0].clientY;
      touchMoved = false;
    };
    this._tapTouchMove = function () {
      touchMoved = true;
    };
    this._tapTouchEnd = function (e) {
      if (!self.active) return;
      if (touchMoved) return;
      const $target = $(e.target);
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
      if (
        $target.closest(
          ".mes_buttons, .swipe_left, .swipe_right, .mes_edit_buttons, " +
            ".ih-floating-ball, .ih-floating-panel, " +
            ".qr--button, .qr--buttons",
        ).length
      ) {
        return;
      }
      if ($target.is("summary") || $target.closest("summary").length) {
        return;
      }
      if (
        $target.is(".reasoning-toggle-btn") ||
        $target.closest(".reasoning-toggle-btn").length
      ) {
        return;
      }
      if (
        $target.is(".inline-drawer-toggle, .inline-drawer-header") ||
        $target.closest(".inline-drawer-toggle, .inline-drawer-header").length
      ) {
        return;
      }
      const touch = e.changedTouches[0];
      const chatRect = chatEl.getBoundingClientRect();
      const relativeY = touch.clientY - chatRect.top;
      const halfHeight = chatRect.height / 2;
      if (relativeY < halfHeight) {
        self.pageUp();
      } else {
        self.pageDown();
      }
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
    this._tapTouchStart = null;
    this._tapTouchMove = null;
    this._tapTouchEnd = null;
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

  toggle() {
    this.active ? this.stop() : this.start();
  },

  start() {
    this.active = true;
    this._paused = false;
    this._isStreaming = false;
    this._lastTimestamp = null;
    this._scrollAccum = 0;
    this._chatEl = document.getElementById("chat");
    this._speed = getSettings().autoScrollSpeed || 50;
    if (!this._boundStep) {
      this._boundStep = this._step.bind(this);
    }
    this._updateActiveUI(true);
    toastr.info("自动滚动已开启，再次点击停止", "", { timeOut: 1500 });
    if (
      !this._chatEl ||
      this._chatEl.scrollHeight <= this._chatEl.clientHeight
    ) {
      toastr.warning("当前内容不够多，没有可滚动的空间", "", {
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
    this._cancelAnimation();
    this._updateActiveUI(false);
  },

  pause() {
    this._paused = true;
    this._cancelAnimation();
  },

  resume() {
    if (this.active) {
      this._paused = false;
      this._lastTimestamp = null;
      this._scrollAccum = 0;
      this._speed = getSettings().autoScrollSpeed || 50;
      this._chatEl = document.getElementById("chat");
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
      this._chatEl = document.getElementById("chat");
    }
    const chatEl = this._chatEl;
    if (!chatEl) {
      this._rafId = null;
      return;
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
      if (chatEl.scrollTop === before) {
        this.stop();
        toastr.info("已滚动到底部", "", { timeOut: 1500 });
        return;
      }
    }
    this._rafId = requestAnimationFrame(this._boundStep);
  },
};

const streamScrollController = {
  _shouldScroll: false,
  _isRealStream: false,
  _pendingScroll: false,
  _fallbackTimer: null,
  _ready: false,
  _armTimer: null,
  _chatLengthAtStart: 0,

  onStreamStart() {
    if (!this._ready) return;
    if (!getSettings().autoScrollToAiOnStream) return;
    this._shouldScroll = true;
    this._isRealStream = false;
    this._pendingScroll = false;
    this._chatLengthAtStart = chat.length;
    clearTimeout(this._fallbackTimer);
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
    if (getSettings().lockScrollOnGeneration) {
      this.reset();
      return;
    }
    if (chat.length <= this._chatLengthAtStart) {
      this.reset();
      return;
    }
    this._pendingScroll = true;
    this._shouldScroll = false;
    this._isRealStream = false;
    this._fallbackTimer = setTimeout(() => {
      if (this._pendingScroll) {
        this._pendingScroll = false;
        doScrollToLastAi();
      }
    }, 2000);
  },

  onMessageRendered() {
    if (!this._ready) return;
    if (this._pendingScroll) {
      clearTimeout(this._fallbackTimer);
      this._pendingScroll = false;
      if (getSettings().lockScrollOnGeneration) return;
      setTimeout(() => {
        doScrollToLastAi();
      }, 100);
    }
  },

  reset() {
    this._shouldScroll = false;
    this._isRealStream = false;
    this._pendingScroll = false;
    this._chatLengthAtStart = 0;
    clearTimeout(this._fallbackTimer);
  },

  onGenerationStopped() {
    this._shouldScroll = false;
    this._isRealStream = false;
    this._pendingScroll = false;
    this._chatLengthAtStart = 0;
    clearTimeout(this._fallbackTimer);
  },

  arm() {
    clearTimeout(this._armTimer);
    this._ready = false;
    this._shouldScroll = false;
    this._isRealStream = false;
    this._pendingScroll = false;
    this._chatLengthAtStart = 0;
    clearTimeout(this._fallbackTimer);
    this._armTimer = setTimeout(() => {
      this._ready = true;
    }, 3000);
  },
};

const scrollLockController = {
  _active: false,
  _savedScrollTop: null,
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
    this._savedScrollTop = chatEl.scrollTop;
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
    this._savedScrollTop = null;
    this._chatEl = null;
  },
};

const findReplaceController = {
  active: false,
  _barEl: null,
  _targetTextarea: null,
  _matches: [],
  _currentMatchIndex: -1,
  _searchTerm: "",

  toggle() {
    this.active ? this.close() : this.open();
  },

  open() {
    const editTextarea = $("#chat .mes textarea:visible").first();
    if (editTextarea.length) {
      this._targetTextarea = editTextarea;
    } else {
      this._targetTextarea = getMessageInput();
    }
    if (!this._targetTextarea.length) {
      toastr.warning("没有可搜索的文本区域", "", { timeOut: 1500 });
      return;
    }
    this.active = true;
    this._createBar();
    this._updateActiveUI(true);
  },

  close() {
    this.active = false;
    if (this._barEl) {
      this._barEl.remove();
      this._barEl = null;
    }
    this._matches = [];
    this._currentMatchIndex = -1;
    this._searchTerm = "";
    this._targetTextarea = null;
    this._updateActiveUI(false);
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
    if (
      !this._targetTextarea ||
      !this._targetTextarea.length ||
      !document.contains(this._targetTextarea[0])
    ) {
      this.close();
      toastr.warning("编辑区域已关闭", "", { timeOut: 1500 });
      return false;
    }
    return true;
  },

  _createBar() {
    if (this._barEl) this._barEl.remove();
    const bar = $(`
            <div class="ih-find-bar" id="ih_find_bar">
                <div class="ih-find-row">
                    <input type="text" class="ih-find-input" id="ih_find_input" placeholder="查找..." />
                    <span class="ih-find-count" id="ih_find_count">0/0</span>
                    <button class="ih-find-nav-btn" data-action="prev" title="上一个 (Shift+Enter)"><i class="fa-solid fa-chevron-up"></i></button>
                    <button class="ih-find-nav-btn" data-action="next" title="下一个 (Enter)"><i class="fa-solid fa-chevron-down"></i></button>
                    <button class="ih-find-nav-btn ih-find-close-btn" data-action="close" title="关闭 (Esc)"><i class="fa-solid fa-xmark"></i></button>
                </div>
                <div class="ih-replace-row">
                    <input type="text" class="ih-replace-input" id="ih_replace_input" placeholder="替换为..." />
                    <button class="ih-find-action-btn" data-action="replace" title="替换当前">替换</button>
                    <button class="ih-find-action-btn" data-action="replaceAll" title="全部替换">全部</button>
                </div>
            </div>
        `);
    $("body").append(bar);
    this._barEl = bar;
    syncDialogTheme(bar[0]);
    bar.find(".ih-find-input").on("input", () => this._doSearch());
    bar.find('[data-action="prev"]').on("click", () => this._navigate(-1));
    bar.find('[data-action="next"]').on("click", () => this._navigate(1));
    bar.find('[data-action="close"]').on("click", () => this.close());
    bar.find('[data-action="replace"]').on("click", () => this._doReplace());
    bar
      .find('[data-action="replaceAll"]')
      .on("click", () => this._doReplaceAll());
    bar.on("keydown", (e) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        e.preventDefault();
        this.close();
      } else if (e.key === "Enter" && $(e.target).hasClass("ih-find-input")) {
        e.preventDefault();
        if (e.shiftKey) this._navigate(-1);
        else this._navigate(1);
      } else if (
        e.key === "Enter" &&
        $(e.target).hasClass("ih-replace-input")
      ) {
        e.preventDefault();
        this._doReplace();
      }
    });
    bar.on("mousedown", (e) => e.stopPropagation());
    setTimeout(() => bar.find(".ih-find-input").focus(), 50);
    requestAnimationFrame(() => generateFaIconProtectionCSS());
  },

  _doSearch() {
    const term = this._barEl.find(".ih-find-input").val();
    this._searchTerm = term;
    this._matches = [];
    this._currentMatchIndex = -1;
    if (!term || !this._checkTarget()) {
      this._updateCount();
      return;
    }
    const text = this._targetTextarea.val();
    const lowerText = text.toLowerCase();
    const lowerTerm = term.toLowerCase();
    let pos = 0;
    while ((pos = lowerText.indexOf(lowerTerm, pos)) !== -1) {
      this._matches.push(pos);
      pos += lowerTerm.length;
    }
    if (this._matches.length > 0) {
      this._currentMatchIndex = 0;
      this._highlightMatch();
    }
    this._updateCount();
  },

  _navigate(direction) {
    if (this._matches.length === 0) return;
    if (!this._checkTarget()) return;
    this._currentMatchIndex += direction;
    if (this._currentMatchIndex < 0)
      this._currentMatchIndex = this._matches.length - 1;
    if (this._currentMatchIndex >= this._matches.length)
      this._currentMatchIndex = 0;
    this._highlightMatch();
    this._updateCount();
  },

  _highlightMatch() {
    if (
      this._currentMatchIndex < 0 ||
      !this._targetTextarea ||
      !this._targetTextarea.length
    )
      return;
    if (!document.contains(this._targetTextarea[0])) return;
    const pos = this._matches[this._currentMatchIndex];
    const len = this._searchTerm.length;
    const textarea = this._targetTextarea[0];
    textarea.focus();
    textarea.setSelectionRange(pos, pos + len);
    const fullText = textarea.value;
    const textBefore = fullText.substring(0, pos);
    const linesBefore = (textBefore.match(/\n/g) || []).length;
    const style = window.getComputedStyle(textarea);
    let lineHeight = parseFloat(style.lineHeight);
    if (isNaN(lineHeight) || lineHeight <= 0) {
      const fontSize = parseFloat(style.fontSize);
      lineHeight = (isNaN(fontSize) ? 14 : fontSize) * 1.4;
    }
    const desiredScroll = linesBefore * lineHeight - textarea.clientHeight / 3;
    textarea.scrollTop = Math.max(0, desiredScroll);
  },

  _updateCount() {
    if (!this._barEl) return;
    const total = this._matches.length;
    const current = total > 0 ? this._currentMatchIndex + 1 : 0;
    this._barEl.find(".ih-find-count").text(`${current}/${total}`);
  },

  _doReplace() {
    if (this._matches.length === 0 || this._currentMatchIndex < 0) return;
    if (!this._checkTarget()) return;
    const isSendTextarea = this._targetTextarea[0] === getMessageInput()[0];
    if (isSendTextarea) saveStateBeforeAction();
    const replaceWith = this._barEl.find(".ih-replace-input").val();
    const text = this._targetTextarea.val();
    const pos = this._matches[this._currentMatchIndex];
    const termLen = this._searchTerm.length;
    const newText =
      text.substring(0, pos) + replaceWith + text.substring(pos + termLen);
    this._targetTextarea.val(newText);
    this._targetTextarea[0].dispatchEvent(
      new Event("input", { bubbles: true }),
    );
    if (isSendTextarea) historyManager.pushState(this._targetTextarea);
    toastr.info("已替换 1 处", "", { timeOut: 1000 });
    this._doSearch();
  },

  _doReplaceAll() {
    if (this._matches.length === 0) return;
    if (!this._checkTarget()) return;
    const isSendTextarea = this._targetTextarea[0] === getMessageInput()[0];
    if (isSendTextarea) saveStateBeforeAction();
    const replaceWith = this._barEl.find(".ih-replace-input").val();
    const count = this._matches.length;
    const escaped = this._searchTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(escaped, "gi");
    const newText = this._targetTextarea.val().replace(regex, replaceWith);
    this._targetTextarea.val(newText);
    this._targetTextarea[0].dispatchEvent(
      new Event("input", { bubbles: true }),
    );
    if (isSendTextarea) historyManager.pushState(this._targetTextarea);
    toastr.success(`已替换 ${count} 处`, "", { timeOut: 1500 });
    this._doSearch();
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

const historyManager = {
  states: [],
  pointer: -1,
  maxHistory: 50,
  isPerformingUndoRedo: false,
  inputDebounceTimer: null,

  init() {
    const textarea = getMessageInput();
    const text = textarea.val() || "";
    const cursorPos = textarea.prop("selectionStart") || 0;
    this.states = [{ text, cursorPos }];
    this.pointer = 0;
    this.updateButtons();
  },

  pushState(textarea) {
    if (this.isPerformingUndoRedo) return;
    const text = textarea.val();
    const cursorPos = textarea.prop("selectionStart");
    if (this.pointer >= 0 && this.states[this.pointer].text === text) return;
    if (this.pointer < this.states.length - 1) {
      this.states = this.states.slice(0, this.pointer + 1);
    }
    this.states.push({ text, cursorPos });
    if (this.states.length > this.maxHistory) this.states.shift();
    this.pointer = this.states.length - 1;
    this.updateButtons();
  },

  undo() {
    if (this.pointer <= 0) return;
    const textarea = getMessageInput();
    if (this.states[this.pointer].text !== textarea.val())
      this.pushState(textarea);
    this.isPerformingUndoRedo = true;
    this.pointer--;
    const state = this.states[this.pointer];
    textarea.val(state.text);
    setTimeout(() => {
      textarea.prop("selectionStart", state.cursorPos);
      textarea.prop("selectionEnd", state.cursorPos);
      textarea.focus();
      this.isPerformingUndoRedo = false;
      this.updateButtons();
    }, 0);
  },

  redo() {
    if (this.pointer >= this.states.length - 1) return;
    this.isPerformingUndoRedo = true;
    this.pointer++;
    const state = this.states[this.pointer];
    const textarea = getMessageInput();
    textarea.val(state.text);
    setTimeout(() => {
      textarea.prop("selectionStart", state.cursorPos);
      textarea.prop("selectionEnd", state.cursorPos);
      textarea.focus();
      this.isPerformingUndoRedo = false;
      this.updateButtons();
    }, 0);
  },

  onInput() {
    if (this.isPerformingUndoRedo) return;
    clearTimeout(this.inputDebounceTimer);
    this.inputDebounceTimer = setTimeout(() => {
      this.pushState(getMessageInput());
    }, 800);
  },

  updateButtons() {
    const undoDisabled = this.pointer <= 0;
    const redoDisabled = this.pointer >= this.states.length - 1;
    $("#input_undo_btn").toggleClass("input-helper-btn-disabled", undoDisabled);
    $("#input_redo_btn").toggleClass("input-helper-btn-disabled", redoDisabled);
    $(".ih-folder-dropdown-portal [data-button-key='undo']").toggleClass(
      "input-helper-btn-disabled",
      undoDisabled,
    );
    $(".ih-folder-dropdown-portal [data-button-key='redo']").toggleClass(
      "input-helper-btn-disabled",
      redoDisabled,
    );
    $(".ih-floating-panel [data-button-key='undo']").toggleClass(
      "input-helper-btn-disabled",
      undoDisabled,
    );
    $(".ih-floating-panel [data-button-key='redo']").toggleClass(
      "input-helper-btn-disabled",
      redoDisabled,
    );
  },

  clear() {
    this.states = [];
    this.pointer = -1;
    clearTimeout(this.inputDebounceTimer);
    this.init();
  },
};

const shiftMode = {
  active: false,
  anchorPos: 0,
  _handler: null,

  toggle() {
    this.active ? this.deactivate() : this.activate();
  },

  activate() {
    const textarea = getMessageInput();
    if (!textarea.length) return;
    this.anchorPos = textarea.prop("selectionStart");
    this.active = true;
    this._handler = () => {
      if (!this.active) return;
      setTimeout(() => {
        const ta = getMessageInput();
        if (!ta.length) return;
        const start = ta.prop("selectionStart");
        const end = ta.prop("selectionEnd");
        const anchor = this.anchorPos;
        const target =
          Math.abs(end - anchor) >= Math.abs(start - anchor) ? end : start;
        ta.prop("selectionStart", Math.min(anchor, target));
        ta.prop("selectionEnd", Math.max(anchor, target));
      }, 10);
    };
    const el = textarea[0];
    el.addEventListener("mouseup", this._handler);
    el.addEventListener("touchend", this._handler);
    $("#input_shift_btn").addClass("input-helper-btn-active");
  },

  deactivate() {
    this.active = false;
    const textarea = getMessageInput();
    if (this._handler && textarea.length) {
      const el = textarea[0];
      el.removeEventListener("mouseup", this._handler);
      el.removeEventListener("touchend", this._handler);
    }
    this._handler = null;
    $("#input_shift_btn").removeClass("input-helper-btn-active");
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

  toolbar.style.transition = "none";
  toolbar.style.maxHeight = "none";
  toolbar.style.visibility = "hidden";
  if (addedClass) sendForm.classList.add("ih-toolbar-pinned");

  void toolbar.offsetHeight;
  const height = toolbar.scrollHeight;

  toolbar.style.transition = "";
  toolbar.style.maxHeight = "";
  toolbar.style.visibility = "";
  if (addedClass) sendForm.classList.remove("ih-toolbar-pinned");

  void toolbar.offsetHeight;

  if (height > 0) {
    toolbar.style.setProperty("--ih-toolbar-max-h", height + "px");
  }
}

function generateFaIconProtectionCSS() {
  clearTimeout(_faProtectionTimer);
  _faProtectionTimer = setTimeout(_doGenerateFaIconProtectionCSS, 50);
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
    const iReset = selectors.map((s) => `${s} i[class*="fa-"]`).join(",\n");
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

function getMessageInput() {
  return $("#send_textarea, #prompt_textarea").first();
}

function saveStateBeforeAction() {
  clearTimeout(historyManager.inputDebounceTimer);
  historyManager.pushState(getMessageInput());
}

function getSettings() {
  return extension_settings[extensionName];
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
    regenerateReply: "input_regenerate_reply_btn",
    hideManager: "input_hide_manager_btn",
    jumpToFloor: "input_jump_to_floor_btn",
    findReplace: "input_find_replace_btn",
    openQRAssistant: "input_open_qr_assistant_btn",
  };
  return map[key] || "";
}

function getButtonDisplayHtml(key) {
  if (key.startsWith("custom_")) {
    const idx = parseInt(key.replace("custom_", ""));
    const sym = getSettings().customSymbols[idx];
    if (!sym) return "?";
    if (sym.icon) return `<i class="${sym.icon}"></i>`;
    return sym.display || sym.symbol || "?";
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
  saveStateBeforeAction();
  const textarea = getMessageInput();
  const startPos = textarea.prop("selectionStart");
  const endPos = textarea.prop("selectionEnd");
  const text = textarea.val();
  const selected = text.substring(startPos, endPos);
  const insert = left + selected + right;
  const newText = text.substring(0, startPos) + insert + text.substring(endPos);
  textarea.val(newText);
  setTimeout(() => {
    textarea.prop("selectionStart", startPos + cursorOffset);
    textarea.prop(
      "selectionEnd",
      selected.length > 0
        ? startPos + cursorOffset + selected.length
        : startPos + cursorOffset,
    );
    textarea.focus();
    historyManager.pushState(textarea);
  }, 0);
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
  saveStateBeforeAction();
  const textarea = getMessageInput();
  const text = textarea.val();
  const cursorPos = textarea.prop("selectionStart");
  let lineEnd = text.indexOf("\n", cursorPos);
  if (lineEnd === -1) lineEnd = text.length;
  const newText = text.substring(0, lineEnd) + "\n" + text.substring(lineEnd);
  textarea.val(newText);
  setTimeout(() => {
    textarea.prop("selectionStart", lineEnd + 1);
    textarea.prop("selectionEnd", lineEnd + 1);
    textarea.focus();
    historyManager.pushState(textarea);
  }, 0);
}

function insertTag(tag) {
  if (!getSettings().enabled) return;
  saveStateBeforeAction();
  const textarea = getMessageInput();
  const startPos = textarea.prop("selectionStart");
  const endPos = textarea.prop("selectionEnd");
  const text = textarea.val();
  const newText = text.substring(0, startPos) + tag + text.substring(endPos);
  textarea.val(newText);
  setTimeout(() => {
    textarea.prop("selectionStart", startPos + tag.length);
    textarea.prop("selectionEnd", startPos + tag.length);
    textarea.focus();
    historyManager.pushState(textarea);
  }, 0);
}

function insertUserTag() {
  insertTag("{{user}}");
}
function insertCharTag() {
  insertTag("{{char}}");
}

function doScrollToTop() {
  const chatEl = document.getElementById("chat");
  if (chatEl) chatEl.scrollTo({ top: 0, behavior: "smooth" });
}

function doScrollToLastAi() {
  const messages = $("#chat .mes[is_user='false']:visible");
  if (messages.length === 0) return;
  scrollChatToElement(messages.last()[0]);
}

function doScrollToBottom() {
  const chatEl = document.getElementById("chat");
  if (chatEl) chatEl.scrollTo({ top: chatEl.scrollHeight, behavior: "smooth" });
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
  executeSlashCommandsWithOptions("/del 1");
  toastr.info("已删除最后一条消息", "", { timeOut: 1500 });
}

function doDeleteLastSwipe() {
  if (chat.length === 0) return;
  const lastMsg = chat[chat.length - 1];
  if (!lastMsg.swipes || lastMsg.swipes.length <= 1) {
    toastr.warning("没有可删除的备选回复", "", { timeOut: 1500 });
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
  executeSlashCommandsWithOptions("/delswipe");
  toastr.info("已删除当前备选回复", "", { timeOut: 1500 });
}

function doContinueReply() {
  if (chat.length === 0) return;
  executeSlashCommandsWithOptions("/continue await=true");
}

function doJumpToFloor() {
  const total = chat.length;
  if (total === 0) {
    toastr.warning("当前没有聊天消息", "", { timeOut: 1500 });
    return;
  }
  const { overlay, escHandler } = createDialogOverlay();
  const content = $(`
        <div class="ih-jump-dialog-content">
            <h3><i class="fa-solid fa-location-dot"></i> 跳转到指定楼层</h3>
            <div class="ih-jump-body">
                <div class="ih-hm-row">
                    <input type="number" id="ih_jump_floor_input" class="ih-hm-input"
                           placeholder="0 ~ ${total - 1}" min="0" max="${total - 1}" />
                    <span class="ih-hm-hint">共 ${total} 条消息</span>
                </div>
            </div>
            <div class="ih-jump-actions">
                <button class="ih-hm-btn" id="ih_jump_cancel">取消</button>
                <button class="ih-hm-btn ih-hm-btn-ok" id="ih_jump_confirm"><i class="fa-solid fa-location-dot"></i> 跳转</button>
            </div>
        </div>
    `);
  overlay.append(content);
  syncDialogTheme(content[0]);
  content.on("click", (e) => e.stopPropagation());
  requestAnimationFrame(() => generateFaIconProtectionCSS());
  const closeDialog = () => {
    document.removeEventListener("keydown", escHandler, true);
    overlay.remove();
  };
  overlay.off("click").on("click", (e) => {
    if (e.target === overlay[0]) closeDialog();
  });
  content.find("#ih_jump_cancel").on("click", closeDialog);
  const doJump = async () => {
    const input = content.find("#ih_jump_floor_input").val().trim();
    if (!input && input !== "0") {
      closeDialog();
      return;
    }
    const floor = parseInt(input);
    if (isNaN(floor) || floor < 0 || floor >= total) {
      toastr.error(`无效楼层: ${input}（范围 0~${total - 1}）`, "", {
        timeOut: 2500,
      });
      return;
    }
    closeDialog();
    const chatEl = document.getElementById("chat");
    if (!chatEl) return;
    const mesEl = chatEl.querySelector(`.mes[mesid="${floor}"]`);
    if (mesEl) {
      scrollChatToElement(mesEl, "smooth", true);
    } else {
      await executeSlashCommandsWithOptions(`/chat-jump ${floor}`);
    }
    toastr.info(`已跳转到楼层 ${floor}`, "", { timeOut: 1500 });
  };
  content.find("#ih_jump_confirm").on("click", doJump);
  content.find("#ih_jump_floor_input").on("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      doJump();
    }
  });
  setTimeout(() => content.find("#ih_jump_floor_input").focus(), 100);
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

function doRegenerateReply() {
  if (chat.length === 0) return;
  executeSlashCommandsWithOptions("/regenerate await=true");
}

function insertCustomSymbol(symbol) {
  if (!getSettings().enabled) return;
  saveStateBeforeAction();
  const textarea = getMessageInput();
  const startPos = textarea.prop("selectionStart");
  const endPos = textarea.prop("selectionEnd");
  const text = textarea.val();
  const newText =
    text.substring(0, startPos) + symbol.symbol + text.substring(endPos);
  textarea.val(newText);
  setTimeout(() => {
    let cursorPos;
    if (symbol.cursorPos === "start") cursorPos = startPos;
    else if (symbol.cursorPos === "end")
      cursorPos = startPos + symbol.symbol.length;
    else if (symbol.cursorPos === "middle")
      cursorPos = startPos + Math.floor(symbol.symbol.length / 2);
    else cursorPos = startPos + (parseInt(symbol.cursorPos) || 0);
    textarea.prop("selectionStart", cursorPos);
    textarea.prop("selectionEnd", cursorPos);
    textarea.focus();
    historyManager.pushState(textarea);
  }, 0);
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

async function doHideRange(from, to) {
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
  await executeSlashCommandsWithOptions(`/hide ${f}-${t}`);
  await new Promise((r) => setTimeout(r, 300));
  toastr.success(`已隐藏 ${f} ~ ${t}`, "", { timeOut: 1500 });
}

async function doUnhideRange(from, to) {
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
  await executeSlashCommandsWithOptions(`/unhide ${f}-${t}`);
  await new Promise((r) => setTimeout(r, 300));
  toastr.success(`已取消隐藏 ${f} ~ ${t}`, "", { timeOut: 1500 });
}

async function doHideOne(floor) {
  const total = chat.length;
  const f = parseInt(floor);
  if (isNaN(f) || f < 0 || f >= total) {
    toastr.error(`无效楼层: ${floor}（总消息 0~${total - 1}）`, "", {
      timeOut: 2500,
    });
    return;
  }
  await executeSlashCommandsWithOptions(`/hide ${f}`);
  await new Promise((r) => setTimeout(r, 300));
  toastr.success(`已隐藏楼层 ${f}`, "", { timeOut: 1500 });
}

async function doUnhideOne(floor) {
  const total = chat.length;
  const f = parseInt(floor);
  if (isNaN(f) || f < 0 || f >= total) {
    toastr.error(`无效楼层: ${floor}（总消息 0~${total - 1}）`, "", {
      timeOut: 2500,
    });
    return;
  }
  await executeSlashCommandsWithOptions(`/unhide ${f}`);
  await new Promise((r) => setTimeout(r, 300));
  toastr.success(`已取消隐藏楼层 ${f}`, "", { timeOut: 1500 });
}

async function doKeepRecent(count) {
  const total = chat.length;
  const n = parseInt(count);
  if (isNaN(n) || n <= 0) {
    toastr.error("请输入正整数", "", { timeOut: 1500 });
    return;
  }
  if (n >= total) {
    await executeSlashCommandsWithOptions(`/unhide 0-${total - 1}`);
    await new Promise((r) => setTimeout(r, 300));
    toastr.info("消息总数不超过设定值，已显示全部", "", { timeOut: 1500 });
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
  toastr.success("已隐藏全部消息", "", { timeOut: 1500 });
}

async function doUnhideAll() {
  const total = chat.length;
  if (total === 0) return;
  await executeSlashCommandsWithOptions(`/unhide 0-${total - 1}`);
  await new Promise((r) => setTimeout(r, 300));
  toastr.success("已显示全部消息", "", { timeOut: 1500 });
}

function openBeautyPromptPanel() {
  const promptText = `帮我写一段 CSS 美化 SillyTavern 快捷工具栏插件的样式，可以包括工具栏容器和/或按钮。

## 插件信息

插件通过 JS 给 #send_form 添加/移除 .textarea-focused 类来控制工具栏展开收起。
展开选择器为：#send_form.textarea-focused .input-helper-toolbar
固定展开选择器为：#send_form.ih-toolbar-pinned .input-helper-toolbar

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

### 文件夹下拉面板（可选）
- 面板容器（只写视觉属性）：.ih-folder-dropdown-portal
- 面板按钮默认：.ih-folder-dropdown-portal .input-helper-btn
- 面板按钮悬停：.ih-folder-dropdown-portal .input-helper-btn:hover

### 悬浮球（可选）
- 默认：.ih-floating-ball
- 悬停：.ih-floating-ball:hover
- 按下：.ih-floating-ball:active

### 悬浮面板（可选）
- 面板容器（只写视觉属性）：.ih-floating-panel
- 面板按钮默认：.ih-floating-panel .input-helper-btn
- 面板按钮悬停：.ih-floating-panel .input-helper-btn:hover
- 面板按钮按下：.ih-floating-panel .input-helper-btn:active

## 重要约束（必须遵守）

1. **不要写 display 属性**
   插件通过 JS 的 \`.toggle()\` / \`.hide()\` 控制按钮显示隐藏（设置 \`display: none\`）。
   如果你写了 \`display: inline-flex !important\`，会覆盖 JS 设置的 \`display: none\`，
   导致用户在插件设置里关闭的按钮仍然显示。
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
   插件的伸缩逻辑通过 JS 给 #send_form 添加 .textarea-focused 类来控制，
   只在用户手动点击输入框时才触发展开。
   不要写 \`#send_form:hover\` 或 \`#send_form:focus-within\` 来控制工具栏的
   max-height、opacity、pointer-events 等展开属性，否则会导致：
   - 鼠标划过输入区域时工具栏意外弹出
   - 点击输入栏内其他插件按钮时工具栏意外弹出
   如果你需要覆盖展开状态的样式，使用：
   \`#send_form.textarea-focused .input-helper-toolbar\`
   或固定展开时使用：
   \`#send_form.ih-toolbar-pinned .input-helper-toolbar\`

4. **不要写 background-clip: text**
   如果你的美化 CSS 里有其他选择器用了 \`background-clip: text\` + \`color: transparent\`
   的组合（通常用于图标渐变效果），请确保这些选择器不会命中快捷工具栏的按钮。
   否则按钮文字会变透明看不见。

5. **每条属性加 !important**（display 除外）
   因为需要覆盖插件默认样式，所有属性都需要 !important。
   唯一例外是 display 属性，原因见第 1 条。

6. **容器高度由 CSS 变量 \`--ih-toolbar-max-h\` 控制**
   插件 JS 会动态计算工具栏内容高度并设置这个变量。
   不要用固定的 \`max-height\` 值覆盖它，否则双栏模式下按钮会被裁切。

7. **不要写查找替换栏的容器样式**
   不要给 \`.ih-find-bar\` 写任何样式。
   查找替换栏由插件控制显示/隐藏和定位，覆盖后会导致动画和定位异常。
   如果需要美化查找栏内的按钮，使用上述「查找替换栏按钮」部分提供的选择器。

8. **悬浮球样式约束**
   如果你要给 \`.ih-floating-ball\` 写样式：
   - ✅ 允许：background、background-color、border、border-color、
     box-shadow、opacity、backdrop-filter、filter、color、outline
   - ❌ 禁止：position、z-index、width、height、top、left、right、
     bottom、transform、border-radius
   悬浮球的 width/height 由大小滑块设置，border-radius 由形状选项控制，
   position/top/left 由拖拽位置决定。

   注意：用户可以在插件设置里关闭「跟随美化」开关。
   关闭后，插件会用更高优先级的 CSS 类覆盖你写的悬浮球样式，
   这是正常行为，不需要处理。

   如果悬浮球设置了自定义图片，球内部会有一个 <img> 元素。
   CSS 背景色/背景图会被图片遮住。美化有图片的球时，
   建议用 border、box-shadow、outline 等不会被遮挡的属性。

9. **悬浮面板样式约束**
   如果你要给 \`.ih-floating-panel\` 写样式：
   - ✅ 允许：background、background-color、border、border-color、border-radius、
     box-shadow、opacity、backdrop-filter、filter、color、outline
   - ❌ 禁止：position、z-index、width、height、top、left、right、
     bottom、transform
   面板的位置由插件根据悬浮球位置自动计算，width/height 由内容撑开。
   border-radius 允许自由设置（与悬浮球不同）。

## 风格要求

我的美化整体配色风格是 [在这里描述你的配色风格]。
请匹配这个风格自由设计外观，三个状态之间要有柔和的视觉反馈变化。
可以自由发挥，包括但不限于配色、圆角、阴影、边框、大小、形状等。

## 输出格式

直接给我一段可以粘贴的 CSS 代码块，用 /*=== 快捷工具栏 ===*/ 开头做注释标记。`;

  const { overlay, escHandler } = createDialogOverlay();
  const content = $(`
        <div class="ih-beauty-prompt-content">
            <h3 style="margin:0 0 14px;display:flex;align-items:center;gap:8px;font-size:15px;">
                <i class="fa-solid fa-palette"></i> 快捷工具栏美化指南
            </h3>
            <div style="font-size:11px;opacity:0.6;margin-bottom:12px;line-height:1.6;">
                将下面的提示词复制给 AI，并在「风格要求」处填写你的配色风格描述，即可生成匹配你主题的快捷工具栏美化 CSS。
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
  requestAnimationFrame(() => generateFaIconProtectionCSS());
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
            toastr.success("已复制到剪贴板", "", { timeOut: 1500 });
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
      toastr.success("已复制到剪贴板", "", { timeOut: 1500 });
    } catch (e2) {
      toastr.error("复制失败，请手动选择复制", "", { timeOut: 2500 });
    }
    document.body.removeChild(ta);
  }
}

function openHelpPanel() {
  const { overlay, escHandler } = createDialogOverlay();
  const helpText = `
<h3 style="margin:0 0 12px;display:flex;align-items:center;gap:8px;font-size:15px;">
    <i class="fa-solid fa-circle-question"></i> 快捷工具栏 使用说明
</h3>
<div style="font-size:12px;line-height:1.8;opacity:0.92;">
<h4 style="margin:12px 0 6px;font-size:13px;"><i class="fa-solid fa-keyboard"></i> 符号按钮</h4>
<p>点击工具栏上的符号按钮（如 <b>**</b>、<b>""</b>、<b>()</b>、<b>「」</b> 等），会在输入框光标处插入对应符号，并自动将光标定位在符号中间，方便直接输入内容。</p>
<p>如果先选中文本再点击符号按钮，选中的文本会被符号包裹。</p>
<h4 style="margin:12px 0 6px;font-size:13px;"><i class="fa-solid fa-rotate-left"></i> 撤回 / 重做</h4>
<p>对输入框的编辑操作支持多步撤回和重做（最多 50 步历史），点击相应按钮或使用快捷键均可。</p>
<h4 style="margin:12px 0 6px;font-size:13px;"><i class="fa-solid fa-up-down-left-right"></i> 选中模式</h4>
<p>移动端文本选择辅助工具。开启后，先在输入框中点击一个位置作为起点，再点击另一个位置，插件会自动把这两点之间的文本全部选中，方便批量操作。再次点击按钮可关闭该模式。</p>
<h4 style="margin:12px 0 6px;font-size:13px;"><i class="fa-solid fa-compass"></i> 导航功能</h4>
<ul style="margin:4px 0;padding-left:18px;list-style:none;">
    <li><i class="fa-solid fa-angles-up"></i> <b>跳转聊天顶部</b>：一键滚动到聊天最顶端</li>
    <li><i class="fa-solid fa-arrow-down"></i> <b>跳转聊天底部</b>：一键滚动到聊天最底端</li>
    <li><i class="fa-solid fa-arrow-up"></i> <b>跳转AI消息顶部</b>：滚动到最新一条AI回复的顶部</li>
    <li><i class="fa-solid fa-chevron-up"></i>/<i class="fa-solid fa-chevron-down"></i> <b>上/下一条AI消息</b>：在AI消息之间快速跳转</li>
    <li><i class="fa-solid fa-book-open"></i> <b>翻页模式</b>：开启后，上/下导航变为翻页（也支持音量键翻页，需安装Key Mapper）；双击音量上键跳到最新AI消息顶部，双击音量下键跳到聊天底部。移动端开启翻页模式后，点击聊天区域上半部分向上翻页，下半部分向下翻页</li>
    <li><i class="fa-solid fa-gauge-high"></i> <b>自动滚动</b>：以设定速度自动向下滚动，适合阅读长文；用户手动滚动时暂停，2秒后恢复</li>
    <li><i class="fa-solid fa-location-dot"></i> <b>跳转指定楼层</b>：输入楼层号直接跳转</li>
</ul>
<h4 style="margin:12px 0 6px;font-size:13px;"><i class="fa-solid fa-wand-magic-sparkles"></i> 消息操作</h4>
<ul style="margin:4px 0;padding-left:18px;list-style:none;">
    <li><i class="fa-solid fa-trash"></i> <b>删除最后消息</b>：删除聊天中的最后一条消息</li>
    <li><i class="fa-solid fa-scissors"></i> <b>删除当前备选</b>：删除最后一条消息的当前 Swipe</li>
    <li><i class="fa-solid fa-forward"></i> <b>继续回复</b>：让AI继续生成上一条回复</li>
    <li><i class="fa-solid fa-rotate"></i> <b>重新生成</b>：重新生成最后一条AI回复</li>
    <li><i class="fa-solid fa-magnifying-glass"></i> <b>查找替换</b>：在输入框或正在编辑中的消息里查找和替换文本，支持 Enter 跳转下一个、Shift+Enter 跳转上一个、Esc 关闭</li>
</ul>
<p style="opacity:0.7;font-size:11px;">⚠️ 删除类操作可在设置中开启"删除操作前弹窗确认"来防止误操作。</p>
<h4 style="margin:12px 0 6px;font-size:13px;"><i class="fa-solid fa-ghost"></i> 消息隐藏管理</h4>
<p>管理哪些消息对AI可见。可以隐藏/显示指定范围的楼层，或只保留最近N条。隐藏的消息不会发送给AI。</p>
<h4 style="margin:12px 0 6px;font-size:13px;"><i class="fa-solid fa-puzzle-piece"></i> 自定义内容</h4>
<p>在设置面板中可以添加自己常用的自定义按钮，点击按钮会在输入框中插入预设内容。</p>
<p><b>插入内容</b>支持多种形式：</p>
<ul style="margin:4px 0;padding-left:18px;">
    <li>短符号：如 <code>**</code>、<code>「」</code>、<code><br></code></li>
    <li>宏或标签：如 <code>{{random:A,B,C}}</code>、<code><thinking></code></li>
    <li>常用短语：如签名、固定问候语等</li>
    <li>整段模板：如剧情模板、人设片段、格式化指令等（支持多行）</li>
</ul>
<p>插入长段落时，建议给「按钮显示」填简短文字或选择 Font Awesome 图标，避免按钮过宽。</p>
<p><b>光标位置</b>可设为开头/中间/结尾/自定义偏移。对模板文本来说，自定义偏移能让光标自动定位到需要补充内容的位置，非常方便～</p>
<h4 style="margin:12px 0 6px;font-size:13px;"><i class="fa-solid fa-folder"></i> 按钮分组</h4>
<p>可以将按钮收纳到文件夹中，工具栏只显示一个折叠按钮。在设置中拖动按钮到文件夹上方可放入文件夹，从文件夹中的按钮拖出则会移回主工具栏。也可以使用"移出文件夹"的小按钮快速移回。</p>
<h4 style="margin:12px 0 6px;font-size:13px;"><i class="fa-solid fa-table-columns"></i> 双栏模式</h4>
<p>开启后，工具栏分为上下两行：一行是符号输入按钮，一行是功能按钮。两行各自可以左右滚动，方便快速找到常用按钮。可在设置中切换两行的上下顺序。</p>
<h4 style="margin:12px 0 6px;font-size:13px;"><i class="fa-solid fa-circle-dot"></i> 悬浮面板</h4>
<p>开启后会出现一个可拖拽的悬浮球或固定面板。可以把导航跳转等功能按钮放进去。悬浮球模式下点击展开面板，点击其他区域自动收起；固定面板模式下常驻显示。支持自定义悬浮球样式（包括GIF）、面板方向（横向/竖向）。放进悬浮面板的按钮不会在主工具栏中重复显示。面板中的按钮可拖拽排序。</p>
<p><b>透明背景</b>选项仅在上传了自定义图片时生效，开启后悬浮球的默认边框、阴影、背景色都会隐藏，只显示图片本身。</p>
<p>开启「自动隐藏」后，悬浮球/面板平时隐藏，点击聊天区域显示，再次点击聊天区域或点击其他区域自动隐藏。翻页模式开启时会自动显示悬浮球，关闭翻页后自动隐藏回去。</p>
<h4 style="margin:12px 0 6px;font-size:13px;"><i class="fa-solid fa-bolt"></i> 自动跳转</h4>
<p>开启"非流自动跳转至AI消息顶部"后，非流式模式下 AI 生成回复完毕会自动滚动到该条消息的顶部，方便从头阅读长回复。流式输出时不受影响。</p>
<h4 style="margin:12px 0 6px;font-size:13px;"><i class="fa-solid fa-lock"></i> 续写时锁定滚动</h4>
<p>开启"续写时锁定滚动位置"后，使用「继续回复」续写期间，聊天区域的滚动位置会被锁定，方便你边看边续写。普通生成、重新生成、切换备选等其他场景不受影响，跳转和自动滚动都正常。手动滚动（滑动或滚轮）会解除锁定。</p>
<h4 style="margin:12px 0 6px;font-size:13px;"><i class="fa-solid fa-rocket"></i> QR 助手面板</h4>
<p>点击 QR 助手按钮可以快速打开 Quick Reply 助手面板（需要安装 QR 助手插件）。</p>
<h4 style="margin:12px 0 6px;font-size:13px;"><i class="fa-solid fa-palette"></i> 美化指南</h4>
<p>在设置面板底部点击「美化指南」按钮，可以获取一段提示词。将提示词复制给 AI 并填写你的配色风格描述，即可生成匹配你主题的快捷工具栏美化 CSS。</p>
<h4 style="margin:12px 0 6px;font-size:13px;"><i class="fa-solid fa-keyboard"></i> 快捷键</h4>
<p>在按钮管理中，点击每个按钮右边的快捷键输入框，按下想要的组合键即可绑定。快捷键需要至少包含一个修饰键（Ctrl / Alt / Shift）+ 一个普通键，单独的字母键不能作为快捷键。按 Esc 清除。</p>
<p><b>生效范围</b>：符号插入、撤回重做等输入类快捷键仅在发送输入框聚焦时生效；翻页、滚动、删除等导航/操作类快捷键在聊天界面全局生效（在设置面板等其他输入框中打字时不会误触）。移动端不显示快捷键设置。</p>
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
  requestAnimationFrame(() => generateFaIconProtectionCSS());
  const closeDialog = () => {
    document.removeEventListener("keydown", escHandler, true);
    overlay.remove();
  };
  overlay.off("click").on("click", (e) => {
    if (e.target === overlay[0]) closeDialog();
  });
  content.find("#ih_help_close").on("click", closeDialog);
}

function openHideManagerPanel() {
  if (chat.length === 0) {
    toastr.warning("当前没有聊天消息", "", { timeOut: 1500 });
    return;
  }
  const { overlay, escHandler } = createDialogOverlay();
  const status = getHiddenStatus();
  const content = $(`
        <div class="ih-hide-manager-content">
            <h3><i class="fa-solid fa-ghost"></i> 消息隐藏管理</h3>
            <div class="ih-hm-status" id="ih_hm_status">
                <i class="fa-solid fa-circle-info"></i> <span>${status.summary}</span>
            </div>
            <div class="ih-hm-group">
                <div class="ih-hm-group-label">隐藏/显示指定楼层</div>
                <div class="ih-hm-row">
                    <input type="number" id="ih_specific_floor" class="ih-hm-input" placeholder="楼层号" min="0" max="${chat.length - 1}" />
                    <button class="ih-hm-btn ih-hm-btn-warn" id="ih_do_hide_one"><i class="fa-solid fa-eye-slash"></i> 隐藏</button>
                    <button class="ih-hm-btn ih-hm-btn-ok" id="ih_do_unhide_one"><i class="fa-solid fa-eye"></i> 显示</button>
                </div>
            </div>
            <div class="ih-hm-group">
                <div class="ih-hm-group-label">隐藏范围</div>
                <div class="ih-hm-row">
                    <input type="number" id="ih_hide_from" class="ih-hm-input" placeholder="起始（留空=0）" min="0" max="${chat.length - 1}" />
                    <span class="ih-hm-sep">~</span>
                    <input type="number" id="ih_hide_to" class="ih-hm-input" placeholder="结束（留空=末尾）" min="0" max="${chat.length - 1}" />
                    <button class="ih-hm-btn ih-hm-btn-warn" id="ih_do_hide"><i class="fa-solid fa-eye-slash"></i> 隐藏</button>
                </div>
            </div>
            <div class="ih-hm-group">
                <div class="ih-hm-group-label">取消隐藏</div>
                <div class="ih-hm-row">
                    <input type="number" id="ih_unhide_from" class="ih-hm-input" placeholder="起始（留空=0）" min="0" max="${chat.length - 1}" />
                    <span class="ih-hm-sep">~</span>
                    <input type="number" id="ih_unhide_to" class="ih-hm-input" placeholder="结束（留空=末尾）" min="0" max="${chat.length - 1}" />
                    <button class="ih-hm-btn ih-hm-btn-ok" id="ih_do_unhide"><i class="fa-solid fa-eye"></i> 取消隐藏</button>
                </div>
            </div>
            <div class="ih-hm-group">
                <div class="ih-hm-group-label">只保留最近</div>
                <div class="ih-hm-row">
                    <input type="number" id="ih_keep_recent" class="ih-hm-input ih-hm-input-wide" placeholder="条数" min="1" />
                    <span class="ih-hm-hint">条可见（单次执行）</span>
                    <button class="ih-hm-btn ih-hm-btn-ok" id="ih_do_keep"><i class="fa-solid fa-filter"></i> 执行</button>
                </div>
            </div>
            <div class="ih-hm-quick">
                <button class="ih-hm-btn ih-hm-btn-warn ih-hm-btn-half" id="ih_do_hide_all"><i class="fa-solid fa-eye-slash"></i> 隐藏全部</button>
                <button class="ih-hm-btn ih-hm-btn-ok ih-hm-btn-half" id="ih_do_unhide_all"><i class="fa-solid fa-eye"></i> 显示全部</button>
            </div>
            <div class="ih-hm-close-row">
                <button class="ih-hm-btn ih-hm-btn-close" id="ih_hm_close">关闭</button>
            </div>
        </div>
    `);
  overlay.append(content);
  syncDialogTheme(content[0]);
  content.on("click", (e) => e.stopPropagation());
  requestAnimationFrame(() => generateFaIconProtectionCSS());
  const closeDialog = () => {
    document.removeEventListener("keydown", escHandler, true);
    overlay.remove();
  };
  overlay.off("click").on("click", (e) => {
    if (e.target === overlay[0]) closeDialog();
  });
  content.find("#ih_hm_close").on("click", closeDialog);
  function refreshStatus() {
    const s = getHiddenStatus();
    content.find("#ih_hm_status span").text(s.summary);
  }
  content.find("#ih_do_hide_one").on("click", async () => {
    const val = content.find("#ih_specific_floor").val();
    if (val === "") {
      toastr.warning("请输入楼层号", "", { timeOut: 1500 });
      return;
    }
    await doHideOne(val);
    refreshStatus();
  });
  content.find("#ih_do_unhide_one").on("click", async () => {
    const val = content.find("#ih_specific_floor").val();
    if (val === "") {
      toastr.warning("请输入楼层号", "", { timeOut: 1500 });
      return;
    }
    await doUnhideOne(val);
    refreshStatus();
  });
  content.find("#ih_do_hide").on("click", async () => {
    await doHideRange(
      content.find("#ih_hide_from").val(),
      content.find("#ih_hide_to").val(),
    );
    refreshStatus();
  });
  content.find("#ih_do_unhide").on("click", async () => {
    await doUnhideRange(
      content.find("#ih_unhide_from").val(),
      content.find("#ih_unhide_to").val(),
    );
    refreshStatus();
  });
  content.find("#ih_do_keep").on("click", async () => {
    await doKeepRecent(content.find("#ih_keep_recent").val());
    refreshStatus();
  });
  content.find("#ih_do_hide_all").on("click", async () => {
    await doHideAll();
    refreshStatus();
  });
  content.find("#ih_do_unhide_all").on("click", async () => {
    await doUnhideAll();
    refreshStatus();
  });
}

const floatingPanelController = {
  _panelEl: null,
  _ballEl: null,
  _isDragging: false,
  _dragOffset: { x: 0, y: 0 },
  _expanded: false,
  _imageRefreshTimer: null,
  _autoHideVisible: true,
  _ahTouchStart: null,
  _ahTouchMove: null,
  _ahTouchEnd: null,
  _ahDocClick: null,
  _ahChatClick: null,
  _ahTextareaFocus: null,

  init() {
    this.destroy();
    const fp = getSettings().floatingPanel;
    if (!fp || !fp.enabled) return;
    if (fp.displayMode === "ball") {
      this._createBall();
    }
    this._createPanel();
    this._updateVisibility();
    this._setupAutoHide();
    this._setupKeyboardAdaptation();
  },

  destroy() {
    this._removeAutoHide();
    this._removeKeyboardAdaptation();
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
    const imgRadius = isSquare ? "8px" : "50%";
    let innerHtml;
    if (fp.ballImage) {
      innerHtml = `<img src="${fp.ballImage}" draggable="false" ondragstart="return false;" style="width:100%;height:100%;object-fit:cover;border-radius:${imgRadius};pointer-events:none;-webkit-user-drag:none;user-drag:none;" />`;
    } else {
      innerHtml = `<i class="fa-solid fa-ellipsis" style="font-size:${Math.max(14, size / 3)}px;"></i>`;
    }
    const ball = $(
      `<div class="ih-floating-ball" style="width:${size}px;height:${size}px;border-radius:${ballRadius};">${innerHtml}</div>`,
    );
    if (!fp.followTheme) {
      ball.addClass("ih-ball-custom");
    }
    if (fp.transparentBall && fp.ballImage) {
      ball.addClass("ih-ball-custom ih-ball-transparent");
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
      ball.css({ left: pos.x + "px", top: pos.y + "px" });
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

  _createPanel() {
    const fp = getSettings().floatingPanel;
    const panelLayoutClass =
      fp.orientation === "horizontal" ? "ih-fp-horizontal" : "ih-fp-vertical";
    const panel = $(
      `<div class="ih-floating-panel ${panelLayoutClass} ${fp.displayMode === "fixed" ? "ih-fp-fixed" : "ih-fp-collapsible"}"></div>`,
    );
    const buttons = fp.buttons || [];
    if (buttons.length === 0) {
      panel.append(
        `<div style="padding:8px;font-size:11px;opacity:0.5;white-space:nowrap;">请在设置中添加按钮</div>`,
      );
    }
    buttons.forEach((bKey) => {
      const displayHtml = getButtonDisplayHtml(bKey);
      const label = getButtonLabel(bKey);
      const btn = $(
        `<button class="input-helper-btn ih-fp-btn" data-button-key="${bKey}" title="${label}">${displayHtml}</button>`,
      );
      bindButtonAction(btn, bKey);
      this._applyButtonSize(btn[0], fp.buttonSize || 12);
      panel.append(btn);
    });
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
    historyManager.updateButtons();
    requestAnimationFrame(() => generateFaIconProtectionCSS());
  },

  _setupDrag(el, isBall, handle, onTap) {
    const dragTarget = handle || el;
    let startX, startY, origX, origY, moved;
    const onStart = (e) => {
      if (e.type === "mousedown" && e.button !== 0) return;
      e.preventDefault();
      el.addClass("ih-dragging");
      void el[0].offsetHeight;
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
        const threshold = e2.touches ? 10 : 5;
        if (!moved && Math.abs(dx) < threshold && Math.abs(dy) < threshold)
          return;
        if (!moved) {
          moved = true;
          this._isDragging = true;
          if (isBall && this._expanded) {
            this._expanded = false;
            if (this._panelEl) this._panelEl.stop(true).hide();
            this._updateBallImage();
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
        el.removeClass("ih-dragging");
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
    };
    dragTarget.on("mousedown", onStart);
    dragTarget.on("touchstart", onStart);
  },

  toggleExpand() {
    this._expanded = !this._expanded;
    if (!this._panelEl || !this._ballEl) return;
    if (this._expanded) {
      this._panelEl.css({
        visibility: "hidden",
        display: "flex",
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
      if (fp.orientation === "vertical") {
        panelLeft = ballRect.left - panelWidth - 8;
        if (panelLeft < 4) {
          panelLeft = ballRect.right + 8;
        }
        panelTop = ballRect.top;
        if (panelTop + panelHeight > effectiveMaxBottom) {
          panelTop = ballRect.bottom - panelHeight;
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

      if (panelHeight >= availableHeight) {
        panelTop = effectiveMinTop;
        this._panelEl.css("max-height", availableHeight + "px");
      } else {
        panelTop = Math.max(
          effectiveMinTop,
          Math.min(effectiveMaxBottom - panelHeight, panelTop),
        );
      }

      this._panelEl.css({
        left: panelLeft + "px",
        top: panelTop + "px",
        right: "auto",
      });
      this._panelEl.stop(true).fadeIn(150);
      this._adjustForKeyboard();
      this._panelEl
        .find(".ih-fp-btn")
        .toggleClass("input-helper-btn-active", false);
      syncToolbarButtonStyles(this._panelEl);
      this._panelEl
        .find("[data-button-key='pagingMode']")
        .toggleClass("input-helper-btn-active", pagingController.active);
      this._panelEl
        .find("[data-button-key='autoScroll']")
        .toggleClass("input-helper-btn-active", autoScrollController.active);
    } else {
      this._panelEl.stop(true).fadeOut(100);
    }
    this._updateBallImage();
  },
  _applyButtonSize(el, size) {
    const pv = Math.max(2, Math.round(size * 0.25));
    const ph = Math.max(4, Math.round(size * 0.5));
    el.style.setProperty("font-size", `${size}px`, "important");
    el.style.setProperty("padding", `${pv}px ${ph}px`, "important");
  },
  _updateBallImage() {
    if (!this._ballEl) return;
    const fp = getSettings().floatingPanel;
    if (!fp.ballImage) return;
    const img = this._ballEl.find("img");
    if (!img.length) return;
    const expandedImg = fp.ballImageExpanded && fp.ballImageExpanded.trim();
    if (expandedImg) {
      img.attr("src", this._expanded ? expandedImg : fp.ballImage);
    } else {
      img.attr("src", fp.ballImage);
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
      const $target = $(e.target);
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
      if (
        $target.closest(
          ".mes_buttons, .swipe_left, .swipe_right, .mes_edit_buttons, " +
            ".ih-floating-ball, .ih-floating-panel, " +
            ".qr--button, .qr--buttons",
        ).length
      ) {
        return;
      }
      if ($target.is("summary") || $target.closest("summary").length) {
        return;
      }
      if (
        $target.is(".reasoning-toggle-btn") ||
        $target.closest(".reasoning-toggle-btn").length
      ) {
        return;
      }
      if (
        $target.is(".inline-drawer-toggle, .inline-drawer-header") ||
        $target.closest(".inline-drawer-toggle, .inline-drawer-header").length
      ) {
        return;
      }
      ahTouchHandled = true;
      setTimeout(() => {
        ahTouchHandled = false;
      }, 350);
      if (self._autoHideVisible) {
        self._hideAutoHide();
      } else {
        self._showAutoHide();
      }
    };
    this._ahChatClick = function (e) {
      if (ahTouchHandled) return;
      if (pagingController.active) return;
      const $target = $(e.target);
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
      if (
        $target.closest(
          ".mes_buttons, .swipe_left, .swipe_right, .mes_edit_buttons, " +
            ".ih-floating-ball, .ih-floating-panel, " +
            ".qr--button, .qr--buttons",
        ).length
      ) {
        return;
      }
      if ($target.is("summary") || $target.closest("summary").length) {
        return;
      }
      if (
        $target.is(".reasoning-toggle-btn") ||
        $target.closest(".reasoning-toggle-btn").length
      ) {
        return;
      }
      if (
        $target.is(".inline-drawer-toggle, .inline-drawer-header") ||
        $target.closest(".inline-drawer-toggle, .inline-drawer-header").length
      ) {
        return;
      }
      if (self._autoHideVisible) {
        self._hideAutoHide();
      } else {
        self._showAutoHide();
      }
    };
    this._ahDocClick = function (e) {
      if (!self._autoHideVisible) return;
      if (
        $(e.target).closest(
          ".ih-floating-ball, .ih-floating-panel, #chat, #send_form, #form_sheld",
        ).length
      )
        return;
      self._hideAutoHide();
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
    if (this._autoHideVisible) return;
    this._autoHideVisible = true;
    const target = this._ballEl || this._panelEl;
    if (target) {
      target.css({ visibility: "", "pointer-events": "" });
      target.stop(true).animate({ opacity: 0.85 }, 200);
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
      this._updateBallImage();
    }
    const target = this._ballEl || this._panelEl;
    if (target) {
      target.stop(true).animate({ opacity: 0 }, 150, function () {
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
    this._vvResizeHandler = function () {
      self._adjustForKeyboard();
    };
    window.visualViewport.addEventListener("resize", this._vvResizeHandler);
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

  _adjustForKeyboard() {
    if (!window.visualViewport) return;

    const vv = window.visualViewport;
    const vvBottom = vv.offsetTop + vv.height;
    const fullHeight = window.innerHeight;
    const keyboardVisible = vv.height < fullHeight * 0.85;

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
        const maxH = Math.max(120, vv.height - 24);
        this._panelEl.css({
          "max-height": maxH + "px",
          "overflow-y": "auto",
          "overflow-x": "hidden",
        });
      } else {
        this._panelEl.css({
          "max-height": "",
          "overflow-y": "",
          "overflow-x": "",
        });
      }
    }
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
    if (!fp || !fp.enabled) {
      this.destroy();
      return;
    }
    if (this._ballEl || this._panelEl) {
      this.destroy();
    }
    this.init();
  },
};

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
  const isMobile =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent,
    );
  const action = getActionForKey(key);
  if (!action) return;
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
        action();
        setTimeout(() => getMessageInput().focus(), 10);
      });
  } else {
    btn.on("click", action);
  }
}

function syncDialogTheme(contentEl, options) {
  if (!contentEl) return;
  options = options || {};
  const skipBg = options.skipBg === true;

  try {
    const rootDoc = (window.parent && window.parent.document) || document;
    const rootWin = (window.parent && window.parent.defaultView) || window;
    const samples = rootDoc.querySelectorAll(".drawer-content");

    if (!skipBg) {
      let bgImg = "",
        bgSize = "",
        bgPos = "",
        bgRepeat = "";
      for (const el of samples) {
        const cs = rootWin.getComputedStyle(el);
        if (cs.backgroundImage && cs.backgroundImage !== "none") {
          bgImg = cs.backgroundImage;
          bgSize = cs.backgroundSize || "cover";
          bgPos = cs.backgroundPosition || "center";
          bgRepeat = cs.backgroundRepeat || "no-repeat";
          break;
        }
      }
      if (bgImg) {
        contentEl.style.backgroundImage = bgImg;
        contentEl.style.backgroundSize = bgSize;
        contentEl.style.backgroundPosition = bgPos;
        contentEl.style.backgroundRepeat = bgRepeat;
      }
      const pcs = rootWin.getComputedStyle(rootDoc.documentElement);
      const rawColor = pcs.getPropertyValue("--SmartThemeBlurTintColor").trim();
      if (rawColor) {
        const d = document.createElement("div");
        d.style.color = rawColor;
        d.style.display = "none";
        document.body.appendChild(d);
        const parsed = getComputedStyle(d).color;
        document.body.removeChild(d);
        const m = parsed.match(
          /rgba?\(\s*(\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/,
        );
        if (m) {
          const r = m[1],
            g = m[2],
            b = m[3];
          const a = m[4] !== undefined ? parseFloat(m[4]) : 1;
          const minAlpha = 0.82;
          const finalAlpha = Math.max(a, minAlpha);
          contentEl.style.setProperty(
            "background-color",
            `rgba(${r},${g},${b},${finalAlpha})`,
            "important",
          );
        }
      }
    }

    if (samples.length > 0) {
      const drawerEl = samples[0];
      const drawerCs = rootWin.getComputedStyle(drawerEl);
      if (drawerCs.color && !skipBg) {
        contentEl.style.setProperty("color", drawerCs.color, "important");
      }
      const probeCss =
        "position:absolute;left:-9999px;top:-9999px;pointer-events:none;opacity:0;width:1px;height:1px;";

      const probeInput = rootDoc.createElement("input");
      probeInput.type = "text";
      probeInput.style.cssText = probeCss;
      drawerEl.appendChild(probeInput);
      const inputCs = rootWin.getComputedStyle(probeInput);
      const syncInputColor = inputCs.color;
      probeInput.remove();
      const syncInputBg = drawerCs.backgroundColor;

      contentEl
        .querySelectorAll(
          "input[type='text'], input[type='number'], textarea, .ih-hm-status, .ih-beauty-prompt-box, .shortcut-input",
        )
        .forEach(function (el) {
          if (syncInputColor)
            el.style.setProperty("color", syncInputColor, "important");
          if (
            syncInputBg &&
            syncInputBg !== "rgba(0, 0, 0, 0)" &&
            syncInputBg !== "transparent"
          ) {
            el.style.setProperty("background-color", syncInputBg, "important");
          }
        });

      const probeBtn = rootDoc.createElement("div");
      probeBtn.className = "menu_button";
      probeBtn.textContent = "x";
      probeBtn.style.cssText = probeCss;
      drawerEl.appendChild(probeBtn);
      const btnCs = rootWin.getComputedStyle(probeBtn);
      const syncBtnColor = btnCs.color;
      const syncBtnBg = btnCs.backgroundColor;
      probeBtn.remove();

      contentEl
        .querySelectorAll(
          "button, .menu_button, .ih-folder-chip, .input-helper-btn, .button-preview",
        )
        .forEach(function (el) {
          if (syncBtnColor)
            el.style.setProperty("color", syncBtnColor, "important");
          if (
            syncBtnBg &&
            syncBtnBg !== "rgba(0, 0, 0, 0)" &&
            syncBtnBg !== "transparent"
          ) {
            el.style.setProperty("background-color", syncBtnBg, "important");
          }
        });

      const probeSelect = rootDoc.createElement("select");
      probeSelect.style.cssText = probeCss;
      drawerEl.appendChild(probeSelect);
      const selCs = rootWin.getComputedStyle(probeSelect);
      const syncSelColor = selCs.color;
      const syncSelBg = selCs.backgroundColor;
      probeSelect.remove();

      contentEl.querySelectorAll("select").forEach(function (el) {
        if (syncSelColor)
          el.style.setProperty("color", syncSelColor, "important");
        if (
          syncSelBg &&
          syncSelBg !== "rgba(0, 0, 0, 0)" &&
          syncSelBg !== "transparent"
        ) {
          el.style.setProperty("background-color", syncSelBg, "important");
        }
      });
    }
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
  overlay.on("click", function (e) {
    if ($(e.target).hasClass("ih-dialog-overlay")) overlay.remove();
  });
  const escHandler = (e) => {
    if (e.key === "Escape") {
      e.stopImmediatePropagation();
      e.preventDefault();
      document.removeEventListener("keydown", escHandler, true);
      overlay.remove();
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

function syncToolbarButtonStyles(targetContainer) {
  const now = Date.now();
  const CACHE_TTL = 3000;
  if (!_cachedToolbarStyles || now - _cachedToolbarStylesTime > CACHE_TTL) {
    const referenceBtn = $("#input_helper_toolbar .input-helper-btn:visible")
      .not(".ih-folder-btn")
      .first();
    if (!referenceBtn.length) return;
    const refStyle = window.getComputedStyle(referenceBtn[0]);
    const propsToSync = [
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
    propsToSync.forEach((prop) => {
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
  $(".ih-folder-dropdown-portal").remove();
}

function openFolderDropdown(folderBtn, fi) {
  closeAllFolderDropdowns();
  const settings = getSettings();
  const buttons = settings.buttons;
  const folder = settings.folders[fi];
  if (!folder) return;
  const dropdown = $(
    `<div class="ih-folder-dropdown-portal" data-folder-index="${fi}"></div>`,
  );
  const floatingButtons = floatingPanelController.getFloatingButtons();
  (folder.buttons || []).forEach((bKey) => {
    if (buttons[bKey] === false) return;
    if (floatingButtons.has(bKey)) return;
    const displayHtml = getButtonDisplayHtml(bKey);
    const label = getButtonLabel(bKey);
    const btn = $(
      `<button class="input-helper-btn" data-button-key="${bKey}" title="${label}" data-norefocus="true">${displayHtml}</button>`,
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
  $("body").append(dropdown);
  syncToolbarButtonStyles(dropdown);
  syncDialogTheme(dropdown[0]);
  const btnRect = folderBtn[0].getBoundingClientRect();
  const ddWidth = dropdown.outerWidth();
  const ddHeight = dropdown.outerHeight();
  let left = btnRect.left + btnRect.width / 2 - ddWidth / 2;
  let top = btnRect.top - ddHeight - 6;
  if (left < 4) left = 4;
  if (left + ddWidth > window.innerWidth - 4)
    left = window.innerWidth - ddWidth - 4;
  if (top < 4) top = btnRect.bottom + 6;
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

    const visibleButtonsInFolder = (folder.buttons || []).filter((bKey) => {
      if (buttons[bKey] === false) return false;
      if (floatingButtons.has(bKey)) return false;
      return true;
    });
    if (visibleButtonsInFolder.length === 0) return;

    let iconHtml;
    if (folder.icon) iconHtml = `<i class="${folder.icon}"></i>`;
    else if (folder.display) iconHtml = `<span>${folder.display}</span>`;
    else iconHtml = `<i class="fa-solid fa-folder"></i>`;
    const labelText = folder.name || "文件夹";
    const folderBtn = $(`
            <button id="input_folder_${fi}_btn" class="input-helper-btn ih-folder-btn" title="${labelText}" data-norefocus="true" data-folder-index="${fi}">
                ${iconHtml}<span class="ih-folder-label">${labelText}</span><i class="fa-solid fa-ellipsis-vertical ih-folder-dots"></i>
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
  requestAnimationFrame(() => generateFaIconProtectionCSS());
  updateToolbarMaxHeight();
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
        ? `<i class="${folder.icon}"></i>`
        : folder.display || '<i class="fa-solid fa-folder"></i>';
      const isCollapsed = folder.collapsed === true;
      const chevronIcon = isCollapsed ? "fa-chevron-right" : "fa-chevron-down";
      const folderRow = $(`
                <div class="integrated-button-row ih-folder-row ${isCollapsed ? "ih-folder-row-collapsed" : ""}" data-button-key="${key}" data-folder-row="true" data-folder-index="${fi}">
                    <span class="drag-handle"><i class="fa-solid fa-grip-vertical"></i></span>
                    <input id="enable_${key}_btn" type="checkbox" ${isChecked} />
                    <div class="button-preview">${iconDisplay}</div>
                    <span class="ih-folder-label-text" data-folder-index="${fi}"><i class="fa-solid fa-folder" style="margin-right:4px;opacity:0.5;"></i>${folder.name || "文件夹"}</span>
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
        `<button class="ih-folder-inline-add" data-folder-index="${fi}"><i class="fa-solid fa-plus"></i> 添加按钮到此文件夹</button>`,
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

function renderFloatingPanelSettings() {
  const container = $("#ih_floating_panel_settings");
  if (!container.length) return;
  container.off();
  container.empty();
  const fp = getSettings().floatingPanel || {};
  const allKeys = [...ALL_BUTTON_KEYS];
  const customSymbols = getSettings().customSymbols || [];
  customSymbols.forEach((_, i) => allKeys.push(`custom_${i}`));
  const content = $(`
        <div class="ih-fp-settings-body">
            <div class="ih-hm-group">
                <div class="ih-hm-group-label">面板方向</div>
                <div class="ih-hm-row">
                    <select id="ih_fp_orientation" style="flex:1;padding:5px 8px;border:1px solid var(--SmartThemeBorderColor);border-radius:5px;background:var(--SmartThemeBlurTintColor);color:var(--SmartThemeBodyColor);font-size:12px;">
                        <option value="vertical" ${fp.orientation === "vertical" ? "selected" : ""}>竖向（从球左侧展开）</option>
                        <option value="vertical-down" ${fp.orientation === "vertical-down" ? "selected" : ""}>竖向（从球下方展开）</option>
                        <option value="horizontal" ${fp.orientation === "horizontal" ? "selected" : ""}>横向（从球下方展开）</option>
                    </select>
                </div>
            </div>
            <div class="ih-hm-group">
                <div class="ih-hm-group-label">显示模式</div>
                <div class="ih-hm-row">
                    <select id="ih_fp_display_mode" style="flex:1;padding:5px 8px;border:1px solid var(--SmartThemeBorderColor);border-radius:5px;background:var(--SmartThemeBlurTintColor);color:var(--SmartThemeBodyColor);font-size:12px;">
                        <option value="ball" ${fp.displayMode === "ball" ? "selected" : ""}>悬浮球（点击展开）</option>
                        <option value="fixed" ${fp.displayMode === "fixed" ? "selected" : ""}>固定面板（常驻显示）</option>
                    </select>
                </div>
            </div>
            <div class="ih-hm-group" id="ih_fp_ball_settings" style="display:${fp.displayMode === "ball" ? "block" : "none"};">
                <div class="ih-hm-group-label">悬浮球设置</div>
                <div class="ih-hm-row" style="flex-wrap:wrap;gap:6px;">
                    <label style="font-size:11px;flex-shrink:0;">大小</label>
                    <input type="range" id="ih_fp_ball_size" min="32" max="80" value="${fp.ballSize || 48}" style="width:80px;accent-color:var(--SmartThemeQuoteColor,cornflowerblue);" />
                    <span id="ih_fp_ball_size_val" style="font-size:11px;min-width:28px;">${fp.ballSize || 48}px</span>
                </div>
                <div class="ih-hm-row" style="margin-top:6px;gap:6px;">
                    <label style="font-size:11px;flex-shrink:0;">形状</label>
                    <select id="ih_fp_ball_shape" style="flex:1;padding:5px 8px;border:1px solid var(--SmartThemeBorderColor);border-radius:5px;background:var(--SmartThemeBlurTintColor);color:var(--SmartThemeBodyColor);font-size:12px;">
                        <option value="circle" ${(fp.ballShape || "circle") === "circle" ? "selected" : ""}>圆形</option>
                        <option value="square" ${fp.ballShape === "square" ? "selected" : ""}>方形</option>
                    </select>
                </div>
                <div class="ih-hm-row" style="margin-top:6px;">
                    <input type="text" id="ih_fp_ball_image" placeholder="自定义图片URL（支持 GIF / JPG / PNG）" value="${fp.ballImage || ""}" style="flex:1;padding:5px 8px;border:1px solid var(--SmartThemeBorderColor);border-radius:5px;background:var(--SmartThemeBlurTintColor);color:var(--SmartThemeBodyColor);font-size:11px;" />
                </div>
                <div class="ih-hm-row" style="margin-top:4px;">
                    <input type="text" id="ih_fp_ball_image_expanded" placeholder="展开状态图片URL（可选，留空则用上面的图片）" value="${fp.ballImageExpanded || ""}" style="flex:1;padding:5px 8px;border:1px solid var(--SmartThemeBorderColor);border-radius:5px;background:var(--SmartThemeBlurTintColor);color:var(--SmartThemeBodyColor);font-size:11px;" />
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
            <div class="ih-hm-group">
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
                <div class="ih-hm-row" style="gap:6px;">
                    <input type="range" id="ih_fp_btn_size" min="10" max="30" value="${fp.buttonSize || 12}" style="width:100px;accent-color:var(--SmartThemeQuoteColor,cornflowerblue);" />
                    <span id="ih_fp_btn_size_val" style="font-size:11px;min-width:28px;">${fp.buttonSize || 12}px</span>
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
                </div>
            </div>
            <div class="ih-hm-row" style="margin-top:8px;">
                <button class="ih-hm-btn" id="ih_fp_reset_pos"><i class="fa-solid fa-arrows-to-dot"></i> 重置位置</button>
            </div>
        </div>
    `);
  container.append(content);
  try {
    const chipList = container.find("#ih_fp_button_list");
    if (chipList.sortable) {
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
    $("#ih_fp_ball_settings").toggle($(this).val() === "ball");
    floatingPanelController.refresh();
  });
  container.on("input", "#ih_fp_ball_size", function () {
    const val = parseInt($(this).val());
    getSettings().floatingPanel.ballSize = val;
    $("#ih_fp_ball_size_val").text(val + "px");
    saveSettingsDebounced();
    const ball = floatingPanelController._ballEl;
    if (ball && ball.length) {
      ball.css({ width: val + "px", height: val + "px" });
      ball.find("i.fa-ellipsis").css("font-size", Math.max(14, val / 3) + "px");
    }
  });
  container.on("input", "#ih_fp_btn_size", function () {
    const val = parseInt($(this).val());
    getSettings().floatingPanel.buttonSize = val;
    $("#ih_fp_btn_size_val").text(val + "px");
    saveSettingsDebounced();
    const panel = floatingPanelController._panelEl;
    if (panel && panel.length) {
      const ctrl = floatingPanelController;
      panel.find(".ih-fp-btn").each(function () {
        ctrl._applyButtonSize(this, val);
      });
    }
  });
  container.on("change", "#ih_fp_ball_shape", function () {
    getSettings().floatingPanel.ballShape = $(this).val();
    saveSettingsDebounced();
    floatingPanelController.refresh();
  });
  container.on("input", "#ih_fp_ball_image", function () {
    getSettings().floatingPanel.ballImage = $(this).val().trim();
    saveSettingsDebounced();
    clearTimeout(floatingPanelController._imageRefreshTimer);
    floatingPanelController._imageRefreshTimer = setTimeout(() => {
      const ball = floatingPanelController._ballEl;
      const fp = getSettings().floatingPanel;
      if (ball && ball.length && fp.ballImage) {
        const img = ball.find("img");
        if (img.length) {
          img.attr("src", fp.ballImage);
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
    const available = allKeys.filter((k) => !fpButtons.has(k));
    const { overlay, escHandler } = createDialogOverlay();
    const pickerContent = $(`
            <div class="ih-picker-dialog-content">
                <h4 style="margin:0 0 12px;font-size:14px;font-weight:600;display:flex;align-items:center;gap:6px;">
                    <i class="fa-solid fa-circle-plus"></i> 添加按钮到悬浮面板
                </h4>
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
                    ${available.length === 0 ? '<div style="padding:8px;opacity:0.6;font-size:12px;">没有可用的按钮了</div>' : ""}
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
      document.removeEventListener("keydown", escHandler, true);
      overlay.remove();
    };
    overlay.off("click").on("click", (e) => {
      if (e.target === overlay[0]) closePicker();
    });
    pickerContent.on("click", ".ih-picker-item", function () {
      const isSel = $(this).attr("data-selected") === "true";
      $(this).attr("data-selected", String(!isSel));
      $(this).find("input[type='checkbox']").prop("checked", !isSel);
      $(this).css("background-color", !isSel ? "rgba(100,149,237,0.2)" : "");
    });
    pickerContent.find(".ih-picker-confirm-btn").on("click", function () {
      const selected = [];
      pickerContent
        .find(".ih-picker-item[data-selected='true']")
        .each(function () {
          selected.push($(this).data("key"));
        });
      if (selected.length > 0) {
        if (!getSettings().floatingPanel.buttons)
          getSettings().floatingPanel.buttons = [];
        selected.forEach((k) => getSettings().floatingPanel.buttons.push(k));
        saveSettingsDebounced();
        renderFloatingPanelSettings();
        floatingPanelController.refresh();
        buildToolbar();
      }
      closePicker();
    });
  });
  container.on("click", "#ih_fp_reset_pos", function () {
    getSettings().floatingPanel.position = { x: null, y: null };
    saveSettingsDebounced();
    floatingPanelController.refresh();
    toastr.info("悬浮面板位置已重置", "", { timeOut: 1500 });
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
      ? `<i class="${folder.icon}"></i>`
      : folder.display || "📁";
    const card = $(`
            <div class="ih-folder-setting-card" data-folder-index="${fi}">
                <div class="ih-folder-setting-header">
                    <button class="ih-folder-icon-btn" data-folder-index="${fi}" title="选择图标">${iconDisplay}</button>
                    <input type="text" class="ih-folder-name-input" value="${folder.name || ""}" placeholder="文件夹名称" data-folder-index="${fi}" />
                    <button class="ih-folder-delete-btn" data-folder-index="${fi}" title="删除文件夹"><i class="fa-solid fa-trash"></i></button>
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
    });
  container
    .off("click", ".ih-folder-delete-btn")
    .on("click", ".ih-folder-delete-btn", function () {
      const fi = parseInt($(this).data("folder-index"));
      if (!confirm("确定删除这个文件夹吗？里面的按钮会恢复为独立显示。"))
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
    .off("click", ".ih-folder-add-button-btn")
    .on("click", ".ih-folder-add-button-btn", function () {
      showButtonPicker(parseInt($(this).data("folder-index")));
    });
  try {
    container.find(".ih-folder-button-list").each(function () {
      const listEl = $(this);
      const fi = parseInt(listEl.data("folder-index"));
      if (listEl.sortable) {
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
  requestAnimationFrame(() => generateFaIconProtectionCSS());
  const closeDialog = function () {
    document.removeEventListener("keydown", escHandler, true);
    overlay.remove();
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
    if (selectedKeys.length > 0) {
      if (!getSettings().folders[folderIndex].buttons)
        getSettings().folders[folderIndex].buttons = [];
      selectedKeys.forEach((key) =>
        getSettings().folders[folderIndex].buttons.push(key),
      );
      saveSettingsDebounced();
      renderFolderSettings();
      renderSettingsPanel();
      buildToolbar();
    }
    closeDialog();
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
    let displayContent;
    if (symbol.icon) displayContent = `<i class="${symbol.icon}"></i>`;
    else displayContent = symbol.display || symbol.symbol;
    const button = $(
      `<button id="${buttonId}" class="input-helper-btn custom-symbol-button" title="${symbol.name}" data-norefocus="true" data-index="${index}">${displayContent}</button>`,
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
  buildToolbar();
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
    if (newButtons[k] === undefined) newButtons[k] = getSettings().buttons[k];
  }
  for (const k of Object.keys(getSettings().shortcuts)) {
    if (newShortcuts[k] === undefined)
      newShortcuts[k] = getSettings().shortcuts[k];
  }
  getSettings().buttons = newButtons;
  getSettings().shortcuts = newShortcuts;
  getSettings().buttonOrder = newOrder;
  saveSettingsDebounced();
  loadCustomSymbolButtons();
  renderFolderSettings();
  renderFloatingPanelSettings();
  floatingPanelController.refresh();
  updateButtonVisibility();
}

function showCustomSymbolDialog(existingSymbol = null, editIndex = -1) {
  const currentIcon = existingSymbol?.icon || "";
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
                    <input type="text" id="custom_symbol_name" value="${existingSymbol ? existingSymbol.name : ""}" placeholder="设置面板标签和悬停提示">
                </div>
                <div class="form-group form-group-textarea">
                    <label>插入内容</label>
                    <textarea id="custom_symbol_symbol" rows="4" placeholder="点击后实际插入的文本，支持多行段落">${existingSymbol ? existingSymbol.symbol : ""}</textarea>
                </div>
                <div class="form-group">
                    <label>按钮显示</label>
                    <input type="text" id="custom_symbol_display" value="${existingSymbol ? existingSymbol.display : ""}" placeholder="按钮上显示的文字（推荐简短）">
                    <button class="ih-icon-picker-btn" id="custom_symbol_pick_icon" title="选择 FA 图标">
                        ${currentIcon ? `<i class="${currentIcon}"></i>` : '<i class="fa-solid fa-icons"></i>'} 图标
                    </button>
                </div>

                <input type="hidden" id="custom_symbol_icon" value="${currentIcon}" />
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
                <button id="custom_symbol_cancel">取消</button>
                <button id="custom_symbol_save" class="ih-save-btn">保存</button>
            </div>
        </div>
    `);
  overlay.empty().append(content);
  syncDialogTheme(content[0]);
  content.on("click", function (e) {
    e.stopPropagation();
  });
  requestAnimationFrame(() => generateFaIconProtectionCSS());
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
      $(this).html(`<i class="${icon}"></i> 图标`);
    }
  });
  $("#custom_symbol_cancel").on("click", function () {
    document.removeEventListener("keydown", escHandler, true);
    overlay.remove();
  });
  $("#custom_symbol_save").on("click", function () {
    const name = $("#custom_symbol_name").val().trim();
    const symbol = $("#custom_symbol_symbol").val();
    const display = $("#custom_symbol_display").val() || symbol;
    const icon = $("#custom_symbol_icon").val() || "";
    let cursorPos = $("#custom_symbol_cursor").val();
    if (cursorPos === "custom")
      cursorPos = $("#custom_symbol_cursor_pos").val();
    if (!name || !symbol) {
      alert("请输入名称和插入内容！");
      return;
    }
    const symbolObj = { name, symbol, display, icon, cursorPos };
    if (editIndex >= 0) getSettings().customSymbols[editIndex] = symbolObj;
    else {
      if (!getSettings().customSymbols) getSettings().customSymbols = [];
      getSettings().customSymbols.push(symbolObj);
    }
    saveSettingsDebounced();
    loadCustomSymbolButtons();
    document.removeEventListener("keydown", escHandler, true);
    overlay.remove();
  });
}

function onEnableInputChange() {
  const value = $("#enable_input_helper").prop("checked");
  getSettings().enabled = value;
  saveSettingsDebounced();
  if (value) {
    updateButtonVisibility();
    floatingPanelController.refresh();
  } else {
    $("#input_helper_toolbar").addClass("input-helper-hidden");
    if (shiftMode.active) shiftMode.deactivate();
    if (autoScrollController.active) autoScrollController.stop();
    if (findReplaceController.active) findReplaceController.close();
    if (pagingController.active) pagingController.toggle();
    scrollLockController.release();
    floatingPanelController.destroy();
    closeAllFolderDropdowns();
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
      if (keys.length <= 1 && ["Ctrl", "Alt", "Shift"].includes(keys[0]))
        return;
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
            { timeOut: 2000 },
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
      if (isInputButton(key)) {
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
          ui.item.attr("data-just-dropped", "true");
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
            $(this).removeAttr("data-just-dropped");
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
          renderSettingsPanel();
          buildToolbar();
        }, 50);
      },
    });
    $(".ih-folder-children").each(function () {
      const fi = parseInt($(this).attr("data-folder-index"));
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
    Object.assign(extension_settings[extensionName], defaultSettings);
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
  const tabIdx = s.buttonOrder.indexOf("tab");
  if (tabIdx > -1) s.buttonOrder.splice(tabIdx, 1);
  delete s.buttons["tab"];
  delete s.shortcuts["tab"];
  for (const key of defaultSettings.buttonOrder) {
    if (!s.buttonOrder.includes(key)) s.buttonOrder.push(key);
  }
  if (!s.customSymbols) s.customSymbols = [];
  if (!s.folders) s.folders = [];
  if (s.enabled === undefined) s.enabled = true;
  if (s.confirmDangerousActions === undefined)
    s.confirmDangerousActions = false;
  if (s.toolbarPinned === undefined) s.toolbarPinned = false;
  if (s.autoScrollSpeed === undefined) s.autoScrollSpeed = 50;
  if (s.autoScrollToAiOnStream === undefined) s.autoScrollToAiOnStream = false;
  if (s.lockScrollOnGeneration === undefined) s.lockScrollOnGeneration = false;
  if (s.twoRowMode === undefined) s.twoRowMode = false;
  if (s.twoRowOrder === undefined) s.twoRowOrder = "input-first";
  if (!s.floatingPanel) s.floatingPanel = { ...defaultSettings.floatingPanel };
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
  if (s.floatingPanel.collapsed === undefined) s.floatingPanel.collapsed = true;
  if (s.floatingPanel.autoHide === undefined) s.floatingPanel.autoHide = false;
  s.folders.forEach((folder) => {
    if (folder.collapsed === undefined) folder.collapsed = false;
    if (!Array.isArray(folder.buttons)) folder.buttons = [];
    if (folder.icon === undefined) folder.icon = "";
    if (folder.display === undefined) folder.display = "";
    if (folder.name === undefined) folder.name = "文件夹";
  });
  $("#enable_input_helper").prop("checked", s.enabled);
  $("#enable_confirm_dangerous").prop("checked", s.confirmDangerousActions);
  $("#enable_toolbar_pinned").prop("checked", s.toolbarPinned);
  $("#auto_scroll_speed").val(s.autoScrollSpeed);
  $("#auto_scroll_speed_val").text(s.autoScrollSpeed);
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
  });
  textarea.addEventListener("focus", function () {
    if (userInitiatedFocus) $("#send_form").addClass("textarea-focused");
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
  textarea.addEventListener("touchstart", function () {
    if (!$("#send_form").hasClass("textarea-focused"))
      $("#send_form").addClass("textarea-focused");
  });
  textarea.addEventListener("click", function () {
    if (!$("#send_form").hasClass("textarea-focused"))
      $("#send_form").addClass("textarea-focused");
  });
  const toolbar = document.getElementById("input_helper_toolbar");
  if (toolbar) {
    toolbar.addEventListener("mousedown", function (e) {
      if ($(e.target).closest(".ih-folder-btn").length) return;
      e.preventDefault();
    });
  }
  if (textarea && document.activeElement === textarea) {
    $("#send_form").addClass("textarea-focused");
  }
}

function setupInputTracking() {
  const textarea = getMessageInput();
  if (!textarea.length) return;
  textarea.off("input.inputHelper");
  textarea.on("input.inputHelper", function () {
    historyManager.onInput();
    if (shiftMode.active) shiftMode.deactivate();
  });
}

function setupGlobalDropdownClose() {
  $(document).on("click", function (e) {
    if (
      !$(e.target).closest(".ih-folder-btn").length &&
      !$(e.target).closest(".ih-folder-dropdown-portal").length
    ) {
      closeAllFolderDropdowns();
    }
  });
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

function setupAutoScrollPauseOnUserScroll() {
  let userScrollTimeout = null;
  const pauseAndScheduleResume = () => {
    if (!autoScrollController.active) return;
    autoScrollController.pause();
    clearTimeout(userScrollTimeout);
    userScrollTimeout = setTimeout(() => {
      autoScrollController.resume();
    }, 2000);
  };
  $(document).on("wheel", "#chat", pauseAndScheduleResume);
  const chatEl = document.getElementById("chat");
  if (chatEl) {
    chatEl.addEventListener("touchmove", pauseAndScheduleResume, {
      passive: true,
    });
  }
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
    `;
  document.head.appendChild(hiddenCSS);
  extension_settings[extensionName] = extension_settings[extensionName] || {};
  const settingsHtml = await $.get(`${extensionFolderPath}/settings.html`);
  $("#extensions_settings2").append(settingsHtml);

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

  const isMobile =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent,
    );
  if (isMobile) {
    $("#input_helper_toolbar").on("mousedown", function (e) {
      if ($(e.target).closest(".ih-folder-btn").length) return;
      e.preventDefault();
    });
  }

  if (!$("#input_jump_to_floor_btn").length) {
    const jumpBtn = $(
      '<button id="input_jump_to_floor_btn" class="input-helper-btn" title="跳转到指定楼层" data-norefocus="true"><i class="fa-solid fa-location-dot"></i></button>',
    );
    $("#input_helper_toolbar").append(jumpBtn);
  }
  if (!$("#input_find_replace_btn").length) {
    const findReplBtn = $(
      '<button id="input_find_replace_btn" class="input-helper-btn" title="查找替换" data-norefocus="true"><i class="fa-solid fa-magnifying-glass"></i></button>',
    );
    $("#input_helper_toolbar").append(findReplBtn);
  }
  if (!$("#input_open_qr_assistant_btn").length) {
    const qrAssistantBtn = $(
      '<button id="input_open_qr_assistant_btn" class="input-helper-btn" title="QR助手面板" data-norefocus="true"><i class="fa-solid fa-rocket"></i></button>',
    );
    $("#input_helper_toolbar").append(qrAssistantBtn);
  }

  ALL_BUTTON_KEYS.forEach((key) => {
    const btnId = getButtonIdFromKey(key);
    const btn = $(`#${btnId}`);
    if (btn.length) bindButtonAction(btn, key);
  });

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
  const helpBtnEl = $("#ih_open_help_btn");
  if (helpBtnEl.length) {
    const beautyBtn =
      $(`<div id="ih_open_beauty_prompt_btn" class="menu_button menu_button_icon" title="获取美化 CSS 的提示词" style="cursor:pointer;">
            <i class="fa-solid fa-palette"></i>
            <span>美化指南</span>
        </div>`);
    helpBtnEl.before(beautyBtn);
  }

  $(document).on("click", "#ih_open_beauty_prompt_btn", function () {
    openBeautyPromptPanel();
  });
  $(document).on("click", "#ih_open_help_btn", function () {
    openHelpPanel();
  });

  $(document).on("input", "#auto_scroll_speed", function () {
    const val = parseInt($(this).val());
    getSettings().autoScrollSpeed = val;
    $("#auto_scroll_speed_val").text(val);
    saveSettingsDebounced();
    autoScrollController._speed = val;
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
    header.on("click", function () {
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
    const themeObserver = new MutationObserver(() => {
      clearTimeout(_themeChangeTimer);
      _themeChangeTimer = setTimeout(() => {
        _cachedToolbarStyles = null;
        _cachedToolbarStylesTime = 0;
        floatingPanelController.refresh();
        updateToolbarMaxHeight();
        try {
          const _sp = document.querySelector(".input-helper-settings");
          if (_sp) syncDialogTheme(_sp, { skipBg: true });
        } catch (e) {}
      }, 300);
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["style"],
    });
  } catch (e) {
    console.warn("快捷工具栏: 主题监听初始化失败", e);
  }

  setupTextareaFocusTracking();
  setupGlobalDropdownClose();
  setupVolumeKeyPaging();
  setupAutoScrollPauseOnUserScroll();

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
    eventSource.on(event_types.CHAT_CHANGED, function () {
      historyManager.clear();
      if (shiftMode.active) shiftMode.deactivate();
      if (autoScrollController.active) autoScrollController.stop();
      if (findReplaceController.active) findReplaceController.close();
      scrollLockController.release();
      streamScrollController.arm();
      messageNavigation._currentAiIndex = -1;
      messageNavigation._lastNavTime = 0;
      setupInputTracking();
      floatingPanelController.refresh();
    });

    eventSource.on(event_types.GENERATION_STARTED, function (type) {
      autoScrollController.setStreaming(true);
      streamScrollController.onStreamStart();
      scrollLockController.onGenerationStart(type);
    });

    eventSource.on(event_types.GENERATION_ENDED, function () {
      autoScrollController.setStreaming(false);
      scrollLockController.onGenerationEnd();
      streamScrollController.onStreamEnd();
    });

    eventSource.on(event_types.GENERATION_STOPPED, function () {
      autoScrollController.setStreaming(false);
      streamScrollController.onGenerationStopped();
      scrollLockController.release();
    });

    eventSource.on(event_types.CHARACTER_MESSAGE_RENDERED, function () {
      autoScrollController.setStreaming(false);
      streamScrollController.onMessageRendered();
    });

    ["STREAM_TOKEN_RECEIVED", "SMOOTH_STREAM_TOKEN_RECEIVED"].forEach(
      (evtName) => {
        if (event_types[evtName]) {
          eventSource.on(event_types[evtName], function () {
            streamScrollController.onStreamToken();
          });
        }
      },
    );
  } catch (e) {
    console.warn("快捷工具栏: 无法监听事件", e);
  }
  window.addEventListener("resize", updateToolbarMaxHeight);
  console.log("快捷工具栏插件已加载");
});
