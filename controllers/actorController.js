const Actor = require('../models/Actor');
const { validationResult } = require('express-validator');

// @desc    Get all actors
// @route   GET /api/actors
// @access  Private
const getAllActors = async (req, res) => {
    try {
        const { page = 1, limit = 10, status, type, search, category, visibility, buildStatus, runStatus } = req.query;

        // Build filter
        const filter = {};
        if (status) filter.status = status;
        if (type) filter.type = type;
        if (category) filter.category = category;
        if (visibility) filter.visibility = visibility;
        if (buildStatus) filter['buildInfo.buildStatus'] = buildStatus;
        if (runStatus) filter['runInfo.runStatus'] = runStatus;
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { tags: { $in: [new RegExp(search, 'i')] } }
            ];
        }

        // Pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const actors = await Actor.find(filter)
            .populate('createdBy', 'name email')
            .populate('updatedBy', 'name email')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .lean();

        const total = await Actor.countDocuments(filter);

        res.json({
            success: true,
            data: actors,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Error getting actors:', error);
        res.status(500).json({
            success: false,
            error: 'Lỗi server khi lấy danh sách actors'
        });
    }
};

// @desc    Get actor by ID
// @route   GET /api/actors/:id
// @access  Private
const getActorById = async (req, res) => {
    try {
        const actor = await Actor.findById(req.params.id)
            .populate('createdBy', 'name email')
            .populate('updatedBy', 'name email');

        if (!actor) {
            return res.status(404).json({
                success: false,
                error: 'Không tìm thấy actor'
            });
        }

        res.json({
            success: true,
            data: actor
        });
    } catch (error) {
        console.error('Error getting actor:', error);
        res.status(500).json({
            success: false,
            error: 'Lỗi server khi lấy thông tin actor'
        });
    }
};

// @desc    Create new actor
// @route   POST /api/actors
// @access  Private (Admin, Editor)
const createActor = async (req, res) => {
    try {
        // Check validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                error: 'Dữ liệu không hợp lệ',
                details: errors.array().map(err => ({
                    field: err.path,
                    message: err.msg,
                    value: err.value
                }))
            });
        }

        const {
            name,
            description,
            type,
            config,
            code,
            status = 'ready',
            version = '0.0.1',
            tags = [],
            inputSchema,
            apifyMetadata,
            // New fields
            sourceCode,
            environmentVariables,
            visibility = 'private',
            category = 'web-scraping',
            license = 'MIT',
            gitInfo,
            public: isPublic = false
        } = req.body;

        // Check if actor name already exists
        const existingActor = await Actor.findOne({ name });
        if (existingActor) {
            return res.status(400).json({
                success: false,
                error: 'Tên actor đã tồn tại'
            });
        }

        // Xử lý file upload nếu có
        let fileInfo = null;
        let fileUploadInfo = null;
        if (req.file) {
            fileInfo = {
                filename: req.file.originalname,
                path: req.file.path,
                size: req.file.size,
                mimetype: req.file.mimetype
            };

            fileUploadInfo = {
                filename: req.file.filename,
                originalName: req.file.originalname,
                path: req.file.path,
                size: req.file.size,
                mimetype: req.file.mimetype,
                uploadedAt: new Date()
            };
        }

        // Parse inputSchema if it's a string
        let parsedInputSchema = inputSchema;
        if (typeof inputSchema === 'string') {
            try {
                parsedInputSchema = JSON.parse(inputSchema);
            } catch (error) {
                return res.status(400).json({
                    success: false,
                    error: 'Input schema không đúng định dạng JSON'
                });
            }
        }

        const actor = new Actor({
            name,
            description,
            type,
            config: config || {},
            code,
            file: fileInfo,
            fileUpload: fileUploadInfo,
            status,
            version,
            tags,
            inputSchema: parsedInputSchema || {
                title: 'Input Schema',
                type: 'object',
                schemaVersion: 1,
                properties: {},
                required: []
            },
            apifyMetadata: apifyMetadata || {},
            // New fields
            sourceCode: sourceCode || {
                main: '',
                package: '',
                inputSchema: '',
                actorConfig: '',
                lastModified: new Date()
            },
            environmentVariables: environmentVariables || [],
            visibility,
            category,
            license,
            gitInfo: gitInfo || {
                repository: '',
                branch: '',
                commitHash: '',
                lastSync: null
            },
            // File-based storage fields
            userId: req.user.id,
            path: `actors_storage/${req.user.id}/`, // Sẽ được cập nhật sau khi có actor._id
            files: [],
            public: isPublic,
            // Initialize build and run info
            buildInfo: {
                buildCount: 0,
                buildStatus: 'pending'
            },
            runInfo: {
                runCount: 0,
                runStatus: 'idle'
            },
            metrics: {
                averageRunTime: 0,
                successRate: 0,
                totalDataProcessed: 0
            },
            createdBy: req.user.id
        });

        await actor.save();

        // Tạo thư mục cho actor và giải nén file nếu có
        const fileSystemService = require('../services/fileSystemService');
        try {
            console.log(`Creating directory for actor: ${actor._id}, user: ${req.user.id}`);
            const actorPath = await fileSystemService.createActorDirectory(req.user.id, actor._id);
            console.log(`Actor directory created: ${actorPath}`);

            // Giải nén file nếu có
            if (req.file && req.file.mimetype === 'application/zip') {
                console.log(`Extracting zip file: ${req.file.path} to ${actorPath}`);
                await fileSystemService.extractZipFile(req.file.path, actorPath);
                console.log('Zip file extracted successfully');
            }

            // Cập nhật path trong database
            actor.path = `actors_storage/${req.user.id}/${actor._id}/`;
            await actor.save();

        } catch (error) {
            console.error('Error creating actor directory or extracting file:', error);
            console.error('Error details:', error.message);
            console.error('Stack trace:', error.stack);
        }

        // Populate creator info
        await actor.populate('createdBy', 'name email');

        res.status(201).json({
            success: true,
            data: actor
        });
    } catch (error) {
        console.error('Error creating actor:', error);
        res.status(500).json({
            success: false,
            error: 'Lỗi server khi tạo actor'
        });
    }
};

