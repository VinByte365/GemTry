const multer = require('multer');
const path = require('path');
const fs = require('fs');

const config = require('../config/server');

// Create storage directory if it doesn't exist
const storageDir = path.join(__dirname, '..', config.UPLOAD_PATH);
if (!fs.existsSync(storageDir)) {
    fs.mkdirSync(storageDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, storageDir);
    },
    filename: function (req, file, cb) {
        // Generate unique filename with timestamp
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// File filter to accept only images
const fileFilter = (req, file, cb) => {
    // Accept images only
    if (!file.originalname.match(/\.(jpg|JPG|jpeg|JPEG|png|PNG|gif|GIF)$/)) {
        req.fileValidationError = 'Only image files are allowed!';
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};

// Configure multer
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: config.MAX_FILE_SIZE
    }
});

// Single file upload middleware
const uploadSingle = upload.single('image');

// Multiple files upload middleware
const uploadMultiple = upload.array('images', 5); // Max 5 images

module.exports = {
    uploadSingle,
    uploadMultiple,
    storageDir
};
