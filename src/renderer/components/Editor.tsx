import React, { useState, useEffect, useRef, KeyboardEvent } from 'react';

interface EditorProps {
  content: string;
  fileName: string;
  filePath?: string | null;
  isModified?: boolean; // 未保存状態かどうか
  onChange: (content: string) => void;
  onFileNameChange: (fileName: string) => void;
  onPreviewToggle: () => void;
  onSave: () => void;
  initialCursor?: { // カーソル位置を指定するためのプロパティ
    line: number;
    column?: number;
  };
}

const Editor: React.FC<EditorProps> = ({
  content,
  fileName,
  filePath,
  isModified = false,
  onChange,
  onFileNameChange,
  onPreviewToggle,
  onSave,
  initialCursor
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  const [isEditingFileName, setIsEditingFileName] = useState(false);
  const [editedFileName, setEditedFileName] = useState(fileName);
  const fileNameInputRef = useRef<HTMLInputElement>(null);
  const [activeCursor, setActiveCursor] = useState(initialCursor);
  const hasUserTyped = useRef(false);

  // ファイル名が変更されたら編集中のファイル名も更新
  useEffect(() => {
    setEditedFileName(fileName);
  }, [fileName]);

  // initialCursorの変更を検出
  useEffect(() => {
    // lineNumber = -1 は新規作成ファイルの特別なフラグ
    if (initialCursor && initialCursor.line === -1) {
      // 新規ファイル作成時は特別処理（フォーカスのみ）
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
      // カーソル位置は設定しない（デフォルトの動作に任せる）
      setActiveCursor(undefined);
    } else {
      // 通常のカーソル位置設定
      setActiveCursor(initialCursor);
      hasUserTyped.current = false;
    }
  }, [initialCursor]);

  // 初期カーソル位置の設定
  useEffect(() => {
    if (!textareaRef.current || !activeCursor || hasUserTyped.current) return;

    // 行番号と列位置からカーソル位置（文字位置）を特定する
    const lines = content.split('\n');
    if (activeCursor.line > lines.length) return;

    // 指定された行の前にある全ての行の文字数の合計（改行文字を含む）
    let position = 0;
    for (let i = 0; i < activeCursor.line - 1; i++) {
      position += lines[i].length + 1; // +1 は改行文字分
    }

    // 列位置が指定されていれば、その位置を加算
    if (activeCursor.column !== undefined) {
      const lineLength = lines[activeCursor.line - 1].length;
      const column = Math.min(activeCursor.column, lineLength);
      position += column;
    }

    // カーソル位置を設定
    textareaRef.current.focus();
    textareaRef.current.setSelectionRange(position, position);

    // スクロール位置も調整（カーソルが見える位置にスクロール）
    const lineHeight = 20; // 行の高さ（ピクセル）の推定値
    const scrollPosition = (activeCursor.line - 1) * lineHeight;
    textareaRef.current.scrollTop = scrollPosition - textareaRef.current.clientHeight / 2;

    // 行番号のスクロール位置も同期
    if (lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  }, [content, activeCursor]);

  // ファイル名編集モードになったらフォーカスを当てる
  useEffect(() => {
    if (isEditingFileName && fileNameInputRef.current) {
      fileNameInputRef.current.focus();
      // ファイル名の拡張子前にカーソルを配置
      const extensionIndex = fileName.lastIndexOf('.');
      if (extensionIndex > 0) {
        fileNameInputRef.current.setSelectionRange(0, extensionIndex);
      } else {
        fileNameInputRef.current.select();
      }
    }
  }, [isEditingFileName, fileName]);

  // スクロール同期のためのハンドラ
  const handleScroll = () => {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  // テキスト変更時のハンドラ
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    // ユーザーがテキストを変更したことを記録（カーソル制御解除のため）
    hasUserTyped.current = true;
    onChange(e.target.value);
  };

  // キーボードショートカットのハンドラ
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // ユーザーがキー入力したことを記録（カーソル制御解除のため）
    hasUserTyped.current = true;

    // ⌘+S (macOS) または Ctrl+S (Windows/Linux) で保存
    if ((e.metaKey || e.ctrlKey) && e.key === 's') {
      e.preventDefault(); // ブラウザのデフォルト保存ダイアログを防止
      onSave();
    }
    // ⌘+P (macOS) または Ctrl+P (Windows/Linux) でプレビュー
    else if ((e.metaKey || e.ctrlKey) && e.key === 'p') {
      e.preventDefault();
      onPreviewToggle();
    }
  };

  // ファイル名クリック時のハンドラ
  const handleFileNameClick = () => {
    setIsEditingFileName(true);
  };

  // ファイル名変更時のハンドラ
  const handleFileNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditedFileName(e.target.value);
  };

  // ファイル名編集完了時のハンドラ
  const handleFileNameBlur = () => {
    finishEditingFileName();
  };

  // Enterキーでファイル名編集完了
  const handleFileNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      finishEditingFileName();
    } else if (e.key === 'Escape') {
      // Escキーでキャンセル
      setEditedFileName(fileName);
      setIsEditingFileName(false);
    }
  };

  // ファイル名編集完了の処理
  const finishEditingFileName = () => {
    setIsEditingFileName(false);

    // 空のファイル名は許可しない
    if (!editedFileName.trim()) {
      setEditedFileName(fileName);
      return;
    }

    // 拡張子がない場合は.mdを追加
    let newFileName = editedFileName;
    if (!newFileName.includes('.')) {
      newFileName = `${newFileName}.md`;
    }

    onFileNameChange(newFileName);
  };

  // 行数を計算
  const lineCount = content.split('\n').length;

  // 行番号を生成
  const lineNumbers = Array.from({ length: lineCount }, (_, i) => i + 1);

  return (
    <div className="editor-container">
      <div className="editor-header">
        <div className="editor-header-left">
          {isEditingFileName ? (
            <input
              ref={fileNameInputRef}
              type="text"
              className="editor-filename-input"
              value={editedFileName}
              onChange={handleFileNameChange}
              onBlur={handleFileNameBlur}
              onKeyDown={handleFileNameKeyDown}
            />
          ) : (
            <span
              className="editor-filename editable"
              onClick={handleFileNameClick}
              title="クリックしてファイル名を編集"
            >
              {fileName}
            </span>
          )}
          {filePath && (
            <span className={`editor-filepath ${isModified ? 'modified' : ''}`} title={filePath}>
              {filePath} {isModified && <span className="modified-indicator">⚫︎</span>}
            </span>
          )}
        </div>
        <span className="editor-stats">
          {content.length} 文字 | {lineCount} 行
        </span>
      </div>
      <div className="editor-content">
        <div className="line-numbers" ref={lineNumbersRef}>
          {lineNumbers.map((num) => (
            <div key={num} className="line-number">{num}</div>
          ))}
        </div>
        <textarea
          ref={textareaRef}
          className="editor-textarea"
          value={content}
          onChange={handleChange}
          onScroll={handleScroll}
          onKeyDown={handleKeyDown}
          placeholder="ここに内容を入力してください..."
          wrap="off"
        />
      </div>
    </div>
  );
};

export default Editor;
