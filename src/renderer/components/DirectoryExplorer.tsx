import React, { useState, useCallback, useEffect, useRef, FC } from 'react';
import ReactDOM from 'react-dom';
import arrowForwardIcon from '../../../assets/google-icons/arrow_forward_ios.svg';
import fileIcon from '../../../assets/google-icons/edit.svg';
import folderIcon from '../../../assets/google-icons/file_open.svg';
import closeIcon from '../../../assets/google-icons/close.svg';
import addIcon from '../../../assets/google-icons/add.svg';
import deleteIcon from '../../../assets/google-icons/delete.svg';

// モーダル用ポータルコンポーネント
const ModalPortal: FC<{ children: React.ReactNode; isOpen: boolean }> = ({ children, isOpen }) => {
  if (!isOpen) return null;

  return ReactDOM.createPortal(
    children,
    document.body
  );
};

// 削除確認モーダルコンポーネント
interface DeleteItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDelete: () => Promise<void>;
  itemName: string;
  itemType: 'file' | 'directory';
}

const DeleteItemModal: FC<DeleteItemModalProps> = ({
  isOpen,
  onClose,
  onDelete,
  itemName,
  itemType
}) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirmDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDeleting(true);
    try {
      await onDelete();
      onClose();
    } catch (error) {
      console.error('削除エラー:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const typeText = itemType === 'file' ? 'ファイル' : 'フォルダ';
  const detailMessage = itemType === 'directory'
    ? 'この操作はフォルダとその中の全てのファイルを完全に削除します。この操作は元に戻せません。'
    : 'この操作は元に戻せません。';

  return (
    <ModalPortal isOpen={isOpen}>
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-container" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h2 className="modal-title">{typeText}の削除</h2>
            <div className="modal-close" onClick={onClose}>
              <img src={closeIcon} alt="閉じる" style={{ width: '16px', height: '16px' }} />
            </div>
          </div>
          <div className="modal-content">
            <p className="modal-message">{typeText}「{itemName}」を削除してもよろしいですか？</p>
            <p className="modal-detail">{detailMessage}</p>
          </div>
          <div className="modal-footer">
            <button type="button" className="modal-btn" onClick={onClose} disabled={isDeleting}>
              キャンセル
            </button>
            <button
              type="button"
              className="modal-btn modal-btn-danger"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? '削除中...' : '削除'}
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
};

// 作成モーダルコンポーネント
interface CreateItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateItem: (name: string, type: 'file' | 'directory', parentPath: string) => Promise<void>;
  rootDirectory: FileSystemItem | null;
  itemType: 'file' | 'directory';
  defaultParentPath: string;
}

