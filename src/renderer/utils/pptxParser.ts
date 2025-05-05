export interface SlideData {
  id: number;
  image: string; // Base64 encoded image
  notes?: string;
}

/**
 * PPTXファイルをパースしてスライドとスピーカーノートを抽出するユーティリティ
 * 注: 実際のPPTX解析の代わりにモックデータを返します
 */
export async function parsePptx(_pptxFile: File): Promise<SlideData[]> {
  try {
    // ファイル名からスライド数を決定（デモ用）
    const randomSlideCount = Math.floor(Math.random() * 8) + 3; // 3〜10枚のスライド

    // デモ用のスライドデータを生成
    const slides: SlideData[] = [];

    for (let i = 0; i < randomSlideCount; i++) {
      const slideId = i + 1;
      const hasNotes = Math.random() > 0.3; // 70%の確率でノートあり

      slides.push({
        id: slideId,
        image: createPlaceholderImage(slideId),
        notes: hasNotes ? createDemoNotes(slideId) : undefined
      });
    }

    // 読み込み中の演出のため少し待機
    await new Promise(resolve => setTimeout(resolve, 1000));

    return slides;
  } catch (error) {
    console.error('PPTXファイルの解析に失敗しました:', error);
    throw error;
  }
}

/**
 * デモ用のスピーカーノートを生成
 */
function createDemoNotes(slideNumber: number): string {
  const noteTemplates = [
    `スライド${slideNumber}のスピーカーノートです。ここに説明を追加します。`,
    `このスライドでは、プロジェクトの主要な目標について説明します。\n- 目標1\n- 目標2\n- 目標3`,
    `ここでの重要なポイントは以下の通りです：\n1. 最初のポイント\n2. 次のポイント\n3. 最後のポイント`,
    `このグラフは前年比20%の成長を示しています。特に第3四半期の伸びが顕著です。`,
    `このセクションでは技術的な詳細に触れますが、質問があれば後ほど対応します。`,
    `ここで強調したいのは、チームの協力によって達成された成果です。全員の貢献に感謝します。`,
  ];

  // ランダムにテンプレートを選択
  const randomIndex = Math.floor(Math.random() * noteTemplates.length);
  return noteTemplates[randomIndex];
}

/**
 * 文字列を安全にBase64エンコードする（マルチバイト文字対応）
 */
function safeBase64Encode(str: string): string {
  // マルチバイト文字を含む文字列を安全にエンコード
  return window.btoa(
    encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) =>
      String.fromCharCode(parseInt(p1, 16))
    )
  );
}

/**
 * プレースホルダー画像を作成する (番号付きのシンプルな色付き矩形)
 */
function createPlaceholderImage(slideNumber: number): string {
  // 英語のテキストのみを使用してSVGを生成
  const svgContent = `
    <svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
      <rect width="800" height="600" fill="#f0f0f0" />
      <text x="400" y="300" font-family="Arial" font-size="48" text-anchor="middle" dominant-baseline="middle">
        Slide ${slideNumber}
      </text>
    </svg>
  `;

  try {
    return `data:image/svg+xml;base64,${safeBase64Encode(svgContent)}`;
  } catch (error) {
    console.error('SVGエンコードエラー:', error);
    // エラーが発生した場合は、よりシンプルなSVGを返す
    return `data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4MDAiIGhlaWdodD0iNjAwIj48cmVjdCB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgZmlsbD0iI2YwZjBmMCIvPjx0ZXh0IHg9IjQwMCIgeT0iMzAwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iNDgiIHRleHQtYW5jaG9yPSJtaWRkbGUiPg==`;
  }
}
