import multer from 'multer'
import path from 'path'

// Fungsi untuk membuat konfigurasi storage dinamis
const dynamicStorage = (folderName) =>
    multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, folderName); // Direktori yang ditentukan
        },
        filename: (req, file, cb) => {
            const ext = path.extname(file.originalname);
            const filename = `${Date.now()}${ext}`;
            cb(null, filename); // Format nama file
        },
    });

// Filter tipe file
const fileFilter = (req, file, cb) => {
    if (!file) return cb(null, true);
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('File must be an image'), false);
    }
};

// Fungsi untuk membuat middleware upload dengan folder dinamis
const createUploader = (folderName) =>
    multer({
        storage: dynamicStorage(folderName),
        fileFilter,
        limits: { fileSize: 2 * 1024 * 1024 }, // Maksimal 2 MB
    });

export default createUploader;