const CreateItemModal: FC<CreateItemModalProps> = ({
  isOpen,
  onClose,
  onCreateItem,
  rootDirectory,
  itemType: initialItemType,
  defaultParentPath
}) => {
  // 自身でファイルタイプを管理できるようにする
  const [currentItemType, setCurrentItemType] = useState(initialItemType);
  const [itemName, setItemName] = useState(currentItemType === 'file' ? 'newFile.md' : 'newFolder');
  const [selectedPath, setSelectedPath] = useState(defaultParentPath);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCurrentItemType(initialItemType);
      setItemName(initialItemType === 'file' ? 'newFile.md' : 'newFolder');
      setSelectedPath(defaultParentPath);
    }
  }, [isOpen, initialItemType, defaultParentPath]);

  // ファイルタイプを変更した時に名前も更新する
  const handleTypeChange = (type: 'file' | 'directory') => {
    setCurrentItemType(type);
    setItemName(type === 'file' ? 'newFile.md' : 'newFolder');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName.trim()) return;

    setIsCreating(true);
    try {
      await onCreateItem(itemName, currentItemType, selectedPath);
      onClose();
    } catch (error) {
      console.error('作成エラー:', error);
    } finally {
      setIsCreating(false);
    }
  };

  // ディレクトリ選択表示用の再帰的関数
  const renderDirectoryTree = (item: FileSystemItem | null, level = 0): React.ReactNode => {
    if (!item) return null;
    if (item.type !== 'directory') return null;

    return (
      <div key={item.path}>
        <div
          className={`directory-tree-item ${selectedPath === item.path ? 'selected' : ''}`}
          style={{ paddingLeft: `${level * 16}px` }}
          onClick={(e) => {
            e.stopPropagation();
            setSelectedPath(item.path);
          }}
        >
          <img
            src={folderIcon}
            alt="フォルダ"
            className="directory-icon"
            style={{ width: '16px', height: '16px' }}
          />
          <span>{item.name}</span>
        </div>
        {item.children?.filter(child => child.type === 'directory').map(child =>
          renderDirectoryTree(child, level + 1)
        )}
      </div>
    );
  };

  return (
    <ModalPortal isOpen={isOpen}>
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-container" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{currentItemType === 'file' ? '新規ファイル作成' : '新規フォルダ作成'}</h2>
          <div className="modal-close" onClick={onClose}>
            <img src={closeIcon} alt="閉じる" style={{ width: '16px', height: '16px' }} />
          </div>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-content">
            {/* ファイル/フォルダ切り替えタブ */}
            <div className="type-selector">
              <div
                className={`type-option ${currentItemType === 'file' ? 'active' : ''}`}
                onClick={() => handleTypeChange('file')}
              >
                <img src={fileIcon} alt="ファイル" className="directory-icon" style={{ width: '16px', height: '16px', marginRight: '6px' }} />
                ファイル
              </div>
              <div
                className={`type-option ${currentItemType === 'directory' ? 'active' : ''}`}
                onClick={() => handleTypeChange('directory')}
              >
                <img src={folderIcon} alt="フォルダ" className="directory-icon" style={{ width: '16px', height: '16px', marginRight: '6px' }} />
                フォルダ
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="item-name" className="form-label">名前</label>
              <input
                id="item-name"
                type="text"
                className="form-input"
                value={itemName}
                onChange={e => setItemName(e.target.value)}
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label">作成場所</label>
              <div className="directory-select-tree">
                {renderDirectoryTree(rootDirectory)}
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="modal-btn" onClick={onClose} disabled={isCreating}>
              キャンセル
            </button>
            <button type="submit" className="modal-btn modal-btn-primary" disabled={isCreating || !itemName.trim()}>
              {isCreating ? '作成中...' : '作成'}
            </button>
          </div>
        </form>
        </div>
      </div>
    </ModalPortal>
  );
};

interface FileSystemItem {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileSystemItem[];
}

interface DirectoryExplorerProps {
  rootDirectory: FileSystemItem | null;
  onFileSelect: (file: { path: string; name: string }, lineNumber?: number, columnNumber?: number) => void;
  isVisible: boolean;
  onClose?: () => void;
}

