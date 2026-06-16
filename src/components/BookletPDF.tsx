interface DisabledBookletProps {
  name?: string;
  pinyin?: string;
  deconstruction?: string;
  poetry?: string;
}

export default function DisabledBooklet(_props: DisabledBookletProps) {
  void _props;
  // 這個舊文件產生元件已停用；目前商品只透過 Gumroad 提供名字內容。
  return null;
}
