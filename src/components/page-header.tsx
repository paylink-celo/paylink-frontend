import { useRouter } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'

export function PageHeader({ title }: { title: string }) {
  const router = useRouter()
  return (
    <div className="create-header">
      <button
        type="button"
        aria-label="Back"
        className="back-btn"
        onClick={() => router.history.back()}
      >
        <ArrowLeft size={18} />
      </button>
      <h1 className="create-title">{title}</h1>
    </div>
  )
}
