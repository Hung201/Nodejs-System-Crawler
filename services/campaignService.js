const Campaign = require('../models/Campaign');
const Actor = require('../models/Actor');
const fs = require('fs').promises;
const path = require('path');
const { spawn } = require('child_process');
const portManager = require('./portManager');
const crawlDataService = require('./crawlDataService');

// Helper function để kill actor process một cách an toàn
function killActorProcess(child, reason = 'unknown') {
    if (!child) {
        console.log('⚠️ No child process to kill');
        return;
    }

    try {
        if (!child.killed) {
            console.log(`🔪 Killing actor process (PID: ${child.pid}) - Reason: ${reason}`);

            // Thử kill gracefully trước
            child.kill('SIGTERM');

            // Đợi 3 giây rồi force kill nếu cần
            setTimeout(() => {
                try {
                    if (!child.killed) {
                        console.log(`💀 Force killing actor process (PID: ${child.pid})`);
                        child.kill('SIGKILL');
                    }
                } catch (forceKillError) {
                    console.log(`❌ Failed to force kill process: ${forceKillError.message}`);
                }
            }, 3000);

            console.log(`✅ Kill signal sent to actor process (PID: ${child.pid})`);
        } else {
            console.log(`ℹ️ Actor process (PID: ${child.pid}) already killed`);
        }
    } catch (killError) {
        console.log(`❌ Error killing actor process: ${killError.message}`);
    }
}

// Helper function để cleanup tất cả process node (emergency cleanup)
function cleanupAllNodeProcesses() {
    const { exec } = require('child_process');

    if (process.platform === 'win32') {
        // Windows
        exec('taskkill /f /im node.exe', (error, stdout, stderr) => {
            if (error) {
                console.log(`❌ Failed to cleanup node processes: ${error.message}`);
            } else {
                console.log('✅ Cleaned up all node processes');
            }
        });
    } else {
        // Linux/Mac
        exec('pkill -f node', (error, stdout, stderr) => {
            if (error) {
                console.log(`❌ Failed to cleanup node processes: ${error.message}`);
            } else {
                console.log('✅ Cleaned up all node processes');
            }
        });
    }
}

// Helper function để cleanup actor processes trước khi chạy campaign mới
async function cleanupActorProcesses() {
    const { exec } = require('child_process');
    const util = require('util');
    const execAsync = util.promisify(exec);

    try {
        if (process.platform === 'win32') {
            // Windows: Chỉ kill các process có command line chứa "actors_storage" hoặc "main.js"
            const { stdout } = await execAsync('tasklist /FI "IMAGENAME eq node.exe" /FO CSV');
            const lines = stdout.split('\n').slice(1);

            let cleanedCount = 0;
            for (const line of lines) {
                if (line.trim()) {
                    const parts = line.split(',');
                    const pid = parts[1]?.replace(/"/g, '');

                    if (pid && pid !== process.pid.toString()) {
                        try {
                            // Kiểm tra command line của process
                            const { stdout: wmicOutput } = await execAsync(`wmic process where "ProcessId=${pid}" get CommandLine /format:list`);
                            const commandLine = wmicOutput.split('CommandLine=')[1]?.split('\n')[0] || '';

                            // Chỉ kill nếu là actor process thực sự (có chứa actors_storage hoặc main.js)
                            if (commandLine.includes('actors_storage') ||
                                commandLine.includes('main.js') ||
                                commandLine.includes('node main.js')) {
                                await execAsync(`taskkill /F /PID ${pid}`);
                                console.log(`🧹 Cleaned up confirmed actor process PID: ${pid}`);
                                console.log(`     Command: ${commandLine.substring(0, 100)}...`);
                                cleanedCount++;
                            } else {
                                console.log(`🟢 Keeping process PID: ${pid} - not an actor (likely frontend/backend)`);
                            }
                        } catch (error) {
                            // Process có thể đã tự kết thúc hoặc không có quyền truy cập
                        }
                    }
                }
            }
            console.log(`🧹 Cleaned up ${cleanedCount} confirmed actor processes`);
        } else {
            // Linux/Mac: Chỉ kill các process chạy main.js trong actors_storage
            await execAsync('pkill -f "node.*actors_storage.*main.js"');
            console.log('🧹 Cleaned up actor processes');
        }
    } catch (error) {
        console.log(`⚠️ Cleanup warning: ${error.message}`);
    }
}

// Helper function để kiểm tra health của actor process
function checkActorProcessHealth(child, campaignId) {
    if (!child) return false;

    // Kiểm tra process có còn sống không
    if (child.killed) {
        console.log(`⚠️ Actor process for campaign ${campaignId} has been killed`);
        return false;
    }

    // Kiểm tra process có đang chạy không
    try {
        process.kill(child.pid, 0); // Signal 0 để kiểm tra process có tồn tại không
        return true;
    } catch (error) {
        console.log(`⚠️ Actor process for campaign ${campaignId} is not responding`);
        return false;
    }
}

// Handle uncaught exceptions và process termination
process.on('uncaughtException', (error) => {
    console.error('🚨 Uncaught Exception:', error);
    console.log('🔄 Attempting emergency cleanup...');
    cleanupAllNodeProcesses();
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('🚨 Unhandled Rejection at:', promise, 'reason:', reason);
    console.log('🔄 Attempting emergency cleanup...');
    cleanupAllNodeProcesses();
    process.exit(1);
});

process.on('SIGTERM', () => {
    console.log('🛑 Received SIGTERM, cleaning up...');
    cleanupAllNodeProcesses();
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('🛑 Received SIGINT, cleaning up...');
    cleanupAllNodeProcesses();
    process.exit(0);
});

// Get all campaigns with pagination and filters
const getAllCampaigns = async (filters) => {
    const { page = 1, limit = 10, status, actorId, search } = filters;

    // Build filter
    const filter = {};
    if (status) filter.status = status;
    if (actorId) filter.actorId = actorId;
    if (search) {
        filter.$or = [
            { name: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } }
        ];
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const campaigns = await Campaign.find(filter)
        .populate('actorId', 'name type')
        .populate('createdBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean();

    const total = await Campaign.countDocuments(filter);

    return {
        campaigns,
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / parseInt(limit))
        }
    };
};

