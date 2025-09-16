import { useEffect, useState } from 'react';

import { isImageFile } from '@/utils';

interface ThumbnailCache {
  [key: string]: string;
}

export const useThumbnails = (files: File[]) => {
  const [thumbnails, setThumbnails] = useState<ThumbnailCache>({});

  const generateThumbnail = async (file: File): Promise<string> => {
    if (isImageFile(file)) {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            // Set thumbnail size
            const maxSize = 80;
            let { width, height } = img;

            if (width > height) {
              if (width > maxSize) {
                height = (height * maxSize) / width;
                width = maxSize;
              }
            } else {
              if (height > maxSize) {
                width = (width * maxSize) / height;
                height = maxSize;
              }
            }

            canvas.width = width;
            canvas.height = height;

            if (ctx) {
              ctx.drawImage(img, 0, 0, width, height);
              resolve(canvas.toDataURL('image/jpeg', 0.8));
            } else {
              resolve(URL.createObjectURL(file));
            }
          };
          img.src = e.target?.result as string;
        };
        reader.readAsDataURL(file);
      });
    } else {
      // For non-image files, return the original blob URL
      return URL.createObjectURL(file);
    }
  };

  useEffect(() => {
    const generateThumbnails = async () => {
      const newThumbnails: ThumbnailCache = {};

      for (const file of files) {
        const fileKey = `${file.name}-${file.size}-${file.lastModified}`;
        if (!thumbnails[fileKey]) {
          try {
            const thumbnail = await generateThumbnail(file);
            newThumbnails[fileKey] = thumbnail;
          } catch (error) {
            console.error('Error generating thumbnail:', error);
          }
        }
      }

      if (Object.keys(newThumbnails).length > 0) {
        setThumbnails((prev) => ({ ...prev, ...newThumbnails }));
      }
    };

    generateThumbnails();

    // Cleanup function to revoke blob URLs
    return () => {
      Object.values(thumbnails).forEach((url) => {
        if (url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, [files]);

  const getThumbnail = (file: File): string | undefined => {
    const fileKey = `${file.name}-${file.size}-${file.lastModified}`;
    return thumbnails[fileKey];
  };

  return { getThumbnail };
};
