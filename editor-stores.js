
const REQUEST_TIMEOUT_MS = 15000;
const CHARACTER_FIELDS = new Set(["description", "personality", "scenario", "first_mes"]);

function storeError(code, message, details = {}) {
  return Object.assign(new Error(message), { code }, details);
}

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function validateAvatar(avatar) {
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

function toSnapshot(avatar, field, character) {
  if (
    !isRecord(character) ||
    character.error ||
    character.avatar !== avatar ||
    (character.data !== undefined && !isRecord(character.data))
  ) {
    throw storeError("invalid", "服务器返回的角色记录无效或头像标识不匹配，请重新读取角色。");
  }

  const name = character.data?.name !== undefined ? character.data.name : character.name;
  const value = character.data?.[field] !== undefined
    ? character.data[field]
    : character[field];
  if (typeof name !== "string" || !name.trim() || name === "." || typeof value !== "string") {
    throw storeError("invalid", "角色记录缺少有效的名称或字符串字段内容，请检查角色数据。");
  }

  return { avatar, field, name, value, character };
}

export function createCharacterFieldStore({
  fetch: fetcher = globalThis.fetch,
  getRequestHeaders = () => ({ "Content-Type": "application/json" }),
} = {}) {
  if (typeof fetcher !== "function" || typeof getRequestHeaders !== "function") {
    throw storeError("invalid", "角色字段存储需要有效的请求函数和请求头函数。");
  }

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

  async function load(avatar, field = "description") {
    validateAvatar(avatar);
    validateField(field);
    const character = await post("/api/characters/get", { avatar_url: avatar }, true);
    return toSnapshot(avatar, field, character);
  }

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

export { createCharacterFieldStore as createCharacterDescriptionStore };

const SOURCE_SUFFIX = 'prompt_manager_popup_entry_form_prompt';
const SAVE_SUFFIX = 'prompt_manager_popup_entry_form_save';

function hasText(value) {
    return typeof value === 'string' && value.trim().length > 0;
}

function validateBinding(binding) {
    if (!isRecord(binding) || !hasText(binding.preset) || !hasText(binding.identifier)) {
        throw storeError('invalid', '预设条目绑定无效，请重新打开条目草稿。');
    }
}

function contentOf(prompt) {
    const value = prompt.content ?? '';
    if (typeof value !== 'string') {
        throw storeError('invalid', '条目正文不是字符串，无法安全保存。');
    }
    return value;
}

function snapshotOf({ preset, identifier, prompt }) {
    const value = contentOf(prompt);
    return {
        preset,
        identifier,
        name: typeof prompt.name === 'string' ? prompt.name : identifier,
        key: JSON.stringify(['preset-entry', preset, identifier]),
        baseline: value,
        value,
    };
}

export function createPresetEntryStore({ getManager, getPresetName, saveTimeout = 10000 } = {}) {
    if (typeof getManager !== 'function' || typeof getPresetName !== 'function') {
        throw storeError('invalid', '预设条目存储需要 getManager 和 getPresetName。');
    }
    if (!Number.isFinite(saveTimeout) || saveTimeout <= 0 || saveTimeout > 2147483647) {
        throw storeError('invalid', '保存超时必须是有效的正毫秒数。');
    }

    function readContext(expectedPreset) {
        let manager, preset;
        try {
            manager = getManager();
            preset = getPresetName();
        } catch (cause) {
            throw storeError('context', '无法读取当前预设，请等待加载完成。', { cause });
        }
        if (!manager || !hasText(preset) || (expectedPreset !== undefined && preset !== expectedPreset)) {
            throw storeError('context', '当前预设不匹配或仍在切换，请手动切回草稿绑定的预设后保存。');
        }
        const settings = manager.serviceSettings;
        if (!isRecord(settings) || !Array.isArray(settings.prompts)) {
            throw storeError('context', 'PromptManager 尚未就绪，请等待预设加载完成。');
        }
        if (typeof settings.preset_settings_openai === 'string' && settings.preset_settings_openai !== preset) {
            throw storeError('context', '预设选择与当前设置不一致，请等待切换完成。');
        }
        return { manager, preset, settings, prompts: settings.prompts };
    }

    function locate(binding) {
        validateBinding(binding);
        const context = readContext(binding.preset);
        const matches = context.prompts.filter(prompt => prompt && prompt.identifier === binding.identifier);
        if (matches.length === 0) {
            throw storeError('missing', '当前预设中已找不到此条目；不会自动重建或保存到其他预设。');
        }
        if (matches.length !== 1) {
            throw storeError('invalid', '存在重复的条目 identifier，无法确定唯一保存目标。');
        }
        return { ...context, identifier: binding.identifier, prompt: matches[0] };
    }

    function requireEditable({ manager, prompt }) {
        if (prompt.marker || (typeof manager.isPromptEditAllowed === 'function' && !manager.isPromptEditAllowed(prompt))) {
            throw storeError('readonly', '此条目正文来自标记或其他来源，不能在独立草稿中保存。');
        }
    }

    function isSource(source) {
        return typeof source?.id === 'string' && source.id.endsWith(SOURCE_SUFFIX);
    }

    function capture(source) {
        if (!isSource(source)) {
            throw storeError('invalid', '此输入框不是 PromptManager 条目正文。');
        }
        const context = readContext();
        const prefix = typeof context.manager.configuration?.prefix === 'string'
            ? context.manager.configuration.prefix
            : source.id.slice(0, -SOURCE_SUFFIX.length);
        if (source.id !== prefix + SOURCE_SUFFIX) {
            throw storeError('invalid', '条目编辑框与当前 PromptManager 不匹配。');
        }
        const identifier = source.ownerDocument?.getElementById?.(prefix + SAVE_SUFFIX)?.dataset?.pmPrompt;
        if (!hasText(identifier)) {
            throw storeError('missing', '无法识别已保存条目，请先在原生面板保存一次，再打开独立草稿。');
        }
        let target;
        try {
            target = locate({ preset: context.preset, identifier });
        } catch (error) {
            if (error.code === 'missing') {
                throw storeError('missing', '此条目尚未原生保存或已删除，请先在原生面板保存一次，再打开独立草稿。');
            }
            throw error;
        }
        requireEditable(target);
        if (source.disabled || source.readOnly) {
            throw storeError('readonly', '原生条目正文不可编辑，不能建立可保存草稿。');
        }
        const binding = snapshotOf(target);
        delete binding.value;
        return binding;
    }

    function current(binding) {
        return snapshotOf(locate(binding));
    }

    async function waitForSave(manager) {
        let timer;
        try {
            const pending = manager.saveServiceSettings();
            if (!pending || typeof pending.then !== 'function') {
                throw storeError('save', '原生保存未返回可等待的结果，无法确认保存。');
            }
            const result = await Promise.race([
                pending,
                new Promise((_, reject) => {
                    timer = setTimeout(() => reject(storeError('timeout', '等待原生保存超时，结果未确认；请保留草稿并重试。')), saveTimeout);
                }),
            ]);
            if (result === false || result?.ok === false) {
                throw storeError('save', '原生保存报告失败；请保留草稿并重试。');
            }
        } catch (cause) {
            if (cause?.code === 'timeout' || cause?.code === 'save') throw cause;
            throw storeError('save', '原生保存失败，结果未确认；请保留草稿并重试。', { cause });
        } finally {
            clearTimeout(timer);
        }
    }

    async function save(options = {}) {
        validateBinding(options);
        const { preset, identifier, baseline, value } = options;
        if (typeof baseline !== 'string' || typeof value !== 'string') {
            throw storeError('invalid', 'baseline 和 value 必须是字符串。');
        }
        const binding = { preset, identifier };
        const target = locate(binding);
        requireEditable(target);
        const latest = snapshotOf(target);
        if (latest.value !== baseline && latest.value !== value) {
            throw storeError('conflict', '条目正文已被其他编辑器修改；请保留草稿并处理冲突。', { latest });
        }
        if (typeof target.manager.saveServiceSettings !== 'function') {
            throw storeError('save', '此 PromptManager 没有可用的原生保存接口。');
        }

        target.prompt.content = value;
        try {
            await waitForSave(target.manager);
            const after = locate(binding);
            if (after.manager !== target.manager || after.settings !== target.settings ||
                after.prompts !== target.prompts || after.prompt !== target.prompt) {
                throw storeError('context', '保存期间预设或条目被重新加载，无法确认该草稿的保存结果。');
            }
            requireEditable(after);
            const saved = snapshotOf(after);
            if (saved.value !== value) {
                throw storeError('conflict', '保存期间条目正文再次改变，无法确认保存结果。', { latest: saved });
            }
            if (typeof after.manager.renderDebounced === 'function') after.manager.renderDebounced();
            return saved;
        } catch (error) {
            throw storeError(error?.code || 'save', error?.message || '保存结果无法确认。', {
                cause: error,
                uncertain: true,
                ...(error?.latest ? { latest: error.latest } : {}),
            });
        }
    }

    return { isSource, capture, current, save };
}

export function createPresetSwitchGuard({ getApplicationPromise } = {}) {
    if (getApplicationPromise != null && typeof getApplicationPromise !== 'function') {
        throw storeError('invalid', 'getApplicationPromise 必须是函数或未提供。');
    }
    const hasPromiseGetter = typeof getApplicationPromise === 'function';
    let generation = 0;
    let pending = false;
    let readQueued = false;
    let observedPromise = null;
    let fallbackCount = 0;

    function sample() {
        try {
            const application = getApplicationPromise();
            return application && typeof application.then === 'function' ? application : null;
        } catch {
            return null;
        }
    }

    function failClosed() {
        generation++;
        observedPromise = null;
        pending = true;
    }

    function follow(application) {
        observedPromise = application;
        pending = true;
        const ticket = ++generation;
        const complete = () => {
            if (ticket !== generation || readQueued) return;
            const latest = sample();
            if (!latest) { failClosed(); return; }
            if (latest !== application) { follow(latest); return; }
            pending = false;
        };
        try {
            Promise.resolve(application).then(complete, complete);
        } catch {
            failClosed();
        }
    }

    function observe(force = false) {
        const application = sample();
        if (!application) { failClosed(); return; }
        if (force || application !== observedPromise) follow(application);
    }

    function begin() {
        pending = true;
        const ticket = ++generation;
        if (!hasPromiseGetter) {
            fallbackCount++;
            return;
        }
        readQueued = true;
        queueMicrotask(() => {
            if (ticket !== generation) return;
            readQueued = false;
            observe(true);
        });
    }

    function settled() {
        if (hasPromiseGetter) return;
        fallbackCount = Math.max(0, fallbackCount - 1);
        pending = fallbackCount > 0;
    }

    function isPending() {
        if (hasPromiseGetter && !readQueued) observe();
        return pending;
    }

    if (hasPromiseGetter) observe();
    return { begin, settled, isPending };
}
