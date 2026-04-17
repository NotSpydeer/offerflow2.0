// TypeScript 类型定义

// 岗位投递记录
export interface Application {
  id: string
  company: string
  position: string
  channel: string
  department?: string | null
  appliedDate: string
  status: string
  jdText?: string | null
  jdRequire?: string | null
  jdDesc?: string | null
  notes?: string | null
  resumeId?: string | null
  resume?: Resume | null
  interviews?: Interview[]
  createdAt: string
  updatedAt: string
}

// 简历版本
export interface Resume {
  id: string
  name: string
  filename: string
  filepath: string
  filesize: number
  mimetype: string
  tags: string // JSON 字符串
  applications?: Application[]
  createdAt: string
  updatedAt: string
}

// 面试记录
export interface Interview {
  id: string
  applicationId: string
  application?: Application
  round: string
  scheduledAt: string
  interviewer?: string | null
  location?: string | null
  questions?: string | null
  reflection?: string | null
  result?: string | null
  createdAt: string
  updatedAt: string
}

// 统计数据
export interface Stats {
  total: number           // 总投递数
  interviewInvited: number    // 约面数
  interviewInvitedRate: number // 约面率
  interviewing: number    // 面试数
  interviewRate: number   // 面试率
  offerCount: number      // Offer数
  offerRate: number       // Offer率
  statusDistribution: { status: string; count: number }[]
  channelDistribution: { channel: string; count: number }[]
  recentApplications: Application[]
}

// 新建/编辑岗位表单数据
export interface ApplicationFormData {
  company: string
  position: string
  channel: string
  department?: string
  appliedDate: string
  status: string
  jdText?: string
  jdRequire?: string
  jdDesc?: string
  notes?: string
  resumeId?: string
}

// 新建/编辑面试表单数据
export interface InterviewFormData {
  applicationId: string
  round: string
  scheduledAt: string
  interviewer?: string
  location?: string
  questions?: string
  reflection?: string
  result?: string
}

// OCR 识别结果
export interface OcrResult {
  rawText: string
  company?: string
  position?: string
  requirements?: string
  description?: string
}
