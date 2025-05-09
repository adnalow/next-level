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
import { useSessionContext } from '@/lib/SessionContext'
import ClientLayout from '../components/ClientLayout'
import LoadingScreen from '@/components/ui/LoadingScreen'

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
  // Debug: log session and loading state
  const { session, loading: sessionLoading } = useSessionContext();
  console.log('BadgeShowcasePage session:', session, 'sessionLoading:', sessionLoading);
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
    if (!sessionLoading) fetchBadges()
    // eslint-disable-next-line
  }, [sessionLoading, session])

  async function fetchBadges() {
    setLoading(true)
    setError(null)
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

  // Helper: check if badge was acquired today
  const isBadgeNew = (acquired_at: string) => {
    const acquiredDate = new Date(acquired_at);
    const now = new Date();
    return acquiredDate.getFullYear() === now.getFullYear() &&
      acquiredDate.getMonth() === now.getMonth() &&
      acquiredDate.getDate() === now.getDate();
  }

  // Modal open/close handlers
  const openBadgeModal = (badge: UserBadge) => setSelectedBadge(badge)
  const closeBadgeModal = () => setSelectedBadge(null)

  // Clear filters handler
  const clearFilters = () => {
    setSelectedCategory('all');
    setLocationFilter('');
    setDateFilter('');
  }

  // Helper: color coding for badge types
  const badgeTypeColor = (category?: string) => {
    // Use a single consistent dark gradient for all cards
    return 'from-[#232323] to-[#181818]';
  }

  return (
    <ClientLayout>
      <div className="min-h-screen bg-[#202124] text-white flex flex-col items-center py-6 sm:py-12">
        <div className="w-full max-w-6xl bg-[#232323] rounded-lg p-4 sm:p-8" style={{ boxShadow: 'none' }}>
          <h1 className="text-3xl sm:text-4xl font-extrabold mb-1 flex items-center gap-2 text-[#ff8000] tracking-wide drop-shadow-lg">
            <FontAwesomeIcon icon={faMedal} className="text-[#ff8000] text-2xl sm:text-3xl" /> MY BADGES
          </h1>
          <p className="mb-6 sm:mb-8 text-gray-400 text-sm sm:text-base font-medium italic">Track your achievements and skills mastery</p>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row flex-wrap gap-4 mb-8 items-end w-full">
            <div className="w-full sm:w-auto relative">
              <label className="block text-xs mb-1 text-gray-400">Type</label>
              <select
                className="bg-[#181818] border border-[#ff8000] rounded px-2 py-1 text-white focus:outline-none focus:ring-2 focus:ring-[#ff8000] w-full min-w-[120px] appearance-none pr-8 font-semibold hover:border-[#ffa040] transition-colors"
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
                aria-label="Filter by badge type"
              >
                <option value="all">All</option>
                {badgeCategories.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-2 top-7 text-[#ff8000]">▼</span>
            </div>
            <div className="w-full sm:w-auto relative">
              <label className="block text-xs mb-1 text-gray-400">Location</label>
              <Input
                placeholder="Enter a location (e.g., New York)"
                value={locationFilter}
                onChange={e => setLocationFilter(e.target.value)}
                className="w-full sm:w-40 bg-[#181818] border border-[#ff8000] text-white focus:outline-none focus:ring-2 focus:ring-[#ff8000] pr-8 hover:border-[#ffa040] transition-colors"
                aria-label="Filter by location"
              />
            </div>
            <div className="w-full sm:w-auto relative">
              <label className="block text-xs mb-1 text-gray-400">Date</label>
              <select
                className="bg-[#181818] border border-[#ff8000] rounded px-2 py-1 text-white focus:outline-none focus:ring-2 focus:ring-[#ff8000] w-full min-w-[120px] appearance-none pr-8 font-semibold hover:border-[#ffa040] transition-colors"
                value={dateFilter}
                onChange={e => setDateFilter(e.target.value)}
                aria-label="Filter by date"
              >
                <option value="">All</option>
                {dateOptions.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-2 top-7 text-[#ff8000]">▼</span>
            </div>
            <button
              className="ml-0 sm:ml-2 mt-2 sm:mt-0 px-4 py-2 rounded bg-[#ff8000] text-black font-bold hover:bg-[#ffa040] transition-colors border border-[#ff8000] shadow-sm"
              onClick={clearFilters}
              aria-label="Clear all filters"
              type="button"
            >
              Clear Filters
            </button>
          </div>
          {error && <div className="mb-4 text-red-500">{error}</div>}
          {loading ? (
            <LoadingScreen />
          ) : filteredBadges.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="text-2xl text-gray-400 font-bold mb-2">No badges yet!</div>
              <div className="text-gray-500 mb-4">Start completing jobs to earn your first badge.</div>
              <button
                className="px-6 py-2 rounded bg-[#ff8000] text-black font-bold hover:bg-[#ffa040] transition-colors border border-[#ff8000] shadow-sm"
                onClick={() => router.push('/jobs')}
              >
                Browse Jobs
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 sm:gap-10">
              {filteredBadges.map((userBadge) => (
                <div
                  key={userBadge.id}
                  className={`relative group bg-gradient-to-br ${badgeTypeColor(userBadge.badge.category)} rounded-xl flex flex-col items-center justify-center p-7 sm:p-10 shadow-lg border border-[#232323] hover:border-[#ff8000] transition-colors min-h-[340px] h-full cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#ff8000]`} 
                  style={{ minHeight: 340 }}
                  onClick={() => openBadgeModal(userBadge)}
                  tabIndex={0}
                  aria-label={`Badge: ${userBadge.badge.title}, acquired on ${new Date(userBadge.acquired_at).toLocaleDateString()}`}
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') openBadgeModal(userBadge); }}
                >
                  {/* New badge tag */}
                  {isBadgeNew(userBadge.acquired_at) && (
                    <span className="absolute top-3 right-3 bg-[#ff8000] text-black text-xs font-bold px-2 py-1 rounded shadow animate-pulse z-10">New!</span>
                  )}
                  {/* Tooltip on hover */}
                  <div className="absolute left-1/2 -translate-x-1/2 -top-8 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 z-20 w-64 bg-black bg-opacity-90 text-white text-xs rounded px-3 py-2 shadow-lg text-center">
                    {userBadge.badge.description}
                  </div>
                  <div className="flex flex-col items-center flex-grow justify-center w-full h-full">
                    {/* Badge SVG in orange circle with hover effect */}
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-2 border-[#ff8000] flex items-center justify-center mb-5 sm:mb-7 bg-[#232323] transition-transform duration-200 group-hover:scale-105 group-hover:shadow-[0_0_16px_2px_#ff8000] focus:scale-105 focus:shadow-[0_0_16px_2px_#ff8000] outline-none">
                      {userBadge.badge.svg ? (
                        <span
                          className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center"
                          dangerouslySetInnerHTML={{ __html: userBadge.badge.svg }}
                        />
                      ) : (
                        <FontAwesomeIcon icon={faMedal} className="text-[#ff8000] text-4xl sm:text-5xl" />
                      )}
                    </div>
                    <span className="text-lg sm:text-xl text-white font-extrabold text-center uppercase mb-2 sm:mb-3 tracking-wide drop-shadow">
                      {userBadge.badge.title}
                    </span>
                    <span className="text-xs sm:text-sm text-gray-300 mb-1 sm:mb-2">Acquisition #{userBadge.acquisition_number}</span>
                    <span className="text-xs sm:text-sm text-[#ffb347] font-semibold">{new Date(userBadge.acquired_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

        {/* Badge Modal */}
        {selectedBadge && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-10 animate-fade-in"
            role="dialog"
            aria-modal="true"
            aria-label={`Badge: ${selectedBadge.badge.title}, acquired on ${new Date(selectedBadge.acquired_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}`}
            tabIndex={-1}
            onKeyDown={e => {
              if (e.key === 'Escape') closeBadgeModal();
            }}
          >
            <div
              className="relative bg-[#232323] border-4 border-[#ff8000] rounded-xl p-6 sm:p-10 w-full max-w-lg flex flex-col items-center shadow-2xl animate-fade-in modal-content transition-all duration-300"
              style={{ boxShadow: '0 8px 40px 0 rgba(0,0,0,0.7)', background: 'linear-gradient(135deg, #232323 80%, #282828 100%)' }}
            >
              {/* Close button */}
              <button
                className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center border-2 border-[#ff8000] rounded-full text-[#ff8000] text-2xl font-bold hover:bg-[#ff8000] hover:text-black focus:outline-none focus:ring-2 focus:ring-[#ff8000] transition-colors duration-150 shadow-lg"
                onClick={closeBadgeModal}
                aria-label="Close badge details"
                tabIndex={0}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') closeBadgeModal(); }}
              >
                ×
              </button>
              {/* Badge SVG and Title with improved layout for long names */}
              <div className="flex flex-col sm:flex-row items-center mb-6 w-full gap-4 sm:gap-6">
                <span
                  className="flex items-center justify-center mx-auto sm:mx-0"
                  tabIndex={0}
                  aria-label="Badge icon"
                >
                  <span
                    className="w-24 h-24 rounded-full border-2 border-[#ff8000] bg-[#232323] flex items-center justify-center transition-transform duration-200 hover:scale-110 hover:shadow-[0_0_24px_4px_#ff8000] focus:scale-110 focus:shadow-[0_0_24px_4px_#ff8000] outline-none"
                    style={{ display: 'inline-flex' }}
                  >
                    {selectedBadge.badge.svg ? (
                      <span
                        className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center"
                        dangerouslySetInnerHTML={{ __html: selectedBadge.badge.svg }}
                      />
                    ) : (
                      <FontAwesomeIcon icon={faMedal} className="text-[#ff8000] text-4xl sm:text-5xl" />
                    )}
                  </span>
                </span>
                <div className="flex-1 flex flex-col items-center sm:items-start w-full min-w-0">
                  <LongBadgeTitle title={selectedBadge.badge.title} />
                </div>
              </div>
              {/* Divider */}
              <hr className="w-full border-t border-[#393939] mb-4" />
              {/* Description with Read More toggle if long */}
              <BadgeDescription description={selectedBadge.badge.description} />
              {/* Acquisition info */}
              <div className="w-full bg-[#292929] rounded-md py-4 px-4 flex flex-col items-center text-white mt-4 border-t-2 border-[#ff8000]">
                <div className="text-base font-semibold text-[#ffb347] mb-1">
                  Acquisition #{selectedBadge.acquisition_number}
                </div>
                <div className="text-base mt-0 text-gray-200">
                  Acquired: <span className="text-[#ff8000] font-bold">{new Date(selectedBadge.acquired_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
              </div>
            </div>
          </div>
        )}
        </div>
      </div>
    </ClientLayout>
  )
}

// Helper: BadgeDescription component for read more toggle
function BadgeDescription({ description }: { description: string }) {
  const [expanded, setExpanded] = useState(false);
  const maxLength = 120;
  if (!description) return null;
  const isLong = description.length > maxLength;
  return (
    <div className="text-white text-center mb-8 text-base leading-relaxed" style={{ fontSize: '1.1rem', lineHeight: 1.6 }}>
      {isLong && !expanded ? (
        <>
          {description.slice(0, maxLength)}...{' '}
          <button
            className="text-[#ff8000] underline font-semibold focus:outline-none focus:ring-2 focus:ring-[#ff8000]"
            onClick={() => setExpanded(true)}
            aria-label="Read more about this badge"
          >
            Read More
          </button>
        </>
      ) : (
        <>
          {description}{' '}
          {isLong && (
            <button
              className="text-[#ff8000] underline font-semibold focus:outline-none focus:ring-2 focus:ring-[#ff8000]"
              onClick={() => setExpanded(false)}
              aria-label="Show less badge description"
            >
              Show Less
            </button>
          )}
        </>
      )}
    </div>
  );
}

// Helper: LongBadgeTitle for wrapping, ellipsis, and tooltip
function LongBadgeTitle({ title }: { title: string }) {
  // Split into two lines if possible (try to break at the last space before 22 chars)
  const maxLineLength = 22;
  let firstLine = title;
  let secondLine = '';
  if (title.length > maxLineLength) {
    const breakIdx = title.lastIndexOf(' ', maxLineLength);
    if (breakIdx > 0) {
      firstLine = title.slice(0, breakIdx);
      secondLine = title.slice(breakIdx + 1);
    }
  }
  // If still too long, use ellipsis and tooltip
  const displayTitle = (firstLine + (secondLine ? ' ' + secondLine : ''));
  const isTooLong = displayTitle.length > 36;
  return (
    <div
      className={`w-full text-center sm:text-left font-extrabold uppercase text-[#ff8000] drop-shadow-lg border-b-4 border-[#ff8000] pb-1 ${isTooLong ? 'cursor-pointer hover:underline' : ''}`}
      style={{
        fontSize: isTooLong ? '1.6rem' : '2rem',
        lineHeight: 1.15,
        wordBreak: 'break-word',
        maxWidth: '100%',
        overflowWrap: 'break-word',
        whiteSpace: 'pre-line',
      }}
      title={isTooLong ? title : undefined}
      tabIndex={0}
      aria-label={title}
    >
      {firstLine}
      {secondLine && <><br />{secondLine}</>}
      {isTooLong && (
        <span className="ml-1 align-top text-[#ff8000]" aria-hidden="true">…</span>
      )}
    </div>
  );
}

// Helper: handleShareBadge (simple copy link for now, can be extended)
function handleShareBadge(badge: UserBadge) {
  if (navigator.share) {
    navigator.share({
      title: `I earned the ${badge.badge.title} badge!`,
      text: badge.badge.description,
      url: window.location.href
    });
  } else {
    navigator.clipboard.writeText(window.location.href);
    alert('Badge link copied to clipboard!');
  }
}
