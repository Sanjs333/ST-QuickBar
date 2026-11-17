// Run with Node 22+ and a local Chromium browser:
// node tests/performance-regression.mjs [--compare]
// Set QUICKBAR_TEST_BROWSER if Chrome/Edge is installed elsewhere.
import assert from 'node:assert/strict';
import { execFileSync, spawn } from 'node:child_process';
import { once } from 'node:events';
import { existsSync } from 'node:fs';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { dirname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const browserPath = [process.env.QUICKBAR_TEST_BROWSER,
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    '/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/google-chrome',
].find(path => path && existsSync(path));
assert(browserPath, 'Set QUICKBAR_TEST_BROWSER to a local Chromium executable.');
assert(globalThis.WebSocket, 'The test runner needs Node 22 or newer.');

function between(source, start, end) {
    const from = source.indexOf(start), to = source.indexOf(end, from);
    assert(from >= 0 && to > from, `Cannot extract ${start}`);
    return source.slice(from, to);
}

// Isolate the actual index.js routines from SillyTavern's application startup.
// Browser DOM, events, MutationObservers and the imported controllers stay real.
function indexHarness(source) {
    return `${source.includes('./dom-observers.js')
        ? "import { hasDialogChanges, observeIframeDocuments } from './dom-observers.js';" : ''}
export function installFocus(metrics) {
    let _lastFocusedEditable, _lastFocusedForScroll, _lastEditTarget;
    const toolbarStartupGuard = { canExpand: () => true, bind: () => {} };
    const historyManager = {
        ensureExternalHistory: () => metrics.focus++, updateButtons: () => {},
        onExternalBeforeInput: () => metrics.beforeInput++, onExternalInput: () => metrics.input++,
    };
    const isEditableElement = el => !!el?.matches?.('textarea, input, [contenteditable]');
    const isToolUiElement = () => false, shouldIgnoreFocusedElement = () => false;
    const $ = window.jQuery;
    ${between(source, 'function setupGlobalFocusTracking() {', 'function setupVolumeKeyPaging() {')}
    setupGlobalFocusTracking();
    return () => _lastFocusedEditable;
}
export function createPanel() {
    return { _ballEl: [document.createElement('div')], _panelEl: [document.createElement('div')],
        _expanded: false, _clampToViewport() {},
        ${between(source, '  _setupDialogDetection() {', '  _applyAutoHideState() {')}
    };
}
export function createBadges(chat, power_user, settings) {
    const getSettings = () => settings;
    ${between(source, 'const IH_CUSTOM_MODEL_ICON_RULES = [', 'function ihFixCustomModelIconForMsg(')}
    ${between(source, 'let _ihStreamingApi = "";', 'function ihUpdateChatModelBadge(')}
    return { apply: ihApplyStreamingBadges, set(api, model) { _ihStreamingApi = api; _ihStreamingModel = model; } };
}`;
}

const sources = new Map();
for (const mode of process.argv.includes('--compare') || process.argv.includes('--baseline')
    ? ['baseline', ...(process.argv.includes('--baseline') ? [] : ['current'])] : ['current']) {
    const files = new Map();
    for (const name of ['index.js', 'floating-editor.js', 'editor-token-counter.js',
        'preset-entry-navigation.js', 'external-entries.js', 'editor-stores.js', 'dom-observers.js']) {
        try {
            files.set(name, mode === 'baseline'
                ? execFileSync('git', ['show', `HEAD:${name}`], { cwd: root, encoding: 'utf8', maxBuffer: 4_000_000, stdio: ['ignore', 'pipe', 'ignore'] })
                : await readFile(join(root, name), 'utf8'));
        } catch (error) { if (name !== 'dom-observers.js') throw error; }
    }
    files.set('index-harness.js', indexHarness(files.get('index.js')));
    sources.set(mode, files);
}
const jquery = await readFile(resolve(root, '../../../..', 'lib/jquery-3.5.1.min.js'));
const server = createServer((request, response) => {
    const [mode, name] = request.url.split('/').filter(Boolean);
    if (request.url === '/jquery.js') {
        response.writeHead(200, { 'Content-Type': 'text/javascript' }); response.end(jquery); return;
    }
    const source = sources.get(mode)?.get(name);
    if (source !== undefined) {
        response.writeHead(200, { 'Content-Type': 'text/javascript' }); response.end(source); return;
    }
    response.writeHead(200, { 'Content-Type': 'text/html' });
    response.end('<!doctype html><html><head><script src="/jquery.js"></script></head><body></body></html>');
});
server.listen(0, '127.0.0.1');
await once(server, 'listening');
const origin = `http://127.0.0.1:${server.address().port}`;
const profile = await mkdtemp(join(tmpdir(), 'quickbar-performance-'));
let browser, socket;
const pending = new Map();
let messageId = 0;
function command(method, params = {}) {
    const id = ++messageId;
    return new Promise((resolveCommand, reject) => {
        const timer = setTimeout(() => { pending.delete(id); reject(new Error(`CDP timeout: ${method}`)); }, 30000);
        pending.set(id, { resolve: resolveCommand, reject, timer });
        socket.send(JSON.stringify({ id, method, params }));
    });
}

async function navigationScenario(mode) {
    const { createPresetEntryNavigator } = await import(`/${mode}/preset-entry-navigation.js`);
    const { createFloatingEditorController, createFloatingEditorAdapter, resolveCodeMirrorForSource } = await import(`/${mode}/floating-editor.js`);
    const { createNativePromptTokenCounter, createTokenCountBinding } = await import(`/${mode}/editor-token-counter.js`);
    const { createPresetEntryStore } = await import(`/${mode}/editor-stores.js`);
    const check = (value, message) => { if (!value) throw new Error(message); };
    const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
    const frame = () => new Promise(requestAnimationFrame);
    document.body.innerHTML = '<div id="chat"><div class="mes_text"></div></div>' +
        '<div id="completion_prompt_manager_list"></div>' +
        '<div id="completion_prompt_manager_popup" class="openDrawer"><div id="completion_prompt_manager_popup_edit">' +
        '<form><input id="name"><label for="completion_prompt_manager_popup_entry_form_prompt">Prompt</label><textarea id="completion_prompt_manager_popup_entry_form_prompt"></textarea>' +
        '<i class="editor_maximize" data-for="completion_prompt_manager_popup_entry_form_prompt"></i>' +
        '<div class="completion_prompt_manager_popup_entry_form_footer"><button id="completion_prompt_manager_popup_entry_form_save"></button></div></form></div></div>';
    const source = document.querySelector('textarea'), save = document.querySelector('button');
    let refreshes = 0, comparisons = 0, decision = 'cancel', identity = 'preset-a', saveResult = true;
    const prompts = Array.from({ length: 300 }, (_, i) => ({ identifier: `p${i}`, name: `Prompt ${i}`,
        role: 'system', content: `Body ${i}`, injection_position: 0, injection_depth: 4,
        injection_order: 100, injection_trigger: [], forbid_overrides: false, marker: i === 2 }));
    const originalFind = prompts.find;
    prompts.find = function (predicate) { return originalFind.call(this, (...args) => { comparisons++; return predicate(...args); }); };
    const manager = {
        configuration: { prefix: 'completion_' }, serviceSettings: { prompts }, activeCharacter: {},
        listElement: document.getElementById('completion_prompt_manager_list'),
        getPromptOrderForCharacter() { refreshes++; return prompts.map(prompt => ({ identifier: prompt.identifier })); },
        isPromptEditAllowed: prompt => !prompt.marker,
        loadPromptIntoEditForm(prompt) { source.value = prompt.content; document.getElementById('name').value = prompt.name; save.dataset.pmPrompt = prompt.identifier; },
        updatePromptWithPromptEditForm(value) { Object.assign(value, prompts.find(prompt => prompt.identifier === save.dataset.pmPrompt),
            { content: source.value, name: document.getElementById('name').value }); },
        clearEditForm() {}, clearInspectForm() {}, saveServiceSettings: async () => saveResult,
    };
    manager.loadPromptIntoEditForm(prompts[0]);
    const nativeLoader = manager.loadPromptIntoEditForm;
    const messages = [];
    const navigator = createPresetEntryNavigator({ document, getManager: () => manager, getIdentity: () => identity,
        confirmSwitch: async () => decision, notify: message => messages.push(message), pollInterval: 60000 });
    navigator.start();
    await frame(); await frame();
    const group = document.querySelector('.ih-preset-entry-navigation');
    let writes = 0;
    const observer = new MutationObserver(records => writes += records.length);
    observer.observe(group, { attributes: true, subtree: true });
    refreshes = 0; comparisons = 0;
    for (let i = 0; i < 36; i++) { document.querySelector('.mes_text').innerHTML = `<p>Token ${i}</p>`; await frame(); }
    await frame(); await wait(10);
    const metrics = { chatTriggeredRefreshes: refreshes, promptComparisons: comparisons, buttonWrites: writes };
    if (mode === 'current') check(refreshes === 0, 'Chat mutations must not refresh preset navigation');
    observer.disconnect();
    const store = createPresetEntryStore({ getManager: () => manager, getPresetName: () => 'Preset Test' });
    const floating = createFloatingEditorController({ document, presetEntryStore: store,
        createTokenCounter: ({ source: tokenSource, ...options }) => createTokenCountBinding({ ...options,
            countTokens: text => text.length, delay: 15 }),
    });
    floating.start();
    const maximize = document.querySelector('.editor_maximize');
    const draftA = floating.open(maximize);
    check(draftA?.presetDraft, 'Preset floating draft did not open');
    draftA.window.textarea.value = 'Floating A draft';
    draftA.window.textarea.dispatchEvent(new InputEvent('input', { bubbles: true }));
    check(source.value === 'Body 0' && prompts[0].content === 'Body 0', 'Independent draft wrote to the native form');
    check(await navigator.navigate(1), 'Clean navigation failed');
    check(save.dataset.pmPrompt === 'p1', 'Wrong next entry');
    check(!draftA.invalid && draftA.window.textarea.value === 'Floating A draft', 'Navigation rebound the old floating draft');
    const draftB = floating.open(maximize);
    check(draftB && draftB !== draftA && floating.sessions.length === 2, 'Second preset draft did not keep its own window');
    draftB.window.textarea.value = 'B';
    draftB.window.textarea.dispatchEvent(new InputEvent('input', { bubbles: true }));
    await wait(50);
    check(draftA.window.element.querySelector('.ih-editor-token-count')?.textContent === '16' &&
        draftB.window.element.querySelector('.ih-editor-token-count')?.textContent === '1', 'Floating token counters mixed drafts');
    check(await navigator.navigate(1), 'Marker skip failed');
    check(save.dataset.pmPrompt === 'p3', 'Non-editable marker was not skipped');
    source.value = 'Changed draft'; decision = 'cancel';
    check(!await navigator.navigate(1) && source.value === 'Changed draft', 'Cancel must retain the draft');
    decision = 'save';
    check(await navigator.navigate(1) && prompts[3].content === 'Changed draft', 'Save-and-switch failed');
    source.value = 'Discard me'; decision = 'discard';
    check(await navigator.navigate(-1) && prompts[4].content === 'Body 4', 'Discard wrote to the entry');
    source.value = 'Failed save'; decision = 'save'; saveResult = false;
    check(!await navigator.navigate(1) && source.value === 'Failed save', 'Failed save must retain the form');
    saveResult = true; decision = 'discard';
    check(await navigator.navigate(1), 'Could not discard after a failed save');
    source.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }));
    check(!await navigator.navigate(1), 'Navigation must wait for IME composition');
    source.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true }));
    const current = save.dataset.pmPrompt;
    source.value = 'Another draft';
    decision = 'cancel';
    check(!await navigator.navigate(1) && save.dataset.pmPrompt === current, 'Canceled navigation moved the form');
    let tokenCalls = 0, tokenizerContext = 'model-a';
    const counter = createNativePromptTokenCounter({ document, createAdapter: createFloatingEditorAdapter,
        resolveCodeMirror: resolveCodeMirrorForSource, getIdentity: () => identity,
        getContextKey: () => tokenizerContext, countTokens: text => { tokenCalls++; return text.length; },
        delay: 15, pollInterval: 60000 });
    counter.start(); await wait(50);
    check(document.querySelector('label .ih-editor-token-count')?.textContent === String(source.value.length), 'Native prompt count failed');
    const beforeComposition = tokenCalls;
    source.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }));
    source.value = '中文输入'; source.dispatchEvent(new InputEvent('input', { bubbles: true, isComposing: true }));
    await wait(50);
    check(tokenCalls === beforeComposition, 'Token counting interrupted IME composition');
    source.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true })); await wait(50);
    check(document.querySelector('label .ih-editor-token-count').textContent === '4', 'Token count did not resume after composition');
    const beforeModelChange = tokenCalls; tokenizerContext = 'model-b'; counter.refresh(); await wait(50);
    check(tokenCalls === beforeModelChange + 1, 'Model change did not refresh token counting');
    counter.destroy();
    check(await floating.flushAndCloseAll(), 'Floating drafts failed to save and close');
    check(prompts[0].content === 'Floating A draft' && prompts[1].content === 'B', 'Floating drafts saved to the wrong entries');
    check(source.value === '中文输入', 'Closing another entry draft overwrote the active native form');
    floating.destroy();
    identity = 'preset-b'; navigator.refresh();
    navigator.destroy();
    check(manager.loadPromptIntoEditForm === nativeLoader && !group.isConnected, 'Navigation cleanup failed');
    const popup = source.closest('[id$="prompt_manager_popup"]');
    popup.remove();
    manager.activeCharacter = null;
    manager.listElement.innerHTML = ['p0', 'p1', 'p3'].map(id => `<div data-pm-identifier="${id}"></div>`).join('');
    let navigationEnabled = true;
    const lateNavigator = createPresetEntryNavigator({ document, getManager: () => manager,
        isEnabled: () => navigationEnabled, pollInterval: 60000 });
    lateNavigator.start();
    document.body.append(popup); manager.loadPromptIntoEditForm(prompts[1]); await frame(); await frame();
    const lateGroup = document.querySelector('.ih-preset-entry-navigation');
    check(lateGroup?.querySelector('[data-direction="1"]').title.includes('Prompt 3'), 'Late-loaded popup did not get navigation');
    manager.listElement.innerHTML = ['p3', 'p1', 'p0'].map(id => `<div data-pm-identifier="${id}"></div>`).join('');
    await frame(); await frame();
    check(lateGroup.querySelector('[data-direction="1"]').title.includes('Prompt 0'), 'Native list reorder did not refresh navigation');
    check(await lateNavigator.navigate(1) && save.dataset.pmPrompt === 'p0', 'Navigation ignored native reordered rows');
    maximize.remove(); await frame(); await frame();
    check(lateGroup.parentElement.classList.contains('completion_prompt_manager_popup_entry_form_footer'), 'Missing launcher did not use the native footer');
    navigationEnabled = false; lateNavigator.refresh();
    check(!lateGroup.isConnected && manager.loadPromptIntoEditForm === nativeLoader, 'Disabling navigation did not restore native behavior');
    navigationEnabled = true; lateNavigator.refresh();
    check(lateGroup.isConnected, 'Re-enabling navigation failed');
    lateNavigator.destroy();
    return metrics;
}

