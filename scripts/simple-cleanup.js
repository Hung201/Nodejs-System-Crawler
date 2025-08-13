const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

async function simpleCleanup() {
    try {
        console.log('🧹 Simple cleanup - killing node processes that might be actors...');

        if (process.platform === 'win32') {
            // Windows: Kill tất cả node processes trừ server chính
            const { stdout } = await execAsync('tasklist /FI "IMAGENAME eq node.exe" /FO CSV');
            const lines = stdout.split('\n').slice(1);

            let killedCount = 0;
            for (const line of lines) {
                if (line.trim()) {
                    const parts = line.split(',');
                    const pid = parts[1]?.replace(/"/g, '');
                    if (pid && pid !== process.pid.toString()) {
                        try {
                            await execAsync(`taskkill /F /PID ${pid}`);
                            console.log(`  ✅ Killed process PID: ${pid}`);
                            killedCount++;
                        } catch (error) {
                            // Process có thể đã tự kết thúc
                        }
                    }
                }
            }
            console.log(`\n✅ Killed ${killedCount} node processes (excluding main server)`);
            console.log('⚠️  Note: This may have killed your frontend too. Please restart it if needed.');

        } else {
            // Linux/Mac
            await execAsync('pkill -f "node.*main.js"');
            console.log('✅ Killed node main.js processes');
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

// Chạy cleanup
simpleCleanup();
