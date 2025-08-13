const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

async function fixCampaignIssues() {
    console.log('🔧 Campaign Issues Auto-Fix Tool');
    console.log('================================\n');

    try {
        // Bước 1: Kiểm tra port 5000
        console.log('1️⃣ Checking port 5000...');
        let portInUse = false;
        
        if (process.platform === 'win32') {
            try {
                const { stdout } = await execAsync('netstat -ano | findstr :5000');
                if (stdout.trim()) {
                    portInUse = true;
                    console.log('⚠️ Port 5000 is in use');
                    
                    // Parse và kill Node.js processes
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
                        console.log(`🔪 Killing ${pids.size} process(es) using port 5000...`);
                        for (const pid of pids) {
                            try {
                                const { stdout: processInfo } = await execAsync(`tasklist /FI "PID eq ${pid}" /FO CSV`);
                                const processName = processInfo.split('\n')[1]?.split(',')[0]?.replace(/"/g, '') || '';
                                if (processName.toLowerCase().includes('node')) {
                                    await execAsync(`taskkill /F /PID ${pid}`);
                                    console.log(`   ✅ Killed Node.js process PID: ${pid}`);
                                } else {
                                    console.log(`   ⚠️ Skipped non-Node.js process PID: ${pid} (${processName})`);
                                }
                            } catch (error) {
                                console.log(`   ❌ Failed to kill process PID: ${pid}: ${error.message}`);
                            }
                        }
                    }
                } else {
                    console.log('✅ Port 5000 is free');
                }
            } catch (error) {
                console.log('✅ Port 5000 is free (no processes found)');
            }
        } else {
            // Linux/Mac
            try {
                const { stdout } = await execAsync('lsof -i :5000');
                portInUse = true;
                console.log('⚠️ Port 5000 is in use');
                
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
                    console.log(`🔪 Killing ${pids.size} process(es) using port 5000...`);
                    for (const pid of pids) {
                        try {
                            const { stdout: processInfo } = await execAsync(`ps -p ${pid} -o comm=`);
                            const processName = processInfo.trim();
                            if (processName.includes('node')) {
                                await execAsync(`kill -9 ${pid}`);
                                console.log(`   ✅ Killed Node.js process PID: ${pid}`);
                            } else {
                                console.log(`   ⚠️ Skipped non-Node.js process PID: ${pid} (${processName})`);
                            }
                        } catch (error) {
                            console.log(`   ❌ Failed to kill process PID: ${pid}: ${error.message}`);
                        }
                    }
                }
            } catch (error) {
                console.log('✅ Port 5000 is free');
            }
        }

        // Bước 2: Cleanup actor processes
        console.log('\n2️⃣ Cleaning up actor processes...');
        try {
            if (process.platform === 'win32') {
                const { stdout } = await execAsync('tasklist /FI "IMAGENAME eq node.exe" /FO CSV');
                const lines = stdout.split('\n').slice(1);
                let cleanedCount = 0;
                
                for (const line of lines) {
                    if (line.trim()) {
                        const parts = line.split(',');
                        const pid = parts[1]?.replace(/"/g, '');
                        
                        if (pid && pid !== process.pid.toString()) {
                            try {
                                const { stdout: wmicOutput } = await execAsync(`wmic process where "ProcessId=${pid}" get CommandLine /format:list`);
                                const commandLine = wmicOutput.split('CommandLine=')[1]?.split('\n')[0] || '';
                                
                                if (commandLine.includes('actors_storage') ||
                                    commandLine.includes('main.js') ||
                                    commandLine.includes('node main.js')) {
                                    await execAsync(`taskkill /F /PID ${pid}`);
                                    console.log(`   ✅ Cleaned up actor process PID: ${pid}`);
                                    cleanedCount++;
                                }
                            } catch (error) {
                                // Process có thể đã tự kết thúc
                            }
                        }
                    }
                }
                console.log(`🧹 Cleaned up ${cleanedCount} actor processes`);
            } else {
                await execAsync('pkill -f "node.*actors_storage.*main.js"');
                console.log('🧹 Cleaned up actor processes');
            }
        } catch (error) {
            console.log(`⚠️ Cleanup warning: ${error.message}`);
        }

        // Bước 3: Kiểm tra và tạo thư mục cần thiết
        console.log('\n3️⃣ Checking required directories...');
        const fs = require('fs').promises;
        const path = require('path');
        
        const requiredDirs = [
            'logs',
            'uploads',
            'actors_storage'
        ];
        
        for (const dir of requiredDirs) {
            try {
                await fs.access(dir);
                console.log(`   ✅ ${dir}/ exists`);
            } catch (error) {
                try {
                    await fs.mkdir(dir, { recursive: true });
                    console.log(`   ✅ Created ${dir}/ directory`);
                } catch (mkdirError) {
                    console.log(`   ❌ Failed to create ${dir}/: ${mkdirError.message}`);
                }
            }
        }

        // Bước 4: Kiểm tra logs
        console.log('\n4️⃣ Checking recent logs...');
        try {
            const errorLogPath = path.join('logs', 'error.log');
            const combinedLogPath = path.join('logs', 'combined.log');
            
            try {
                const errorStats = await fs.stat(errorLogPath);
                const combinedStats = await fs.stat(combinedLogPath);
                
                console.log(`   📄 error.log: ${errorStats.size} bytes`);
                console.log(`   📄 combined.log: ${combinedStats.size} bytes`);
                
                // Đọc 5 dòng cuối của error.log
                const { execSync } = require('child_process');
                try {
                    const lastErrors = execSync(`Get-Content "${errorLogPath}" -Tail 5`, { encoding: 'utf8' });
                    if (lastErrors.trim()) {
                        console.log('   ⚠️ Recent errors:');
                        console.log(lastErrors);
                    } else {
                        console.log('   ✅ No recent errors');
                    }
                } catch (error) {
                    console.log('   ℹ️ Could not read recent errors');
                }
            } catch (error) {
                console.log('   ℹ️ Log files not found (normal for new installations)');
            }
        } catch (error) {
            console.log(`   ❌ Error checking logs: ${error.message}`);
        }

        // Bước 5: Recommendations
        console.log('\n5️⃣ Recommendations:');
        console.log('   🚀 To start server with auto cleanup disabled:');
        console.log('      $env:DISABLE_AUTO_CLEANUP="true"');
        console.log('      npm start');
        console.log('');
        console.log('   🚀 To start server with auto cleanup enabled:');
        console.log('      $env:DISABLE_AUTO_CLEANUP="false"');
        console.log('      npm start');
        console.log('');
        console.log('   📋 If issues persist:');
        console.log('      1. Check logs: Get-Content -Tail 50 logs/error.log');
        console.log('      2. Run safe cleanup: node scripts/safe-cleanup.js');
        console.log('      3. Check port: node scripts/check-port.js');
        console.log('      4. Test actor: node scripts/test-actor-setup.js');

        console.log('\n✅ Campaign issues fix completed!');
        console.log('🎯 You can now start your server and run campaigns.');

    } catch (error) {
        console.error('❌ Error in fix process:', error.message);
        console.error(error.stack);
    }
}

// Chạy function
fixCampaignIssues();
