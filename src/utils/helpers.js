export const getDisplayUrl = (url) => {
    try {
        if (!url) return '';
        // If it's a file path or special URL, handle gracefully
        if (!url.startsWith('http')) return url;
        const urlObj = new URL(url);
        return urlObj.hostname.replace('www.', '');
    } catch (e) {
        return url;
    }
};

export const formatNumber = (num) => {
    return num.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
};
