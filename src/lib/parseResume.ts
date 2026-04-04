// ✅ 新增 - 统一简历解析工具
// 支持 Vercel Blob URL（生产）和本地磁盘路径（开发）
// 解决 parseResume 在 match/resume-match/resume-optimize 三处重复的问题

/**
 * 解析简历文件，返回纯文本
 * @param filepath Vercel Blob URL（生产）或 /uploads/resumes/xxx.pdf 相对路径（本地开发）
 * @param mimetype 文件 MIME 类型
 */
export async function parseResume(filepath: string, mimetype: string): Promise<string> {
  let buffer: Buffer

  if (filepath.startsWith('http://') || filepath.startsWith('https://')) {
    // 生产环境：从 Vercel Blob URL fetch 文件
    const res = await fetch(filepath)
    if (!res.ok) throw new Error(`fetch resume failed: ${res.status}`)
    buffer = Buffer.from(await res.arrayBuffer())
  } else {
    // 本地开发：从磁盘读取（filepath 相对 public/ 目录）
    const { readFile } = await import('fs/promises')
    const path = await import('path')
    const absPath = path.join(process.cwd(), 'public', filepath)
    buffer = await readFile(absPath)
  }

  if (mimetype === 'application/pdf') {
    const pdfParse = (await import('pdf-parse')) as any
    const result = await pdfParse(buffer)
    return result.text
  }

  if (
    mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    mimetype === 'application/msword'
  ) {
    const mammoth = await import('mammoth')
    const result = await mammoth.extractRawText({ buffer })
    return result.value
  }

  throw new Error(`不支持的简历格式：${mimetype}`)
}
