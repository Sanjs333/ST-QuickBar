import assert from "node:assert/strict";
import test from "node:test";
import {
  planTagCleanup,
  validateTagCleanupRules,
  applyTagCleanupPlan,
  buildTagCleanupPlan,
  isTagCleanupPlanCurrent,
  normalizeTagCleanupSettings,
  createTagCleanupChatSaver,
} from "../tag-cleanup.js";

const rules = [{ type: "tag", name: "think" }];
const clone = (value) => JSON.parse(JSON.stringify(value));
const build = (messages, options = {}) => buildTagCleanupPlan({
  messages, floors: messages.map((_, index) => index), rules,
  contextKey: "character/chat", ...options,
});

test("removes nested pairs and quoted attributes without changing surrounding whitespace", () => {
  const result = planTagCleanup('前\n<think hint="a > b">外<think>内</think>层</think>\n后', rules);
  assert.equal(result.text, "前\n\n后");
  assert.equal(result.removedCount, 1);
  assert.equal(result.matchCount, 2);
});

test("similar names, case, comments and self-closing tags remain literal", () => {
  const text = "<thinking>x</thinking><Think>x</Think><!-- <think>x</think> --><think/>";
  assert.equal(planTagCleanup(text, rules).text, text);
});

test("an incomplete outer block protects complete children across configured rules", () => {
  const text = "<think>未完<status>完整</status>";
  const result = planTagCleanup(text, [...rules, { type: "tag", name: "status" }]);
  assert.equal(result.text, text);
  assert.equal(result.removedCount, 0);
  assert.equal(result.incompleteCount, 1);
  assert.equal(result.protectedCount, 1);
});

test("custom markers preserve literal whitespace and support nesting", () => {
  const markerRules = [{ type: "markers", start: "[思考]\n", end: "\n[/思考]" }];
  const result = planTagCleanup("前[思考]\n外[思考]\n内\n[/思考]层\n[/思考]后", markerRules);
  assert.equal(result.text, "前后");
  assert.equal(result.removedCount, 1);
  assert.equal(result.matchCount, 2);
});

test("configuration validation normalizes pasted tags and rejects ambiguous or duplicate rules", () => {
  assert.deepEqual(validateTagCleanupRules([{ type: "tag", name: "</think>" }]).rules, rules);
  assert.equal(validateTagCleanupRules([...rules, ...rules]).errors[0].code, "duplicate");
  assert.equal(validateTagCleanupRules([{ type: "markers", start: "x", end: "x" }]).errors[0].code, "identical");
  assert.equal(validateTagCleanupRules([{ type: "tag", name: "think .*" }]).errors[0].field, "name");
});

test("saved profiles get stable unique IDs without changing their literal marker text", () => {
  const settings = {
    tagCleanupProfiles: [
      { id: "same", name: "A", rules },
      { id: "same", name: "B", rules: [{ type: "markers", start: " x ", end: " y " }] },
    ],
    tagCleanupProfileId: "missing",
  };
  normalizeTagCleanupSettings(settings);
  assert.equal(new Set(settings.tagCleanupProfiles.map((profile) => profile.id)).size, 2);
  assert.equal(settings.tagCleanupProfileId, "same");
  assert.equal(settings.tagCleanupProfiles[1].rules[0].start, " x ");
  const normalized = clone(settings);
  normalizeTagCleanupSettings(settings);
  assert.deepEqual(settings, normalized);
});

test("only selected floors change and the shallow undo snapshot retains every original object", () => {
  const messages = [
    { mes: "<think>A</think>一", extra: { token_count: 20, reasoning: "metadata" } },
    { mes: "<think>B</think>二" },
    { mes: "<think>C</think>三" },
  ];
  const original = clone(messages);
  const snapshot = messages.slice();
  const plan = build(messages, { floors: [2, 0, 2] });
  assert.equal(plan.removedCount, 2);
  assert.deepEqual(messages, original);
  const changes = applyTagCleanupPlan(plan, messages, "character/chat");
  assert.deepEqual(changes.map(({ floor }) => floor), [0, 2]);
  assert.deepEqual(messages.map(({ mes }) => mes), ["一", original[1].mes, "三"]);
  assert.equal(messages[0].extra.token_count, undefined);
  assert.equal(messages[0].extra.reasoning, "metadata");
  assert.deepEqual(snapshot, original);
  assert.notEqual(messages[0], snapshot[0]);
  assert.equal(messages[1], snapshot[1]);
  messages.splice(0, messages.length, ...snapshot);
  assert.deepEqual(messages, original);
});

