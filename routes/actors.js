const express = require('express');
const { auth, authorize } = require('../middleware/auth');
const { body } = require('express-validator');
const { validate } = require('../middleware/validation');
const { upload, handleUploadError } = require('../middleware/upload');
const actorController = require('../controllers/actorController');
const fileSystemService = require('../services/fileSystemService');
const Actor = require('../models/Actor');

const router = express.Router();

// Validation rules
const actorValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Tên actor là bắt buộc')
    .isLength({ max: 100 })
    .withMessage('Tên actor không được quá 100 ký tự'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Mô tả không được quá 500 ký tự'),
  body('type')
    .isIn(['web-scraper', 'news-scraper', 'product-scraper', 'social-scraper', 'custom'])
    .withMessage('Loại actor không hợp lệ'),
  body('status')
    .optional()
    .isIn(['active', 'inactive', 'draft', 'ready', 'error', 'running'])
    .withMessage('Trạng thái không hợp lệ'),
  body('visibility')
    .optional()
    .isIn(['public', 'private', 'shared'])
    .withMessage('Visibility không hợp lệ'),
  body('category')
    .optional()
    .isIn(['web-scraping', 'e-commerce', 'news', 'social-media', 'data-processing', 'api-integration', 'other'])
    .withMessage('Category không hợp lệ'),
  body('config.maxConcurrency')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Số lượng đồng thời phải từ 1-50'),
  body('config.timeout')
    .optional()
    .isInt({ min: 5000, max: 300000 })
    .withMessage('Timeout phải từ 5000-300000ms'),
  body('config.retryAttempts')
    .optional()
    .isInt({ min: 0, max: 10 })
    .withMessage('Số lần thử lại phải từ 0-10'),
  validate
];

// Get all actors
router.get('/', auth, actorController.getAllActors);

// Get actor statistics
router.get('/stats/overview', auth, actorController.getActorStats);

// Create new actor (with file upload)
router.post('/',
  auth,
  authorize('admin', 'editor'),
  upload.single('actorFile'),
  handleUploadError,
  actorValidation,
  actorController.createActor
);



// Get actor by ID
router.get('/:id', auth, actorController.getActorById);



// Update actor
router.put('/:id', auth, authorize('admin', 'editor'), actorValidation, actorController.updateActor);

// Delete actor
router.delete('/:id', auth, authorize('admin'), actorController.deleteActor);

// ===== NEW FILE-BASED STORAGE ROUTES =====

// Lưu file đơn lẻ
router.put('/:actorId/files/:filePath(*)', auth, async (req, res) => {
  try {
    const { actorId, filePath } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    // Kiểm tra quyền sở hữu actor
    const actor = await Actor.findById(actorId);
    if (!actor || actor.userId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Không có quyền truy cập'
      });
    }

    // Lưu file
    await fileSystemService.saveFile(userId, actorId, filePath, content);

    // Cập nhật metadata trong database
    await Actor.findByIdAndUpdate(actorId, {
      $addToSet: { files: filePath },
      updatedAt: new Date(),
      updatedBy: userId
    });

    res.json({
      success: true,
      message: 'File đã được lưu thành công',
      data: { filePath }
    });
  } catch (error) {
    console.error('Save file error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lưu file',
      error: error.message
    });
  }
});

// Lấy nội dung file
router.get('/:actorId/files/:filePath(*)', auth, async (req, res) => {
  try {
    const { actorId, filePath } = req.params;
    const userId = req.user.id;

    // Kiểm tra quyền sở hữu actor
    const actor = await Actor.findById(actorId);
    if (!actor || actor.userId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Không có quyền truy cập'
      });
    }

    // Đọc file
    const content = await fileSystemService.readFile(userId, actorId, filePath);

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
        language: getLanguage(filePath)
      }
    });
  } catch (error) {
    if (error.code === 'ENOENT') {
      return res.status(404).json({
        success: false,
        message: 'File không tồn tại'
      });
    }
    console.error('Read file error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi đọc file',
      error: error.message
    });
  }
});

// Lấy danh sách file
router.get('/:actorId/files', auth, async (req, res) => {
  try {
    const { actorId } = req.params;
    const userId = req.user.id;

    // Kiểm tra quyền sở hữu actor
    const actor = await Actor.findById(actorId);
    if (!actor || actor.userId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Không có quyền truy cập'
      });
    }

    // Lấy danh sách file
    const files = await fileSystemService.listFiles(userId, actorId);

    // Get file info for each file
    const fileInfos = [];
    for (const filePath of files) {
      try {
        const info = await fileSystemService.getFileInfo(userId, actorId, filePath);
        fileInfos.push(info);
      } catch (error) {
        console.error(`Error getting file info for ${filePath}:`, error);
      }
    }

    res.json({
      success: true,
      data: {
        files: fileInfos,
        totalFiles: fileInfos.length
      }
    });
  } catch (error) {
    console.error('List files error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách file',
      error: error.message
    });
  }
});

