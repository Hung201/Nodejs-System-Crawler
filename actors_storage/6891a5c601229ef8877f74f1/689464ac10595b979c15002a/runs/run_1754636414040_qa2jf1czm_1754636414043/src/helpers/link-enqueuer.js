// src/helpers/link-enqueuer.js
export async function enqueueProductLinks(productLinks, enqueueLinks, userData, log, maxLinks = 200) {
    log.info(`Tìm thấy ${productLinks.size} link sản phẩm.`);

    // Giới hạn số lượng link để tránh quá tải
    let limitedLinks = Array.from(productLinks).slice(0, maxLinks);

    if (limitedLinks.length > 0) {
        log.info(`Enqueue ${limitedLinks.length} link sản phẩm (giới hạn ${maxLinks})`);
        await enqueueLinks({
            label: 'unknown-detail',
            strategy: 'same-domain',
            urls: limitedLinks,
            userData: userData
        });
    } else {
        log.warning('Không tìm thấy link sản phẩm nào. Có thể cần điều chỉnh selector hoặc pattern.');
    }
}

export async function enqueuePaginationLinks(paginationUrls, enqueueLinks, userData, log) {
    if (paginationUrls.length > 0) {
        log.info(`Tạo ${paginationUrls.length} URL phân trang`);
        await enqueueLinks({
            label: 'unknown-category',
            strategy: 'same-domain',
            urls: paginationUrls,
            userData: userData
        });
    }
} 