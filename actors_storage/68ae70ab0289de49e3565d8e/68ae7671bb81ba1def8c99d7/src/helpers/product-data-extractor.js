// src/helpers/product-data-extractor.js
import { formatContent } from './content-helper.js';

export function extractProductData($, url, userData, log) {
    const {
        titleClass, descriptionClass, priceClass, skuClass, contentClass, thumbnailClass, imagesClass,
        autoGenerateSku, websiteName, isPrice, isThumbnail, supplier, url_supplier, category
    } = userData || {};

    // Lấy title với multiple selectors
    let title = '';
    if (titleClass) {
        let selectors = titleClass.split(',').map(s => s.trim());
        for (let selector of selectors) {
            let element = $(selector).first();
            if (element.length > 0) {
                title = element.text().trim();
                if (title) {
                    log && log.info && log.info(`Tìm thấy title với selector: ${selector}`);
                    break;
                }
            }
        }
    }
    if (!title) {
        let defaultSelectors = ['h1', '.product-title', '.title', '.product-detail_title', '.product-name'];
        for (let selector of defaultSelectors) {
            let element = $(selector).first();
            if (element.length > 0) {
                title = element.text().trim();
                if (title) break;
            }
        }
    }
    if (!title) return null;

    // Lấy description
    let description = descriptionClass ? $(descriptionClass).first().text().trim() : '';

    // Lấy price
    let price = '';
    if (priceClass) {
        let priceElement = $(priceClass).first();
        if (priceElement.length > 0) {
            price = priceElement.text().trim();
            log && log.info && log.info(`Tìm thấy price element: ${price}`);
        } else {
            log && log.warning && log.warning(`Không tìm thấy price element với selector: ${priceClass}`);
        }
    }

    if (price) {
        // Làm sạch price - chỉ giữ lại số, dấu phẩy, dấu chấm và ký hiệu tiền
        price = price.replace(/[^\d,.\s₫$€¥]/g, '').trim();
        // Loại bỏ khoảng trắng thừa
        price = price.replace(/\s+/g, ' ');
        log && log.info && log.info(`Price sau khi làm sạch: ${price}`);
    } else {
        log && log.warning && log.warning(`Price rỗng hoặc không tìm thấy`);

        // Thử các selector price khác nếu selector chính không tìm thấy
        let alternativeSelectors = ['.product-price .price', '.price-item .price', '.price-list .price', '[class*="price"]'];
        for (let selector of alternativeSelectors) {
            let altPriceElement = $(selector).first();
            if (altPriceElement.length > 0) {
                price = altPriceElement.text().trim();
                if (price) {
                    price = price.replace(/[^\d,.\s₫$€¥]/g, '').trim();
                    price = price.replace(/\s+/g, ' ');
                    log && log.info && log.info(`Tìm thấy price với selector thay thế ${selector}: ${price}`);
                    break;
                }
            }
        }
    }

    if (isPrice && !price) return null;

    // Lấy sku
    let sku = skuClass ? $(skuClass).first().text().trim() : '';
    if (sku) {
        // Nếu có skuClass và lấy được SKU từ trang, format theo websiteName-{sku}
        let domain = new URL(url).hostname.replace('www.', '');
        let websitePrefix = websiteName || domain.split('.')[0].toUpperCase();
        sku = `${websitePrefix}-${sku}`;
        log && log.info && log.info(`Lấy SKU từ trang và format: ${sku}`);
    } else if (autoGenerateSku) {
        // Tự động generate SKU nếu không có skuClass hoặc không lấy được
        let domain = new URL(url).hostname.replace('www.', '');
        let websitePrefix = websiteName || domain.split('.')[0].toUpperCase();
        let titleHash = title.replace(/[^a-zA-Z0-9]/g, '').substring(0, 3).toUpperCase();
        let uniqueNumber = '';
        let urlMatch = url.match(/\d+/);
        if (urlMatch) uniqueNumber = urlMatch[0].substring(0, 3);
        if (!uniqueNumber || uniqueNumber.length < 3) {
            let combinedString = url + title;
            let hash = 0;
            for (let i = 0; i < combinedString.length; i++) {
                let char = combinedString.charCodeAt(i);
                hash = ((hash << 5) - hash) + char;
                hash = hash & hash;
            }
            uniqueNumber = Math.abs(hash).toString().substring(0, 8);
        }
        sku = `${websitePrefix}_${titleHash}_${uniqueNumber}`;
        if (sku.length > 20) {
            let maxTitleLength = 20 - websitePrefix.length - uniqueNumber.length - 2;
            if (maxTitleLength > 0) {
                titleHash = titleHash.substring(0, maxTitleLength);
                sku = `${websitePrefix}_${titleHash}_${uniqueNumber}`;
            } else {
                sku = `${websitePrefix}_${uniqueNumber}`;
            }
        }
        log && log.info && log.info(`Tự động tạo SKU: ${sku}`);
    }

    // Lấy thumbnail
    let thumbnail = '';
    if (thumbnailClass) {
        let thumbnailElement = $(thumbnailClass).first();
        if (thumbnailElement.length > 0) {
            thumbnail = thumbnailElement.attr('src') || thumbnailElement.attr('data-src') || '';
            if (!thumbnail) {
                let style = thumbnailElement.attr('style') || '';
                let bgMatch = style.match(/background-image:\s*url\(['"]?([^'"]+)['"]?\)/);
                if (bgMatch) thumbnail = bgMatch[1];
            }
            if (thumbnail && !thumbnail.startsWith('http')) {
                thumbnail = new URL(thumbnail, url).href;
            }
        }
    } else {
        let firstImg = $('img').first();
        if (firstImg.length > 0) {
            thumbnail = firstImg.attr('src') || '';
            if (thumbnail && !thumbnail.startsWith('http')) {
                thumbnail = new URL(thumbnail, url).href;
            }
        }
    }

    // Kiểm tra isThumbnail
    if (isThumbnail && !thumbnail) return null;

    // Lấy tất cả ảnh sản phẩm
    let images = [];
    if (imagesClass) {
        $(imagesClass).each(function (i, el) {
            let imgSrc = '';

            // Kiểm tra xem có phải thẻ img không
            if ($(el).is('img')) {
                imgSrc = $(el).attr('src') || $(el).attr('data-src') || '';
            } else {
                // Nếu không phải img, ưu tiên lấy từ background-image
                let style = $(el).attr('style') || '';
                let bgMatch = style.match(/background-image:\s*url\(['"]?([^'"]+)['"]?\)/);
                if (bgMatch) imgSrc = bgMatch[1];
            }

            if (imgSrc && !imgSrc.startsWith('http')) {
                imgSrc = new URL(imgSrc, url).href;
            }
            if (imgSrc && !images.includes(imgSrc)) {
                images.push(imgSrc);
                log && log.info && log.info(`Thêm ảnh: ${imgSrc}`);
            }
        });
    } else {
        $('img').each(function (i, el) {
            let imgSrc = $(el).attr('src') || '';
            if (imgSrc && !images.includes(imgSrc)) images.push(imgSrc);
        });
    }

    // Lấy content (html)
    let content = contentClass ? $(contentClass).first().html() || '' : '';
    if (content) content = formatContent(content, 'unknown');

    return {
        url,
        title,
        description,
        price,
        sku,
        thumbnail,
        images,
        content,
        category: category || '',
        supplier: supplier || '',
        url_supplier: url_supplier || ''
    };
} 