import React, { useState } from 'react';
import { PageImage } from '../utils/pdfUtils';
import closeIcon from '../../../assets/google-icons/close.svg';
import arrowBackIcon from '../../../assets/google-icons/arrow_back_ios.svg';
import arrowForwardIcon from '../../../assets/google-icons/arrow_forward_ios.svg';

interface PdfViewerProps {
  pageImages: PageImage[];
  onPageChange?: (page: number) => void;
}

const PdfViewer: React.FC<PdfViewerProps> = ({
  pageImages,
  onPageChange,
}) => {
  const [selectedPage, setSelectedPage] = useState<number | null>(null);
  const totalPages = pageImages.length;

  // ページのサムネイルをクリックしたとき
  const handlePageClick = (pageNum: number) => {
    setSelectedPage(pageNum);
    if (onPageChange) onPageChange(pageNum);
  };

  // 拡大表示を閉じる
  const handleCloseModal = () => {
    setSelectedPage(null);
  };
  
  // 前のページに移動
  const goToPrevPage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedPage && selectedPage > 1) {
      const newPage = selectedPage - 1;
      setSelectedPage(newPage);
      if (onPageChange) onPageChange(newPage);
    }
  };
  
  // 次のページに移動
  const goToNextPage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedPage && selectedPage < totalPages) {
      const newPage = selectedPage + 1;
      setSelectedPage(newPage);
      if (onPageChange) onPageChange(newPage);
    }
  };

  // ページのサムネイル一覧を生成
  const renderThumbnails = () => {
    return pageImages.map((page) => (
      <div 
        key={`thumbnail-${page.pageNumber}`} 
        className="pdf-thumbnail-card"
        onClick={() => handlePageClick(page.pageNumber)}
      >
        <div className="pdf-thumbnail">
          <img 
            src={page.dataUrl} 
            alt={`Page ${page.pageNumber}`} 
            className="pdf-thumbnail-image" 
          />
        </div>
        <div className="pdf-thumbnail-number">
          {page.pageNumber} / {totalPages}
        </div>
      </div>
    ));
  };

  return (
    <div className="pdf-viewer">
      <div className="pdf-thumbnails-grid">
        {renderThumbnails()}
      </div>

      {selectedPage !== null && pageImages[selectedPage - 1] && (
        <div className="pdf-modal-overlay" onClick={handleCloseModal}>
          <div className="pdf-modal-content" onClick={e => e.stopPropagation()}>
            
            <div className="pdf-modal-container">
              <img
                src={pageImages[selectedPage - 1].dataUrl}
                alt={`Page ${selectedPage} Full`}
                className="pdf-modal-image"
              />
            </div>
            <div className="pdf-modal-navigation">
              <div style={{ width: "80px" }}></div> {/* 左側のスペーサー */}
              
              <div className="pdf-modal-nav-center">
                {selectedPage > 1 && (
                  <div className="pdf-nav-button pdf-nav-prev-small" onClick={goToPrevPage}>
                    <img src={arrowBackIcon} alt="前へ" className="nav-icon-small" />
                    <span className="nav-label-small">前へ</span>
                  </div>
                )}
                
                <div className="pdf-modal-page-info">
                  ページ {selectedPage} / {totalPages}
                </div>
                
                {selectedPage < totalPages && (
                  <div className="pdf-nav-button pdf-nav-next-small" onClick={goToNextPage}>
                    <span className="nav-label-small">次へ</span>
                    <img src={arrowForwardIcon} alt="次へ" className="nav-icon-small" />
                  </div>
                )}
              </div>
              
              <div className="pdf-nav-button pdf-close-button" onClick={handleCloseModal}>
                <img src={closeIcon} alt="閉じる" className="nav-icon-small" />
                <span className="nav-label-small">閉じる</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PdfViewer;
