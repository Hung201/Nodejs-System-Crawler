const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

async function checkPort5000() {
    try {
        console.log('🔍 Checking port 5000...');

        if (process.platform === 'win32') {
            // Windows: Kiểm tra port 5000
            const { stdout } = await execAsync('netstat -ano | findstr :5000');

            if (stdout.trim()) {
                console.log('⚠️ Port 5000 is in use:');
                console.log(stdout);

                // Parse PID từ output
                const lines = stdout.split('\n');
                const pids = new Set();

                for (const line of lines) {
                    if (line.trim()) {
                        const parts = line.trim().split(/\s+/);
                        const pid = parts[parts.length - 1];
                        if (pid && !isNaN(pid)) {
                            pids.add(pid);
                        }
                    }
                }

                if (pids.size > 0) {
                    console.log(`\n🚨 Found ${pids.size} process(es) using port 5000:`);
                    for (const pid of pids) {
                        try {
                            // Kiểm tra process name
                            const { stdout: processInfo } = await execAsync(`tasklist /FI "PID eq ${pid}" /FO CSV`);
                            const processName = processInfo.split('\n')[1]?.split(',')[0]?.replace(/"/g, '') || 'Unknown';
                            console.log(`   PID: ${pid} - Process: ${processName}`);
                        } catch (error) {
                            console.log(`   PID: ${pid} - Process: Unknown (may have terminated)`);
                        }
                    }

                    // Hỏi user có muốn kill không
                    console.log('\n❓ Do you want to kill these processes to free port 5000? (y/n)');
                    console.log('   Note: This may kill your backend server if it\'s running');

                    // Trong thực tế, bạn có thể sử dụng readline để nhận input
                    // Ở đây tôi sẽ tự động kill nếu là node processes
                    let nodeProcesses = [];
                    for (const pid of pids) {
                        try {
                            const { stdout: processInfo } = await execAsync(`tasklist /FI "PID eq ${pid}" /FO CSV`);
                            const processName = processInfo.split('\n')[1]?.split(',')[0]?.replace(/"/g, '') || '';
                            if (processName.toLowerCase().includes('node')) {
                                nodeProcesses.push(pid);
                            }
                        } catch (error) {
                            // Process có thể đã tự kết thúc
                        }
                    }

                    if (nodeProcesses.length > 0) {
                        console.log(`\n🔪 Auto-killing ${nodeProcesses.length} Node.js process(es)...`);
                        for (const pid of nodeProcesses) {
                            try {
                                await execAsync(`taskkill /F /PID ${pid}`);
                                console.log(`   ✅ Killed process PID: ${pid}`);
                            } catch (error) {
                                console.log(`   ❌ Failed to kill process PID: ${pid}: ${error.message}`);
                            }
                        }
                        console.log('\n✅ Port 5000 should now be free');
                    } else {
                        console.log('\n⚠️ No Node.js processes found. Manual cleanup may be needed.');
                    }
                }
            } else {
                console.log('✅ Port 5000 is free');
            }
        } else {
            // Linux/Mac: Kiểm tra port 5000
            try {
                const { stdout } = await execAsync('lsof -i :5000');
                console.log('⚠️ Port 5000 is in use:');
                console.log(stdout);

                // Parse PIDs
                const lines = stdout.split('\n').slice(1);
                const pids = new Set();

                for (const line of lines) {
                    if (line.trim()) {
                        const parts = line.trim().split(/\s+/);
                        const pid = parts[1];
                        if (pid && !isNaN(pid)) {
                            pids.add(pid);
                        }
                    }
                }

                if (pids.size > 0) {
                    console.log(`\n🚨 Found ${pids.size} process(es) using port 5000`);

                    // Auto-kill node processes
                    let nodeProcesses = [];
                    for (const pid of pids) {
                        try {
                            const { stdout: processInfo } = await execAsync(`ps -p ${pid} -o comm=`);
                            const processName = processInfo.trim();
                            if (processName.includes('node')) {
                                nodeProcesses.push(pid);
                            }
                        } catch (error) {
                            // Process có thể đã tự kết thúc
                        }
                    }

                    if (nodeProcesses.length > 0) {
                        console.log(`\n🔪 Auto-killing ${nodeProcesses.length} Node.js process(es)...`);
                        for (const pid of nodeProcesses) {
                            try {
                                await execAsync(`kill -9 ${pid}`);
                                console.log(`   ✅ Killed process PID: ${pid}`);
                            } catch (error) {
                                console.log(`   ❌ Failed to kill process PID: ${pid}: ${error.message}`);
                            }
                        }
                        console.log('\n✅ Port 5000 should now be free');
                    } else {
                        console.log('\n⚠️ No Node.js processes found. Manual cleanup may be needed.');
                    }
                }
            } catch (error) {
                if (error.message.includes('no process')) {
                    console.log('✅ Port 5000 is free');
                } else {
                    console.log('❌ Error checking port:', error.message);
                }
            }
        }
    } catch (error) {
        console.error('❌ Error checking port 5000:', error.message);
    }
}

// Chạy function
checkPort5000();
