const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer');

// Random delay function
function randomDelay(min = 1000, max = 3000) {
    const delay = Math.floor(Math.random() * (max - min + 1)) + min;
    return new Promise(resolve => setTimeout(resolve, delay));
}

(async () => {
    let browser;
    try {
        // Lấy URL từ command line arguments
        const args = process.argv.slice(2);
        const targetUrl = args[0] || 'https://www.bing.com/search?q=gach&setlang=vi-VN&cc=VN';
        const maxResults = parseInt(args[1]) || 10;

        console.log(`Starting Bing scraper for URL: "${targetUrl}"`);
        console.log('Focusing on extracting search results');
        console.log(`Max results: ${maxResults}`);

        // Launch browser
        browser = await puppeteer.launch({
            headless: "new",
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--disable-gpu'
            ]
        });

        const page = await browser.newPage();

        // Set user agent
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        // Set viewport
        await page.setViewport({ width: 1920, height: 1080 });

        // Add random delay before navigation
        console.log('Waiting before making request...');
        await randomDelay(2000, 5000);

        // Navigate to the page
        console.log('Navigating to page...');
        await page.goto(targetUrl, {
            waitUntil: 'networkidle2',
            timeout: 30000
        });

        // Wait a bit more for dynamic content
        await page.waitForTimeout(3000);

        // Get the page content
        const html = await page.content();
        console.log(`Page content length: ${html.length} characters`);

        // Parse HTML with Cheerio
        const $ = cheerio.load(html);
        const results = [];

        // Tìm tất cả kết quả tìm kiếm Bing
        const searchResults = $('li.b_algo');
        console.log(`Found ${searchResults.length} search results`);

        // Duyệt qua từng kết quả
        searchResults.each((index, element) => {
            if (results.length >= maxResults) return false; // Stop if we have enough results

            const $result = $(element);
            console.log(`\n--- Processing result ${index + 1} ---`);

            // Lấy thông tin chi tiết
            const title = $result.find('h2 a').text().trim();
            const url = $result.find('h2 a').attr('href') || '';
            const snippet = $result.find('.b_caption p').text().trim();

            console.log(`  title: "${title}"`);
            console.log(`  url: "${url}"`);
            console.log(`  snippet: "${snippet}"`);

            // Bỏ qua các kết quả không hợp lệ
            if (!title || !url || title.length < 3) {
                console.log(`  ❌ Skipping invalid result`);
                return;
            }

            const result = {
                position: results.length + 1,
                link: {
                    title: title,
                    url: url,
                    originalHref: url
                },
                snippet: snippet,
                sourceUrl: targetUrl,
                scrapedAt: new Date().toISOString(),
                linkIndex: index + 1
            };

            results.push(result);
            console.log(`  ✅ Extracted result ${result.position}: "${title}"`);
            console.log(`  📎 URL: ${url}`);
            if (snippet) {
                console.log(`  📝 Snippet: ${snippet.substring(0, 100)}...`);
            }
        });

        // Save results to file
        if (results.length > 0) {
            const outputPath = path.join(__dirname, '..', 'output-bing-url.json');
            fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
            console.log(`\n✅ Successfully scraped ${results.length} results from Bing`);
            console.log(`📁 Results saved to: ${outputPath}`);

            // Hiển thị tóm tắt
            console.log('\n=== SUMMARY ===');
            results.forEach((result, index) => {
                console.log(`${index + 1}. "${result.link.title}"`);
                console.log(`   URL: ${result.link.url}`);
                if (result.snippet) {
                    console.log(`   Snippet: ${result.snippet.substring(0, 100)}...`);
                }
                console.log('');
            });
        } else {
            console.log('❌ No results found from Bing');

            // Save debug info
            const debugInfo = {
                debug: {
                    sourceUrl: targetUrl,
                    pageTitle: $('title').text(),
                    searchResultsFound: searchResults.length,
                    totalLinks: $('a').length,
                    totalDivs: $('div').length,
                    responseLength: html.length,
                    timestamp: new Date().toISOString(),
                }
            };

            const debugPath = path.join(__dirname, '..', 'debug-bing-url.json');
            fs.writeFileSync(debugPath, JSON.stringify(debugInfo, null, 2));
            console.log(`📁 Debug info saved to: ${debugPath}`);
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

        const errorPath = path.join(__dirname, '..', 'error-bing-url.json');
        fs.writeFileSync(errorPath, JSON.stringify(errorInfo, null, 2));
        console.log(`📁 Error info saved to: ${errorPath}`);

        process.exit(1);
    } finally {
        if (browser) {
            await browser.close();
            console.log('Browser closed');
        }
    }
})();
