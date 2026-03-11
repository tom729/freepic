'use client';

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import piexif from 'piexifjs';
import { useAuthStore } from '@/stores/auth';
import { LogIn, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface ExifData {
  camera?: string;
  dateTaken?: string;
  iso?: string;
  aperture?: string;
  shutterSpeed?: string;
  gps?: {
    latitude: number;
    longitude: number;
    latitudeRef: string;
    longitudeRef: string;
    formatted: string;
  };
  locationName?: string;
}

interface ValidationError {
  type: 'size' | 'type' | 'exif';
  message: string;
}

interface UploadedFile {
  id: string;
  file: File;
  preview: string;
  exif: ExifData;
  isValid: boolean;
  errors: ValidationError[];
  uploadStatus?: 'idle' | 'uploading' | 'success' | 'error';
  uploadedImageId?: string;
}


const MAX_FILE_SIZE = 50 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/jpg'];

function bytesToString(bytes: unknown): string {
  if (typeof bytes === 'string') return bytes;
  if (Array.isArray(bytes)) {
    return bytes.map((b) => String.fromCharCode(b as number)).join('');
  }
  return String(bytes);
}

// EXIF 标签ID到名称的映射


export default function UploadPage() {
  const { isAuthenticated, isLoading, init, token } = useAuthStore();
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{[key: string]: number}>({});
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [description, setDescription] = useState('');
  const [exifDebugInfo, setExifDebugInfo] = useState<{[key: string]: {
    mainFields: { label: string; value: string }[];
    error?: string;
  }}>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 计算总体上传进度
  const totalProgress = useMemo(() => {
    const files = Object.values(uploadProgress);
    if (files.length === 0) return 0;
    return Math.round(files.reduce((sum, p) => sum + p, 0) / files.length);
  }, [uploadProgress]);

  // 检查是否所有文件都已上传成功
  const allUploadSuccess = useMemo(() => {
    return uploadedFiles.length > 0 && uploadedFiles.every(f => f.uploadStatus === 'success');
  }, [uploadedFiles]);

  // 检查是否有文件正在上传
  const hasUploadingFiles = useMemo(() => {
    return uploadedFiles.some(f => f.uploadStatus === 'uploading');
  }, [uploadedFiles]);

  // 获取有效文件数量
  const validFilesCount = useMemo(() => {
    return uploadedFiles.filter(f => f.isValid).length;
  }, [uploadedFiles]);



  // 延迟初始化，确保 persist 中间件已经完成 rehydrate
  useEffect(() => {
    const timer = setTimeout(() => {
      init();
    }, 100);
    return () => clearTimeout(timer);
  }, [init]);
  const extractExifData = useCallback((base64Image: string): { 
    hasExif: boolean; 
    data: ExifData;
    debugInfo: {
      mainFields: { label: string; value: string }[];
      error?: string;
    };
  } => {
    try {
      const exifObj = piexif.load(base64Image);
      const exif = exifObj['0th'] || {};
      const exifData = exifObj['Exif'] || {};
      
      // 检查是否有EXIF数据
      const hasExif = Object.keys(exifObj).some(key => {
        const section = exifObj[key as keyof typeof exifObj];
        return section && Object.keys(section).length > 0;
      });
      
      if (!hasExif) {
        return { 
          hasExif: false, 
          data: {},
          debugInfo: { mainFields: [] }
        };
      }
      
      const result: ExifData = {};
      const mainFields: { label: string; value: string }[] = [];

      // 相机型号
      if (exif[piexif.ImageIFD.Make] || exif[piexif.ImageIFD.Model]) {
        const make = exif[piexif.ImageIFD.Make] ? bytesToString(exif[piexif.ImageIFD.Make]) : '';
        const model = exif[piexif.ImageIFD.Model] ? bytesToString(exif[piexif.ImageIFD.Model]) : '';
        result.camera = `${make} ${model}`.trim();
        mainFields.push({ label: '相机型号', value: result.camera });
      }

      // 拍摄时间
      if (exifData[piexif.ExifIFD.DateTimeOriginal]) {
        result.dateTaken = bytesToString(exifData[piexif.ExifIFD.DateTimeOriginal]);
        mainFields.push({ label: '拍摄时间', value: result.dateTaken });
      }

      // ISO
      if (exifData[piexif.ExifIFD.ISOSpeedRatings]) {
        const iso = String(exifData[piexif.ExifIFD.ISOSpeedRatings]);
        mainFields.push({ label: 'ISO', value: iso });
      }

      // 光圈 (FNumber)
      if (exifData[piexif.ExifIFD.FNumber]) {
        const fnum = exifData[piexif.ExifIFD.FNumber];
        if (Array.isArray(fnum) && fnum.length === 2) {
          const aperture = `f/${(fnum[0] / fnum[1]).toFixed(1)}`;
          mainFields.push({ label: '光圈', value: aperture });
        }
      }

      // 快门速度 (ExposureTime)
      if (exifData[piexif.ExifIFD.ExposureTime]) {
        const exp = exifData[piexif.ExifIFD.ExposureTime];
        if (Array.isArray(exp) && exp.length === 2) {
          let shutter: string;
          if (exp[0] === 1) {
            shutter = `1/${exp[1]}s`;
          } else {
            const seconds = exp[0] / exp[1];
            shutter = seconds >= 1 ? `${seconds.toFixed(1)}s` : `1/${Math.round(1 / seconds)}s`;
          }
          mainFields.push({ label: '快门速度', value: shutter });
        }
      }

      // 焦距
      if (exifData[piexif.ExifIFD.FocalLength]) {
        const focal = exifData[piexif.ExifIFD.FocalLength];
        if (Array.isArray(focal) && focal.length === 2) {
          const focalLength = `${(focal[0] / focal[1]).toFixed(0)}mm`;
          mainFields.push({ label: '焦距', value: focalLength });
        }
      }

      // 图像尺寸
      if (exif[piexif.ImageIFD.ImageWidth] && exif[piexif.ImageIFD.ImageLength]) {
        const width = exif[piexif.ImageIFD.ImageWidth];
        const height = exif[piexif.ImageIFD.ImageLength];
        mainFields.push({ label: '图像尺寸', value: `${width} x ${height}` });
      }

      return { 
        hasExif: true, 
        data: result,
        debugInfo: { mainFields }
      };
    } catch (error) {
      console.error('EXIF extraction error:', error);
      return { 
        hasExif: false, 
        data: {},
        debugInfo: { 
          mainFields: [],
          error: error instanceof Error ? error.message : String(error)
        }
      };
    }
  }, []);



  const validateFile = useCallback(
    async (file: File, id: string): Promise<UploadedFile> => {
      const errors: ValidationError[] = [];

      if (!ALLOWED_TYPES.includes(file.type)) {
        errors.push({ type: 'type', message: '仅支持JPG/PNG格式' });
      }

      if (file.size > MAX_FILE_SIZE) {
        errors.push({ type: 'size', message: '图片大小超过50MB限制' });
      }

      const preview = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });

      const { hasExif, data: exif, debugInfo } = extractExifData(preview);
      setExifDebugInfo((prev) => ({ ...prev, [id]: debugInfo }));

      if (ALLOWED_TYPES.includes(file.type) && !hasExif) {
        errors.push({ type: 'exif', message: '该图片缺少EXIF信息，请使用相机原图上传' });
      }

      return { id, file, preview, exif, isValid: errors.length === 0, errors, uploadStatus: 'idle' };
    },
    [extractExifData]
  );

  const handleFiles = useCallback(
    async (files: FileList) => {
      setUploadStatus('idle');
      const newFiles: UploadedFile[] = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const id = `${Date.now()}-${i}`;
        const result = await validateFile(file, id);
        newFiles.push(result);
      }
      
      setUploadedFiles((prev) => [...prev, ...newFiles]);
    },
    [validateFile]
  );

  const removeFile = useCallback((id: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== id));
    setExifDebugInfo((prev) => {
      const newInfo = { ...prev };
      delete newInfo[id];
      return newInfo;
    });
  }, []);
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files);
      }
    },
    [handleFiles]
  );

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
      // Reset input value to allow selecting the same files again
      e.target.value = '';
    }
  };
  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleUpload = async () => {
    const validFiles = uploadedFiles.filter(f => f.isValid && f.uploadStatus !== 'success');
    if (validFiles.length === 0) return;

    setIsUploading(true);
    setUploadStatus('uploading');

    // Upload files sequentially
    for (const fileItem of validFiles) {
      try {
        // Update status to uploading
        setUploadedFiles(prev =>
          prev.map(f =>
            f.id === fileItem.id ? { ...f, uploadStatus: 'uploading' } : f
          )
        );

        const formData = new FormData();
        formData.append('file', fileItem.file);
        if (description.trim()) {
          formData.append('description', description.trim());
        }

        // Use XMLHttpRequest for progress tracking
        const response = await new Promise<Response>((resolve, reject) => {
          const xhr = new XMLHttpRequest();

          xhr.upload.addEventListener('progress', (event) => {
            if (event.lengthComputable) {
              const progress = Math.round((event.loaded / event.total) * 100);
              setUploadProgress(prev => ({ ...prev, [fileItem.id]: progress }));
            }
          });

          xhr.addEventListener('load', () => {
            const response = new Response(xhr.response, {
              status: xhr.status,
              statusText: xhr.statusText,
            });
            resolve(response);
          });

          xhr.addEventListener('error', () => {
            reject(new Error('上传失败'));
          });

          xhr.addEventListener('abort', () => {
            reject(new Error('上传被取消'));
          });

          xhr.open('POST', '/api/upload');
          xhr.setRequestHeader('Authorization', `Bearer ${token}`);
          xhr.responseType = 'text';
          xhr.send(formData);
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || '上传失败');
        }

        // Mark as success
        setUploadedFiles(prev =>
          prev.map(f =>
            f.id === fileItem.id
              ? { ...f, uploadStatus: 'success', uploadedImageId: data.image?.id }
              : f
          )
        );
        setUploadProgress(prev => ({ ...prev, [fileItem.id]: 100 }));
      } catch (error) {
        console.error(`上传失败 (${fileItem.file.name}):`, error);
        setUploadedFiles(prev =>
          prev.map(f =>
            f.id === fileItem.id ? { ...f, uploadStatus: 'error' } : f
          )
        );
      }
    }

    setIsUploading(false);
    const hasErrors = uploadedFiles.some(f => f.uploadStatus === 'error');
    const hasSuccesses = uploadedFiles.some(f => f.uploadStatus === 'success');
    
    if (hasSuccesses && !hasErrors) {
      setUploadStatus('success');
    } else if (hasErrors && !hasSuccesses) {
      setUploadStatus('error');
    } else {
      setUploadStatus('success'); // Partial success
    }
  };


  const handleClear = () => {
    setUploadedFiles([]);
    setExifDebugInfo({});
    setUploadStatus('idle');
    setDescription('');
    setUploadProgress({});
    
    if (fileInputRef.current) fileInputRef.current.value = '';
  };


  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // 加载中状态
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-6 sm:py-12 px-4 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">加载中...</p>
        </div>
      </div>
    );
  }

  // 未登录状态
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-6 sm:py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8 sm:mb-12">
            <h1 className="text-2xl sm:text-4xl font-bold text-slate-900 mb-3 sm:mb-4">上传图片</h1>
            <p className="text-slate-600 text-base sm:text-lg">分享你的精彩摄影作品</p>
          </div>

          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-slate-200 p-8 sm:p-16 text-center">
            <div className="mx-auto w-20 h-20 sm:w-24 sm:h-24 mb-6 rounded-full bg-indigo-50 flex items-center justify-center">
              <LogIn className="w-10 h-10 sm:w-12 sm:h-12 text-indigo-600" />
            </div>
            <h2 className="text-xl sm:text-2xl font-semibold text-slate-900 mb-3">请先登录</h2>
            <p className="text-slate-600 mb-6 max-w-md mx-auto">
              上传图片需要登录账号。登录后可以分享你的摄影作品，并管理你的上传记录。
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/login"
                className="inline-flex items-center justify-center px-6 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors"
              >
                立即登录
              </Link>
              <Link
                href="/"
                className="inline-flex items-center justify-center px-6 py-3 bg-slate-100 text-slate-700 font-medium rounded-xl hover:bg-slate-200 transition-colors"
              >
                返回首页
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 已登录，显示上传界面
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-6 sm:py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-2xl sm:text-4xl font-bold text-slate-900 mb-3 sm:mb-4">上传图片</h1>
          <p className="text-slate-600 text-base sm:text-lg">支持 JPG/PNG 格式，最大 50MB</p>
        </div>

        <div
          onClick={handleClick}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`relative cursor-pointer rounded-2xl sm:rounded-3xl border-2 border-dashed transition-all ${
            isDragging
              ? 'border-indigo-500 bg-indigo-50/80'
              : 'border-slate-300 bg-white/60 hover:border-indigo-400'
          } ${uploadedFiles.length > 0 ? 'p-4 sm:p-8' : 'p-8 sm:p-16'}`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".jpg,.jpeg,.png"
            multiple
            onChange={handleFileInput}
            className="hidden"
          />

          {uploadedFiles.length === 0 ? (
            <div className="text-center">
              <div
                className={`mx-auto w-16 h-16 sm:w-24 sm:h-24 mb-4 sm:mb-6 rounded-xl flex items-center justify-center ${
                  isDragging ? 'bg-indigo-500 text-white' : 'bg-slate-100 text-slate-400'
                }`}
              >
                <svg
                  className="w-8 h-8 sm:w-12 sm:h-12"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
              </div>
              <p className="text-lg sm:text-xl font-medium text-slate-700">
                {isDragging ? '松开以上传' : '拖放图片到此处'}
              </p>
              <p className="text-slate-500 text-sm mt-2">或点击选择文件</p>
            </div>
          ) : (
            <div className="space-y-4 sm:space-y-6" onClick={(e) => e.stopPropagation()}>
              {/* 文件网格 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {uploadedFiles.map((file) => (
                  <div
                    key={file.id}
                    className={`relative bg-white rounded-xl overflow-hidden shadow-sm border-2 transition-all ${
                      file.isValid
                        ? file.uploadStatus === 'success'
                          ? 'border-green-400'
                          : file.uploadStatus === 'error'
                            ? 'border-red-400'
                            : 'border-transparent'
                        : 'border-red-300'
                    }`}
                  >
                    {/* 图片预览 */}
                    <div className="aspect-square bg-slate-100 relative overflow-hidden">
                      <img
                        src={file.preview}
                        alt={file.file.name}
                        className="w-full h-full object-cover"
                      />
                      
                      {/* 状态遮罩 */}
                      {file.uploadStatus === 'uploading' && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <div className="text-center text-white">
                            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                            <span className="text-sm font-medium">{uploadProgress[file.id] || 0}%</span>
                          </div>
                        </div>
                      )}
                      
                      {file.uploadStatus === 'success' && (
                        <div className="absolute inset-0 bg-green-500/80 flex items-center justify-center">
                          <div className="text-center text-white">
                            <svg className="w-10 h-10 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="text-sm font-medium">上传成功</span>
                          </div>
                        </div>
                      )}
                      
                      {file.uploadStatus === 'error' && (
                        <div className="absolute inset-0 bg-red-500/80 flex items-center justify-center">
                          <div className="text-center text-white px-2">
                            <svg className="w-10 h-10 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            <span className="text-sm font-medium">上传失败</span>
                          </div>
                        </div>
                      )}
                      
                      {/* 删除按钮 */}
                      {(!isUploading || file.uploadStatus !== 'uploading') && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFile(file.id);
                          }}
                          className="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 shadow-md transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                      
                      {/* 无效文件标记 */}
                      {!file.isValid && (
                        <div className="absolute top-2 left-2 px-2 py-1 bg-red-500 text-white text-xs font-medium rounded-md shadow-md">
                          无效文件
                        </div>
                      )}
                    </div>
                    
                    {/* 文件信息 */}
                    <div className="p-3">
                      <p className="text-sm font-medium text-slate-900 truncate" title={file.file.name}>
                        {file.file.name}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {formatFileSize(file.file.size)}
                      </p>
                      
                      {/* 单个文件进度条 */}
                      {file.uploadStatus === 'uploading' && uploadProgress[file.id] !== undefined && (
                        <div className="mt-2">
                          <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-indigo-600 h-1.5 rounded-full transition-all duration-300"
                              style={{ width: `${uploadProgress[file.id]}%` }}
                            />
                          </div>
                        </div>
                      )}
                      
                      {/* 验证错误 */}
                      {!file.isValid && file.errors.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {file.errors.map((error, i) => (
                            <p key={i} className="text-xs text-red-600">
                              {error.message}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              {/* 添加更多文件按钮 */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                disabled={isUploading}
                className="w-full py-3 rounded-xl border-2 border-dashed border-slate-300 text-slate-600 font-medium hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                + 添加更多文件
              </button>
              
              {/* 文件统计 */}
              <div className="flex items-center justify-between text-sm text-slate-600 bg-slate-50 rounded-lg p-3">
                <span>
                  共 <strong className="text-slate-900">{uploadedFiles.length}</strong> 个文件
                </span>
                <span>
                  有效文件: <strong className={validFilesCount > 0 ? 'text-green-600' : 'text-slate-900'}>{validFilesCount}</strong>
                  / {uploadedFiles.length}
                </span>
              </div>

              {/* 批量描述输入 */}
              <div className="bg-white border border-slate-200 rounded-xl p-4">
                <label htmlFor="description" className="block font-semibold text-slate-800 mb-2">
                  图片描述 <span className="text-slate-400 font-normal text-sm">（可选，将应用于所有文件）</span>
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  placeholder="添加图片的详细描述，例如：拍摄地点、场景故事、拍摄技巧等..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                  rows={3}
                  maxLength={500}
                  disabled={isUploading}
                />
                <p className="text-xs text-slate-400 mt-1 text-right">
                  {description.length}/500
                </p>
              </div>

              {/* 总体上传进度 */}
              {isUploading && validFilesCount > 0 && (
                <div className="bg-white/80 rounded-xl p-4 shadow-sm border border-slate-100">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-slate-700">总体上传进度</span>
                    <span className="text-sm font-semibold text-indigo-600">{totalProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300 ease-out"
                      style={{ width: `${totalProgress}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    {totalProgress < 100 ? `正在上传 ${uploadedFiles.filter(f => f.uploadStatus === 'uploading').length} 个文件...` : '正在处理...'}
                  </p>
                </div>
              )}

              {/* 上传状态提示 */}
              {uploadStatus === 'success' && allUploadSuccess && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-green-700">
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="font-semibold">所有文件上传成功！</span>
                  </div>
                  <p className="text-sm text-green-600">
                    共上传 {uploadedFiles.filter(f => f.uploadStatus === 'success').length} 个文件
                  </p>
                </div>
              )}
              
              {uploadStatus === 'success' && !allUploadSuccess && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-yellow-700">
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span className="font-semibold">部分文件上传完成</span>
                  </div>
                  <p className="text-sm text-yellow-600">
                    成功: {uploadedFiles.filter(f => f.uploadStatus === 'success').length}, 
                    失败: {uploadedFiles.filter(f => f.uploadStatus === 'error').length}
                  </p>
                </div>
              )}
              
              {uploadStatus === 'error' && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600">
                  上传失败，请检查网络或图片格式后重试
                </div>
              )}

              {/* 上传按钮或操作按钮 */}
              {allUploadSuccess ? (
                <div className="space-y-3">
                  <button
                    disabled
                    className="w-full py-3 sm:py-4 rounded-xl font-semibold text-base bg-green-600 text-white cursor-default"
                  >
                    上传完成
                  </button>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleClear();
                      }}
                      className="py-3 rounded-xl font-medium text-base bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors border border-indigo-200"
                    >
                      继续上传
                    </button>
                    <Link
                      href="/profile"
                      onClick={(e) => e.stopPropagation()}
                      className="py-3 rounded-xl font-medium text-base bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors text-center"
                    >
                      查看上传列表
                    </Link>
                  </div>
                </div>
              ) : (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUpload();
                  }}
                  disabled={validFilesCount === 0 || isUploading}
                  className={`w-full py-3 sm:py-4 rounded-xl font-semibold text-base transition-all ${
                    validFilesCount > 0 && !isUploading
                      ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  {isUploading ? `上传中 ${totalProgress}%` : validFilesCount === 0 ? '无可上传的有效文件' : `确认上传 ${validFilesCount} 个文件`}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
