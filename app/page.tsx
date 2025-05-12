'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
import { NavBarLanding } from '@/components/ui/navbar-landing'
import About from './components/About'
import Process from './components/Process'
import ForWho from './components/ForWho'
import PixelFooter from '@/components/ui/Footer'

export default function HomePage() {
  return (
    <div className="min-h-screen w-full">
      <NavBarLanding />
      <section id="home" className="min-h-screen flex items-center justify-center relative overflow-hidden pt-24 sm:pt-0">
        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <motion.div 
            className="max-w-5xl mx-auto relative"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="bg-[#232323] p-[2px] rounded-lg shadow-xl">
              <div className="bg-[#181818] rounded-lg px-4 sm:px-8 py-8 sm:py-12 relative">
                {/* Corner Decorations */}
                <div className="absolute top-0 left-0 w-20 h-20 border-t-2 border-l-2 border-[#ff8800]/30 rounded-tl-lg"></div>
                <div className="absolute bottom-0 right-0 w-20 h-20 border-b-2 border-r-2 border-[#ff8800]/30 rounded-br-lg"></div>
                
                <h2 className="text-3xl md:text-5xl text-center mb-8 uppercase tracking-widest font-bold">
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff8800] to-[#ffa733]">
                    Level Up
                  </span>
                  {" "}
                  <span className="text-white">Your Career</span>
                </h2>
                
                <p className="text-gray-300 text-center max-w-2xl mx-auto mb-12 text-xl">
                  Whether you're looking to explore new careers or find young talent, 
                  Next Level connects you with opportunities that matter.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
                  <Button
                    asChild
                    className="group bg-gradient-to-r from-[#ff8800] to-[#ffa733] text-black font-bold px-10 py-7 rounded-lg hover:from-[#ffa733] hover:to-[#ff8800] border-2 border-[#ff8800] hover:shadow-lg hover:scale-[1.02] transition-all duration-200 text-xl uppercase tracking-wide min-w-[220px]"
                  >
                    <Link href="/auth/login" className="flex items-center gap-3">
                      <span>Get Started</span>
                      <ArrowRight className="w-6 h-6 group-hover:translate-x-1.5 transition-transform duration-200" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
      <div className="py-6 sm:py-12" />
      <About />
      <div className="py-6 sm:py-12" />
      <Process />
      <div className="py-6 sm:py-12" />
      <ForWho />
      <PixelFooter />
    </div>
  )
}