

interface BookletProps {
  chineseName?: string;
  pinyin?: string;
  fontFamily?: string;
}

export default function BookletPreview({
  chineseName = "漠無跡",
  pinyin = "Mò Wú-jì",
  fontFamily = "'Liu Jian Mao Cao', cursive"
}: BookletProps) {
  return (
    // 最外層：模擬雜誌的整體尺寸與陰影
    <div style={{
      width: '360px',
      height: '240px', // 呈現長方形的翻開書本比例
      backgroundColor: '#F5F2EB', // 宣紙底色
      display: 'flex',
      borderRadius: '4px',
      boxShadow: '0 20px 40px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      
      {/* 雜誌中線的立體陰影 (書脊凹陷感) */}
      <div style={{
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: '50%',
        width: '40px',
        transform: 'translateX(-50%)',
        background: 'linear-gradient(to right, transparent, rgba(0,0,0,0.08) 45%, rgba(0,0,0,0.12) 50%, rgba(0,0,0,0.04) 55%, transparent)',
        zIndex: 10,
        pointerEvents: 'none'
      }}></div>

      {/* ================= 左頁：名字解構 (Name Deconstruction) ================= */}
      <div style={{
        flex: 1,
        padding: '24px 20px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        borderRight: '1px solid rgba(0,0,0,0.05)',
        position: 'relative'
      }}>
        <div style={{ fontSize: '8px', color: '#B32424', letterSpacing: '0.2em', fontWeight: 'bold', marginBottom: '12px' }}>
          CHAPTER I. ORIGIN
        </div>
        
        {/* 書法字與拼音 */}
        <div style={{ fontFamily: fontFamily, fontSize: '42px', color: '#1A1A1A', lineHeight: 1, marginBottom: '8px', whiteSpace: 'nowrap' }}>
          {chineseName}
        </div>
        <div style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '9px', color: '#666', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '16px' }}>
          {pinyin}
        </div>

        {/* 哲學解構 (模擬版面) */}
        <div style={{ borderTop: '1px solid #E5E5E5', paddingTop: '12px' }}>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '9px', color: '#333', lineHeight: 1.5 }}>
            <span style={{ fontWeight: 'bold', fontStyle: 'italic' }}>Elements:</span> Water & Earth.<br/>
            <span style={{ fontWeight: 'bold', fontStyle: 'italic' }}>Philosophy:</span> Wabi-Sabi.<br/>
            The character reflects a soul unburdened by the past, flowing freely.
          </div>
        </div>
      </div>

      {/* ================= 右頁：專屬詩詞 (AI Zen Poetry) ================= */}
      <div style={{
        flex: 1,
        padding: '24px 20px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        backgroundColor: '#FCFAF5' // 右頁稍微亮一點，增加立體感
      }}>
        <div style={{ fontSize: '8px', color: '#B32424', letterSpacing: '0.2em', fontWeight: 'bold', marginBottom: '16px', textAlign: 'right' }}>
          CHAPTER II. POETRY
        </div>

        {/* 詩詞區 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* 中文詩 (模擬楷體) */}
          <div style={{ fontFamily: "'Ma Shan Zheng', cursive", fontSize: '14px', color: '#1A1A1A', lineHeight: 1.6, letterSpacing: '0.1em' }}>
            風過疏竹不留聲，<br/>
            流沙萬里任平生。
          </div>
          
          {/* 英文詩 (極致詩意排版) */}
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '9.5px', color: '#555555', fontStyle: 'italic', lineHeight: 1.6, letterSpacing: '0.05em' }}>
            Wind sweeps the bamboo, leaving no echo behind.<br/>
            Across endless shifting sands, a spirit unconfined.
          </div>
        </div>
        
        {/* 頁碼 */}
        <div style={{ position: 'absolute', bottom: '16px', right: '24px', fontSize: '8px', color: '#999', fontFamily: "'Montserrat', sans-serif" }}>
          03
        </div>
      </div>

    </div>
  );
}