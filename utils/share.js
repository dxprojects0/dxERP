export const shareData = async (title, text) => {
    if (navigator.share) {
        try {
            await navigator.share({ title, text });
        }
        catch (err) {
            copyToClipboard(text);
        }
    }
    else {
        copyToClipboard(text);
    }
};
const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
        alert("Copied to clipboard! You can now paste it in WhatsApp/SMS.");
    });
};
