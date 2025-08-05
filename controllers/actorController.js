const Actor = require('../models/Actor');
const { validationResult } = require('express-validator');

// @desc    Get all actors
// @route   GET /api/actors
// @access  Private
const getAllActors = async (req, res) => {
    try {
        const { page = 1, limit = 10, status, type, search } = req.query;

        // Build filter
        const filter = {};
        if (status) filter.status = status;
        if (type) filter.type = type;
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
            status = 'active',
            version = '1.0.0',
            tags = [],
            inputSchema,
            apifyMetadata
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
        if (req.file) {
            fileInfo = {
                filename: req.file.originalname,
                path: req.file.path,
                size: req.file.size,
                mimetype: req.file.mimetype
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
            createdBy: req.user.id
        });

        await actor.save();

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

// @desc    Run actor with input
// @route   POST /api/actors/:id/run
// @access  Private
const runActor = async (req, res) => {
    try {
        const actor = await Actor.findById(req.params.id);

        if (!actor) {
            return res.status(404).json({
                success: false,
                error: 'Không tìm thấy actor'
            });
        }

        if (actor.status !== 'active') {
            return res.status(400).json({
                success: false,
                error: 'Actor không ở trạng thái active'
            });
        }

        const { input } = req.body;

        // Validate input against schema
        if (actor.inputSchema && actor.inputSchema.properties) {
            const requiredFields = actor.inputSchema.required || [];

            for (const field of requiredFields) {
                if (!input[field]) {
                    return res.status(400).json({
                        success: false,
                        error: `Thiếu trường bắt buộc: ${field}`
                    });
                }
            }
        }

        // Simulate running actor (in real implementation, this would execute the code)
        const runResult = {
            actorId: actor._id,
            actorName: actor.name,
            input: input,
            status: 'running',
            startTime: new Date(),
            estimatedDuration: '5-10 minutes',
            message: 'Actor đang được chạy...'
        };

        // TODO: Implement actual actor execution
        // This would involve:
        // 1. Setting up execution environment
        // 2. Running the actor code with input
        // 3. Collecting results
        // 4. Storing results in database

        res.json({
            success: true,
            data: runResult,
            message: 'Actor đã được khởi chạy thành công'
        });

    } catch (error) {
        console.error('Error running actor:', error);
        res.status(500).json({
            success: false,
            error: 'Lỗi server khi chạy actor'
        });
    }
};

// @desc    Get actor execution history
// @route   GET /api/actors/:id/runs
// @access  Private
const getActorRuns = async (req, res) => {
    try {
        const actor = await Actor.findById(req.params.id);

        if (!actor) {
            return res.status(404).json({
                success: false,
                error: 'Không tìm thấy actor'
            });
        }

        // TODO: Implement getting execution history from database
        const runs = [
            {
                id: '1',
                actorId: actor._id,
                status: 'completed',
                startTime: new Date(Date.now() - 3600000),
                endTime: new Date(),
                input: { url: 'https://example.com', maxPages: 5 },
                result: { pagesScraped: 5, dataCollected: 150 }
            }
        ];

        res.json({
            success: true,
            data: runs
        });

    } catch (error) {
        console.error('Error getting actor runs:', error);
        res.status(500).json({
            success: false,
            error: 'Lỗi server khi lấy lịch sử chạy actor'
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
    getActorRuns
}; 