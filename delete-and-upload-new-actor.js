const axios = require('axios');
const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

async function deleteAndUploadNewActor() {
    try {
        console.log('🚀 Xóa actor cũ và upload actor mới từ D:\\actor-craw-by-class');
        console.log('='.repeat(70));

        // 1. Login
        console.log('\n1️⃣ Login...');
        const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'hung@gmail.com',
            password: '123456'
        });

        const token = loginResponse.data.data.token;
        const headers = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };
        console.log('✅ Login successful');

        // 2. Lấy danh sách actors hiện tại
        console.log('\n2️⃣ Getting current actors...');
        const actorsResponse = await axios.get('http://localhost:5000/api/actors', { headers });
        const actors = actorsResponse.data.data;
        console.log(`📋 Found ${actors.length} actors`);

        // 3. Xóa tất cả actors hiện tại
        console.log('\n3️⃣ Deleting all current actors...');
        for (const actor of actors) {
            try {
                await axios.delete(`http://localhost:5000/api/actors/${actor._id}`, { headers });
                console.log(`✅ Deleted actor: ${actor.name} (${actor._id})`);
            } catch (error) {
                console.log(`❌ Failed to delete actor ${actor._id}: ${error.response?.data?.error || error.message}`);
            }
        }

        // 4. Lấy danh sách campaigns và xóa
        console.log('\n4️⃣ Getting and deleting campaigns...');
        const campaignsResponse = await axios.get('http://localhost:5000/api/campaigns', { headers });
        const campaigns = campaignsResponse.data.data;
        console.log(`📋 Found ${campaigns.length} campaigns`);

        for (const campaign of campaigns) {
            try {
                if (campaign.status === 'running') {
                    // Cancel running campaign first
                    await axios.post(`http://localhost:5000/api/campaigns/${campaign._id}/cancel`, {}, { headers });
                    console.log(`✅ Cancelled running campaign: ${campaign.name}`);
                }
                await axios.delete(`http://localhost:5000/api/campaigns/${campaign._id}`, { headers });
                console.log(`✅ Deleted campaign: ${campaign.name} (${campaign._id})`);
            } catch (error) {
                console.log(`❌ Failed to delete campaign ${campaign._id}: ${error.response?.data?.error || error.message}`);
            }
        }

        // 5. Tạo zip file từ D:\actor-craw-by-class
        console.log('\n5️⃣ Creating zip file from D:\\actor-craw-by-class...');
        const sourceDir = 'D:\\actor-craw-by-class';
        const zipPath = path.join(process.cwd(), 'new-actor.zip');

        // Kiểm tra thư mục nguồn
        if (!fs.existsSync(sourceDir)) {
            throw new Error(`Source directory not found: ${sourceDir}`);
        }

        // Tạo zip file
        const output = fs.createWriteStream(zipPath);
        const archive = archiver('zip', { zlib: { level: 9 } });

        output.on('close', () => {
            console.log(`✅ Zip file created: ${zipPath} (${archive.pointer()} bytes)`);
        });

        archive.on('error', (err) => {
            throw err;
        });

        archive.pipe(output);
        archive.directory(sourceDir, false);
        await archive.finalize();

        // 6. Upload actor mới
        console.log('\n6️⃣ Uploading new actor...');
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

        // 7. Xóa file zip tạm
        fs.unlinkSync(zipPath);
        console.log('✅ Temporary zip file deleted');

        console.log('\n🎉 Process completed successfully!');
        console.log('📋 You can now create campaigns with the new actor');

    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
    }
}

deleteAndUploadNewActor();
