// src/helpers/pagination-handler.js
export function createPaginationUrls(url, paginationPattern, pageStart = 1, pageEnd = 10) {
    if (!paginationPattern) return [];

    let paginationUrls = [];

    for (let page = pageStart; page <= pageEnd; page++) {
        let paginationUrl;

        if (paginationPattern === '?page=') {
            // Pattern: ?page=2, ?page=3, ...
            let urlObj = new URL(url);
            urlObj.searchParams.set('page', page.toString());
            paginationUrl = urlObj.toString();
        } else if (paginationPattern === '?p=') {
            // Pattern: ?p=2, ?p=3, ...
            let urlObj = new URL(url);
            urlObj.searchParams.set('p', page.toString());
            paginationUrl = urlObj.toString();
        } else if (paginationPattern === '/page/') {
            // Pattern: /page/2/, /page/3/, ... (giữ nguyên query params)
            let urlObj = new URL(url);
            let pathname = urlObj.pathname.replace(/\/page\/\d+\/?$/, '').replace(/\/$/, '');
            let search = urlObj.search;
            paginationUrl = `${urlObj.origin}${pathname}/page/${page}/${search}`;
        } else if (paginationPattern === '/trang/') {
            // Pattern: /trang/2/, /trang/3/, ... (giữ nguyên query params)
            let urlObj = new URL(url);
            let pathname = urlObj.pathname.replace(/\/trang\/\d+\/?$/, '').replace(/\/$/, '');
            let search = urlObj.search;
            paginationUrl = `${urlObj.origin}${pathname}/trang/${page}/${search}`;
        } else if (paginationPattern === '&page=') {
            // Pattern: &page=2, &page=3, ... (cho URL có sẵn params)
            let separator = url.includes('?') ? '&' : '?';
            paginationUrl = `${url}${separator}page=${page}`;
        } else if (paginationPattern === '&p=') {
            // Pattern: &p=2, &p=3, ... (cho URL có sẵn params)
            let separator = url.includes('?') ? '&' : '?';
            paginationUrl = `${url}${separator}p=${page}`;
        } else {
            // Pattern tùy chỉnh: thay {page} bằng số trang
            paginationUrl = url.replace(/\{page\}/g, page.toString());
        }

        paginationUrls.push(paginationUrl);
    }

    return paginationUrls;
} 