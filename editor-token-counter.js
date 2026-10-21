const PROMPT_SOURCE_SUFFIX = 'prompt_manager_popup_entry_form_prompt';
const PROMPT_FIELDS = new Set([
    'description_textarea', 'personality_textarea', 'scenario_pole',
    'firstmessage_textarea', 'mes_example_textarea', 'system_prompt_textarea',
    'post_history_instructions_textarea', 'depth_prompt_prompt', 'persona_description',
    'main_prompt_quick_edit_textarea', 'nsfw_prompt_quick_edit_textarea',
    'jailbreak_prompt_quick_edit_textarea', 'sysprompt_content', 'sysprompt_post_history',
]);

export function supportsEditorTokenCount(source) {
    if (!source || source.tagName !== 'TEXTAREA') return false;
    return PROMPT_FIELDS.has(source.id) || source.id.endsWith(PROMPT_SOURCE_SUFFIX) ||
        /^world_entry_content_\d+$/.test(source.id) ||
        (source.name === 'content' && !!source.closest?.('.world_entry'));
}

const same = (a, b) => !!a && !!b && a.text === b.text && a.identity === b.identity &&
    a.context === b.context && a.composing === b.composing;

export function createDebouncedTokenCounter({
    countTokens, read, render, getContextKey = () => '', isActive = () => true,
    clock = globalThis, delay = 500, timeout = 10000,
} = {}) {
    let disposed = false, version = 0, desired = null, timer = null;
    let inFlight = false, ready = false;

    function snapshot() {
        try {
            if (!isActive()) return null;
            const value = read();
            if (!value || typeof value.text !== 'string') return null;
            return { text: value.text, identity: value.identity ?? '',
                context: getContextKey(), composing: !!value.composing };
        } catch { return null; }
    }

    function cancelTimer() {
        if (timer !== null) clock.clearTimeout(timer);
        timer = null;
        ready = false;
    }

    function refresh({ force = false, immediate = false } = {}) {
        if (disposed) return;
        const next = snapshot();
        if (!force && (same(next, desired) || (!next && !desired))) return;
        desired = next;
        version++;
        cancelTimer();
        if (!next) { render({ state: 'idle' }); return; }
        if (next.composing) { render({ state: 'pending' }); return; }
        if (!next.text) { render({ state: 'ready', count: 0 }); return; }
        render({ state: 'pending' });
        if (immediate) { ready = true; launch(); }
        else timer = clock.setTimeout(() => { timer = null; ready = true; launch(); }, delay);
    }

    function launch() {
        if (disposed || inFlight || !ready || !desired) return;
        if (!same(desired, snapshot())) { refresh(); return; }
        ready = false;
        const current = desired, ticket = version;
        inFlight = true;
        let requestTimer = null;
        Promise.resolve().then(() => {
            if (disposed || ticket !== version || !same(current, snapshot())) return null;
            return Promise.race([
                Promise.resolve(countTokens(current.text)),
                new Promise((_, reject) => {
                    requestTimer = clock.setTimeout(() => reject(new Error('Token count timed out')), timeout);
                }),
            ]);
        }).then(count => {
            if (disposed || ticket !== version) return;
            if (!same(current, snapshot())) { refresh(); return; }
            if (!Number.isSafeInteger(count) || count < 0) throw new Error('Invalid token count');
            render({ state: 'ready', count });
        }).catch(() => {
            if (disposed || ticket !== version) return;
            if (!same(current, snapshot())) { refresh(); return; }
            render({ state: 'error' });
        }).finally(() => {
            if (requestTimer !== null) clock.clearTimeout(requestTimer);
            inFlight = false;
            if (ready && !disposed) launch();
        });
    }

    function destroy() {
        disposed = true;
        version++;
        cancelTimer();
        desired = null;
    }
    return { refresh, destroy };
}

export function createTokenCountBinding({ document, mount, ...options }) {
    const element = document.createElement('small');
    element.className = 'ih-editor-token-counter';
    const label = document.createElement('span');
    label.dataset.i18n = 'extension_token_counter';
    label.textContent = document.querySelector('[data-i18n="extension_token_counter"]')?.textContent || 'Tokens:';
    const number = document.createElement('span');
    number.className = 'ih-editor-token-count';
    number.textContent = '…';
    element.append('(', label, ' ', number, ')');
    const explanation = '按酒馆当前分词器统计本编辑框原文；不展开宏，不含完整请求的封装开销。';
    element.title = explanation;
    mount.append(element);
    const counter = createDebouncedTokenCounter({ ...options, render({ state, count }) {
        const text = state === 'ready' ? String(count) : state === 'error' ? '—' : '…';
        if (number.textContent !== text) number.textContent = text;
        element.dataset.state = state;
        element.title = state === 'error' ? '暂时无法统计 token；修改内容或切换模型后重试。' : explanation;
    }});
    counter.refresh({ immediate: true });
    return { element, refresh: counter.refresh, destroy() { counter.destroy(); element.remove(); } };
}

