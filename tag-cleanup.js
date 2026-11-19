const TAG_NAME = /^[\p{L}_][\p{L}\p{N}_.:-]*$/u;
const PASTED_TAG_NAME = /^<\/?([\p{L}_][\p{L}\p{N}_.:-]*)\s*\/?>$/u;
const SPACE = /\s/u;

function normalizeName(value) {
  const name = typeof value === "string" ? value.trim() : "";
  return name.match(PASTED_TAG_NAME)?.[1] || name;
}

export function validateTagCleanupRules(input) {
  const rules = [];
  const errors = [];
  const seen = new Map();
  const error = (index, field, code, message) =>
    errors.push({ index, field, code, message });

  if (!Array.isArray(input) || input.length === 0) {
    error(-1, "rules", "empty", "请至少添加一条标签或标记规则。");
    return { rules, errors };
  }

  input.forEach((source, index) => {
    if (!source || typeof source !== "object" || Array.isArray(source)) {
      error(index, "type", "invalid", "规则无效，请重新填写起始和结束标记。");
      return;
    }
    let rule;
    let key;
    if (source.type === "tag") {
      const name = normalizeName(source.name);
      if (!TAG_NAME.test(name)) {
        error(
          index,
          "name",
          "invalid",
          "请输入有效标签名，例如 think；也可填写 <think>。名称不能含空格或属性。",
        );
        return;
      }
      rule = { type: "tag", name };
      key = "tag:" + name;
    } else if (source.type === "markers") {
      const start = source.start;
      const end = source.end;
      let invalid = false;
      if (typeof start !== "string" || !start.trim()) {
        error(index, "start", "empty", "起始标记不能留空或仅包含空白。");
        invalid = true;
      }
      if (typeof end !== "string" || !end.trim()) {
        error(index, "end", "empty", "结束标记不能留空或仅包含空白。");
        invalid = true;
      }
      if (invalid) return;
      if (start === end) {
        error(index, "end", "identical", "起始标记和结束标记不能相同。");
        return;
      }
      rule = { type: "markers", start, end };
      key = "markers:" + JSON.stringify([start, end]);
    } else {
      error(index, "type", "invalid", "规则无效，请重新填写起始和结束标记。");
      return;
    }
    if (seen.has(key)) {
      error(
        index,
        rule.type === "tag" ? "name" : "start",
        "duplicate",
        "此规则与第 " + (seen.get(key) + 1) + " 条规则相同。",
      );
      return;
    }
    seen.set(key, index);
    rules.push(rule);
  });
  return { rules, errors };
}

function readTag(text, start) {
  let cursor = start + 1;
  const closing = text[cursor] === "/";
  if (closing) cursor++;
  const nameStart = cursor;
  while (cursor < text.length) {
    const char = text[cursor];
    if (
      SPACE.test(char) ||
      char === "/" ||
      char === ">" ||
      char === "<" ||
      char === '"' ||
      char === "'"
    ) {
      break;
    }
    cursor++;
  }
  const name = text.slice(nameStart, cursor);
  if (!TAG_NAME.test(name)) return null;
  const suffixStart = cursor;
  const invalidSuffixStart = text[cursor] === '"' || text[cursor] === "'";
  let quote = null;
  while (cursor < text.length) {
    const char = text[cursor];
    if (quote) {
      if (char === quote) quote = null;
    } else if (char === '"' || char === "'") {
      quote = char;
    } else if (char === ">") {
      const suffix = text.slice(suffixStart, cursor);
      return {
        name,
        start,
        end: cursor + 1,
        closing,
        selfClosing: !closing && /\/\s*$/u.test(suffix),
        malformed:
          invalidSuffixStart ||
          (closing && !!suffix.trim()) ||
          (!closing && text[suffixStart] === "/" && !/^\/\s*$/u.test(suffix)),
      };
    } else if (char === "<") {
      return { name, start, end: cursor, closing, malformed: true };
    }
    cursor++;
  }
  return { name, start, end: text.length, closing, malformed: true };
}

function mergeRanges(input) {
  const sorted = input.slice().sort((a, b) => a.start - b.start || b.end - a.end);
  const result = [];
  for (const range of sorted) {
    const last = result[result.length - 1];
    if (last && range.start <= last.end) {
      last.end = Math.max(last.end, range.end);
    } else {
      result.push({ start: range.start, end: range.end });
    }
  }
  return result;
}

function scanTagRules(text, rules, matches, protectedRanges, diagnostics) {
  const selected = new Map();
  rules.forEach((rule, ruleIndex) => {
    if (rule.type === "tag") selected.set(rule.name, ruleIndex);
  });
  if (!selected.size) return;
  const stack = [];
  const openCounts = new Map();
  let cursor = 0;

  while (cursor < text.length) {
    const start = text.indexOf("<", cursor);
    if (start === -1) break;
    let terminator = null;
    let prefixLength = 0;
    if (text.startsWith("<!--", start)) {
      terminator = "-->";
      prefixLength = 4;
    } else if (text.startsWith("<![CDATA[", start)) {
      terminator = "]]>";
      prefixLength = 9;
    } else if (text.startsWith("<?", start)) {
      terminator = "?>";
      prefixLength = 2;
    }
    if (terminator) {
      const end = text.indexOf(terminator, start + prefixLength);
      cursor = end === -1 ? text.length : end + terminator.length;
      continue;
    }
    const token = readTag(text, start);
    if (!token) {
      cursor = start + 1;
      continue;
    }
    cursor = Math.max(start + 1, token.end);
    if (!selected.has(token.name)) continue;
    const ruleIndex = selected.get(token.name);
    if (token.malformed) {
      diagnostics.push({
        ruleIndex,
        kind: "malformed",
        start,
        end: token.end,
        message: "标签格式不完整，已保留原文。",
      });
      if (!token.closing) protectedRanges.push({ start, end: text.length });
      continue;
    }
    if (token.selfClosing) continue;
    if (!token.closing) {
      stack.push({ ...token, ruleIndex });
      openCounts.set(token.name, (openCounts.get(token.name) || 0) + 1);
      continue;
    }
    const top = stack[stack.length - 1];
    if (top && top.name === token.name) {
      stack.pop();
      openCounts.set(token.name, openCounts.get(token.name) - 1);
      matches.push({ start: top.start, end: token.end, ruleIndex });
    } else {
      const hasOpening = (openCounts.get(token.name) || 0) > 0;
      diagnostics.push({
        ruleIndex,
        kind: hasOpening ? "misnested-close" : "orphan-close",
        start,
        end: token.end,
        message: hasOpening
          ? "标签交叉闭合，已保留原文。"
          : "结束标签没有对应的起始标签，已保留原文。",
      });
    }
  }
  if (stack.length) {
    protectedRanges.push({ start: stack[0].start, end: text.length });
    for (const open of stack) {
      diagnostics.push({
        ruleIndex: open.ruleIndex,
        kind: "unclosed",
        start: open.start,
        end: open.end,
        message: "起始标签没有对应的结束标签，已保留其后的原文。",
      });
    }
  }
}

