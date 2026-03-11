# 修复EXIF检测逻辑问题

## 问题描述

用户上传带有EXIF信息的图片，系统却返回"该图片缺少EXIF信息，请使用相机原图上传"。

## 根本原因

`extractExifData` 函数只提取 `camera` 和 `dateTaken` 两个字段，但验证逻辑检查的是返回的对象是否为空。如果图片有EXIF信息（如ISO、光圈、GPS等）但没有相机型号或拍摄时间，就会被误判为没有EXIF。

## 修复方案

修改 `extractExifData` 函数，使其正确检测原始EXIF数据的存在，而不是仅依赖提取的字段。

### 具体修改

**文件**: `app/upload/page.tsx`

**修改1** - 更新函数返回类型和逻辑 (第62-88行):

```typescript
const extractExifData = useCallback((base64Image: string): { hasExif: boolean; data: ExifData } => {
  try {
    // Remove data URI prefix if present (e.g., "data:image/jpeg;base64,")
    const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '');
    const exifObj = piexif.load(base64Data);

    // Check if any EXIF data exists
    const hasExif = Object.keys(exifObj).some((key) => {
      const section = exifObj[key as keyof typeof exifObj];
      return section && Object.keys(section).length > 0;
    });

    if (!hasExif) {
      return { hasExif: false, data: {} };
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

    return { hasExif: true, data: result };
  } catch (error) {
    console.error('EXIF extraction error:', error);
    return { hasExif: false, data: {} };
  }
}, []);
```

**修改2** - 更新调用处的验证逻辑 (第109-113行):

```typescript
const { hasExif, data: exif } = extractExifData(preview);

if (ALLOWED_TYPES.includes(file.type) && !hasExif) {
  errors.push({ type: 'exif', message: '该图片缺少EXIF信息，请使用相机原图上传' });
}
```

## 验证步骤

1. 重新构建项目: `npm run build`
2. 重启开发服务器: `npm run dev`
3. 上传带有EXIF的图片进行测试
4. 运行验证脚本: `./scripts/verify-core-flows.sh`

## 预期结果

- 带有EXIF信息的图片应该被正确接受
- 只有真正没有EXIF的图片才会被拒绝
