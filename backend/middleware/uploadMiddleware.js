const multer = require("multer");
const path = require("path");

// Allowed file types
const allowedTypes = /jpeg|jpg|png|gif/;

const storage = multer.diskStorage({
  destination: "uploads/",
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const safeName = `${Date.now()}-${file.fieldname}${ext}`;
    cb(null, safeName);
  }
});

const fileFilter = (req, file, cb) => {
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed (jpeg, jpg, png, gif)"), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 } // Optional: Max 2MB
});

module.exports = { upload };