function scanMarkerRule(text, rule, ruleIndex, matches, protectedRanges, diagnostics) {
  const stack = [];
  let cursor = 0;
  let opening = text.indexOf(rule.start);
  let closing = text.indexOf(rule.end);
  while (cursor < text.length) {
    if (opening === -1 && closing === -1) break;
    const isOpening =
      opening !== -1 &&
      (closing === -1 ||
        opening < closing ||
        (opening === closing && rule.start.length > rule.end.length));
    const start = isOpening ? opening : closing;
    const end = start + (isOpening ? rule.start.length : rule.end.length);
    cursor = end;
    if (opening !== -1 && opening < cursor) opening = text.indexOf(rule.start, cursor);
    if (closing !== -1 && closing < cursor) closing = text.indexOf(rule.end, cursor);
    if (isOpening) {
      stack.push({ start, end });
    } else if (stack.length) {
      const open = stack.pop();
      matches.push({ start: open.start, end, ruleIndex });
    } else {
      diagnostics.push({
        ruleIndex,
        kind: "orphan-close",
        start,
        end,
        message: "结束标记没有对应的起始标记，已保留原文。",
      });
    }
  }
  if (stack.length) {
    protectedRanges.push({ start: stack[0].start, end: text.length });
    for (const open of stack) {
      diagnostics.push({
        ruleIndex,
        kind: "unclosed",
        start: open.start,
        end: open.end,
        message: "起始标记没有对应的结束标记，已保留其后的原文。",
      });
    }
  }
}

export function planTagCleanup(text, inputRules) {
  if (typeof text !== "string") {
    throw new TypeError("标签清理需要原始文本字符串。");
  }
  const { rules, errors } = validateTagCleanupRules(inputRules);
  if (errors.length) {
    const error = new TypeError(errors[0].message);
    error.errors = errors;
    throw error;
  }
  const matches = [];
  const protectedRanges = [];
  const diagnostics = [];
  scanTagRules(text, rules, matches, protectedRanges, diagnostics);
  rules.forEach((rule, index) => {
    if (rule.type === "markers") {
      scanMarkerRule(text, rule, index, matches, protectedRanges, diagnostics);
    }
  });

  const incompleteCount = diagnostics.length;
  const protection = mergeRanges(protectedRanges);
  const eligible = [];
  let protectionIndex = 0;
  const sortedMatches = matches
    .slice()
    .sort((a, b) => a.start - b.start || b.end - a.end);
  for (const match of sortedMatches) {
    while (
      protectionIndex < protection.length &&
      protection[protectionIndex].end <= match.start
    ) {
      protectionIndex++;
    }
    const blocked = protection[protectionIndex];
    if (blocked && blocked.start < match.end && blocked.end > match.start) {
      diagnostics.push({
        ruleIndex: match.ruleIndex,
        kind: "protected",
        start: match.start,
        end: match.end,
        message: "此处位于不完整标签或标记的保护范围内，已保留原文。",
      });
    } else {
      eligible.push(match);
    }
  }
  const ranges = mergeRanges(eligible);
  const parts = [];
  let cursor = 0;
  for (const range of ranges) {
    parts.push(text.slice(cursor, range.start));
    cursor = range.end;
  }
  parts.push(text.slice(cursor));

  const ruleStats = rules.map((rule, index) => {
    const localMatches = eligible.filter((match) => match.ruleIndex === index);
    const localRanges = mergeRanges(localMatches);
    return {
      index,
      rule: { ...rule },
      matchCount: localMatches.length,
      removedCount: localRanges.length,
      removedChars: localRanges.reduce((count, range) => count + range.end - range.start, 0),
      skippedCount: diagnostics.filter((item) => item.ruleIndex === index).length,
    };
  });
  diagnostics.sort((a, b) => a.start - b.start || a.ruleIndex - b.ruleIndex);
  return {
    text: parts.join(""),
    ranges,
    matchCount: eligible.length,
    removedCount: ranges.length,
    removedChars: ranges.reduce((count, range) => count + range.end - range.start, 0),
    skippedCount: diagnostics.length,
    incompleteCount,
    protectedCount: diagnostics.length - incompleteCount,
    diagnostics,
    ruleStats,
  };
}

const clone = (value) => JSON.parse(JSON.stringify(value));
const escapeHtml = (value) =>
  String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[char]);

function createProfileId() {
  return globalThis.crypto?.randomUUID?.() ||
    "tag-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2);
}

function toMarkerRule(rule) {
  if (rule.type === "tag") {
    const name = validateTagCleanupRules([rule]).rules[0]?.name ?? String(rule.name ?? "");
    return { type: "markers", start: "<" + name + ">", end: "</" + name + ">" };
  }
  return {
    type: "markers",
    start: typeof rule.start === "string" ? rule.start : "",
    end: typeof rule.end === "string" ? rule.end : "",
  };
}

function rulePreviewMarkup(rule) {
  const { start, end } = toMarkerRule(rule);
  return '<span class="ih-tc-rule-preview" role="listitem">' +
    '<code title="起始：' + escapeHtml(start) + '">' + escapeHtml(start) + '</code>' +
    '<span class="ih-tc-rule-preview-arrow" aria-hidden="true"><i class="fa-solid fa-arrow-right"></i></span>' +
    '<code title="结束：' + escapeHtml(end) + '">' + escapeHtml(end) + "</code></span>";
}

export function normalizeTagCleanupSettings(settings) {
  if (!Array.isArray(settings.tagCleanupProfiles)) settings.tagCleanupProfiles = [];
  const ids = new Set();
  settings.tagCleanupProfiles = settings.tagCleanupProfiles
    .filter((profile) => profile && typeof profile === "object" && !Array.isArray(profile))
    .map((profile) => {
      if (typeof profile.id !== "string" || !profile.id || ids.has(profile.id)) {
        profile.id = createProfileId();
      }
      ids.add(profile.id);
      if (typeof profile.name !== "string") profile.name = "";
      if (!Array.isArray(profile.rules)) profile.rules = [];
      profile.rules = profile.rules.filter((rule) =>
        rule && typeof rule === "object" && !Array.isArray(rule));
      return profile;
    });
  if (!ids.has(settings.tagCleanupProfileId)) {
    settings.tagCleanupProfileId = settings.tagCleanupProfiles[0]?.id || "";
  }
}