async function externalScenario(mode) {
    const entries = await import(`/${mode}/external-entries.js`);
    const check = (value, message) => { if (!value) throw new Error(message); };
    document.body.innerHTML = '<div id="extensionsMenu"></div>';
    const root = document.getElementById('extensionsMenu');
    root.innerHTML = Array.from({ length: 60 }, (_, i) => `<button id="entry-${i}"><i class="fa-solid fa-plug"></i>Entry ${i}</button>`).join('');
    const settings = { enabled: true, buttons: {} };
    const added = entries.addExternalEntries(settings, entries.scanExternalEntries(document, 'wand').slice(0, 20));
    added.forEach(entry => entry.hideOriginal = true);
    const controller = entries.createSourceVisibilityController({ doc: document, getSettings: () => settings,
        getReachableKeys: () => added.map(entry => entry.key), onError: error => { throw error; } });
    controller.start();
    const originalClone = Element.prototype.cloneNode;
    let clones = 0;
    Element.prototype.cloneNode = function (...args) { clones++; return originalClone.apply(this, args); };
    const start = performance.now();
    controller.sync();
    const metrics = { sourceClonesPerSync: clones, syncMilliseconds: Math.round((performance.now() - start) * 100) / 100 };
    Element.prototype.cloneNode = originalClone;
    if (mode === 'current') check(clones <= 240, 'Entries must share one discovery scan per source');
    check(root.querySelectorAll('[data-quickbar-source-hidden="true"]').length === 20, 'Original entries not hidden');
    check(entries.scanExternalEntries(document, 'wand').length === 60, 'QuickBar masks contaminated source discovery');
    settings.buttons[added[0].key] = false; controller.sync();
    check(!document.getElementById('entry-0').hasAttribute(entries.SOURCE_HIDDEN_ATTRIBUTE), 'Disabled shortcut must reveal its original');
    const hidden = entries.addHiddenOnlyEntries(settings, [entries.scanExternalEntries(document, 'wand')[30]]);
    check(hidden.length === 1, 'Could not create a hidden-only rule');
    controller.sync();
    check(document.getElementById('entry-30').hasAttribute(entries.SOURCE_HIDDEN_ATTRIBUTE), 'Hidden-only rule failed');
    document.getElementById('entry-1').disabled = true; controller.sync();
    check(!document.getElementById('entry-1').hasAttribute(entries.SOURCE_HIDDEN_ATTRIBUTE), 'Unavailable original remained masked');
    document.getElementById('entry-1').disabled = false; controller.sync();
    check(document.getElementById('entry-1').hasAttribute(entries.SOURCE_HIDDEN_ATTRIBUTE), 'Original did not recover');
    const previous = document.getElementById('entry-2'), replacement = previous.cloneNode(true);
    replacement.removeAttribute(entries.SOURCE_HIDDEN_ATTRIBUTE); previous.replaceWith(replacement); controller.sync();
    check(replacement.hasAttribute(entries.SOURCE_HIDDEN_ATTRIBUTE) && !previous.hasAttribute(entries.SOURCE_HIDDEN_ATTRIBUTE), 'Source DOM replacement reused stale discovery');
    const duplicate = document.getElementById('entry-3').cloneNode(true);
    duplicate.removeAttribute(entries.SOURCE_HIDDEN_ATTRIBUTE); root.append(duplicate); controller.sync();
    check(entries.resolveExternalEntry(document, added[3]) === null &&
        !document.getElementById('entry-3').hasAttribute(entries.SOURCE_HIDDEN_ATTRIBUTE), 'Ambiguous source identity was resolved or masked');
    duplicate.remove(); controller.sync();
    settings.enabled = false; controller.sync();
    check(!root.querySelector('[data-quickbar-source-hidden]'), 'Disable must restore original entries');
    controller.destroy();
    check(!document.getElementById(entries.SOURCE_VISIBILITY_STYLE_ID), 'Visibility stylesheet leaked');
    document.body.innerHTML = '<div id="rm_extensions_block" class="openDrawer"><div id="extensions_settings">' +
        '<div class="inline-drawer"><div id="panel-one" class="inline-drawer-toggle" aria-label="Panel One"><i class="inline-drawer-icon up"></i></div><div class="inline-drawer-content">Configuration</div></div></div></div>' +
        '<button data-quickbar-source-for="panel-one">Related entry</button>';
    const panelSettings = { enabled: true, buttons: {} };
    const [panelEntry] = entries.addExternalEntries(panelSettings, entries.scanExternalEntries(document, 'panel'));
    check(panelEntry, 'Panel scan failed'); panelEntry.hideOriginal = true;
    const panelController = entries.createSourceVisibilityController({ doc: document, getSettings: () => panelSettings,
        getReachableKeys: () => [panelEntry.key] });
    panelController.start();
    const header = document.getElementById('panel-one'), related = document.querySelector('[data-quickbar-source-for]');
    check(header.hasAttribute(entries.SOURCE_HIDDEN_ATTRIBUTE) && related.hasAttribute(entries.SOURCE_HIDDEN_ATTRIBUTE), 'Panel masking failed');
    panelController.revealPanel(panelEntry);
    check(!header.hasAttribute(entries.SOURCE_HIDDEN_ATTRIBUTE) && related.hasAttribute(entries.SOURCE_HIDDEN_ATTRIBUTE), 'Opening a panel did not reveal only its header');
    header.querySelector('i').className = 'inline-drawer-icon down'; panelController.sync();
    check(header.hasAttribute(entries.SOURCE_HIDDEN_ATTRIBUTE), 'Closing a panel did not expire its reveal state');
    header.querySelector('i').className = 'inline-drawer-icon up'; panelController.sync();
    check(header.hasAttribute(entries.SOURCE_HIDDEN_ATTRIBUTE), 'Native reopening unexpectedly resumed a reveal session');
    panelController.destroy();
    return metrics;
}

