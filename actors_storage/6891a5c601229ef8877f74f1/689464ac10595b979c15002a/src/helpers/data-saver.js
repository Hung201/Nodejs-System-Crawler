import fs from 'fs';
import path from 'path';

let scrapedData = [];

export const addScrapedData = (data) => {
    scrapedData.push(data);
};

export const saveDataToFile = (filename = 'hung.json') => {
    try {
        const filePath = path.join(process.cwd(), filename);
        fs.writeFileSync(filePath, JSON.stringify(scrapedData, null, 2), 'utf8');
        console.log(`Đã lưu ${scrapedData.length} sản phẩm vào file ${filename}`);
    } catch (error) {
        console.error('Lỗi khi lưu file:', error);
    }
};

export const getScrapedDataCount = () => {
    return scrapedData.length;
}; 