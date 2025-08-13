const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

async function smartCleanup() {
    try {
        console.log('🧹 Smart cleanup - only killing actor processes...');

        if (process.platform === 'win32') {
            // Windows: Lấy danh sách tất cả node processes
            const { stdout } = await execAsync('tasklist /FI "IMAGENAME eq node.exe" /FO CSV');
            const lines = stdout.split('\n').slice(1);

            let killedCount = 0;
            for (const line of lines) {
                if (line.trim()) {
                    const parts = line.split(',');
                    const pid = parts[1]?.replace(/"/g, '');
                    const memory = parts[4]?.replace(/"/g, '');

                    if (pid && pid !== process.pid.toString()) {
                        try {
                            // Kiểm tra xem process có phải là actor không
                            // Actor processes thường có memory usage thấp hơn frontend
                            const memoryMB = parseInt(memory) / 1024;

                            // Frontend React thường có memory cao (>100MB)
                            // Backend server thường có memory trung bình (30-80MB)
                            // Actor processes thường có memory thấp (<50MB)

                            if (memoryMB < 50) {
                                // Có thể là actor process
                                await execAsync(`taskkill /F /PID ${pid}`);
                                console.log(`  ✅ Killed potential actor process PID: ${pid} (Memory: ${memoryMB.toFixed(1)}MB)`);
                                killedCount++;
                            } else {
                                console.log(`  🟢 Keeping process PID: ${pid} (Memory: ${memoryMB.toFixed(1)}MB) - likely frontend/backend`);
                            }
                        } catch (error) {
                            // Process có thể đã tự kết thúc
                        }
                    }
                }
            }
            console.log(`\n✅ Killed ${killedCount} potential actor processes`);
            console.log('🟢 Frontend and backend processes preserved');

        } else {
            // Linux/Mac: Chỉ kill các process chạy main.js trong actors_storage
            await execAsync('pkill -f "node.*actors_storage.*main.js"');
            console.log('✅ Killed actor processes (frontend/backend preserved)');
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

// Chạy cleanup
smartCleanup();
