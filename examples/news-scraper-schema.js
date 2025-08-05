// Input schema cho News Article Scraper
const newsScraperSchema = {
    "title": "News Article Scraper",
    "type": "object",
    "schemaVersion": 1,
    "properties": {
        "url": {
            "title": "News URL",
            "type": "string",
            "description": "URL of the news website or category page",
            "editor": "textfield"
        },
        "articleSelector": {
            "title": "Article Container Selector",
            "type": "string",
            "description": "CSS selector for article containers",
            "editor": "textfield"
        },
        "titleSelector": {
            "title": "Title Selector",
            "type": "string",
            "description": "CSS selector for article titles",
            "editor": "textfield"
        },
        "contentSelector": {
            "title": "Content Selector",
            "type": "string",
            "description": "CSS selector for article content",
            "editor": "textfield"
        },
        "authorSelector": {
            "title": "Author Selector",
            "type": "string",
            "description": "CSS selector for article author",
            "editor": "textfield"
        },
        "dateSelector": {
            "title": "Date Selector",
            "type": "string",
            "description": "CSS selector for publication date",
            "editor": "textfield"
        },
        "categorySelector": {
            "title": "Category Selector",
            "type": "string",
            "description": "CSS selector for article category",
            "editor": "textfield"
        },
        "imageSelector": {
            "title": "Image Selector",
            "type": "string",
            "description": "CSS selector for article images",
            "editor": "textfield"
        },
        "summarySelector": {
            "title": "Summary Selector",
            "type": "string",
            "description": "CSS selector for article summary/excerpt",
            "editor": "textfield"
        },
        "tagsSelector": {
            "title": "Tags Selector",
            "type": "string",
            "description": "CSS selector for article tags",
            "editor": "textfield"
        },
        "includeImages": {
            "title": "Include Images",
            "type": "boolean",
            "description": "Whether to download article images",
            "default": true
        },
        "includeContent": {
            "title": "Include Full Content",
            "type": "boolean",
            "description": "Whether to extract full article content",
            "default": true
        },
        "maxArticles": {
            "title": "Max Articles",
            "type": "integer",
            "description": "Maximum number of articles to scrape",
            "default": 100,
            "minimum": 1,
            "maximum": 1000
        },
        "dateFormat": {
            "title": "Date Format",
            "type": "string",
            "description": "Expected date format (e.g., 'YYYY-MM-DD', 'DD/MM/YYYY')",
            "editor": "textfield"
        },
        "language": {
            "title": "Language",
            "type": "string",
            "description": "Language of the articles",
            "enum": ["en", "vi", "zh", "ja", "ko", "other"],
            "default": "en"
        },
        "paginationPattern": {
            "title": "Pagination Pattern",
            "type": "string",
            "description": "Pattern for pagination URLs",
            "editor": "textfield"
        },
        "maxPages": {
            "title": "Max Pages",
            "type": "integer",
            "description": "Maximum number of pages to crawl",
            "default": 10,
            "minimum": 1,
            "maximum": 100
        },
        "filterKeywords": {
            "title": "Filter Keywords",
            "type": "array",
            "description": "Keywords to filter articles (include only)",
            "items": {
                "type": "string"
            }
        },
        "excludeKeywords": {
            "title": "Exclude Keywords",
            "type": "array",
            "description": "Keywords to exclude articles",
            "items": {
                "type": "string"
            }
        },
        "minContentLength": {
            "title": "Min Content Length",
            "type": "integer",
            "description": "Minimum content length in characters",
            "default": 100
        }
    },
    "required": [
        "url",
        "articleSelector",
        "titleSelector"
    ]
};

// Ví dụ input cho News Scraper
const newsScraperInput = {
    "url": "https://vnexpress.net/tin-tuc",
    "articleSelector": ".item-news",
    "titleSelector": ".title-news a",
    "contentSelector": ".description a",
    "authorSelector": ".author",
    "dateSelector": ".time",
    "categorySelector": ".category",
    "imageSelector": ".thumb-art img",
    "includeImages": true,
    "maxArticles": 50,
    "language": "vi",
    "paginationPattern": "?page=",
    "maxPages": 5
};

module.exports = {
    newsScraperSchema,
    newsScraperInput
}; 