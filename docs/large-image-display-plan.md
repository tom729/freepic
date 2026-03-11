# 大图量展示规划方案

## 当前状态

现有组件已经支持基础大图量展示：

### 已有功能

1. **MasonryGallery** (`components/MasonryGallery.tsx`)
   - 瀑布流布局（react-masonry-css）
   - 无限滚动加载（Intersection Observer）
   - 每次加载20张图片
   - 响应式断点：1/2/3/4列

2. **ImageGrid** (`components/ImageGrid.tsx`)
   - 瀑布流布局
   - 手动"加载更多"按钮
   - 分页参数控制

3. **搜索页面** (`app/search/page.tsx`)
   - 语义搜索 + 以图搜图
   - 网格展示结果（1-4列响应式）
   - 限制返回40张图片

---

## 大图量优化方案（图片数 > 1000）

### 1. 虚拟滚动（Virtual Scrolling）

当图片数量超过1000张时，使用虚拟滚动只渲染可视区域的图片。

**推荐库**：

- `react-window` - 轻量级，适合固定高度
- `react-virtuoso` - 支持可变高度，更适合瀑布流
- `@tanstack/react-virtual` - 现代方案，性能好

**实现思路**：

```typescript
// 使用 react-virtuoso 实现虚拟瀑布流
import { VirtuosoGrid } from 'react-virtuoso'

<VirtuosoGrid
  data={images}
  itemContent={(index, image) => <ImageCard image={image} />}
  overscan={200} // 预渲染区域
/>
```

### 2. 图片懒加载优化

当前已实现基础懒加载，可以进一步优化：

**优先级加载**：

- 首屏图片：立即加载（priority）
- 可视区域：正常加载（loading="lazy"）
- 预加载：下2屏图片预加载

**模糊占位**：

- 使用 BlurHash 或 dominant color 作为占位
- 低分辨率缩略图先显示

### 3. 分页策略

| 图片数量 | 策略                | 单次加载 |
| -------- | ------------------- | -------- |
| < 100    | 全部加载            | 全部     |
| 100-500  | 无限滚动            | 20张     |
| 500-2000 | 无限滚动 + 虚拟滚动 | 40张     |
| > 2000   | 虚拟滚动 + 分页缓存 | 40张     |

### 4. 搜索API优化

当前语义搜索在JavaScript中计算相似度，大数据量时需要优化：

**方案A：pgvector（PostgreSQL向量扩展）**

```sql
-- 使用 pgvector 进行向量相似度搜索
SELECT * FROM image_embeddings
ORDER BY embedding <-> query_embedding
LIMIT 40;
```

**方案B：向量数据库**

- Pinecone
- Weaviate
- Milvus
- Qdrant

**方案C：近似最近邻（ANN）算法**

- HNSW（Hierarchical Navigable Small World）
- IVF（Inverted File Index）

### 5. 缓存策略

**前端缓存**：

- React Query / SWR 缓存搜索结果
- 图片URL缓存（避免重复生成签名URL）

**后端缓存**：

- Redis 缓存热门搜索结果
- 向量搜索结果缓存（相同query直接返回）

### 6. 渐进式加载体验

```
用户搜索
    ↓
显示骨架屏（8张）
    ↓
先返回前20张结果（快速响应）
    ↓
后台继续计算剩余相似度
    ↓
自动加载更多（无限滚动）
```

### 7. 性能监控

关键指标：

- **FCP** (First Contentful Paint): < 1.5s
- **LCP** (Largest Contentful Paint): < 2.5s
- **CLS** (Cumulative Layout Shift): < 0.1
- **INP** (Interaction to Next Paint): < 200ms

---

## 实施优先级

### 第一阶段（当前）✅

- [x] 基础瀑布流布局
- [x] 无限滚动加载
- [x] 语义搜索功能

### 第二阶段（图片 > 500）

- [ ] 增加虚拟滚动支持
- [ ] 实现图片优先级加载
- [ ] 添加搜索缓存

### 第三阶段（图片 > 2000）

- [ ] 集成 pgvector 或向量数据库
- [ ] 实现 ANN 近似搜索
- [ ] 添加 Redis 缓存层

### 第四阶段（图片 > 10000）

- [ ] 分片加载策略
- [ ] CDN 图片加速
- [ ] 搜索结果预计算

---

## 技术选型建议

| 功能     | 当前方案          | 升级方案            |
| -------- | ----------------- | ------------------- |
| 布局     | react-masonry-css | react-virtuoso      |
| 搜索     | JS内存计算        | pgvector / Pinecone |
| 缓存     | 无                | Redis + React Query |
| 图片加载 | 原生lazy          | 自定义优先级加载    |
| 状态管理 | useState          | Zustand (已有)      |

---

## 当前代码优化点

### 搜索页面 (`app/search/page.tsx`)

1. 限制返回40张图片（line 34: `limit: 40`）
2. 网格布局响应式（1-4列）
3. 骨架屏加载体验

### 优化建议

```typescript
// 1. 添加加载状态管理
const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());

// 2. 图片可见性检测
const { ref, inView } = useInView({
  triggerOnce: true,
  rootMargin: '200px',
});

// 3. 分批渲染
const visibleImages = images.slice(0, renderCount);
```

---

## 参考实现

### 虚拟滚动 + 瀑布流

```typescript
// components/VirtualMasonry.tsx
import { VirtuosoGrid } from 'react-virtuoso'

export function VirtualMasonry({ images }: { images: ImageItem[] }) {
  return (
    <VirtuosoGrid
      data={images}
      itemContent={(index, image) => (
        <ImageCard image={image} index={index} />
      )}
      listClassName="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
      itemClassName=""
      overscan={100}
    />
  )
}
```

### 带缓存的搜索 Hook

```typescript
// hooks/useSemanticSearch.ts
import { useQuery } from '@tanstack/react-query';

export function useSemanticSearch(query: string) {
  return useQuery({
    queryKey: ['semantic-search', query],
    queryFn: async () => {
      const res = await fetch('/api/search/semantic', {
        method: 'POST',
        body: JSON.stringify({ query, limit: 40 }),
      });
      return res.json();
    },
    staleTime: 5 * 60 * 1000, // 5分钟缓存
    enabled: !!query.trim(),
  });
}
```
