import multer from "multer";

const ALLOWED = ["application/pdf", "image/png", "image/jpeg", "text/plain"];

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB, matches the upload form
  fileFilter: (_req, file, cb) => {
    if (ALLOWED.includes(file.mimetype)) return cb(null, true);
    cb(new Error("Only PDF, PNG, JPG or TXT files are allowed"));
  },
});