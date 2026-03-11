import type { Metadata } from 'next';
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  Shield,
  Users,
  ExternalLink,
} from 'lucide-react';

export const metadata: Metadata = {
  title: '使用许可 - FreePic',
  description: '了解 FreePic 免版权图片的使用许可和条款',
};

export default function LicensePage() {
  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-950 py-16 sm:py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
            使用许可说明
          </h1>
          <p className="text-lg text-neutral-300 max-w-2xl mx-auto">
            FreePic 上的所有图片都可以免费使用，无需征得许可或注明摄影师
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        {/* License Type */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/30">
              <FileText className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">许可协议</h2>
          </div>
          <div className="prose prose-neutral dark:prose-invert max-w-none">
            <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
              FreePic 上的所有图片均采用{' '}
              <a
                href="https://creativecommons.org/publicdomain/zero/1.0/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 inline-flex items-center gap-1"
              >
                CC0 1.0 通用 (CC0 1.0) 公共领域贡献
                <ExternalLink className="h-3 w-3" />
              </a>{' '}
              许可协议。
            </p>
            <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed mt-4">
              这意味着您可以自由地：
            </p>
          </div>
        </section>

        {/* Allowed Uses */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">允许的使用方式</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              '个人和商业项目',
              '网站、博客和社交媒体',
              '印刷品（海报、传单、书籍等）',
              '应用程序和软件界面',
              '广告和营销材料',
              '视频、演示文稿和播客',
              '编辑用途（新闻、教育）',
              '艺术创作和二次创作',
            ].map((item, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-4 rounded-lg bg-green-50 dark:bg-green-900/10"
              >
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                <span className="text-neutral-700 dark:text-neutral-300">{item}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Prohibited Uses */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
              <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">禁止的使用方式</h2>
          </div>
          <div className="space-y-4">
            {[
              {
                title: '非法用途',
                desc: '不得将图片用于任何违法、欺诈、诽谤、骚扰或歧视性的目的。',
              },
              {
                title: '销售未经修改的图片',
                desc: '不得直接销售或重新分发原始图片文件（如作为库存图片销售）。',
              },
              {
                title: '侵犯隐私',
                desc: '不得使用包含可识别人物的图片用于敏感或令人反感的内容，除非获得相关人员的明确同意。',
              },
              {
                title: '商标侵权',
                desc: '不得使用图片中的商标、品牌标识或特定产品进行误导性背书或虚假宣传。',
              },
            ].map((item, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-4 rounded-lg bg-red-50 dark:bg-red-900/10"
              >
                <XCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-neutral-900 dark:text-white">{item.title}</h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Attribution */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
              <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">署名要求</h2>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/10 rounded-lg p-6">
            <p className="text-neutral-700 dark:text-neutral-300 mb-4">
              <strong className="text-neutral-900 dark:text-white">
                署名是可选的，但我们非常感激！
              </strong>
            </p>
            <p className="text-neutral-600 dark:text-neutral-400 mb-4">
              虽然 CC0 许可不要求署名，但如果您选择注明摄影师，可以采用以下格式：
            </p>
            <div className="bg-white dark:bg-neutral-800 rounded-lg p-4 font-mono text-sm text-neutral-600 dark:text-neutral-400">
              照片由 [摄影师姓名] 提供，来自 FreePic
            </div>
            <p className="text-neutral-600 dark:text-neutral-400 mt-4 text-sm">
              您也可以链接回 FreePic 或图片页面，帮助更多人发现优质免费图片。
            </p>
          </div>
        </section>

        {/* Disclaimer */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
              <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">免责声明</h2>
          </div>
          <div className="space-y-4 text-neutral-600 dark:text-neutral-400">
            <p>FreePic 尽最大努力确保平台上的所有图片都符合 CC0 许可要求。然而：</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>我们无法保证图片中所有元素（如商标、艺术品、建筑）的版权状态</li>
              <li>如果图片包含可识别人物，您应该确保获得了必要的肖像权使用许可</li>
              <li>某些图片可能包含商标或品牌标识，使用时请遵守相关法律法规</li>
              <li>对于因使用图片而产生的任何法律纠纷，FreePic 不承担任何责任</li>
            </ul>
          </div>
        </section>

        {/* Model Release */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/30">
              <Shield className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">肖像权说明</h2>
          </div>
          <div className="bg-purple-50 dark:bg-purple-900/10 rounded-lg p-6">
            <p className="text-neutral-700 dark:text-neutral-300 mb-4">
              关于包含人物的图片，请注意以下事项：
            </p>
            <ul className="space-y-3 text-neutral-600 dark:text-neutral-400">
              <li className="flex items-start gap-2">
                <span className="text-purple-600 dark:text-purple-400 mt-1">•</span>
                <span>FreePic 不保证所有包含人物的图片都获得了肖像权使用许可</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-600 dark:text-purple-400 mt-1">•</span>
                <span>如果将人物图片用于商业目的或敏感场景，建议获得模特的书面同意</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-600 dark:text-purple-400 mt-1">•</span>
                <span>不得将人物图片用于可能令人反感或具有诽谤性的场景</span>
              </li>
            </ul>
          </div>
        </section>

        {/* Contact */}
        <section className="text-center py-8 border-t border-neutral-200 dark:border-neutral-800">
          <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-4">有疑问？</h2>
          <p className="text-neutral-600 dark:text-neutral-400 mb-6">
            如果您对使用许可有任何疑问，或者发现某张图片违反了我们的使用条款，请联系我们。
          </p>
          <a
            href="/contact"
            className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
          >
            联系我们
          </a>
        </section>
      </div>
    </div>
  );
}
