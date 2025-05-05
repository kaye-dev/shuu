/**
 * レンダラープロセス用のパスユーティリティ関数
 * Electronのレンダラープロセスでは直接Node.jsのpathモジュールを使用できないため、
 * 必要な関数を実装します
 */

/**
 * ファイルパスからディレクトリ名を取得する
 * @param filePath ファイルパス
 * @returns ディレクトリパス
 */
export function dirname(filePath: string): string {
  // パスの区切り文字を正規化（WindowsとMacの両方に対応）
  const normalizedPath = filePath.replace(/\\/g, '/');
  // 最後のスラッシュの位置を取得
  const lastSlashIndex = normalizedPath.lastIndexOf('/');

  // スラッシュが見つからない場合は空文字列を返す
  if (lastSlashIndex === -1) {
    return '';
  }

  // ディレクトリパスを返す
  return normalizedPath.substring(0, lastSlashIndex);
}

/**
 * ファイルパスからファイル名を取得する
 * @param filePath ファイルパス
 * @returns ファイル名
 */
export function basename(filePath: string): string {
  // パスの区切り文字を正規化（WindowsとMacの両方に対応）
  const normalizedPath = filePath.replace(/\\/g, '/');
  // 最後のスラッシュの位置を取得
  const lastSlashIndex = normalizedPath.lastIndexOf('/');

  // スラッシュが見つからない場合はパス全体を返す
  if (lastSlashIndex === -1) {
    return normalizedPath;
  }

  // ファイル名を返す
  return normalizedPath.substring(lastSlashIndex + 1);
}
