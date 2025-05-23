'use client'

import React from 'react'
import { Clock, Briefcase, Award } from 'lucide-react'

const About = () => {
  return (
    <section id="about" className="min-h-screen flex items-center justify-center relative overflow-hidden pt-16 sm:pt-0">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-4xl md:text-5xl text-white mb-6 text-center font-bold">
            WHAT ARE <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff8800] to-[#ffa733] font-bold">NEXT LEVEL</span> OPPORTUNITIES?
          </h2>
          <p className="text-gray-300 text-center mb-14 max-w-2xl mx-auto text-2xl">
            Discover the future of career development through our innovative micro-apprenticeship platform
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="group h-full">
              <div className="relative rounded-lg p-[2px] bg-gradient-to-r from-[#ff8800] via-[#ff8800] to-[#ffa733] h-full">
                <div className="bg-[#181818] rounded-lg p-6 h-full flex flex-col justify-between">
                  <div>
                    <div className="w-12 h-12 bg-gradient-to-br from-[#ff8800] to-[#ffa733] mb-6 rounded-lg flex justify-center items-center group-hover:scale-110 transition-transform duration-300">
                      <Clock className="w-6 h-6 text-black" />
                    </div>
                    <h3 className="text-[#ff8800] text-base mb-4 font-bold">SHORT-TERM</h3>
                    <p className="text-gray-300 text-lg">
                      One week micro-apprenticeships that fit into your schedule.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="group h-full">
              <div className="relative rounded-lg p-[2px] bg-gradient-to-r from-[#ff8800] via-[#ff8800] to-[#ffa733] h-full">
                <div className="bg-[#181818] rounded-lg p-6 h-full flex flex-col justify-between">
                  <div>
                    <div className="w-12 h-12 bg-gradient-to-br from-[#ff8800] to-[#ffa733] mb-6 rounded-lg flex justify-center items-center group-hover:scale-110 transition-transform duration-300">
                      <Briefcase className="w-6 h-6 text-black" />
                    </div>
                    <h3 className="text-[#ff8800] text-base mb-4 font-bold">REAL JOBS</h3>
                    <p className="text-gray-300 text-lg">
                      Work with local businesses on actual projects.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="group h-full">
              <div className="relative rounded-lg p-[2px] bg-gradient-to-r from-[#ff8800] via-[#ff8800] to-[#ffa733] h-full">
                <div className="bg-[#181818] rounded-lg p-6 h-full flex flex-col justify-between">
                  <div>
                    <div className="w-12 h-12 bg-gradient-to-br from-[#ff8800] to-[#ffa733] mb-6 rounded-lg flex justify-center items-center group-hover:scale-110 transition-transform duration-300">
                      <Award className="w-6 h-6 text-black" />
                    </div>
                    <h3 className="text-[#ff8800] text-base mb-4 font-bold">EARN SKILLS</h3>
                    <p className="text-gray-300 text-lg">
                      Collect verifiable skill badges for your portfolio.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default About