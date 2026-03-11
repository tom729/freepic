import { pipeline } from '@xenova/transformers';

const imageUrl = 'https://tukupic.mepai.me/users/41a8ccef-e4b5-44fa-97bd-e8cb262ce252/2026/03/c5464f25-b83c-4f36-9a86-fd378011aa48.jpeg/thumb';

const labels = ['人', '海', '山', '天空', '城市', '街道', '自然', '建筑', '水', '树', '肖像', '人脸'];

async function analyze() {
  console.log('分析新上传的照片...\n');
  const classifier = await pipeline('zero-shot-image-classification', 'Xenova/clip-vit-base-patch32');
  
  const results = await classifier(imageUrl, labels);
  console.log('预测标签:');
  results.forEach((r: any, i: number) => {
    console.log(`  ${i+1}. ${r.label}: ${(r.score * 100).toFixed(1)}%`);
  });
  
  process.exit(0);
}

analyze();
