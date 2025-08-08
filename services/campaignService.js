const Campaign = require('../models/Campaign');
const Actor = require('../models/Actor');
const fs = require('fs').promises;
const path = require('path');
const { spawn } = require('child_process');

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
        if (typeof input === 'object' && input !== null) {
            // Merge with existing input (partial update)
            campaign.input = { ...campaign.input, ...input };
            console.log('Input merged successfully:', Object.keys(input));
        } else {
            campaign.input = input;
        }
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
const runCampaign = async (campaignId) => {
    const campaign = await Campaign.findById(campaignId)
        .populate('actorId');

    if (!campaign) {
        throw new Error('Không tìm thấy campaign');
    }

    // Check if campaign is already running
    if (campaign.status === 'running') {
        throw new Error('Campaign đang chạy');
    }

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

    // Run actor asynchronously
    runActorAsync(campaign, runId);

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

// Helper function để chạy actor
async function runActorAsync(campaign, runId) {
    try {
        const actor = campaign.actorId;
        const actorPath = path.join(process.cwd(), 'actors_storage', actor.userId.toString(), actor._id.toString());

        // Tạo thư mục apify_storage nếu chưa có
        const apifyStoragePath = path.join(actorPath, 'apify_storage');
        const keyValueStorePath = path.join(apifyStoragePath, 'key_value_stores', 'default');
        const datasetPath = path.join(apifyStoragePath, 'datasets', 'default');

        await fs.mkdir(keyValueStorePath, { recursive: true });
        await fs.mkdir(datasetPath, { recursive: true });

        // Ghi input vào input.json trong thư mục src của actor (vì actor chạy từ src)
        const inputPath = path.join(actorPath, 'src', 'input.json');
        await fs.writeFile(inputPath, JSON.stringify(campaign.input, null, 2));

        // Cũng ghi vào apify_storage để tương thích
        const apifyInputPath = path.join(keyValueStorePath, 'INPUT.json');
        await fs.writeFile(apifyInputPath, JSON.stringify(campaign.input, null, 2));

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
        const child = spawn('node', ['main.js'], {
            cwd: path.join(actorPath, 'src'),
            stdio: ['pipe', 'pipe', 'pipe']
        });

        let log = '';
        let startTime = Date.now();

        child.stdout.on('data', (data) => {
            log += data.toString();
        });

        child.stderr.on('data', (data) => {
            log += data.toString();
        });

        child.on('close', async (code) => {
            const endTime = Date.now();
            const duration = endTime - startTime;

            try {
                // Đọc kết quả từ file hung.json hoặc dataset
                let output = [];
                try {
                    // Thử đọc từ file hung.json trước
                    const hungJsonPath = path.join(actorPath, 'hung.json');
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
                        console.log('Không tìm thấy hung.json, thử đọc từ dataset');

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

                // Update campaign result
                const resultData = {
                    log: log,
                    output: output,
                    endTime: new Date(),
                    duration: duration,
                    recordsProcessed: output.length
                };

                if (code === 0) {
                    campaign.status = 'completed';
                    campaign.result.error = null;
                } else {
                    campaign.status = 'failed';
                    campaign.result.error = `Actor exited with code ${code}`;
                }

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

            campaign.status = 'failed';
            campaign.result.error = error.message;
            campaign.result.endTime = new Date();
            campaign.result.duration = Date.now() - startTime;
            await campaign.save();
        });

    } catch (error) {
        console.error('Error in runActorAsync:', error);

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
    deleteCampaign
};
