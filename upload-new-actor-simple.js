const axios = require('axios');
const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

async function uploadNewActor() {
    try {
        console.log('🚀 Uploading new actor from D:\\actor-craw-by-class');
        console.log('='.repeat(60));

        // 1. Login
        console.log('\n1️⃣ Login...');
        const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'hung@gmail.com',
            password: '123456'
        });

        const token = loginResponse.data.data.token;
        console.log('✅ Login successful');

        // 2. Tạo zip file từ D:\actor-craw-by-class
        console.log('\n2️⃣ Creating zip file...');
        const sourceDir = 'D:\\actor-craw-by-class';
        const zipPath = path.join(process.cwd(), 'new-actor.zip');

        // Kiểm tra thư mục nguồn
        if (!fs.existsSync(sourceDir)) {
            throw new Error(`Source directory not found: ${sourceDir}`);
        }

        console.log('📁 Source directory found, creating zip...');

        // Tạo zip file
        return new Promise((resolve, reject) => {
            const output = fs.createWriteStream(zipPath);
            const archive = archiver('zip', { zlib: { level: 9 } });

            output.on('close', async () => {
                console.log(`✅ Zip file created: ${zipPath} (${archive.pointer()} bytes)`);

                try {
                    // 3. Upload actor mới
                    console.log('\n3️⃣ Uploading new actor...');
                    const FormData = require('form-data');
                    const formData = new FormData();
                    formData.append('actorFile', fs.createReadStream(zipPath), {
                        filename: 'new-actor.zip',
                        contentType: 'application/zip'
                    });

                    const uploadHeaders = {
                        'Authorization': `Bearer ${token}`,
                        ...formData.getHeaders()
                    };

                    const uploadResponse = await axios.post('http://localhost:5000/api/actors', formData, {
                        headers: uploadHeaders,
                        maxContentLength: Infinity,
                        maxBodyLength: Infinity
                    });

                    console.log('✅ New actor uploaded successfully!');
                    console.log(`📋 Actor ID: ${uploadResponse.data.data._id}`);
                    console.log(`📋 Actor Name: ${uploadResponse.data.data.name}`);

                    // 4. Xóa file zip tạm
                    fs.unlinkSync(zipPath);
                    console.log('✅ Temporary zip file deleted');

                    console.log('\n🎉 Upload completed successfully!');
                    resolve();

                } catch (error) {
                    console.error('❌ Upload error:', error.response?.data || error.message);
                    reject(error);
                }
            });

            archive.on('error', (err) => {
                console.error('❌ Zip creation error:', err);
                reject(err);
            });

            archive.pipe(output);
            archive.directory(sourceDir, false);
            archive.finalize();
        });

    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
    }
}

uploadNewActor();
