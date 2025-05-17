import 'dotenv/config'

export const config = {
    PORT: process.env.PORT || 8000,
    FILE_UPLOAD: {
        useTempFiles: true,
        tempFileDir: '/tmp/',
        createParentPath: true,
        limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
    },
    NODE_ENV: process.env.NODE_ENV || 'development',
    MONGO_URI: process.env.MONGO_URI || 'mongodb://localhost:27017/her',
    JWT_SECRET: process.env.JWT_SECRET,
    CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
}