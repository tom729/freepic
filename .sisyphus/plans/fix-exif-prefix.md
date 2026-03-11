# 修复EXIF解析 - 移除错误的前缀剥离

## 问题根源

经过测试发现：**piexif.load() 无法解析纯base64字符串，但可以正确解析 data URL 格式！**

当前代码错误地剥离了 data URI 前缀：

```typescript
// ❌ 错误代码
const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '');
const exifObj = piexif.load(base64Data); // 抛出错误: 'load' gots invalid file data
```

## 修复方案

**文件**: `app/upload/page.tsx`

**修改** - 第62-99行的 `extractExifData` 函数:

```typescript
const extractExifData = useCallback((base64Image: string): { hasExif: boolean; data: ExifData } => {
  try {
    // piexif.load() accepts data URL format (data:image/jpeg;base64,...)
    // It does NOT work with pure base64 strings
    const exifObj = piexif.load(base64Image);

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

## 关键变更

- ❌ 删除: `const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '');`
- ✅ 直接使用: `piexif.load(base64Image)`

## 测试验证

测试命令验证结果：

- 纯base64: ❌ `'load' gots invalid file data`
- data URL: ✅ 可以正确解析
- binary string: ✅ 可以正确解析

## 验证步骤

1. 重新构建项目
2. 重启开发服务器
3. 使用用户提供的测试图片验证
