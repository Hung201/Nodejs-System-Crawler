import { detectWebsiteType, WEBSITE_TYPES } from '../helpers/website-detector.js';
import { router as unknownRouter, config as unknownConfig } from './unknown-routes.js';


export const getWebsiteTypeFromInput = (input) => {
        if (input.startUrls && Array.isArray(input.startUrls)) {
                return WEBSITE_TYPES.UNKNOWN;
        }
        return detectWebsiteType(input.shopUrl);
};

export const getRouterByWebsiteType = (websiteType) => {
        switch (websiteType) {
                case WEBSITE_TYPES.UNKNOWN:
                        return unknownRouter;
                default:
                        throw new Error(`Unsupported website type: ${websiteType}`);
        }
};

export const getConfigByWebsiteType = (websiteType) => {
        switch (websiteType) {
                case WEBSITE_TYPES.UNKNOWN:
                        return unknownConfig;
                default:
                        throw new Error(`Unsupported website type: ${websiteType}`);
        }
}; 