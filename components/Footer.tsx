import Link from 'next/link';
import { Camera, Twitter, Instagram, Github, Mail } from 'lucide-react';

export function Footer() {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    about: {
      title: '关于',
      links: [
        { label: '关于我们', href: '/about' },
        { label: '我们的故事', href: '/story' },
        { label: '加入团队', href: '/careers' },
        { label: '联系我们', href: '/contact' },
      ],
    },
    links: {
      title: '链接',
      links: [
        { label: '浏览图片', href: '/search' },
        { label: '热门标签', href: '/tags' },
        { label: '精选摄影师', href: '/photographers' },
        { label: '上传作品', href: '/upload' },
      ],
    },
    legal: {
      title: '法律信息',
      links: [
        { label: '使用条款', href: '/terms' },
        { label: '隐私政策', href: '/privacy' },
        { label: '许可协议', href: '/license' },
        { label: 'Cookie 政策', href: '/cookies' },
      ],
    },
  };

  const socialLinks = [
    { icon: Twitter, href: '#', label: 'Twitter' },
    { icon: Instagram, href: '#', label: 'Instagram' },
    { icon: Github, href: '#', label: 'GitHub' },
    { icon: Mail, href: '#', label: 'Email' },
  ];

  return (
    <footer className="w-full border-t border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950">
      <div className="mx-auto max-w-[1600px] px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4 lg:gap-12">
          {/* Brand Column */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-70">
              <Camera className="h-6 w-6 text-neutral-600 dark:text-neutral-400" />
              <span className="text-lg font-semibold text-neutral-900 dark:text-white">
                FreePic
              </span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
              发现数百万张免费的高质量图片，由全球才华横溢的摄影师分享。
            </p>
            {/* Social Links */}
            <div className="mt-6 flex items-center gap-4">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100 text-neutral-600 transition-colors hover:bg-neutral-200 hover:text-neutral-900 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700 dark:hover:text-white"
                >
                  <social.icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>

          {/* About Links */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-neutral-900 dark:text-white">
              {footerLinks.about.title}
            </h3>
            <ul className="mt-4 space-y-3">
              {footerLinks.about.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-neutral-600 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Links Column */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-neutral-900 dark:text-white">
              {footerLinks.links.title}
            </h3>
            <ul className="mt-4 space-y-3">
              {footerLinks.links.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-neutral-600 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-neutral-900 dark:text-white">
              {footerLinks.legal.title}
            </h3>
            <ul className="mt-4 space-y-3">
              {footerLinks.legal.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-neutral-600 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-neutral-200 pt-8 dark:border-neutral-800 sm:flex-row">
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            &copy; {currentYear} FreePic. 保留所有权利。
          </p>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">用 ❤️ 为全球创作者打造</p>
        </div>
      </div>
    </footer>
  );
}