// @desc    Update actor
// @route   PUT /api/actors/:id
// @access  Private (Admin, Editor)
const updateActor = async (req, res) => {
    try {
        // Check validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                error: 'Dữ liệu không hợp lệ',
                details: errors.array().map(err => ({
                    field: err.path,
                    message: err.msg,
                    value: err.value
                }))
            });
        }

        const actor = await Actor.findById(req.params.id);
        if (!actor) {
            return res.status(404).json({
                success: false,
                error: 'Không tìm thấy actor'
            });
        }

        const {
            name,
            description,
            type,
            config,
            code,
            status,
            version,
            tags
        } = req.body;

        // Check if new name conflicts with existing actor
        if (name && name !== actor.name) {
            const existingActor = await Actor.findOne({ name, _id: { $ne: req.params.id } });
            if (existingActor) {
                return res.status(400).json({
                    success: false,
                    error: 'Tên actor đã tồn tại'
                });
            }
        }

        // Update fields
        if (name !== undefined) actor.name = name;
        if (description !== undefined) actor.description = description;
        if (type !== undefined) actor.type = type;
        if (config !== undefined) actor.config = { ...actor.config, ...config };
        if (code !== undefined) actor.code = code;
        if (status !== undefined) actor.status = status;
        if (version !== undefined) actor.version = version;
        if (tags !== undefined) actor.tags = tags;

        actor.updatedBy = req.user.id;

        await actor.save();

        // Populate user info
        await actor.populate('createdBy', 'name email');
        await actor.populate('updatedBy', 'name email');

        res.json({
            success: true,
            data: actor
        });
    } catch (error) {
        console.error('Error updating actor:', error);
        res.status(500).json({
            success: false,
            error: 'Lỗi server khi cập nhật actor'
        });
    }
};

// @desc    Delete actor
// @route   DELETE /api/actors/:id
// @access  Private (Admin)
const deleteActor = async (req, res) => {
    try {
        const actor = await Actor.findById(req.params.id);
        if (!actor) {
            return res.status(404).json({
                success: false,
                error: 'Không tìm thấy actor'
            });
        }

        // Check if actor is being used by any sources
        const Source = require('../models/Source');
        const sourceCount = await Source.countDocuments({ actorId: req.params.id });

        if (sourceCount > 0) {
            return res.status(400).json({
                success: false,
                error: `Không thể xóa actor vì đang được sử dụng bởi ${sourceCount} source(s)`
            });
        }

        // Xóa thư mục actor nếu có
        const fileSystemService = require('../services/fileSystemService');
        try {
            if (actor.userId) {
                await fileSystemService.deleteActorDirectory(actor.userId, actor._id);
            }
        } catch (error) {
            console.error('Error deleting actor directory:', error);
        }

        await Actor.findByIdAndDelete(req.params.id);

        res.json({
            success: true,
            message: 'Actor đã được xóa thành công'
        });
    } catch (error) {
        console.error('Error deleting actor:', error);
        res.status(500).json({
            success: false,
            error: 'Lỗi server khi xóa actor'
        });
    }
};

