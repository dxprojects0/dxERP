const PUBLIC_THEME_KEY = 'dxt_public_theme';
const PUBLIC_THEME_EVENT = 'dxt:public-theme';
export const getPublicTheme = () => {
    if (typeof window === 'undefined')
        return 'light';
    const raw = window.localStorage.getItem(PUBLIC_THEME_KEY);
    return raw === 'dark' ? 'dark' : 'light';
};
export const setPublicTheme = (mode) => {
    if (typeof window === 'undefined')
        return;
    window.localStorage.setItem(PUBLIC_THEME_KEY, mode);
    window.dispatchEvent(new CustomEvent(PUBLIC_THEME_EVENT, { detail: { mode } }));
};
export const onPublicThemeChange = (handler) => {
    const listener = (event) => {
        const custom = event;
        handler(custom.detail?.mode === 'dark' ? 'dark' : 'light');
    };
    window.addEventListener(PUBLIC_THEME_EVENT, listener);
    return () => window.removeEventListener(PUBLIC_THEME_EVENT, listener);
};
