const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

class PortManager {
    constructor() {
        this.basePort = 5000;
        this.maxPorts = 100; // Tối đa 100 ports (5000-5099)
        this.usedPorts = new Set();
        this.campaignPorts = new Map(); // Map campaignId -> port
    }

    // Kiểm tra port có đang được sử dụng không
    async isPortInUse(port) {
        try {
            if (process.platform === 'win32') {
                const { stdout } = await execAsync(`netstat -ano | findstr :${port}`);
                return stdout.trim().length > 0;
            } else {
                const { stdout } = await execAsync(`lsof -i :${port}`);
                return stdout.trim().length > 0;
            }
        } catch (error) {
            // Nếu không tìm thấy process nào sử dụng port, port đó free
            return false;
        }
    }

    // Tìm port tự do tiếp theo
    async findAvailablePort(startPort = this.basePort) {
        for (let port = startPort; port < startPort + this.maxPorts; port++) {
            if (!this.usedPorts.has(port) && !(await this.isPortInUse(port))) {
                return port;
            }
        }
        throw new Error(`Không tìm thấy port tự do trong khoảng ${startPort}-${startPort + this.maxPorts - 1}`);
    }

    // Cấp phát port cho campaign
    async allocatePort(campaignId) {
        // Kiểm tra xem campaign đã có port chưa
        if (this.campaignPorts.has(campaignId)) {
            const existingPort = this.campaignPorts.get(campaignId);
            console.log(`📡 Campaign ${campaignId} đã có port ${existingPort}`);
            return existingPort;
        }

        // Tìm port tự do
        const port = await this.findAvailablePort();

        // Đánh dấu port đã sử dụng
        this.usedPorts.add(port);
        this.campaignPorts.set(campaignId, port);

        console.log(`📡 Cấp phát port ${port} cho campaign ${campaignId}`);
        return port;
    }

    // Giải phóng port khi campaign hoàn thành
    releasePort(campaignId) {
        const port = this.campaignPorts.get(campaignId);
        if (port) {
            this.usedPorts.delete(port);
            this.campaignPorts.delete(campaignId);
            console.log(`📡 Giải phóng port ${port} từ campaign ${campaignId}`);
            return port;
        }
        return null;
    }

    // Lấy port của campaign
    getCampaignPort(campaignId) {
        return this.campaignPorts.get(campaignId);
    }

    // Kiểm tra campaign có đang sử dụng port không
    isCampaignUsingPort(campaignId) {
        return this.campaignPorts.has(campaignId);
    }

    // Lấy danh sách tất cả ports đang sử dụng
    getUsedPorts() {
        return Array.from(this.usedPorts);
    }

    // Lấy danh sách campaigns và ports
    getCampaignPorts() {
        return Object.fromEntries(this.campaignPorts);
    }

    // Cleanup tất cả ports (emergency)
    async cleanupAllPorts() {
        console.log('🧹 Cleaning up all campaign ports...');

        for (const [campaignId, port] of this.campaignPorts) {
            try {
                // Kill process sử dụng port
                if (process.platform === 'win32') {
                    const { stdout } = await execAsync(`netstat -ano | findstr :${port}`);
                    if (stdout.trim()) {
                        const lines = stdout.split('\n');
                        for (const line of lines) {
                            if (line.trim()) {
                                const parts = line.trim().split(/\s+/);
                                const pid = parts[parts.length - 1];
                                if (pid && !isNaN(pid)) {
                                    try {
                                        await execAsync(`taskkill /F /PID ${pid}`);
                                        console.log(`   ✅ Killed process PID: ${pid} using port ${port}`);
                                    } catch (error) {
                                        console.log(`   ⚠️ Failed to kill process PID: ${pid}: ${error.message}`);
                                    }
                                }
                            }
                        }
                    }
                } else {
                    const { stdout } = await execAsync(`lsof -i :${port}`);
                    if (stdout.trim()) {
                        const lines = stdout.split('\n').slice(1);
                        for (const line of lines) {
                            if (line.trim()) {
                                const parts = line.trim().split(/\s+/);
                                const pid = parts[1];
                                if (pid && !isNaN(pid)) {
                                    try {
                                        await execAsync(`kill -9 ${pid}`);
                                        console.log(`   ✅ Killed process PID: ${pid} using port ${port}`);
                                    } catch (error) {
                                        console.log(`   ⚠️ Failed to kill process PID: ${pid}: ${error.message}`);
                                    }
                                }
                            }
                        }
                    }
                }
            } catch (error) {
                console.log(`   ⚠️ Error cleaning up port ${port}: ${error.message}`);
            }
        }

        // Reset state
        this.usedPorts.clear();
        this.campaignPorts.clear();
        console.log('✅ All campaign ports cleaned up');
    }

    // Kiểm tra health của port
    async checkPortHealth(port) {
        try {
            const response = await fetch(`http://localhost:${port}/health`);
            return response.ok;
        } catch (error) {
            return false;
        }
    }

    // Lấy thống kê ports
    getStats() {
        return {
            totalPorts: this.maxPorts,
            usedPorts: this.usedPorts.size,
            availablePorts: this.maxPorts - this.usedPorts.size,
            activeCampaigns: this.campaignPorts.size,
            portRange: `${this.basePort}-${this.basePort + this.maxPorts - 1}`,
            campaigns: this.getCampaignPorts()
        };
    }
}

// Singleton instance
const portManager = new PortManager();

module.exports = portManager;