function currentSwipeIndex(message, text) {
  if (!Array.isArray(message.swipes) || message.swipes.length === 0) return -1;
  if (Number.isInteger(message.swipe_id) &&
      message.swipe_id >= 0 && message.swipe_id < message.swipes.length) {
    return message.swipe_id;
  }
  const matching = message.swipes.indexOf(text);
  return matching >= 0 ? matching : 0;
}

function clearTokenCount(message, swipeIndex, current) {
  if (current && message.extra && typeof message.extra === "object") {
    delete message.extra.token_count;
  }
  const info = message.swipe_info?.[swipeIndex];
  if (info?.extra && typeof info.extra === "object") delete info.extra.token_count;
}

export function buildTagCleanupPlan({
  messages, floors, rules, includeSwipes = false, contextKey = "",
}) {
  const validation = validateTagCleanupRules(rules);
  if (validation.errors.length) throw new Error(validation.errors[0].message);
  const selected = [...new Set(floors)].sort((a, b) => a - b);
  const plan = {
    messages,
    contextKey,
    length: messages.length,
    selected,
    rules: validation.rules,
    includeSwipes,
    baseline: [],
    entries: [],
    previews: [],
    floorStats: new Map(),
    removedCount: 0,
    skippedCount: 0,
    changedVariants: 0,
    emptyCount: 0,
  };
  for (const floor of selected) {
    const source = messages[floor];
    if (!Number.isInteger(floor) || floor < 0 || !source) {
      throw new Error("所选楼层已不存在，请重新选择。");
    }
    plan.baseline.push({ floor, source, fingerprint: JSON.stringify(source) });
    const text = String(source.mes ?? "");
    const currentIndex = currentSwipeIndex(source, text);
    const variants = [];
    const inspect = (original, swipeIndex, current) => {
      const result = planTagCleanup(original, validation.rules);
      variants.push({ original, swipeIndex, current, result });
    };
    if (includeSwipes && Array.isArray(source.swipes) && source.swipes.length) {
      Array.from(source.swipes).forEach((swipe, index) => {
        inspect(index === currentIndex ? text : String(swipe ?? ""), index, index === currentIndex);
      });
    } else {
      inspect(text, currentIndex, true);
    }
    let replacement = null;
    const stats = { removedCount: 0, skippedCount: 0 };
    for (const variant of variants) {
      const { result, current, swipeIndex } = variant;
      stats.removedCount += result.removedCount;
      stats.skippedCount += result.skippedCount;
      if (result.removedCount || result.skippedCount) {
        plan.previews.push({ floor, sender: source.name || (source.is_user ? "用户" : "AI"), ...variant });
      }
      if (!result.removedCount) continue;
      if (!replacement) replacement = clone(source);
      if (current) {
        replacement.mes = result.text;
        if (!result.text && variant.original) plan.emptyCount++;
      }
      if (swipeIndex >= 0) replacement.swipes[swipeIndex] = result.text;
      clearTokenCount(replacement, swipeIndex, current);
      plan.changedVariants++;
    }
    if (replacement) {
      const currentVariant = variants.find((variant) => variant.current);
      if (currentIndex >= 0 && currentVariant) {
        if (!Number.isInteger(source.swipe_id) ||
            source.swipe_id < 0 || source.swipe_id >= source.swipes.length) {
          replacement.swipe_id = currentIndex;
        }
        if (replacement.swipes[currentIndex] !== currentVariant.result.text) {
          clearTokenCount(replacement, currentIndex, false);
        }
        replacement.swipes[currentIndex] = currentVariant.result.text;
      }
      plan.entries.push({ floor, message: replacement });
    }
    plan.floorStats.set(floor, stats);
    plan.removedCount += stats.removedCount;
    plan.skippedCount += stats.skippedCount;
  }
  return plan;
}

export function isTagCleanupPlanCurrent(plan, messages, contextKey) {
  if (!plan || plan.messages !== messages || plan.contextKey !== contextKey ||
      plan.length !== messages.length) return false;
  try {
    return plan.baseline.every(({ floor, source, fingerprint }) =>
      messages[floor] === source && JSON.stringify(messages[floor]) === fingerprint);
  } catch {
    return false;
  }
}

export function applyTagCleanupPlan(plan, messages, contextKey) {
  if (!isTagCleanupPlanCurrent(plan, messages, contextKey)) {
    throw new Error("聊天内容已变化，请重新预览后再删除。");
  }
  const changes = plan.entries.map(({ floor, message }) => ({ floor, message: clone(message) }));
  for (const change of changes) messages[change.floor] = change.message;
  return changes;
}

function summary(plan) {
  let text = plan.entries.length + " 条消息命中，共 " + plan.removedCount + " 处";
  if (plan.includeSwipes) text += "（" + plan.changedVariants + " 条备选内容）";
  if (plan.skippedCount) text += "；跳过 " + plan.skippedCount + " 处不完整或受保护的内容";
  if (plan.emptyCount) text += "；" + plan.emptyCount + " 条消息清理后正文为空";
  return text;
}

function previewMarkup(preview, after) {
  if (after) return escapeHtml(preview.result.text) ||
    '<span class="ih-tc-preview-empty"><i class="fa-solid fa-circle-check"></i> 清理后正文为空</span>';
  let html = "";
  let cursor = 0;
  for (const range of preview.result.ranges) {
    html += escapeHtml(preview.original.slice(cursor, range.start));
    html += '<span class="ih-tc-removed">' +
      escapeHtml(preview.original.slice(range.start, range.end)) + "</span>";
    cursor = range.end;
  }
  return html + escapeHtml(preview.original.slice(cursor));
}

