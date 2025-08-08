export const WEBSITE_TYPES = {
    UNKNOWN: 'unknown',
};

export const detectWebsiteType = (url) => {
    const domain = getDomain(url);
    return WEBSITE_TYPES.UNKNOWN;
};

export const getDomain = (url) => {
    try {
        const urlParse = new URL(url);
        return urlParse.hostname;
    }
    catch (e) {
        return '';
    }
}; 