async function dialogScenario(mode) {
    const { createPanel } = await import(`/${mode}/index-harness.js`);
    const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
    const check = (value, message) => { if (!value) throw new Error(message); };
    document.body.innerHTML = '<div id="chat"></div>';
    const controller = createPanel(); controller._setupDialogDetection();
    let queries = 0;
    const originalQuery = document.querySelectorAll.bind(document);
    document.querySelectorAll = selector => { if (selector === 'dialog[open]') queries++; return originalQuery(selector); };
    for (let i = 0; i < 36; i++) { document.getElementById('chat').innerHTML = `<p>Token ${i}</p>`; await new Promise(requestAnimationFrame); }
    await wait(250);
    const metrics = { chatTriggeredDialogQueries: queries };
    if (mode === 'current') check(queries === 0, 'Chat mutations must not rescan dialog hosts');
    const container = document.createElement('div'), first = document.createElement('dialog');
    container.append(first); document.body.append(container); first.showModal(); await wait(250);
    check(controller._currentDialogHost === first && controller._ballEl[0].parentElement === first, 'Nested modal discovery failed');
    const second = document.createElement('dialog'); container.append(second); second.showModal(); await wait(250);
    check(controller._currentDialogHost === second, 'Top dialog priority failed');
    second.close(); await wait(250);
    check(controller._currentDialogHost === first, 'Native close did not restore the previous modal');
    container.remove(); await wait(250);
    check(controller._currentDialogHost === null && controller._ballEl[0].parentElement === document.body, 'Removed modal did not release the panel');
    controller._removeDialogDetection(); document.querySelectorAll = originalQuery;
    return metrics;
}