// Get campaign by ID
const getCampaignById = async (campaignId) => {
    const campaign = await Campaign.findById(campaignId)
        .populate('actorId', 'name type description inputSchema')
        .populate('createdBy', 'name email');

    if (!campaign) {
        throw new Error('Không tìm thấy campaign');
    }

    return campaign;
};

// Create new campaign
const createCampaign = async (campaignData, createdBy) => {
    const { name, description, actorId, input, config } = campaignData;

    // Check if actor exists
    const actor = await Actor.findById(actorId);
    if (!actor) {
        throw new Error('Không tìm thấy actor');
    }

    // Validate input against actor's input schema
    if (actor.inputSchema && actor.inputSchema.properties) {
        // TODO: Add input validation logic here
    }

    const campaign = new Campaign({
        name,
        description,
        actorId,
        input: input,
        config: config || {},
        createdBy
    });

    await campaign.save();

    // Populate references
    await campaign.populate('actorId', 'name type');
    await campaign.populate('createdBy', 'name email');

    return campaign;
};

// Update campaign
const updateCampaign = async (campaignId, updateData) => {
    const { name, description, actorId, input, config } = updateData;

    // Check if campaign exists
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
        throw new Error('Không tìm thấy campaign');
    }

    // If actorId is being updated, check if the new actor exists
    if (actorId && actorId !== campaign.actorId.toString()) {
        const actor = await Actor.findById(actorId);
        if (!actor) {
            throw new Error('Không tìm thấy actor');
        }
    }

    // Update fields
    if (name !== undefined) campaign.name = name;
    if (description !== undefined) campaign.description = description;

    // Handle input update with partial merge support
    if (input !== undefined) {
        // Thay thế hoàn toàn input thay vì merge
        campaign.input = input;
    }

    // Handle other fields based on campaign status
    if (campaign.status === 'running') {
        console.log('Campaign đang chạy - cho phép update name, description và input parameters');
        // Không cho phép thay đổi actorId và config khi đang chạy
    } else {
        // Nếu không chạy, cho phép update tất cả fields
        if (actorId !== undefined) campaign.actorId = actorId;
        if (config !== undefined) campaign.config = { ...campaign.config, ...config };
    }

    await campaign.save();

    // Populate references
    await campaign.populate('actorId', 'name type');
    await campaign.populate('createdBy', 'name email');

    return campaign;
};

