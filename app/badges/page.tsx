// Badge Showcase Page
'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Card, CardContent, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'

const JOB_CATEGORIES = [
  { value: 'digital_design', label: 'Digital Design' },
  { value: 'programming', label: 'Programming' },
  { value: 'writing', label: 'Writing' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'manual_labor', label: 'Manual Labor' },
  { value: 'tutoring', label: 'Tutoring' },
  { value: 'gardening', label: 'Gardening' },
  { value: 'carpentry', label: 'Carpentry' },
  { value: 'other', label: 'Other' },
]

interface Badge {
  id: string
  title: string
  description: string
  svg: string
  created_at: string
  job_id: string
  category?: string // optional for filtering
  location?: string // optional for filtering
}

interface UserBadge {
  id: string
  badge_id: string
  acquisition_number: number
  acquired_at: string
  badge: Badge
}

export default function BadgeShowcasePage() {
  const [badges, setBadges] = useState<UserBadge[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedBadge, setSelectedBadge] = useState<UserBadge | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [locationFilter, setLocationFilter] = useState('')
  const [dateFilter, setDateFilter] = useState('') // yyyy-mm
  const supabase = createClientComponentClient()
  const router = useRouter()

  useEffect(() => {
    fetchBadges()
  }, [])

  async function fetchBadges() {
    setLoading(true)
    setError(null)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      setError('Not logged in')
      setLoading(false)
      return
    }
    const { data, error } = await supabase
      .from('user_badges')
      .select('id, badge_id, acquisition_number, acquired_at, badge:badges(id, title, description, svg, created_at, job_id, category, location)')
      .eq('user_id', session.user.id)
      .order('acquired_at', { ascending: false })
    if (error) {
      setError('Error fetching badges: ' + error.message)
      setLoading(false)
      return
    }
    // Fix: badge is returned as an array, but we want a single object
    const fixedBadges = (data as any[]).map((ub) => ({
      ...ub,
      badge: Array.isArray(ub.badge) ? ub.badge[0] : ub.badge
    }))
    setBadges(fixedBadges)
    setLoading(false)
  }

  // Get unique categories from badges for the filter
  const badgeCategories = Array.from(
    new Set(badges.map(b => b.badge.category).filter(Boolean))
  )
  .map(cat => {
    const found = JOB_CATEGORIES.find(jc => jc.value === cat)
    return found ? found : { value: cat, label: cat }
  })

  // Filtering logic
  const filteredBadges = badges.filter((userBadge) => {
    const badge = userBadge.badge
    // Category filter
    if (selectedCategory !== 'all' && badge.category !== selectedCategory) return false
    // Location filter (case-insensitive substring)
    if (locationFilter && (!badge.location || !badge.location.toLowerCase().includes(locationFilter.toLowerCase()))) return false
    // Date filter (yyyy-mm)
    if (dateFilter) {
      const acquired = userBadge.acquired_at.slice(0, 7)
      if (acquired !== dateFilter) return false
    }
    return true
  })

  // Helper: get all unique yyyy-mm from badges for date filter
  const dateOptions = Array.from(new Set(badges.map(b => b.acquired_at.slice(0, 7)))).sort().reverse()

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-8">My Badges</h1>
      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-8 items-end">
        <div>
          <label className="block text-sm mb-1">Type</label>
          <select
            className="border rounded px-2 py-1"
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
          >
            <option value="all">All</option>
            {badgeCategories.map(cat => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm mb-1">Location</label>
          <Input
            placeholder="Location..."
            value={locationFilter}
            onChange={e => setLocationFilter(e.target.value)}
            className="w-40"
          />
        </div>
        <div>
          <label className="block text-sm mb-1">Date</label>
          <select
            className="border rounded px-2 py-1"
            value={dateFilter}
            onChange={e => setDateFilter(e.target.value)}
          >
            <option value="">All</option>
            {dateOptions.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
      </div>
      {error && <div className="mb-4 text-red-500">{error}</div>}
      {loading ? (
        <div>Loading...</div>
      ) : filteredBadges.length === 0 ? (
        <div className="text-muted-foreground">No badges match your filters.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredBadges.map((userBadge) => (
            <Card
              key={userBadge.id}
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => setSelectedBadge(userBadge)}
            >
              <CardContent className="flex flex-col items-center py-6">
                <div
                  className="w-20 h-20 mb-4"
                  dangerouslySetInnerHTML={{ __html: userBadge.badge.svg }}
                />
                <CardTitle className="text-center text-lg mb-2">{userBadge.badge.title}</CardTitle>
                <CardDescription className="text-center mb-2">Acquisition #{userBadge.acquisition_number}</CardDescription>
                <span className="text-xs text-muted-foreground">{new Date(userBadge.acquired_at).toLocaleDateString()}</span>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      {/* Badge Details Modal */}
      {selectedBadge && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-8 relative text-gray-900">
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-2xl font-bold"
              onClick={() => setSelectedBadge(null)}
              aria-label="Close"
            >
              ×
            </button>
            <div className="flex flex-col items-center">
              <div
                className="w-28 h-28 mb-6"
                dangerouslySetInnerHTML={{ __html: selectedBadge.badge.svg }}
              />
              <h2 className="text-2xl font-extrabold mb-2 text-center text-gray-900">
                {selectedBadge.badge.title}
              </h2>
              <p className="mb-4 text-center text-base text-gray-700">
                {selectedBadge.badge.description}
              </p>
              <div className="text-base font-medium text-gray-800 mb-1">
                Acquisition #{selectedBadge.acquisition_number}
              </div>
              <div className="text-xs text-gray-500">
                Acquired: {new Date(selectedBadge.acquired_at).toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
