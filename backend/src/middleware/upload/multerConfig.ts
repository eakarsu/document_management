import multer from 'multer';
import path from 'path';
import { ALLOWED_MIME_TYPES, ALLOWED_FILE_EXTENSIONS, FILE_UPLOAD_LIMITS } from '../../config/constants';

const fileFilter = (req: any, file: any, cb: any) => {
  const fileExtension = path.extname(file.originalname).toLowerCase();

  if (ALLOWED_MIME_TYPES.includes(file.mimetype) || ALLOWED_FILE_EXTENSIONS.includes(fileExtension)) {
    cb(null, true);
  } else {
    cb(new Error(`File type not allowed. Supported types: ${ALLOWED_FILE_EXTENSIONS.join(', ')}`));
  }
};

export const upload = multer({
  // Files remain in memory until the governed service validates and commits
  // them to encrypted object storage. No plaintext upload is written locally.
  storage: multer.memoryStorage(),
  limits: FILE_UPLOAD_LIMITS,
  fileFilter: fileFilter
});
