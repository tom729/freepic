# 添加EXIF调试展示功能

## 需求

用户需要在图片拖入上传区域后，页面上展示读取到的EXIF信息，以便调试。

## 修改方案

**文件**: `app/upload/page.tsx`

### 修改1 - 更新 extractExifData 函数 (第62-98行)

返回更多调试信息，包括原始EXIF对象：

```typescript
const extractExifData = useCallback(
  (
    base64Image: string
  ): {
    hasExif: boolean;
    data: ExifData;
    debugInfo: {
      sections: string[];
      rawKeys: Record<string, string[]>;
      error?: string;
    };
  } => {
    try {
      const exifObj = piexif.load(base64Image);

      // Collect debug info
      const sections: string[] = [];
      const rawKeys: Record<string, string[]> = {};

      Object.keys(exifObj).forEach((key) => {
        const section = exifObj[key as keyof typeof exifObj];
        if (section && Object.keys(section).length > 0) {
          sections.push(key);
          rawKeys[key] = Object.keys(section).slice(0, 20); // Limit keys for display
        }
      });

      const hasExif = sections.length > 0;

      if (!hasExif) {
        return {
          hasExif: false,
          data: {},
          debugInfo: { sections: [], rawKeys: {} },
        };
      }

      const exif = exifObj['0th'] || {};
      const exifData = exifObj['Exif'] || {};
      const result: ExifData = {};

      if (exif[piexif.ImageIFD.Make] && exif[piexif.ImageIFD.Model]) {
        const make = bytesToString(exif[piexif.ImageIFD.Make]);
        const model = bytesToString(exif[piexif.ImageIFD.Model]);
        result.camera = `${make} ${model}`.trim();
      } else if (exif[piexif.ImageIFD.Model]) {
        result.camera = bytesToString(exif[piexif.ImageIFD.Model]);
      }

      if (exifData[piexif.ExifIFD.DateTimeOriginal]) {
        result.dateTaken = bytesToString(exifData[piexif.ExifIFD.DateTimeOriginal]);
      }

      return {
        hasExif: true,
        data: result,
        debugInfo: { sections, rawKeys },
      };
    } catch (error) {
      console.error('EXIF extraction error:', error);
      return {
        hasExif: false,
        data: {},
        debugInfo: {
          sections: [],
          rawKeys: {},
          error: error instanceof Error ? error.message : String(error),
        },
      };
    }
  },
  []
);
```

### 修改2 - 添加调试状态 (第51行后)

```typescript
const [exifDebugInfo, setExifDebugInfo] = useState<{
  sections: string[];
  rawKeys: Record<string, string[]>;
  error?: string;
} | null>(null);
```

### 修改3 - 更新 validateFile 调用处 (第120行附近)

在调用 `extractExifData` 后保存调试信息：

```typescript
const { hasExif, data: exif, debugInfo } = extractExifData(preview);
setExifDebugInfo(debugInfo); // 添加这行
```

### 修改4 - 在UI中添加EXIF调试面板

在文件预览区域（找到类似 `uploadedFile && (` 的地方）添加调试信息展示：

```tsx
{
  exifDebugInfo && (
    <div className="mt-4 p-4 bg-gray-50 dark:bg-neutral-800 rounded-lg text-sm">
      <h4 className="font-semibold mb-2">EXIF 调试信息</h4>

      {exifDebugInfo.error ? (
        <div className="text-red-500">错误: {exifDebugInfo.error}</div>
      ) : (
        <>
          <div className="mb-2">
            <span className="text-neutral-500">发现的分区:</span>{' '}
            {exifDebugInfo.sections.length > 0 ? exifDebugInfo.sections.join(', ') : '无'}
          </div>

          {Object.entries(exifDebugInfo.rawKeys).map(([section, keys]) => (
            <div key={section} className="mb-2">
              <span className="text-neutral-500">{section} 字段:</span>
              <div className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
                {keys.join(', ')}
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
```

## 效果

上传图片后，页面会显示：

1. EXIF数据是否存在
2. 发现了哪些EXIF分区（0th, Exif, GPS等）
3. 每个分区包含的字段列表
4. 如果有错误，显示错误信息

这样可以帮助诊断EXIF读取问题。
