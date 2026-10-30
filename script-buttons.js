import { normalizeEntryIcon } from "./external-entries.js";

// Source-managed runtime buttons: never serialize callbacks, metadata or keys
// into QuickBar's settings, nor offer these buttons in its management pickers.
export function createScriptButtonRegistry({ isAvailable = () => true, onChange = () => {}, onError = () => {} } = {}) {
  const entries = new Map();
  const running = new Set();
  const notify = () => { try { onChange(); } catch (error) { onError(error); } };
  function isActive(id) {
    const entry = entries.get(id);
    if (!entry) return false;
    try { return !!isAvailable(entry); } catch { return false; }
  }
  function registerExternalButton(descriptor) {
    if (!descriptor || typeof descriptor.id !== "string" || !/^[a-z][a-z0-9_-]{0,63}$/.test(descriptor.id)
      || typeof descriptor.label !== "string" || !descriptor.label.trim() || typeof descriptor.action !== "function"
      || (descriptor.placement !== undefined && !["toolbar", "floating"].includes(descriptor.placement))) {
      throw new TypeError("Invalid QuickBar script button descriptor");
    }
    const entry = Object.freeze({
      id: descriptor.id, key: `script_${descriptor.id}`, label: descriptor.label.trim().slice(0, 160),
      icon: normalizeEntryIcon(descriptor.icon) || "fa-solid fa-plug",
      placement: descriptor.placement || "toolbar", action: descriptor.action,
    });
    entries.set(entry.id, entry);
    const handle = Object.freeze({
      id: entry.id, key: entry.key,
      isActive: () => entries.get(entry.id) === entry && isActive(entry.id),
      unregister() {
        // A stale script's cleanup must not remove its replacement's callback.
        if (entries.get(entry.id) !== entry) return;
        entries.delete(entry.id); notify();
      },
    });
    notify();
    return handle;
  }
  function unregisterExternalButton(id) {
    if (entries.delete(id)) notify();
  }
  async function activate(key) {
    const entry = get(key);
    if (!entry || !isActive(entry.id) || running.has(key)) return false;
    running.add(key);
    try { await entry.action(); return true; }
    catch (error) { try { onError(error); } catch {} return false; }
    finally { running.delete(key); }
  }
  function get(key) {
    if (typeof key !== "string" || !key.startsWith("script_")) return null;
    return entries.get(key.slice(7)) || null;
  }
  function list(placement) {
    return [...entries.values()].filter(entry => (!placement || entry.placement === placement) && isActive(entry.id));
  }
  function clear() { entries.clear(); notify(); }
  return Object.freeze({ registerExternalButton, unregisterExternalButton, get, list, activate, clear });
}
