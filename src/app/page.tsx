// 🔧 修改 - 根路径改为 Landing Page（原为 redirect('/dashboard')）
// 未登录用户看到产品首页，已登录用户通过 /login 自动跳转

import Link from 'next/link'
import {
  BrainCircuit,
  FileSearch,
  Sparkles,
  CalendarCheck,
  PieChart,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  BarChart3,
  Trophy,
  Wand2,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ── 功能卡片数据 ──────────────────────────────────────────────────────────────
const features = [
  {
    icon: FileSearch,
    title: 'JD 智能解析',
    desc: '截图上传即可提取岗位名称、公司、职责与要求，告别手动复制。',
    tag: 'OCR + LLM',
  },
  {
    icon: BrainCircuit,
    title: '语义匹配分析',
    desc: '将 JD 与你的简历逐项对比，输出匹配评分、能力差距与提升方向。',
    tag: 'AI 分析',
  },
  {
    icon: Sparkles,
    title: '投递策略建议',
    desc: '根据匹配结果告诉你：该投哪份简历、关键词如何补强、胜算几何。',
    tag: '决策支持',
  },
  {
    icon: FileSearch,
    title: '简历智能优化',
    desc: '针对指定岗位重写简历表达，对齐关键词，提升命中率。',
    tag: '自动生成',
  },
  {
    icon: CalendarCheck,
    title: '面试全程记录',
    desc: '记录每轮面试题目、面试官、结果与复盘总结，形成成长档案。',
    tag: '过程管理',
  },
  {
    icon: PieChart,
    title: '求职数据统计',
    desc: '投递漏斗、渠道分布、约面率一览，让你的求职策略有据可依。',
    tag: '数据洞察',
  },
]

// ── How it works 步骤 ─────────────────────────────────────────────────────────
const steps = [
  {
    num: '01',
    title: '添加岗位',
    desc: '截图或粘贴 JD，AI 自动解析公司、职位与要求，30秒完成录入。',
  },
  {
    num: '02',
    title: 'AI 分析匹配',
    desc: '上传你的简历版本，系统自动评分并推荐最优简历。',
  },
  {
    num: '03',
    title: '获得投递建议',
    desc: '清晰的投递策略 + 优化后的简历文本，提升每一次投递的成功率。',
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900">

      {/* ── Navbar ────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-gray-900 rounded-lg flex items-center justify-center">
              <span className="text-white text-xs font-bold">OF</span>
            </div>
            <span className="text-sm font-semibold text-gray-900">OfferFlow</span>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-sm text-gray-500">
            <a href="#features" className="hover:text-gray-900 transition-colors">功能</a>
            <a href="#ai-guide" className="hover:text-gray-900 transition-colors">AI 功能</a>
            <a href="#how-it-works" className="hover:text-gray-900 transition-colors">使用流程</a>
          </nav>

          <Link
            href="/login"
            className="flex items-center gap-1.5 text-sm font-medium text-gray-900 border border-gray-200 rounded-lg px-4 py-1.5 hover:bg-gray-50 transition-colors"
          >
            登录
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className="pt-24 pb-20 px-6 text-center">
        <div className="max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-600 text-xs font-medium px-3 py-1 rounded-full mb-6">
            <BrainCircuit className="w-3.5 h-3.5" />
            AI-Powered Job Decision Engine
          </div>

          <h1 className="text-5xl font-bold text-gray-900 tracking-tight leading-[1.15] mb-5">
            让每一次投递，<br />
            都更有数、更高效，也更从容
          </h1>

          <p className="text-lg text-gray-500 leading-relaxed mb-8 max-w-xl mx-auto">
            OfferFlow 会帮你看懂岗位、挑对简历，并基于 JD 优化表达，
            <br className="hidden md:block" />
            让投递过程清晰有序。
          </p>

          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium text-white bg-gray-900 rounded-xl hover:bg-gray-700 transition-colors"
            >
              立即开始
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="#features"
              className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
            >
              查看功能
            </a>
          </div>
        </div>
      </section>

      {/* ── 特性横条 ──────────────────────────────────────────────────── */}
      <section className="border-y border-gray-100 bg-gray-50/50 py-5">
        <div className="max-w-4xl mx-auto px-6 flex items-center justify-center gap-8 flex-wrap text-sm text-gray-400">
          {['⚡ OCR 自动识别 JD', '🧠 DeepSeek LLM 驱动', '📊 匹配评分可视化', '🔒 数据本地存储'].map((item) => (
            <span key={item} className="whitespace-nowrap">{item}</span>
          ))}
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────────────────── */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">不只是记录，更是决策</h2>
            <p className="text-gray-500 text-base max-w-xl mx-auto">
              每一个功能模块都在帮你回答同一个问题：这次要不要投，投哪份简历？
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map(({ icon: Icon, title, desc, tag }) => (
              <div
                key={title}
                className="group bg-white border border-gray-200 rounded-2xl p-6 hover:border-gray-300 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center group-hover:bg-gray-900 transition-colors duration-200">
                    <Icon className="w-5 h-5 text-gray-600 group-hover:text-white transition-colors duration-200" />
                  </div>
                  <span className="text-[10px] font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                    {tag}
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-gray-900 mb-1.5">{title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── AI 功能引导 ─────────────────────────────────────────────── */}
      <section id="ai-guide" className="py-20 px-6 border-t border-gray-100">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-1.5 bg-violet-50 text-violet-600 text-xs font-medium px-3 py-1 rounded-full mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              AI 核心功能
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              三大 AI 能力，藏在每个岗位里
            </h2>
            <p className="text-gray-500 text-base max-w-xl mx-auto">
              进入「岗位管理」页面，点击任意岗位展开详情，即可使用以下 AI 功能
            </p>
          </div>

          <div className="bg-gray-50 rounded-2xl p-6 md:p-8 mb-8">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="w-6 h-6 bg-gray-900 text-white rounded-md flex items-center justify-center text-xs font-bold shrink-0">1</span>
                进入「岗位管理」
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300 hidden md:block" />
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="w-6 h-6 bg-gray-900 text-white rounded-md flex items-center justify-center text-xs font-bold shrink-0">2</span>
                点击岗位行展开详情
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300 hidden md:block" />
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="w-6 h-6 bg-gray-900 text-white rounded-md flex items-center justify-center text-xs font-bold shrink-0">3</span>
                选择下方 AI 功能按钮
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              {
                icon: Sparkles,
                title: 'AI 匹配分析',
                desc: '将岗位 JD 与你的简历逐项对比，输出匹配评分（0-100）、能力差距与投递策略。',
                color: 'text-violet-600',
                bg: 'bg-violet-50',
              },
              {
                icon: Trophy,
                title: '自动选最优简历',
                desc: '多份简历不知道投哪份？AI 自动排序打分，推荐最匹配该岗位的简历版本。',
                color: 'text-amber-600',
                bg: 'bg-amber-50',
              },
              {
                icon: Wand2,
                title: '一键优化简历',
                desc: '针对目标岗位的关键词和要求，自动重写简历表达，提升 ATS 通过率。',
                color: 'text-emerald-600',
                bg: 'bg-emerald-50',
              },
            ].map(({ icon: Icon, title, desc, color, bg }) => (
              <div key={title} className="bg-white border border-gray-200 rounded-2xl p-6 hover:border-gray-300 hover:shadow-md transition-all duration-200">
                <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center mb-4', bg)}>
                  <Icon className={cn('w-5 h-5', color)} />
                </div>
                <h3 className="text-sm font-semibold text-gray-900 mb-1.5">{title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it Works ──────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-20 px-6 bg-gray-50/50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">三步完成一次智能投递</h2>
            <p className="text-gray-500 text-base">从添加岗位到获得建议，全程 AI 辅助</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {steps.map(({ num, title, desc }, idx) => (
              <div key={num} className="relative">
                {idx < steps.length - 1 && (
                  <div className="hidden md:block absolute top-6 left-[calc(100%_-_16px)] w-8 h-px bg-gray-200 z-10" />
                )}
                <div className="bg-white border border-gray-200 rounded-2xl p-6 h-full">
                  <div className="w-10 h-10 bg-gray-900 text-white rounded-xl flex items-center justify-center text-sm font-bold mb-4">
                    {num}
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">{title}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ────────────────────────────────────────────────── */}
      <section className="py-20 px-6 bg-gray-900">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            准备好拿下下一个 Offer 了吗？
          </h2>
          <p className="text-gray-400 text-base mb-8">
            用 AI 替你分析、替你决策，每次投递都不再靠运气。
          </p>
          <div className="flex items-center justify-center gap-6 flex-wrap text-sm text-gray-400 mb-8">
            {['免费使用', '数据本地存储', '无需注册'].map((item) => (
              <span key={item} className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-gray-500" />
                {item}
              </span>
            ))}
          </div>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-8 py-3 text-sm font-medium text-gray-900 bg-white rounded-xl hover:bg-gray-100 transition-colors"
          >
            立即开始使用
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────── */}
      <footer className="border-t border-gray-800 bg-gray-900 py-6 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-gray-700 rounded flex items-center justify-center">
              <span className="text-white text-[9px] font-bold">OF</span>
            </div>
            <span className="text-sm text-gray-400">OfferFlow</span>
          </div>
          <p className="text-xs text-gray-600">
            © 2025 OfferFlow · AI-Powered Job Decision Engine · v0.1.0
          </p>
        </div>
      </footer>

    </div>
  )
}
