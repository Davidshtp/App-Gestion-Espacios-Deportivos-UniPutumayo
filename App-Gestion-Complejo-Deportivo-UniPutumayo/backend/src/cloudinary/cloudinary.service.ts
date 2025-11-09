// src/cloudinary/cloudinary.service.ts
import { BadRequestException, Injectable } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
// Ya no necesitamos 'fs' ni 'promisify(fs.unlink)' porque no hay archivo temporal en disco
// import * as fs from 'fs';
// import { promisify } from 'util';

// const unlinkAsync = promisify(fs.unlink);

@Injectable()
export class CloudinaryService {
  constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  async uploadImage(file: Express.Multer.File): Promise<string> {
    return new Promise((resolve, reject) => {
      // ¡Ahora verificamos file.buffer en lugar de file.path!
      if (!file || !file.buffer) {
        return reject(
          new BadRequestException(
            'El archivo no está disponible en memoria para la subida a Cloudinary.',
          ),
        );
      }

      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: 'auto',
          folder: 'Eventos',
          format: 'webp',
          quality: 'auto:best',
          width: 1200,
          strip: true,
        },
        (error, result) => {
          // Ya NO necesitamos eliminar el archivo temporal, porque está en memoria
          // unlinkAsync(file.path)
          //   .then(() => {})
          //   .catch((unlinkError) => {
          //     console.error(`Error al eliminar el archivo temporal '${file.path}':`, unlinkError);
          //   });

          if (result) {
            resolve(result.secure_url);
          } else {
            reject(
              new BadRequestException(
                `Error al subir imagen a Cloudinary: ${error?.message || 'Error desconocido'}`,
              ),
            );
          }
        },
      );

      // ¡Aquí está el cambio! Pipeamos el buffer directamente
      uploadStream.end(file.buffer);
    });
  }

  // deleteImage permanece igual, ya que no depende del almacenamiento de Multer
  async deleteImage(imageUrl: string): Promise<boolean> {
    if (!imageUrl) {
      return false;
    }

    try {
      const parts = imageUrl.split('/');
      const uploadIndex = parts.indexOf('upload');
      if (uploadIndex === -1 || parts.length < uploadIndex + 2) {
        console.warn(
          `URL de Cloudinary inválida para extraer public_id: ${imageUrl}`,
        );
        return false;
      }

      const publicIdWithVersion = parts.slice(uploadIndex + 2).join('/');
      const publicIdMatch = publicIdWithVersion.match(
        /(?:v\d+\/)?(.+?)(?:\.\w+)?$/,
      );

      let publicId: string | undefined = undefined;

      if (publicIdMatch && publicIdMatch[1]) {
        publicId = publicIdMatch[1];
      }

      if (!publicId) {
        console.warn(`No se pudo extraer public_id de la URL: ${imageUrl}`);
        return false;
      }

      const result = await cloudinary.uploader.destroy(publicId);

      if (result.result === 'ok') {
        return true;
      } else if (result.result === 'not found') {
        console.warn(
          `Imagen no encontrada en Cloudinary (posiblemente ya eliminada o URL inválida): ${imageUrl}`,
        );
        return false;
      } else {
        console.error(
          `Error al eliminar imagen de Cloudinary: ${result.error?.message || 'Error desconocido'} para publicId: ${publicId}`,
        );
        throw new BadRequestException(
          `Error al eliminar imagen de Cloudinary: ${result.error?.message}`,
        );
      }
    } catch (error) {
      console.error('Error en deleteImage de CloudinaryService:', error);
      throw new BadRequestException(
        `Error al intentar eliminar la imagen: ${error.message}`,
      );
    }
  }
}
