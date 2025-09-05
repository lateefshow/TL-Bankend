// middlewares/servicesUpload.ts
import multer from "multer";

const serviceUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp/;
    const isValid = allowed.test(file.mimetype);
    if (isValid) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

export default serviceUpload.single("serviceImg");
