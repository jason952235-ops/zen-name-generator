import React from 'react';

interface WallpaperProps {
  chineseName?: string;
  englishDesc?: string;
  ipId?: string;
  fontFamily?: string; // 接收動態字體
}

export default function WallpaperPreview({
  chineseName = "漠無跡",
  englishDesc = "Means leaving no trace like shifting sands,\na detached life philosophy.",
  ipId = "IP ID: YR-00482",
  fontFamily = "'Liu Jian Mao Cao', cursive" // 預設字體
}: WallpaperProps) {
  return (
    <div style={{ width: '390px', height: '844px', backgroundColor: '#F9F6F0', position: 'relative', display: 'flex', flexDirection: 'column', boxShadow: '0 15px 35px rgba(0,0,0,0.15)' }}>
      <div style={{ height: '35%' }}></div>
      <div style={{ textAlign: 'center', padding: '0 40px' }}>
        <div style={{
          fontFamily: fontFamily, // 使用動態字體
          fontSize: '90px',
          color: '#1A1A1A',
          lineHeight: 1,
          marginBottom: '24px',
          textShadow: '2px 2px 4px rgba(0,0,0,0.05)',
          whiteSpace: 'nowrap'
        }}>
          {chineseName}
        </div>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '15px', color: '#555555', letterSpacing: '0.18em', lineHeight: 1.6, fontStyle: 'italic', whiteSpace: 'pre-line' }}>
          {englishDesc}
        </div>
      </div>
      <div style={{ position: 'absolute', bottom: '70px', right: '40px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
        <div style={{ width: '32px', height: '32px', marginBottom: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center', mixBlendMode: 'multiply' }}>
          <img src="/LOGO.png" alt="IP Seal" style={{ width: '100%', height: '100%', objectFit: 'contain' }} onError={(e) => { e.currentTarget.src = "/LOGO.jpg"; }} />
        </div>
        <div style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '10px', color: '#999999', letterSpacing: '0.1em' }}>
          {ipId}
        </div>
      </div>
    </div>
  );
}