test("visible mes is cleaned once and its current swipe slot stays synchronized", () => {
  const messages = [{
    mes: "<think>正在显示</think>正文",
    swipe_id: 1,
    swipes: ["<think>另一条</think>备选", "<think>旧缓存</think>过时"],
    swipe_info: [{ extra: { token_count: 10 } }, { extra: { token_count: 20 } }],
  }];
  const plan = build(messages);
  assert.equal(plan.removedCount, 1);
  assert.equal(plan.changedVariants, 1);
  applyTagCleanupPlan(plan, messages, "character/chat");
  assert.equal(messages[0].mes, "正文");
  assert.equal(messages[0].swipes[1], "正文");
  assert.equal(messages[0].swipes[0], "<think>另一条</think>备选");
  assert.equal(messages[0].swipe_info[0].extra.token_count, 10);
  assert.equal(messages[0].swipe_info[1].extra.token_count, undefined);
});

test("all candidates are cleaned independently with no duplicate current-mes count", () => {
  const messages = [{
    mes: "当前<think>一</think>",
    swipe_id: 1,
    swipes: ["其他<think>二</think><think>三</think>", "当前<think>一</think>", "<think>未闭合"],
  }];
  const plan = build(messages, { includeSwipes: true });
  assert.equal(plan.removedCount, 2);
  assert.equal(plan.changedVariants, 2);
  assert.equal(plan.skippedCount, 1);
  applyTagCleanupPlan(plan, messages, "character/chat");
  assert.deepEqual(messages[0].swipes, ["其他", "当前", "<think>未闭合"]);
  assert.equal(messages[0].mes, "当前");
  assert.equal(messages[0].swipe_id, 1);
});

test("clearing a whole message body retains its floor and its sender", () => {
  const messages = [{ name: "角色", mes: "<think>全部</think>", is_user: false }];
  const plan = build(messages);
  assert.equal(plan.emptyCount, 1);
  applyTagCleanupPlan(plan, messages, "character/chat");
  assert.equal(messages.length, 1);
  assert.equal(messages[0].mes, "");
  assert.equal(messages[0].name, "角色");
});

test("a sparse current swipe still cleans visible mes when including all candidates", () => {
  const swipes = ["其他"];
  swipes.length = 2;
  const messages = [{ mes: "<think>当前</think>正文", swipes, swipe_id: 1 }];
  const plan = build(messages, { includeSwipes: true });
  assert.equal(plan.removedCount, 1);
  applyTagCleanupPlan(plan, messages, "character/chat");
  assert.equal(messages[0].mes, "正文");
  assert.equal(messages[0].swipes[1], "正文");
});

test("a legacy missing swipe index is repaired to keep cleaned visible content selected", () => {
  const messages = [{
    mes: "<think>当前</think>正文",
    swipes: ["其他正文", "<think>当前</think>正文"],
  }];
  const plan = build(messages);
  applyTagCleanupPlan(plan, messages, "character/chat");
  assert.equal(messages[0].swipe_id, 1);
  assert.equal(messages[0].mes, "正文");
  assert.equal(messages[0].swipes[messages[0].swipe_id], "正文");
  assert.equal(messages[0].swipes[0], "其他正文");
});

test("synchronizing a stale visible swipe clears its stale token count", () => {
  const messages = [{
    mes: "最新正文", swipe_id: 0,
    swipes: ["旧正文", "<think>其他思考</think>其他"],
    swipe_info: [{ extra: { token_count: 40 } }, { extra: { token_count: 30 } }],
  }];
  const plan = build(messages, { includeSwipes: true });
  applyTagCleanupPlan(plan, messages, "character/chat");
  assert.equal(messages[0].swipes[0], "最新正文");
  assert.equal(messages[0].swipe_info[0].extra.token_count, undefined);
});

test("malformed saved rule rows do not prevent opening configuration management", () => {
  const settings = { tagCleanupProfiles: [{ id: "A", name: "A", rules: [null, 0, [], ...rules] }] };
  normalizeTagCleanupSettings(settings);
  assert.deepEqual(settings.tagCleanupProfiles[0].rules, rules);
});

