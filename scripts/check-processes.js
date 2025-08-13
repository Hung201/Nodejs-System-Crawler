const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

async function checkNodeProcesses() {
    try {
        console.log('🔍 Checking Node.js processes...');

        if (process.platform === 'win32') {
            // Windows
            const { stdout } = await execAsync('tasklist /FI "IMAGENAME eq node.exe" /FO CSV');
            const lines = stdout.split('\n').slice(1); // Bỏ header

            console.log(`📊 Found ${lines.filter(line => line.trim()).length} Node.js processes:`);

            for (const line of lines) {
                if (line.trim()) {
                    const parts = line.split(',');
                    const pid = parts[1]?.replace(/"/g, '');
                    const memory = parts[4]?.replace(/"/g, '');

                    if (pid) {
                        const isMainServer = pid === process.pid.toString();
                        console.log(`  ${isMainServer ? '🟢' : '🟡'} PID: ${pid} | Memory: ${memory} | ${isMainServer ? 'Main Server' : 'Actor Process'}`);
                    }
                }
            }
        } else {
            // Linux/Mac
            const { stdout } = await execAsync('ps aux | grep node | grep -v grep');
            const lines = stdout.split('\n').filter(line => line.trim());

            console.log(`📊 Found ${lines.length} Node.js processes:`);

            for (const line of lines) {
                const parts = line.split(/\s+/);
                const pid = parts[1];
                const memory = parts[5];
                const command = parts.slice(10).join(' ');

                const isMainServer = pid === process.pid.toString();
                console.log(`  ${isMainServer ? '🟢' : '🟡'} PID: ${pid} | Memory: ${memory} | ${isMainServer ? 'Main Server' : 'Actor Process'}`);
                console.log(`     Command: ${command}`);
            }
        }

        console.log('\n💡 Tips:');
        console.log('  - 🟢 Green: Main server process (keep this)');
        console.log('  - 🟡 Yellow: Actor processes (can be cleaned up)');
        console.log('  - If you see too many yellow processes, run cleanup');

    } catch (error) {
        console.error('❌ Error checking processes:', error.message);
    }
}

async function cleanupActorProcesses() {
    try {
        console.log('🧹 Cleaning up actor processes only (preserving frontend)...');

        if (process.platform === 'win32') {
            // Windows: Kill các process có tên cụ thể là actor processes
            // Chỉ kill các process chạy "node main.js" trong thư mục actors_storage
            try {
                await execAsync('taskkill /F /IM node.exe /FI "WINDOWTITLE eq *actors_storage*"');
                console.log('  ✅ Cleaned up actor processes by window title');
            } catch (error) {
                // Không có process nào match
            }

            // Fallback: Kill các process chạy main.js
            try {
                await execAsync('taskkill /F /FI "WINDOWTITLE eq *main.js*"');
                console.log('  ✅ Cleaned up main.js processes');
            } catch (error) {
                // Không có process nào match
            }

            console.log('✅ Cleaned up actor processes (frontend preserved)');

        } else {
            // Linux/Mac: Chỉ kill các process chạy main.js trong actors_storage
            await execAsync('pkill -f "node.*actors_storage.*main.js"');
            console.log('✅ Cleaned up actor processes (frontend preserved)');
        }

    } catch (error) {
        console.error('❌ Error cleaning up processes:', error.message);
    }
}

async function main() {
    const args = process.argv.slice(2);

    if (args.includes('--cleanup') || args.includes('-c')) {
        await cleanupActorProcesses();
    } else {
        await checkNodeProcesses();

        if (args.includes('--interactive') || args.includes('-i')) {
            const readline = require('readline');
            const rl = readline.createInterface({
                input: process.stdin,
                output: process.stdout
            });

            rl.question('\nDo you want to cleanup actor processes? (y/N): ', async (answer) => {
                if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
                    await cleanupActorProcesses();
                }
                rl.close();
            });
        }
    }
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = {
    checkNodeProcesses,
    cleanupActorProcesses
};
