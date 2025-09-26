import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { ALLOWED_MIME_TYPES, ALLOWED_FILE_EXTENSIONS, FILE_UPLOAD_LIMITS } from '../../config/constants';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../../uploads');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req: any, file: any, cb: any) => {
  const fileExtension = path.extname(file.originalname).toLowerCase();

  if (ALLOWED_MIME_TYPES.includes(file.mimetype) || ALLOWED_FILE_EXTENSIONS.includes(fileExtension)) {
    cb(null, true);
  } else {
    cb(new Error(`File type not allowed. Supported types: ${ALLOWED_FILE_EXTENSIONS.join(', ')}`));
  }
};

export const upload = multer({
  storage: storage,
  limits: FILE_UPLOAD_LIMITS,
  fileFilter: fileFilter
});