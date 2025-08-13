const path = require('path');
const fs = require('fs').promises;
const { spawn } = require('child_process');

async function testActorSetup() {
    try {
        console.log('🧪 Testing actor setup...');

        // Test 1: Kiểm tra actor path
        const actorId = '689464ac10595b979c15002a';
        const userId = '6891a5c601229ef8877f74f1';
        const actorPath = path.join(process.cwd(), 'actors_storage', userId, actorId);

        console.log(`📁 Actor path: ${actorPath}`);

        try {
            await fs.access(actorPath);
            console.log('✅ Actor directory exists');
        } catch (error) {
            console.log(`❌ Actor directory not found: ${error.message}`);
            return;
        }

        // Test 2: Kiểm tra thư mục src
        const srcPath = path.join(actorPath, 'src');
        console.log(`📁 Src path: ${srcPath}`);

        try {
            await fs.access(srcPath);
            console.log('✅ Src directory exists');
        } catch (error) {
            console.log(`❌ Src directory not found: ${error.message}`);
            return;
        }

        // Test 3: Kiểm tra file main.js
        const mainJsPath = path.join(srcPath, 'main.js');
        console.log(`📄 Main.js path: ${mainJsPath}`);

        try {
            await fs.access(mainJsPath);
            console.log('✅ main.js exists');
        } catch (error) {
            console.log(`❌ main.js not found: ${error.message}`);
            return;
        }

        // Test 4: Tạo thư mục apify_storage
        console.log('📁 Creating apify_storage directories...');
        const apifyStoragePath = path.join(actorPath, 'apify_storage');
        const keyValueStorePath = path.join(apifyStoragePath, 'key_value_stores', 'default');
        const datasetPath = path.join(apifyStoragePath, 'datasets', 'default');

        try {
            await fs.mkdir(keyValueStorePath, { recursive: true });
            await fs.mkdir(datasetPath, { recursive: true });
            console.log('✅ Apify storage directories created');
        } catch (error) {
            console.log(`❌ Error creating apify storage: ${error.message}`);
            return;
        }

        // Test 5: Tạo input file
        const testInput = {
            url: "https://b2b.daisan.vn/products/gach-op-tuong",
            pageStart: 1,
            pageEnd: 1
        };

        const inputPath = path.join(srcPath, 'input.json');
        console.log(`📄 Creating input file: ${inputPath}`);

        try {
            await fs.writeFile(inputPath, JSON.stringify(testInput, null, 2));
            console.log('✅ Input file created');
        } catch (error) {
            console.log(`❌ Error creating input file: ${error.message}`);
            return;
        }

        // Test 6: Kiểm tra package.json và cài đặt dependencies
        const packageJsonPath = path.join(actorPath, 'package.json');
        console.log(`📄 Checking package.json: ${packageJsonPath}`);

        try {
            await fs.access(packageJsonPath);
            console.log('✅ package.json exists, installing dependencies...');

            await new Promise((resolve, reject) => {
                const npmPath = process.platform === 'win32' ? 'npm.cmd' : 'npm';
                const install = spawn(npmPath, ['install'], {
                    cwd: actorPath,
                    stdio: ['pipe', 'pipe', 'pipe'],
                    shell: true
                });

                install.on('close', (code) => {
                    if (code === 0) {
                        console.log('✅ Dependencies installed successfully');
                        resolve();
                    } else {
                        console.log(`❌ Failed to install dependencies: ${code}`);
                        reject(new Error(`npm install failed with code ${code}`));
                    }
                });

                install.on('error', (error) => {
                    console.log(`❌ Error running npm install: ${error.message}`);
                    reject(error);
                });
            });
        } catch (error) {
            console.log('⚠️ No package.json found or npm install failed, continuing...');
        }

        // Test 7: Thử spawn actor process
        console.log('🚀 Testing actor process spawn...');

        const child = spawn('node', ['main.js'], {
            cwd: srcPath,
            stdio: ['pipe', 'pipe', 'pipe'],
            env: { ...process.env, NODE_ENV: 'production' }
        });

        console.log(`🔄 Actor process spawned with PID: ${child.pid}`);

        // Kiểm tra process có tồn tại không
        try {
            process.kill(child.pid, 0);
            console.log('✅ Actor process is alive');
        } catch (error) {
            console.log(`❌ Actor process is not responding: ${error.message}`);
        }

        // Đợi 30 giây để xem có output gì không
        console.log('⏳ Waiting 30 seconds for actor output...');

        child.stdout.on('data', (data) => {
            console.log(`📤 Actor stdout: ${data.toString().trim()}`);
        });

        child.stderr.on('data', (data) => {
            console.log(`📤 Actor stderr: ${data.toString().trim()}`);
        });

        child.on('close', (code) => {
            console.log(`🏁 Actor process closed with code: ${code}`);
        });

        child.on('error', (error) => {
            console.log(`❌ Actor process error: ${error.message}`);
        });

        // Kill process sau 30 giây để có thời gian cào dữ liệu
        setTimeout(() => {
            console.log('⏰ Killing actor process after 30 seconds...');
            try {
                child.kill();
                console.log('✅ Actor process killed');
            } catch (error) {
                console.log(`❌ Error killing actor process: ${error.message}`);
            }
        }, 30000);

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error(error.stack);
    }
}

// Chạy test
testActorSetup();
