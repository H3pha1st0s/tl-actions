const DEFAULTS = {
    root: document,
    actionAttr: 'data-tl-action',
    triggerAttr: 'data-tl-trigger',
    paramsAttr: 'data-tl-params',
};

function getParams(el, cfg = DEFAULTS) {
    const params = {};
    for (const { name, value } of el.attributes) {
        if (!name.startsWith(cfg.paramsAttr)) continue;
        const key = name.slice(cfg.paramsAttr.length + 1);
        params[key] = value;
    }
    return params;
}

export function createTL(options = {}) {
    const cfg = { ...DEFAULTS, ...options };
    const registry = new Map();
    const listened = new Set();
    let observer = null;


    function register(action, mode, fn) {
        if (typeof fn !== 'function') {
            throw new TypeError(`Handler for ${action}:${mode} must be a function`);
        }

        if (!registry.has(action)) registry.set(action, new Map());
        registry.get(action).set(mode, fn);

        return api;
    }

    function define(map) {
        for (const [action, modes] of Object.entries(map)) {
            for (const [mode, fn] of Object.entries(modes)) {
                register(action, mode, fn);
            }
        }

        return api;
    }

    function getHandler(raw) {
        const [action, mode] = raw.split(':').map(s => s && s.trim());

        if (!action || !mode) {
            console.warn(`Invalid value for data-tl-action "${raw}". Expected "action:mode".`);
            return null;
        }

        const fn = registry.get(action)?.get(mode);

        if (!fn) {
            console.warn(`Unknown action: ${action}`);
            return null;
        };

        return { fn, action, mode };
    }

    function matchesTrigger(el, evType) {
        const raw = el.getAttribute(cfg.triggerAttr) || 'click'

        if (!raw) return evType === 'click';

        const elTriggers = raw.split(/\s+/).filter(Boolean);

        return elTriggers.includes(evType);
    }

    function delegate(ev) {
        let el = ev.target instanceof Element ? ev.target : null;

        if (!el) return;

        const selector = `[${cfg.actionAttr}]`;

        el = el.closest(selector);
        if (!el || !cfg.root.contains(el)) return;
        if (!matchesTrigger(el, ev.type)) return;

        const { fn, err } = getHandler(el.getAttribute(cfg.actionAttr));

        if (err) {
            console.warn(err);
            return;
        }

        const params = getParams(el, cfg);

        try {
            const res = fn({ el, ev, params, root: cfg.root });
            if (res && typeof res.then === 'function') {
                res.catch(e => console.error(`Handler throw (async):`, e));
            }
        } catch (e) {
            console.error(`Handler throw:`, e);
        }
    }

    function evListeners(triggers) {
        for (const t of triggers) {
            if (!listened.has(t)) {
                cfg.root.addEventListener(t, delegate, true);
                listened.add(t);
            }
        }
    }

    function scan(root = cfg.root) {
        const nodes = root.querySelectorAll?.(`[${cfg.actionAttr}]`) ?? [];
        const triggers = new Set(['click']);
        for (const el of nodes) {
            const raw = el.getAttribute(cfg.triggerAttr);
            if (raw) raw.split(/\s+/).filter(Boolean).forEach(t => triggers.add(t));
        }
        evListeners(triggers);
    }

    function observe() {
        if (observer) return;
        observer = new MutationObserver(muts => {
            const added = [];
            for (const m of muts) {
                m.addedNodes?.forEach(n => {
                    if (n.nodeType === 1) added.push(n);
                });
            }
            if (!added.length) return;
            for (const n of added) {
                if (n instanceof Element) {
                    if (n.hasAttribute?.(cfg.actionAttr) || n.querySelector?.(`[${cfg.actionAttr}]`)) {
                        scan(n);
                    }
                }
            }
        });
        observer.observe(cfg.root, { childList: true, subtree: true });
    }

    function init() {
        scan();
        observe();
        return api;
    }

    function destroy() {
        for (const t of listened) cfg.root.removeEventListener(t, delegate, true);
        listened.clear();
        observer?.disconnect();
        observer = null;
    }

    const api = Object.freeze({
        register, define, init, destroy,
    });

    return api;
}
