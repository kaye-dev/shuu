import React from 'react';
import closeIcon from '../../../assets/google-icons/close.svg';

// ファイルタブの型定義
export interface FileTab {
  id: string; // ユニークなID（通常はファイルパス）
  title: string; // タブに表示するタイトル（ファイル名）
  path: string | null; // ファイルのパス
  content: string; // ファイルの内容
  isModified: boolean; // ファイルが未保存の状態かどうか
}

interface EditorTabsProps {
  tabs: FileTab[]; // 開いているタブのリスト
  activeTabId: string | null; // 現在アクティブなタブのID
  onTabSelect: (tabId: string) => void; // タブ選択ハンドラ
  onTabClose: (tabId: string) => void; // タブ閉じるハンドラ
}

const EditorTabs: React.FC<EditorTabsProps> = ({
  tabs,
  activeTabId,
  onTabSelect,
  onTabClose
}) => {
  // タブが空の場合は何も表示しない
  if (tabs.length === 0) {
    return null;
  }

  // タブ閉じるハンドラ（イベントの伝播を止める）
  const handleTabClose = (e: React.MouseEvent, tabId: string) => {
    e.stopPropagation(); // タブ選択イベントが発火しないようにする
    onTabClose(tabId);
  };

  return (
    <div className="tabs-container">
      {tabs.map((tab) => (
        <div
          key={tab.id}
          className={`tab ${tab.isModified ? 'modified' : ''} ${activeTabId === tab.id ? 'active' : ''}`}
          onClick={() => onTabSelect(tab.id)}
          title={tab.path || tab.title}
        >
          <div className="tab-content">
            <span className="tab-title">{tab.title}</span>
            {tab.isModified && <span className="tab-modified" />}
          </div>
          <div
            className="tab-close"
            onClick={(e) => handleTabClose(e, tab.id)}
            title="閉じる"
          >
            <img src={closeIcon} alt="閉じる" />
          </div>
        </div>
      ))}
    </div>
  );
};

export default EditorTabs;
