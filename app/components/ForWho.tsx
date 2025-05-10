// ForWho.tsx - Who is Next Level for? (Job Seekers & Businesses)
'use client'

import { GraduationCap, Building2 } from 'lucide-react'

const studentFeatures = [
  'Explore careers before committing',
  'Build your portfolio',
  'Earn skill badges',
  'Gain real experience'
]

const businessFeatures = [
  'Find motivated young talent',
  'Short-term commitments',
  'Shape future workforce',
  'Build community connections'
]

const ForWho = () => {
  return (
    <section id="for-who" className="min-h-screen flex items-center relative bg-transparent">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* For Job Seekers */}
          <div className="rounded-lg p-[2px] bg-gradient-to-r from-[#ff8800] via-[#ff8800] to-[#ffa733] group">
            <div className="bg-[#181818] rounded-lg p-10 relative">
              <div className="absolute top-0 right-0 w-20 h-20 border-t-2 border-r-2 border-[#ff8800]/30 rounded-tr-lg"></div>
              <div className="w-12 h-12 bg-gradient-to-br from-[#ff8800] to-[#ffa733] rounded-lg flex justify-center items-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <GraduationCap className="w-6 h-6 text-black" />
              </div>
              <h2 className="font-mono text-lg md:text-xl mb-6 text-transparent bg-clip-text bg-gradient-to-r from-[#ff8800] to-[#ffa733] uppercase tracking-wider font-bold">
                FOR JOB SEEKERS
              </h2>
              <ul className="space-y-4 mb-2">
                {studentFeatures.map((item, idx) => (
                  <li key={idx} className="flex items-start group/item">
                    <div className="w-2 h-2 bg-gradient-to-br from-[#ff8800] to-[#ffa733] mt-2 mr-3 shrink-0 rounded-sm group-hover/item:scale-125 transition-transform duration-200"></div>
                    <span className="text-gray-300 group-hover/item:text-white transition-colors duration-200">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* For Businesses */}
          <div className="rounded-lg p-[2px] bg-gradient-to-r from-[#ff8800] via-[#ff8800] to-[#ffa733] group">
            <div className="bg-[#181818] rounded-lg p-10 relative">
              <div className="absolute top-0 right-0 w-20 h-20 border-t-2 border-r-2 border-[#ff8800]/30 rounded-tr-lg"></div>
              <div className="w-12 h-12 bg-gradient-to-br from-[#ff8800] to-[#ffa733] rounded-lg flex justify-center items-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Building2 className="w-6 h-6 text-black" />
              </div>
              <h2 className="font-mono text-lg md:text-xl mb-6 text-transparent bg-clip-text bg-gradient-to-r from-[#ff8800] to-[#ffa733] uppercase tracking-wider font-bold">
                FOR BUSINESSES
              </h2>
              <ul className="space-y-4 mb-2">
                {businessFeatures.map((item, idx) => (
                  <li key={idx} className="flex items-start group/item">
                    <div className="w-2 h-2 bg-gradient-to-br from-[#ff8800] to-[#ffa733] mt-2 mr-3 shrink-0 rounded-sm group-hover/item:scale-125 transition-transform duration-200"></div>
                    <span className="text-gray-300 group-hover/item:text-white transition-colors duration-200">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default ForWho
