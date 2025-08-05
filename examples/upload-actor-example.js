// Ví dụ test upload actor với input schema
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

const API_BASE_URL = 'http://localhost:5000/api';

// Input schema cho Multi-Website Product Crawler
const inputSchema = {
    "title": "Multi-Website Product Crawler",
    "type": "object",
    "schemaVersion": 1,
    "properties": {
        "url": {
            "title": "URL",
            "type": "string",
            "description": "Category or product page URL to start crawling",
            "editor": "textfield"
        },
        "paginationPattern": {
            "title": "Pagination Pattern",
            "type": "string",
            "description": "Pattern for pagination URLs (e.g., '?page=', '/page/', '&page=')",
            "editor": "textfield"
        },
        "maxPages": {
            "title": "Max Pages",
            "type": "integer",
            "description": "Maximum number of pages to crawl",
            "default": 10
        },
        "productLinkSelector": {
            "title": "Product Link Selector",
            "type": "string",
            "description": "CSS selector for product links",
            "editor": "textfield"
        },
        "productLinkPattern": {
            "title": "Product Link Pattern",
            "type": "string",
            "description": "URL pattern to identify product links",
            "editor": "textfield"
        },
        "titleClass": {
            "title": "Title Selector",
            "type": "string",
            "description": "CSS selector for product title",
            "editor": "textfield"
        },
        "descriptionClass": {
            "title": "Description Selector",
            "type": "string",
            "description": "CSS selector for product description",
            "editor": "textfield"
        },
        "priceClass": {
            "title": "Price Selector",
            "type": "string",
            "description": "CSS selector for product price",
            "editor": "textfield"
        },
        "skuClass": {
            "title": "SKU Selector",
            "type": "string",
            "description": "CSS selector for product SKU",
            "editor": "textfield"
        },
        "contentClass": {
            "title": "Content Selector",
            "type": "string",
            "description": "CSS selector for product content",
            "editor": "textfield"
        },
        "thumbnailClass": {
            "title": "Thumbnail Selector",
            "type": "string",
            "description": "CSS selector for product thumbnail",
            "editor": "textfield"
        },
        "imagesClass": {
            "title": "Images Selector",
            "type": "string",
            "description": "CSS selector for product images",
            "editor": "textfield"
        },
        "includePatterns": {
            "title": "Include Patterns",
            "type": "array",
            "description": "URL patterns to include images",
            "editor": "json",
            "items": {
                "type": "string"
            }
        },
        "excludePatterns": {
            "title": "Exclude Patterns",
            "type": "array",
            "description": "URL patterns to exclude images",
            "editor": "json",
            "items": {
                "type": "string"
            }
        },
        "skuInImage": {
            "title": "SKU in Image",
            "type": "boolean",
            "description": "Only include images containing SKU"
        },
        "autoGenerateSku": {
            "title": "Auto Generate SKU",
            "type": "boolean",
            "description": "Automatically generate SKU if not found"
        },
        "websiteName": {
            "title": "Website Name",
            "type": "string",
            "description": "Website name for SKU generation",
            "editor": "textfield"
        },
        "isPrice": {
            "title": "Price Required",
            "type": "boolean",
            "description": "Skip products without price"
        },
        "supplier": {
            "title": "Supplier",
            "type": "string",
            "description": "Supplier name for products",
            "editor": "textfield"
        },
        "url_supplier": {
            "title": "Supplier URL",
            "type": "string",
            "description": "Supplier website URL",
            "editor": "textfield"
        },
        "maxRequestsPerCrawl": {
            "title": "Max Requests per Crawl",
            "type": "integer",
            "description": "Maximum number of requests that can be made by this crawler.",
            "default": 50000
        }
    },
    "required": [
        "url"
    ]
};

async function uploadActor(token) {
    try {
        const formData = new FormData();
        
        // Thêm các field cơ bản
        formData.append('name', 'Multi-Website Product Crawler');
        formData.append('description', 'Advanced product crawler for multiple e-commerce websites with flexible selectors and image handling');
        formData.append('type', 'product-scraper');
        formData.append('status', 'active');
        formData.append('version', '1.0.0');
        formData.append('tags', JSON.stringify(['product', 'e-commerce', 'multi-site', 'images']));
        
        // Thêm input schema
        formData.append('inputSchema', JSON.stringify(inputSchema));
        
        // Thêm config
        const config = {
            maxConcurrency: 5,
            timeout: 60000,
            retryAttempts: 3,
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        };
        formData.append('config', JSON.stringify(config));
        
        // Thêm Apify metadata
        const apifyMetadata = {
            actorId: 'multi-website-product-crawler',
            version: '1.0.0',
            buildTag: 'latest',
            buildNumber: 1,
            sourceCodeUrl: 'https://github.com/your-username/multi-website-product-crawler'
        };
        formData.append('apifyMetadata', JSON.stringify(apifyMetadata));
        
        // Thêm file (nếu có)
        // formData.append('actorFile', fs.createReadStream('./path/to/your/actor.zip'));
        
        const response = await axios.post(`${API_BASE_URL}/actors`, formData, {
            headers: {
                'Authorization': `Bearer ${token}`,
                ...formData.getHeaders()
            }
        });
        
        console.log('✅ Actor uploaded successfully!');
        console.log('Response:', JSON.stringify(response.data, null, 2));
        
        return response.data.data;
        
    } catch (error) {
        console.error('❌ Error uploading actor:');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error('Error:', error.message);
        }
        throw error;
    }
}

// Test function
async function testUploadActor() {
    try {
        // Đăng nhập để lấy token
        const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
            email: 'test@example.com',
            password: 'password123'
        });
        
        const token = loginResponse.data.data.token;
        console.log('🔑 Login successful, token received');
        
        // Upload actor
        const actor = await uploadActor(token);
        console.log('🎯 Actor ID:', actor._id);
        
    } catch (error) {
        console.error('Test failed:', error.message);
    }
}

// Export functions
module.exports = {
    uploadActor,
    testUploadActor,
    inputSchema
};

// Run test if this file is executed directly
if (require.main === module) {
    testUploadActor();
} 