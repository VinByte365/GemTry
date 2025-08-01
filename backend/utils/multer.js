const multer = require('multer');
const path = require('path');
const fs = require('fs');

const config = require('../config/server');

// Function to resolve and ensure the directory exists
const ensureStorageDir = (folder) => {
    const dir = path.join(__dirname, '..', config.UPLOAD_PATH, folder);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    return dir;
};

// File filter to accept only images
const fileFilter = (req, file, cb) => {
    if (!file.originalname.match(/\.(jpg|JPG|jpeg|JPEG|png|PNG|gif|GIF)$/)) {
        req.fileValidationError = 'Only image files are allowed!';
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};

// Function to get multer instance with dynamic folder
const getUploader = (folder = '') => {
    const storageDir = ensureStorageDir(folder);

    const storage = multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, storageDir);
        },
        filename: function (req, file, cb) {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
        }
    });

    return multer({
        storage: storage,
        fileFilter: fileFilter,
        limits: {
            fileSize: config.MAX_FILE_SIZE
        }
    });
};

// Error-handling wrapper for multer uploaders
const withMulter = (uploadFn) => {
    return (req, res, next) => {
        uploadFn(req, res, function (err) {
            if (err instanceof multer.MulterError) {
                return res.status(400).json({ msg: err.message });
            } else if (err) {
                return res.status(400).json({ msg: err.message });
            }
            next();
        });
    };
};

// Create uploader instance for items
const itemUploader = getUploader('items');

// Exported uploaders for common use cases
const uploadUserImage = getUploader('users').single('image');

// Item uploaders - single and multiple options
const uploadSingleItemImage = itemUploader.single('file');
const uploadMultipleItemImages = itemUploader.array('images', 5);

// Combined item uploader that handles both main image and gallery images
const uploadItemImages = itemUploader.fields([
    { name: 'file', maxCount: 1 },           // Main product image
    { name: 'mainImage', maxCount: 1 },      // Alternative main image field name
    { name: 'images', maxCount: 5 },         // Gallery images
    { name: 'galleryImages', maxCount: 5 }   // Alternative gallery images field name
]);

// Flexible item uploader that can handle any combination
const uploadFlexibleItemImages = (req, res, next) => {
    // Use fields to handle multiple field names and types
    const flexibleUpload = itemUploader.fields([
        { name: 'file', maxCount: 1 },
        { name: 'mainImage', maxCount: 1 },
        { name: 'image', maxCount: 1 },
        { name: 'images', maxCount: 10 },
        { name: 'galleryImages', maxCount: 10 }
    ]);

    flexibleUpload(req, res, function (err) {
        if (err instanceof multer.MulterError) {
            return res.status(400).json({ msg: err.message });
        } else if (err) {
            return res.status(400).json({ msg: err.message });
        }
        
        // Normalize the uploaded files for easier access
        if (req.files) {
            // Extract main image from various possible field names
            req.mainImage = req.files.file?.[0] || 
                          req.files.mainImage?.[0] || 
                          req.files.image?.[0] || 
                          null;
            
            // Extract gallery images
            req.galleryImages = [
                ...(req.files.images || []),
                ...(req.files.galleryImages || [])
            ];
        }
        
        next();
    });
};

module.exports = {
    uploadUserImage,
    uploadSingleItemImage,
    uploadMultipleItemImages,
    uploadItemImages,
    uploadFlexibleItemImages,
    getUploader,
    withMulter
};