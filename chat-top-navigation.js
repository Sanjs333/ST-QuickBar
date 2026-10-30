// QuickBar-owned navigation isolation. Never reload chat, change history
// preferences, or patch another extension. A temporary spacer keeps our scroll
// outside near-top auto-backfill thresholds; only its no-pixel-change cleanup
// notification is suppressed after normal scrolling listeners have settled.
export function getLoadedChatTopOffset(chatEl) {
  if (!chatEl) return 0;
  const first = [...chatEl.querySelectorAll(":scope > .mes[mesid]")].find(node => node.getClientRects().length > 0);
  if (!first) return 0;
  const rect = chatEl.getBoundingClientRect();
  const scale = chatEl.offsetHeight > 0 && rect.height > 0 ? rect.height / chatEl.offsetHeight : 1;
  return Math.max(0, chatEl.scrollTop + (first.getBoundingClientRect().top - rect.top) / scale - chatEl.clientTop);
}
export function createChatTopNavigator({ getBackfillThreshold = () => null, onError = () => {} } = {}) {
  let active = null;
  const cleanupGuards = new Set();
  const report = error => { try { onError(error); } catch {} };
  function suppressRebaseNotification(chat, expected) {
    const doc = chat.ownerDocument, win = doc.defaultView;
    let raf1 = null, raf2 = null, done = false;
    const close = () => {
      if (done) return; done = true;
      doc.removeEventListener("scroll", scroll, true); doc.removeEventListener("scrollend", scroll, true);
      for (const type of ["wheel", "touchmove", "pointerdown", "keydown"]) doc.removeEventListener(type, close, true);
      if (raf1 !== null) win.cancelAnimationFrame(raf1);
      if (raf2 !== null) win.cancelAnimationFrame(raf2);
      cleanupGuards.delete(close);
    };
    const scroll = event => {
      if (event.target !== chat) return;
      if (Math.abs(chat.scrollTop - expected) > 1) { close(); return; }
      event.stopImmediatePropagation();
    };
    doc.addEventListener("scroll", scroll, true); doc.addEventListener("scrollend", scroll, true);
    for (const type of ["wheel", "touchmove", "pointerdown", "keydown"]) doc.addEventListener(type, close, true);
    cleanupGuards.add(close);
    raf1 = win.requestAnimationFrame(() => { raf2 = win.requestAnimationFrame(close); });
  }
  function dispose(job, preserveViewport = true, isolateCleanup = true) {
    if (!job || job.disposed) return;
    job.disposed = true;
    const { chat, doc, win, spacer } = job;
    if (active === job) active = null;
    win.clearTimeout(job.timer);
    for (const id of job.frames) win.cancelAnimationFrame(id);
    doc.removeEventListener("scroll", job.onScroll, true);
    chat.removeEventListener("scrollend", job.onEnd);
    for (const type of ["wheel", "touchmove", "pointerdown", "keydown"]) doc.removeEventListener(type, job.onInput, true);
    if (spacer.parentNode !== chat) return;
    const before = chat.scrollTop;
    const anchor = spacer.nextElementSibling;
    const absoluteOffset = node => {
      const rect = chat.getBoundingClientRect();
      const scale = chat.offsetHeight > 0 && rect.height > 0 ? rect.height / chat.offsetHeight : 1;
      return chat.scrollTop + (node.getBoundingClientRect().top - rect.top) / scale;
    };
    const anchorBefore = anchor?.getClientRects().length ? absoluteOffset(anchor) : null;
    const anchorValue = chat.style.getPropertyValue("overflow-anchor"), anchorPriority = chat.style.getPropertyPriority("overflow-anchor");
    try {
      chat.style.setProperty("overflow-anchor", "none", "important");
      spacer.remove();
      const shift = anchorBefore !== null && anchor?.isConnected ? anchorBefore - absoluteOffset(anchor) : (job.shift || 0);
      const expected = Math.max(0, before - shift);
      if (preserveViewport && isolateCleanup) suppressRebaseNotification(chat, expected);
      if (preserveViewport) chat.scrollTo({ top: expected, behavior: "instant" });
    } finally {
      if (anchorValue) chat.style.setProperty("overflow-anchor", anchorValue, anchorPriority);
      else chat.style.removeProperty("overflow-anchor");
    }
  }
  function clear({ preserveViewport = true } = {}) {
    // A chat/context switch must not inherit a pending one-shot guard from the
    // previous viewport, even if its scroll coordinate happens to be identical.
    for (const close of [...cleanupGuards]) close();
    dispose(active, preserveViewport);
  }
  function scrollToTop(chat, behavior = "auto") {
    if (!chat) return;
    dispose(active, true, false);
    for (const close of [...cleanupGuards]) close();
    let threshold = null;
    try { threshold = getBackfillThreshold(); } catch (error) { report(error); }
    const top = getLoadedChatTopOffset(chat);
    const first = [...chat.querySelectorAll(":scope > .mes[mesid]")].find(node => node.getClientRects().length > 0);
    if (!first || !chat.querySelector("#show_more_messages") || typeof threshold !== "number"
      || !Number.isFinite(threshold) || threshold < 0 || top > threshold) {
      chat.scrollTo({ top, behavior }); return;
    }
    const doc = chat.ownerDocument, win = doc.defaultView;
    const spacer = doc.createElement("div");
    spacer.className = "ih-chat-top-navigation-spacer"; spacer.setAttribute("aria-hidden", "true");
    spacer.style.cssText = `display:block!important;height:${Math.ceil(threshold + chat.clientHeight + 2)}px!important;min-height:0!important;flex-shrink:0!important;margin:0!important;padding:0!important;border:0!important;pointer-events:none!important;`;
    const job = { chat, doc, win, spacer, timer: null, frames: new Set(), version: 0, disposed: false };
    active = job;
    const settle = () => {
      win.clearTimeout(job.timer);
      const version = job.version;
      const frame = () => {
        const id = win.requestAnimationFrame(() => {
          job.frames.delete(id);
          const id2 = win.requestAnimationFrame(() => {
            job.frames.delete(id2);
            if (active === job && !job.disposed && version === job.version) dispose(job);
          }); job.frames.add(id2);
        }); job.frames.add(id);
      };
      job.timer = win.setTimeout(frame, 80);
    };
    job.onScroll = event => { if (event.target === chat && active === job) { job.version++; settle(); } };
    job.onEnd = () => settle();
    job.onInput = event => { if (chat === event.target || chat.contains(event.target)) dispose(job); };
    doc.addEventListener("scroll", job.onScroll, true); chat.addEventListener("scrollend", job.onEnd);
    for (const type of ["wheel", "touchmove", "pointerdown", "keydown"]) doc.addEventListener(type, job.onInput, true);
    const before = chat.scrollTop, anchorValue = chat.style.getPropertyValue("overflow-anchor"), anchorPriority = chat.style.getPropertyPriority("overflow-anchor");
    try {
      chat.scrollTo({ top: before, behavior: "instant" });
      chat.style.setProperty("overflow-anchor", "none", "important");
      first.before(spacer);
      const added = getLoadedChatTopOffset(chat) - top;
      job.shift = added;
      chat.scrollTo({ top: before + added, behavior: "instant" });
    } catch (error) { report(error); dispose(job); }
    finally {
      if (anchorValue) chat.style.setProperty("overflow-anchor", anchorValue, anchorPriority);
      else chat.style.removeProperty("overflow-anchor");
    }
    chat.scrollTo({ top: getLoadedChatTopOffset(chat), behavior });
    settle();
  }
  return Object.freeze({ scrollToTop, clear });
}