export function createTagCleanupManager({
  $, content, getSettings, saveSettings, getMessages, getSelection,
  getContextKey, captureBinding, isActive, isBusy, confirmAction, commit,
  onPlanChange = () => {}, onViewChange = () => {}, protectIcons = () => {},
  notify = () => {},
}) {
  normalizeTagCleanupSettings(getSettings());
  const host = content.find("#ih_mgr_tag_cleanup_view");
  const configEditor = content.find(".ih-tc-config-inline");
  let mode = "messages";
  let includeSwipes = false;
  let plan = null;
  let planKey = "";
  let planTimer = null;
  let busyTimer = null;
  let view = null;
  let draft = null;
  let draftBaseline = "";
  let previewPlan = null;
  let previewIndex = 0;
  let previewAfter = false;
  let stalePreview = false;
  let busy = false;
  let disposed = false;
  let pendingCommit = null;

  const profiles = () => getSettings().tagCleanupProfiles;
  const profile = () => profiles().find((item) => item.id === getSettings().tagCleanupProfileId);
  const selection = () => [...getSelection()].sort((a, b) => a - b);
  const active = () => mode === "tags" && isActive();
  const unavailable = () => busy || !!pendingCommit;

  function setStatus(text) {
    content.find("#ih_tc_status_text").text(text);
    content.find(".ih-tc-plan-status").toggle(!!text && !draft);
  }

  function syncButtons() {
    content.toggleClass("ih-tc-editing", !!draft);
    const externalBusy = isBusy();
    const canDelete = !!plan?.removedCount && !!plan?.binding?.key && !draft && !unavailable() && !externalBusy &&
      (view !== "preview" || (!stalePreview && previewPlan === plan));
    content.find("#ih_tc_apply, #ih_tc_preview_apply").prop("disabled", !canDelete);
    content.find("#ih_tc_preview").prop("disabled", !plan?.previews.length || !!draft || unavailable());
    content.find("#ih_tc_retry, #ih_tc_preview_retry")
      .toggle(!!pendingCommit)
      .prop("disabled", busy || isBusy());
    content.find("#ih_tc_apply, #ih_tc_preview_apply").html(
      '<i class="fa-solid ' + (busy ? "fa-spinner fa-spin" : "fa-trash") + '"></i> ' +
      (busy ? "保存中…" : "删除标签及内容" + (plan?.removedCount ? "（" + plan.removedCount + " 处）" : "")));
    content.find("#ih_tc_profile, #ih_tc_new, #ih_tc_edit, #ih_tc_delete")
      .prop("disabled", unavailable() || !!draft);
    content.find("#ih_tc_include_swipes").prop("disabled", unavailable() || !!draft);
    content.find("#ih_tc_config_save").prop("disabled", unavailable() || !draft);
    content.find("#ih_tc_preview_before, #ih_tc_preview_after, #ih_tc_preview_refresh").prop("disabled", unavailable());
    if (!profile()) content.find("#ih_tc_edit, #ih_tc_delete").prop("disabled", true);
    content.find(".ih-tc-mode").prop("disabled", unavailable() || !!draft);
    content.find("#ih_mgr_del_range_confirm").prop("disabled",
      mode === "tags" && (unavailable() || externalBusy || !!draft));
    if (!disposed && (externalBusy || busy || pendingCommit)) {
      if (!busyTimer) busyTimer = setTimeout(() => {
        busyTimer = null;
        if (!disposed) {
          if (pendingCommit && !busy) refresh();
          else syncButtons();
        }
      }, 250);
    } else {
      clearTimeout(busyTimer);
      busyTimer = null;
    }
  }

  function renderProfiles() {
    const items = profiles();
    content.find("#ih_tc_profile").html(items.length
      ? items.map((item) => '<option value="' + escapeHtml(item.id) + '">' +
        escapeHtml(item.name || "未命名配置") + "</option>").join("")
      : '<option value="">请先新建配置</option>');
    content.find("#ih_tc_profile").val(getSettings().tagCleanupProfileId);
    const rules = profile()?.rules;
    content.find("#ih_tc_rules_summary").html(Array.isArray(rules)
      ? rules.map(rulePreviewMarkup).join("")
      : "");
    syncButtons();
  }

  function stateKey() {
    return JSON.stringify([getContextKey(), selection(), profile()?.id, profile()?.rules, includeSwipes]);
  }

  function generatePlan() {
    clearTimeout(planTimer);
    planTimer = null;
    const selectedProfile = profile();
    if (!selectedProfile) {
      plan = null;
      planKey = stateKey();
      setStatus("");
      syncButtons();
      return null;
    }
    const floors = selection();
    if (!floors.length) {
      plan = null;
      planKey = stateKey();
      setStatus("");
      syncButtons();
      return null;
    }
    try {
      plan = buildTagCleanupPlan({
        messages: getMessages(), floors, rules: selectedProfile.rules,
        includeSwipes, contextKey: getContextKey(),
      });
      plan.binding = captureBinding();
      plan.profileName = selectedProfile.name;
      planKey = stateKey();
      setStatus(summary(plan));
    } catch (error) {
      plan = null;
      setStatus(error.message || "配置无效，请编辑后重试。");
    }
    syncButtons();
    onPlanChange();
    return plan;
  }

  function invalidate(reason, recompute = true) {
    clearTimeout(planTimer);
    planTimer = null;
    plan = null;
    planKey = "";
    if (view === "preview") {
      stalePreview = true;
      host.find("#ih_tc_preview_status").text(reason || "内容已变化，请重新预览。");
    }
    if (!pendingCommit) setStatus(reason || (selection().length ? "正在检查所选楼层…" : ""));
    syncButtons();
    onPlanChange();
    if (!disposed && recompute && active() && !pendingCommit && !draft) {
      planTimer = setTimeout(() => {
        if (!disposed) generatePlan();
      }, 120);
    }
  }

  function refresh() {
    if (disposed) return;
    if (pendingCommit && !busy) {
      const messages = getMessages();
      const fields = (message) => JSON.stringify([message?.mes, message?.swipe_id, message?.swipes]);
      const pendingCurrent = pendingCommit.contextKey === getContextKey() &&
        pendingCommit.length === messages.length &&
        pendingCommit.appliedChanges?.every(({ floor, message }) =>
          fields(messages[floor]) === fields(message));
      if (!pendingCurrent) {
        pendingCommit = null;
        invalidate("消息内容已变化，请重新预览；已有修改和撤回记录仍保留。");
      }
    }
    const tagMode = mode === "tags";
    content.find(".ih-tc-mode").each(function () {
      const selectedMode = $(this).attr("data-tc-mode") === mode;
      $(this).toggleClass("ih-tc-mode-active", selectedMode).attr("aria-pressed", String(selectedMode));
    });
    content.find(".ih-tc-panel").toggle(tagMode);
    content.find("#ih_mgr_del_confirm").toggle(!tagMode);
    content.find(".ih-tc-footer").toggle(tagMode);
    content.find("#ih_tc_delete_tip").text(tagMode
      ? "选择楼层和配置，删除匹配的起止标签及其中内容"
      : "勾选要删除的消息，或用范围选择批量框选");
    if (active() && !pendingCommit && !busy && !draft && stateKey() !== planKey) invalidate();
    syncButtons();
  }

  function showView(nextView) {
    view = nextView;
    host.css("display", "flex");
    content.addClass("ih-me-active");
    onViewChange(true);
  }

  function hideView() {
    view = null;
    previewPlan = null;
    stalePreview = false;
    host.hide().empty();
    content.removeClass("ih-me-active");
    onViewChange(false);
    refresh();
  }

  function readDraft() {
    if (!draft) return draft;
    draft.name = content.find("#ih_tc_config_name").val() || "";
    draft.rules = configEditor.find(".ih-tc-rule-row").toArray().map((row) => {
      const el = $(row);
      return { type: "markers", start: el.find(".ih-tc-rule-start").val() || "", end: el.find(".ih-tc-rule-end").val() || "" };
    });
    return draft;
  }

  function draftDirty() {
    return !!draft && JSON.stringify(readDraft()) !== draftBaseline;
  }

  async function confirmLeaveDraft() {
    if (!draftDirty()) return true;
    return confirmAction({
      title: "配置有未保存的修改", icon: "fa-pen",
      lines: ["是否放弃本次修改？已保存的配置会保留。"],
      okText: "放弃修改", okIcon: "fa-xmark", cancelText: "继续编辑",
    });
  }

  function updateDraftState() {
    configEditor.find(".ih-tc-dirty").text(draftDirty() ? "未保存" : "");
    configEditor.find("#ih_tc_config_error").text("");
  }

  function ruleMarkup(rule, index) {
    return '<div class="ih-tc-rule-row" data-rule-index="' + index + '">' +
      '<span class="ih-tc-rule-number">规则 ' + (index + 1) + '</span>' +
      '<div class="ih-tc-rule-fields">' +
      '<label><span>起始</span><textarea rows="1" class="ih-mgr-input ih-tc-rule-start" aria-label="规则 ' + (index + 1) + ' 的起始标记" placeholder="例如 &lt;think&gt;" spellcheck="false">' + escapeHtml(rule.start) + '</textarea></label>' +
      '<label><span>结束</span><textarea rows="1" class="ih-mgr-input ih-tc-rule-end" aria-label="规则 ' + (index + 1) + ' 的结束标记" placeholder="例如 &lt;/think&gt;" spellcheck="false">' + escapeHtml(rule.end) + '</textarea></label></div>' +
      '<button type="button" class="ih-mgr-btn ih-mgr-btn-mini ih-mgr-btn-icon ih-tc-rule-remove" title="删除这条规则" aria-label="删除规则 ' + (index + 1) + '"><i class="fa-solid fa-trash"></i></button></div>';
  }

  function renderRules() {
    configEditor.find(".ih-tc-config-rules").html(draft.rules.length
      ? draft.rules.map(ruleMarkup).join("")
      : "");
    protectIcons();
    updateDraftState();
  }

  function openConfig(edit) {
    if (disposed || unavailable() || draft || view) return;
    const source = edit ? profile() : null;
    if (edit && !source) return;
    draft = source ? clone(source) : { id: createProfileId(), name: "", rules: [{ type: "markers", start: "", end: "" }] };
    draft.rules = draft.rules.map(toMarkerRule);
    draftBaseline = JSON.stringify(draft);
    content.find("#ih_tc_profile, #ih_tc_rules_summary").hide();
    content.find("#ih_tc_profile_label").attr("for", "ih_tc_config_name");
    content.find("#ih_tc_config_name").val(draft.name).show();
    configEditor.css("display", "flex");
    renderRules();
    invalidate("", false);
    onViewChange(false);
    content.find("#ih_tc_config_name").trigger("focus");
  }

  function closeConfig() {
    draft = null;
    draftBaseline = "";
    content.find("#ih_tc_config_name").hide().val("");
    content.find("#ih_tc_profile, #ih_tc_rules_summary").show();
    content.find("#ih_tc_profile_label").attr("for", "ih_tc_profile");
    configEditor.hide();
    configEditor.find(".ih-tc-config-rules").empty();
    updateDraftState();
    syncButtons();
    onViewChange(false);
  }

  async function cancelConfig() {
    if (disposed || unavailable() || !draft) return;
    const currentDraft = draft;
    if (await confirmLeaveDraft() && !disposed && draft === currentDraft) {
      closeConfig();
      refresh();
    }
  }

  function saveConfig() {
    if (disposed || unavailable() || !draft) return;
    readDraft();
    const name = draft.name.trim();
    const validation = validateTagCleanupRules(draft.rules);
    let error = !name ? "请输入配置名称。" : "";
    let errorField = content.find("#ih_tc_config_name");
    if (!error && profiles().some((item) => item.id !== draft.id && item.name === name)) {
      error = "已有同名配置，请使用其他名称。";
    }
    if (!error && validation.errors.length) {
      const first = validation.errors[0];
      error = (first.index >= 0 ? "规则 " + (first.index + 1) + "：" : "") + first.message;
      errorField = first.index >= 0
        ? configEditor.find(".ih-tc-rule-row").eq(first.index).find(".ih-tc-rule-" + first.field)
        : configEditor.find("#ih_tc_add_rule");
    }
    if (error) {
      configEditor.find("#ih_tc_config_error").text(error);
      notify("warning", error);
      errorField.trigger("focus");
      return;
    }
    const saved = { id: draft.id, name, rules: validation.rules };
    const index = profiles().findIndex((item) => item.id === saved.id);
    if (index >= 0) profiles()[index] = saved;
    else profiles().push(saved);
    getSettings().tagCleanupProfileId = saved.id;
    saveSettings();
    closeConfig();
    renderProfiles();
    invalidate();
    notify("success", "已保存配置「" + name + "」");
  }

  async function deleteConfig() {
    const target = profile();
    if (!target || unavailable() || draft) return;
    const ok = await confirmAction({
      title: "删除标签配置", icon: "fa-trash",
      lines: ["确定删除配置「<b>" + escapeHtml(target.name) + "</b>」吗？"],
      okText: "删除配置", okIcon: "fa-trash", cancelText: "取消", danger: true,
    });
    if (!ok || disposed || unavailable()) return;
    const index = profiles().findIndex((item) => item.id === target.id);
    if (index < 0) return;
    profiles().splice(index, 1);
    normalizeTagCleanupSettings(getSettings());
    saveSettings();
    renderProfiles();
    invalidate();
    notify("success", "已删除配置「" + target.name + "」");
  }

  function renderPreview() {
    if (!previewPlan || view !== "preview") return;
    const previews = previewPlan.previews;
    previewIndex = Math.max(0, Math.min(previewIndex, previews.length - 1));
    const preview = previews[previewIndex];
    const label = preview.swipeIndex >= 0
      ? (preview.current ? "当前备选 " : "备选 ") + (preview.swipeIndex + 1)
      : "当前内容";
    const diagnostics = [...new Set(preview.result.diagnostics.map((item) => item.message))].slice(0, 3);
    host.attr("class", "ih-me-view ih-tc-preview-view").html(
      '<div class="ih-me-top"><button type="button" class="ih-me-back ih-tc-back"><i class="fa-solid fa-arrow-left"></i> 返回</button>' +
      '<span class="ih-me-title">标签删除预览</span></div>' +
      '<div class="ih-tc-preview-toolbar"><span class="ih-tc-preview-profile"><i class="fa-solid fa-tags"></i><span title="' + escapeHtml(previewPlan.profileName) + '">' + escapeHtml(previewPlan.profileName) + '</span></span>' +
      '<div class="ih-tc-preview-pager">' +
      '<button type="button" class="ih-mgr-btn ih-mgr-btn-mini ih-mgr-btn-icon" id="ih_tc_preview_prev" title="上一条待处理内容"' + (previewIndex === 0 ? " disabled" : "") + '><i class="fa-solid fa-chevron-left"></i></button>' +
      '<span class="ih-tc-preview-page-count">' + (previewIndex + 1) + " / " + previews.length + '</span>' +
      '<button type="button" class="ih-mgr-btn ih-mgr-btn-mini ih-mgr-btn-icon" id="ih_tc_preview_next" title="下一条待处理内容"' + (previewIndex === previews.length - 1 ? " disabled" : "") + '><i class="fa-solid fa-chevron-right"></i></button></div></div>' +
      '<div class="ih-tc-preview-status" id="ih_tc_preview_status" role="status">' +
      escapeHtml(stalePreview ? "聊天内容或选择已变化，请重新预览。" : summary(previewPlan)) + "</div>" +
      '<div class="ih-tc-preview-item"><div class="ih-tc-preview-head"><span class="ih-tc-preview-identity"><span class="ih-tc-preview-floor">#' + preview.floor + '</span><strong title="' + escapeHtml(preview.sender) + '">' +
      escapeHtml(preview.sender) + '</strong></span><span class="ih-tc-preview-variant">' + label + '</span><span class="ih-tc-hit-badge">' + preview.result.removedCount + " 处</span></div>" +
      '<div class="ih-tc-preview-controls"><div class="ih-tc-preview-modes" role="group" aria-label="预览视图">' +
      '<button type="button" class="ih-tc-preview-mode' + (!previewAfter ? " ih-tc-preview-mode-active" : "") + '" id="ih_tc_preview_before" aria-pressed="' + String(!previewAfter) + '">删除标记</button>' +
      '<button type="button" class="ih-tc-preview-mode' + (previewAfter ? " ih-tc-preview-mode-active" : "") + '" id="ih_tc_preview_after" aria-pressed="' + String(previewAfter) + '">清理后</button></div>' +
      '<button type="button" class="ih-mgr-btn ih-mgr-btn-mini ih-mgr-btn-icon" id="ih_tc_preview_refresh" title="重新预览"><i class="fa-solid fa-rotate"></i></button></div>' +
      (diagnostics.length ? '<div class="ih-tc-preview-diagnostics"><i class="fa-solid fa-circle-info"></i><span>' + escapeHtml(diagnostics.join(" ")) + "</span></div>" : "") +
      '<div class="ih-tc-preview-list"><div class="ih-tc-preview-text">' + previewMarkup(preview, previewAfter) + "</div></div></div>" +
      '<div class="ih-tc-config-footer"><button type="button" class="ih-mgr-btn" id="ih_tc_preview_retry" style="display:none;"><i class="fa-solid fa-rotate"></i> 重试保存</button>' +
      '<button type="button" class="ih-mgr-btn ih-mgr-btn-warn ih-mgr-btn-primary" id="ih_tc_preview_apply">删除标签及内容</button></div>');
    syncButtons();
    protectIcons();
  }

  function openPreview(floor) {
    if (busy || pendingCommit || draft) return false;
    const generated = generatePlan();
    if (!generated?.previews.length) return false;
    const index = floor === undefined ? 0 : generated.previews.findIndex((item) => item.floor === floor);
    if (index < 0) return false;
    previewPlan = generated;
    previewIndex = index;
    previewAfter = false;
    stalePreview = false;
    showView("preview");
    renderPreview();
    return true;
  }

  async function execute(retry = false) {
    if (busy || isBusy() || disposed) return;
    let target = retry ? pendingCommit : plan;
    if (!retry) {
      if (!target?.removedCount) return;
      if (planKey !== stateKey() ||
          !isTagCleanupPlanCurrent(target, getMessages(), getContextKey()) ||
          (view === "preview" && (stalePreview || previewPlan !== target))) {
        invalidate("聊天内容已变化，请重新预览后再删除。");
        notify("warning", "聊天内容已变化，请重新预览后再删除。");
        return;
      }
    } else if (!target) return;
    busy = true;
    syncButtons();
    try {
      if (!retry && getSettings().confirmDangerousActions) {
        const ok = await confirmAction({
          title: "删除标签及内容", icon: "fa-tags",
          lines: [
            "使用配置「<b>" + escapeHtml(target.profileName) + "</b>」处理所选楼层。",
            escapeHtml(summary(target)),
            '<span class="ih-cf-dim">' + (includeSwipes ? "同时处理其他备选回复。" : "仅处理各楼当前显示的回复。") + "</span>",
            '<span class="ih-cf-dim">操作后 5 分钟内可通过「撤回删除」还原。</span>',
          ],
          okText: "删除标签及内容", okIcon: "fa-trash", cancelText: "取消", danger: true,
        });
        if (!ok || disposed) return;
      }
      if (!retry && (isBusy() || planKey !== stateKey() ||
          !isTagCleanupPlanCurrent(target, getMessages(), getContextKey()))) {
        invalidate("聊天内容已变化，请重新预览后再删除。");
        notify("warning", "聊天内容已变化，请重新预览后再删除。");
        return;
      }
      const result = await commit(target, retry);
      if (result.ok) {
        pendingCommit = null;
        notify("success", "已删除 " + target.removedCount + " 处标签及内容，可通过「撤回删除」还原");
        if (!disposed) {
          if (view === "preview") hideView();
          invalidate("", true);
        }
      } else {
        if (result.applied) pendingCommit = target;
        const message = result.reason || "保存未确认";
        const feedback = message + (result.applied ? "；修改仍保留，可重试保存或通过「撤回删除」还原。" : "；请重新预览后重试。");
        notify("error", feedback);
        if (!disposed) {
          setStatus(feedback);
          host.find("#ih_tc_preview_status").text(feedback);
          if (!result.applied) invalidate(feedback);
        }
      }
    } catch (error) {
      const feedback = error.message || "操作失败，请重试。";
      notify("error", feedback);
      if (!disposed) invalidate(feedback);
    } finally {
      busy = false;
      if (!disposed) {
        syncButtons();
        refresh();
      }
    }
  }

  content.on("click.ihTagCleanup", ".ih-tc-mode", function () {
    if (unavailable()) return;
    mode = $(this).attr("data-tc-mode") === "tags" ? "tags" : "messages";
    invalidate("", false);
    refresh();
  });
  content.on("change.ihTagCleanup", "#ih_tc_profile", function () {
    if (unavailable()) return;
    getSettings().tagCleanupProfileId = $(this).val() || "";
    saveSettings();
    renderProfiles();
    invalidate();
  });
  content.on("change.ihTagCleanup", "#ih_tc_include_swipes", function () {
    if (unavailable() || draft) return;
    includeSwipes = this.checked;
    invalidate();
  });
  content.on("click.ihTagCleanup", "#ih_tc_new", () => openConfig(false));
  content.on("click.ihTagCleanup", "#ih_tc_edit", () => openConfig(true));
  content.on("click.ihTagCleanup", "#ih_tc_delete", deleteConfig);
  content.on("click.ihTagCleanup", "#ih_tc_preview", () => openPreview());
  content.on("click.ihTagCleanup", "#ih_tc_apply, #ih_tc_preview_apply", () => execute(false));
  content.on("click.ihTagCleanup", "#ih_tc_retry, #ih_tc_preview_retry", () => execute(true));
  content.on("click.ihTagCleanup", ".ih-tc-back", async () => {
    if (!busy && await confirmLeaveDraft()) hideView();
  });
  content.on("click.ihTagCleanup", "#ih_tc_config_save", saveConfig);
  content.on("click.ihTagCleanup", "#ih_tc_config_cancel", cancelConfig);
  content.on("input.ihTagCleanup", "#ih_tc_config_name, .ih-tc-rule-fields input, .ih-tc-rule-fields textarea", updateDraftState);
  content.on("click.ihTagCleanup", "#ih_tc_add_rule", () => {
    if (!draft) return;
    readDraft();
    draft.rules.push({ type: "markers", start: "", end: "" });
    renderRules();
    configEditor.find(".ih-tc-rule-start").last().trigger("focus");
  });
  content.on("click.ihTagCleanup", ".ih-tc-rule-remove", function () {
    if (!draft) return;
    readDraft();
    draft.rules.splice(Number($(this).closest(".ih-tc-rule-row").attr("data-rule-index")), 1);
    renderRules();
  });
  content.on("keydown.ihTagCleanup", ".ih-tc-profile-row, .ih-tc-config-inline", (event) => {
    if (draft && (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
      event.preventDefault();
      event.stopImmediatePropagation();
      saveConfig();
    }
  });
  content.on("click.ihTagCleanup", "#ih_tc_preview_prev, #ih_tc_preview_next", function () {
    previewIndex += this.id === "ih_tc_preview_prev" ? -1 : 1;
    renderPreview();
  });
  content.on("click.ihTagCleanup", "#ih_tc_preview_before, #ih_tc_preview_after", function () {
    previewAfter = this.id === "ih_tc_preview_after";
    renderPreview();
  });
  content.on("click.ihTagCleanup", "#ih_tc_preview_refresh", () => {
    if (!busy && !pendingCommit) openPreview();
  });
  renderProfiles();
  refresh();

  return {
    isTagMode: () => mode === "tags",
    isBusy: () => busy,
    async deleteSelected() {
      if (disposed || !active() || unavailable() || isBusy() || draft) return;
      const target = generatePlan();
      if (!target) return;
      if (!target.removedCount) {
        notify("info", "所选楼层中没有匹配的标签及内容。");
        return;
      }
      await execute();
    },
    hasView: () => !!view,
    isEditingProfile: () => !!draft,
    refresh,
    invalidate: (reason) => {
      if (!busy) invalidate(reason || "聊天内容已变化，正在重新检查…");
    },
    rowBadge(floor) {
      if (!active() || !plan) return "";
      const stats = plan.floorStats.get(floor);
      if (!stats || (!stats.removedCount && !stats.skippedCount)) return "";
      return '<span class="ih-tc-hit-badge" title="' +
        escapeHtml(stats.removedCount + " 处待删除" + (stats.skippedCount ? "；跳过 " + stats.skippedCount + " 处" : "")) +
        '">' + (stats.removedCount ? stats.removedCount + " 处" : "已跳过") + "</span>";
    },
    openFloorPreview: (floor) => active() && openPreview(floor),
    async requestBack() {
      if (busy) return;
      if (view) hideView();
      else await cancelConfig();
    },
    async confirmClose() {
      if (busy) {
        notify("info", "正在保存，请稍候。");
        return false;
      }
      if (pendingCommit) {
        return confirmAction({
          title: "标签清理保存尚未确认", icon: "fa-circle-exclamation",
          lines: [
            "请先重试保存，或使用「撤回删除」恢复原文。",
            "仍要关闭消息管理吗？",
          ],
          okText: "仍然关闭", okIcon: "fa-xmark", cancelText: "返回",
        });
      }
      return confirmLeaveDraft();
    },
    destroy() {
      disposed = true;
      clearTimeout(planTimer);
      clearTimeout(busyTimer);
      content.off(".ihTagCleanup");
      plan = null;
      previewPlan = null;
      draft = null;
    },
  };
}

const MESSAGE_FIELDS = ["mes", "swipe_id", "swipes"];

function messageSignature(message) {
  if (!message || typeof message !== "object") return null;
  const fields = {};
  for (const key of MESSAGE_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(message, key)) {
      fields[key] = message[key];
    }
  }
  return JSON.stringify(fields);
}

