import { pipeline } from '@xenova/transformers';

const imageUrl = 'https://tukupic.mepai.me/users/41a8ccef-e4b5-44fa-97bd-e8cb262ce252/2026/03/c5464f25-b83c-4f36-9a86-fd378011aa48.jpeg/thumb';

// 更详细的人物相关标签
const labels = [
  'person', 'human', 'face', 'portrait', 'headshot',  // 英文人物
  '人', '人物', '肖像', '人脸', '特写', '自拍',     // 中文人物
  'sea', 'ocean', 'mountain', 'landscape',            // 英文风景
  '海', '海洋', '山', '风景', '自然'                  // 中文风景
];

async function analyze() {
  console.log('详细分析 b156e5ad 照片内容...\n');
  const classifier = await pipeline('zero-shot-image-classification', 'Xenova/clip-vit-base-patch32');
  
  const results = await classifier(imageUrl, labels);
  
  console.log('人物相关标签:');
  results.filter((r: any) => ['person','human','face','portrait','headshot','人','人物','肖像','人脸','特写','自拍'].includes(r.label))
    .forEach((r: any) => console.log(`  ${r.label}: ${(r.score * 100).toFixed(2)}%`));
  
  console.log('\n风景相关标签:');
  results.filter((r: any) => ['sea','ocean','mountain','landscape','海','海洋','山','风景','自然'].includes(r.label))
    .forEach((r: any) => console.log(`  ${r.label}: ${(r.score * 100).toFixed(2)}%`));
  
  console.log('\n总结:');
  const personScore = results.filter((r: any) => ['person','human','face','portrait','headshot'].includes(r.label))
    .reduce((sum: number, r: any) => sum + r.score, 0) / 5 * 100;
  const landscapeScore = results.filter((r: any) => ['sea','ocean','mountain','landscape'].includes(r.label))
    .reduce((sum: number, r: any) => sum + r.score, 0) / 4 * 100;
  
  console.log(`  人物标签平均: ${personScore.toFixed(2)}%`);
  console.log(`  风景标签平均: ${landscapeScore.toFixed(2)}%`);
  
  process.exit(0);
}

analyze();
