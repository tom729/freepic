# 修复上传失败 - Sharp图片处理问题

## 问题

上传图片时返回"上传失败，请检查网络或图片格式后重试"。

查看日志发现：

```
Failed to get image dimensions: Error: Input buffer contains unsupported image format
    at Sharp.metadata
Failed to generate BlurHash: Error: Input buffer contains unsupported image format
    at Sharp.toBuffer
```

## 原因

`sharp` 库对某些图片格式处理失败，导致 `processImage` 函数抛出错误，整个上传流程中断。

## 修复方案

修改 `lib/image-processing.ts` 中的 `processImage` 函数，添加try-catch包裹，即使图片处理失败也允许上传继续（只是缺少blurHash和dominantColor）。

**文件**: `lib/image-processing.ts`

**修改** (第90-102行):

```typescript
export async function processImage(buffer: Buffer) {
  try {
    const [blurHash, dominantColor, dimensions] = await Promise.all([
      generateBlurHash(buffer),
      extractDominantColor(buffer),
      getImageDimensions(buffer),
    ]);

    return {
      blurHash,
      dominantColor,
      ...dimensions,
    };
  } catch (error) {
    console.error('Image processing failed:', error);
    // Return null values but don't fail the upload
    return {
      blurHash: null,
      dominantColor: null,
      width: null,
      height: null,
    };
  }
}
```

## 验证步骤

1. 重新构建: `npm run build`
2. 重启服务器: `npm run dev`
3. 上传图片测试
4. 运行验证脚本: `./scripts/verify-core-flows.sh`
