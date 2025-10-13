const multer = require('multer');
const path = require('path');

// Create the public/uploads directory if it doesn't exist
const fs = require('fs');
const dir = './public/uploads/images';
if (!fs.existsSync(dir)){
    fs.mkdirSync(dir, { recursive: true });
}

// Set up storage for uploaded files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads/images/');
  },
  filename: (req, file, cb) => {
    // Create a unique filename to prevent overwriting
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Create the multer instance
const upload = multer({
  storage: storage
});

module.exports = upload;