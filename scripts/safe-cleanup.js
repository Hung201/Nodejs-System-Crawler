const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

async function safeCleanup() {
    try {
        console.log('🧹 Safe cleanup - only killing confirmed actor processes...');

        if (process.platform === 'win32') {
            // Windows: Chỉ kill các process có command line chứa "actors_storage" hoặc "main.js"
            const { stdout } = await execAsync('tasklist /FI "IMAGENAME eq node.exe" /FO CSV');
            const lines = stdout.split('\n').slice(1);

            let killedCount = 0;
            for (const line of lines) {
                if (line.trim()) {
                    const parts = line.split(',');
                    const pid = parts[1]?.replace(/"/g, '');

                    if (pid && pid !== process.pid.toString()) {
                        try {
                            // Kiểm tra command line của process
                            const { stdout: wmicOutput } = await execAsync(`wmic process where "ProcessId=${pid}" get CommandLine /format:list`);
                            const commandLine = wmicOutput.split('CommandLine=')[1]?.split('\n')[0] || '';

                            // Chỉ kill nếu là actor process thực sự
                            if (commandLine.includes('actors_storage') ||
                                commandLine.includes('main.js') ||
                                commandLine.includes('node main.js')) {
                                await execAsync(`taskkill /F /PID ${pid}`);
                                console.log(`  ✅ Killed confirmed actor process PID: ${pid}`);
                                console.log(`     Command: ${commandLine.substring(0, 100)}...`);
                                killedCount++;
                            } else {
                                console.log(`  🟢 Keeping process PID: ${pid} - not an actor`);
                            }
                        } catch (error) {
                            // Process có thể đã tự kết thúc hoặc không có quyền truy cập
                        }
                    }
                }
            }
            console.log(`\n✅ Killed ${killedCount} confirmed actor processes`);
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
safeCleanup();
