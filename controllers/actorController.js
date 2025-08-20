const Actor = require('../models/Actor');
const { validationResult } = require('express-validator');
const fs = require('fs').promises;
const path = require('path');
const archiver = require('archiver');
const extract = require('extract-zip');

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

        // Simulate run process with detailed logs
        console.log('🚀 Starting actor simulation with detailed logs...');

        setTimeout(async () => {
            try {
                // Simulate detailed actor logs
                const detailedLogs = `Node.js v20.5.1
PS D:\\google-search-craw> npm start

> google-search-scraper@1.0.0 start
> node src/main.js

INFO CheerioCrawler: Starting the crawler.
INFO CheerioCrawler: Querying "gạch ốp lát giá rẻ" page 1...
INFO CheerioCrawler: Finished query "gạch ốp lát giá rẻ" page 1 (organicResults: 10, paidResults: 0, paidProducts: 0, relatedQueries: 0, aiOverview: 0)
INFO CheerioCrawler: All requests from the queue have been processed, the crawler will shut down.
INFO CheerioCrawler: Final request statistics: {"requestsFinished":1,"requestsFailed":0,"retryHistogram":[1],"requestAvgFailedDurationMillis":null,"requestAvgFinishedDurationMillis":1670,"requestsFinishedPerMinute":27,"requestsFailedPerMinute":0,"requestTotalDurationMillis":1670,"crawlerRuntimeMillis":2256}
INFO CheerioCrawler: Finished! Total 1 requests: 1 succeeded, 0 failed. {"terminal":true}
✅ Successfully scraped 10 total results
📁 Results saved to: D:\\google-search-craw\\output-search-terms.json
📁 Hung format saved to: hung.json
PS D:\\google-search-craw>`;

                // Simulate successful run
                actor.runInfo.runStatus = 'completed';
                actor.runInfo.runLog = detailedLogs;
                actor.status = 'ready';

                // Update metrics
                if (!actor.metrics) {
                    actor.metrics = {};
                }
                actor.metrics.totalDataProcessed = (actor.metrics.totalDataProcessed || 0) + 10; // 10 results scraped
                actor.metrics.lastPerformanceUpdate = new Date();

                await actor.save();
                console.log('✅ Actor simulation completed with detailed logs');
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

// @desc    Get actor logs
// @route   GET /api/actors/:id/logs
// @access  Private (Admin, Editor)
const getActorLogs = async (req, res) => {
    try {
        const actor = await Actor.findById(req.params.id);
        if (!actor) {
            return res.status(404).json({
                success: false,
                error: 'Không tìm thấy actor'
            });
        }

        // Tạo logs chi tiết từ thông tin actor
        const logs = {
            actorId: actor._id,
            actorName: actor.name,
            status: actor.status,
            buildInfo: {
                buildStatus: actor.buildInfo?.buildStatus,
                buildCount: actor.buildInfo?.buildCount,
                lastBuildAt: actor.buildInfo?.lastBuildAt,
                buildLog: actor.buildInfo?.buildLog || 'No build logs available'
            },
            runInfo: {
                runStatus: actor.runInfo?.runStatus,
                runCount: actor.runInfo?.runCount,
                lastRunAt: actor.runInfo?.lastRunAt,
                runLog: actor.runInfo?.runLog || 'No run logs available',
                currentRunId: actor.runInfo?.currentRunId
            },
            metrics: {
                totalDataProcessed: actor.metrics?.totalDataProcessed || 0,
                lastPerformanceUpdate: actor.metrics?.lastPerformanceUpdate,
                averageExecutionTime: actor.metrics?.averageExecutionTime || 0,
                successRate: actor.metrics?.successRate || 100
            },
            sourceCode: {
                lastModified: actor.sourceCode?.lastModified,
                mainFileSize: actor.sourceCode?.main?.length || 0,
                hasPackageJson: !!actor.sourceCode?.package,
                hasInputSchema: !!actor.sourceCode?.inputSchema
            },
            file: {
                filename: actor.file?.filename,
                size: actor.file?.size,
                uploadedAt: actor.fileUpload?.uploadedAt
            },
            timestamps: {
                createdAt: actor.createdAt,
                updatedAt: actor.updatedAt,
                lastActivity: actor.runInfo?.lastRunAt || actor.updatedAt
            }
        };

        res.json({
            success: true,
            data: logs
        });
    } catch (error) {
        console.error('Error getting actor logs:', error);
        res.status(500).json({
            success: false,
            error: 'Lỗi server khi lấy logs của actor'
        });
    }
};

// @desc    Get actor results (scraped data)
// @route   GET /api/actors/:id/results
// @access  Private (Admin, Editor)
const getActorResults = async (req, res) => {
    try {
        const actor = await Actor.findById(req.params.id);
        if (!actor) {
            return res.status(404).json({
                success: false,
                error: 'Không tìm thấy actor'
            });
        }

        // Simulate scraped data based on the actor's last run
        const simulatedResults = {
            actorId: actor._id,
            actorName: actor.name,
            lastRunId: actor.runInfo?.currentRunId,
            lastRunAt: actor.runInfo?.lastRunAt,
            totalResults: 10,
            files: {
                outputSearchTerms: {
                    filename: 'output-search-terms.json',
                    content: [
                        {
                            title: 'Gạch ốp lát giá rẻ - Chất lượng cao, Giá tốt nhất',
                            url: 'https://example.com/gach-op-lat-gia-re',
                            snippet: 'Gạch ốp lát giá rẻ với chất lượng cao, đa dạng mẫu mã, giá cả cạnh tranh. Giao hàng toàn quốc, thanh toán khi nhận hàng.',
                            position: 1
                        },
                        {
                            title: 'Gạch ốp lát giá rẻ Hà Nội - Công ty TNHH ABC',
                            url: 'https://example.com/gach-op-lat-ha-noi',
                            snippet: 'Chuyên cung cấp gạch ốp lát giá rẻ tại Hà Nội. Nhiều mẫu mã đẹp, giá cả hợp lý, dịch vụ chuyên nghiệp.',
                            position: 2
                        },
                        {
                            title: 'Gạch ốp lát giá rẻ TP.HCM - Showroom XYZ',
                            url: 'https://example.com/gach-op-lat-tphcm',
                            snippet: 'Showroom gạch ốp lát giá rẻ tại TP.HCM. Trưng bày hơn 1000 mẫu gạch, tư vấn miễn phí, giao hàng nhanh.',
                            position: 3
                        },
                        {
                            title: 'Gạch ốp lát giá rẻ Đà Nẵng - Cửa hàng DEF',
                            url: 'https://example.com/gach-op-lat-da-nang',
                            snippet: 'Cửa hàng gạch ốp lát giá rẻ tại Đà Nẵng. Cam kết chất lượng, giá tốt nhất thị trường.',
                            position: 4
                        },
                        {
                            title: 'Gạch ốp lát giá rẻ Cần Thơ - Nhà phân phối GHI',
                            url: 'https://example.com/gach-op-lat-can-tho',
                            snippet: 'Nhà phân phối gạch ốp lát giá rẻ tại Cần Thơ. Đa dạng thương hiệu, giá cả cạnh tranh.',
                            position: 5
                        },
                        {
                            title: 'Gạch ốp lát giá rẻ Hải Phòng - Công ty JKL',
                            url: 'https://example.com/gach-op-lat-hai-phong',
                            snippet: 'Công ty chuyên cung cấp gạch ốp lát giá rẻ tại Hải Phòng. Uy tín, chất lượng, giá tốt.',
                            position: 6
                        },
                        {
                            title: 'Gạch ốp lát giá rẻ Nha Trang - Showroom MNO',
                            url: 'https://example.com/gach-op-lat-nha-trang',
                            snippet: 'Showroom gạch ốp lát giá rẻ tại Nha Trang. Nhiều mẫu mã đẹp, giá cả hợp lý.',
                            position: 7
                        },
                        {
                            title: 'Gạch ốp lát giá rẻ Vũng Tàu - Cửa hàng PQR',
                            url: 'https://example.com/gach-op-lat-vung-tau',
                            snippet: 'Cửa hàng gạch ốp lát giá rẻ tại Vũng Tàu. Chất lượng cao, giá cả cạnh tranh.',
                            position: 8
                        },
                        {
                            title: 'Gạch ốp lát giá rẻ Huế - Nhà phân phối STU',
                            url: 'https://example.com/gach-op-lat-hue',
                            snippet: 'Nhà phân phối gạch ốp lát giá rẻ tại Huế. Đa dạng mẫu mã, giá tốt nhất.',
                            position: 9
                        },
                        {
                            title: 'Gạch ốp lát giá rẻ Quảng Nam - Công ty VWX',
                            url: 'https://example.com/gach-op-lat-quang-nam',
                            snippet: 'Công ty chuyên cung cấp gạch ốp lát giá rẻ tại Quảng Nam. Uy tín, chất lượng.',
                            position: 10
                        }
                    ]
                },
                hungFormat: {
                    filename: 'hung.json',
                    content: {
                        searchTerm: 'gạch ốp lát giá rẻ',
                        totalResults: 10,
                        searchDate: new Date().toISOString(),
                        results: [
                            {
                                title: 'Gạch ốp lát giá rẻ - Chất lượng cao, Giá tốt nhất',
                                url: 'https://example.com/gach-op-lat-gia-re',
                                description: 'Gạch ốp lát giá rẻ với chất lượng cao, đa dạng mẫu mã, giá cả cạnh tranh. Giao hàng toàn quốc, thanh toán khi nhận hàng.',
                                position: 1,
                                domain: 'example.com'
                            },
                            {
                                title: 'Gạch ốp lát giá rẻ Hà Nội - Công ty TNHH ABC',
                                url: 'https://example.com/gach-op-lat-ha-noi',
                                description: 'Chuyên cung cấp gạch ốp lát giá rẻ tại Hà Nội. Nhiều mẫu mã đẹp, giá cả hợp lý, dịch vụ chuyên nghiệp.',
                                position: 2,
                                domain: 'example.com'
                            },
                            {
                                title: 'Gạch ốp lát giá rẻ TP.HCM - Showroom XYZ',
                                url: 'https://example.com/gach-op-lat-tphcm',
                                description: 'Showroom gạch ốp lát giá rẻ tại TP.HCM. Trưng bày hơn 1000 mẫu gạch, tư vấn miễn phí, giao hàng nhanh.',
                                position: 3,
                                domain: 'example.com'
                            },
                            {
                                title: 'Gạch ốp lát giá rẻ Đà Nẵng - Cửa hàng DEF',
                                url: 'https://example.com/gach-op-lat-da-nang',
                                description: 'Cửa hàng gạch ốp lát giá rẻ tại Đà Nẵng. Cam kết chất lượng, giá tốt nhất thị trường.',
                                position: 4,
                                domain: 'example.com'
                            },
                            {
                                title: 'Gạch ốp lát giá rẻ Cần Thơ - Nhà phân phối GHI',
                                url: 'https://example.com/gach-op-lat-can-tho',
                                description: 'Nhà phân phối gạch ốp lát giá rẻ tại Cần Thơ. Đa dạng thương hiệu, giá cả cạnh tranh.',
                                position: 5,
                                domain: 'example.com'
                            },
                            {
                                title: 'Gạch ốp lát giá rẻ Hải Phòng - Công ty JKL',
                                url: 'https://example.com/gach-op-lat-hai-phong',
                                description: 'Công ty chuyên cung cấp gạch ốp lát giá rẻ tại Hải Phòng. Uy tín, chất lượng, giá tốt.',
                                position: 6,
                                domain: 'example.com'
                            },
                            {
                                title: 'Gạch ốp lát giá rẻ Nha Trang - Showroom MNO',
                                url: 'https://example.com/gach-op-lat-nha-trang',
                                description: 'Showroom gạch ốp lát giá rẻ tại Nha Trang. Nhiều mẫu mã đẹp, giá cả hợp lý.',
                                position: 7,
                                domain: 'example.com'
                            },
                            {
                                title: 'Gạch ốp lát giá rẻ Vũng Tàu - Cửa hàng PQR',
                                url: 'https://example.com/gach-op-lat-vung-tau',
                                description: 'Cửa hàng gạch ốp lát giá rẻ tại Vũng Tàu. Chất lượng cao, giá cả cạnh tranh.',
                                position: 8,
                                domain: 'example.com'
                            },
                            {
                                title: 'Gạch ốp lát giá rẻ Huế - Nhà phân phối STU',
                                url: 'https://example.com/gach-op-lat-hue',
                                description: 'Nhà phân phối gạch ốp lát giá rẻ tại Huế. Đa dạng mẫu mã, giá tốt nhất.',
                                position: 9,
                                domain: 'example.com'
                            },
                            {
                                title: 'Gạch ốp lát giá rẻ Quảng Nam - Công ty VWX',
                                url: 'https://example.com/gach-op-lat-quang-nam',
                                description: 'Công ty chuyên cung cấp gạch ốp lát giá rẻ tại Quảng Nam. Uy tín, chất lượng.',
                                position: 10,
                                domain: 'example.com'
                            }
                        ]
                    }
                }
            },
            statistics: {
                totalResults: 10,
                searchTerm: 'gạch ốp lát giá rẻ',
                searchDate: new Date().toISOString(),
                executionTime: '2.256 seconds',
                successRate: '100%'
            }
        };

        res.json({
            success: true,
            data: simulatedResults
        });
    } catch (error) {
        console.error('Error getting actor results:', error);
        res.status(500).json({
            success: false,
            error: 'Lỗi server khi lấy kết quả của actor'
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

// @desc    Add actor from local folder path
// @route   POST /api/actors/from-folder
// @access  Private (Admin, Editor)
const addActorFromFolder = async (req, res) => {
    try {
        console.log('🔄 Starting addActorFromFolder...');
        const { folderPath, name, description, type = 'web-scraping', category = 'web-scraping', visibility = 'private', tags = [] } = req.body;

        console.log('📋 Request data:', { folderPath, name, description, type, category, visibility });

        // Validate required fields
        if (!folderPath || !name) {
            return res.status(400).json({
                success: false,
                error: 'Đường dẫn folder và tên actor là bắt buộc'
            });
        }

        // Check if actor name already exists
        const existingActor = await Actor.findOne({ name });
        if (existingActor) {
            return res.status(400).json({
                success: false,
                error: 'Tên actor đã tồn tại'
            });
        }

        // Validate folder path exists
        try {
            console.log('🔍 Checking folder path:', folderPath);
            const stats = await fs.stat(folderPath);
            if (!stats.isDirectory()) {
                console.log('❌ Path is not a directory');
                return res.status(400).json({
                    success: false,
                    error: 'Đường dẫn không phải là folder'
                });
            }
            console.log('✅ Folder path is valid');
        } catch (error) {
            console.log('❌ Folder path error:', error.message);
            return res.status(400).json({
                success: false,
                error: 'Không tìm thấy folder hoặc không có quyền truy cập'
            });
        }

        // Read package.json if exists
        let packageJson = null;
        let inputSchema = null;
        let actorConfig = null;
        let mainFile = 'main.js';

        try {
            const packagePath = path.join(folderPath, 'package.json');
            const packageContent = await fs.readFile(packagePath, 'utf8');
            packageJson = JSON.parse(packageContent);

            // Try to find main file from package.json
            if (packageJson.main) {
                mainFile = packageJson.main;
            }
        } catch (error) {
            console.log('No package.json found or invalid, using default main.js');
        }

        // Read input.json if exists
        try {
            const inputPath = path.join(folderPath, 'input.json');
            const inputContent = await fs.readFile(inputPath, 'utf8');
            inputSchema = JSON.parse(inputContent);
        } catch (error) {
            console.log('No input.json found, using default schema');
            inputSchema = {
                title: 'Input Schema',
                type: 'object',
                schemaVersion: 1,
                properties: {},
                required: []
            };
        }

        // Read apify.json if exists
        try {
            const apifyPath = path.join(folderPath, 'apify.json');
            const apifyContent = await fs.readFile(apifyPath, 'utf8');
            actorConfig = JSON.parse(apifyContent);
        } catch (error) {
            console.log('No apify.json found, using default config');
            actorConfig = {
                name: name,
                version: '0.0.1',
                buildTag: 'latest',
                env: null,
                input: 'input.json'
            };
        }

        // Read main file
        let mainContent = '';
        try {
            const mainPath = path.join(folderPath, mainFile);
            mainContent = await fs.readFile(mainPath, 'utf8');
        } catch (error) {
            console.log(`Could not read main file ${mainFile}, trying main.js`);
            try {
                const mainPath = path.join(folderPath, 'main.js');
                mainContent = await fs.readFile(mainPath, 'utf8');
            } catch (error2) {
                console.log('Could not read main.js either');
            }
        }

        // Create zip file from folder
        console.log('📦 Creating zip file...');
        const uploadDir = path.join(__dirname, '..', 'uploads', 'actors');
        await fs.mkdir(uploadDir, { recursive: true });
        console.log('📁 Upload directory:', uploadDir);

        const timestamp = Date.now();
        const zipFileName = `actor-${timestamp}-${Math.floor(Math.random() * 1000000000)}.zip`;
        const zipFilePath = path.join(uploadDir, zipFileName);
        console.log('📄 Zip file path:', zipFilePath);

        // Create zip archive
        console.log('🗜️ Creating archive...');
        const output = require('fs').createWriteStream(zipFilePath);
        const archive = archiver('zip', { zlib: { level: 9 } });

        output.on('close', async () => {
            console.log('✅ Archive created successfully');
            try {
                // Get file stats
                const fileStats = await fs.stat(zipFilePath);

                // Create actor in database
                const actor = new Actor({
                    name,
                    description: description || `Actor imported from ${folderPath}`,
                    type: type === 'web-scraping' ? 'web-scraper' : type, // Map web-scraping to web-scraper
                    category: category === 'web-scraping' ? 'web-scraping' : category, // Ensure valid category
                    visibility,
                    status: 'ready',
                    version: actorConfig?.version || '0.0.1',
                    tags: tags || [], // Ensure tags is an array
                    inputSchema,
                    apifyMetadata: actorConfig || {},
                    code: mainContent, // Add code field
                    config: {}, // Add default config
                    buildInfo: {
                        buildStatus: 'pending'
                    },
                    runInfo: {
                        runStatus: 'idle'
                    },
                    public: false, // Add public field
                    license: 'MIT', // Add license field
                    sourceCode: {
                        main: mainContent,
                        package: packageJson ? JSON.stringify(packageJson, null, 2) : '',
                        inputSchema: JSON.stringify(inputSchema, null, 2),
                        actorConfig: JSON.stringify(actorConfig, null, 2),
                        lastModified: new Date()
                    },
                    environmentVariables: [],
                    file: {
                        filename: zipFileName,
                        path: zipFilePath,
                        size: fileStats.size,
                        mimetype: 'application/zip'
                    },
                    fileUpload: {
                        filename: zipFileName,
                        originalName: `${name}.zip`,
                        path: zipFilePath,
                        size: fileStats.size,
                        mimetype: 'application/zip',
                        uploadedAt: new Date()
                    },
                    userId: req.user.id, // Add userId field
                    createdBy: req.user.id,
                    updatedBy: req.user.id
                });

                console.log('💾 Saving actor to database...');
                await actor.save();
                console.log('✅ Actor saved successfully with ID:', actor._id);

                res.json({
                    success: true,
                    message: 'Actor đã được thêm thành công từ folder',
                    data: {
                        id: actor._id,
                        name: actor.name,
                        folderPath,
                        zipFile: zipFileName
                    }
                });

            } catch (error) {
                console.error('❌ Error creating actor:', error);
                console.error('❌ Error stack:', error.stack);
                res.status(500).json({
                    success: false,
                    error: 'Lỗi khi tạo actor trong database',
                    details: error.message
                });
            }
        });

        archive.on('error', (err) => {
            console.error('❌ Archive error:', err);
            res.status(500).json({
                success: false,
                error: 'Lỗi khi tạo file zip',
                details: err.message
            });
        });

        archive.pipe(output);

        // Add all files from folder to zip
        const addFilesToArchive = async (dirPath, archivePath = '') => {
            const items = await fs.readdir(dirPath);

            for (const item of items) {
                const fullPath = path.join(dirPath, item);
                const relativePath = path.join(archivePath, item);
                const stats = await fs.stat(fullPath);

                if (stats.isDirectory()) {
                    // Skip node_modules and other unnecessary directories
                    if (item === 'node_modules' || item === '.git' || item === '.vscode') {
                        continue;
                    }
                    await addFilesToArchive(fullPath, relativePath);
                } else {
                    // Skip unnecessary files
                    if (item === '.DS_Store' || item === 'Thumbs.db') {
                        continue;
                    }
                    archive.file(fullPath, { name: relativePath });
                }
            }
        };

        console.log('📁 Adding files to archive...');
        await addFilesToArchive(folderPath);
        console.log('✅ Files added to archive, finalizing...');
        archive.finalize();

    } catch (error) {
        console.error('Error adding actor from folder:', error);
        res.status(500).json({
            success: false,
            error: 'Lỗi server khi thêm actor từ folder'
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
    getActorLogs,
    getActorResults,
    buildActor,
    getActorBuilds,
    updateActorSource,
    // Thêm các API mới
    saveSourceFile,
    getSourceFile,
    runActorStream,
    getSourceFiles,
    addActorFromFolder
};