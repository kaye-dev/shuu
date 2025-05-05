import React, { useEffect, useState } from 'react';
import fileIcon from '../../../assets/google-icons/edit.svg';
import folderIcon from '../../../assets/google-icons/file_open.svg';
import searchIcon from '../../../assets/google-icons/search.svg';
import closeIcon from '../../../assets/google-icons/close.svg';

interface RecentItem {
  path: string;
  name: string;
  type: 'file' | 'directory';
  timestamp: number;
}

interface RecentFilesProps {
  onFileSelect: (file: { path: string; name: string }) => void;
  onDirectorySelect: (directory: { path: string; name: string }) => void;
}

const RecentFiles: React.FC<RecentFilesProps> = ({ onFileSelect, onDirectorySelect }) => {
  const [recentItems, setRecentItems] = useState<RecentItem[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // ローカルストレージから最近のファイルを読み込む
  useEffect(() => {
    try {
      const savedItems = localStorage.getItem('recentItems');
      if (savedItems) {
        setRecentItems(JSON.parse(savedItems));
      }
    } catch (error) {
      console.error('最近のファイル読み込みエラー:', error);
    }
  }, []);

  // ファイルやフォルダがクリックされたときの処理
  const handleItemClick = (item: RecentItem) => {
    // クリックされたアイテムのタイムスタンプを更新
    const updatedItems = recentItems.map(i => {
      if (i.path === item.path) {
        return { ...i, timestamp: Date.now() };
      }
      return i;
    });

    // アイテムタイプに応じて処理
    if (item.type === 'file') {
      onFileSelect({ path: item.path, name: item.name });
    } else {
      onDirectorySelect({ path: item.path, name: item.name });
    }

    // 更新されたリストを保存
    setRecentItems(updatedItems);
    localStorage.setItem('recentItems', JSON.stringify(updatedItems));
  };

  // 検索クエリが変更されたときの処理
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  // 検索ボックスのクリアボタンがクリックされたときの処理
  const clearSearch = () => {
    setSearchQuery('');
  };

  // アイテムを削除する処理
  const handleDeleteItem = (e: React.MouseEvent, path: string) => {
    // イベントの伝播を停止してファイルが開かないようにする
    e.stopPropagation();

    // 削除対象を除外した新しい配列を作成
    const updatedItems = recentItems.filter(item => item.path !== path);

    // 状態を更新
    setRecentItems(updatedItems);

    // ローカルストレージに保存
    localStorage.setItem('recentItems', JSON.stringify(updatedItems));
  };

  // 最新のアイテムから降順でソート
  const sortedItems = [...recentItems].sort((a, b) => b.timestamp - a.timestamp);

  // 検索クエリに基づいてアイテムをフィルタリング
  const filteredItems = searchQuery.trim() === ''
    ? sortedItems
    : sortedItems.filter(item => {
        const query = searchQuery.toLowerCase();
        return (
          item.name.toLowerCase().includes(query) ||
          item.path.toLowerCase().includes(query)
        );
      });

  return (
    <div className="recent-files">
      <h2 className="recent-files-title">最近開いたファイル</h2>

      {/* 検索ボックス */}
      <div className="search-box">
        <div className="search-input-container">
          <img src={searchIcon} alt="検索" className="search-icon" />
          <input
            type="text"
            placeholder="ファイル名やパスで検索..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="search-input"
          />
          {searchQuery && (
            <button onClick={clearSearch} className="search-clear-button">
              ✕
            </button>
          )}
        </div>
      </div>

      {sortedItems.length === 0 ? (
        <div className="no-recent-files">
          <p>最近開いたファイルはありません</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="no-recent-files">
          <p>検索条件に一致するファイルがありません</p>
        </div>
      ) : (
        <div className="recent-files-list">
          {filteredItems.map((item) => (
            <div
              key={item.path}
              className="recent-file-item"
              onClick={() => handleItemClick(item)}
            >
              <img
                src={item.type === 'file' ? fileIcon : folderIcon}
                alt={item.type === 'file' ? 'ファイル' : 'フォルダ'}
                className="recent-file-icon"
              />
              <div className="recent-file-info">
                <span className="recent-file-name">{item.name}</span>
                <span className="recent-file-path">{item.path}</span>
              </div>
              <button
                className="delete-button"
                onClick={(e) => handleDeleteItem(e, item.path)}
                title="削除"
              >
                <img src={closeIcon} alt="削除" className="delete-icon" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// 最近のファイルやフォルダをリストに追加する関数（外部から呼び出し可能）
export const addRecentItem = (item: { path: string; name: string; type: 'file' | 'directory' }) => {
  try {
    // 現在の最近のアイテムを取得
    const savedItemsStr = localStorage.getItem('recentItems');
    let savedItems: RecentItem[] = [];

    if (savedItemsStr) {
      savedItems = JSON.parse(savedItemsStr);
    }

    // 同じパスのアイテムが既に存在するか確認
    const existingIndex = savedItems.findIndex(i => i.path === item.path);

    if (existingIndex !== -1) {
      // 既存のアイテムを更新
      savedItems[existingIndex] = {
        ...savedItems[existingIndex],
        timestamp: Date.now()
      };
    } else {
      // 新しいアイテムを追加
      const newItem: RecentItem = {
        ...item,
        timestamp: Date.now()
      };

      // リストのサイズを制限（最大20項目）
      if (savedItems.length >= 20) {
        // 最も古いアイテムを削除
        savedItems.sort((a, b) => b.timestamp - a.timestamp);
        savedItems.pop();
      }

      savedItems.push(newItem);
    }

    // 更新されたリストを保存
    localStorage.setItem('recentItems', JSON.stringify(savedItems));

    return true;
  } catch (error) {
    console.error('最近のアイテム保存エラー:', error);
    return false;
  }
};

export default RecentFiles;