// @desc    Get actor statistics
// @route   GET /api/actors/stats/overview
// @access  Private
const getActorStats = async (req, res) => {
    try {
        const stats = await Actor.aggregate([
            {
                $group: {
                    _id: null,
                    total: { $sum: 1 },
                    active: {
                        $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
                    },
                    inactive: {
                        $sum: { $cond: [{ $eq: ['$status', 'inactive'] }, 1, 0] }
                    },
                    draft: {
                        $sum: { $cond: [{ $eq: ['$status', 'draft'] }, 1, 0] }
                    }
                }
            }
        ]);

        const typeStats = await Actor.aggregate([
            {
                $group: {
                    _id: '$type',
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } }
        ]);

        res.json({
            success: true,
            data: {
                overview: stats[0] || { total: 0, active: 0, inactive: 0, draft: 0 },
                byType: typeStats
            }
        });
    } catch (error) {
        console.error('Error getting actor stats:', error);
        res.status(500).json({
            success: false,
            error: 'Lỗi server khi lấy thống kê actors'
        });
    }
};

// @desc    Download actor file
// @route   GET /api/actors/:id/download
// @access  Private
const downloadActorFile = async (req, res) => {
    try {
        const actor = await Actor.findById(req.params.id);

        if (!actor) {
            return res.status(404).json({
                success: false,
                error: 'Không tìm thấy actor'
            });
        }

        if (!actor.file || !actor.file.path) {
            return res.status(404).json({
                success: false,
                error: 'Actor không có file đính kèm'
            });
        }

        const fs = require('fs');
        const path = require('path');

        // Kiểm tra file có tồn tại không
        if (!fs.existsSync(actor.file.path)) {
            return res.status(404).json({
                success: false,
                error: 'File không tồn tại trên server'
            });
        }

        // Set headers cho download
        res.setHeader('Content-Type', actor.file.mimetype);
        res.setHeader('Content-Disposition', `attachment; filename="${actor.file.filename}"`);
        res.setHeader('Content-Length', actor.file.size);

        // Stream file
        const fileStream = fs.createReadStream(actor.file.path);
        fileStream.pipe(res);
    } catch (error) {
        console.error('Error downloading actor file:', error);
        res.status(500).json({
            success: false,
            error: 'Lỗi server khi download file'
        });
    }
};

// @desc    Build actor
// @route   POST /api/actors/:id/build
// @access  Private (Admin, Editor)
const buildActor = async (req, res) => {
    try {
        const actor = await Actor.findById(req.params.id);
        if (!actor) {
            return res.status(404).json({
                success: false,
                error: 'Không tìm thấy actor'
            });
        }

        // Update build status
        actor.buildInfo.buildStatus = 'building';
        actor.buildInfo.lastBuildAt = new Date();
        actor.buildInfo.buildCount += 1;
        actor.buildInfo.buildLog = 'Starting build process...';
        actor.buildInfo.buildError = null;

        await actor.save();

        // Simulate build process (in real implementation, this would be async)
        setTimeout(async () => {
            try {
                // Simulate successful build
                actor.buildInfo.buildStatus = 'success';
                actor.buildInfo.buildLog = 'Build completed successfully';
                actor.status = 'ready';
                await actor.save();
            } catch (error) {
                console.error('Build simulation error:', error);
            }
        }, 3000);

        res.json({
            success: true,
            data: {
                buildId: actor.buildInfo.buildCount,
                status: 'building',
                message: 'Build process started'
            }
        });
    } catch (error) {
        console.error('Error building actor:', error);
        res.status(500).json({
            success: false,
            error: 'Lỗi server khi build actor'
        });
    }
};

