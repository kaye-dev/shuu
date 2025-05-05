import React, { useCallback } from 'react';

interface Slide {
  id: number;
  image: string; // Base64 encoded slide image
  notes?: string;
}

interface SlideViewerProps {
  slides: Slide[];
  currentSlideIndex: number;
  onSlideChange: (index: number) => void;
}

const SlideViewer: React.FC<SlideViewerProps> = ({
  slides,
  currentSlideIndex,
  onSlideChange,
}) => {
  const goToNextSlide = useCallback(() => {
    if (currentSlideIndex < slides.length - 1) {
      onSlideChange(currentSlideIndex + 1);
    }
  }, [currentSlideIndex, slides.length, onSlideChange]);

  const goToPreviousSlide = useCallback(() => {
    if (currentSlideIndex > 0) {
      onSlideChange(currentSlideIndex - 1);
    }
  }, [currentSlideIndex, onSlideChange]);

  if (!slides || slides.length === 0) {
    return <div className="slide-viewer empty">スライドがありません</div>;
  }

  const currentSlide = slides[currentSlideIndex];

  return (
    <div className="slide-viewer">
      <div className="slide-container">
        <img
          src={currentSlide.image}
          alt={`スライド ${currentSlideIndex + 1}`}
          className="slide-image"
        />
      </div>

      <div className="slide-controls">
        <button
          onClick={goToPreviousSlide}
          disabled={currentSlideIndex === 0}
          className="control-button"
        >
          前のスライド
        </button>
        <span className="slide-counter">
          {currentSlideIndex + 1} / {slides.length}
        </span>
        <button
          onClick={goToNextSlide}
          disabled={currentSlideIndex === slides.length - 1}
          className="control-button"
        >
          次のスライド
        </button>
      </div>

      {currentSlide.notes && (
        <div className="speaker-notes">
          <h3>スピーカーノート:</h3>
          <div className="notes-content">{currentSlide.notes}</div>
        </div>
      )}
    </div>
  );
};

export default SlideViewer;
