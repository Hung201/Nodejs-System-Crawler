const axios = require('axios');
const fs = require('fs');
const path = require('path');

async function uploadActorManual() {
    try {
        console.log('🚀 Uploading actor from D:\\actor-craw-by-class (Manual method)');
        console.log('='.repeat(70));

        // 1. Login
        console.log('\n1️⃣ Login...');
        const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'hung@gmail.com',
            password: '123456'
        });

        const token = loginResponse.data.data.token;
        console.log('✅ Login successful');

        // 2. Tạo actor mới trong database
        console.log('\n2️⃣ Creating new actor in database...');
        const actorData = {
            name: 'Actor Craw by Class (New)',
            description: 'Actor crawl sản phẩm từ website với input schema tùy chỉnh',
            type: 'web-scraper',
            inputSchema: {
                type: 'object',
                properties: {
                    url: { type: 'string', description: 'URL trang sản phẩm' },
                    paginationPattern: { type: 'string', description: 'Pattern phân trang' },
                    pageStart: { type: 'number', description: 'Trang bắt đầu' },
                    pageEnd: { type: 'number', description: 'Trang kết thúc' },
                    productLinkSelector: { type: 'string', description: 'CSS selector cho link sản phẩm' },
                    titleClass: { type: 'string', description: 'CSS class cho tiêu đề' },
                    priceClass: { type: 'string', description: 'CSS class cho giá' },
                    imagesClass: { type: 'string', description: 'CSS class cho hình ảnh' }
                },
                required: ['url']
            }
        };

        const createResponse = await axios.post('http://localhost:5000/api/actors', actorData, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        const actorId = createResponse.data.data._id;
        const userId = createResponse.data.data.userId;
        console.log(`✅ Actor created: ${actorId}`);

        // 3. Copy thư mục actor
        console.log('\n3️⃣ Copying actor files...');
        const sourceDir = 'D:\\actor-craw-by-class';
        const targetDir = path.join(process.cwd(), 'actors_storage', userId.toString(), actorId.toString());

        // Tạo thư mục đích
        if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
        }

        // Copy files (loại trừ node_modules và .git)
        const copyRecursive = (src, dest) => {
            const items = fs.readdirSync(src);
            for (const item of items) {
                if (item === 'node_modules' || item === '.git') continue;

                const srcPath = path.join(src, item);
                const destPath = path.join(dest, item);

                const stat = fs.statSync(srcPath);
                if (stat.isDirectory()) {
                    if (!fs.existsSync(destPath)) {
                        fs.mkdirSync(destPath, { recursive: true });
                    }
                    copyRecursive(srcPath, destPath);
                } else {
                    fs.copyFileSync(srcPath, destPath);
                }
            }
        };

        copyRecursive(sourceDir, targetDir);
        console.log(`✅ Files copied to: ${targetDir}`);

        // 4. Cập nhật path trong database
        console.log('\n4️⃣ Updating actor path in database...');
        const updateResponse = await axios.put(`http://localhost:5000/api/actors/${actorId}`, {
            path: targetDir
        }, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('✅ Actor path updated');

        // 5. Kiểm tra file hung.json
        const hungJsonPath = path.join(targetDir, 'hung.json');
        if (fs.existsSync(hungJsonPath)) {
            const stats = fs.statSync(hungJsonPath);
            console.log(`📋 Found hung.json: ${(stats.size / 1024).toFixed(2)} KB`);
        }

        console.log('\n🎉 Actor uploaded successfully!');
        console.log(`📋 Actor ID: ${actorId}`);
        console.log(`📋 Actor Name: ${createResponse.data.data.name}`);
        console.log(`📋 Path: ${targetDir}`);

    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
    }
}

uploadActorManual();