// Run campaign
const runCampaign = async (campaignId, customInput = null) => {
    const campaign = await Campaign.findById(campaignId)
        .populate('actorId');

    if (!campaign) {
        throw new Error('Không tìm thấy campaign');
    }

    // Kiểm tra xem có campaign nào khác đang chạy cùng actor không
    const runningCampaigns = await Campaign.find({
        actorId: campaign.actorId._id,
        status: 'running'
    });

    // Cho phép nhiều campaign chạy cùng lúc, nhưng giới hạn số lượng
    const maxConcurrentRuns = 3; // Có thể config
    if (runningCampaigns.length >= maxConcurrentRuns) {
        throw new Error(`Actor đang chạy ${runningCampaigns.length} campaigns. Giới hạn tối đa: ${maxConcurrentRuns}`);
    }

    // Check if campaign is already running
    if (campaign.status === 'running') {
        // Kiểm tra xem campaign có đang thực sự chạy không
        const startTime = campaign.result?.startTime ? new Date(campaign.result.startTime) : null;
        const now = new Date();

        if (startTime) {
            const durationMs = now - startTime;
            const durationMinutes = Math.floor(durationMs / (1000 * 60));

            // Nếu có records và chạy quá 5 phút, force complete
            if (campaign.result?.recordsProcessed > 0 && durationMinutes > 5) {
                console.log(`⚠️ Campaign có ${campaign.result.recordsProcessed} records và đã chạy ${durationMinutes} phút, force complete`);
                campaign.status = 'completed';
                campaign.result.endTime = now.toISOString();
                campaign.result.duration = durationMs;
                await campaign.save();
            }
            // Nếu chạy quá 10 phút mà không có kết quả, coi như failed
            else if (durationMinutes > 10 && (!campaign.result?.recordsProcessed || campaign.result.recordsProcessed === 0)) {
                console.log(`⚠️ Campaign đã chạy ${durationMinutes} phút không có kết quả, reset về pending`);
                campaign.status = 'pending';
                campaign.result = {
                    log: '',
                    output: [],
                    error: 'Campaign timeout - không có kết quả sau 10 phút',
                    startTime: null,
                    endTime: null,
                    duration: 0,
                    recordsProcessed: 0
                };
                await campaign.save();
            } else {
                throw new Error('Campaign đang chạy');
            }
        } else {
            // Nếu không có startTime, reset về pending
            console.log('⚠️ Campaign running nhưng không có startTime, reset về pending');
            campaign.status = 'pending';
            campaign.result = {
                log: '',
                output: [],
                error: null,
                startTime: null,
                endTime: null,
                duration: 0,
                recordsProcessed: 0
            };
            await campaign.save();
        }
    }

    // Sử dụng custom input nếu có,否则 sử dụng input từ campaign
    const inputToUse = customInput || campaign.input;

    // Cleanup actor processes trước khi chạy để tránh xung đột (có thể tắt bằng DISABLE_AUTO_CLEANUP=true)
    if (process.env.DISABLE_AUTO_CLEANUP !== 'true') {
        console.log('🧹 Cleaning up existing actor processes before starting new campaign...');
        await cleanupActorProcesses();
    } else {
        console.log('⚠️ Auto cleanup disabled by DISABLE_AUTO_CLEANUP=true');
    }

    // Cấp phát port cho campaign
    const campaignPort = await portManager.allocatePort(campaign._id.toString());

    // Update campaign status
    campaign.status = 'running';
    campaign.result.startTime = new Date();
    campaign.result.log = `🚀 Starting campaign... (${new Date().toISOString()})\n📄 Input: ${JSON.stringify(inputToUse, null, 2)}\n📡 Port: ${campaignPort}`;
    campaign.result.error = null;
    campaign.result.port = campaignPort;
    await campaign.save();

    // Generate run ID
    const runId = `run_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Add to run history
    await campaign.addRunHistory({
        runId,
        status: 'running',
        startTime: new Date()
    });

    // Run actor asynchronously with custom input and port
    runActorAsync(campaign, runId, inputToUse, campaignPort);

    return {
        campaignId: campaign._id,
        runId,
        status: 'running',
        message: 'Campaign đã được khởi chạy'
    };
};

// Get campaign status
const getCampaignStatus = async (campaignId) => {
    const campaign = await Campaign.findById(campaignId)
        .populate('actorId', 'name type');

    if (!campaign) {
        throw new Error('Không tìm thấy campaign');
    }

    // Auto-completion logic: Kiểm tra và tự động chuyển status
    if (campaign.status === 'running') {
        const startTime = campaign.result?.startTime ? new Date(campaign.result.startTime) : null;
        const now = new Date();
        if (startTime) {
            const durationMs = now - startTime;
            const durationMinutes = Math.floor(durationMs / (1000 * 60));

            // Nếu có dữ liệu và chạy hơn 5 phút, tự động complete
            if (campaign.result?.recordsProcessed > 0 && durationMinutes > 5) {
                campaign.status = 'completed';
                campaign.result.endTime = now;
                campaign.result.duration = durationMs;

                // Update run history
                if (campaign.runHistory.length > 0) {
                    const lastRun = campaign.runHistory[campaign.runHistory.length - 1];
                    lastRun.status = 'completed';
                    lastRun.endTime = now;
                    lastRun.duration = durationMs;
                    lastRun.recordsProcessed = campaign.result.recordsProcessed;
                }

                await campaign.save();
                console.log(`✅ Campaign ${campaign.name} (${campaign._id}) auto-completed.`);
            }
            // Nếu không có dữ liệu và chạy hơn 10 phút, reset về pending
            else if (durationMinutes > 10 && (!campaign.result?.recordsProcessed || campaign.result.recordsProcessed === 0)) {
                campaign.status = 'pending';
                campaign.result = {
                    log: '',
                    output: [],
                    error: null,
                    startTime: null,
                    endTime: null,
                    duration: 0,
                    recordsProcessed: 0
                };

                // Update run history
                if (campaign.runHistory.length > 0) {
                    const lastRun = campaign.runHistory[campaign.runHistory.length - 1];
                    lastRun.status = 'failed';
                    lastRun.endTime = now;
                    lastRun.duration = durationMs;
                    lastRun.recordsProcessed = 0;
                    lastRun.error = 'Auto-reset due to no data after 10 minutes';
                }

                await campaign.save();
                console.log(`⚠️ Campaign ${campaign.name} (${campaign._id}) reset to pending due to no data after 10 minutes.`);
            }
        } else {
            // Nếu status là running nhưng không có startTime, reset về pending
            campaign.status = 'pending';
            campaign.result = {
                log: '',
                output: [],
                error: null,
                startTime: null,
                endTime: null,
                duration: 0,
                recordsProcessed: 0
            };
            await campaign.save();
            console.log(`⚠️ Campaign ${campaign.name} (${campaign._id}) reset to pending due to missing startTime.`);
        }
    }

    return {
        id: campaign._id,
        name: campaign.name,
        status: campaign.status,
        result: campaign.result,
        stats: campaign.stats,
        lastRun: campaign.runHistory[campaign.runHistory.length - 1]
    };
};

// Cancel campaign
const cancelCampaign = async (campaignId) => {
    const campaign = await Campaign.findById(campaignId);

    if (!campaign) {
        throw new Error('Không tìm thấy campaign');
    }

    if (campaign.status !== 'running') {
        throw new Error('Campaign không đang chạy');
    }

    // Update status
    campaign.status = 'cancelled';
    campaign.result.endTime = new Date();
    campaign.result.log += '\nCampaign đã bị hủy bởi người dùng';
    await campaign.save();

    // Update last run in history
    if (campaign.runHistory.length > 0) {
        const lastRun = campaign.runHistory[campaign.runHistory.length - 1];
        lastRun.status = 'cancelled';
        lastRun.endTime = new Date();
        lastRun.log += '\nCampaign đã bị hủy bởi người dùng';
        await campaign.save();
    }

    return { message: 'Campaign đã được hủy thành công' };
};

// Delete campaign
const deleteCampaign = async (campaignId) => {
    const campaign = await Campaign.findById(campaignId);

    if (!campaign) {
        throw new Error('Không tìm thấy campaign');
    }

    // Check if campaign is running
    if (campaign.status === 'running') {
        throw new Error('Không thể xóa campaign đang chạy');
    }

    await Campaign.findByIdAndDelete(campaignId);
    return { message: 'Campaign đã được xóa thành công' };
};

const resetCampaign = async (campaignId) => {
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
        throw new Error('Không tìm thấy campaign');
    }

    campaign.status = 'pending';
    campaign.result = {
        log: '',
        output: [],
        error: null,
        startTime: null,
        endTime: null,
        duration: 0,
        recordsProcessed: 0
    };
    campaign.runHistory = [];

    await campaign.save();
    return { message: 'Campaign đã được reset thành công' };
};

// Helper function để chạy actor
async function runActorAsync(campaign, runId, customInput = null, campaignPort = null) {
    try {
        const actor = campaign.actorId;
        const actorPath = path.join(process.cwd(), 'actors_storage', actor.userId.toString(), actor._id.toString());

        // Tạo thư mục apify_storage nếu chưa có
        const apifyStoragePath = path.join(actorPath, 'apify_storage');
        const keyValueStorePath = path.join(apifyStoragePath, 'key_value_stores', 'default');
        const datasetPath = path.join(apifyStoragePath, 'datasets', 'default');

        await fs.mkdir(keyValueStorePath, { recursive: true });
        await fs.mkdir(datasetPath, { recursive: true });

        // Sử dụng custom input nếu có,否则 sử dụng input từ campaign
        const inputToUse = customInput || campaign.input;

        // Ghi input vào input.json trong thư mục src của actor
        const inputPath = path.join(actorPath, 'src', 'input.json');
        await fs.writeFile(inputPath, JSON.stringify(inputToUse, null, 2));
        console.log(`✅ Input file written to: ${inputPath}`);

        // Cũng ghi vào apify_storage để tương thích
        const apifyInputPath = path.join(keyValueStorePath, 'INPUT.json');
        await fs.writeFile(apifyInputPath, JSON.stringify(inputToUse, null, 2));
        console.log(`✅ Apify input file written to: ${apifyInputPath}`);

        // Check file permissions and existence
        try {
            const inputStats = await fs.stat(inputPath);
            console.log(`📄 Input file size: ${inputStats.size} bytes`);
            console.log(`📄 Input file permissions: ${inputStats.mode.toString(8)}`);
        } catch (error) {
            console.log(`❌ Error checking input file: ${error.message}`);
        }

        // Cài đặt dependencies nếu có package.json
        const packageJsonPath = path.join(actorPath, 'package.json');
        try {
            await fs.access(packageJsonPath);
            console.log('Installing dependencies...');
            await new Promise((resolve, reject) => {
                // Sử dụng đường dẫn đầy đủ đến npm
                const npmPath = process.platform === 'win32' ? 'npm.cmd' : 'npm';
                const install = spawn(npmPath, ['install'], {
                    cwd: actorPath,
                    stdio: ['pipe', 'pipe', 'pipe'],
                    shell: true // Sử dụng shell để tìm npm
                });

                install.on('close', (code) => {
                    if (code === 0) {
                        console.log('Dependencies installed successfully');
                        resolve();
                    } else {
                        console.log('Failed to install dependencies');
                        reject(new Error(`npm install failed with code ${code}`));
                    }
                });
            });
        } catch (error) {
            console.log('No package.json found, skipping npm install');
        }

        // Chạy actor từ thư mục src
        const actorWorkingDir = path.join(actorPath, 'src');
        console.log(`🚀 Starting actor process in: ${actorWorkingDir}`);
        console.log(`📁 Actor path: ${actorPath}`);
        console.log(`📄 Input file: ${inputPath}`);

        // Tạo environment variables với port
        const env = {
            ...process.env,
            NODE_ENV: 'production',
            CAMPAIGN_PORT: campaignPort || '5000'
        };

        const child = spawn('node', ['main.js'], {
            cwd: actorWorkingDir,
            stdio: ['pipe', 'pipe', 'pipe'],
            env: env
        });

        console.log(`🔄 Actor process started with PID: ${child.pid}`);
        console.log(`🚀 [${new Date().toISOString()}] Campaign started - Actor PID: ${child.pid}`);
        console.log(`📁 Working directory: ${actorWorkingDir}`);
        console.log(`📄 Input file: ${inputPath}`);
        console.log(`📡 Campaign port: ${campaignPort}`);
        console.log(`⏰ Timeout: 5 minutes`);
        console.log(`🔄 Starting CheerioCrawler...`);

        let log = '';
        let startTime = Date.now();
        let lastLogUpdate = Date.now();
        let lastOutputTime = Date.now();

        // Add timeout for actor process (5 minutes)
        const timeout = setTimeout(() => {
            console.log('⏰ Actor process timeout after 5 minutes');
            killActorProcess(child, 'timeout');
            reject(new Error('Actor process timeout after 5 minutes'));
        }, 5 * 60 * 1000);

        // Add hang detection (no output for 2 minutes)
        const hangDetection = setInterval(() => {
            const now = Date.now();
            const timeSinceLastOutput = now - lastOutputTime;

            if (timeSinceLastOutput > 2 * 60 * 1000) { // 2 minutes
                console.log(`⚠️ Actor process seems hung - no output for ${Math.floor(timeSinceLastOutput / 1000)} seconds`);
                console.log('🔄 Attempting to restart actor process...');

                clearInterval(hangDetection);
                killActorProcess(child, 'hang_detection');

                // Thêm log vào campaign
                log += `\n⚠️ [${new Date().toISOString()}] Actor process hung - no output for ${Math.floor(timeSinceLastOutput / 1000)} seconds`;
                campaign.result.log = log;
                campaign.save().catch(err => console.error('Error updating campaign log:', err));

                reject(new Error(`Actor process hung - no output for ${Math.floor(timeSinceLastOutput / 1000)} seconds`));
            }
        }, 30 * 1000); // Check every 30 seconds

        child.stdout.on('data', (data) => {
            const output = data.toString();
            log += output;

            // Update last output time for hang detection
            lastOutputTime = Date.now();

            // Log real-time output từ actor với timestamp
            const timestamp = new Date().toISOString();
            console.log(`[${timestamp}] [Actor Output] ${output.trim()}`);

            // Debug: Log tất cả output để xem actor có output gì
            console.log(`🔍 [DEBUG] Raw output from actor: "${output.trim()}"`);

            // Thêm log vào campaign để tracking
            log += `\n🔍 [${timestamp}] Actor output: ${output.trim()}`;

            // Thêm log chi tiết vào campaign để tracking
            if (output.includes('🎯 Added product to scrapedData')) {
                const match = output.match(/Total: (\d+)/);
                const count = match ? match[1] : 'unknown';
                log += `\n🎯 [${timestamp}] Đã thêm sản phẩm vào scrapedData. Tổng số: ${count}`;
            }

            // Detect khi actor bắt đầu lấy sản phẩm
            if (output.includes('🎯 Added product to scrapedData')) {
                console.log('🎯 Actor đang lấy sản phẩm...');
                const match = output.match(/Total: (\d+)/);
                const count = match ? match[1] : 'unknown';
                log += `\n🎯 [${new Date().toISOString()}] Đã thêm sản phẩm vào scrapedData. Tổng số: ${count}`;
            }

            // Detect khi actor sắp lưu file hung.json
            if (output.includes('🎯 About to save data to hung.json')) {
                console.log('💾 Actor sắp lưu data vào hung.json...');
                log += `\n💾 [${timestamp}] Actor sắp lưu data vào hung.json...`;
            }

            // Detect khi actor lưu thành công hung.json
            if (output.includes('✅ Data save attempt completed')) {
                console.log('🎉 Actor đã lưu thành công data vào hung.json!');
                log += `\n🎉 [${timestamp}] Actor đã lưu thành công data vào hung.json!`;
            }

            // Detect khi actor sắp exit
            if (output.includes('🚪 About to exit actor')) {
                console.log('🚪 Actor sắp kết thúc...');
                log += `\n🚪 [${timestamp}] Actor sắp kết thúc...`;
            }

            // Detect khi CheerioCrawler xử lý request
            if (output.includes('INFO CheerioCrawler:')) {
                console.log(`📊 [CheerioCrawler] ${output.trim()}`);
                log += `\n📊 [${timestamp}] CheerioCrawler: ${output.trim()}`;
            }

            // Detect khi crawler hoàn thành
            if (output.includes('All requests from the queue have been processed')) {
                console.log(`🏁 [Complete] ${output.trim()}`);
                log += `\n🏁 [${timestamp}] Crawler completed: ${output.trim()}`;
            }

            // Detect thống kê cuối cùng
            if (output.includes('Final request statistics:')) {
                console.log(`📈 [Stats] ${output.trim()}`);
                log += `\n📈 [${timestamp}] Final stats: ${output.trim()}`;
            }

            // Detect khi actor đã lưu xong data và sắp hoàn thành
            if (output.includes('✅ Data save attempt completed')) {
                console.log('🎉 Actor đã lưu thành công data vào hung.json!');
                // Đợi 2 giây rồi kill process để đảm bảo actor có thời gian exit gracefully
                setTimeout(() => {
                    if (!child.killed) {
                        console.log('🔄 Auto-killing actor process after successful data save');
                        killActorProcess(child, 'auto_kill_after_save');
                    }
                }, 2000);
            }

            // Update campaign log mỗi 2 giây để đảm bảo không bỏ lỡ log
            const now = Date.now();
            if (now - lastLogUpdate > 2000) {
                campaign.result.log = log;
                campaign.save().catch(err => console.error('Error updating campaign log:', err));
                lastLogUpdate = now;
            }
        });

        child.stderr.on('data', (data) => {
            const error = data.toString();
            log += error;
            const timestamp = new Date().toISOString();
            console.log(`[${timestamp}] [Actor Error] ${error.trim()}`);
            log += `\n⚠️ [${timestamp}] Actor Error: ${error.trim()}`;

            // Debug: Log tất cả error để xem actor có error gì
            console.log(`🔍 [DEBUG] Raw error from actor: "${error.trim()}"`);
        });

        child.on('error', (error) => {
            console.log(`❌ Actor process error: ${error.message}`);
            clearTimeout(timeout);
            killActorProcess(child, 'error');
            reject(error);
        });

        child.on('exit', (code, signal) => {
            console.log(`🚪 Actor process exited with code: ${code}, signal: ${signal}`);
            log += `\n🚪 [${new Date().toISOString()}] Actor process exited with code: ${code}, signal: ${signal}`;

            // Nếu process bị kill bởi signal, log thông tin
            if (signal) {
                console.log(`⚠️ Actor process was terminated by signal: ${signal}`);
                log += `\n⚠️ [${new Date().toISOString()}] Actor process was terminated by signal: ${signal}`;
            }

            // Cleanup timeout nếu process exit sớm
            clearTimeout(timeout);
        });

        child.on('close', async (code) => {
            clearTimeout(timeout); // Clear timeout when process closes
            clearInterval(hangDetection); // Clear hang detection when process closes
            const endTime = Date.now();
            const duration = endTime - startTime;

            console.log(`\n🏁 [${new Date().toISOString()}] Actor process closed with code: ${code}`);
            console.log(`⏱️ Total duration: ${Math.round(duration / 1000)} seconds`);
            console.log(`📊 Processing campaign results...`);

            try {
                // Đọc kết quả từ file hung.json hoặc dataset
                let output = [];
                try {
                    // Thử đọc từ file hung.json trước (từ thư mục src)
                    const hungJsonPath = path.join(actorPath, 'src', 'hung.json');
                    try {
                        const content = await fs.readFile(hungJsonPath, 'utf8');
                        const data = JSON.parse(content);
                        if (Array.isArray(data)) {
                            output = data;
                        } else {
                            output = [data];
                        }
                        console.log(`📖 [${new Date().toISOString()}] Đọc được ${output.length} sản phẩm từ hung.json`);
                        log += `\n📖 [${new Date().toISOString()}] Đọc được ${output.length} sản phẩm từ hung.json`;
                    } catch (error) {
                        console.log(`⚠️ [${new Date().toISOString()}] Không tìm thấy hung.json trong src/, thử đọc từ dataset`);
                        log += `\n⚠️ [${new Date().toISOString()}] Không tìm thấy hung.json trong src/, thử đọc từ dataset`;

                        // Fallback: đọc từ dataset
                        const datasetFiles = await fs.readdir(datasetPath);
                        for (const file of datasetFiles) {
                            if (file.endsWith('.json')) {
                                const content = await fs.readFile(path.join(datasetPath, file), 'utf8');
                                const data = JSON.parse(content);
                                if (Array.isArray(data)) {
                                    output.push(...data);
                                } else {
                                    output.push(data);
                                }
                            }
                        }
                    }
                } catch (error) {
                    console.log(`❌ [${new Date().toISOString()}] No output files found or error reading output: ${error.message}`);
                    log += `\n❌ [${new Date().toISOString()}] No output files found or error reading output: ${error.message}`;
                }

                // Lưu dữ liệu vào database
                let savedDataCount = 0;
                if (output.length > 0) {
                    try {
                        console.log(`💾 [${new Date().toISOString()}] Lưu ${output.length} sản phẩm vào database...`);
                        const savedData = await crawlDataService.saveMultipleCrawlData(output, campaign._id, campaign.actorId._id, 'product');
                        savedDataCount = savedData.length;
                        console.log(`✅ [${new Date().toISOString()}] Đã lưu ${savedDataCount} sản phẩm vào database`);
                        log += `\n💾 [${new Date().toISOString()}] Đã lưu ${savedDataCount} sản phẩm vào database`;
                    } catch (saveError) {
                        console.error(`❌ [${new Date().toISOString()}] Lỗi lưu dữ liệu vào database:`, saveError);
                        log += `\n❌ [${new Date().toISOString()}] Lỗi lưu dữ liệu vào database: ${saveError.message}`;
                    }
                }

                // Update campaign result
                const resultData = {
                    log: log,
                    output: output,
                    endTime: new Date(),
                    duration: duration,
                    recordsProcessed: output.length,
                    savedDataCount: savedDataCount
                };

                if (code === 0) {
                    campaign.status = 'completed';
                    campaign.result.error = null;
                    console.log(`✅ [${new Date().toISOString()}] Campaign completed successfully!`);
                    console.log(`📊 [${new Date().toISOString()}] Total products scraped: ${output.length}`);
                    console.log(`⏱️ [${new Date().toISOString()}] Total duration: ${Math.round(duration / 1000)} seconds`);
                    log += `\n✅ [${new Date().toISOString()}] Campaign completed successfully!`;
                    log += `\n📊 [${new Date().toISOString()}] Total products scraped: ${output.length}`;
                    log += `\n⏱️ [${new Date().toISOString()}] Total duration: ${Math.round(duration / 1000)} seconds`;
                } else {
                    campaign.status = 'failed';
                    campaign.result.error = `Actor exited with code ${code}`;
                    console.log(`❌ [${new Date().toISOString()}] Campaign failed with exit code: ${code}`);
                    log += `\n❌ [${new Date().toISOString()}] Campaign failed with exit code: ${code}`;
                }

                // Giải phóng port khi campaign hoàn thành
                const releasedPort = portManager.releasePort(campaign._id.toString());
                if (releasedPort) {
                    console.log(`📡 [${new Date().toISOString()}] Released port ${releasedPort} from campaign ${campaign._id}`);
                    log += `\n📡 [${new Date().toISOString()}] Released port ${releasedPort} from campaign ${campaign._id}`;
                }

                // Luôn kill process actor sau khi hoàn thành (thành công hoặc thất bại)
                killActorProcess(child, code === 0 ? 'completed' : 'failed');

                // Tự động cleanup actor processes sau khi hoàn thành
                if (process.env.DISABLE_AUTO_CLEANUP !== 'true') {
                    console.log(`🧹 [${new Date().toISOString()}] Auto-cleaning up actor processes after completion...`);
                    try {
                        await cleanupActorProcesses();
                        console.log(`✅ [${new Date().toISOString()}] Actor processes cleanup completed`);
                        log += `\n🧹 [${new Date().toISOString()}] Auto-cleaned up actor processes after completion`;
                    } catch (cleanupError) {
                        console.log(`⚠️ [${new Date().toISOString()}] Cleanup warning: ${cleanupError.message}`);
                        log += `\n⚠️ [${new Date().toISOString()}] Cleanup warning: ${cleanupError.message}`;
                    }
                } else {
                    console.log(`⚠️ [${new Date().toISOString()}] Auto cleanup disabled by DISABLE_AUTO_CLEANUP=true`);
                }

                log += `\n💾 [${new Date().toISOString()}] Updating campaign result to database...`;
                await campaign.updateResult(resultData);
                log += `\n✅ [${new Date().toISOString()}] Campaign result updated successfully!`;

                // Update run history
                log += `\n📝 [${new Date().toISOString()}] Updating run history...`;
                const lastRun = campaign.runHistory[campaign.runHistory.length - 1];
                lastRun.status = campaign.status;
                lastRun.endTime = new Date();
                lastRun.duration = duration;
                lastRun.log = log;
                lastRun.output = output;
                lastRun.recordsProcessed = output.length;
                if (campaign.status === 'failed') {
                    lastRun.error = campaign.result.error;
                }
                await campaign.save();
                log += `\n✅ [${new Date().toISOString()}] Run history updated successfully!`;

            } catch (error) {
                console.error('Error updating campaign result:', error);
                log += `\n❌ [${new Date().toISOString()}] Error updating campaign result: ${error.message}`;

                // Update campaign as failed
                campaign.status = 'failed';
                campaign.result.error = error.message;
                campaign.result.endTime = new Date();
                campaign.result.duration = Date.now() - startTime;
                await campaign.save();
            }
        });

        child.on('error', async (error) => {
            console.error('Error running actor:', error);
            log += `\n❌ [${new Date().toISOString()}] Runtime error running actor: ${error.message}`;

            // Giải phóng port khi có lỗi
            const releasedPort = portManager.releasePort(campaign._id.toString());
            if (releasedPort) {
                console.log(`📡 [${new Date().toISOString()}] Released port ${releasedPort} from campaign ${campaign._id} due to error`);
                log += `\n📡 [${new Date().toISOString()}] Released port ${releasedPort} from campaign ${campaign._id} due to error`;
            }

            // Kill process actor khi có lỗi runtime
            killActorProcess(child, 'runtime_error');

            // Cleanup actor processes khi có lỗi
            if (process.env.DISABLE_AUTO_CLEANUP !== 'true') {
                console.log(`🧹 [${new Date().toISOString()}] Auto-cleaning up actor processes after error...`);
                try {
                    await cleanupActorProcesses();
                    console.log(`✅ [${new Date().toISOString()}] Actor processes cleanup completed after error`);
                } catch (cleanupError) {
                    console.log(`⚠️ [${new Date().toISOString()}] Cleanup warning after error: ${cleanupError.message}`);
                }
            } else {
                console.log(`⚠️ [${new Date().toISOString()}] Auto cleanup disabled by DISABLE_AUTO_CLEANUP=true`);
            }

            campaign.status = 'failed';
            campaign.result.error = error.message;
            campaign.result.endTime = new Date();
            campaign.result.duration = Date.now() - startTime;
            await campaign.save();
        });

    } catch (error) {
        console.error('Error in runActorAsync:', error);
        log += `\n❌ [${new Date().toISOString()}] Setup error in runActorAsync: ${error.message}`;

        // Giải phóng port khi có lỗi setup
        const releasedPort = portManager.releasePort(campaign._id.toString());
        if (releasedPort) {
            console.log(`📡 [${new Date().toISOString()}] Released port ${releasedPort} from campaign ${campaign._id} due to setup error`);
            log += `\n📡 [${new Date().toISOString()}] Released port ${releasedPort} from campaign ${campaign._id} due to setup error`;
        }

        // Kill process nếu có lỗi trong quá trình setup
        if (typeof child !== 'undefined' && child) {
            killActorProcess(child, 'setup_error');
        }

        // Cleanup actor processes khi có lỗi setup
        if (process.env.DISABLE_AUTO_CLEANUP !== 'true') {
            console.log(`🧹 [${new Date().toISOString()}] Auto-cleaning up actor processes after setup error...`);
            try {
                await cleanupActorProcesses();
                console.log(`✅ [${new Date().toISOString()}] Actor processes cleanup completed after setup error`);
            } catch (cleanupError) {
                console.log(`⚠️ [${new Date().toISOString()}] Cleanup warning after setup error: ${cleanupError.message}`);
            }
        } else {
            console.log(`⚠️ [${new Date().toISOString()}] Auto cleanup disabled by DISABLE_AUTO_CLEANUP=true`);
        }

        campaign.status = 'failed';
        campaign.result.error = error.message;
        campaign.result.endTime = new Date();
        await campaign.save();
    }
}

// Run multiple campaigns simultaneously
const runMultipleCampaigns = async (campaignIds, customInputs = {}) => {
    const results = [];
    const errors = [];

    console.log(`🚀 Starting ${campaignIds.length} campaigns simultaneously...`);

    // Validate all campaigns first
    for (const campaignId of campaignIds) {
        try {
            const campaign = await Campaign.findById(campaignId).populate('actorId');
            if (!campaign) {
                errors.push({
                    campaignId,
                    error: 'Không tìm thấy campaign'
                });
                continue;
            }

            if (campaign.status === 'running') {
                errors.push({
                    campaignId,
                    error: 'Campaign đang chạy'
                });
                continue;
            }
        } catch (error) {
            errors.push({
                campaignId,
                error: error.message
            });
        }
    }

    // If there are validation errors, return them
    if (errors.length > 0) {
        return {
            success: false,
            message: 'Một số campaign không thể chạy',
            errors,
            results: []
        };
    }

    // Run all campaigns in parallel
    const runPromises = campaignIds.map(async (campaignId) => {
        try {
            const customInput = customInputs[campaignId] || null;
            const result = await runCampaign(campaignId, customInput);
            return {
                campaignId,
                success: true,
                data: result
            };
        } catch (error) {
            return {
                campaignId,
                success: false,
                error: error.message
            };
        }
    });

    const runResults = await Promise.all(runPromises);

    // Separate successful and failed runs
    const successfulRuns = runResults.filter(r => r.success);
    const failedRuns = runResults.filter(r => !r.success);

    console.log(`✅ Successfully started ${successfulRuns.length} campaigns`);
    if (failedRuns.length > 0) {
        console.log(`❌ Failed to start ${failedRuns.length} campaigns`);
    }

    return {
        success: true,
        message: `Đã khởi chạy ${successfulRuns.length}/${campaignIds.length} campaigns`,
        totalCampaigns: campaignIds.length,
        successfulRuns: successfulRuns.length,
        failedRuns: failedRuns.length,
        results: runResults
    };
};

// Get running campaigns status
const getRunningCampaigns = async () => {
    try {
        const runningCampaigns = await Campaign.find({ status: 'running' })
            .populate('actorId', 'name type')
            .populate('createdBy', 'name email')
            .sort({ 'result.startTime': -1 });

        const campaignsWithPorts = runningCampaigns.map(campaign => {
            const port = portManager.getCampaignPort(campaign._id.toString());
            return {
                ...campaign.toObject(),
                port: port || null
            };
        });

        return {
            success: true,
            data: {
                totalRunning: campaignsWithPorts.length,
                campaigns: campaignsWithPorts
            }
        };
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
};

// Stop all running campaigns
const stopAllRunningCampaigns = async () => {
    try {
        const runningCampaigns = await Campaign.find({ status: 'running' });
        const results = [];

        for (const campaign of runningCampaigns) {
            try {
                await cancelCampaign(campaign._id);
                results.push({
                    campaignId: campaign._id,
                    success: true,
                    message: 'Campaign đã được hủy'
                });
            } catch (error) {
                results.push({
                    campaignId: campaign._id,
                    success: false,
                    error: error.message
                });
            }
        }

        return {
            success: true,
            message: `Đã hủy ${results.filter(r => r.success).length}/${runningCampaigns.length} campaigns`,
            results
        };
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
};

module.exports = {
    getAllCampaigns,
    getCampaignById,
    createCampaign,
    updateCampaign,
    runCampaign,
    runMultipleCampaigns,
    getRunningCampaigns,
    stopAllRunningCampaigns,
    getCampaignStatus,
    cancelCampaign,
    resetCampaign,
    deleteCampaign,
    cleanupAllNodeProcesses
};