// Lưu nhiều file cùng lúc
router.post('/:actorId/files', auth, async (req, res) => {
  try {
    const { actorId } = req.params;
    const { files } = req.body;
    const userId = req.user.id;

    // Kiểm tra quyền sở hữu actor
    const actor = await Actor.findById(actorId);
    if (!actor || actor.userId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Không có quyền truy cập'
      });
    }

    if (!Array.isArray(files)) {
      return res.status(400).json({
        success: false,
        message: 'Files phải là một mảng'
      });
    }

    // Lưu từng file
    const savedFiles = [];
    for (const file of files) {
      if (!file.path || !file.content) {
        continue;
      }
      await fileSystemService.saveFile(userId, actorId, file.path, file.content);
      savedFiles.push(file.path);
    }

    // Cập nhật metadata
    await Actor.findByIdAndUpdate(actorId, {
      $addToSet: { files: { $each: savedFiles } },
      updatedAt: new Date(),
      updatedBy: userId
    });

    res.json({
      success: true,
      message: `${savedFiles.length} files đã được lưu thành công`,
      data: { savedFiles }
    });
  } catch (error) {
    console.error('Save multiple files error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lưu files',
      error: error.message
    });
  }
});

// Xóa file
router.delete('/:actorId/files/:filePath(*)', auth, async (req, res) => {
  try {
    const { actorId, filePath } = req.params;
    const userId = req.user.id;

    // Kiểm tra quyền sở hữu actor
    const actor = await Actor.findById(actorId);
    if (!actor || actor.userId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Không có quyền truy cập'
      });
    }

    // Xóa file
    await fileSystemService.deleteFile(userId, actorId, filePath);

    // Cập nhật metadata
    await Actor.findByIdAndUpdate(actorId, {
      $pull: { files: filePath },
      updatedAt: new Date(),
      updatedBy: userId
    });

    res.json({
      success: true,
      message: 'File đã được xóa thành công',
      data: { filePath }
    });
  } catch (error) {
    console.error('Delete file error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa file',
      error: error.message
    });
  }
});

// Build actor (file-based)
router.post('/:actorId/build/file', auth, async (req, res) => {
  try {
    const { actorId } = req.params;
    const userId = req.user.id;

    // Kiểm tra quyền sở hữu actor
    const actor = await Actor.findById(actorId);
    if (!actor || actor.userId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Không có quyền truy cập'
      });
    }

    // Cập nhật status
    await Actor.findByIdAndUpdate(actorId, {
      status: 'building',
      'buildInfo.buildStatus': 'building',
      'buildInfo.lastBuildAt': new Date(),
      'buildInfo.buildCount': { $inc: 1 }
    });

    // Build actor
    const result = await fileSystemService.buildActor(userId, actorId);

    // Cập nhật status
    await Actor.findByIdAndUpdate(actorId, {
      status: result.success ? 'ready' : 'error',
      'buildInfo.buildStatus': result.success ? 'success' : 'failed',
      'buildInfo.buildLog': result.log
    });

    res.json({
      success: result.success,
      message: result.success ? 'Build thành công' : 'Build thất bại',
      data: { log: result.log }
    });
  } catch (error) {
    console.error('Build actor error:', error);

    // Cập nhật status lỗi
    await Actor.findByIdAndUpdate(actorId, {
      status: 'error',
      'buildInfo.buildStatus': 'failed',
      'buildInfo.buildError': error.message
    });

    res.status(500).json({
      success: false,
      message: 'Lỗi khi build actor',
      error: error.message,
      data: { log: error.log || error.message }
    });
  }
});

// Run actor (file-based)
router.post('/:actorId/run/file', auth, async (req, res) => {
  try {
    const { actorId } = req.params;
    const { input } = req.body;
    const userId = req.user.id;

    // Kiểm tra quyền sở hữu actor
    const actor = await Actor.findById(actorId);
    if (!actor || actor.userId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Không có quyền truy cập'
      });
    }

    // Cập nhật status
    await Actor.findByIdAndUpdate(actorId, {
      status: 'running',
      'runInfo.runStatus': 'running',
      'runInfo.lastRunAt': new Date(),
      'runInfo.runCount': { $inc: 1 }
    });

    // Run actor
    const result = await fileSystemService.runActor(userId, actorId, input);

    // Cập nhật status
    await Actor.findByIdAndUpdate(actorId, {
      status: result.success ? 'ready' : 'error',
      'runInfo.runStatus': result.success ? 'completed' : 'failed',
      'runInfo.runLog': result.log
    });

    res.json({
      success: result.success,
      message: result.success ? 'Run thành công' : 'Run thất bại',
      data: { log: result.log }
    });
  } catch (error) {
    console.error('Run actor error:', error);

    // Cập nhật status lỗi
    await Actor.findByIdAndUpdate(actorId, {
      status: 'error',
      'runInfo.runStatus': 'failed',
      'runInfo.runError': error.message
    });

    res.status(500).json({
      success: false,
      message: 'Lỗi khi run actor',
      error: error.message,
      data: { log: error.log || error.message }
    });
  }
});

module.exports = router; 