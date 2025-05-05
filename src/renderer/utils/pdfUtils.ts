/**
 * PDFファイルのユーティリティ関数
 * PDF.jsを使用して実際のPDFファイルを処理する
 */

declare global {
  interface Window {
    pdfjsLib: any;
  }
}

export interface PageImage {
  dataUrl: string;
  pageNumber: number;
  blob?: Blob; // PDFのBlob
  url?: string; // PDFのURL
}

/**
 * PDFファイルからURLを作成する
 * @param file 選択されたPDFファイル
 * @returns ObjectURL
 */
export function createPdfUrl(file: File): string {
  return URL.createObjectURL(file);
}

/**
 * PDFファイルを閉じる際にリソースを解放する
 */
export function releasePdfResources(url: string): void {
  if (url) {
    URL.revokeObjectURL(url);
  }
}

/**
 * PDFからページ数を取得する
 * PDF.jsを使って正確なページ数を取得
 */
export async function getPdfPageCount(file: File): Promise<number> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    return pdf.numPages;
  } catch (error) {
    console.error('PDFページ数取得エラー:', error);
    return 0;
  }
}

/**
 * PDFの特定のページをレンダリングしてデータURLに変換する
 */
export async function renderPdfPageToDataUrl(
  pdfDocument: any,
  pageNumber: number,
  scale: number = 1.5
): Promise<string> {
  try {
    const page = await pdfDocument.getPage(pageNumber);
    
    // ビューポート設定
    const viewport = page.getViewport({ scale });
    
    // Canvas要素を作成
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas context could not be created');
    
    const renderContext = {
      canvasContext: context,
      viewport,
    };
    
    // ページをレンダリング
    await page.render(renderContext).promise;
    
    // Canvas からデータURLを生成
    return canvas.toDataURL('image/png');
  } catch (error) {
    console.error(`ページ ${pageNumber} のレンダリングエラー:`, error);
    return '';
  }
}

/**
 * 特定のページのみを含む新しいPDFを作成する
 * これは実装が複雑なため、ここでは代わりに画像URLと共にページ番号を返す
 */
export async function extractPdfPage(
  originalPdfUrl: string,
  pageNumber: number
): Promise<string> {
  // 本来はここで新しいPDFを生成する処理を行うが、
  // 現時点ではJavaScriptだけでこれを行うのが複雑なため、
  // 代わりにページ指定のURLを返す
  return `${originalPdfUrl}#page=${pageNumber}`;
}

/**
 * PDFファイルからページ画像を生成
 */
export async function generatePdfPageImages(file: File): Promise<PageImage[]> {
  const pageImages: PageImage[] = [];
  
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDocument = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const numPages = pdfDocument.numPages;
    const originalPdfUrl = createPdfUrl(file);
    
    // 各ページをレンダリングして画像を生成
    for (let i = 1; i <= numPages; i++) {
      // 画像データURLの生成
      const dataUrl = await renderPdfPageToDataUrl(pdfDocument, i);
      
      // 特定のページのみを含むPDFのURLを生成
      const pageUrl = await extractPdfPage(originalPdfUrl, i);
      
      pageImages.push({
        dataUrl,
        pageNumber: i,
        url: pageUrl
      });
    }
    
    return pageImages;
  } catch (error) {
    console.error('PDF処理エラー:', error);
    return [];
  }
}