async function badgeScenario(mode) {
    const { createBadges } = await import(`/${mode}/index-harness.js`);
    const check = (value, message) => { if (!value) throw new Error(message); };
    document.body.innerHTML = '<div id="chat"><div class="mes" mesid="0"><span class="timestamp"></span><img class="timestamp-icon icon-svg" src="/img/custom.svg"></div></div>';
    const settings = { showModelInChat: false };
    const badges = createBadges([{ is_user: false, extra: { api: 'openai', model: 'gpt-test' } }], { timestamp_model_icon: true }, settings);
    let queries = 0;
    const originalQuery = document.querySelector.bind(document);
    document.querySelector = selector => { if (selector.startsWith('#chat .mes[')) queries++; return originalQuery(selector); };
    for (let i = 0; i < 100; i++) badges.apply();
    const metrics = { inactiveBadgeQueriesPer100Tokens: queries };
    if (mode === 'current') check(queries === 0, 'Inactive badges must not query message rows');
    settings.showModelInChat = true; badges.set('custom', 'claude-test'); badges.apply();
    check(document.querySelector('.ih-chat-model-badge')?.textContent === 'claude-test', 'Model badge stopped working');
    check(document.querySelector('.timestamp-icon').getAttribute('src').includes('/img/claude.svg'), 'Custom model icon stopped working');
    const badge = document.querySelector('.ih-chat-model-badge'); badges.apply();
    check(document.querySelector('.ih-chat-model-badge') === badge, 'Unchanged badge was recreated');
    document.querySelector = originalQuery;
    return metrics;
}

