const Campaign = require('../models/Campaign');
const Actor = require('../models/Actor');
const fs = require('fs').promises;
const path = require('path');
const { spawn } = require('child_process');
// const crawlDataService = require('./crawlDataService'); // Đã bỏ phần lưu data vào DB

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

    // Update campaign status
    campaign.status = 'running';
    campaign.result.startTime = new Date();
    campaign.result.log = 'Starting campaign...';
    campaign.result.error = null;
    await campaign.save();

    // Generate run ID
    const runId = `run_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Add to run history
    await campaign.addRunHistory({
        runId,
        status: 'running',
        startTime: new Date()
    });

    // Run actor asynchronously with custom input
    runActorAsync(campaign, runId, inputToUse);

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
async function runActorAsync(campaign, runId, customInput = null) {
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

        const child = spawn('node', ['main.js'], {
            cwd: actorWorkingDir,
            stdio: ['pipe', 'pipe', 'pipe'],
            env: { ...process.env, NODE_ENV: 'production' }
        });

        console.log(`🔄 Actor process started with PID: ${child.pid}`);

        let log = '';
        let startTime = Date.now();
        let lastLogUpdate = Date.now();

        // Add timeout for actor process (5 minutes)
        const timeout = setTimeout(() => {
            console.log('⏰ Actor process timeout after 5 minutes');
            killActorProcess(child, 'timeout');
            reject(new Error('Actor process timeout after 5 minutes'));
        }, 5 * 60 * 1000);

        child.stdout.on('data', (data) => {
            const output = data.toString();
            log += output;

            // Log real-time output từ actor
            console.log(`[Actor Output] ${output.trim()}`);

            // Detect khi actor bắt đầu lấy sản phẩm
            if (output.includes('🎯 Added product to scrapedData')) {
                console.log('🎯 Actor đang lấy sản phẩm...');
            }

            // Detect khi actor tìm thấy link sản phẩm
            if (output.includes('Tìm thấy') && output.includes('link sản phẩm')) {
                console.log('🔗 Actor tìm thấy link sản phẩm...');
            }

            // Detect khi actor lấy xong dữ liệu sản phẩm
            if (output.includes('Đã lấy xong dữ liệu sản phẩm')) {
                console.log('✅ Actor đã lấy xong 1 sản phẩm...');
            }

            // Detect khi actor sắp lưu file hung.json
            if (output.includes('About to save data to hung.json')) {
                console.log('💾 Actor sắp lưu data vào hung.json...');
            }

            // Detect khi actor lưu thành công hung.json
            if (output.includes('Successfully saved') && output.includes('products to hung.json')) {
                console.log('🎉 Actor đã lưu thành công data vào hung.json!');
            }

            // Detect khi actor sắp exit
            if (output.includes('About to exit actor')) {
                console.log('🚪 Actor sắp kết thúc...');
            }

            // Detect khi actor đã lưu xong data và sắp hoàn thành
            if (output.includes('Successfully saved') && output.includes('products to hung.json')) {
                console.log('🎉 Actor đã lưu thành công data vào hung.json!');
                // Đợi 2 giây rồi kill process để đảm bảo actor có thời gian exit gracefully
                setTimeout(() => {
                    if (!child.killed) {
                        console.log('🔄 Auto-killing actor process after successful data save');
                        killActorProcess(child, 'auto_kill_after_save');
                    }
                }, 2000);
            }

            // Update campaign log mỗi 5 giây
            const now = Date.now();
            if (now - lastLogUpdate > 5000) {
                campaign.result.log = log;
                campaign.save().catch(err => console.error('Error updating campaign log:', err));
                lastLogUpdate = now;
            }
        });

        child.stderr.on('data', (data) => {
            const error = data.toString();
            log += error;
            console.log(`[Actor Error] ${error.trim()}`);
        });

        child.on('error', (error) => {
            console.log(`❌ Actor process error: ${error.message}`);
            clearTimeout(timeout);
            killActorProcess(child, 'error');
            reject(error);
        });

        child.on('exit', (code, signal) => {
            console.log(`🚪 Actor process exited with code: ${code}, signal: ${signal}`);

            // Nếu process bị kill bởi signal, log thông tin
            if (signal) {
                console.log(`⚠️ Actor process was terminated by signal: ${signal}`);
            }

            // Cleanup timeout nếu process exit sớm
            clearTimeout(timeout);
        });

        child.on('close', async (code) => {
            clearTimeout(timeout); // Clear timeout when process closes
            const endTime = Date.now();
            const duration = endTime - startTime;

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
                        console.log(`Đọc được ${output.length} sản phẩm từ hung.json`);
                    } catch (error) {
                        console.log('Không tìm thấy hung.json trong src/, thử đọc từ dataset');

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
                    console.log('No output files found or error reading output');
                }

                // Bỏ phần lưu dữ liệu vào database
                let savedDataCount = 0;

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
                    console.log('✅ Campaign completed successfully');
                } else {
                    campaign.status = 'failed';
                    campaign.result.error = `Actor exited with code ${code}`;
                    console.log(`❌ Campaign failed with exit code: ${code}`);
                }

                // Luôn kill process actor sau khi hoàn thành (thành công hoặc thất bại)
                killActorProcess(child, code === 0 ? 'completed' : 'failed');

                await campaign.updateResult(resultData);

                // Update run history
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

            } catch (error) {
                console.error('Error updating campaign result:', error);

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

            // Kill process actor khi có lỗi runtime
            killActorProcess(child, 'runtime_error');

            campaign.status = 'failed';
            campaign.result.error = error.message;
            campaign.result.endTime = new Date();
            campaign.result.duration = Date.now() - startTime;
            await campaign.save();
        });

    } catch (error) {
        console.error('Error in runActorAsync:', error);

        // Kill process nếu có lỗi trong quá trình setup
        if (typeof child !== 'undefined' && child) {
            killActorProcess(child, 'setup_error');
        }

        campaign.status = 'failed';
        campaign.result.error = error.message;
        campaign.result.endTime = new Date();
        await campaign.save();
    }
}

module.exports = {
    getAllCampaigns,
    getCampaignById,
    createCampaign,
    updateCampaign,
    runCampaign,
    getCampaignStatus,
    cancelCampaign,
    resetCampaign,
    deleteCampaign,
    cleanupAllNodeProcesses
};
