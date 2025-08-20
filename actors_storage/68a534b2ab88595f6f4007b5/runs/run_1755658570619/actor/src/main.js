const { CheerioCrawler, Dataset } = require('crawlee');
const fs = require('fs');
const path = require('path');

// Function to build search URL
function buildSearchUrl(searchTerm, searchEngine, country, language) {
    const encodedTerm = encodeURIComponent(searchTerm);

    if (searchEngine === 'google') {
        return `https://www.google.com/search?q=${encodedTerm}&hl=${language}&gl=${country}&num=100`;
    } else if (searchEngine === 'bing') {
        return `https://www.bing.com/search?q=${encodedTerm}&setlang=${language}-${country.toUpperCase()}&cc=${country.toUpperCase()}`;
    }

    // Default to Google
    return `https://www.google.com/search?q=${encodedTerm}&hl=${language}&gl=${country}&num=100`;
}

// Function to scrape Google search results
async function scrapeGoogle($, searchTerm, maxResults) {
    const results = [];

    // Tìm tất cả thẻ <a> có class zReHs
    let zReHsLinks = $('a.zReHs');

    if (zReHsLinks.length === 0) {
        // Thử các selector khác cho link
        const alternativeSelectors = [
            'a[class*="zReHs"]',
            'a[jsname="UWckNb"]',
            'a[href^="http"]',
            'div.MjjYud a',
            'div.g a',
            'h3 a',
            '.LC20lb'
        ];

        for (const selector of alternativeSelectors) {
            const elements = $(selector);
            if (elements.length > 0) {
                zReHsLinks = elements;
                break;
            }
        }
    }

    // Duyệt qua từng thẻ <a> có class zReHs
    zReHsLinks.each((index, element) => {
        if (results.length >= maxResults) return false;

        const $link = $(element);
        const href = $link.attr('href');
        const text = $link.text().trim();
        const classes = $link.attr('class') || '';
        const jsname = $link.attr('jsname') || '';

        // Bỏ qua các link không hợp lệ
        if (!href || href.includes('google.com/search') || href.includes('google.com/url')) {
            return;
        }

        // Bỏ qua link trống hoặc quá ngắn
        if (!text || text.length < 3) {
            return;
        }

        // Clean URL
        let cleanUrl = href;
        if (href.includes('google.com/url')) {
            const urlMatch = href.match(/[?&]url=([^&]+)/);
            if (urlMatch) {
                cleanUrl = decodeURIComponent(urlMatch[1]);
            }
        }

        // Tìm snippet từ parent elements
        let snippet = '';
        const parentElement = $link.closest('div.MjjYud, div.g, div[data-hveid]');
        if (parentElement.length > 0) {
            snippet = parentElement.find('.VwiC3b, .s3v9rd, .st, .aCOpRe, .IsZvec').text().trim();
        }

        const result = {
            position: results.length + 1,
            link: {
                title: text,
                url: cleanUrl,
                originalHref: href,
                classes: classes,
                jsname: jsname
            },
            snippet: snippet,
            searchTerm: searchTerm,
            scrapedAt: new Date().toISOString()
        };

        results.push(result);
    });

    return results;
}

// Function to scrape Bing search results
async function scrapeBing($, searchTerm, maxResults) {
    const results = [];

    // Tìm tất cả kết quả tìm kiếm Bing
    const searchResults = $('li.b_algo');

    // Duyệt qua từng kết quả
    searchResults.each((index, element) => {
        if (results.length >= maxResults) return false;

        const $result = $(element);
        const title = $result.find('h2 a').text().trim();
        const bingUrl = $result.find('h2 a').attr('href') || '';
        const snippet = $result.find('.b_caption p').text().trim();

        // Bỏ qua các kết quả không hợp lệ
        if (!title || !bingUrl || title.length < 3) {
            return;
        }

        const result = {
            position: results.length + 1,
            link: {
                title: title,
                url: bingUrl,
                originalHref: bingUrl,
                note: "Bing redirect URL - needs manual extraction of real URL"
            },
            snippet: snippet,
            searchTerm: searchTerm,
            scrapedAt: new Date().toISOString()
        };

        results.push(result);
    });

    return results;
}

