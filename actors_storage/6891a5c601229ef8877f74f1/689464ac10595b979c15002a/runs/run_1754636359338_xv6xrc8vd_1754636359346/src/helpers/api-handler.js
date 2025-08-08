// src/helpers/api-handler.js
import fetch from 'node-fetch';
import cheerio from 'cheerio';

// Function mới để gọi API theo yêu cầu của user
export async function fetchProductLinksFromExternalAPI(url, productLinkIncludePatterns = [], productLinkExcludePatterns = [], log) {
    const apiUrl = 'http://api-product.daisan.vn/?mod=parseurl&site=_db';

    log.info(`Gọi API external: ${apiUrl}`);
    log.info(`URL input: ${url}`);

    try {
        const requestBody = {
            url: url,
            prefix: ""
        };

        const requestOptions = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            body: JSON.stringify(requestBody)
        };

        log.info(`Đang gọi API với body: ${JSON.stringify(requestBody)}`);

        const response = await fetch(apiUrl, requestOptions);

        if (!response.ok) {
            log.error(`API trả về lỗi ${response.status}: ${response.statusText}`);
            return new Set();
        }

        const data = await response.json();
        log.info(`API response: ${JSON.stringify(data)}`);

        if (!data.a_links || !Array.isArray(data.a_links)) {
            log.warning('API không trả về a_links hoặc a_links không phải array');
            return new Set();
        }

        const productLinks = new Set();

        // Lọc các link theo include/exclude patterns
        data.a_links.forEach(link => {
            const lowerLink = link.toLowerCase();

            // Kiểm tra exclude patterns
            if (productLinkExcludePatterns && productLinkExcludePatterns.length > 0) {
                const shouldExclude = productLinkExcludePatterns.some(pattern =>
                    lowerLink.includes(pattern.toLowerCase())
                );
                if (shouldExclude) {
                    // log.info(`Loại bỏ link theo exclude pattern: ${link}`);
                    return;
                }
            }

            // Kiểm tra include patterns - PHẢI chứa TẤT CẢ patterns
            if (productLinkIncludePatterns && productLinkIncludePatterns.length > 0) {
                const shouldInclude = productLinkIncludePatterns.every(pattern =>
                    lowerLink.includes(pattern.toLowerCase())
                );
                if (!shouldInclude) {
                    // log.info(`Loại bỏ link không match tất cả include patterns: ${link}`);
                    return;
                }
            }

            // Thêm link nếu đã pass qua include/exclude patterns
            productLinks.add(link);
            // log.info(`Thêm link sản phẩm: ${link}`);
        });

        log.info(`Tìm thấy ${productLinks.size} link sản phẩm từ API`);
        return productLinks;

    } catch (error) {
        log.error(`Lỗi khi gọi API external: ${error.message}`);
        return new Set();
    }
}

export async function fetchProductLinksFromAPI(url, $, apiConfig, productLinkPattern, log) {
    if (!apiConfig || !apiConfig.baseUrl) return new Set();

    log.info(`Sử dụng API nội bộ: ${apiConfig.baseUrl}`);

    // Lấy tham số cần thiết từ trang (nếu có)
    let apiParams = {};
    if (apiConfig.paramSelectors) {
        for (let [paramName, selector] of Object.entries(apiConfig.paramSelectors)) {
            let value = '';

            // Kiểm tra xem có phải regex pattern không
            if (selector.startsWith('regex:')) {
                const regexPattern = selector.substring(6); // Bỏ 'regex:' prefix
                const match = url.match(new RegExp(regexPattern));
                if (match) {
                    value = match[1] || match[0]; // Lấy group đầu tiên hoặc toàn bộ match
                }
            } else {
                // Selector thông thường
                value = $(selector).attr('value') || $(selector).text().trim();
            }

            if (value) {
                apiParams[paramName] = value;
                log.info(`Lấy được ${paramName}: ${value}`);
            }
        }
    }

    // Gọi API để lấy link sản phẩm
    let page = 1;
    let allLinks = new Set();

    while (page <= (apiConfig.maxPages || 10)) {
        try {
            // Tạo URL API với tham số
            let apiUrl = apiConfig.baseUrl;
            let requestOptions = {
                headers: apiConfig.headers || {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.5',
                    'Accept-Encoding': 'gzip, deflate',
                    'Connection': 'keep-alive',
                }
            };

            // Xử lý tham số cho API
            if (apiConfig.method === 'POST') {
                // POST method với form data
                const formData = new URLSearchParams();

                // Thêm tham số cố định
                if (apiConfig.fixedParams) {
                    for (let [key, value] of Object.entries(apiConfig.fixedParams)) {
                        formData.append(key, value);
                    }
                }

                // Thêm tham số động từ trang
                for (let [paramName, selector] of Object.entries(apiParams)) {
                    formData.append(paramName, selector);
                }

                // Thêm số trang 
                formData.append(apiConfig.pageParam || 'page', page.toString());

                requestOptions.method = 'POST';
                requestOptions.body = formData.toString();

                // Thêm Referer header cho POST request
                if (!requestOptions.headers['Referer']) {
                    requestOptions.headers['Referer'] = url;
                }

            } else {
                // GET method với query parameters
                const params = new URLSearchParams();

                // Thêm tham số cố định
                if (apiConfig.fixedParams) {
                    for (let [key, value] of Object.entries(apiConfig.fixedParams)) {
                        params.append(key, value);
                    }
                }

                // Thêm tham số động từ trang
                for (let [key, value] of Object.entries(apiParams)) {
                    params.append(key, value);
                }

                // Thêm số trang
                params.append(apiConfig.pageParam || 'page', page.toString());

                apiUrl += (apiUrl.includes('?') ? '&' : '?') + params.toString();
            }

            log.info(`Đang gọi API: ${apiUrl} (${apiConfig.method || 'GET'})`);

            let res = await fetch(apiUrl, requestOptions);

            if (!res.ok) {
                log.warning(`API trả về lỗi ${res.status} ở page ${page}`);
                break;
            }

            let html = await res.text();
            if (!html.trim()) {
                log.info(`API trả về rỗng ở page ${page}, dừng crawl`);
                break;
            }

            let $$ = cheerio.load(html);
            let found = false;

            // Tìm link sản phẩm trong response API
            let linkSelector = apiConfig.linkSelector || 'a';
            $$(linkSelector).each((i, el) => {
                let href = $$(el).attr('href');
                if (!href) return;

                let fullUrl = href.startsWith('http') ? href : new URL(href, url).href;
                let lowerUrl = fullUrl.toLowerCase();

                // Kiểm tra pattern sản phẩm
                if (productLinkPattern) {
                    if (lowerUrl.includes(productLinkPattern.toLowerCase())) {
                        allLinks.add(fullUrl);
                        found = true;
                    }
                } else {
                    // Pattern mặc định cho sản phẩm
                    let productPatterns = ['product', 'san-pham', 'item', 'goods', 'detail'];
                    let isProductLink = productPatterns.some(pattern => lowerUrl.includes(pattern));
                    if (isProductLink) {
                        allLinks.add(fullUrl);
                        found = true;
                    }
                }
            });

            if (!found) {
                log.info(`Không tìm thấy link sản phẩm ở page ${page}, dừng crawl`);
                break;
            }

            page++;

            // Delay giữa các request API
            if (apiConfig.delay) {
                await new Promise(resolve => setTimeout(resolve, apiConfig.delay));
            }

        } catch (error) {
            log.error(`Lỗi khi gọi API page ${page}:`, error.message);
            break;
        }
    }

    return allLinks;
}