// @desc    Run actor
// @route   POST /api/actors/:id/run
// @access  Private (Admin, Editor)
const runActor = async (req, res) => {
    try {
        const { input } = req.body;

        const actor = await Actor.findById(req.params.id);
        if (!actor) {
            return res.status(404).json({
                success: false,
                error: 'Không tìm thấy actor'
            });
        }

        // Check if actor is ready to run
        if (actor.status !== 'ready' && actor.buildInfo.buildStatus !== 'success') {
            return res.status(400).json({
                success: false,
                error: 'Actor chưa sẵn sàng để chạy. Vui lòng build trước.'
            });
        }

        // Update run status
        const runId = `run_${Date.now()}`;
        actor.runInfo.runStatus = 'running';
        actor.runInfo.lastRunAt = new Date();
        actor.runInfo.runCount += 1;
        actor.runInfo.currentRunId = runId;
        actor.runInfo.runLog = 'Starting actor execution...';
        actor.runInfo.runError = null;
        actor.status = 'running';

        await actor.save();

        // Simulate run process (in real implementation, this would be async)
        setTimeout(async () => {
            try {
                // Simulate successful run
                actor.runInfo.runStatus = 'completed';
                actor.runInfo.runLog = 'Actor execution completed successfully';
                actor.status = 'ready';

                // Update metrics
                actor.metrics.totalDataProcessed += 100; // Simulate data processed
                actor.metrics.lastPerformanceUpdate = new Date();

                await actor.save();
            } catch (error) {
                console.error('Run simulation error:', error);
            }
        }, 5000);

        res.json({
            success: true,
            data: {
                runId,
                status: 'running',
                message: 'Actor execution started',
                input: input || {}
            }
        });
    } catch (error) {
        console.error('Error running actor:', error);
        res.status(500).json({
            success: false,
            error: 'Lỗi server khi chạy actor'
        });
    }
};

// @desc    Get actor build history
// @route   GET /api/actors/:id/builds
// @access  Private (Admin, Editor)
const getActorBuilds = async (req, res) => {
    try {
        const actor = await Actor.findById(req.params.id);
        if (!actor) {
            return res.status(404).json({
                success: false,
                error: 'Không tìm thấy actor'
            });
        }

        res.json({
            success: true,
            data: {
                buildInfo: actor.buildInfo,
                totalBuilds: actor.buildInfo.buildCount
            }
        });
    } catch (error) {
        console.error('Error getting actor builds:', error);
        res.status(500).json({
            success: false,
            error: 'Lỗi server khi lấy thông tin build'
        });
    }
};

// @desc    Get actor run history
// @route   GET /api/actors/:id/runs
// @access  Private (Admin, Editor)
const getActorRuns = async (req, res) => {
    try {
        const actor = await Actor.findById(req.params.id);
        if (!actor) {
            return res.status(404).json({
                success: false,
                error: 'Không tìm thấy actor'
            });
        }

        res.json({
            success: true,
            data: {
                runInfo: actor.runInfo,
                totalRuns: actor.runInfo.runCount,
                metrics: actor.metrics
            }
        });
    } catch (error) {
        console.error('Error getting actor runs:', error);
        res.status(500).json({
            success: false,
            error: 'Lỗi server khi lấy thông tin run'
        });
    }
};

// @desc    Update actor source code
// @route   PUT /api/actors/:id/source
// @access  Private (Admin, Editor)
const updateActorSource = async (req, res) => {
    try {
        const { main, package, inputSchema, actorConfig } = req.body;

        const actor = await Actor.findById(req.params.id);
        if (!actor) {
            return res.status(404).json({
                success: false,
                error: 'Không tìm thấy actor'
            });
        }

        // Update source code
        if (main !== undefined) actor.sourceCode.main = main;
        if (package !== undefined) actor.sourceCode.package = package;
        if (inputSchema !== undefined) actor.sourceCode.inputSchema = inputSchema;
        if (actorConfig !== undefined) actor.sourceCode.actorConfig = actorConfig;

        actor.sourceCode.lastModified = new Date();
        actor.updatedBy = req.user.id;

        await actor.save();

        res.json({
            success: true,
            data: actor.sourceCode,
            message: 'Source code đã được cập nhật thành công'
        });
    } catch (error) {
        console.error('Error updating actor source:', error);
        res.status(500).json({
            success: false,
            error: 'Lỗi server khi cập nhật source code'
        });
    }
};