async function iframeScenario(mode) {
    const { installFocus } = await import(`/${mode}/index-harness.js`);
    const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
    const check = (value, message) => { if (!value) throw new Error(message); };
    document.body.innerHTML = '<form id="send_form"><textarea id="send_textarea"></textarea></form><div id="chat"></div>';
    const metrics = { focus: 0, beforeInput: 0, input: 0 };
    const getFocused = installFocus(metrics);
    let scans = 0;
    const originalQuery = document.querySelectorAll.bind(document);
    document.querySelectorAll = selector => { if (selector === 'iframe') scans++; return originalQuery(selector); };
    for (let i = 0; i < 36; i++) { document.getElementById('chat').innerHTML = `<p>Token ${i}</p>`; await new Promise(requestAnimationFrame); }
    await wait(350);
    const report = { chatTriggeredFullIframeScans: scans };
    if (mode === 'current') check(scans === 0, 'Chat mutations must not trigger full-page iframe scans');
    const outer = document.createElement('iframe'); outer.srcdoc = '<textarea id="field"></textarea>';
    const loaded = new Promise(resolve => outer.addEventListener('load', resolve, { once: true }));
    document.body.append(outer); await loaded; await wait(380);
    const field = outer.contentDocument.getElementById('field'); field.focus();
    check(getFocused() === field && metrics.focus === 1, 'Dynamic iframe focus was not tracked once');
    field.dispatchEvent(new InputEvent('beforeinput', { bubbles: true }));
    field.dispatchEvent(new InputEvent('input', { bubbles: true }));
    check(metrics.beforeInput === 1 && metrics.input === 1, 'Iframe history events failed');
    const inner = outer.contentDocument.createElement('iframe'); inner.srcdoc = '<textarea id="nested"></textarea>';
    const nestedLoaded = new Promise(resolve => inner.addEventListener('load', resolve, { once: true }));
    outer.contentDocument.body.append(inner); await nestedLoaded; await wait(50);
    const nested = inner.contentDocument.getElementById('nested'); nested.focus();
    check(getFocused() === nested && metrics.focus === 2, 'Nested iframe focus failed');
    const reloaded = new Promise(resolve => outer.addEventListener('load', resolve, { once: true }));
    outer.srcdoc = '<textarea id="replacement"></textarea>'; await reloaded; await wait(50);
    const replacement = outer.contentDocument.getElementById('replacement'); replacement.focus();
    check(getFocused() === replacement && metrics.focus === 3, 'Reloaded iframe focus failed or duplicated');
    document.querySelectorAll = originalQuery;
    return report;
}

