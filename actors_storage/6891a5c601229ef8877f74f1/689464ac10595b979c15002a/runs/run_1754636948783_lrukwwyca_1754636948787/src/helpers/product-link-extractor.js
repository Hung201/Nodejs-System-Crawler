import cheerio from 'cheerio';

export const EXCLUDE_PATTERNS = [
    '/home', '/pay', '/thanhtoan', '/checkout', '/cart', '/login', '/register',
    '/gio-hang', '/dang-nhap', '/dang-ky', '/lien-he', '/contact', '/tin-tuc', '/news',
    '/about', '/about-us', '/chinh-sach', '/policy', '/dieu-khoan', '/terms',
    '/search', '/tim-kiem', '/filter', '/loc', '/sort', '/sap-xep',
    '/tag', '/category', '/danh-muc', '/brand', '/thuong-hieu',
    '/#', '/javascript:', '/mailto:', '/tel:', '/gioi-thieu', '/du-an', '/tin-tuc', '/lien-he', '/about', '/news', '/contact'
];

export const DEFAULT_PRODUCT_PATTERNS = [
    'product', 'san-pham', 'item', 'goods', 'detail',
    'p/', 'sp/', 'prd/', 'pid=', 'product_id='
];

export function isExcludedUrl(url) {
    const lowerUrl = url.toLowerCase();
    return EXCLUDE_PATTERNS.some(pattern => lowerUrl.includes(pattern));
}

export function isProductLink(url, productLinkPattern) {
    const lowerUrl = url.toLowerCase();
    if (productLinkPattern) {
        return lowerUrl.includes(productLinkPattern.toLowerCase());
    }
    return DEFAULT_PRODUCT_PATTERNS.some(pattern => lowerUrl.includes(pattern));
}

export function extractProductLinks($, url, productLinkSelector, productLinkIncludePatterns = [], productLinkExcludePatterns = []) {
    const productLinks = new Set();
    if (productLinkSelector) {
        $(productLinkSelector).each((i, el) => {
            let href = $(el).attr('href');
            if (!href || href.startsWith('#') || href.startsWith('javascript:') || href === '/') return;
            let fullUrl = href.startsWith('http') ? href : new URL(href, url).href;

            // Kiểm tra exclude patterns
            if (productLinkExcludePatterns && productLinkExcludePatterns.length > 0) {
                const shouldExclude = productLinkExcludePatterns.some(pattern =>
                    fullUrl.toLowerCase().includes(pattern.toLowerCase())
                );
                if (shouldExclude) return;
            }

            // Kiểm tra include patterns - PHẢI chứa TẤT CẢ patterns
            if (productLinkIncludePatterns && productLinkIncludePatterns.length > 0) {
                const shouldInclude = productLinkIncludePatterns.every(pattern =>
                    fullUrl.toLowerCase().includes(pattern.toLowerCase())
                );
                if (!shouldInclude) return;
            }

            if (!isExcludedUrl(fullUrl)) {
                productLinks.add(fullUrl);
            }
        });
    } else {
        $('a').each((i, el) => {
            let href = $(el).attr('href');
            if (!href || href.startsWith('#') || href.startsWith('javascript:') || href === '/') return;
            let fullUrl = href.startsWith('http') ? href : new URL(href, url).href;

            // Kiểm tra exclude patterns
            if (productLinkExcludePatterns && productLinkExcludePatterns.length > 0) {
                const shouldExclude = productLinkExcludePatterns.some(pattern =>
                    fullUrl.toLowerCase().includes(pattern.toLowerCase())
                );
                if (shouldExclude) return;
            }

            // Kiểm tra include patterns - PHẢI chứa TẤT CẢ patterns
            if (productLinkIncludePatterns && productLinkIncludePatterns.length > 0) {
                const shouldInclude = productLinkIncludePatterns.every(pattern =>
                    fullUrl.toLowerCase().includes(pattern.toLowerCase())
                );
                if (!shouldInclude) return;
            }

            if (!isExcludedUrl(fullUrl)) {
                productLinks.add(fullUrl);
            }
        });
    }
    return Array.from(productLinks);
} 