// @desc    Save source code for specific file
// @route   POST /api/actors/:id/source/file
// @access  Private (Admin, Editor)
const saveSourceFile = async (req, res) => {
    try {
        const { filePath, content } = req.body;

        const actor = await Actor.findById(req.params.id);
        if (!actor) {
            return res.status(404).json({
                success: false,
                error: 'Không tìm thấy actor'
            });
        }

        // Update source code for specific file
        if (!actor.sourceCode) {
            actor.sourceCode = {};
        }

        actor.sourceCode[filePath] = content;
        actor.sourceCode.lastModified = new Date();
        actor.updatedBy = req.user.id;

        await actor.save();

        res.json({
            success: true,
            message: 'File đã được lưu thành công',
            data: {
                filePath,
                content,
                lastModified: actor.sourceCode.lastModified
            }
        });
    } catch (error) {
        console.error('Error saving source file:', error);
        res.status(500).json({
            success: false,
            error: 'Lỗi server khi lưu file'
        });
    }
};

// @desc    Get source code for specific file
// @route   GET /api/actors/:id/source/file
// @access  Private (Admin, Editor)
const getSourceFile = async (req, res) => {
    try {
        const { filePath } = req.query;

        const actor = await Actor.findById(req.params.id);
        if (!actor) {
            return res.status(404).json({
                success: false,
                error: 'Không tìm thấy actor'
            });
        }

        const content = actor.sourceCode?.[filePath] || '';

        // Determine language based on file extension
        const getLanguage = (path) => {
            const ext = path.split('.').pop().toLowerCase();
            switch (ext) {
                case 'js': return 'javascript';
                case 'json': return 'json';
                case 'html': return 'html';
                case 'css': return 'css';
                case 'py': return 'python';
                case 'java': return 'java';
                case 'cpp': return 'cpp';
                case 'c': return 'c';
                case 'php': return 'php';
                case 'rb': return 'ruby';
                case 'go': return 'go';
                case 'rs': return 'rust';
                case 'ts': return 'typescript';
                case 'jsx': return 'javascript';
                case 'tsx': return 'typescript';
                default: return 'text';
            }
        };

        res.json({
            success: true,
            data: {
                filePath,
                content,
                language: getLanguage(filePath),
                lastModified: actor.sourceCode?.lastModified
            }
        });
    } catch (error) {
        console.error('Error getting source file:', error);
        res.status(500).json({
            success: false,
            error: 'Lỗi server khi lấy file'
        });
    }
};

