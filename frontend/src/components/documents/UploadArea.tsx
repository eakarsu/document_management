'use client';

import React, { useState, useRef, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  CloudArrowUpIcon,
  XMarkIcon,
  DocumentIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { useToast } from '../providers/ToastProvider';

interface UploadFile {
  file: File;
  id: string;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
}

interface UploadAreaProps {
  onUploadComplete?: (documents: any[]) => void;
  maxFiles?: number;
  maxFileSize?: number; // in bytes
  acceptedFileTypes?: string[];
  className?: string;
}

const UploadArea: React.FC<UploadAreaProps> = ({
  onUploadComplete,
  maxFiles = 10,
  maxFileSize = 100 * 1024 * 1024, // 100MB
  acceptedFileTypes = [],
  className = '',
}) => {
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const { success, error: showError } = useToast();
  const uploadIdCounter = useRef(0);

  const generateUploadId = () => `upload_${++uploadIdCounter.current}_${Date.now()}`;

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    // Handle rejected files
    rejectedFiles.forEach(({ file, errors }) => {
      errors.forEach((error: any) => {
        let message = `${file.name}: ${error.message}`;
        if (error.code === 'file-too-large') {
          message = `${file.name}: File size exceeds ${Math.round(maxFileSize / 1024 / 1024)}MB limit`;
        } else if (error.code === 'file-invalid-type') {
          message = `${file.name}: File type not supported`;
        }
        showError('Upload Error', message);
      });
    });

    // Add accepted files to upload queue
    const newUploadFiles: UploadFile[] = acceptedFiles.map(file => ({
      file,
      id: generateUploadId(),
      progress: 0,
      status: 'pending',
    }));

    setUploadFiles(prev => [...prev, ...newUploadFiles]);
  }, [maxFileSize, showError]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles,
    maxSize: maxFileSize,
    accept: acceptedFileTypes.length > 0 ? acceptedFileTypes.reduce((acc, type) => {
      acc[type] = [];
      return acc;
    }, {} as Record<string, string[]>) : undefined,
    disabled: isUploading,
  });

  const removeFile = (id: string) => {
    setUploadFiles(prev => prev.filter(f => f.id !== id));
  };

  const uploadFile = async (uploadFile: UploadFile): Promise<boolean> => {
    const formData = new FormData();
    formData.append('file', uploadFile.file);

    try {
      setUploadFiles(prev => prev.map(f => 
        f.id === uploadFile.id ? { ...f, status: 'uploading' } : f
      ));

      const xhr = new XMLHttpRequest();
      
      return new Promise((resolve, reject) => {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded * 100) / event.total);
            setUploadFiles(prev => prev.map(f => 
              f.id === uploadFile.id ? { ...f, progress } : f
            ));
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status === 200) {
            setUploadFiles(prev => prev.map(f => 
              f.id === uploadFile.id ? { ...f, status: 'completed', progress: 100 } : f
            ));
            resolve(true);
          } else {
            const errorMessage = `Upload failed: ${xhr.statusText}`;
            setUploadFiles(prev => prev.map(f => 
              f.id === uploadFile.id ? { ...f, status: 'error', error: errorMessage } : f
            ));
            reject(new Error(errorMessage));
          }
        });

        xhr.addEventListener('error', () => {
          const errorMessage = 'Network error occurred';
          setUploadFiles(prev => prev.map(f => 
            f.id === uploadFile.id ? { ...f, status: 'error', error: errorMessage } : f
          ));
          reject(new Error(errorMessage));
        });

        xhr.open('POST', '/api/documents/upload');
        xhr.send(formData);
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      setUploadFiles(prev => prev.map(f => 
        f.id === uploadFile.id ? { ...f, status: 'error', error: errorMessage } : f
      ));
      return false;
    }
  };

  const uploadAllFiles = async () => {
    const pendingFiles = uploadFiles.filter(f => f.status === 'pending');
    if (pendingFiles.length === 0) return;

    setIsUploading(true);

    try {
      const uploadPromises = pendingFiles.map(uploadFile);
      const results = await Promise.allSettled(uploadPromises);
      
      const successful = results.filter(result => result.status === 'fulfilled').length;
      const failed = results.filter(result => result.status === 'rejected').length;

      if (successful > 0) {
        success(
          'Upload Complete',
          `${successful} file${successful > 1 ? 's' : ''} uploaded successfully${failed > 0 ? `, ${failed} failed` : ''}`
        );
        
        if (onUploadComplete) {
          // In a real app, we'd get the actual document data from the API response
          const mockDocuments = uploadFiles.filter(f => f.status === 'completed').map(f => ({
            id: f.id,
            name: f.file.name,
            size: f.file.size,
          }));
          onUploadComplete(mockDocuments);
        }
      }

      if (failed > 0 && successful === 0) {
        showError('Upload Failed', `All ${failed} file${failed > 1 ? 's' : ''} failed to upload`);
      }
    } finally {
      setIsUploading(false);
    }
  };

  const clearCompleted = () => {
    setUploadFiles(prev => prev.filter(f => f.status !== 'completed'));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return '🖼️';
    if (file.type.includes('pdf')) return '📄';
    if (file.type.includes('word')) return '📝';
    if (file.type.includes('sheet') || file.type.includes('excel')) return '📊';
    if (file.type.includes('presentation')) return '📈';
    return '📄';
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Drop Zone */}
      <div
        {...getRootProps()}
        className={`
          upload-area cursor-pointer transition-all duration-200
          ${isDragActive ? 'dragover' : ''}
          ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center space-y-3">
          <CloudArrowUpIcon className={`h-12 w-12 ${isDragActive ? 'text-primary-500' : 'text-gray-400'} transition-colors`} />
          <div className="text-center">
            <p className="text-lg font-medium text-gray-900">
              {isDragActive ? 'Drop files here' : 'Upload documents'}
            </p>
            <p className="text-sm text-gray-500">
              Drag and drop files here, or click to browse
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Max {maxFiles} files, up to {Math.round(maxFileSize / 1024 / 1024)}MB each
            </p>
          </div>
        </div>
      </div>

      {/* Upload Queue */}
      {uploadFiles.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-900">
              Upload Queue ({uploadFiles.length})
            </h3>
            <div className="flex space-x-2">
              {uploadFiles.some(f => f.status === 'completed') && (
                <button
                  onClick={clearCompleted}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  Clear completed
                </button>
              )}
              {uploadFiles.some(f => f.status === 'pending') && !isUploading && (
                <button
                  onClick={uploadAllFiles}
                  className="btn btn-primary btn-sm"
                >
                  Upload All
                </button>
              )}
            </div>
          </div>

          <div className="space-y-2">
            {uploadFiles.map((uploadFile) => (
              <div key={uploadFile.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex-shrink-0 text-lg">
                  {getFileIcon(uploadFile.file)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {uploadFile.file.name}
                    </p>
                    <div className="flex items-center space-x-2">
                      {uploadFile.status === 'completed' && (
                        <CheckCircleIcon className="h-5 w-5 text-green-500" />
                      )}
                      {uploadFile.status === 'error' && (
                        <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
                      )}
                      {uploadFile.status === 'uploading' && (
                        <div className="spinner w-4 h-4"></div>
                      )}
                      <button
                        onClick={() => removeFile(uploadFile.id)}
                        className="p-1 text-gray-400 hover:text-gray-600 rounded"
                        disabled={uploadFile.status === 'uploading'}
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-xs text-gray-500">
                      {formatFileSize(uploadFile.file.size)}
                    </p>
                    <p className="text-xs text-gray-500 capitalize">
                      {uploadFile.status === 'uploading' ? `${uploadFile.progress}%` : uploadFile.status}
                    </p>
                  </div>

                  {uploadFile.status === 'uploading' && (
                    <div className="mt-2">
                      <div className="bg-gray-200 rounded-full h-1">
                        <div
                          className="bg-primary-600 h-1 rounded-full transition-all duration-300"
                          style={{ width: `${uploadFile.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}

                  {uploadFile.error && (
                    <p className="text-xs text-red-600 mt-1">{uploadFile.error}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default UploadArea;