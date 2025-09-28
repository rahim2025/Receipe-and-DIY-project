import { v2 as cloudinary } from 'cloudinary';
import { config } from 'dotenv';

config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Helper function to upload file to Cloudinary
export const uploadToCloudinary = async (file, options = {}) => {
  try {
    const uploadOptions = {
      resource_type: 'auto',
      folder: options.folder || 'recipe-diy-hub',
      public_id: options.public_id,
      transformation: options.transformation,
    };

    if (file.buffer) {
      return await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
          if (error) {
            console.error('Cloudinary upload error:', error);
            return resolve({ success: false, error: error.message });
          }
          resolve({
            success: true,
            url: result.secure_url,
            public_id: result.public_id,
            resource_type: result.resource_type,
            format: result.format,
          });
        });

        stream.end(file.buffer);
      });
    }

    const result = await cloudinary.uploader.upload(file.path, uploadOptions);

    return {
      success: true,
      url: result.secure_url,
      public_id: result.public_id,
      resource_type: result.resource_type,
      format: result.format,
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// Helper function to delete file from Cloudinary
export const deleteFromCloudinary = async (public_id, resource_type = 'image') => {
  try {
    const result = await cloudinary.uploader.destroy(public_id, {
      resource_type,
    });

    return {
      success: result.result === 'ok',
      result: result.result,
    };
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// Image transformation presets
export const transformations = {
  thumbnail: {
    width: 300,
    height: 300,
    crop: 'fill',
    quality: 'auto',
  },
  medium: {
    width: 800,
    height: 600,
    crop: 'fit',
    quality: 'auto',
  },
  large: {
    width: 1200,
    height: 900,
    crop: 'fit',
    quality: 'auto',
  },
  profile: {
    width: 200,
    height: 200,
    crop: 'fill',
    gravity: 'face',
    quality: 'auto',
  },
};

export default cloudinary;