// @desc    Run actor with streaming output
// @route   POST /api/actors/:id/run/stream
// @access  Private (Admin, Editor)
const runActorStream = async (req, res) => {
    try {
        const { input } = req.body;
        const { spawn } = require('child_process');
        const fs = require('fs').promises;
        const path = require('path');
        const os = require('os');

        const actor = await Actor.findById(req.params.id);
        if (!actor) {
            return res.status(404).json({
                success: false,
                error: 'Không tìm thấy actor'
            });
        }

        // Check if actor has source code
        if (!actor.sourceCode?.main) {
            return res.status(400).json({
                success: false,
                error: 'Actor chưa có source code'
            });
        }

        // Update run status
        const runId = `run_${Date.now()}`;
        actor.runInfo.runStatus = 'running';
        actor.runInfo.lastRunAt = new Date();
        actor.runInfo.runCount += 1;
        actor.runInfo.currentRunId = runId;
        actor.runInfo.runLog = 'Starting actor execution...';
        actor.runInfo.runError = null;
        actor.status = 'running';

        await actor.save();

        // Tạo temporary directory
        const tempDir = path.join(os.tmpdir(), `actor-${actor._id}-${Date.now()}`);
        await fs.mkdir(tempDir, { recursive: true });

        try {
            // Lưu source code vào file
            const mainFile = path.join(tempDir, 'main.js');
            await fs.writeFile(mainFile, actor.sourceCode.main);

            // Tạo package.json nếu có
            if (actor.sourceCode.package) {
                const packageFile = path.join(tempDir, 'package.json');
                await fs.writeFile(packageFile, actor.sourceCode.package);
            }

            // Tạo input.json nếu có input
            if (input) {
                const inputFile = path.join(tempDir, 'input.json');
                await fs.writeFile(inputFile, JSON.stringify(input, null, 2));
            }

            // Set headers cho streaming
            res.setHeader('Content-Type', 'text/plain');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

            // Send initial status
            res.write(`[INFO] Starting actor: ${actor.name}\n`);
            res.write(`[INFO] Run ID: ${runId}\n`);
            res.write(`[INFO] Input: ${JSON.stringify(input || {})}\n`);
            res.write(`[INFO] Working directory: ${tempDir}\n\n`);

            // Chạy actor với child_process
            const child = spawn('node', ['main.js'], {
                cwd: tempDir,
                env: {
                    ...process.env,
                    APIFY_INPUT: JSON.stringify(input || {}),
                    NODE_ENV: 'production',
                    ACTOR_ID: actor._id.toString(),
                    RUN_ID: runId
                },
                stdio: ['pipe', 'pipe', 'pipe']
            });

            // Stream output
            child.stdout.on('data', (data) => {
                const output = data.toString();
                res.write(`[OUT] ${output}`);
            });

            child.stderr.on('data', (data) => {
                const error = data.toString();
                res.write(`[ERR] ${error}`);
            });

            child.on('close', async (code) => {
                res.write(`\n[END] Process exited with code ${code}\n`);
                res.write(`[INFO] Execution completed\n`);
                res.end();

                // Update status
                actor.runInfo.runStatus = code === 0 ? 'completed' : 'failed';
                actor.runInfo.runLog = code === 0 ? 'Actor execution completed successfully' : `Actor execution failed with code ${code}`;
                actor.status = code === 0 ? 'ready' : 'error';

                // Update metrics
                if (code === 0) {
                    actor.metrics.totalDataProcessed += 100; // Simulate data processed
                    actor.metrics.lastPerformanceUpdate = new Date();
                }

                await actor.save();

                // Cleanup
                try {
                    await fs.rm(tempDir, { recursive: true, force: true });
                } catch (cleanupError) {
                    console.error('Cleanup error:', cleanupError);
                }
            });

            child.on('error', async (error) => {
                res.write(`\n[ERROR] ${error.message}\n`);
                res.write(`[INFO] Execution failed\n`);
                res.end();

                // Update status
                actor.runInfo.runStatus = 'failed';
                actor.runInfo.runError = error.message;
                actor.status = 'error';
                await actor.save();

                // Cleanup
                try {
                    await fs.rm(tempDir, { recursive: true, force: true });
                } catch (cleanupError) {
                    console.error('Cleanup error:', cleanupError);
                }
            });

        } catch (error) {
            // Update status on error
            actor.runInfo.runStatus = 'failed';
            actor.runInfo.runError = error.message;
            actor.status = 'error';
            await actor.save();

            res.status(500).json({
                success: false,
                error: error.message
            });
        }

    } catch (error) {
        console.error('Error running actor stream:', error);
        res.status(500).json({
            success: false,
            error: 'Lỗi server khi chạy actor'
        });
    }
};

// @desc    Get all source files for actor
// @route   GET /api/actors/:id/source/files
// @access  Private (Admin, Editor)
const getSourceFiles = async (req, res) => {
    try {
        const actor = await Actor.findById(req.params.id);
        if (!actor) {
            return res.status(404).json({
                success: false,
                error: 'Không tìm thấy actor'
            });
        }

        const files = [];
        if (actor.sourceCode) {
            Object.keys(actor.sourceCode).forEach(filePath => {
                if (filePath !== 'lastModified') {
                    files.push({
                        path: filePath,
                        name: filePath.split('/').pop(),
                        type: 'file'
                    });
                }
            });
        }

        res.json({
            success: true,
            data: {
                files,
                lastModified: actor.sourceCode?.lastModified
            }
        });
    } catch (error) {
        console.error('Error getting source files:', error);
        res.status(500).json({
            success: false,
            error: 'Lỗi server khi lấy danh sách files'
        });
    }
};

module.exports = {
    getAllActors,
    getActorById,
    createActor,
    updateActor,
    deleteActor,
    getActorStats,
    downloadActorFile,
    runActor,
    getActorRuns,
    buildActor,
    getActorBuilds,
    updateActorSource,
    // Thêm các API mới
    saveSourceFile,
    getSourceFile,
    runActorStream,
    getSourceFiles
}; 