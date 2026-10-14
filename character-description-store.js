/**
 * Whitelisted character-field persistence; no context, DOM, or whole-character updates.
 * All reads use POST /api/characters/get, as required by the host API.
 */

const REQUEST_TIMEOUT_MS = 15000;
const CHARACTER_FIELDS = new Set(["description", "personality", "scenario", "first_mes"]);

function storeError(code, message, details = {}) {
  return Object.assign(new Error(message), { code }, details);
}

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function validateAvatar(avatar) {
  // Keep the exact filename: never normalize a path into a different character.
  if (
    typeof avatar !== "string" ||
    !avatar.endsWith(".png") ||
    !avatar.slice(0, -4).trim() ||
    /[/\\<>:"|?*\u0000-\u001f\u007f]/.test(avatar)
  ) {
    throw storeError("invalid", "角色头像标识无效：必须是非空的 PNG 文件名，不能包含路径或非法字符。");
  }
}

function validateField(field) {
  if (!CHARACTER_FIELDS.has(field)) {
    throw storeError("invalid", "角色字段无效：仅支持 description、personality、scenario 和 first_mes。");
  }
}

/** @typedef {"description" | "personality" | "scenario" | "first_mes"} CharacterField */
/** @typedef {{avatar: string, field: CharacterField, name: string, value: string, character: object}} CharacterFieldSnapshot */
/** @typedef {CharacterFieldSnapshot} DescriptionSnapshot */

function toSnapshot(avatar, field, character) {
  if (
    !isRecord(character) ||
    character.error ||
    character.avatar !== avatar ||
    (character.data !== undefined && !isRecord(character.data))
  ) {
    throw storeError("invalid", "服务器返回的角色记录无效或头像标识不匹配，请重新读取角色。");
  }

  // Match characters.js readFromV2: v2 fields take precedence, including "".
  // Do not hide a malformed v2 value by silently using a stale v1 field.
  const name = character.data?.name !== undefined ? character.data.name : character.name;
  const value = character.data?.[field] !== undefined
    ? character.data[field]
    : character[field];
  if (typeof name !== "string" || !name.trim() || name === "." || typeof value !== "string") {
    throw storeError("invalid", "角色记录缺少有效的名称或字符串字段内容，请检查角色数据。");
  }

  return { avatar, field, name, value, character };
}

/**
 * Create an isolated store with per-avatar save queues and 15-second request timeouts.
 * Internal errors have .code: conflict, missing, network, invalid, or verify.
 * Conflict / verification mismatch errors expose the most recent snapshot as .latest.
 * Field selection is whitelisted and defaults to description for existing callers.
 * @param {{fetch?: typeof globalThis.fetch, getRequestHeaders?: () => HeadersInit}} [options]
 * @returns {{load: (avatar: string, field?: CharacterField) => Promise<CharacterFieldSnapshot>, save: (options: {
 *   avatar: string, field?: CharacterField, baseline: string, value: string,
 *   beforeWrite?: (latest: CharacterFieldSnapshot) => void
 * }) => Promise<CharacterFieldSnapshot>}}
 */
export function createCharacterFieldStore({
  fetch: fetcher = globalThis.fetch,
  getRequestHeaders = () => ({ "Content-Type": "application/json" }),
} = {}) {
  if (typeof fetcher !== "function" || typeof getRequestHeaders !== "function") {
    throw storeError("invalid", "角色字段存储需要有效的请求函数和请求头函数。");
  }

  // The endpoint rewrites the card, so all fields for an avatar share a queue.
  const saveQueues = new Map();

  async function post(path, body, readJson = false, beforeSend) {
    let headers;
    try {
      headers = getRequestHeaders();
    } catch (cause) {
      throw storeError("invalid", "无法获取角色请求头，请检查登录状态及请求配置。", { cause });
    }
    const controller = new AbortController();
    const options = {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      cache: "no-store",
      signal: controller.signal,
    };
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    const requestFailure = (cause) => storeError(
      "network",
      controller.signal.aborted
        ? "角色字段请求超时；若已提交保存，服务器仍可能完成写入，请重新读取或重试。"
        : readJson
          ? "读取角色字段失败，请检查网络连接后重试。"
          : "保存请求失败，结果尚未确认；请保留草稿并重新读取或重试。",
      { cause },
    );

    try {
      // Everything is prepared before the synchronous guard. No await or header
      // callbacks may intervene between this check and the actual fetch call.
      if (beforeSend) beforeSend();
      let response;
      try {
        response = await fetcher(path, options);
      } catch (cause) {
        throw requestFailure(cause);
      }
      if (!response || typeof response.ok !== "boolean") {
        throw storeError("invalid", "角色接口返回了无效的 HTTP 响应。");
      }
      if (!response.ok) {
        const status = response.status;
        if (status === 404 || status === 410) {
          throw storeError("missing", "角色不存在、已被删除或已更换头像，请重新选择角色。", { status });
        }
        if (status === 409 || status === 412) {
          throw storeError("conflict", "服务器报告角色数据冲突，请重新读取后再保存。", { status });
        }
        const code = status === 400 || status === 422 ? "invalid" : "network";
        throw storeError(code, `角色字段请求失败（HTTP ${status}），请检查登录状态、角色数据或服务器连接。`, { status });
      }
      // edit-attribute returns plain text "OK", not JSON; the subsequent read
      // is the authority on whether the selected field value was actually persisted.
      if (!readJson) return;
      if (typeof response.json !== "function") {
        throw storeError("invalid", "角色接口未返回可读取的 JSON 数据。");
      }
      try {
        return await response.json();
      } catch (cause) {
        if (controller.signal.aborted || !(cause instanceof SyntaxError)) {
          throw requestFailure(cause);
        }
        throw storeError("invalid", "角色接口返回的 JSON 数据无法解析，请检查服务器或角色文件。", { cause });
      }
    } finally {
      clearTimeout(timer);
    }
  }

  /** Read a fresh persisted field snapshot; never read from the active UI/context. */
  async function load(avatar, field = "description") {
    validateAvatar(avatar);
    validateField(field);
    const character = await post("/api/characters/get", { avatar_url: avatar }, true);
    return toSnapshot(avatar, field, character);
  }

  /**
   * baseline is the exact previously loaded snapshot.value for the same field, not the draft.
   * Reject external changes, except when the desired value is already saved (safe
   * retry/no-op). This check is best effort: the backend has no atomic CAS.
   * beforeWrite(latest) runs synchronously immediately before the edit POST; its
   * exceptions propagate unchanged. It is skipped when no write is necessary.
   * HTTP POST success alone is NOT save success: resolve only after a fresh read
   * matches value. A verify error means the write may have happened; keep the draft.
   */
  async function save(options = {}) {
    if (!isRecord(options)) {
      throw storeError("invalid", "保存参数无效，请提供角色、原始字段内容和目标字段内容。");
    }
    const { avatar, field = "description", baseline, value, beforeWrite } = options;
    validateAvatar(avatar);
    validateField(field);
    if (typeof baseline !== "string" || typeof value !== "string") {
      throw storeError("invalid", "原始字段内容 baseline 和目标字段内容 value 必须是字符串。");
    }
    if (beforeWrite !== undefined && typeof beforeWrite !== "function") {
      throw storeError("invalid", "保存前检查 beforeWrite 必须是同步函数。");
    }
    // Queue completion never rejects: a failed save must not block later callers.
    // Register before waiting so subsequent saves also wait for this caller.
    const previousSave = saveQueues.get(avatar);
    let releaseSave;
    const queuedSave = new Promise((resolve) => { releaseSave = resolve; });
    saveQueues.set(avatar, queuedSave);
    try {
      if (previousSave) await previousSave;
      const latest = await load(avatar, field);
      if (latest.value === value) return latest;
      if (latest.value !== baseline) {
        throw storeError("conflict", "角色字段已被其他操作修改；为避免覆盖，已停止保存。请重新读取并核对最新内容。", { latest });
      }

      await post("/api/characters/edit-attribute", {
        avatar_url: avatar,
        ch_name: latest.name,
        field,
        value,
      }, false, beforeWrite ? () => {
        const result = beforeWrite(latest);
        if (result && typeof result.then === "function") {
          // Do not leave an accidentally async guard's rejection unhandled.
          Promise.resolve(result).catch(() => {});
          throw storeError("invalid", "保存前检查必须同步完成，不能返回 Promise；尚未提交保存。");
        }
      } : undefined);

      let verified;
      try {
        verified = await load(avatar, field);
      } catch (cause) {
        throw storeError("verify", "保存请求已提交，但无法重新读取确认结果；请保留草稿并重新读取或重试。", { cause });
      }
      if (verified.value !== value) {
        throw storeError("verify", "保存请求已提交，但重新读取的字段内容与目标不一致；请保留草稿并核对最新内容。", { latest: verified });
      }
      return verified;
    } finally {
      releaseSave();
      if (saveQueues.get(avatar) === queuedSave) {
        saveQueues.delete(avatar);
      }
    }
  }

  return { load, save };
}

/** Backward-compatible factory alias; omitted fields still default to description. */
export { createCharacterFieldStore as createCharacterDescriptionStore };
