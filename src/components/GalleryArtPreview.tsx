import React from 'react';

interface GalleryArtProps {
  chineseName?: string;
  englishDesc?: string;
  fontFamily?: string;
}

export default function GalleryArtPreview({
  chineseName = "漠無跡",
  englishDesc = "Means leaving no trace like shifting sands,\na detached life philosophy.",
  fontFamily = "'Liu Jian Mao Cao', cursive"
} : GalleryArtProps) {
  return (
    <div style={{ width: '280px', height: '420px', backgroundColor: '#1E1E1E', padding: '12px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6), 0 0 0 1px #000', borderRadius: '2px', boxSizing: 'border-box' }}>
      <div style={{ width: '100%', height: '100%', backgroundColor: '#F5F2EB', padding: '28px', boxShadow: 'inset 0 3px 10px rgba(0,0,0,0.15)', boxSizing: 'border-box' }}>
        <div style={{ width: '100%', height: '100%', backgroundColor: '#FCFAF5', border: '1px solid #E8E5DD', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', position: 'relative', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <div style={{
            fontFamily: fontFamily,
            fontSize: '64px',
            color: '#1A1A1A',
            lineHeight: 1,
            marginBottom: '24px',
            letterSpacing: '0.05em',
            whiteSpace: 'nowrap',    // ⬅️ 強制不換行
            wordBreak: 'keep-all'    // ⬅️ 絕對禁止中文字被切斷
          }}>
            {chineseName}
          </div>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '11px', color: '#555555', letterSpacing: '0.15em', lineHeight: 1.6, fontStyle: 'italic', textAlign: 'center', whiteSpace: 'pre-line', padding: '0 16px' }}>
            {englishDesc}
          </div>
          <div style={{ position: 'absolute', bottom: '16px', right: '16px', width: '24px', height: '24px', mixBlendMode: 'multiply' }}>
            <img src="/LOGO.png" alt="Authentic Seal" style={{ width: '100%', height: '100%', objectFit: 'contain' }} onError={(e) => { e.currentTarget.src = "/LOGO.jpg"; }} />
          </div>
        </div>
      </div>
    </div>
  );
}