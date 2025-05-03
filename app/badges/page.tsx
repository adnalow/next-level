// Badge Showcase Page
'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Card, CardContent, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faMedal } from '@fortawesome/free-solid-svg-icons'

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

  // Modal open/close handlers
  const openBadgeModal = (badge: UserBadge) => setSelectedBadge(badge)
  const closeBadgeModal = () => setSelectedBadge(null)

  return (
    <div className="min-h-screen bg-[#181818] text-white flex flex-col items-center py-12">
      <div className="w-full max-w-6xl bg-[#232323] rounded-lg p-8" style={{ boxShadow: 'none' }}>
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2 text-[#ff8000]">
          <FontAwesomeIcon icon={faMedal} className="text-[#ff8000] text-2xl" /> MY BADGES
        </h1>
        <p className="mb-8 text-gray-300 text-base">Track your achievements and skills mastery</p>
        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-8 items-end">
          <div>
            <label className="block text-xs mb-1 text-gray-400">Type</label>
            <select
              className="bg-[#181818] border border-[#ff8000] rounded px-2 py-1 text-white focus:outline-none focus:ring-2 focus:ring-[#ff8000]"
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
            <label className="block text-xs mb-1 text-gray-400">Location</label>
            <Input
              placeholder="Location..."
              value={locationFilter}
              onChange={e => setLocationFilter(e.target.value)}
              className="w-40 bg-[#181818] border border-[#ff8000] text-white focus:outline-none focus:ring-2 focus:ring-[#ff8000]"
            />
          </div>
          <div>
            <label className="block text-xs mb-1 text-gray-400">Date</label>
            <select
              className="bg-[#181818] border border-[#ff8000] rounded px-2 py-1 text-white focus:outline-none focus:ring-2 focus:ring-[#ff8000]"
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
          <div className="text-gray-500">No badges match your filters.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
            {filteredBadges.map((userBadge) => (
              <div
                key={userBadge.id}
                className="bg-[#18191b] rounded-xl flex flex-col items-center justify-center p-8 shadow-lg border border-[#232323] hover:border-[#ff8000] transition-colors min-h-[340px] h-full cursor-pointer"
                style={{ minHeight: 340 }}
                onClick={() => openBadgeModal(userBadge)}
              >
                <div className="flex flex-col items-center flex-grow justify-center w-full h-full">
                  {/* Badge SVG in orange circle */}
                  <div className="w-20 h-20 rounded-full border-2 border-[#ff8000] flex items-center justify-center mb-6">
                    {userBadge.badge.svg ? (
                      <span
                        className="w-16 h-16 flex items-center justify-center"
                        dangerouslySetInnerHTML={{ __html: userBadge.badge.svg }}
                      />
                    ) : (
                      <FontAwesomeIcon icon={faMedal} className="text-[#ff8000] text-4xl" />
                    )}
                  </div>
                  <span className="text-lg text-white font-bold text-center uppercase mb-6">
                    {userBadge.badge.title}
                  </span>
                  <span className="text-base text-gray-400 mb-2">Acquisition #{userBadge.acquisition_number}</span>
                  <span className="text-lg text-[#ff8000] font-bold">{new Date(userBadge.acquired_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}

      {/* Badge Modal */}
      {selectedBadge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80">
          <div className="relative bg-[#181818] border-2 border-[#ff8000] rounded-lg p-10 w-full max-w-lg flex flex-col items-center shadow-2xl animate-fade-in">
            {/* Close button */}
            <button
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center border border-[#ff8000] rounded text-[#ff8000] hover:bg-[#ff8000] hover:text-black transition-colors"
              onClick={closeBadgeModal}
              aria-label="Close"
            >
              ×
            </button>
            {/* Badge SVG without orange circle */}
            <div className="flex flex-col items-center mb-6">
              {/* Remove the orange circle, just show the badge SVG */}
              {selectedBadge.badge.svg ? (
                <span
                  className="w-24 h-24 flex items-center justify-center"
                  dangerouslySetInnerHTML={{ __html: selectedBadge.badge.svg }}
                />
              ) : (
                <FontAwesomeIcon icon={faMedal} className="text-[#ff8000] text-6xl" />
              )}
              <div className="text-2xl font-bold uppercase text-[#ff8000] text-center mb-2 mt-6">
                {selectedBadge.badge.title}
              </div>
            </div>
            <div className="text-white text-center mb-8 text-base">
              {selectedBadge.badge.description}
            </div>
            <div className="w-full bg-[#333] rounded-md py-4 px-4 flex flex-col items-center text-white">
              <div className="text-base">Acquisition #{selectedBadge.acquisition_number}</div>
              <div className="text-base mt-1">Acquired: <span className="text-[#ff8000] font-bold">{new Date(selectedBadge.acquired_at).toLocaleString()}</span></div>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  )
}
