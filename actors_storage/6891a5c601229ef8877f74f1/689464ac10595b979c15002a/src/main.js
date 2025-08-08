import 'dotenv/config';
// Apify SDK - toolkit for building Apify Actors (Read more at https://docs.apify.com/sdk/js/)
import { Actor } from 'apify';
// Crawlee - web scraping and browser automation library (Read more at https://crawlee.dev)
import { PuppeteerCrawler, CheerioCrawler } from 'crawlee';
// this is ESM project, and as such, it requires you to specify extensions in your relative imports
// read more about this here: https://nodejs.org/docs/latest-v18.x/api/esm.html#mandatory-file-extensions
import fs from 'fs';
import path from 'path';

import { getBaseUrl, getDomain } from './helpers/crawler-helper.js';
import { WEBSITE_TYPES } from './helpers/website-detector.js';
import { getRouterByWebsiteType, getConfigByWebsiteType } from './routes/index.js';
import { saveDataToFile } from './helpers/data-saver.js';

// The init() call configures the Actor for its environment. It's recommended to start every Actor with an init()
await Actor.init();

const inputPath = path.join(process.cwd(), 'input.json');
let input = {};

try {
    const inputData = fs.readFileSync(inputPath, 'utf8');
    input = JSON.parse(inputData);
    console.log('Loaded input from input.json');
} catch (error) {
    console.log('Could not read input.json, using default values');
    input = {};
}

// Always use Unknown mode
const websiteType = WEBSITE_TYPES.UNKNOWN;

let startUrls = [];
if (input.url) {
    let userData = {};

    // Basic configuration
    if (input.paginationPattern) userData.paginationPattern = input.paginationPattern;
    if (input.pageStart) userData.pageStart = input.pageStart;
    if (input.pageEnd) userData.pageEnd = input.pageEnd;
    if (input.productLinkSelector) userData.productLinkSelector = input.productLinkSelector;
    if (input.productLinkPattern) userData.productLinkPattern = input.productLinkPattern;
    if (input.productLinkIncludePatterns) userData.productLinkIncludePatterns = input.productLinkIncludePatterns;
    if (input.productLinkExcludePatterns) userData.productLinkExcludePatterns = input.productLinkExcludePatterns;

    // Data extraction selectors
    if (input.titleClass) userData.titleClass = input.titleClass;
    if (input.descriptionClass) userData.descriptionClass = input.descriptionClass;
    if (input.priceClass) userData.priceClass = input.priceClass;
    if (input.skuClass) userData.skuClass = input.skuClass;
    if (input.contentClass) userData.contentClass = input.contentClass;
    if (input.thumbnailClass) userData.thumbnailClass = input.thumbnailClass;
    if (input.imagesClass) userData.imagesClass = input.imagesClass;

    // Image filters
    if (input.includePatterns || input.excludePatterns || input.skuInImage !== undefined) {
        userData.imageFilters = {};
        if (input.includePatterns) userData.imageFilters.includePatterns = input.includePatterns;
        if (input.excludePatterns) userData.imageFilters.excludePatterns = input.excludePatterns;
        if (input.skuInImage !== undefined) userData.imageFilters.skuInImage = input.skuInImage;
    }

    // Other options
    if (input.autoGenerateSku !== undefined) userData.autoGenerateSku = input.autoGenerateSku;
    if (input.websiteName) userData.websiteName = input.websiteName;
    if (input.isPrice !== undefined) userData.isPrice = input.isPrice;
    if (input.isThumbnail !== undefined) userData.isThumbnail = input.isThumbnail;
    if (input.category) userData.category = input.category;
    if (input.supplier) userData.supplier = input.supplier;
    if (input.url_supplier) userData.url_supplier = input.url_supplier;
    if (input.isBrowser !== undefined) userData.isBrowser = input.isBrowser;
    if (input.maxProductLinks) userData.maxProductLinks = input.maxProductLinks;

    startUrls = [{
        url: input.url,
        userData: userData
    }];
} else if (input.startUrls && Array.isArray(input.startUrls)) {
    // Fallback for backward compatibility
    startUrls = input.startUrls;
} else {
    throw new Error('Bạn cần nhập URL để bắt đầu crawl!');
}

const router = getRouterByWebsiteType(websiteType);
const config = getConfigByWebsiteType(websiteType);

const proxyConfiguration = await Actor.createProxyConfiguration();

let crawler;
if (websiteType === WEBSITE_TYPES.SHOPEE) {
    crawler = new PuppeteerCrawler({
        proxyConfiguration,
        requestHandler: router,
        maxRequestsPerCrawl: input.maxRequestsPerCrawl || 50000,
        requestHandlerTimeoutSecs: 120,
        minConcurrency: 2,
        maxConcurrency: 5
    });
} else {
    crawler = new CheerioCrawler({
        proxyConfiguration,
        requestHandler: router,
        maxRequestsPerCrawl: input.maxRequestsPerCrawl || 50000,
        requestHandlerTimeoutSecs: 120,
        minConcurrency: 5,
        maxConcurrency: 10
    });
}

await crawler.run(startUrls);

// Save scraped data to hung.json file
saveDataToFile('hung.json');

// Gracefully exit the Actor process. It's recommended to quit all Actors with an exit()
await Actor.exit();