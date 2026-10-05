const ImageKit = require("imagekit");

const imagekit = new ImageKit({
  publicKey: process.env.IMAGE_KIT_PUBLIC,
  privateKey: process.env.IMAGE_KIT_PRIVATE,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
});

/**
 * Upload a single buffer to ImageKit.
 * @param {Buffer} fileBuffer
 * @param {String} fileName
 * @param {String} folder
 * @returns {Promise<{url: string, fileId: string}>}
 */
const uploadImage = (fileBuffer, fileName, folder = "/products") => {
  return new Promise((resolve, reject) => {
    imagekit.upload(
      {
        file: fileBuffer,
        fileName,
        folder,
      },
      (err, result) => {
        if (err) return reject(err);
        resolve({ url: result.url, fileId: result.fileId });
      }
    );
  });
};

/**
 * Delete an image from ImageKit by fileId.
 * Never throws — resolves with null on failure (so batch deletes don't crash).
 */
const deleteImage = async (fileId) => {
  try {
    return await new Promise((resolve, reject) => {
      imagekit.deleteFile(fileId, (err, result) => {
        if (err) return reject(err);
        resolve(result);
      });
    });
  } catch (err) {
    console.warn(`⚠️ Failed to delete ImageKit file ${fileId}:`, err.message);
    return null;
  }
};

module.exports = { uploadImage, deleteImage };