import React, { useState, useEffect } from 'react';
import PdfViewer from './PdfViewer';
import Sidebar from './Sidebar';
import Editor from './Editor';
import MarkdownPreview from './MarkdownPreview';
import DirectoryExplorer from './DirectoryExplorer';
import RecentFiles, { addRecentItem } from './RecentFiles';
import EditorTabs, { FileTab } from './EditorTabs';
import SearchPage from './SearchPage';
import FavoritesPage from './FavoritesPage';
import SettingsPage from './SettingsPage';
import {
  createPdfUrl,
  releasePdfResources,
  generatePdfPageImages,
  PageImage
} from '../utils/pdfUtils';
import dockToLeftIcon from '../../../assets/google-icons/dock_to_left.svg';
import fileOpenIcon from '../../../assets/google-icons/file_open.svg';
import addIcon from '../../../assets/google-icons/add.svg';
import editIcon from '../../../assets/google-icons/edit.svg';

// FileSystemItem型の定義
interface FileSystemItem {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileSystemItem[];
}

const SlideApp: React.FC = () => {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pageImages, setPageImages] = useState<PageImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeMenu, setActiveMenu] = useState<string>('home');
  const [sidebarExpanded, setSidebarExpanded] = useState(() => {
    // localStorageから状態を読み込む（デフォルトはfalse）
    const savedState = localStorage.getItem('sidebarExpanded');
    return savedState !== null ? savedState === 'true' : false;
  }); // localStorageから初期状態を読み込む
  const [showSidebar, setShowSidebar] = useState(false); // サイドバーを完全に非表示にするフラグ
  const [showHeader, setShowHeader] = useState(false); // ヘッダーを完全に非表示にするフラグ（初期値はfalse）
  const [editMode, setEditMode] = useState(false);
  const [currentContent, setCurrentContent] = useState<string>('');
  const [currentFileName, setCurrentFileName] = useState<string>('');
  const [currentFilePath, setCurrentFilePath] = useState<string | null>(null);
  const [isModified, setIsModified] = useState(false); // ファイルが未保存かどうか
  const [showPreview, setShowPreview] = useState(false);
  const [isFileOpen, setIsFileOpen] = useState(false); // ファイルが開かれているかどうか
  const [isDirectoryOpen, setIsDirectoryOpen] = useState(false); // ディレクトリが開かれているかどうか

  // タブ関連の状態
  const [tabs, setTabs] = useState<FileTab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);

  // エディタのカーソル位置
  const [initialCursorPosition, setInitialCursorPosition] = useState<{line: number; column?: number} | undefined>(undefined);

  // プロジェクト関連の状態
  const [showDirectoryExplorer, setShowDirectoryExplorer] = useState(false);
  const [rootDirectory, setRootDirectory] = useState<FileSystemItem | null>(null);

  // PDFのURLを破棄してメモリリークを防ぐ
  useEffect(() => {
    return () => {
      if (pdfUrl) {
        releasePdfResources(pdfUrl);
      }
    };
  }, [pdfUrl]);

  // Electronのネイティブのファイル選択ダイアログを使ってファイルを選択する
  const handleSelectFile = async (lineNumber?: number, columnNumber?: number) => {
    try {
      setLoading(true);
      setError(null);

      // window.electron が存在するか確認
      if (!window.electron || !window.electron.selectFile) {
        throw new Error('Electron API が読み込まれていません。アプリを再起動してください。');
      }

      // Electronのネイティブダイアログを使用してファイルを選択
      const fileInfo = await window.electron.selectFile();

      if (fileInfo && typeof fileInfo === 'object') {
        // ファイルの内容を設定
        setCurrentFileName(fileInfo.name);
        setCurrentContent(fileInfo.content);
        setCurrentFilePath(fileInfo.path);

        // 編集モードに切り替え
        setEditMode(true);
        setPdfUrl(null);
        setPageImages([]);

        // フォルダエクスプローラーを非表示
        setShowDirectoryExplorer(false);

        // 新しくファイルを開いたので未保存状態をリセット
        setIsModified(false);

        // ファイルが開かれた状態にする
        setIsFileOpen(true);

        // タブに追加
        addTab({
          path: fileInfo.path,
          name: fileInfo.name,
          content: fileInfo.content
        });

        // 行番号と列番号が指定されていれば、カーソル位置を設定
        if (lineNumber) {
          setInitialCursorPosition({
            line: lineNumber,
            column: columnNumber
          });
        } else {
          setInitialCursorPosition(undefined);
        }

        // 最近使用したファイルに追加
        addRecentItem({
          path: fileInfo.path,
          name: fileInfo.name,
          type: 'file'
        });
      }
    } catch (error) {
      console.error('ファイル選択エラー:', error);
      setError('ファイルの選択中にエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  // ディレクトリ選択ダイアログを表示する
  const handleSelectDirectory = async () => {
    try {
      setLoading(true);
      setError(null);

      // window.electron が存在するか確認
      if (!window.electron || !window.electron.selectDirectory) {
        throw new Error('Electron API が読み込まれていません。アプリを再起動してください。');
      }

      // Electronのネイティブダイアログを使用してディレクトリを選択
      const dirInfo = await window.electron.selectDirectory();

      if (dirInfo) {
        // ディレクトリ構造を設定
        setRootDirectory(dirInfo);

        // ディレクトリエクスプローラーを表示
        setShowDirectoryExplorer(true);

        // ディレクトリが開かれた状態にする
        setIsDirectoryOpen(true);

        // UIを表示
        setShowSidebar(true);
        setShowHeader(true);

        // 最近使用したディレクトリに追加
        addRecentItem({
          path: dirInfo.path,
          name: dirInfo.name,
          type: 'directory'
        });
      }
    } catch (error) {
      console.error('ディレクトリ選択エラー:', error);
      setError('ディレクトリの選択中にエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  // 既に開いたことのあるディレクトリを開く
  const handleOpenSavedDirectory = async (directory: { path: string; name: string }) => {
    try {
      setLoading(true);
      setError(null);

      // 選択されたディレクトリの内容を取得
      const dirInfo = await window.electron.openDirectory(directory.path);

      if (dirInfo) {
        // ディレクトリ構造を設定
        setRootDirectory(dirInfo);

        // ディレクトリエクスプローラーを表示
        setShowDirectoryExplorer(true);

        // ディレクトリが開かれた状態にする
        setIsDirectoryOpen(true);

        // UIを表示
        setShowSidebar(true);
        setShowHeader(true);

        // 最近使用したディレクトリを更新
        addRecentItem({
          path: dirInfo.path,
          name: dirInfo.name,
          type: 'directory'
        });
      }
    } catch (error) {
      console.error('ディレクトリ読み込みエラー:', error);
      setError('ディレクトリの読み込み中にエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  // 従来のHTMLのinputからファイルが選択されたときの処理（PDF用に残す）
  const handleFileSelected = async (file: File) => {
    setLoading(true);
    setError(null);
    setPageImages([]);
    setCurrentFileName(file.name);

    try {
      // ファイル拡張子を確認
      const fileExtension = file.name.split('.').pop()?.toLowerCase();

      if (fileExtension === 'pdf') {
        // PDFファイルの処理
        // 以前のPDFがあれば解放
        if (pdfUrl) {
          releasePdfResources(pdfUrl);
        }

        // ファイルからURLを作成
        const url = createPdfUrl(file);
        setPdfUrl(url);

        // PDFからページ画像を生成
        const images = await generatePdfPageImages(file);
        setPageImages(images);

        // PDFビューワーは最初のページから表示
        setEditMode(false);

        // ファイルパスを取得（これはWeb APIの制限で取得できないケース）
        setCurrentFilePath(null);

        // ファイルが開かれた状態にする
        setIsFileOpen(true);
      } else {
        // テキストファイルの処理
        const text = await file.text();
        setCurrentContent(text);
        setEditMode(true);
        setPdfUrl(null);
        setPageImages([]);

        try {
          // ファイルパスを取得するためにシステムダイアログからファイルを開き直す
          // これは多少冗長ですが、Webセキュリティの制約のため必要です
          const fileInput = document.querySelector('input[type=file]') as HTMLInputElement;
          if (fileInput && fileInput.files && fileInput.files[0]) {
            // Electron環境ではFilesにpathプロパティが追加されている
            const electronFile = fileInput.files[0] as any;
            if (electronFile.path) {
              // Electronのファイル読み込みAPIを呼び出す（メインプロセス側で実装）
              const fileInfo = await window.electron.openFile(electronFile.path);
              if (fileInfo && typeof fileInfo === 'object') {
                setCurrentFilePath(fileInfo.path);
                setCurrentFileName(fileInfo.name);
                setCurrentContent(fileInfo.content);
              }
            }
          }
        } catch (pathError) {
          console.log('ファイルパス取得エラー（非致命的）:', pathError);
          // パスが取得できなくてもファイル内容は表示できるので続行
        }

        // 新しくファイルを開いたので未保存状態をリセット
        setIsModified(false);
      }
    } catch (err) {
      console.error('ファイルの読み込みエラー:', err);
      setError('ファイルの読み込み中にエラーが発生しました');
      setPdfUrl(null);
      setPageImages([]);
      setCurrentContent('');
    } finally {
      setLoading(false);
    }
  };

  // PDFビューワーでページが変更された時のハンドラ
  const handlePageChange = () => {
    // 必要になった場合、ここにページ変更時の処理を追加できます
  };

  const handleMenuSelect = (menu: string) => {
    setActiveMenu(menu);

    // メニュー選択時の処理
    switch (menu) {
      case 'home':
        // ホームに戻る（ウェルカムページを表示）
        if (isFileOpen) {
          handleCloseFile();
        }
        break;
      case 'search':
      case 'favorites':
      case 'settings':
        // 検索、お気に入り、設定の場合は、UIを表示状態にする
        setShowSidebar(true);
        setShowHeader(true);

        // ファイルが開かれている場合は一時的に閉じる
        if (isFileOpen) {
          // 開いているファイルの情報を保存し、ファイル編集画面を非表示に
          setIsFileOpen(false);
        }
        break;
      default:
        break;
    }
  };

  // ファイルとプロジェクトを閉じるハンドラ
  const handleCloseFile = () => {
    // 未保存の変更がある場合は確認ダイアログを表示する実装も可能
    // ここでは簡単のため、すぐに閉じる処理を行います

    // ファイル関連の状態をリセット
    setCurrentContent('');
    setCurrentFileName('');
    setCurrentFilePath(null);
    setPdfUrl(null);
    setPageImages([]);
    setEditMode(false);
    setIsModified(false);
    setShowPreview(false);
    setIsFileOpen(false); // ファイルが開かれていない状態にする
    setIsDirectoryOpen(false); // ディレクトリも閉じる

    // タブをすべて閉じる
    setTabs([]);
    setActiveTabId(null);

    // UIの状態もリセット
    setShowSidebar(false);
    setShowHeader(false);
    setShowDirectoryExplorer(false);
    setRootDirectory(null);
  };

  const handleNewFile = () => {
    const fileName = '新規ファイル.md';
    const content = '';

    setCurrentContent(content);
    setCurrentFileName(fileName);
    setPdfUrl(null);
    setPageImages([]);
    setEditMode(true);
    setCurrentFilePath(null); // パスをクリア
    setIsModified(false); // 新規ファイルは未保存状態をリセット
    setIsFileOpen(true); // ファイルが開かれた状態にする

    // タブに追加
    addTab({
      path: null,
      name: fileName,
      content: content
    });
  };

  // 内容変更ハンドラ - isModifiedフラグを更新
  const handleContentChange = (newContent: string) => {
    setCurrentContent(newContent);
    // 内容が変更されたら未保存状態にする
    setIsModified(true);
  };

  const handleSaveFile = async () => {
    if (!currentFileName) return;

    try {
      // すでにパスがある場合は上書き保存、ない場合は新規保存ダイアログを表示
      const defaultPath = currentFilePath || currentFileName;
      const overwrite = !!currentFilePath; // パスがある場合は上書きモード

      // Electronのネイティブダイアログを使用してファイルを保存
      const savedPath = await window.electron.saveFile({
        defaultPath,
        content: currentContent,
        overwrite
      });

      if (savedPath) {
        // 保存に成功した場合、ファイル名とパスを更新
        const fileName = savedPath.split(/[/\\]/).pop() || currentFileName;
        setCurrentFileName(fileName);
        setCurrentFilePath(savedPath);
        // 保存したので未保存状態をクリア
        setIsModified(false);

        // 成功メッセージを表示（オプション）
        console.log(`ファイルを保存しました: ${savedPath}`);

        // ディレクトリエクスプローラーを更新
        if (rootDirectory && isDirectoryOpen) {
          await refreshDirectoryIfNeeded(savedPath);
        }
      }
    } catch (error) {
      console.error('ファイル保存エラー:', error);
    }
  };

  // タブ関連のハンドラ

  // タブを追加するハンドラ
  const addTab = (fileInfo: { path: string | null; name: string; content: string }) => {
    // タブIDを生成（ファイルパスがあればパスを、なければランダム文字列を使用）
    const tabId = fileInfo.path || `tab-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // 同じIDのタブがすでに存在するか確認
    const existingTabIndex = tabs.findIndex(tab => tab.id === tabId);

    if (existingTabIndex !== -1) {
      // 既存のタブが見つかった場合、そのタブをアクティブにする
      setActiveTabId(tabId);

      // 表示内容を更新
      setCurrentFileName(fileInfo.name);
      setCurrentContent(fileInfo.content);
      setCurrentFilePath(fileInfo.path);
      setIsModified(false);
    } else {
      // 新しいタブを作成
      const newTab: FileTab = {
        id: tabId,
        title: fileInfo.name,
        path: fileInfo.path,
        content: fileInfo.content,
        isModified: false
      };

      // タブを追加して、そのタブをアクティブにする
      setTabs(prevTabs => [...prevTabs, newTab]);
      setActiveTabId(tabId);
    }
  };

  // タブを選択するハンドラ
  const handleTabSelect = (tabId: string) => {
    // 現在のタブの変更があれば保存
    updateCurrentTabState();

    // 選択されたタブを見つける
    const selectedTab = tabs.find(tab => tab.id === tabId);
    if (selectedTab) {
      // タブの内容をエディタに設定
      setCurrentFileName(selectedTab.title);
      setCurrentContent(selectedTab.content);
      setCurrentFilePath(selectedTab.path);
      setIsModified(selectedTab.isModified);
      setActiveTabId(tabId);

      // ファイルが開かれている状態にする
      setIsFileOpen(true);
      // 編集モードを有効にする
      setEditMode(true);
      // プレビューモードを無効にする
      setShowPreview(false);
    }
  };

  // タブを閉じるハンドラ
  const handleTabClose = (tabId: string) => {
    // 閉じるタブが現在のアクティブタブかどうか
    const isActiveTab = tabId === activeTabId;

    // 閉じるタブの内容を取得

    // 未保存の変更があるかチェック（後でダイアログ表示の機能を追加予定）
    // if (tabToClose && tabToClose.isModified) {
    //   // 未保存の変更がある場合、確認ダイアログを表示（今回は省略）
    // }

    // 閉じた後に表示するタブを決定
    let nextTabId: string | null = null;
    const currentTabIndex = tabs.findIndex(tab => tab.id === tabId);

    if (isActiveTab && tabs.length > 1) {
      // 他にタブがある場合は、次か前のタブを選択
      if (currentTabIndex < tabs.length - 1) {
        // 後ろにタブがあればそれを選択
        nextTabId = tabs[currentTabIndex + 1].id;
      } else {
        // なければ前のタブを選択
        nextTabId = tabs[currentTabIndex - 1].id;
      }
    }

    // タブを閉じる
    setTabs(prevTabs => prevTabs.filter(tab => tab.id !== tabId));

    // 次のタブを表示
    if (nextTabId) {
      handleTabSelect(nextTabId);
    } else if (isActiveTab) {
      // 閉じたタブがアクティブで、他にタブがない場合
      setActiveTabId(null);
      // エディタの状態をリセット
      setCurrentFileName('');
      setCurrentContent('');
      setCurrentFilePath(null);
      setIsModified(false);

      // タブがすべて閉じられた場合、ファイルが開かれていない状態に戻す
      if (tabs.length <= 1) {
        setIsFileOpen(false);
      }
    }
  };

  // 現在のタブ状態を更新する関数
  const updateCurrentTabState = () => {
    if (activeTabId) {
      setTabs(prevTabs =>
        prevTabs.map(tab =>
          tab.id === activeTabId
            ? { ...tab, content: currentContent, isModified: isModified, title: currentFileName }
            : tab
        )
      );
    }
  };

  // タブの内容変更を監視して状態を更新
  useEffect(() => {
    if (activeTabId && (isModified || currentContent)) {
      updateCurrentTabState();
    }
  }, [isModified, currentContent, currentFileName]);

  // 指定されたファイルパスがルートディレクトリ内にある場合、
  // ディレクトリ内容を更新する関数（強化版）
  const refreshDirectoryIfNeeded = async (filePath: string) => {
    try {
      if (!rootDirectory) return;

      // ファイルパスがルートディレクトリに含まれているか確認
      if (filePath.startsWith(rootDirectory.path)) {
        // ファイルが保存されたディレクトリのパスを取得

        // 現在のルートディレクトリを更新 (全体の構造を保持したまま)
        const updatedDir = await window.electron.openDirectory(rootDirectory.path);
        if (updatedDir) {
          // 重要: 強制的に新しいオブジェクトとしてセットして更新を確実に反映させる
          // これによりDirectoryExplorerで適切な再レンダリングが発生する
          setRootDirectory({...updatedDir});
        }
      }
    } catch (error) {
      console.error('ディレクトリ更新エラー:', error);
    }
  };

  // ルートディレクトリを強制的に更新する関数
  const forceRefreshDirectory = async () => {
    try {
      if (!rootDirectory) return;

      // 現在のルートディレクトリを更新
      const updatedDir = await window.electron.openDirectory(rootDirectory.path);
      if (updatedDir) {
        // 新しいオブジェクトとしてセットして確実に更新を反映
        setRootDirectory({...updatedDir});
      }
    } catch (error) {
      console.error('ディレクトリ更新エラー:', error);
    }
  };


  // サイドバーの展開状態を変更するハンドラ
  const toggleSidebarExpanded = (expanded: boolean) => {
    setSidebarExpanded(expanded);
    // 状態をlocalStorageに保存
    localStorage.setItem('sidebarExpanded', expanded.toString());
  };

  const togglePreview = () => {
    // ファイル名が.mdで終わる場合のみプレビューを表示
    if (currentFileName.toLowerCase().endsWith('.md')) {
      setShowPreview(!showPreview);
    }
  };

  // キーボードショートカットのグローバルイベントリスナー
  useEffect(() => {
    const handleGlobalKeyDown = (e: globalThis.KeyboardEvent) => {
      // 編集モード中のみ有効
      if (editMode && currentFileName.toLowerCase().endsWith('.md')) {
        if ((e.metaKey || e.ctrlKey) && e.key === 'p') {
          e.preventDefault(); // ブラウザの印刷ダイアログを防止
          togglePreview();
        }
      }
    };

    // イベントリスナーを追加
    document.addEventListener('keydown', handleGlobalKeyDown);

    // クリーンアップ関数
    return () => {
      document.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, [editMode, currentFileName, showPreview]);

  // ディレクトリエクスプローラーまたは検索結果からファイルが選択された時の処理
  const handleDirectoryFileSelect = async (file: { path: string; name: string }, lineNumber?: number, columnNumber?: number) => {
    try {
      setLoading(true);
      setError(null);

      // ファイル作成直後の特別処理
      const isNewlyCreatedFile = lineNumber === -1;

      // ファイル情報を取得
      const fileInfo = await window.electron.openFile(file.path);

      // ディレクトリツリーを非同期で更新（UIブロッキングを避ける）
      if (rootDirectory && isNewlyCreatedFile) {
        // 新規ファイル作成時は、ユーザー操作を妨げないように非同期で更新
        setTimeout(() => {
          forceRefreshDirectory().catch(console.error);
        }, 100);
      }

      if (fileInfo && typeof fileInfo === 'object') {
        // ファイルの内容を設定
        setCurrentFileName(fileInfo.name);
        setCurrentContent(fileInfo.content);
        setCurrentFilePath(fileInfo.path);

        // 編集モードに切り替え
        setEditMode(true);
        setPdfUrl(null);
        setPageImages([]);

        // 新しくファイルを開いたので未保存状態をリセット
        setIsModified(false);

        // ファイルが開かれた状態にする
        setIsFileOpen(true);

        // タブに追加
        addTab({
          path: fileInfo.path,
          name: fileInfo.name,
          content: fileInfo.content
        });

        // 行番号と列番号が指定されていれば、カーソル位置を設定
        if (lineNumber) {
          setInitialCursorPosition({
            line: lineNumber,
            column: columnNumber
          });
        } else {
          setInitialCursorPosition(undefined);
        }

        // 最近使用したファイルに追加
        addRecentItem({
          path: fileInfo.path,
          name: fileInfo.name,
          type: 'file'
        });
      }
    } catch (error) {
      console.error('ファイル読み込みエラー:', error);
      setError('ファイルの読み込み中にエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  // 最近ファイルから選択されたファイルを開く
  const handleRecentFileSelect = async (file: { path: string; name: string }) => {
    try {
      setLoading(true);
      setError(null);

      // ファイル情報を取得
      const fileInfo = await window.electron.openFile(file.path);

      if (fileInfo && typeof fileInfo === 'object') {
        // ファイルの内容を設定
        setCurrentFileName(fileInfo.name);
        setCurrentContent(fileInfo.content);
        setCurrentFilePath(fileInfo.path);

        // 編集モードに切り替え
        setEditMode(true);
        setPdfUrl(null);
        setPageImages([]);
        setShowDirectoryExplorer(false);

        // 新しくファイルを開いたので未保存状態をリセット
        setIsModified(false);

        // ファイルが開かれた状態にする
        setIsFileOpen(true);

        // タブに追加
        addTab({
          path: fileInfo.path,
          name: fileInfo.name,
          content: fileInfo.content
        });

        // 最近使用したファイルを更新
        addRecentItem({
          path: fileInfo.path,
          name: fileInfo.name,
          type: 'file'
        });
      }
    } catch (error) {
      console.error('ファイル読み込みエラー:', error);
      setError('ファイルの読み込み中にエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      {showSidebar && (
        <Sidebar
          onMenuSelect={handleMenuSelect}
          expanded={sidebarExpanded}
        />
      )}

      {showHeader && (
        <div className={`app-header ${!sidebarExpanded || !showSidebar ? 'sidebar-hidden' : ''}`}>
        <div className="header-left">
          <div
            className="header-toggle-icon"
            onClick={() => toggleSidebarExpanded(!sidebarExpanded)}
            title={sidebarExpanded ? "サイドバーを折りたたむ" : "サイドバーを展開する"}
          >
            <img src={dockToLeftIcon} alt="サイドバートグル" className={sidebarExpanded ? '' : 'rotated'} />
          </div>
        </div>

        <div className="header-right">
          <input
            type="file"
            accept=".txt,.md,.pdf"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFileSelected(e.target.files[0]);
              }
            }}
            style={{ display: 'none' }}
          />
        </div>
      </div>
      )}

      <div className={`main-content-container ${!showSidebar ? 'no-sidebar' : (!sidebarExpanded ? 'sidebar-collapsed' : '')} ${!showHeader ? 'no-header' : ''}`}>
        {/* フォルダエクスプローラー */}
        <DirectoryExplorer
          rootDirectory={rootDirectory}
          onFileSelect={handleDirectoryFileSelect}
          isVisible={showDirectoryExplorer && showSidebar}
          onClose={handleCloseFile}
        />

        {/* メインコンテンツエリア */}
        <div className={`slide-app ${!showSidebar ? 'no-sidebar' : (sidebarExpanded ? '' : 'sidebar-collapsed')} ${showDirectoryExplorer && showSidebar ? 'with-explorer' : ''} ${!showHeader ? 'no-header' : ''}`}>
          {/* 何も開いていない場合（ウェルカム画面） */}
          {!isFileOpen && !isDirectoryOpen && (
            <div className="content-split-view">
              {/* 左側: ウェルカムメッセージとアクションボタン */}
              <div className="welcome-container">
                <h1>Shuu エディタ</h1>
                <div className="welcome-buttons">
                  <button
                    className="welcome-button"
                    onClick={() => {
                      setShowSidebar(true); // サイドバーを表示
                      setShowHeader(true); // ヘッダーを表示
                      handleNewFile();
                    }}
                  >
                    <img src={addIcon} alt="新規作成" className="welcome-button-icon" />
                    新規作成
                  </button>
                  <button
                    className="welcome-button"
                    onClick={() => {
                      setShowSidebar(true); // サイドバーを表示
                      setShowHeader(true); // ヘッダーを表示
                      handleSelectFile();
                    }}
                  >
                    <img src={editIcon} alt="ファイル編集" className="welcome-button-icon" />
                    ファイル編集
                  </button>
                  <button
                    className="welcome-button"
                    onClick={() => {
                      setShowSidebar(true); // サイドバーを表示
                      setShowHeader(true); // ヘッダーを表示
                      handleSelectDirectory();
                    }}
                  >
                    <img src={fileOpenIcon} alt="プロジェクトを開く" className="welcome-button-icon" />
                    プロジェクトを開く
                  </button>
                </div>
              </div>

              {/* 右側: 最近使用したファイル */}
              <div className="recent-files-container">
                <RecentFiles
                  onFileSelect={(file) => {
                    setShowSidebar(true); // サイドバーを表示
                    setShowHeader(true); // ヘッダーを表示
                    handleRecentFileSelect(file);
                  }}
                  onDirectorySelect={(dir) => {
                    setShowSidebar(true); // サイドバーを表示
                    setShowHeader(true); // ヘッダーを表示
                    handleOpenSavedDirectory(dir);
                  }}
                />
              </div>
            </div>
          )}

          {/* アクティブなメニューに基づいてコンポーネントを表示 */}
          {activeMenu === 'search' && !isFileOpen && (
            <SearchPage
              onFileSelect={(file, lineNumber, columnNumber) => {
                handleDirectoryFileSelect(file, lineNumber, columnNumber);
              }}
              currentDirectory={rootDirectory?.path || null}
            />
          )}

          {activeMenu === 'favorites' && !isFileOpen && (
            <FavoritesPage />
          )}

          {activeMenu === 'settings' && !isFileOpen && (
            <SettingsPage />
          )}

          {/* ディレクトリのみ開いている場合（訴求メッセージ） */}
          {!isFileOpen && isDirectoryOpen && activeMenu === 'home' && (
            <div className="project-prompt-container">
              <div className="project-prompt">
                <h2>あなたの想いをShuuに綴ろう</h2>
                <p>左側のエクスプローラーからファイルを選択するか、新規ファイルを作成してください</p>
                <div className="project-prompt-buttons">
                  <button
                    className="project-prompt-button"
                    onClick={() => handleNewFile()}
                  >
                    <img src={addIcon} alt="新規作成" className="welcome-button-icon" />
                    新規ファイルを作成
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ファイルが開いている場合 */}
          {isFileOpen && (
            <div className="editor-fullscreen-container">
              {/* タブバー */}
              <EditorTabs
                tabs={tabs}
                activeTabId={activeTabId}
                onTabSelect={handleTabSelect}
                onTabClose={handleTabClose}
              />

              {loading && <div className="loading">ファイルを読み込んでいます...</div>}

              {error && <div className="error">{error}</div>}

              {pageImages.length > 0 && !editMode && (
                <PdfViewer
                  pageImages={pageImages}
                  onPageChange={handlePageChange}
                />
              )}

              {editMode && !showPreview && (
                <>
                  <Editor
                    content={currentContent}
                    fileName={currentFileName}
                    filePath={currentFilePath}
                    isModified={isModified}
                    onChange={handleContentChange}
                    onFileNameChange={(newFileName) => setCurrentFileName(newFileName)}
                    onPreviewToggle={togglePreview}
                    onSave={handleSaveFile}
                    initialCursor={initialCursorPosition}
                  />
                  {currentFileName.toLowerCase().endsWith('.md') && (
                    <div className="keyboard-shortcut-hint">
                      プレビュー表示: ⌘+P | 保存: ⌘+S
                    </div>
                  )}
                </>
              )}

              {editMode && showPreview && (
                <MarkdownPreview
                  content={currentContent}
                  fileName={currentFileName}
                  onClose={togglePreview}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SlideApp;