const DirectoryExplorer: React.FC<DirectoryExplorerProps> = ({
  rootDirectory,
  onFileSelect,
  isVisible,
  onClose
}) => {
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set());
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [addMenuPosition] = useState<{top: number, left: number}>({top: 0, left: 0});
  const [currentDirectory, setCurrentDirectory] = useState<string | null>(null);
  const [createItemType, setCreateItemType] = useState<'file' | 'directory'>('file');
  const [itemToDelete, setItemToDelete] = useState<FileSystemItem | null>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [width, setWidth] = useState(() => {
    // ローカルストレージから幅を取得、なければデフォルト値を使用
    const savedWidth = localStorage.getItem('directoryExplorerWidth');
    return savedWidth ? parseInt(savedWidth, 10) : 250;
  });
  const [displayWidth, setDisplayWidth] = useState(width);
  const explorerRef = useRef<HTMLDivElement>(null);
  const resizeTimerRef = useRef<number | null>(null);

  // ディレクトリの展開・折りたたみを切り替え
  const toggleDirectory = useCallback(async (item: FileSystemItem) => {
    if (item.type === 'directory') {
      const newExpandedDirs = new Set(expandedDirs);

      if (expandedDirs.has(item.path)) {
        // すでに展開されている場合は折りたたむ
        newExpandedDirs.delete(item.path);
      } else {
        // 展開する
        newExpandedDirs.add(item.path);

        try {
          // サブディレクトリの内容を取得
          const contents = await window.electron.getDirectoryContents(item.path);
          // 該当するサブディレクトリの子要素を更新
          if (contents && Array.isArray(contents)) {
            item.children = contents;
          }
        } catch (error) {
          console.error('ディレクトリ内容取得エラー:', error);
        }
      }

      setExpandedDirs(newExpandedDirs);
    }
  }, [expandedDirs]);

  // ファイルをクリックしたときの処理
  const handleFileClick = useCallback((item: FileSystemItem) => {
    if (item.type === 'file') {
      onFileSelect({ path: item.path, name: item.name });
    }
  }, [onFileSelect]);

  // ルートディレクトリが変更されたときに展開状態を維持し、
  // 展開されているすべてのサブディレクトリの内容を再取得する
  useEffect(() => {
    const refreshExpandedDirectories = async () => {
      if (!rootDirectory) {
        setExpandedDirs(new Set());
        return;
      }

      // 前回の展開状態を取得
      const newExpandedDirs = new Set<string>();
      newExpandedDirs.add(rootDirectory.path);

      // ローカルストレージから以前の展開状態を復元
      try {
        const savedState = localStorage.getItem(`expandedDirs-${rootDirectory.path}`);
        if (savedState) {
          const savedPaths = JSON.parse(savedState);
          for (const path of savedPaths) {
            if (path) {
              newExpandedDirs.add(path);

              // パスが存在するか確認（そのディレクトリが今も存在するか）
              try {
                await window.electron.getDirectoryContents(path);
                // 正常に取得できた場合のみ追加
                newExpandedDirs.add(path);
              } catch (e) {
                // ディレクトリが存在しない場合はスキップ
                console.log(`ディレクトリが見つかりませんでした: ${path}`);
              }
            }
          }
        }
      } catch (error) {
        console.error('展開状態の復元に失敗:', error);
      }

      // 展開されているディレクトリの内容を再帰的に取得する
      await updateDirectoryContentsRecursively(rootDirectory, newExpandedDirs);
      setExpandedDirs(newExpandedDirs);
    };

    refreshExpandedDirectories();
  }, [rootDirectory]);

  // 指定されたディレクトリとその子孫ディレクトリの内容を再帰的に取得する関数
  const updateDirectoryContentsRecursively = async (
    directory: FileSystemItem,
    expandedDirs: Set<string>
  ): Promise<void> => {
    if (directory.type !== 'directory') return;

    // このディレクトリが展開されている場合、内容を取得
    if (expandedDirs.has(directory.path)) {
      try {
        const contents = await window.electron.getDirectoryContents(directory.path);
        if (contents && Array.isArray(contents)) {
          directory.children = contents;

          // 子ディレクトリも再帰的に処理
          for (const child of contents) {
            if (child.type === 'directory') {
              await updateDirectoryContentsRecursively(child, expandedDirs);
            }
          }
        }
      } catch (error) {
        console.error(`ディレクトリ内容取得エラー: ${directory.path}`, error);
      }
    }
  };

  // 展開状態が変更されたらローカルストレージに保存
  useEffect(() => {
    if (rootDirectory && expandedDirs.size > 0) {
      try {
        const expandedDirsArray = Array.from(expandedDirs);
        localStorage.setItem(
          `expandedDirs-${rootDirectory.path}`,
          JSON.stringify(expandedDirsArray)
        );
      } catch (error) {
        console.error('展開状態の保存に失敗:', error);
      }
    }
  }, [expandedDirs, rootDirectory]);

  // メニューの外側をクリックした時にメニューを閉じる
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (showAddMenu) {
        // クリックされた要素がメニュー内の要素でなければメニューを閉じる
        const target = e.target as HTMLElement;
        const isAddIcon = target.closest('.directory-action-icon') || target.closest('.directory-item-action');
        const isAddMenu = target.closest('.add-menu');

        if (!isAddIcon && !isAddMenu) {
          setShowAddMenu(false);
        }
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [showAddMenu]);

  // パスから親ディレクトリを取得するヘルパー関数
  const getParentPath = (filePath: string) => {
    // OSに関係なくパス区切り文字を正規化
    const normalizedPath = filePath.replace(/\\/g, '/');
    // 最後のスラッシュの位置を見つける
    const lastSlashIndex = normalizedPath.lastIndexOf('/');
    if (lastSlashIndex === -1) return '';
    return normalizedPath.substring(0, lastSlashIndex);
  };

  // ファイル/ディレクトリ削除処理
  const handleDeleteItem = async () => {
    if (!itemToDelete) return;

    try {
      const result = await window.electron.deleteFileSystemItem({
        path: itemToDelete.path,
        type: itemToDelete.type
      });

      // 削除が成功した場合、親ディレクトリの内容を再取得して更新
      if (result && result.success && rootDirectory) {
        // 削除されたアイテムのパスから親ディレクトリを特定
        const parentPath = getParentPath(itemToDelete.path);

        // ルートディレクトリの場合はルートを更新
        if (parentPath === rootDirectory.path) {
          const contents = await window.electron.getDirectoryContents(rootDirectory.path);
          if (contents && Array.isArray(contents)) {
            rootDirectory.children = contents;
          }
        }
        // ルート以外の場合、ディレクトリツリーを再帰的に更新
        else {
          // 全体のディレクトリツリーを更新
          await updateDirectoryContentsRecursively(rootDirectory, expandedDirs);
        }
      }
    } catch (error) {
      console.error('削除エラー:', error);
      return Promise.reject(error);
    }
  };

  // アイテム削除メニューの表示
  const handleDeleteClick = (e: React.MouseEvent, item: FileSystemItem) => {
    e.stopPropagation(); // 親要素へのイベント伝播を防止
    setItemToDelete(item); // 削除対象アイテムをセット
    setShowDeleteModal(true); // 削除モーダルを表示
  };

  const renderTree = (items?: FileSystemItem[]) => {
    if (!items || items.length === 0) {
      return <div className="directory-empty">ファイルがありません</div>;
    }

    return (
      <ul className="directory-list">
        {items.map((item) => {
          const isExpanded = expandedDirs.has(item.path);

          return (
            <li key={item.path} className="directory-item" data-path={item.path}>
              <div
                className={`directory-item-header ${item.type === 'file' ? 'file-item' : 'directory-item'}`}
                onClick={() => {
                  if (item.type === 'directory') {
                    toggleDirectory(item);
                  } else {
                    handleFileClick(item);
                  }
                }}
              >
                {item.type === 'directory' && (
                  <img
                    src={arrowForwardIcon}
                    alt="展開"
                    className={`directory-arrow ${isExpanded ? 'expanded' : ''}`}
                  />
                )}
                <img
                  src={item.type === 'directory' ? folderIcon : fileIcon}
                  alt={item.type === 'directory' ? 'フォルダ' : 'ファイル'}
                  className="directory-icon"
                />
                <span className="directory-name">{item.name}</span>

                <div className="directory-item-actions">
                  {item.type === 'directory' && (
                    <div
                      className="directory-item-action"
                      onClick={(e) => handleSubdirectoryAdd(e, item.path)}
                      title="新規作成"
                    >
                      <img src={addIcon} alt="新規作成" className="directory-icon" style={{ width: '16px', height: '16px' }} />
                    </div>
                  )}
                  <div
                    className="directory-item-action"
                    onClick={(e) => handleDeleteClick(e, item)}
                    title="削除"
                  >
                    <img src={deleteIcon} alt="削除" className="directory-icon" style={{ width: '16px', height: '16px' }} />
                  </div>
                </div>
              </div>

              {item.type === 'directory' && isExpanded && renderTree(item.children)}
            </li>
          );
        })}
      </ul>
    );
  };

  // リサイズ処理の実装
  const startResizing = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  const stopResizing = useCallback(() => {
    // リサイズ終了時に実際のwidthステートを更新し、ローカルストレージに保存
    setWidth(displayWidth);
    localStorage.setItem('directoryExplorerWidth', displayWidth.toString());
    setIsResizing(false);
  }, [displayWidth]);

  // リサイズ中にディレクトリエクスプローラーのstyle.transformを直接更新する高速化関数
  const performanceResize = useCallback((clientX: number) => {
    if (explorerRef.current) {
      const newWidth = Math.max(100, Math.min(600, clientX));

      // パフォーマンス最適化: style.width直接操作とtransformでGPUアクセラレーション活用
      explorerRef.current.style.width = `${newWidth}px`;
      explorerRef.current.style.transform = 'translateZ(0)'; // GPUアクセラレーション強制

      // 状態を更新（setStateはバッチ処理されるので処理が遅れても問題ない）
      setDisplayWidth(newWidth);

      // CSSカスタムプロパティ更新（必要な場合のみ）
      document.documentElement.style.setProperty('--explorer-width', `${newWidth}px`);
    }
  }, []);

  // マウスムーブハンドラ - 最適化のためにthrottleなしの直接実装
  const resize = useCallback((e: MouseEvent) => {
    if (isResizing) {
      e.preventDefault(); // デフォルトのドラッグ動作を防止

      // リサイズ処理をブラウザの次の描画サイクルに同期
      if (resizeTimerRef.current !== null) {
        cancelAnimationFrame(resizeTimerRef.current);
      }

      // 最新のマウス位置に基づいてリサイズ（直接実行、遅延なし）
      performanceResize(e.clientX);
    }
  }, [isResizing, performanceResize]);

  // リサイズ状態の監視（パフォーマンスモード）
  useEffect(() => {
    if (isResizing) {
      // 高パフォーマンスモードを使用
      // パッシブリスナーでスクロールを妨げない + {passive: false}でキャプチャ
      document.addEventListener('mousemove', resize, { passive: false, capture: true });
      document.addEventListener('mouseup', stopResizing);
      document.addEventListener('mouseleave', stopResizing);

      // リサイズ中にはパフォーマンス最適化用クラスを追加
      document.body.classList.add('resizing');

      if (explorerRef.current) {
        explorerRef.current.classList.add('resizing');
        // リサイズ中はポインターイベントを直接キャプチャ
        explorerRef.current.style.pointerEvents = 'none';
      }
    } else {
      document.body.classList.remove('resizing');

      if (explorerRef.current) {
        explorerRef.current.classList.remove('resizing');
        explorerRef.current.style.pointerEvents = '';
      }
    }

    return () => {
      document.removeEventListener('mousemove', resize, { capture: true } as EventListenerOptions);
      document.removeEventListener('mouseup', stopResizing);
      document.removeEventListener('mouseleave', stopResizing);
      document.body.classList.remove('resizing');

      if (explorerRef.current) {
        explorerRef.current.classList.remove('resizing');
        explorerRef.current.style.pointerEvents = '';
      }

      if (resizeTimerRef.current !== null) {
        cancelAnimationFrame(resizeTimerRef.current);
      }
    };
  }, [isResizing, resize, stopResizing]);

  // 初期表示時にCSSカスタムプロパティを設定
  useEffect(() => {
    document.documentElement.style.setProperty('--explorer-width', `${width}px`);
  }, [width]);

  // 新規ファイル・フォルダ作成処理
  const handleAddClick = (e: React.MouseEvent) => {
    e.stopPropagation();

    // メニューではなくモーダルを表示
    setCurrentDirectory(rootDirectory?.path || null);
    setCreateItemType('file'); // デフォルトはファイル
    setShowCreateModal(true);
  };

  // サブディレクトリでのアイテム作成処理 - モーダルを表示
  const handleSubdirectoryAdd = (e: React.MouseEvent, dirPath: string) => {
    e.stopPropagation();
    setCurrentDirectory(dirPath);
    setCreateItemType('file');
    setShowCreateModal(true);
  };

  // メニューからファイルまたはフォルダを選択
  const handleMenuSelection = (type: 'file' | 'directory') => {
    setCreateItemType(type);
    setShowCreateModal(true);
    setShowAddMenu(false);
  };

  // モーダルを使用したアイテム作成処理
  const handleCreateItem = async (name: string, type: 'file' | 'directory', parentPath: string) => {
    try {
      // ファイルシステムアイテムを作成
      const newPath = await window.electron.createFileSystemItem({
        parentPath,
        name,
        type
      });

      // 作成後、ディレクトリの内容を再取得して表示を更新
      if (rootDirectory) {
        const contents = await window.electron.getDirectoryContents(rootDirectory.path);
        if (contents && Array.isArray(contents)) {
          rootDirectory.children = contents;

          // フォルダツリーを展開して作成されたアイテムが表示されるようにする
          const newExpandedDirs = new Set(expandedDirs);
          // 親ディレクトリも展開
          if (parentPath !== rootDirectory.path) {
            newExpandedDirs.add(parentPath);
          }
          setExpandedDirs(newExpandedDirs);
        }
      }

      // ファイルが作成された場合は自動的に開き、フォーカスを当てる
      if (type === 'file' && newPath) {
        // 新規作成されたファイルを示すフラグをつける（この情報はフォーカス制御に使われる）
        onFileSelect({ path: newPath, name }, -1);
      }

      // void型で戻り値を返さない
    } catch (error) {
      console.error('作成エラー:', error);
      return Promise.reject(error);
    }
  };

  // サイドバーのスタイルを動的に設定
  const style: React.CSSProperties = {
    display: isVisible ? 'flex' : 'none',
    width: `${width}px`,
    height: '100%',
    flexDirection: 'column',
    position: 'relative'
  };

  return (
    <div className="directory-explorer" style={style} ref={explorerRef}>
      <div className="resize-handle" onMouseDown={startResizing}></div>
      {rootDirectory ? (
        <div className="directory-container">
          <div className="directory-root-header">
            <img src={folderIcon} alt="ルートフォルダ" className="directory-icon" />
            <span className="directory-root-name">{rootDirectory.name}</span>
            <div className="directory-actions">
              <div className="directory-action-icon" onClick={handleAddClick} title="新規作成">
                <img src={addIcon} alt="新規作成" className="directory-icon" />
              </div>
              {onClose && (
                <div className="directory-close-icon" onClick={onClose} title="フォルダを閉じる">
                  <img src={closeIcon} alt="閉じる" className="directory-icon" />
                </div>
              )}
            </div>
          </div>
          {renderTree(rootDirectory.children)}

          {/* 新規作成メニュー */}
          {showAddMenu && (
            <div
              className="add-menu"
              style={{
                position: 'absolute',
                top: `${addMenuPosition.top}px`,
                left: `${addMenuPosition.left}px`
              }}
            >
              <div className="add-menu-item" onClick={() => handleMenuSelection('file')}>
                <img src={fileIcon} alt="ファイル" className="directory-icon" />
                <span>新規ファイル</span>
              </div>
              <div className="add-menu-item" onClick={() => handleMenuSelection('directory')}>
                <img src={folderIcon} alt="フォルダ" className="directory-icon" />
                <span>新規フォルダ</span>
              </div>
            </div>
          )}

          {/* 新規作成モーダル */}
          <CreateItemModal
            isOpen={showCreateModal}
            onClose={() => setShowCreateModal(false)}
            onCreateItem={handleCreateItem}
            rootDirectory={rootDirectory}
            itemType={createItemType}
            defaultParentPath={currentDirectory || ''}
          />

          {/* 削除確認モーダル */}
          {itemToDelete && (
            <DeleteItemModal
              isOpen={showDeleteModal}
              onClose={() => setShowDeleteModal(false)}
              onDelete={handleDeleteItem}
              itemName={itemToDelete.name}
              itemType={itemToDelete.type}
            />
          )}
        </div>
      ) : (
        <div className="no-directory">
          <p>フォルダを選択してください</p>
        </div>
      )}
    </div>
  );
};

export default DirectoryExplorer;
