import multer from 'multer'
import path from 'path'

// ====== Allowed file types ======
const allowedFileTypes = [
    'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt'
]

// Fungsi untuk membuat konfigurasi storage dinamis
const dynamicStorage = (folderName, prefix = 'file') =>
    multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, folderName)
        },
        filename: (req, file, cb) => {
            const ext = path.extname(file.originalname)
            const filename = `${Date.now()}-${prefix}${ext}`
            cb(null, filename)
        },
    })

// Filter tipe file
const imageFilter = (req, file, cb) => {
    if (!file) return cb(null, true)
    if (file.mimetype.startsWith('image/')) {
        cb(null, true)
    } else {
        cb(new Error('File must be an image'), false)
    }
}

const fileFilter = (req, file, cb) => {
    if (!file) return cb(null, true)
    const ext = path.extname(file.originalname).slice(1).toLowerCase()
    if (allowedFileTypes.includes(ext)) cb(null, true)
    else cb(new Error('File type not allowed!'), false)
}

// Fungsi untuk membuat middleware upload dengan folder dinamis
export const createUploader = (folderName) =>
    multer({
        storage: dynamicStorage(folderName),
        imageFilter,
        limits: { fileSize: 2 * 1024 * 1024 }, // Maksimal 2 MB
    })

export const createFileUploader = (folderName) =>
    multer({
        storage: dynamicStorage(folderName, 'file'),
        fileFilter: fileFilter,
        limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
    })