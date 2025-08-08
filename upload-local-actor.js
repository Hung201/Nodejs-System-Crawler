const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const archiver = require('archiver');
const FormData = require('form-data');

async function uploadLocalActor() {
    try {
        console.log('🚀 Uploading local actor...');

        // 1. Login
        console.log('\n1️⃣ Login...');
        const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'hung@gmail.com',
            password: '123456'
        });

        const token = loginResponse.data.data.token;
        const headers = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
        };
        console.log('✅ Login successful');

        // 2. Create zip file from local actor directory
        console.log('\n2️⃣ Creating zip file from local actor...');
        const actorPath = 'D:\\actor-craw-by-class-test';
        const zipPath = path.join(__dirname, 'temp-actor.zip');

        await createZipFromDirectory(actorPath, zipPath);
        console.log('✅ Zip file created:', zipPath);

        // 3. Read actor.json and input_schema.json for metadata
        console.log('\n3️⃣ Reading actor metadata...');
        const actorJsonPath = path.join(actorPath, '.actor', 'actor.json');
        const inputSchemaPath = path.join(actorPath, '.actor', 'input_schema.json');
        const packageJsonPath = path.join(actorPath, 'package.json');

        const actorConfig = JSON.parse(await fs.readFile(actorJsonPath, 'utf8'));
        const inputSchema = JSON.parse(await fs.readFile(inputSchemaPath, 'utf8'));
        const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));

        console.log('✅ Actor metadata loaded:');
        console.log(`   - Name: ${actorConfig.name}`);
        console.log(`   - Version: ${actorConfig.version}`);
        console.log(`   - Description: ${actorConfig.description}`);

        // 4. Upload actor
        console.log('\n4️⃣ Uploading actor...');
        const formData = new FormData();
        formData.append('actorFile', await fs.readFile(zipPath), {
            filename: 'actor.zip',
            contentType: 'application/zip'
        });
        formData.append('name', actorConfig.name || 'Local Actor');
        formData.append('description', actorConfig.description || 'Actor uploaded from local directory');
        formData.append('type', 'web-scraper');
        formData.append('version', actorConfig.version || '1.0.0');
        formData.append('inputSchema', JSON.stringify(inputSchema));

        const uploadResponse = await axios.post('http://localhost:5000/api/actors', formData, {
            headers: {
                ...formData.getHeaders(),
                'Authorization': `Bearer ${token}`
            }
        });

        const actor = uploadResponse.data.data;
        console.log(`✅ Actor uploaded successfully: ${actor.name} (${actor._id})`);

        // 5. Clean up temp file
        await fs.unlink(zipPath);
        console.log('✅ Temporary zip file cleaned up');

        // 6. Test actor by creating a campaign
        console.log('\n5️⃣ Testing actor with campaign...');
        const campaignData = {
            name: 'Test Campaign - Local Actor',
            description: 'Test campaign for uploaded local actor',
            actorId: actor._id,
            input: {
                // Use sample input based on input schema
                startUrls: ['https://example.com'],
                maxRequestsPerCrawl: 5
            },
            config: {
                timeout: 120000,
                maxRetries: 2
            }
        };

        const createResponse = await axios.post('http://localhost:5000/api/campaigns', campaignData, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        const campaign = createResponse.data.data;
        console.log(`✅ Campaign created: ${campaign.name} (${campaign._id})`);

        console.log('\n🎉 Local actor upload completed successfully!');
        console.log('\n📋 Summary:');
        console.log(`   - Actor ID: ${actor._id}`);
        console.log(`   - Actor Name: ${actor.name}`);
        console.log(`   - Campaign ID: ${campaign._id}`);
        console.log(`   - Campaign Name: ${campaign.name}`);

        console.log('\n🚀 Next steps:');
        console.log('   1. Run the campaign: POST /api/campaigns/' + campaign._id + '/run');
        console.log('   2. Check status: GET /api/campaigns/' + campaign._id + '/status');

    } catch (error) {
        console.error('❌ Upload failed:', error.response?.data || error.message);

        // Clean up temp file if it exists
        try {
            const zipPath = path.join(__dirname, 'temp-actor.zip');
            await fs.access(zipPath);
            await fs.unlink(zipPath);
            console.log('✅ Temporary zip file cleaned up');
        } catch (cleanupError) {
            // File doesn't exist, ignore
        }
    }
}

async function createZipFromDirectory(sourceDir, outputPath) {
    return new Promise((resolve, reject) => {
        const output = require('fs').createWriteStream(outputPath);
        const archive = archiver('zip', {
            zlib: { level: 9 } // Sets the compression level
        });

        output.on('close', () => {
            console.log('Archive created successfully');
            resolve();
        });

        archive.on('error', (err) => {
            reject(err);
        });

        archive.pipe(output);

        // Add the entire directory to the zip
        archive.directory(sourceDir, false);

        archive.finalize();
    });
}

uploadLocalActor();
