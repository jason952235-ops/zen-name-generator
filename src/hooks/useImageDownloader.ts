// src/hooks/useImageDownloader.ts
import { useCallback } from 'react';

export const useImageDownloader = () => {
  const downloadCard = useCallback(async (cardRef: React.RefObject<HTMLDivElement | null>, fileName: string) => {
    const html2canvasInstance = (window as any).html2canvas;
    
    if (!cardRef.current || !html2canvasInstance) {
      alert("截圖功能尚未準備好，請稍後再試。");
      return;
    }

    try {
      const canvas = await html2canvasInstance(cardRef.current, { 
        scale: 3, 
        useCORS: true, 
        backgroundColor: '#0a0a0a', 
        onclone: (clonedDoc: Document) => {
          const qrElement = clonedDoc.getElementById('download-qr-code');
          const mainCardElement = qrElement?.closest('.aspect-\\[4\\/5\\]') as HTMLElement;
          const nameContainer = qrElement?.parentElement; // 名字的容器

          if (qrElement && mainCardElement) {
            // 1. QR Code 移至右下角，避免干擾畫面核心
            qrElement.style.display = 'block';
            qrElement.style.position = 'absolute';
            qrElement.style.bottom = '25px';
            qrElement.style.right = '20px';
            qrElement.style.left = 'auto'; 
            qrElement.style.transform = 'none';
            qrElement.style.marginBottom = '0';
            qrElement.style.zIndex = '50';
            
            const qrContainer = qrElement.querySelector('div');
            if (qrContainer) {
              qrContainer.style.padding = '4px';
              qrContainer.style.background = 'rgba(255, 255, 255, 0.85)';
              qrContainer.style.borderRadius = '6px';
            }

            const qrImg = qrElement.querySelector('img');
            if (qrImg) {
              qrImg.style.width = '45px';
              qrImg.style.height = '45px';
            }
          }

          // 2. 強制優化背景圖片 (提升渲染品質與明亮度)
          if (mainCardElement) {
            const bgImg = mainCardElement.querySelector('img.object-cover') as HTMLElement;
            if (bgImg) {
              bgImg.style.objectFit = 'cover';
              bgImg.style.width = '100%';
              bgImg.style.height = '100%';
              bgImg.style.opacity = '0.75'; // 稍微調亮，讓下載的圖片更有層次
            }
          }

          // 3. 解決 LOGO 變形問題
          const logos = clonedDoc.querySelectorAll('img[alt="悠然餘閒"]');
          logos.forEach((logo: any) => {
            logo.style.objectFit = 'contain';
            logo.style.width = '100%';
            logo.style.height = 'auto';
            logo.style.maxWidth = '100%';
          });

          // 4. 英文字水印 (精準定位在名字後方)
          if (nameContainer) {
            const watermark = clonedDoc.createElement('div');
            watermark.innerHTML = 'YURAN YUXIAN © AESTHETIC NAME';
            watermark.style.position = 'absolute';
            watermark.style.top = '-15px'; // 放在名字正上方
            watermark.style.left = '50%';
            watermark.style.transform = 'translateX(-50%)';
            watermark.style.width = '100%';
            watermark.style.color = 'rgba(255, 255, 255, 0.35)'; // 半透明設定
            watermark.style.fontSize = '9px';
            watermark.style.letterSpacing = '3px';
            watermark.style.fontFamily = 'serif';
            watermark.style.whiteSpace = 'nowrap';
            watermark.style.zIndex = '0'; // 確保在名字底下

            // 確保名字本身在浮水印之上
            const nameText = nameContainer.querySelector('p');
            if (nameText) {
              nameText.style.position = 'relative';
              nameText.style.zIndex = '10';
              // 加上一點文字陰影，確保名字不會被浮水印吃掉
              nameText.style.textShadow = '0 4px 12px rgba(0,0,0,0.9)'; 
            }

            nameContainer.appendChild(watermark);
          }

          // 5. 加入質感細邊框
          if (mainCardElement) {
            const overlayBorder = clonedDoc.createElement('div');
            overlayBorder.style.position = 'absolute';
            overlayBorder.style.inset = '0';
            overlayBorder.style.border = '1px solid rgba(217, 119, 6, 0.25)'; // 琥珀色
            overlayBorder.style.pointerEvents = 'none';
            overlayBorder.style.zIndex = '40';
            mainCardElement.appendChild(overlayBorder);
          }
        }
      });

      const link = document.createElement('a');
      link.download = fileName;
      link.href = canvas.toDataURL('image/jpeg', 0.95);
      link.click();
      
    } catch (error) {
      console.error("截圖失敗:", error);
      alert("下載過程中發生錯誤，請重試。");
    }
  }, []);

  return { downloadCard };
};