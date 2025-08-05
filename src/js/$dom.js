const DOM = {
    get: (id) => document.getElementById(id),
    query: (sel) => document.querySelector(sel),
    queryAll: (sel) => document.querySelectorAll(sel),
    create: (tag, attrs = {}, content = '') => {
        const el = document.createElement(tag);
        Object.entries(attrs).forEach(([k, v]) => {
            if (k === 'style' && typeof v === 'object') {
                Object.assign(el.style, v);
            } else if (k === 'class') {
                el.className = v;
            } else if (k.startsWith('on')) {
                el[k] = v;
            } else {
                el.setAttribute(k, v);
            }
        });
        if (content) el.innerHTML = content;
        return el;
    },
    show: (el, display = 'block') => {
        if (typeof el === 'string') el = DOM.get(el);
        if (el) el.style.display = display;
    },
    hide: (el) => {
        if (typeof el === 'string') el = DOM.get(el);
        if (el) el.style.display = 'none';
    },
    toggle: (el, display = 'block') => {
        if (typeof el === 'string') el = DOM.get(el);
        if (el) el.style.display = el.style.display === 'none' ? display : 'none';
    },
    setText: (el, text) => {
        if (typeof el === 'string') el = DOM.get(el);
        if (el) el.textContent = text;
    },
    setHTML: (el, html) => {
        if (typeof el === 'string') el = DOM.get(el);
        if (el) el.innerHTML = html;
    }
};

window.DOM = DOM;