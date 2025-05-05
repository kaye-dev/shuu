import React, { useState } from 'react';

interface FileSelectorProps {
  onFileSelected: (file: File) => void;
}

const FileSelector: React.FC<FileSelectorProps> = ({ onFileSelected }) => {
  const [fileName, setFileName] = useState<string>('');
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    
    if (files && files.length > 0 && files[0]) {
      const file = files[0];
      
      // Check if it's a PDF file
      if (file.name.toLowerCase().endsWith('.pdf')) {
        setFileName(file.name);
        onFileSelected(file);
      } else {
        alert('PDFファイルを選択してください');
        if (fileInputRef.current) fileInputRef.current.value = '';
        setFileName('');
      }
    }
  };

  const handleButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="file-selector">
      <h2>PDFファイルを選択</h2>
      <div className="file-input-container">
        <input
          type="file"
          accept=".pdf"
          onChange={handleFileChange}
          className="file-input"
          ref={fileInputRef}
          style={{ display: 'none' }}
        />
        <button onClick={handleButtonClick} className="select-file-button">
          ファイルを選択
        </button>
        {fileName && <div className="selected-file">選択したファイル: {fileName}</div>}
      </div>
    </div>
  );
};

export default FileSelector;
