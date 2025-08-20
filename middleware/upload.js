const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Đảm bảo thư mục uploads tồn tại
const uploadDir = path.join(__dirname, '../uploads');
const actorsDir = path.join(uploadDir, 'actors');

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}
if (!fs.existsSync(actorsDir)) {
    fs.mkdirSync(actorsDir, { recursive: true });
}

// Cấu hình storage cho multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, actorsDir);
    },
    filename: (req, file, cb) => {
        // Tạo tên file unique với timestamp
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        const name = path.basename(file.originalname, ext);
        cb(null, `${name}-${uniqueSuffix}${ext}`);
    }
});

// Filter files
const fileFilter = (req, file, cb) => {
    // Cho phép các loại file phổ biến cho actors
    const allowedTypes = [
        'application/zip',
        'application/x-zip-compressed',
        'application/javascript',
        'text/javascript',
        'text/plain',
        'application/json',
        'text/json',
        'application/xml',
        'text/xml',
        'text/html',
        'text/css'
    ];

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error(`Loại file không được hỗ trợ: ${file.mimetype}`), false);
    }
};

// Cấu hình multer
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 200 * 1024 * 1024, // 50MB max
        files: 1 // Chỉ cho phép 1 file
    }
});

// Middleware để xử lý lỗi upload
const handleUploadError = (error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                error: 'File quá lớn. Kích thước tối đa là 50MB'
            });
        }
        if (error.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
                success: false,
                error: 'Chỉ được upload 1 file'
            });
        }
        return res.status(400).json({
            success: false,
            error: `Lỗi upload: ${error.message}`
        });
    }

    if (error.message.includes('Loại file không được hỗ trợ')) {
        return res.status(400).json({
            success: false,
            error: error.message
        });
    }

    next(error);
};

module.exports = {
    upload,
    handleUploadError
}; 