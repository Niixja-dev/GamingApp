/**
 * Cloudinary Video Upload Service
 * Handles video uploads to Cloudinary cloud storage
 */

const CLOUDINARY_CLOUD_NAME = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

/**
 * Upload a video to Cloudinary
 * @param {string} videoUri - Local URI of the video file
 * @param {function} onProgress - Optional callback for upload progress (0-100)
 * @returns {Promise<{url: string, thumbnailUrl: string}>}
 */
export const uploadVideo = async (videoUri, onProgress = null) => {
    try {
        const formData = new FormData();

        // Prepare the file for upload
        const filename = videoUri.split('/').pop();
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `video/${match[1]}` : 'video/mp4';

        formData.append('file', {
            uri: videoUri,
            type: type,
            name: filename,
        });

        formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
        formData.append('resource_type', 'video');

        const response = await fetch(
            `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/video/upload`,
            {
                method: 'POST',
                body: formData,
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            }
        );

        if (!response.ok) {
            if (response.status === 413) {
                throw new Error('Video file is too large. Cloudinary free plan limit is 100MB.');
            }
            throw new Error(`Cloudinary upload failed: ${response.status}`);
        }

        const data = await response.json();

        return {
            url: data.secure_url,
            thumbnailUrl: data.secure_url.replace(/\.[^.]+$/, '.jpg'), // Cloudinary auto-generates thumbnails
            publicId: data.public_id,
        };
    } catch (error) {
        console.error('Cloudinary upload error:', error);
        throw error;
    }
};

/**
 * Delete a video from Cloudinary
 * @param {string} publicId - The Cloudinary public ID of the video
 */
export const deleteVideo = async (publicId) => {
    try {
        // Note: Deletion requires server-side implementation with API secret
        // For now, we'll just remove from our database
        // TODO: Implement server-side deletion endpoint
        console.warn('Cloudinary deletion requires server-side implementation');
    } catch (error) {
        console.error('Cloudinary delete error:', error);
    }
};
