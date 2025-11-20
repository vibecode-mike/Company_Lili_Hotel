/**
 * 前端圖片裁切工具
 * 使用 Canvas API 裁切圖片到指定比例
 */

export type AspectRatio = "1:1" | "1.92:1";

interface CropDimensions {
  targetWidth: number;
  targetHeight: number;
}

/**
 * 根據比例獲取目標尺寸
 */
function getTargetDimensions(aspectRatio: AspectRatio): CropDimensions {
  if (aspectRatio === "1:1") {
    return { targetWidth: 900, targetHeight: 900 };
  } else {
    return { targetWidth: 1920, targetHeight: 1000 };
  }
}

/**
 * 計算裁切區域（中心裁切）
 */
function calculateCropArea(
  imgWidth: number,
  imgHeight: number,
  targetRatio: number
): { x: number; y: number; width: number; height: number } {
  const currentRatio = imgWidth / imgHeight;

  let cropX = 0;
  let cropY = 0;
  let cropWidth = imgWidth;
  let cropHeight = imgHeight;

  if (currentRatio > targetRatio) {
    // 圖片太寬，裁切寬度
    cropWidth = imgHeight * targetRatio;
    cropX = (imgWidth - cropWidth) / 2;
  } else {
    // 圖片太高，裁切高度
    cropHeight = imgWidth / targetRatio;
    cropY = (imgHeight - cropHeight) / 2;
  }

  return {
    x: cropX,
    y: cropY,
    width: cropWidth,
    height: cropHeight
  };
}

/**
 * 裁切圖片到指定比例
 *
 * @param file - 原始圖片 File 對象
 * @param aspectRatio - 目標比例 ("1:1" 或 "1.92:1")
 * @returns Promise<Blob> - 裁切後的圖片 Blob
 */
export async function cropImage(
  file: File,
  aspectRatio: AspectRatio
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    // 創建圖片元素
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      if (!e.target?.result) {
        reject(new Error('無法讀取圖片'));
        return;
      }

      img.onload = () => {
        try {
          // 獲取目標尺寸
          const { targetWidth, targetHeight } = getTargetDimensions(aspectRatio);
          const targetRatio = targetWidth / targetHeight;

          // 計算裁切區域
          const cropArea = calculateCropArea(img.width, img.height, targetRatio);

          // 創建 canvas
          const canvas = document.createElement('canvas');
          canvas.width = targetWidth;
          canvas.height = targetHeight;
          const ctx = canvas.getContext('2d');

          if (!ctx) {
            reject(new Error('無法創建 Canvas 上下文'));
            return;
          }

          // 裁切並繪製到 canvas
          ctx.drawImage(
            img,
            cropArea.x,     // 源圖 x
            cropArea.y,     // 源圖 y
            cropArea.width, // 源圖寬度
            cropArea.height,// 源圖高度
            0,              // canvas x
            0,              // canvas y
            targetWidth,    // canvas 寬度
            targetHeight    // canvas 高度
          );

          // 轉換為 Blob
          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(blob);
              } else {
                reject(new Error('無法生成裁切後的圖片'));
              }
            },
            'image/jpeg',
            0.95 // 質量 95%
          );
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => {
        reject(new Error('圖片加載失敗'));
      };

      img.src = e.target.result as string;
    };

    reader.onerror = () => {
      reject(new Error('文件讀取失敗'));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * 將 Blob 轉換為臨時 URL（用於預覽）
 */
export function createBlobUrl(blob: Blob): string {
  return URL.createObjectURL(blob);
}

/**
 * 釋放 Blob URL（用於清理內存）
 */
export function revokeBlobUrl(url: string): void {
  if (url.startsWith('blob:')) {
    URL.revokeObjectURL(url);
  }
}

/**
 * 將 Blob 轉換為 File（用於上傳）
 */
export function blobToFile(blob: Blob, filename: string): File {
  return new File([blob], filename, { type: blob.type });
}
