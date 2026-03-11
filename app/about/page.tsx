export const dynamic = 'force-dynamic';

import Link from 'next/link';
import {
  Camera,
  Heart,
  Globe,
  Mail,
  MapPin,
  Phone,
  Github,
  Twitter,
  Instagram,
} from 'lucide-react';

export const metadata = {
  title: '关于我们 - FreePic',
  description: '了解 FreePic 的故事、团队和使命',
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 text-white py-20 lg:py-32">
        <div className="absolute inset-0 opacity-20">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
            关于 <span className="text-indigo-400">FreePic</span>
          </h1>
          <p className="text-xl text-neutral-300 max-w-3xl mx-auto">
            我们相信，美好的视觉内容应该人人可及。FreePic
            致力于为全球创作者提供免费、高质量的无版权图片资源。
          </p>
        </div>
      </section>

      {/* About Us Section */}
      <section className="py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div>
              <h2 className="text-3xl font-bold text-neutral-900 mb-6">关于我们</h2>
              <div className="space-y-4 text-neutral-600">
                <p>
                  FreePic 成立于 2024
                  年，是一个由摄影爱好者和技术开发者共同打造的开放图片平台。我们的使命是打破视觉内容的获取壁垒，让每个人都能免费使用高质量的图片资源。
                </p>
                <p>
                  在
                  FreePic，我们相信共享的力量。每一位上传作品的摄影师，都在为全球创意社区贡献宝贵的视觉资产。无论是个人博客、商业项目还是教育用途，FreePic
                  都能满足您的需求。
                </p>
                <p>
                  截至目前，我们的平台已收录超过 9 万张精选图片，拥有来自 50 多个国家的 5000
                  多位贡献者，每月服务超过 100 万访问者。
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-indigo-50 rounded-2xl p-6 text-center">
                <div className="text-4xl font-bold text-indigo-600 mb-2">9万+</div>
                <div className="text-neutral-600">精选图片</div>
              </div>
              <div className="bg-purple-50 rounded-2xl p-6 text-center">
                <div className="text-4xl font-bold text-purple-600 mb-2">5000+</div>
                <div className="text-neutral-600">贡献摄影师</div>
              </div>
              <div className="bg-pink-50 rounded-2xl p-6 text-center">
                <div className="text-4xl font-bold text-pink-600 mb-2">50+</div>
                <div className="text-neutral-600">覆盖国家</div>
              </div>
              <div className="bg-orange-50 rounded-2xl p-6 text-center">
                <div className="text-4xl font-bold text-orange-600 mb-2">100万+</div>
                <div className="text-neutral-600">月访问量</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Story Section */}
      <section className="py-16 lg:py-24 bg-neutral-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-neutral-900 mb-4">我们的故事</h2>
            <p className="text-neutral-600 max-w-2xl mx-auto">
              从一个小小的想法到全球化的平台，FreePic 的成长离不开每一位用户的支持
            </p>
          </div>

          <div className="relative">
            {/* Timeline */}
            <div className="hidden lg:block absolute left-1/2 transform -translate-x-1/2 h-full w-0.5 bg-neutral-200" />

            <div className="space-y-12">
              {/* 2024 */}
              <div className="relative flex flex-col lg:flex-row items-center">
                <div className="lg:w-1/2 lg:pr-12 lg:text-right mb-4 lg:mb-0">
                  <div className="bg-white rounded-2xl p-6 shadow-sm">
                    <div className="text-indigo-600 font-bold text-lg mb-2">2024年3月</div>
                    <h3 className="text-xl font-semibold text-neutral-900 mb-2">平台正式上线</h3>
                    <p className="text-neutral-600">
                      FreePic
                      经过6个月的开发，正式上线运营。首批收录了来自创始团队和社区志愿者的1000张精选图片。
                    </p>
                  </div>
                </div>
                <div className="hidden lg:flex w-12 h-12 bg-indigo-600 rounded-full items-center justify-center text-white font-bold z-10">
                  1
                </div>
                <div className="lg:w-1/2 lg:pl-12" />
              </div>

              {/* 里程碑2 */}
              <div className="relative flex flex-col lg:flex-row items-center">
                <div className="lg:w-1/2 lg:pr-12" />
                <div className="hidden lg:flex w-12 h-12 bg-purple-600 rounded-full items-center justify-center text-white font-bold z-10">
                  2
                </div>
                <div className="lg:w-1/2 lg:pl-12 mt-4 lg:mt-0">
                  <div className="bg-white rounded-2xl p-6 shadow-sm">
                    <div className="text-purple-600 font-bold text-lg mb-2">2024年6月</div>
                    <h3 className="text-xl font-semibold text-neutral-900 mb-2">突破1万用户</h3>
                    <p className="text-neutral-600">
                      平台用户数量突破1万，图片库扩充至5000张。我们开始与多家设计学院建立合作关系。
                    </p>
                  </div>
                </div>
              </div>

              {/* 里程碑3 */}
              <div className="relative flex flex-col lg:flex-row items-center">
                <div className="lg:w-1/2 lg:pr-12 lg:text-right mb-4 lg:mb-0">
                  <div className="bg-white rounded-2xl p-6 shadow-sm">
                    <div className="text-pink-600 font-bold text-lg mb-2">2024年9月</div>
                    <h3 className="text-xl font-semibold text-neutral-900 mb-2">推出AI搜索功能</h3>
                    <p className="text-neutral-600">
                      引入基于CLIP模型的语义搜索技术，用户可以通过自然语言描述来搜索图片，大幅提升了搜索体验。
                    </p>
                  </div>
                </div>
                <div className="hidden lg:flex w-12 h-12 bg-pink-600 rounded-full items-center justify-center text-white font-bold z-10">
                  3
                </div>
                <div className="lg:w-1/2 lg:pl-12" />
              </div>

              {/* 里程碑4 */}
              <div className="relative flex flex-col lg:flex-row items-center">
                <div className="lg:w-1/2 lg:pr-12" />
                <div className="hidden lg:flex w-12 h-12 bg-orange-600 rounded-full items-center justify-center text-white font-bold z-10">
                  4
                </div>
                <div className="lg:w-1/2 lg:pl-12 mt-4 lg:mt-0">
                  <div className="bg-white rounded-2xl p-6 shadow-sm">
                    <div className="text-orange-600 font-bold text-lg mb-2">2025年1月</div>
                    <h3 className="text-xl font-semibold text-neutral-900 mb-2">成为行业领先</h3>
                    <p className="text-neutral-600">
                      FreePic 已成为亚太地区最大的中文无版权图片平台之一，日均访问量超过3万次。
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Join Team Section */}
      <section className="py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-neutral-900 mb-4">加入团队</h2>
            <p className="text-neutral-600 max-w-2xl mx-auto">
              我们正在寻找充满激情的伙伴，一起打造更好的视觉内容平台
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* 职位1 */}
            <div className="bg-white border border-neutral-200 rounded-2xl p-6 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mb-4">
                <Camera className="w-6 h-6 text-indigo-600" />
              </div>
              <h3 className="text-lg font-semibold text-neutral-900 mb-2">内容运营专员</h3>
              <p className="text-neutral-600 text-sm mb-4">
                负责平台图片内容的审核、分类和质量把控，与摄影师社区保持良好互动。
              </p>
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="px-2 py-1 bg-neutral-100 text-neutral-600 text-xs rounded">
                  全职
                </span>
                <span className="px-2 py-1 bg-neutral-100 text-neutral-600 text-xs rounded">
                  上海
                </span>
              </div>
              <button className="w-full py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium">
                申请职位
              </button>
            </div>

            {/* 职位2 */}
            <div className="bg-white border border-neutral-200 rounded-2xl p-6 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
                <Globe className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-neutral-900 mb-2">前端开发工程师</h3>
              <p className="text-neutral-600 text-sm mb-4">
                负责平台前端架构开发和性能优化，打造极致的用户体验。
              </p>
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="px-2 py-1 bg-neutral-100 text-neutral-600 text-xs rounded">
                  全职
                </span>
                <span className="px-2 py-1 bg-neutral-100 text-neutral-600 text-xs rounded">
                  远程
                </span>
              </div>
              <button className="w-full py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium">
                申请职位
              </button>
            </div>

            {/* 职位3 */}
            <div className="bg-white border border-neutral-200 rounded-2xl p-6 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center mb-4">
                <Heart className="w-6 h-6 text-pink-600" />
              </div>
              <h3 className="text-lg font-semibold text-neutral-900 mb-2">社区运营实习生</h3>
              <p className="text-neutral-600 text-sm mb-4">
                协助维护社区氛围，组织线上活动，帮助新用户熟悉平台。
              </p>
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="px-2 py-1 bg-neutral-100 text-neutral-600 text-xs rounded">
                  实习
                </span>
                <span className="px-2 py-1 bg-neutral-100 text-neutral-600 text-xs rounded">
                  上海
                </span>
              </div>
              <button className="w-full py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors text-sm font-medium">
                申请职位
              </button>
            </div>
          </div>

          <div className="mt-12 text-center">
            <p className="text-neutral-600 mb-4">没有合适的职位？欢迎发送简历到我们的邮箱</p>
            <a
              href="mailto:careers@freepic.com"
              className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium"
            >
              <Mail className="w-4 h-4" />
              careers@freepic.com
            </a>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 lg:py-24 bg-neutral-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">联系我们</h2>
            <p className="text-neutral-400 max-w-2xl mx-auto">
              有任何问题或建议？我们期待听到您的声音
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12">
            {/* 联系信息 */}
            <div className="space-y-8">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Mail className="w-6 h-6 text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-1">电子邮件</h3>
                  <p className="text-neutral-400 mb-2">一般咨询</p>
                  <a
                    href="mailto:hello@freepic.com"
                    className="text-indigo-400 hover:text-indigo-300"
                  >
                    hello@freepic.com
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-1">办公地址</h3>
                  <p className="text-neutral-400">
                    上海市浦东新区张江高科技园区
                    <br />
                    科苑路88号德国中心2号楼506室
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Phone className="w-6 h-6 text-pink-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-1">联系电话</h3>
                  <p className="text-neutral-400">+86 21 5080 1234</p>
                </div>
              </div>

              {/* 社交媒体 */}
              <div className="pt-8 border-t border-white/10">
                <h3 className="text-lg font-semibold mb-4">关注我们</h3>
                <div className="flex gap-4">
                  <a
                    href="#"
                    className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center hover:bg-white/20 transition-colors"
                  >
                    <Twitter className="w-5 h-5" />
                  </a>
                  <a
                    href="#"
                    className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center hover:bg-white/20 transition-colors"
                  >
                    <Instagram className="w-5 h-5" />
                  </a>
                  <a
                    href="#"
                    className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center hover:bg-white/20 transition-colors"
                  >
                    <Github className="w-5 h-5" />
                  </a>
                </div>
              </div>
            </div>

            {/* 联系表单 */}
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8">
              <h3 className="text-xl font-semibold mb-6">发送消息</h3>
              <form className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-2">姓名</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-indigo-500"
                      placeholder="您的姓名"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-2">邮箱</label>
                    <input
                      type="email"
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-indigo-500"
                      placeholder="your@email.com"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">主题</label>
                  <select className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-indigo-500">
                    <option value="" className="bg-neutral-800">
                      请选择主题
                    </option>
                    <option value="general" className="bg-neutral-800">
                      一般咨询
                    </option>
                    <option value="business" className="bg-neutral-800">
                      商务合作
                    </option>
                    <option value="bug" className="bg-neutral-800">
                      问题反馈
                    </option>
                    <option value="other" className="bg-neutral-800">
                      其他
                    </option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    消息内容
                  </label>
                  <textarea
                    rows={4}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-indigo-500 resize-none"
                    placeholder="请输入您的消息..."
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
                >
                  发送消息
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 lg:py-20 bg-indigo-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">准备好开始了吗？</h2>
          <p className="text-indigo-100 mb-8 text-lg">加入 FreePic 社区，探索无限视觉可能</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/search"
              className="px-8 py-3 bg-white text-indigo-600 font-medium rounded-lg hover:bg-neutral-100 transition-colors"
            >
              浏览图片
            </Link>
            <Link
              href="/upload"
              className="px-8 py-3 bg-indigo-700 text-white font-medium rounded-lg hover:bg-indigo-800 transition-colors border border-indigo-500"
            >
              上传作品
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
