const Actor = require('../models/Actor');
const fileSystemService = require('./fileSystemService');
const fs = require('fs').promises;
const path = require('path');

// Get all actors with pagination and filters
const getAllActors = async (filters) => {
    const { page = 1, limit = 10, status, type, search, category, visibility, buildStatus, runStatus } = filters;

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

    return {
        actors,
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / parseInt(limit))
        }
    };
};

// Get actor by ID
const getActorById = async (actorId) => {
    const actor = await Actor.findById(actorId)
        .populate('createdBy', 'name email')
        .populate('updatedBy', 'name email');

    if (!actor) {
        throw new Error('Không tìm thấy actor');
    }

    return actor;
};

// Create new actor
const createActor = async (actorData, file, createdBy) => {
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
        sourceCode,
        environmentVariables,
        visibility = 'private',
        category = 'web-scraping',
        license = 'MIT',
        gitInfo,
        public: isPublic = false
    } = actorData;

    // Check if actor name already exists
    const existingActor = await Actor.findOne({ name });
    if (existingActor) {
        throw new Error('Tên actor đã tồn tại');
    }

    // Xử lý file upload nếu có
    let fileInfo = null;
    let fileUploadInfo = null;
    if (file) {
        fileInfo = {
            filename: file.originalname,
            path: file.path,
            size: file.size,
            mimetype: file.mimetype
        };

        fileUploadInfo = {
            filename: file.filename,
            originalName: file.originalname,
            path: file.path,
            size: file.size,
            mimetype: file.mimetype,
            uploadedAt: new Date()
        };
    }

    // Parse inputSchema if it's a string
    let parsedInputSchema = inputSchema;
    if (typeof inputSchema === 'string') {
        try {
            parsedInputSchema = JSON.parse(inputSchema);
        } catch (error) {
            throw new Error('Input schema không đúng định dạng JSON');
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
        userId: createdBy,
        path: `actors_storage/${createdBy}/`,
        files: [],
        public: isPublic,
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
        createdBy
    });

    await actor.save();

    // Tạo thư mục cho actor và giải nén file nếu có
    try {
        console.log(`Creating directory for actor: ${actor._id}, user: ${createdBy}`);
        const actorPath = await fileSystemService.createActorDirectory(createdBy, actor._id);
        console.log(`Actor directory created: ${actorPath}`);

        // Giải nén file nếu có
        if (file && file.mimetype === 'application/zip') {
            console.log(`Extracting zip file: ${file.path} to ${actorPath}`);
            await fileSystemService.extractZipFile(file.path, actorPath);
            console.log('Zip file extracted successfully');
        }

        // Cập nhật path trong database
        actor.path = `actors_storage/${createdBy}/${actor._id}/`;
        await actor.save();

    } catch (error) {
        console.error('Error creating actor directory or extracting file:', error);
        console.error('Error details:', error.message);
        console.error('Stack trace:', error.stack);
    }

    // Populate creator info
    await actor.populate('createdBy', 'name email');

    return actor;
};

// Update actor
const updateActor = async (actorId, updateData, updatedBy) => {
    const actor = await Actor.findById(actorId);
    if (!actor) {
        throw new Error('Không tìm thấy actor');
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
    } = updateData;

    // Check if new name conflicts with existing actor
    if (name && name !== actor.name) {
        const existingActor = await Actor.findOne({ name, _id: { $ne: actorId } });
        if (existingActor) {
            throw new Error('Tên actor đã tồn tại');
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

    actor.updatedBy = updatedBy;

    await actor.save();

    // Populate user info
    await actor.populate('createdBy', 'name email');
    await actor.populate('updatedBy', 'name email');

    return actor;
};

// Delete actor
const deleteActor = async (actorId) => {
    const actor = await Actor.findById(actorId);
    if (!actor) {
        throw new Error('Không tìm thấy actor');
    }

    // Check if actor is being used by any sources
    const Source = require('../models/Source');
    const sourceCount = await Source.countDocuments({ actorId });

    if (sourceCount > 0) {
        throw new Error(`Không thể xóa actor vì đang được sử dụng bởi ${sourceCount} source(s)`);
    }

    // Xóa thư mục actor nếu có
    try {
        if (actor.userId) {
            await fileSystemService.deleteActorDirectory(actor.userId, actor._id);
        }
    } catch (error) {
        console.error('Error deleting actor directory:', error);
    }

    await Actor.findByIdAndDelete(actorId);
    return { message: 'Actor đã được xóa thành công' };
};

// Get actor statistics
const getActorStats = async () => {
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

    return {
        overview: stats[0] || { total: 0, active: 0, inactive: 0, draft: 0 },
        byType: typeStats
    };
};





















module.exports = {
    getAllActors,
    getActorById,
    createActor,
    updateActor,
    deleteActor,
    getActorStats
};
