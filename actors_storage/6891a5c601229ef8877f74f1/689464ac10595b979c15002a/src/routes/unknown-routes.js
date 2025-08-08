import { createCheerioRouter } from 'crawlee';
import { addScrapedData } from '../helpers/data-saver.js';
import { extractProductLinks } from '../helpers/product-link-extractor.js';
import { extractProductData } from '../helpers/product-data-extractor.js';
import { createPaginationUrls } from '../helpers/pagination-handler.js';
import { fetchProductLinksFromAPI, fetchProductLinksFromExternalAPI, crawlProductLinksRecursively } from '../helpers/api-handler.js';
import { enqueueProductLinks, enqueuePaginationLinks } from '../helpers/link-enqueuer.js';

export let config = {
    pageStart: 1,
    pageEnd: 50,
};

export let router = createCheerioRouter();

// Handler danh mục: lấy tất cả link sản phẩm từ thẻ a (user truyền url danh mục và các class qua userData)
router.addDefaultHandler(async ({ request, enqueueLinks, $, log, crawler }) => {
    let url = request.loadedUrl;
    let { productLinkSelector, productLinkPattern, productLinkIncludePatterns = [], productLinkExcludePatterns = [], pageStart = 1, pageEnd = 10, paginationPattern, apiConfig, isBrowser = false, maxProductLinks = 50 } = request.userData || {};
    log.info(`+ Unknown Category: ${url}`);

    let productLinks = new Set();

    // Logic mới: Kiểm tra isBrowser để quyết định cách lấy link
    if (isBrowser) {
        // Sử dụng API external để crawl recursive các link sản phẩm
        log.info('Sử dụng API external để crawl recursive các link sản phẩm');
        const productLinksArray = await crawlProductLinksRecursively(url, productLinkIncludePatterns, productLinkExcludePatterns, maxProductLinks, log);
        productLinks = new Set(productLinksArray);
        log.info(`API external recursive tìm thấy ${productLinks.size} link sản phẩm.`);
    } else {
        // Logic cào link sản phẩm qua API nội bộ (nếu có)
        if (apiConfig && apiConfig.baseUrl) {
            productLinks = await fetchProductLinksFromAPI(url, $, apiConfig, productLinkPattern, log);
            log.info(`API nội bộ tìm thấy ${productLinks.size} link sản phẩm.`);
        } else if (apiConfig && !apiConfig.baseUrl) {
            log.warning('apiConfig được truyền nhưng thiếu baseUrl, bỏ qua API và sử dụng logic thông thường');
        } else {
            // Logic phân trang: Tạo URL phân trang dựa trên pattern user truyền vào
            if (paginationPattern) {
                log.info(`Tạo URL phân trang với pattern: ${paginationPattern} từ trang ${pageStart} đến ${pageEnd}`);
                let paginationUrls = createPaginationUrls(url, paginationPattern, pageStart, pageEnd);
                await enqueuePaginationLinks(paginationUrls, enqueueLinks, request.userData, log);
            }

            // Sử dụng helper để lấy link sản phẩm
            const links = extractProductLinks($, url, productLinkSelector, productLinkIncludePatterns, productLinkExcludePatterns);
            links.forEach(link => productLinks.add(link));
        }
    }

    await enqueueProductLinks(productLinks, enqueueLinks, request.userData, log);
});

// Handler cho trang phân trang (sử dụng lại logic tương tự)
router.addHandler('unknown-category', async ({ request, enqueueLinks, $, log, crawler }) => {
    let url = request.loadedUrl;
    let { productLinkSelector, productLinkPattern, productLinkIncludePatterns = [], productLinkExcludePatterns = [], pageStart = 1, pageEnd = 10, paginationPattern } = request.userData || {};
    // log.info(`+ Unknown Category (Pagination): ${url}`);

    let productLinks = new Set();

    // Logic phân trang: Tạo URL phân trang dựa trên pattern user truyền vào
    if (paginationPattern) {
        log.info(`Tạo URL phân trang với pattern: ${paginationPattern} từ trang ${pageStart} đến ${pageEnd}`);
        let paginationUrls = createPaginationUrls(url, paginationPattern, pageStart, pageEnd);
        await enqueuePaginationLinks(paginationUrls, enqueueLinks, request.userData, log);
    }

    // Sử dụng helper để lấy link sản phẩm
    const links = extractProductLinks($, url, productLinkSelector, productLinkIncludePatterns, productLinkExcludePatterns);
    links.forEach(link => productLinks.add(link));

    await enqueueProductLinks(productLinks, enqueueLinks, request.userData, log);
});

// Handler chi tiết sản phẩm: lấy dữ liệu theo class do user truyền vào
router.addHandler('unknown-detail', async ({ request, $, log, pushData }) => {
    let url = request.loadedUrl;
    const productData = extractProductData($, url, request.userData, log);
    if (!productData) {
        log.info('Bỏ qua sản phẩm vì không đủ dữ liệu.');
        return;
    }
    pushData(productData);
    addScrapedData(productData);
    log.info(`Đã lấy xong dữ liệu sản phẩm: ${productData.title}`);
});

// Ví dụ input.json tối ưu:
// {
//         "startUrls": [
//                 {
//                         "url": "https://example.com/category",
//                         "userData": {
//                                 "productLinkSelector": ".product-item a", // Selector cụ thể cho link sản phẩm
//                                 "productLinkPattern": "product", // Hoặc pattern để nhận diện link sản phẩm
//                                 "titleClass": ".product-title",
//                                 "descriptionClass": ".product-description",
//                                 "priceClass": ".product-price",
//                                 "skuClass": ".product-sku",
//                                 "contentClass": ".product-content"
//                         }
//                 }
//         ]
// }