export function createNativePromptTokenCounter({
    document: doc, countTokens, createAdapter, resolveCodeMirror = () => null,
    getContextKey = () => '', getIdentity = () => '', isEnabled = () => true,
    isContextReady = () => true, delay = 500, pollInterval = 500,
} = {}) {
    const win = doc.defaultView;
    let running = false, interval = null, source = null, label = null, binding = null;
    let composing = false, compositionIdentity = null, removeBridge = null;

    function clear() {
        binding?.destroy();
        removeBridge?.();
        binding = null; removeBridge = null; source = null; label = null; composing = false; compositionIdentity = null;
    }

    function isVisible() {
        if (!source?.isConnected || source.disabled || !isEnabled() || doc.hidden || !isContextReady()) return false;
        const popup = source.closest('[id$="prompt_manager_popup"]');
        if (popup && !popup.classList.contains('openDrawer')) return false;
        const displayed = resolveCodeMirror(source)?.dom || source;
        return displayed.getClientRects().length > 0 && win.getComputedStyle(displayed).visibility !== 'hidden';
    }

    function sourceIdentity() {
        const saveId = source.id.replace(/_prompt$/, '_save');
        return JSON.stringify([getIdentity(), (saveId ? doc.getElementById(saveId) : null)?.dataset.pmPrompt ?? '']);
    }

    function read() {
        const adapter = createAdapter(source);
        if (adapter.kind === 'unsupported') return null;
        const identity = sourceIdentity();
        if (composing && compositionIdentity !== identity) composing = false;
        return { text: adapter.read(), identity, composing: composing || !!resolveCodeMirror(source)?.composing };
    }

    function refresh(options) {
        if (!running) return;
        if (!isEnabled()) { clear(); return; }
        if (!source?.isConnected || !source.id.endsWith(PROMPT_SOURCE_SUFFIX) ||
            !label?.isConnected || label.htmlFor !== source.id || !binding?.element.isConnected) {
            clear();
            source = doc.querySelector(`textarea[id$="${PROMPT_SOURCE_SUFFIX}"]`);
            if (!source) return;
            const form = source.closest('form');
            label = [...(source.labels || [])].find(item =>
                (form ? item.closest('form') === form : true) &&
                !item.closest('[id$="prompt_manager_popup_inspect"]'));
            if (!label || label.querySelector('.ih-editor-token-counter, [data-token-counter]')) return;
            binding = createTokenCountBinding({
                document: doc, mount: label, countTokens, getContextKey, read,
                isActive: isVisible, clock: win, delay,
            });
            const jqSource = win.jQuery?.(source);
            if (jqSource) {
                const handler = event => { if (!event.originalEvent) binding?.refresh(); };
                jqSource.on('input.ihEditorTokenCounter change.ihEditorTokenCounter', handler);
                removeBridge = () => jqSource.off('input.ihEditorTokenCounter change.ihEditorTokenCounter', handler);
            }
        }
        if (binding) {
            if (composing && !doc.hidden && !isVisible()) composing = false;
            binding.element.hidden = !!source.disabled;
            binding.refresh(options);
        }
    }

    function onInput(event) {
        if (!source) { refresh(); return; }
        const cm = resolveCodeMirror(source);
        if (event.target !== source && !cm?.dom?.contains(event.target)) return;
        if (event.type === 'compositionstart') { composing = true; compositionIdentity = sourceIdentity(); }
        if (event.type === 'compositionend') composing = false;
        binding?.refresh();
    }
    const types = ['input', 'change', 'compositionstart', 'compositionend'];
    function start() {
        if (running) return;
        running = true;
        for (const type of types) doc.addEventListener(type, onInput, true);
        interval = win.setInterval(refresh, pollInterval);
        refresh();
    }
    function destroy() {
        running = false;
        win.clearInterval(interval);
        interval = null;
        for (const type of types) doc.removeEventListener(type, onInput, true);
        clear();
    }
    return { start, refresh, destroy };
}
