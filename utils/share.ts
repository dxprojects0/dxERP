
export const shareData = async (title: string, text: string) => {
  if (navigator.share) {
    try {
      await navigator.share({ title, text });
    } catch (err) {
      copyToClipboard(text);
    }
  } else {
    copyToClipboard(text);
  }
};

const copyToClipboard = (text: string) => {
  navigator.clipboard.writeText(text).then(() => {
    alert("Copied to clipboard! You can now paste it in WhatsApp/SMS.");
  });
};
