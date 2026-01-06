import { useState, useCallback } from 'react';
import { validateFileType, validateFileSize } from '../utils/validators';

const useFileUpload = (options = {}) => {
  const {
    maxSize = 5,
    allowedTypes = ['jpg', 'jpeg', 'png'],
    multiple = false,
    maxFiles = 5,
  } = options;

  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [errors, setErrors] = useState([]);
  const [isDragging, setIsDragging] = useState(false);

  const validateFile = useCallback(
    (file) => {
      if (!validateFileType(file, allowedTypes)) {
        return `File type not allowed. Allowed types: ${allowedTypes.join(', ')}`;
      }

      if (!validateFileSize(file, maxSize)) {
        return `File size exceeds ${maxSize}MB`;
      }

      return null;
    },
    [allowedTypes, maxSize]
  );

  const createPreview = useCallback((file) => {
    return new Promise((resolve) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve({ file, preview: reader.result, type: 'image' });
        };
        reader.readAsDataURL(file);
      } else {
        resolve({ file, preview: null, type: 'document', name: file.name, size: file.size });
      }
    });
  }, []);

  const handleFiles = useCallback(
    async (fileList) => {
      const newFiles = Array.from(fileList);
      const validationErrors = [];
      const validFiles = [];
      const newPreviews = [];

      if (!multiple && newFiles.length > 1) {
        setErrors(['Only one file allowed']);
        return;
      }

      if (multiple && files.length + newFiles.length > maxFiles) {
        setErrors([`Maximum ${maxFiles} files allowed`]);
        return;
      }

      for (const file of newFiles) {
        const error = validateFile(file);
        if (error) {
          validationErrors.push({ file: file.name, error });
        } else {
          validFiles.push(file);
          const preview = await createPreview(file);
          newPreviews.push(preview);
        }
      }

      if (validationErrors.length > 0) {
        setErrors(validationErrors);
      } else {
        setErrors([]);
      }

      if (multiple) {
        setFiles((prev) => [...prev, ...validFiles]);
        setPreviews((prev) => [...prev, ...newPreviews]);
      } else {
        setFiles(validFiles);
        setPreviews(newPreviews);
      }
    },
    [multiple, maxFiles, files.length, validateFile, createPreview]
  );

  const handleFileSelect = useCallback(
    (e) => {
      const fileList = e.target.files;
      if (fileList && fileList.length > 0) {
        handleFiles(fileList);
      }
    },
    [handleFiles]
  );

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      setIsDragging(false);
      const fileList = e.dataTransfer.files;
      if (fileList && fileList.length > 0) {
        handleFiles(fileList);
      }
    },
    [handleFiles]
  );

  const removeFile = useCallback(
    (index) => {
      setFiles((prev) => prev.filter((_, i) => i !== index));
      setPreviews((prev) => prev.filter((_, i) => i !== index));
      setErrors([]);
    },
    []
  );

  const clearFiles = useCallback(() => {
    setFiles([]);
    setPreviews([]);
    setErrors([]);
  }, []);

  return {
    files,
    previews,
    errors,
    isDragging,
    handleFileSelect,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    removeFile,
    clearFiles,
  };
};

export default useFileUpload;