// Function to save data to hung.json format
function saveToHungJson(allResults, searchEngine, country, language, maxResults) {
    const searchTermGroups = {};

    allResults.forEach(result => {
        const searchTerm = result.searchTerm;

        if (!searchTermGroups[searchTerm]) {
            // Extract domain from URL for displayedUrl
            let displayedUrl = '';
            try {
                const urlObj = new URL(result.link.url);
                displayedUrl = urlObj.hostname;
            } catch (e) {
                displayedUrl = result.link.url.substring(0, 50) + '...';
            }

            // Build search query info
            const searchUrl = buildSearchUrl(searchTerm, searchEngine, country, language);

            searchTermGroups[searchTerm] = {
                searchQuery: {
                    term: searchTerm,
                    url: searchUrl,
                    device: "DESKTOP",
                    page: 1,
                    type: "SEARCH",
                    domain: searchEngine === 'google' ? 'google.com.vn' : 'bing.com',
                    countryCode: country.toUpperCase(),
                    languageCode: language,
                    locationUule: null,
                    resultsPerPage: maxResults.toString()
                },
                resultsTotal: "N/A",
                relatedQueries: [],
                paidResults: [],
                paidProducts: [],
                organicResults: []
            };
        }

        // Extract domain from URL for displayedUrl
        let displayedUrl = '';
        try {
            const urlObj = new URL(result.link.url);
            displayedUrl = urlObj.hostname;
        } catch (e) {
            displayedUrl = result.link.url.substring(0, 50) + '...';
        }

        // Add organic result to the group
        searchTermGroups[searchTerm].organicResults.push({
            title: result.link.title,
            url: result.link.url,
            displayedUrl: displayedUrl,
            description: result.snippet || '',
            emphasizedKeywords: [],
            siteLinks: [],
            productInfo: {},
            imageData: "",
            type: "organic",
            position: result.position
        });
    });

    const hungData = Object.values(searchTermGroups);
    const hungPath = path.join(__dirname, '..', 'hung.json');
    fs.writeFileSync(hungPath, JSON.stringify(hungData, null, 2));

    return hungData;
}

// Main crawler function
async function main() {
    try {
        // Đọc input.json
        const inputPath = path.join(__dirname, '..', 'input.json');
        const input = JSON.parse(fs.readFileSync(inputPath, 'utf8'));

        const { searchTerms, maxResults, searchEngine, country, language } = input;

        // Tạo requests cho từng search term
        const requests = searchTerms.map((searchTerm, index) => ({
            url: buildSearchUrl(searchTerm, searchEngine, country, language),
            userData: {
                searchTerm,
                page: 1,
                searchEngine,
                maxResults
            }
        }));

        const allResults = [];

        // Khởi tạo CheerioCrawler
        const crawler = new CheerioCrawler({
            // Giới hạn số request đồng thời
            maxConcurrency: 1,

            // Delay giữa các request
            requestHandlerTimeoutSecs: 60,

            // Request handler
            async requestHandler({ $, request, log }) {
                const { searchTerm, page, searchEngine, maxResults } = request.userData;

                log.info(`Querying "${searchTerm}" page ${page}...`);

                try {
                    // Scrape based on search engine
                    let results = [];
                    if (searchEngine === 'google') {
                        results = await scrapeGoogle($, searchTerm, maxResults);
                    } else if (searchEngine === 'bing') {
                        results = await scrapeBing($, searchTerm, maxResults);
                    }

                    // Log results
                    const organicResults = results.length;
                    const paidResults = 0; // Google doesn't show paid results in organic search
                    const paidProducts = 0;
                    const relatedQueries = 0;
                    const aiOverview = 0;

                    log.info(`Finished query "${searchTerm}" page ${page} (organicResults: ${organicResults}, paidResults: ${paidResults}, paidProducts: ${paidProducts}, relatedQueries: ${relatedQueries}, aiOverview: ${aiOverview})`);

                    // Check if this is the last page
                    if (results.length < maxResults) {
                        log.info(`This is the last page for query "${searchTerm}". Next page button was not rendered nor enough results were found.`);
                    }

                    // Add results to global array
                    allResults.push(...results);

                    // Push to Apify dataset
                    await Dataset.pushData(results);

                } catch (error) {
                    log.error(`Error scraping "${searchTerm}": ${error.message}`);
                }
            },

            // Failed request handler
            async failedRequestHandler({ request, log }) {
                log.error(`Request ${request.url} failed`);
            }
        });

        // Chạy crawler
        await crawler.run(requests);

        // Save all results to file
        if (allResults.length > 0) {
            const outputPath = path.join(__dirname, '..', 'output-search-terms.json');
            fs.writeFileSync(outputPath, JSON.stringify(allResults, null, 2));

            // Lưu vào hung.json
            const hungData = saveToHungJson(allResults, searchEngine, country, language, maxResults);

            console.log(`\n✅ Successfully scraped ${allResults.length} total results`);
            console.log(`📁 Results saved to: ${outputPath}`);
            console.log(`📁 Hung format saved to: hung.json`);
        } else {
            console.log('❌ No results found from any search terms');
        }

    } catch (error) {
        console.error('❌ Error during scraping:', error);

        // Save error info
        const errorInfo = {
            error: {
                message: error.message,
                timestamp: new Date().toISOString(),
            }
        };

        const errorPath = path.join(__dirname, '..', 'error-search-terms.json');
        fs.writeFileSync(errorPath, JSON.stringify(errorInfo, null, 2));
        console.log(`📁 Error info saved to: ${errorPath}`);

        process.exit(1);
    }
}

// Chạy main function
main();
