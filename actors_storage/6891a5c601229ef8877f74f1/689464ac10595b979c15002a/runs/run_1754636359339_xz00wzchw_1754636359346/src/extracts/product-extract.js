import { getBaseUrl } from '../helpers/crawler-helper.js';

export const getImageData = (mediaItem) => {
    return mediaItem.imageUrl;
};

export const getVideoData = (mediaItem) => {
    const video = mediaItem.videoUrl.hd || mediaItem.videoUrl.sd || mediaItem.videoUrl.ld;
    return {
        id: mediaItem.id,
        duration: mediaItem.duration,
        width: mediaItem.width,
        height: mediaItem.height,
        cover: mediaItem.videoCoverUrl,
        url: video.videoUrl
    };
};

export const getProductData = (url, $, detailData) => {
    try {
        // Xử lý nhiều cấu trúc dữ liệu khác nhau
        let product, seo, seller;

        if (detailData.globalData) {
            product = detailData.globalData.product;
            seo = detailData.globalData.seo;
            seller = detailData.globalData.seller;
        } else if (detailData.product) {
            product = detailData.product;
            seo = detailData.seo || {};
            seller = detailData.seller || {};
        } else {
            // Fallback: tìm dữ liệu từ HTML
            product = extractProductFromHTML($);
            seo = {};
            seller = {};
        }

        if (!product) {
            throw new Error('No product data found');
        }

        const title = product.subject || product.name || product.title || '';

        // meta
        const keywords = seo.keyWord ? seo.keyWord.split('\n') : [];
        const categoryNames = seo.breadCrumb?.pathList?.map((item) => item.hrefObject?.name).filter((name) => name !== 'Home') || [];

        // seller
        const destSeller = {
            company: {
                id: seller.companyId || '',
                name: seller.companyName || '',
                type: seller.companyBusinessType || '',
                years: seller.companyJoinYears || '',
                logo: (seller.companyLogoFileUrlSmall || '').replace('_80x80.png', ''),
                logoSmall: seller.companyLogoFileUrlSmall || '',
                employeesCount: seller.employeesCount || '',
                url: seller.companyProfileUrl || '',
                homeUrl: getBaseUrl(seller.homeUrl || ''),
                bgImg: seller.bgImg || '',
                feedbackUrl: seller.feedbackUrl || '',
                subDomain: seller.subDomain || ''
            },
            contact: {
                name: seller.contactName || '',
                jobTitle: seller.jobTitle || '',
                image: (seller.accountPortraitImage && seller.accountPortraitImage['200x200']) || '',
            },
            verified: seller.verifiedManufactruers || false,
            medalIcon: seller.medalIcon || '',
            highlight: seller.showCompanyHighLight || '',
            responseTime: seller.responseTimeText || '',
            ratingReviews: seller.supplierRatingReviews || '',
            leadSupplier: seller.leadSupplier || false,
            authCards: seller.authCards || [],
            businessTypeAuth: seller.isCompanyBusinessTypeAuth || false,
        };

        // media
        const thumbnail = $('link[rel="preload"][as="image"]').attr('href') ||
            $('meta[property="og:image"]').attr('content') ||
            $('img[alt*="product"]').first().attr('src') || '';

        const images = [];
        const videos = [];

        const mediaItems = product.mediaItems || [];
        for (const mediaItem of mediaItems) {
            if (mediaItem.type === 'image') {
                images.push(getImageData(mediaItem));
            }
            else if (mediaItem.type === 'video') {
                videos.push(getVideoData(mediaItem));
            }
        }

        // Nếu không có mediaItems, tìm images từ HTML
        if (images.length === 0) {
            $('img[src*="product"]').each((i, el) => {
                const src = $(el).attr('src');
                if (src && !src.includes('logo') && !src.includes('icon')) {
                    images.push(src);
                }
            });
        }

        // price
        const price = { list: [] };
        const srcPrices = product.price?.productLadderPrices || product.prices || [];
        let priceMin = -1;
        let priceMax = -1;

        for (const srcPrice of srcPrices) {
            const dollarPrice = srcPrice.dollarPrice || srcPrice.price || 0;
            if (priceMin === -1) {
                priceMin = dollarPrice;
            }
            else if (priceMin > dollarPrice) {
                priceMin = dollarPrice;
            }
            if (priceMax === -1) {
                priceMax = dollarPrice;
            }
            else if (priceMax < dollarPrice) {
                priceMax = dollarPrice;
            }
            price.list.push({ dollarPrice });
        }

        price.min = { dollarPrice: priceMin };
        price.max = { dollarPrice: priceMax };

        // basic properties
        const basicProperties = {};
        const srcBasicProperties = product.productBasicProperties || product.basicProperties || [];
        for (const srcBasicProperty of srcBasicProperties) {
            basicProperties[srcBasicProperty.attrName] = {
                name: srcBasicProperty.attrName,
                value: srcBasicProperty.attrValue,
            };
        }

        // industry properties
        const industryProperties = {};
        const srcIndustryProperties = product.productKeyIndustryProperties || product.industryProperties || [];
        for (const srcIndustryProperty of srcIndustryProperties) {
            industryProperties[srcIndustryProperty.attrName] = {
                name: srcIndustryProperty.attrName,
                value: srcIndustryProperty.attrValue,
            };
        }

        // other properties
        const otherProperties = {};
        const srcOtherProperties = product.productOtherProperties || product.otherProperties || [];
        for (const srcOtherProperty of srcOtherProperties) {
            otherProperties[srcOtherProperty.attrName] = {
                name: srcOtherProperty.attrName,
                value: srcOtherProperty.attrValue
            };
        }

        // sku
        const srcSku = product.sku || {};

        const sku = {
            firstSkuId: srcSku.firstSkuId,
            attributes: {},
            skuInfoMap: srcSku.skuInfoMap,
        };

        for (const skuAttr of srcSku.skuAttrs || []) {
            sku.attributes[skuAttr.id] = {
                id: skuAttr.id,
                name: skuAttr.name,
                type: skuAttr.type,
                values: skuAttr.values
            };
        }

        return {
            id: product.productId || product.id || '',
            categoryId: product.productCategoryId || product.categoryId || '',
            url,
            title,
            thumbnail,
            videos,
            images,
            price,
            basicProperties,
            industryProperties,
            otherProperties,
            sku,
            categoryNames,
            keywords,
            seller: destSeller,
        };
    } catch (error) {
        console.error('Error extracting product data:', error);
        // Return basic data if extraction fails
        return {
            id: '',
            categoryId: '',
            url,
            title: $('title').text() || $('h1').text() || '',
            thumbnail: $('meta[property="og:image"]').attr('content') || '',
            videos: [],
            images: [],
            price: { list: [], min: { dollarPrice: 0 }, max: { dollarPrice: 0 } },
            basicProperties: {},
            industryProperties: {},
            otherProperties: {},
            sku: { firstSkuId: '', attributes: {}, skuInfoMap: {} },
            categoryNames: [],
            keywords: [],
            seller: {
                company: { id: '', name: '', type: '', years: '', logo: '', logoSmall: '', employeesCount: '', url: '', homeUrl: '', bgImg: '', feedbackUrl: '', subDomain: '' },
                contact: { name: '', jobTitle: '', image: '' },
                verified: false,
                medalIcon: '',
                highlight: '',
                responseTime: '',
                ratingReviews: '',
                leadSupplier: false,
                authCards: [],
                businessTypeAuth: false,
            },
        };
    }
};

// Helper function to extract product data from HTML when JSON data is not available
const extractProductFromHTML = ($) => {
    const product = {};

    // Extract title
    product.title = $('title').text() || $('h1').text() || '';

    // Extract images
    const images = [];
    $('img[src*="product"]').each((i, el) => {
        const src = $(el).attr('src');
        if (src && !src.includes('logo') && !src.includes('icon')) {
            images.push(src);
        }
    });
    product.images = images;

    // Extract price from meta tags or text
    const priceText = $('meta[property="product:price:amount"]').attr('content') ||
        $('.price').text() ||
        $('[class*="price"]').text();

    if (priceText) {
        const priceMatch = priceText.match(/[\d.,]+/);
        if (priceMatch) {
            product.price = parseFloat(priceMatch[0].replace(/[,]/g, ''));
        }
    }

    return product;
};