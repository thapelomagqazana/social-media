import multer from "multer";

// Storage configuration (store files in memory before uploading to Cloudinary)
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  // Allow only images and videos
  if (!file.mimetype.match(/image|video/)) {
    return cb(new Error("Only images and videos are allowed"), false);
  }
  cb(null, true);
};

// Upload limits: max file size (5MB for images, 20MB for videos)
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB max file size
});

export default upload;
