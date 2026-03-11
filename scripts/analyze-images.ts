import { pipeline } from '@xenova/transformers';

const images = [
  { id: '75a87803', name: 'DSC00054', url: 'https://tukupic.mepai.me/users/41a8ccef-e4b5-44fa-97bd-e8cb262ce252/2026/03/DSC00054.jpeg/thumb' },
  { id: 'ef8ced91', name: 'DSC00032', url: 'https://tukupic.mepai.me/users/41a8ccef-e4b5-44fa-97bd-e8cb262ce252/2026/03/DSC00032.jpeg/thumb' },
  { id: 'c8f5ff0c', name: 'c40fca8c', url: 'https://tukupic.mepai.me/users/41a8ccef-e4b5-44fa-97bd-e8cb262ce252/2026/03/c40fca8c-1664-4a08-9d04-e62d25f402a6.jpeg/thumb' },
  { id: '8f941da9', name: '485d3e1e', url: 'https://tukupic.mepai.me/users/41a8ccef-e4b5-44fa-97bd-e8cb262ce252/2026/03/485d3e1e-6c79-49c3-8387-6305a590afbd.jpeg/thumb' },
];

const labels = ['人', '海', '山', '天空', '城市', '街道', '自然', '建筑', '水', '树'];

async function analyze() {
  console.log('加载 CLIP 分类模型...\n');
  const classifier = await pipeline('zero-shot-image-classification', 'Xenova/clip-vit-base-patch32');
  
  for (const img of images) {
    console.log(`分析: ${img.name} (${img.id})`);
    try {
      const results = await classifier(img.url, labels);
      console.log('  预测标签:');
      results.slice(0, 5).forEach((r: any, i: number) => {
        console.log(`    ${i+1}. ${r.label}: ${(r.score * 100).toFixed(1)}%`);
      });
      console.log('');
    } catch (err: any) {
      console.error(`  错误: ${err.message}\n`);
    }
  }
  process.exit(0);
}

analyze();
