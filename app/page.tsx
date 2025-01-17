import { Suspense } from 'react'
import { HomeContent } from '@/components/home-content'

export default function Home() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center">
        <div className="animate-pulse">Loading...</div>
      </div>
    }>
      <HomeContent />
    </Suspense>
  )
}

