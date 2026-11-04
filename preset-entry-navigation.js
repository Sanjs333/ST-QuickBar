import {
    bindFloatingEditorInteractionBoundary, createFloatingEditorAdapter,
    resolveCodeMirrorForSource, styleFloatingEditorLauncher,
} from './floating-editor.js';

const SOURCE_SUFFIX = 'prompt_manager_popup_entry_form_prompt';
const FIELDS = ['name', 'role', 'content', 'injection_position', 'injection_depth',
    'injection_order', 'injection_trigger', 'forbid_overrides'];
const snapshot = value => JSON.stringify(FIELDS.map(field => value[field]));

/** Native Prompt Manager navigation. Existing floating drafts keep their own identities. */
export function createPresetEntryNavigator({
    document: doc = globalThis.document, getManager, getIdentity = () => '',
    isEnabled = () => true, isContextReady = () => true,
    confirmSwitch = async () => 'cancel', notify = () => {}, onSwitched = () => {},
    saveTimeout = 10000, pollInterval = 500,
} = {}) {
    const win = doc.defaultView;
    let running = false, timer = null, frame = 0, observer = null;
    let hooked = null, baseline = null, group = null, busy = false, composing = false;
    const buttons = [];

    function context() {
        if (!isEnabled() || !isContextReady()) return null;
        const manager = getManager();
        const prefix = manager?.configuration?.prefix;
        if (typeof prefix !== 'string' || !Array.isArray(manager.serviceSettings?.prompts)) return null;
        const source = doc.getElementById(prefix + SOURCE_SUFFIX);
        const popup = source?.closest('[id$="prompt_manager_popup"]');
        const edit = doc.getElementById(prefix + 'prompt_manager_popup_edit');
        const save = doc.getElementById(prefix + 'prompt_manager_popup_entry_form_save');
        if (!source || !popup || !edit?.contains(source) || !save) return null;
        const identifier = save.dataset.pmPrompt;
        const prompt = manager.serviceSettings.prompts.find(item => item.identifier === identifier);
        return { manager, settings: manager.serviceSettings, prompts: manager.serviceSettings.prompts,
            source, popup, edit, save, identifier, prompt, identity: getIdentity() };
    }

    function isOpen(c) {
        return !!c?.prompt && c.popup.classList.contains('openDrawer') &&
            c.edit.style.display !== 'none' && c.popup.style.display !== 'none';
    }

    function same(c, b) {
        return !!c && !!b && c.manager === b.manager && c.settings === b.settings &&
            c.prompts === b.prompts && c.prompt === b.prompt && c.source === b.source &&
            c.save === b.save && c.identifier === b.identifier && c.identity === b.identity;
    }

    function readForm(c, useAdapter = true) {
        const value = {};
        c.manager.updatePromptWithPromptEditForm(value);
        if (useAdapter && !c.source.disabled) {
            const adapter = createFloatingEditorAdapter(c.source);
            if (adapter.kind === 'unsupported' || !adapter.isConnected()) {
                throw new Error('当前正文编辑器暂不支持安全切换，请先用原生按钮保存。');
            }
            value.content = adapter.read();
        }
        return value;
    }

    function capture(c, loaded = false) {
        if (!c?.prompt) { baseline = null; return; }
        // Normally captured immediately after the native loader. If installed over an
        // already open form, use native defaults rather than calling existing edits clean.
        const value = loaded ? readForm(c, false) : {
            name: c.prompt.name ?? '', role: c.prompt.role || 'system', content: c.prompt.content ?? '',
            injection_position: c.prompt.injection_position ?? 0, injection_depth: c.prompt.injection_depth ?? 4,
            injection_order: c.prompt.injection_order ?? 100, injection_trigger: c.prompt.injection_trigger ?? [],
            forbid_overrides: c.prompt.forbid_overrides ?? false,
        };
        baseline = { ...c, form: snapshot(value), model: snapshot(c.prompt), uncertain: false };
    }

    function unhook() {
        if (hooked && hooked.manager.loadPromptIntoEditForm === hooked.wrapper) {
            hooked.manager.loadPromptIntoEditForm = hooked.original;
        }
        hooked = null;
    }

    function hook(manager) {
        if (hooked && hooked.manager === manager && manager.loadPromptIntoEditForm === hooked.wrapper) return;
        unhook();
        baseline = null;
        if (typeof manager?.loadPromptIntoEditForm !== 'function') return;
        const original = manager.loadPromptIntoEditForm;
        const wrapper = function (...args) {
            const result = original.apply(this, args);
            if (running && this === manager && hooked?.wrapper === wrapper) {
                composing = false;
                capture(context(), true);
                scheduleRefresh();
            }
            return result;
        };
        hooked = { manager, original, wrapper };
        manager.loadPromptIntoEditForm = wrapper;
    }

    function neighbors(c) {
        if (!c?.prompt) return [null, null];
        const list = c.manager.listElement;
        let ids = list?.isConnected
            ? [...list.children].map(row => row.dataset.pmIdentifier).filter(Boolean) : [];
        if (!ids.length && c.manager.activeCharacter &&
            typeof c.manager.getPromptOrderForCharacter === 'function') {
            ids = c.manager.getPromptOrderForCharacter(c.manager.activeCharacter).map(item => item.identifier);
        }
        const seen = new Set();
        const ordered = ids.flatMap(identifier => {
            if (seen.has(identifier)) return [];
            seen.add(identifier);
            const prompt = c.prompts.find(item => item.identifier === identifier);
            const allowed = prompt && (typeof c.manager.isPromptEditAllowed === 'function'
                ? c.manager.isPromptEditAllowed(prompt) : !prompt.marker);
            return allowed ? [prompt] : [];
        });
        const index = ordered.findIndex(prompt => prompt.identifier === c.identifier);
        return index < 0 ? [null, null] : [ordered[index - 1] ?? null, ordered[index + 1] ?? null];
    }

    function ensureButtons(c) {
        if (!group) {
            group = doc.createElement('span');
            group.className = 'ih-preset-entry-navigation ih-floating-editor-actions-pair';
            group.setAttribute('role', 'group');
            group.setAttribute('aria-label', '切换预设条目');
            for (const direction of [-1, 1]) {
                const button = doc.createElement('i');
                button.setAttribute('role', 'button');
                button.dataset.direction = String(direction);
                bindFloatingEditorInteractionBoundary(button);
                button.addEventListener('mousedown', event => event.preventDefault());
                button.addEventListener('click', event => {
                    event.preventDefault();
                    event.stopPropagation();
                    void navigate(direction);
                });
                button.addEventListener('keydown', event => {
                    if (event.key !== 'Enter' && event.key !== ' ') return;
                    event.preventDefault();
                    event.stopPropagation();
                    button.click();
                });
                buttons.push(button);
                group.append(button);
            }
        }
        const maximize = [...c.edit.querySelectorAll('.editor_maximize[data-for], [data-quickbar-editor-for]')]
            .find(button => (button.getAttribute('data-quickbar-editor-for') ?? button.dataset.for) === c.source.id);
        const pair = maximize?.closest('.ih-floating-editor-actions-pair');
        const launcher = pair?.querySelector('.ih-floating-editor-launch') ||
            (maximize?.previousElementSibling?.matches('.ih-floating-editor-launch') ? maximize.previousElementSibling : null);
        const anchor = launcher || maximize;
        if (anchor) {
            if (anchor.previousElementSibling !== group) anchor.before(group);
        } else {
            const footer = c.edit.querySelector('.completion_prompt_manager_popup_entry_form_footer');
            if (!footer) return;
            if (group.parentElement !== footer) footer.append(group);
        }
        const styleSource = maximize || doc.createElement('i');
        if (!maximize) styleSource.className = 'right_menu_button';
        buttons.forEach((button, index) => {
            styleFloatingEditorLauncher(styleSource, button, {
                className: 'ih-preset-entry-navigation-action',
                icon: index ? 'fa-chevron-down' : 'fa-chevron-up',
            });
            button.setAttribute('aria-controls', c.source.id);
        });
    }

    function refresh() {
        if (!running) return;
        if (!isEnabled()) {
            group?.remove();
            unhook();
            baseline = null;
            return;
        }
        hook(getManager());
        const c = context();
        if (!c) { group?.remove(); baseline = null; return; }
        ensureButtons(c);
        if (!same(c, baseline)) capture(c);
        const nearby = neighbors(c);
        const cmComposing = !!resolveCodeMirrorForSource(c.source)?.composing;
        buttons.forEach((button, index) => {
            const label = index ? '下一个条目' : '上一个条目';
            const enabled = isOpen(c) && !!nearby[index] && !busy && !composing && !cmComposing;
            const title = nearby[index] ? `${label}：${nearby[index].name || nearby[index].identifier}`
                : c.prompt ? (index ? '已经是最后一个可编辑条目' : '已经是第一个可编辑条目')
                    : '请先在原生面板保存新条目';
            button.title = title;
            button.setAttribute('aria-label', title);
            button.setAttribute('aria-disabled', String(!enabled));
            button.tabIndex = enabled ? 0 : -1;
        });
    }

    function scheduleRefresh() {
        if (!running || frame) return;
        frame = win.requestAnimationFrame(() => { frame = 0; refresh(); });
    }

    function requireCurrent(b) {
        const c = context();
        if (!running || !isOpen(c) || baseline !== b || !same(c, b)) {
            throw new Error('预设或编辑条目已经切换，本次切换已取消，不会写入其他条目。');
        }
        return c;
    }

    async function saveCurrent(b, submitted) {
        const c = requireCurrent(b);
        if (snapshot(c.prompt) !== b.model) {
            throw new Error('此条目已被其他编辑器修改，请保留当前内容，先处理冲突再切换。');
        }
        if (typeof c.manager.saveServiceSettings !== 'function') {
            throw new Error('当前酒馆没有可用的预设条目保存接口。');
        }
        // Never write source-owned/readonly content while saving editable metadata.
        const adapter = createFloatingEditorAdapter(c.source);
        const patch = { ...submitted };
        if (c.source.disabled || adapter.isReadOnly()) delete patch.content;
        Object.assign(c.prompt, patch);
        const savedModel = snapshot(c.prompt);
        b.model = savedModel;
        b.uncertain = true;
        let timeout;
        try {
            const pending = c.manager.saveServiceSettings();
            if (!pending || typeof pending.then !== 'function') {
                throw new Error('原生保存未返回可等待的结果，请保留当前内容。');
            }
            const result = await Promise.race([pending, new Promise((_, reject) => {
                timeout = win.setTimeout(() => reject(new Error('等待保存超时，结果尚未确认；已保留当前编辑内容。')), saveTimeout);
            })]);
            if (result === false || result?.ok === false) throw new Error('原生保存报告失败，已保留当前编辑内容。');
            const current = requireCurrent(b);
            if (snapshot(current.prompt) !== savedModel) {
                throw new Error('保存期间条目再次改变，已留在当前条目，请保留内容并处理冲突。');
            }
            b.form = snapshot(submitted);
            b.uncertain = false;
            if (['main', 'nsfw', 'jailbreak'].includes(c.identifier) && typeof c.manager.updateQuickEdit === 'function') {
                c.manager.updateQuickEdit(c.identifier, c.prompt);
            }
            c.manager.renderDebounced?.();
            if (snapshot(readForm(current)) !== b.form) {
                notify('保存期间又有新的修改，已留在当前条目；请再次点击切换。');
                return false;
            }
            return true;
        } finally {
            win.clearTimeout(timeout);
        }
    }

    async function navigate(direction) {
        if (busy || composing || ![-1, 1].includes(direction)) return false;
        refresh();
        const c = context();
        if (!isOpen(c) || resolveCodeMirrorForSource(c.source)?.composing) return false;
        const target = neighbors(c)[direction < 0 ? 0 : 1];
        if (!target || !baseline) return false;
        const b = baseline;
        busy = true;
        refresh();
        try {
            const submitted = readForm(c);
            if (snapshot(submitted) !== b.form || b.uncertain) {
                const decision = await confirmSwitch({ name: submitted.name || c.prompt.name, target: target.name, uncertain: b.uncertain });
                const current = requireCurrent(b);
                if (decision === 'cancel' || !['save', 'discard'].includes(decision)) return false;
                if (snapshot(readForm(current)) !== snapshot(submitted)) {
                    throw new Error('确认期间编辑内容又有变化，已取消切换，请再次点击。');
                }
                if (decision === 'save' && !await saveCurrent(b, submitted)) return false;
            }
            const current = requireCurrent(b);
            const latestTarget = neighbors(current)[direction < 0 ? 0 : 1];
            if (!latestTarget || latestTarget.identifier !== target.identifier) {
                throw new Error('预设条目顺序已经变化，已取消本次切换，请再次点击。');
            }
            const scroll = current.popup.scrollTop;
            current.manager.clearEditForm();
            current.manager.clearInspectForm?.();
            current.manager.loadPromptIntoEditForm(latestTarget);
            current.edit.style.display = 'flex';
            // The native loader fills the backing textarea; keep recognized CM6 views
            // in sync too, without adding a navigation step to the editor undo history.
            const loaded = context();
            if (loaded && !loaded.source.disabled) {
                const adapter = createFloatingEditorAdapter(loaded.source);
                if (adapter.kind === 'codemirror' && !adapter.isReadOnly()) {
                    adapter.write(loaded.source.value, { addToHistory: false, userEvent: 'input.quickbar-navigation' });
                }
            }
            current.popup.scrollTop = scroll;
            current.source.scrollTop = 0;
            onSwitched();
            return true;
        } catch (error) {
            notify(error?.message || '切换失败，已保留当前编辑内容。');
            return false;
        } finally {
            busy = false;
            refresh();
        }
    }

    function onComposition(event) {
        const c = context();
        if (!c) return;
        const cm = resolveCodeMirrorForSource(c.source);
        if (event.target !== c.source && !cm?.dom?.contains(event.target)) return;
        composing = event.type === 'compositionstart';
        refresh();
    }

    function start() {
        if (running) return;
        running = true;
        observer = new win.MutationObserver(scheduleRefresh);
        observer.observe(doc.body, { childList: true, subtree: true, attributes: true,
            attributeFilter: ['data-pm-prompt', 'data-for', 'data-quickbar-editor-for', 'id'] });
        for (const type of ['compositionstart', 'compositionend']) doc.addEventListener(type, onComposition, true);
        timer = win.setInterval(refresh, pollInterval);
        refresh();
    }

    function destroy() {
        running = false;
        observer?.disconnect();
        observer = null;
        win.clearInterval(timer);
        win.cancelAnimationFrame(frame);
        timer = null; frame = 0;
        for (const type of ['compositionstart', 'compositionend']) doc.removeEventListener(type, onComposition, true);
        unhook();
        group?.remove();
        group = null; buttons.length = 0; baseline = null;
    }

    return { start, refresh, navigate, destroy };
}