for (const [name, mutate] of [
  ["body edits", (messages) => { messages[0].mes = "新内容"; }],
  ["new floors", (messages) => { messages.push({ mes: "新楼层" }); }],
  ["object replacement", (messages) => { messages[0] = clone(messages[0]); }],
  ["swipe changes", (messages) => { messages[0].swipe_id = 1; }],
  ["unmatched selected floors becoming matches", (messages) => { messages[1].mes = "<think>新增</think>"; }],
]) {
  test("stale preview refuses " + name, () => {
    const messages = [{ mes: "<think>旧</think>", swipe_id: 0, swipes: ["<think>旧</think>", "备选"] }, { mes: "原文" }];
    const plan = build(messages);
    mutate(messages);
    assert.equal(isTagCleanupPlanCurrent(plan, messages, "character/chat"), false);
    assert.throws(() => applyTagCleanupPlan(plan, messages, "character/chat"), /重新预览/);
  });
}

test("same-named chat under another character is a stale preview", () => {
  const messages = [{ mes: "<think>旧</think>" }];
  const plan = build(messages);
  assert.equal(isTagCleanupPlanCurrent(plan, messages, "other-character/chat"), false);
});

function saverFixture({ group = false, failSave = false, failRead = false } = {}) {
  const context = {
    chat: [{ mes: "正文", swipe_id: 0, swipes: ["正文", "备选"] }],
    characterId: 0,
    characters: [{ name: "角色", avatar: "role.png" }],
    groupId: group ? "group-1" : null,
    getCurrentChatId: () => "chat-1",
  };
  let saved = [{ mes: "<think>旧</think>正文", swipe_id: 0, swipes: ["<think>旧</think>正文", "备选"] }];
  let nativeCalls = 0;
  let request = null;
  const saver = createTagCleanupChatSaver({
    getContext: () => context,
    getRequestHeaders: () => ({ "Content-Type": "application/json" }),
    saveCurrentChat: async () => {
      nativeCalls++;
      if (!failSave) saved = clone(context.chat);
    },
    fetchImpl: async (url, options) => {
      request = { url, body: JSON.parse(options.body) };
      if (failRead) throw new Error("offline");
      return { ok: true, json: async () => [{ chat_metadata: {} }, ...saved] };
    },
  });
  const save = () => saver.saveAndVerify({
    binding: saver.captureBinding(), expectedLength: 1,
    changes: [{ floor: 0, message: clone(context.chat[0]) }],
  });
  return { context, saver, save, getRequest: () => request, getNativeCalls: () => nativeCalls };
}

test("save success is confirmed by reading the bound character file", async () => {
  const fixture = saverFixture();
  const result = await fixture.save();
  assert.equal(result.ok, true);
  assert.equal(fixture.getNativeCalls(), 1);
  assert.deepEqual(fixture.getRequest(), {
    url: "/api/chats/get",
    body: { ch_name: "角色", file_name: "chat-1", avatar_url: "role.png" },
  });
});

test("group save verification reads the bound group chat", async () => {
  const fixture = saverFixture({ group: true });
  assert.equal((await fixture.save()).ok, true);
  assert.deepEqual(fixture.getRequest(), { url: "/api/chats/group/get", body: { id: "chat-1" } });
});

test("native save swallowing failure does not report success", async () => {
  const fixture = saverFixture({ failSave: true });
  const result = await fixture.save();
  assert.equal(result.ok, false);
  assert.equal(result.code, "verification_mismatch");
});

test("unreadable save results remain uncertain", async () => {
  const fixture = saverFixture({ failRead: true });
  const result = await fixture.save();
  assert.equal(result.ok, false);
  assert.equal(result.uncertain, true);
  assert.equal(fixture.context.chat[0].mes, "正文");
});

test("save rejects a binding that switched characters before execution", async () => {
  const fixture = saverFixture();
  const binding = fixture.saver.captureBinding();
  fixture.context.characters[0].avatar = "other.png";
  const result = await fixture.saver.saveAndVerify({
    binding, expectedLength: 1, changes: [{ floor: 0, message: fixture.context.chat[0] }],
  });
  assert.equal(result.code, "context_changed");
  assert.equal(fixture.getNativeCalls(), 0);
});
