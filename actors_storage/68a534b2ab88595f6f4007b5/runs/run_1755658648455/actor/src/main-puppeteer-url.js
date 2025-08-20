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
        const targetUrl = args[0] || 'https://www.google.com/search?q=gach&hl=vi&gl=vn&num=100';
        const maxResults = parseInt(args[1]) || 10;

        console.log(`Starting Puppeteer scraper for URL: "${targetUrl}"`);
        console.log('Focusing on extracting all <a> tags with class zReHs');
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
                '--disable-gpu',
                '--disable-web-security',
                '--disable-features=VizDisplayCompositor',
                '--disable-extensions',
                '--disable-plugins',
                '--disable-images',
                '--disable-background-timer-throttling',
                '--disable-backgrounding-occluded-windows',
                '--disable-renderer-backgrounding',
                '--disable-field-trial-config',
                '--disable-ipc-flooding-protection'
            ]
        });

        const page = await browser.newPage();

        // Set user agent
        await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        // Set viewport
        await page.setViewport({ width: 1920, height: 1080 });

        // Set extra headers
        await page.setExtraHTTPHeaders({
            'Accept-Language': 'vi-VN,vi;q=0.9,en;q=0.8',
            'Accept-Encoding': 'gzip, deflate, br',
            'DNT': '1',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Sec-Fetch-User': '?1',
            'Cache-Control': 'max-age=0'
        });

        // Add random delay before navigation
        console.log('Waiting before making request...');
        await randomDelay(5000, 10000);

        // Navigate to the page
        console.log('Navigating to page...');
        await page.goto(targetUrl, {
            waitUntil: 'networkidle2',
            timeout: 30000
        });

        // Wait a bit more for dynamic content
        await page.waitForTimeout(5000);

        // Get the page content
        const html = await page.content();
        console.log(`Page content length: ${html.length} characters`);

        // Parse HTML with Cheerio
        const $ = cheerio.load(html);
        const results = [];

        // Tìm tất cả thẻ <a> có class zReHs
        let zReHsLinks = $('a.zReHs');
        console.log(`Found ${zReHsLinks.length} <a> tags with class zReHs`);

        if (zReHsLinks.length === 0) {
            console.log('No zReHs links found. Trying alternative selectors...');

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
                    console.log(`Found ${elements.length} elements using selector: ${selector}`);
                    zReHsLinks = elements;
                    break;
                }
            }
        }

        // Duyệt qua từng thẻ <a> có class zReHs
        zReHsLinks.each((index, element) => {
            if (results.length >= maxResults) return false; // Stop if we have enough results

            const $link = $(element);
            console.log(`\n--- Processing zReHs link ${index + 1} ---`);

            // Lấy thông tin chi tiết của thẻ <a>
            const href = $link.attr('href');
            const text = $link.text().trim();
            const classes = $link.attr('class') || '';
            const jsname = $link.attr('jsname') || '';
            const dataVed = $link.attr('data-ved') || '';
            const ping = $link.attr('ping') || '';

            console.log(`  href: "${href}"`);
            console.log(`  text: "${text}"`);
            console.log(`  class: "${classes}"`);
            console.log(`  jsname: "${jsname}"`);
            console.log(`  data-ved: "${dataVed}"`);
            console.log(`  ping: "${ping}"`);

            // Bỏ qua các link không hợp lệ
            if (!href || href.includes('google.com/search') || href.includes('google.com/url')) {
                console.log(`  ❌ Skipping internal Google link: ${href}`);
                return;
            }

            // Bỏ qua link trống hoặc quá ngắn
            if (!text || text.length < 3) {
                console.log(`  ❌ Skipping empty/short text link`);
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
            // Tìm snippet trong các element cha
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
                    jsname: jsname,
                    dataVed: dataVed,
                    ping: ping
                },
                snippet: snippet,
                sourceUrl: targetUrl,
                scrapedAt: new Date().toISOString(),
                linkIndex: index + 1
            };

            results.push(result);
            console.log(`  ✅ Extracted result ${result.position}: "${text}"`);
            console.log(`  📎 Clean URL: ${cleanUrl}`);
            if (snippet) {
                console.log(`  📝 Snippet: ${snippet.substring(0, 100)}...`);
            }
        });

        // Save results to file
        if (results.length > 0) {
            const outputPath = path.join(__dirname, '..', 'output-puppeteer-url.json');
            fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
            console.log(`\n✅ Successfully scraped ${results.length} results from URL`);
            console.log(`📁 Results saved to: ${outputPath}`);

            // Hiển thị tóm tắt
            console.log('\n=== SUMMARY ===');
            results.forEach((result, index) => {
                console.log(`${index + 1}. "${result.link.title}"`);
                console.log(`   URL: ${result.link.url}`);
                console.log(`   Class: ${result.link.classes}`);
                console.log(`   jsname: ${result.link.jsname}`);
                if (result.snippet) {
                    console.log(`   Snippet: ${result.snippet.substring(0, 100)}...`);
                }
                console.log('');
            });
        } else {
            console.log('❌ No results found from URL');

            // Save debug info
            const debugInfo = {
                debug: {
                    sourceUrl: targetUrl,
                    pageTitle: $('title').text(),
                    zReHsLinksFound: zReHsLinks.length,
                    totalLinks: $('a').length,
                    totalDivs: $('div').length,
                    responseLength: html.length,
                    timestamp: new Date().toISOString(),
                }
            };

            const debugPath = path.join(__dirname, '..', 'debug-puppeteer-url.json');
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

        const errorPath = path.join(__dirname, '..', 'error-puppeteer-url.json');
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