async function iframeLifecycleScenario(mode) {
    if (mode === 'baseline') return { helperNotPresent: true };
    const { observeIframeDocuments } = await import(`/${mode}/dom-observers.js`);
    const check = (value, message) => { if (!value) throw new Error(message); };
    const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
    const observers = new Map();
    const controller = observeIframeDocuments({ document, onDocument: current => {
        const NativeObserver = current.defaultView.MutationObserver;
        current.defaultView.MutationObserver = class extends NativeObserver {
            constructor(callback) { super(callback); observers.set(current, this); }
            disconnect() { this.released = true; super.disconnect(); }
        };
    } });
    const outer = document.createElement('iframe'); outer.srcdoc = '<textarea></textarea>';
    const originalListen = outer.addEventListener.bind(outer);
    let loadBindings = 0;
    outer.addEventListener = (type, handler, options) => {
        if (type === 'load' && !options?.once) loadBindings++;
        originalListen(type, handler, options);
    };
    const loaded = new Promise(resolve => originalListen('load', resolve, { once: true }));
    document.body.append(outer); await loaded; await wait(20);
    const oldDocument = outer.contentDocument;
    const oldObserver = observers.get(oldDocument);
    outer.dispatchEvent(new Event('load')); outer.dispatchEvent(new Event('load'));
    check(loadBindings === 1 && observers.get(oldDocument) === oldObserver, 'Frame load listeners or document observers duplicated');
    const reloaded = new Promise(resolve => originalListen('load', resolve, { once: true }));
    outer.srcdoc = '<textarea>New document</textarea>'; await reloaded; await wait(20);
    check(oldObserver.released, 'Reloaded iframe retained its old document observer');
    const currentObserver = observers.get(outer.contentDocument);
    outer.remove(); await wait(20);
    check(currentObserver.released, 'Detached iframe retained its document observer');
    controller.destroy();
    const existing = document.createElement('iframe'); existing.srcdoc = '<textarea>Fallback</textarea>';
    const existingLoaded = new Promise(resolve => existing.addEventListener('load', resolve, { once: true }));
    document.body.append(existing); await existingLoaded;
    const NativeObserver = window.MutationObserver;
    let fallbackBindings = 0;
    window.MutationObserver = undefined;
    const fallback = observeIframeDocuments({ document, onDocument: () => fallbackBindings++ });
    window.MutationObserver = NativeObserver;
    check(fallbackBindings > 0, 'Existing iframe binding lost its no-observer fallback');
    fallback.destroy();
    return { loadBindings, oldDocumentReleased: true, detachedDocumentReleased: true };
}

