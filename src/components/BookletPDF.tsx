import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font, Image } from '@react-pdf/renderer';

// ==========================================
// 1. 註冊字體 (PDF 必須明確載入字體檔才能顯示中文)
// 注意：實際環境中，您需要將 .ttf 字體檔放在 public 資料夾下
// ==========================================
Font.register({
  family: 'Noto Serif TC',
  src: 'https://fonts.gstatic.com/ea/notoseriftc/v1/NotoSerifTC-Regular.woff2' // 這裡先用網路字體做範例，建議之後換成本地 .ttf
});

// ==========================================
// 2. 定義 PDF 專屬的樣式表 (類似 CSS，但有限制)
// ==========================================
const styles = StyleSheet.create({
  page: {
    flexDirection: 'row',
    backgroundColor: '#F5F2EB', // 宣紙底色
    width: '100%',
    height: '100%',
  },
  leftPage: {
    flex: 1,
    padding: 50,
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: '#E5E5E5',
    borderRightStyle: 'solid',
  },
  rightPage: {
    flex: 1,
    padding: 50,
    justifyContent: 'center',
    backgroundColor: '#FCFAF5',
  },
  chapterTitle: {
    fontSize: 10,
    color: '#B32424', // 硃砂紅
    letterSpacing: 2,
    marginBottom: 20,
    fontFamily: 'Helvetica-Bold',
  },
  chapterTitleRight: {
    fontSize: 10,
    color: '#B32424',
    letterSpacing: 2,
    marginBottom: 20,
    textAlign: 'right',
    fontFamily: 'Helvetica-Bold',
  },
  chineseName: {
    fontFamily: 'Noto Serif TC', // 需替換為您的書法字體
    fontSize: 64,
    color: '#1A1A1A',
    marginBottom: 10,
  },
  pinyin: {
    fontFamily: 'Helvetica',
    fontSize: 12,
    color: '#666666',
    letterSpacing: 3,
    textTransform: 'uppercase',
    marginBottom: 40,
  },
  divider: {
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    paddingTop: 20,
  },
  elementText: {
    fontFamily: 'Helvetica',
    fontSize: 12,
    color: '#333333',
    lineHeight: 1.5,
    marginBottom: 10,
  },
  philosophyText: {
    fontFamily: 'Helvetica',
    fontSize: 12,
    color: '#555555',
    lineHeight: 1.6,
  },
  chinesePoetry: {
    fontFamily: 'Noto Serif TC',
    fontSize: 20,
    color: '#1A1A1A',
    lineHeight: 2,
    letterSpacing: 2,
    marginBottom: 15,
  },
  englishPoetry: {
    fontFamily: 'Helvetica-Oblique',
    fontSize: 14,
    color: '#555555',
    lineHeight: 1.8,
  },
  pageNumber: {
    position: 'absolute',
    bottom: 30,
    right: 40,
    fontSize: 10,
    color: '#999999',
    fontFamily: 'Helvetica',
  }
});

// ==========================================
// 3. 定義傳入的資料介面 (這就是未來 AI 給我們的 JSON)
// ==========================================
interface BookletPDFProps {
  name: string;
  pinyin: string;
  deconstruction: {
    elements: string;
    philosophy: string;
  };
  poetry: {
    chinese: string;
    english: string;
  };
}

// ==========================================
// 4. 建立 PDF 文件結構
// ==========================================
export default function BookletPDF({ name, pinyin, deconstruction, poetry }: BookletPDFProps) {
  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        
        {/* 左頁：名字解構 */}
        <View style={styles.leftPage}>
          <Text style={styles.chapterTitle}>CHAPTER I. ORIGIN</Text>
          <Text style={styles.chineseName}>{name}</Text>
          <Text style={styles.pinyin}>{pinyin}</Text>
          
          <View style={styles.divider}>
            <Text style={styles.elementText}>
              <Text style={{ fontFamily: 'Helvetica-Bold' }}>Elements: </Text>
              {deconstruction.elements}
            </Text>
            <Text style={styles.philosophyText}>
              <Text style={{ fontFamily: 'Helvetica-Bold' }}>Philosophy: </Text>
              {deconstruction.philosophy}
            </Text>
          </View>
        </View>

        {/* 右頁：AI 專屬雙語詩詞 */}
        <View style={styles.rightPage}>
          <Text style={styles.chapterTitleRight}>CHAPTER II. POETRY</Text>
          
          <Text style={styles.chinesePoetry}>
            {poetry.chinese.split('，').join('，\n')} 
            {/* 遇到逗號自動換行，形成古典詩詞排版 */}
          </Text>
          
          <Text style={styles.englishPoetry}>
            {poetry.english}
          </Text>

          <Text style={styles.pageNumber}>03</Text>
        </View>

      </Page>
    </Document>
  );
}