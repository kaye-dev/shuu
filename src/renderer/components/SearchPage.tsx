import React, { useState, useEffect, useRef } from 'react';

interface SearchResult {
  filePath: string;
  fileName: string;
  matches: {
    lineNumber: number;
    line: string;
    columnStart: number;
    columnEnd: number;
  }[];
}

interface SearchPageProps {
  onFileSelect: (file: { path: string; name: string }, lineNumber?: number, columnNumber?: number) => void;
  currentDirectory?: string | null; // 現在開いているディレクトリパス
}

const SearchPage: React.FC<SearchPageProps> = ({ onFileSelect, currentDirectory }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false); // 検索が実行されたかどうか
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 検索処理の実行
  const performSearch = async (term: string) => {
    if (!term.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      // Electronのメインプロセスを通じて検索を実行
      // 現在開いているディレクトリパスを渡す（nullの場合はundefinedにする）
      const results = await window.electron.searchInFiles(term, currentDirectory || undefined);
      setSearchResults(results || []);
      setHasSearched(true); // 検索が実行されたことを記録
    } catch (error) {
      console.error('検索エラー:', error);
    } finally {
      setIsSearching(false);
    }
  };

  // 検索語句が変更されたときの処理（ debounce 処理）
  const handleSearchTermChange = (value: string) => {
    setSearchTerm(value);

    // 以前のタイマーをクリア
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!value.trim()) {
      setSearchResults([]);
      return;
    }

    // 300ms後に検索を実行（ユーザーの入力が止まってから検索する）
    searchTimeoutRef.current = setTimeout(() => {
      performSearch(value);
    }, 300);
  };

  // キーボード操作の処理
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
        searchTimeoutRef.current = null;
      }
      performSearch(searchTerm);
    }
  };

  // コンポーネントのクリーンアップ
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // 検索結果のファイルと行を選択した時の処理
  const handleResultClick = (result: SearchResult, matchIndex: number) => {
    const match = result.matches[matchIndex];
    onFileSelect(
      {
        path: result.filePath,
        name: result.fileName
      },
      match.lineNumber,
      match.columnStart
    );
  };

  // 検索結果の表示
  const renderSearchResults = () => {
    if (searchResults.length === 0) {
      // 検索実行済み + 結果なしの場合のみ「見つかりませんでした」を表示
      return hasSearched && searchTerm.trim() && !isSearching
        ? <p>検索結果が見つかりませんでした。</p>
        : null;
    }

    return (
      <div className="search-results">
        {searchResults.map((result, fileIndex) => (
          <div key={fileIndex} className="search-result-file">
            <div className="search-result-file-header">
              <span className="search-result-file-name">{result.fileName}</span>
              <span className="search-result-file-path">{result.filePath}</span>
            </div>
            <div className="search-result-matches">
              {result.matches.map((match, matchIndex) => {
                // マッチした部分をハイライト表示するために、行を分割する
                const lineText = match.line;
                const beforeMatch = lineText.substring(0, match.columnStart);
                const matchText = lineText.substring(match.columnStart, match.columnEnd);
                const afterMatch = lineText.substring(match.columnEnd);

                return (
                  <div
                    key={matchIndex}
                    className="search-result-match"
                    onClick={() => handleResultClick(result, matchIndex)}
                  >
                    <span className="search-result-line-number">{match.lineNumber}</span>
                    <span className="search-result-line">
                      {beforeMatch}
                      <span className="search-match-highlight">{matchText}</span>
                      {afterMatch}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="page-container search-page">
      <div className="page-header">
        <h1>検索</h1>
        {currentDirectory && (
          <div className="search-location">
            検索場所: {currentDirectory}
          </div>
        )}
      </div>
      <div className="search-container">
        <div className="search-input-container">
          <input
            type="text"
            className="search-input"
            value={searchTerm}
            onChange={(e) => handleSearchTermChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="検索ワードを入力..."
            autoFocus
          />
        </div>
        {isSearching ? (
          <div className="search-loading">検索中...</div>
        ) : (
          renderSearchResults()
        )}
      </div>
    </div>
  );
};

export default SearchPage;
