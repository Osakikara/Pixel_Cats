// js/safestorage.js – надёжная обёртка localStorage (не падает при запрете)
const SafeStorage = (() => {
    const inMemory = {};

    let usable = false;
    try {
        const key = '__pxtest__';
        localStorage.setItem(key, '1');
        localStorage.removeItem(key);
        usable = true;
    } catch (e) {
        console.warn('[SafeStorage] localStorage недоступен, использую оперативную память');
    }

    function set(key, value) {
        if (usable) {
            try { localStorage.setItem(key, value); } catch (e) { /* подавляем */ }
        }
        inMemory[key] = value;
    }

    function get(key, fallback = null) {
        if (usable) {
            try {
                const v = localStorage.getItem(key);
                return v !== null ? v : fallback;
            } catch (e) {
                return inMemory.hasOwnProperty(key) ? inMemory[key] : fallback;
            }
        }
        return inMemory.hasOwnProperty(key) ? inMemory[key] : fallback;
    }

    function getBool(key, defaultVal = false) {
        const v = get(key);
        if (v === null) return defaultVal;
        return v === 'true' || v === '1';
    }

    function getInt(key, defaultVal = 0) {
        const v = get(key);
        if (v === null) return defaultVal;
        const n = parseInt(v, 10);
        return isNaN(n) ? defaultVal : n;
    }

    function getFloat(key, defaultVal = 0) {
        const v = get(key);
        if (v === null) return defaultVal;
        const n = parseFloat(v);
        return isNaN(n) ? defaultVal : n;
    }

    function getJSON(key, defaultVal = null) {
        const v = get(key);
        if (v === null) return defaultVal;
        try { return JSON.parse(v); } catch (e) { return defaultVal; }
    }

    function remove(key) {
        if (usable) {
            try { localStorage.removeItem(key); } catch (e) {}
        }
        delete inMemory[key];
    }

    return { get, set, getBool, getInt, getFloat, getJSON, remove };
})();
