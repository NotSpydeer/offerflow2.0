import { redirect } from 'next/navigation'

// 根路径重定向到 Dashboard
export default function Home() {
  redirect('/dashboard')
}
