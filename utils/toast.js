const TOAST_EVENT = 'dxtools:toast';
const toTitleCase = (text) => text
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
const compactToastMessage = (rawMessage, variant) => {
    const raw = String(rawMessage || '').trim();
    if (!raw)
        return variant === 'error' ? 'Task Failed' : 'Done';
    const lower = raw.toLowerCase();
    if (lower.includes('already active') || lower.includes('already on this plan'))
        return 'Already Active';
    if (lower.includes('already requested') || lower.includes('already request'))
        return 'Already Requested';
    if (lower.includes('plan request'))
        return 'Request Sent';
    if (lower.includes('logged out'))
        return 'Logged Out';
    if (lower.includes('local data cleared') || lower.includes('local storage cleared'))
        return 'Logged Out';
    if (lower.includes('failed') || lower.includes('error') || lower.includes('denied') || lower.includes('invalid'))
        return 'Task Failed';
    if (lower.includes('saved'))
        return 'Saved';
    if (lower.includes('updated'))
        return 'Updated';
    if (lower.includes('added'))
        return 'Added';
    if (lower.includes('removed'))
        return 'Removed';
    if (lower.includes('submitted'))
        return 'Submitted';
    if (lower.includes('synced'))
        return 'Sync Done';
    const cleaned = raw.replace(/[^\w+\s]/g, ' ').replace(/\s+/g, ' ').trim();
    const short = cleaned.split(' ').slice(0, 3).join(' ');
    return toTitleCase(short || (variant === 'error' ? 'Task Failed' : 'Done'));
};
export const emitToast = (payload) => {
    window.dispatchEvent(new CustomEvent(TOAST_EVENT, {
        detail: {
            ...payload,
            message: compactToastMessage(payload.message, payload.variant),
        },
    }));
};
export const onToast = (handler) => {
    const listener = (event) => {
        const custom = event;
        if (!custom.detail?.message)
            return;
        handler(custom.detail);
    };
    window.addEventListener(TOAST_EVENT, listener);
    return () => window.removeEventListener(TOAST_EVENT, listener);
};
