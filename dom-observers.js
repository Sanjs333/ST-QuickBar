/** Only dialog insertion, removal, reordering or open-state changes affect the host. */
export function hasDialogChanges(records) {
    return records.some(record => {
        if (record.type === 'attributes') {
            return record.attributeName === 'open' && record.target.tagName === 'DIALOG';
        }
        return record.type === 'childList' && [...record.addedNodes, ...record.removedNodes]
            .some(node => node.nodeType === 1 &&
                (node.matches('dialog[open]') || node.querySelector('dialog[open]')));
    });
}

/** Discover frames in added subtrees and bind each frame load once. */
export function observeIframeDocuments({
    document: doc = globalThis.document, onDocument = () => {}, onError = () => {},
} = {}) {
    const frames = new Map(), observers = new Map();
    let destroyed = false;

    function visit(root, callback) {
        if (root.nodeType !== 1 && root.nodeType !== 9) return;
        if (root.tagName === 'IFRAME') callback(root);
        root.querySelectorAll('iframe').forEach(callback);
    }

    function releaseDocument(current) {
        observers.get(current)?.disconnect();
        observers.delete(current);
        for (const frame of [...frames.keys()]) {
            if (frame.ownerDocument === current) releaseFrame(frame);
        }
    }

    function releaseFrame(frame) {
        const entry = frames.get(frame);
        if (!entry) return;
        frames.delete(frame);
        frame.removeEventListener('load', entry.onLoad);
        if (entry.document) releaseDocument(entry.document);
    }

    function bind(frame) {
        if (destroyed || !frame.isConnected) return;
        let entry = frames.get(frame);
        if (!entry) {
            entry = { document: null, onLoad: () => bind(frame) };
            frames.set(frame, entry);
            frame.addEventListener('load', entry.onLoad);
        }
        let current = null;
        try { current = frame.contentDocument; } catch { /* Cross-origin frames can become accessible on a later load. */ }
        if (current === entry.document) return;
        if (entry.document) releaseDocument(entry.document);
        entry.document = current;
        if (!current) return;
        try { onDocument(current, frame); } catch (error) { onError(error); }
        observeDocument(current);
    }

    function observeDocument(current) {
        if (destroyed || observers.has(current)) return;
        const Observer = current.defaultView?.MutationObserver;
        if (!Observer) { visit(current, bind); return; }
        const observer = new Observer(records => {
            for (const record of records) for (const node of record.removedNodes) {
                visit(node, frame => { if (!frame.isConnected) releaseFrame(frame); });
            }
            for (const record of records) for (const node of record.addedNodes) {
                if (node.isConnected && node.ownerDocument === current) visit(node, bind);
            }
        });
        observers.set(current, observer);
        // The document also covers frames inserted before its body exists.
        observer.observe(current, { childList: true, subtree: true });
        visit(current, bind);
    }

    observeDocument(doc);
    return {
        destroy() {
            destroyed = true;
            releaseDocument(doc);
            for (const frame of [...frames.keys()]) releaseFrame(frame);
            for (const observer of observers.values()) observer.disconnect();
            observers.clear();
        },
    };
}
