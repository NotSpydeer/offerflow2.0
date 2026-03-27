'use client'

// 简历管理页面
// 支持：上传PDF/DOCX、标签管理、关联岗位查看、下载和删除

import { useState, useEffect } from 'react'
import { Upload, FileText, Trash2, Download, Tag, Loader2, Plus, X } from 'lucide-react'
import { formatDate, formatFileSize, cn } from '@/lib/utils'
import type { Resume } from '@/types'

interface ResumeWithCount extends Resume {
  _count?: { applications: number }
}

export default function ResumesPage() {
  const [resumes, setResumes] = useState<ResumeWithCount[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [showUploadForm, setShowUploadForm] = useState(false)

  // 上传表单状态
  const [uploadName, setUploadName] = useState('')
  const [uploadTags, setUploadTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  useEffect(() => {
    fetchResumes()
  }, [])

  const fetchResumes = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/resumes')
      if (res.ok) {
        const data = await res.json()
        setResumes(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error('Failed to fetch resumes:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setSelectedFile(file)
    // 自动填入文件名作为简历名
    if (!uploadName) {
      setUploadName(file.name.replace(/\.(pdf|docx|doc)$/i, ''))
    }
  }

  const addTag = () => {
    const tag = tagInput.trim()
    if (tag && !uploadTags.includes(tag)) {
      setUploadTags((prev) => [...prev, tag])
      setTagInput('')
    }
  }

  const removeTag = (tag: string) => {
    setUploadTags((prev) => prev.filter((t) => t !== tag))
  }

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFile || !uploadName.trim()) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('name', uploadName.trim())
      formData.append('tags', JSON.stringify(uploadTags))

      const res = await fetch('/api/resumes', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || '上传失败')
      }

      // 重置表单
      setShowUploadForm(false)
      setSelectedFile(null)
      setUploadName('')
      setUploadTags([])
      setTagInput('')
      fetchResumes()
    } catch (error) {
      console.error('Upload error:', error)
      alert(error instanceof Error ? error.message : '上传失败')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确认删除该简历？关联的岗位将解除关联。')) return

    const res = await fetch(`/api/resumes/${id}`, { method: 'DELETE' })
    if (res.ok) fetchResumes()
  }

  // 解析tags
  const parseTags = (tagsStr: string): string[] => {
    try {
      const parsed = JSON.parse(tagsStr)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }

  // 文件类型图标
  const FileIcon = ({ mimetype }: { mimetype: string }) => {
    const isPdf = mimetype === 'application/pdf'
    return (
      <div className={cn(
        'w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold',
        isPdf ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'
      )}>
        {isPdf ? 'PDF' : 'DOC'}
      </div>
    )
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* 顶部工具栏 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-xs text-gray-400 mt-0.5">共 {resumes.length} 份简历</p>
        </div>
        <button
          onClick={() => setShowUploadForm(true)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-700 transition-colors"
        >
          <Upload className="w-4 h-4" />
          上传简历
        </button>
      </div>

      {/* 上传表单弹窗 */}
      {showUploadForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setShowUploadForm(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-900">上传简历</h2>
              <button
                onClick={() => setShowUploadForm(false)}
                className="w-7 h-7 flex items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpload} className="px-6 py-5 space-y-4">
              {/* 文件选择区域 */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">
                  选择文件 <span className="text-red-500">*</span>
                </label>
                <label className="block cursor-pointer">
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                  <div className={cn(
                    'border-2 border-dashed rounded-xl p-6 text-center transition-colors',
                    selectedFile
                      ? 'border-gray-300 bg-gray-50'
                      : 'border-gray-200 hover:border-gray-300'
                  )}>
                    {selectedFile ? (
                      <div className="flex items-center gap-3">
                        <FileText className="w-8 h-8 text-gray-400" />
                        <div className="text-left">
                          <p className="text-sm font-medium text-gray-700">{selectedFile.name}</p>
                          <p className="text-xs text-gray-400">{formatFileSize(selectedFile.size)}</p>
                        </div>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">点击选择 PDF 或 DOCX 文件</p>
                        <p className="text-xs text-gray-400 mt-1">最大 10MB</p>
                      </>
                    )}
                  </div>
                </label>
              </div>

              {/* 简历名称 */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">
                  简历名称 <span className="text-red-500">*</span>
                </label>
                <input
                  value={uploadName}
                  onChange={(e) => setUploadName(e.target.value)}
                  placeholder="如：产品经理版、AI方向版"
                  required
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 bg-gray-50/50"
                />
              </div>

              {/* 标签 */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">
                  标签（可选）
                </label>
                <div className="flex gap-2">
                  <input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    placeholder="输入标签后回车"
                    className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 bg-gray-50/50"
                  />
                  <button
                    type="button"
                    onClick={addTag}
                    className="px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                {uploadTags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {uploadTags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowUploadForm(false)}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={uploading || !selectedFile || !uploadName.trim()}
                  className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {uploading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {uploading ? '上传中...' : '确认上传'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 简历列表 */}
      {loading ? (
        <div className="grid grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-xl p-5 animate-pulse">
              <div className="h-10 bg-gray-100 rounded-lg mb-3" />
              <div className="h-4 bg-gray-100 rounded w-3/4 mb-2" />
              <div className="h-3 bg-gray-100 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : resumes.length === 0 ? (
        <div className="text-center py-20">
          <FileText className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-sm text-gray-400 mb-1">暂无简历</p>
          <p className="text-xs text-gray-300">点击「上传简历」添加你的第一份简历</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {resumes.map((resume) => {
            const tags = parseTags(resume.tags)
            return (
              <div
                key={resume.id}
                className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-sm hover:border-gray-300 transition-all group"
              >
                {/* 文件类型图标 + 名称 */}
                <div className="flex items-start gap-3 mb-3">
                  <FileIcon mimetype={resume.mimetype} />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-gray-900 truncate">{resume.name}</h3>
                    <p className="text-xs text-gray-400 truncate mt-0.5">{resume.filename}</p>
                  </div>
                </div>

                {/* 标签 */}
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-xs"
                      >
                        <Tag className="w-2.5 h-2.5" />
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* 元数据 */}
                <div className="flex items-center justify-between text-xs text-gray-400 mb-3">
                  <span>{formatFileSize(resume.filesize)}</span>
                  <span>{formatDate(resume.createdAt)}</span>
                </div>

                {/* 关联岗位数 */}
                <div className="text-xs text-gray-400 mb-4">
                  关联 <span className="font-medium text-gray-600">{resume._count?.applications || 0}</span> 个岗位
                </div>

                {/* 操作按钮 */}
                <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                  <a
                    href={resume.filepath}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    下载
                  </a>
                  <button
                    onClick={() => handleDelete(resume.id)}
                    className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs text-red-500 border border-red-100 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    删除
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
