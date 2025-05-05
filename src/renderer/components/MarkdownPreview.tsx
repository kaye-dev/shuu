import React, { useEffect, KeyboardEvent } from 'react';
import { marked } from 'marked';

interface MarkdownPreviewProps {
  content: string;
  fileName: string;
  onClose: () => void;
}

const MarkdownPreview: React.FC<MarkdownPreviewProps> = ({ content, fileName, onClose }) => {
  // Markdownをパースしてレンダリング
  const renderMarkdown = () => {
    try {
      const html = marked(content);
      return { __html: html };
    } catch (error) {
      console.error('Markdown parsing error:', error);
      return { __html: '<p>プレビューの生成中にエラーが発生しました。</p>' };
    }
  };

  // キーボードショートカットのイベントリスナーを追加
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'p') {
        e.preventDefault(); // ブラウザの印刷ダイアログを防止
        onClose();
      }
    };

    // イベントリスナーを追加
    document.addEventListener('keydown', handleKeyDown as any);

    // クリーンアップ関数
    return () => {
      document.removeEventListener('keydown', handleKeyDown as any);
    };
  }, [onClose]);

  return (
    <div className="markdown-preview-container">
      <div className="markdown-preview-header">
        <span className="markdown-preview-title">{fileName} - プレビュー</span>
        <button className="markdown-preview-close" onClick={onClose}>閉じる</button>
      </div>
      <div 
        className="markdown-preview-content"
        dangerouslySetInnerHTML={renderMarkdown()}
      />
      <div className="keyboard-shortcut-hint">
        エディタに戻る: ⌘+P
      </div>
    </div>
  );
};

export default MarkdownPreview;
