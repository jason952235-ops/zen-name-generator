

interface StencilProps {
  chineseName?: string;
  fontFamily?: string; // 接收動態字體
}

export default function StencilPreview({
  chineseName = "漠無跡",
  fontFamily = "'Liu Jian Mao Cao', cursive"
}: StencilProps) {
  return (
    <div style={{ width: '280px', height: '280px', backgroundColor: '#ffffff', backgroundImage: 'linear-gradient(45deg, #e0e0e0 25%, transparent 25%), linear-gradient(-45deg, #e0e0e0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e0e0e0 75%), linear-gradient(-45deg, transparent 75%, #e0e0e0 75%)', backgroundSize: '20px 20px', backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px', borderRadius: '12px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', border: '2px dashed #999', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', backgroundColor: '#1A1A1A', color: '#ffffff', fontSize: '11px', textAlign: 'center', padding: '6px 0', letterSpacing: '0.15em', fontWeight: 'bold', textTransform: 'uppercase' }}>
        Transparent PNG Stencil
      </div>
      <div style={{
        fontFamily: fontFamily, // 使用動態字體
        fontSize: '85px',
        color: '#000000', 
        lineHeight: 1,
        marginTop: '20px',
        whiteSpace: 'nowrap'
      }}>
        {chineseName}
      </div>
      <div style={{ position: 'absolute', bottom: '15px', left: '20px', fontSize: '14px', color: '#666', fontFamily: 'monospace' }}>+</div>
      <div style={{ position: 'absolute', bottom: '15px', right: '20px', fontSize: '14px', color: '#666', fontFamily: 'monospace' }}>+</div>
      <div style={{ position: 'absolute', bottom: '15px', width: '100%', textAlign: 'center', fontSize: '9px', color: '#666', letterSpacing: '0.1em', fontWeight: 'bold' }}>TATTOO READY</div>
    </div>
  );
}