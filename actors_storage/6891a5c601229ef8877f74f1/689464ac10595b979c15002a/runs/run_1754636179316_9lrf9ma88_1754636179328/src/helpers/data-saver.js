import fs from 'fs';
import path from 'path';

let scrapedData = [];

export const addScrapedData = (data) => {
    scrapedData.push(data);
    console.log(`🎯 Added product to scrapedData. Total: ${scrapedData.length}`);
};

export const saveDataToFile = (filename = 'hung.json') => {
    try {
        const filePath = path.join(process.cwd(), '..', filename);
        console.log(`🚀 Attempting to save ${scrapedData.length} products to: ${filePath}`);
        fs.writeFileSync(filePath, JSON.stringify(scrapedData, null, 2), 'utf8');
        console.log(`✅ Successfully saved ${scrapedData.length} products to ${filename}`);
    } catch (error) {
        console.error('❌ Error saving file:', error);
    }
};

export const getScrapedDataCount = () => {
    return scrapedData.length;
}; 