function cancellableDelay(ms, signal) {
  if (signal?.aborted) return Promise.resolve(false);
  return new Promise((resolve) => {
    let timer;
    const finish = (elapsed) => {
      clearTimeout(timer);
      signal?.removeEventListener("abort", onAbort);
      resolve(elapsed);
    };
    const onAbort = () => finish(false);
    timer = setTimeout(() => finish(true), ms);
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

function awaitOperation(operation, timeoutMs, signal) {
  return new Promise((resolve) => {
    let settled = false;
    let timer;
    const finish = (result) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      signal?.removeEventListener("abort", onAbort);
      resolve(result);
    };
    const onAbort = () => finish({ completed: false, cancelled: true });
    Promise.resolve(operation).then(
      (value) => finish({ completed: true, value }),
      (error) => finish({ completed: true, error }),
    );
    timer = setTimeout(
      () => finish({ completed: false, timedOut: true }),
      timeoutMs,
    );
    if (signal?.aborted) onAbort();
    else signal?.addEventListener("abort", onAbort, { once: true });
  });
}

function readMessages(data) {
  if (!Array.isArray(data)) return null;
  const first = data[0];
  const hasHeader =
    first &&
    typeof first === "object" &&
    (Object.prototype.hasOwnProperty.call(first, "chat_metadata") ||
      (!Object.prototype.hasOwnProperty.call(first, "mes") &&
        (Object.prototype.hasOwnProperty.call(first, "user_name") ||
          Object.prototype.hasOwnProperty.call(first, "character_name"))));
  return hasHeader ? data.slice(1) : data;
}

export function createTagCleanupChatSaver({
  getContext,
  getRequestHeaders,
  saveCurrentChat,
  isChatSaving = () => false,
  isGenerating = () => false,
  fetchImpl = (...args) => globalThis.fetch(...args),
  waitIdleTimeoutMs = 5000,
  nativeSaveTimeoutMs = 15000,
  verificationTimeoutMs = 10000,
  pollIntervalMs = 75,
} = {}) {
  if (
    typeof getContext !== "function" ||
    typeof getRequestHeaders !== "function" ||
    typeof saveCurrentChat !== "function"
  ) {
    throw new TypeError("Tag cleanup requires native chat save dependencies.");
  }

  let busy = false;

  function captureBinding() {
    try {
      const context = getContext();
      const chatId = String(context?.getCurrentChatId?.() || "");
      if (!chatId) return null;
      const groupId = context.groupId ? String(context.groupId) : null;
      const characterId = groupId ? null : context.characterId;
      const character = groupId ? null : context.characters?.[characterId];
      const avatar = groupId ? "" : String(character?.avatar || "");
      if (!groupId && !avatar) return null;
      const binding = {
        type: groupId ? "group" : "character",
        chatId,
        groupId,
        characterId: characterId === undefined ? null : characterId,
        characterName: String(character?.name || ""),
        avatar,
      };
      binding.key = JSON.stringify([
        binding.type,
        binding.chatId,
        binding.groupId,
        binding.characterId,
        binding.avatar,
      ]);
      return Object.freeze(binding);
    } catch {
      return null;
    }
  }

  function matchesBinding(binding) {
    const current = captureBinding();
    return !!binding?.key && current?.key === binding.key;
  }

  function fail(code, reason, uncertain = false, extra = {}) {
    return { ok: false, uncertain, code, reason, ...extra };
  }

  function matchesPlan(messages, expectedLength, expected) {
    if (!Array.isArray(messages) || messages.length !== expectedLength) {
      return false;
    }
    return expected.every(
      ({ floor, signature }) =>
        messageSignature(messages[floor]) === signature,
    );
  }

  async function readBoundChat(binding, signal) {
    const controller = new AbortController();
    const onAbort = () => controller.abort();
    const timer = setTimeout(() => controller.abort(), verificationTimeoutMs);
    if (signal?.aborted) controller.abort();
    else signal?.addEventListener("abort", onAbort, { once: true });
    try {
      const group = binding.type === "group";
      const response = await fetchImpl(
        group ? "/api/chats/group/get" : "/api/chats/get",
        {
          method: "POST",
          headers: getRequestHeaders(),
          cache: "no-store",
          signal: controller.signal,
          body: JSON.stringify(
            group
              ? { id: binding.chatId }
              : {
                  ch_name: binding.characterName,
                  file_name: binding.chatId,
                  avatar_url: binding.avatar,
                },
          ),
        },
      );
      if (!response.ok) {
        throw new Error("Cannot read saved chat: HTTP " + response.status);
      }
      const messages = readMessages(await response.json());
      if (!messages) throw new Error("Unexpected saved chat response.");
      return messages;
    } finally {
      clearTimeout(timer);
      signal?.removeEventListener("abort", onAbort);
    }
  }

  async function saveAndVerify({
    binding,
    expectedLength,
    changes,
    signal,
  } = {}) {
    if (busy) return fail("busy", "正在确认上一次保存，请稍后再试。");
    let expected;
    try {
      if (
        !binding?.key ||
        !Number.isInteger(expectedLength) ||
        expectedLength < 1 ||
        !Array.isArray(changes) ||
        !changes.length
      ) {
        return fail("invalid_plan", "没有有效的待保存消息，请重新预览。");
      }
      expected = changes.map(({ floor, message }) => {
        if (!Number.isInteger(floor) || floor < 0 || floor >= expectedLength) {
          throw new Error("Invalid cleanup floor.");
        }
        const signature = messageSignature(message);
        if (signature === null) throw new Error("Invalid cleanup message.");
        return { floor, signature };
      });
    } catch {
      return fail("invalid_plan", "待保存消息已失效，请重新预览。");
    }

    busy = true;
    let nativeStarted = false;
    try {
      const deadline = Date.now() + waitIdleTimeoutMs;
      while (true) {
        if (signal?.aborted) return fail("cancelled", "已取消本次保存等待。");
        if (!matchesBinding(binding)) {
          return fail("context_changed", "聊天已切换，已取消本次保存。");
        }
        if (isGenerating()) {
          return fail("generating", "正在生成回复，请生成结束后重试保存。");
        }
        if (!isChatSaving()) break;
        if (Date.now() >= deadline) {
          return fail("save_busy", "聊天仍在保存，请稍后重试保存。");
        }
        const elapsed = await cancellableDelay(pollIntervalMs, signal);
        if (!elapsed) return fail("cancelled", "已取消本次保存等待。");
      }
      if (!matchesPlan(getContext()?.chat, expectedLength, expected)) {
        return fail(
          "live_changed",
          "楼层或消息内容已发生变化，请重新预览后再保存。",
        );
      }

      nativeStarted = true;
      let nativeResult;
      try {
        nativeResult = await awaitOperation(
          saveCurrentChat(),
          nativeSaveTimeoutMs,
          signal,
        );
      } catch (error) {
        nativeResult = { completed: true, error };
      }
      if (nativeResult.cancelled) {
        return fail(
          "cancelled_after_save",
          "保存请求已发出，结果尚未确认；当前改动仍可撤回。",
          true,
        );
      }

      const messages = await readBoundChat(binding, signal);
      const contextChanged = !matchesBinding(binding);
      if (!matchesPlan(messages, expectedLength, expected)) {
        return fail(
          nativeResult.timedOut ? "save_unconfirmed" : "verification_mismatch",
          nativeResult.timedOut
            ? "保存结果尚未确认；当前改动仍可撤回，请稍后重试保存。"
            : "服务器中的消息与本次更改不一致，保存未确认；当前改动仍可撤回。",
          !!nativeResult.timedOut,
          { contextChanged },
        );
      }
      const liveChanged =
        !contextChanged &&
        !matchesPlan(getContext()?.chat, expectedLength, expected);
      return {
        ok: true,
        uncertain: false,
        code: "verified",
        reason: "本次更改已保存并确认。",
        contextChanged,
        liveChanged,
      };
    } catch {
      return fail(
        "verification_failed",
        nativeStarted
          ? "读取保存结果失败，保存结果尚未确认；当前改动仍可撤回，请重试保存。"
          : "暂时无法保存聊天，请稍后重试保存。",
        nativeStarted,
        { contextChanged: !matchesBinding(binding) },
      );
    } finally {
      busy = false;
    }
  }

  return {
    captureBinding,
    matchesBinding,
    saveAndVerify,
    isBusy: () => busy,
  };
}