try {
    browser = spawn(browserPath, ['--headless=new', '--no-first-run', '--no-default-browser-check',
        '--disable-background-networking', '--remote-debugging-port=0', `--user-data-dir=${profile}`, origin],
    { stdio: ['ignore', 'ignore', 'pipe'], windowsHide: true });
    const endpoint = await new Promise((resolveEndpoint, reject) => {
        const timer = setTimeout(() => reject(new Error('Browser startup timed out')), 15000);
        browser.once('error', reject);
        browser.stderr.on('data', chunk => {
            const match = String(chunk).match(/DevTools listening on (ws:\/\/[^\s]+)/);
            if (match) { clearTimeout(timer); resolveEndpoint(new URL(match[1]).origin.replace('ws:', 'http:')); }
        });
    });
    const targets = await (await fetch(`${endpoint}/json/list`)).json();
    const page = targets.find(target => target.type === 'page');
    assert(page, 'Browser did not create a page target');
    socket = new WebSocket(page.webSocketDebuggerUrl);
    await new Promise((resolveOpen, reject) => { socket.addEventListener('open', resolveOpen, { once: true }); socket.addEventListener('error', reject, { once: true }); });
    socket.addEventListener('message', event => {
        const message = JSON.parse(event.data), ticket = pending.get(message.id);
        if (!ticket) return;
        pending.delete(message.id); clearTimeout(ticket.timer);
        if (message.error) ticket.reject(new Error(JSON.stringify(message.error))); else ticket.resolve(message.result);
    });
    await command('Page.enable');
    for (const mode of sources.keys()) for (const scenario of [navigationScenario, externalScenario, dialogScenario, badgeScenario, iframeScenario, iframeLifecycleScenario]) {
        await command('Page.navigate', { url: `${origin}/fixture?${mode}-${scenario.name}` });
        await new Promise(resolveWait => setTimeout(resolveWait, 200));
        const result = await command('Runtime.evaluate', { expression: `(${scenario.toString()})(${JSON.stringify(mode)})`, awaitPromise: true, returnByValue: true });
        if (result.exceptionDetails) throw new Error(`${mode}/${scenario.name}: ${result.exceptionDetails.exception?.description || result.exceptionDetails.text}`);
        console.log(`${mode}/${scenario.name}: ${JSON.stringify(result.result.value)}`);
    }
    console.log('All browser performance and behavior checks passed.');
} finally {
    for (const ticket of pending.values()) { clearTimeout(ticket.timer); ticket.reject(new Error('Browser closed')); }
    pending.clear(); socket?.close();
    if (browser && browser.exitCode === null) {
        browser.kill(); await Promise.race([once(browser, 'exit'), new Promise(resolveWait => setTimeout(resolveWait, 3000))]);
    }
    server.close();
    const resolvedProfile = resolve(profile), resolvedTemporaryRoot = resolve(tmpdir());
    assert(resolvedProfile.startsWith(resolvedTemporaryRoot + sep) &&
        resolvedProfile.slice(resolvedTemporaryRoot.length + 1).startsWith('quickbar-performance-'), 'Unsafe test profile cleanup path');
    await rm(resolvedProfile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
}