// Function mới để crawl recursive các link sản phẩm qua API
export async function crawlProductLinksRecursively(startUrl, productLinkIncludePatterns = [], productLinkExcludePatterns = [], maxLinks = 100, log) {
    const allProductLinks = new Set();
    const urlsToProcess = [];
    const processedUrls = new Set();

    log.info(`Bắt đầu crawl recursive từ: ${startUrl}`);
    log.info(`Giới hạn tối đa: ${maxLinks} link sản phẩm`);

    try {
        // Bước 1: Gọi API với URL đầu tiên để lấy TẤT CẢ a_links (không lọc)
        log.info(`Gọi API với URL đầu tiên: ${startUrl}`);
        const allLinks = await fetchProductLinksFromExternalAPI(startUrl, [], [], log); // Không lọc, lấy tất cả

        log.info(`API trả về ${allLinks.size} links, thêm vào queue để xử lý`);

        // Bước 2: Thêm tất cả links vào queue để xử lý
        for (const link of allLinks) {
            if (!processedUrls.has(link)) {
                urlsToProcess.push(link);
            }
        }

        // Bước 3: Xử lý từng link trong queue
        while (urlsToProcess.length > 0 && allProductLinks.size < maxLinks) {
            const currentUrl = urlsToProcess.shift();

            if (processedUrls.has(currentUrl)) {
                log.info(`URL đã xử lý, bỏ qua: ${currentUrl}`);
                continue;
            }

            processedUrls.add(currentUrl);
            log.info(`Đang xử lý URL: ${currentUrl} (${allProductLinks.size}/${maxLinks} link sản phẩm đã tìm thấy)`);

            try {
                // Gọi API với link hiện tại và lọc theo yêu cầu
                const productLinks = await fetchProductLinksFromExternalAPI(currentUrl, productLinkIncludePatterns, productLinkExcludePatterns, log);

                // Thêm các link sản phẩm mới vào danh sách
                for (const link of productLinks) {
                    if (allProductLinks.size >= maxLinks) {
                        log.info(`Đã đạt giới hạn ${maxLinks} link, dừng crawl`);
                        break;
                    }

                    if (!allProductLinks.has(link)) {
                        allProductLinks.add(link);
                        // log.info(`Thêm link sản phẩm mới: ${link}`);
                    }
                }

                // Delay để tránh spam API
                await new Promise(resolve => setTimeout(resolve, 1000));

            } catch (error) {
                log.error(`Lỗi khi xử lý URL ${currentUrl}: ${error.message}`);
            }
        }

    } catch (error) {
        log.error(`Lỗi khi gọi API đầu tiên: ${error.message}`);
    }

    log.info(`Hoàn thành crawl recursive. Tổng cộng: ${allProductLinks.size} link sản phẩm`);
    return Array.from(allProductLinks);
} 