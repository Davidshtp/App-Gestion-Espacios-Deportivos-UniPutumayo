// src/common/configs/multer.config.ts
import { memoryStorage } from 'multer'; // <-- ¡Cambio aquí! Usamos memoryStorage
import { BadRequestException } from '@nestjs/common';

// Define los límites para cada tipo de subida
export const MAX_IMAGE_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB para imágenes
console.log('Valor de MAX_IMAGE_SIZE_BYTES:', MAX_IMAGE_SIZE_BYTES);
const storage = memoryStorage(); 

// Filtro general para imágenes
export const imageFilter = (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']; 
    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true); // Aceptar el archivo
    } else {
        const error = new BadRequestException('Tipo de archivo no permitido. Solo se permiten imágenes (JPG, JPEG, PNG, GIF, WEBP, SVG).');
        cb(error, false);
    }
};

export const multerImageOptions = {
    storage: storage,
    fileFilter: imageFilter,
    limits: { fileSize: MAX_IMAGE_SIZE_BYTES } // Límite para imágenes
};

