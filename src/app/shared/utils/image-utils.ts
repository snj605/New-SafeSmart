export async function processImageForUpload(
  file: File,
  targetWidth: number,
  targetHeight: number,
  fillColor: string = '#ffffff'
): Promise<File> {
  return new Promise((resolve, reject) => {
    // 1. Create an Image element and load the file
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      // 2. Create a Canvas with the target dimensions
      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return reject(new Error('Canvas 2D context not available'));
      }

      // 3. Fill the background with the specified color
      ctx.fillStyle = fillColor;
      ctx.fillRect(0, 0, targetWidth, targetHeight);

      // 4. Calculate scaling factor to "contain" the image
      const scaleX = targetWidth / img.width;
      const scaleY = targetHeight / img.height;
      const scale = Math.min(scaleX, scaleY); // Use min scale to ensure it fits entirely

      const drawWidth = img.width * scale;
      const drawHeight = img.height * scale;

      // 5. Calculate center position
      const x = (targetWidth - drawWidth) / 2;
      const y = (targetHeight - drawHeight) / 2;

      // 6. Draw the scaled image onto the center of the canvas
      ctx.drawImage(img, x, y, drawWidth, drawHeight);

      // 7. Export the canvas as a new JPEG File
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            return reject(new Error('Canvas to Blob failed'));
          }
          
          // Generate a new filename, ensuring it ends with .jpg since we specify image/jpeg
          let newName = file.name;
          const lastDotIdx = newName.lastIndexOf('.');
          if (lastDotIdx !== -1) {
             newName = newName.substring(0, lastDotIdx) + '.jpg';
          } else {
             newName += '.jpg';
          }

          const processedFile = new File([blob], newName, {
            type: 'image/jpeg',
            lastModified: Date.now(),
          });
          resolve(processedFile);
        },
        'image/jpeg',
        0.9 // Quality: 90%
      );
    };

    img.onerror = (err) => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load image for processing: ' + err));
    };

    img.src = objectUrl;
  });
}
