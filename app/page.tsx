'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
import { NavBarLanding } from '@/components/ui/navbar-landing'

export default function HomePage() {
  return (
    <>
      <NavBarLanding />
      <section className="min-h-screen flex items-center relative overflow-hidden bg-gradient-to-b from-black to-[#111]">
        {/* Grid Background */}
        <div 
          className="absolute inset-0 opacity-[0.05] pointer-events-none"
          style={{
            backgroundImage: 'linear-gradient(#ff8800 1px, transparent 1px), linear-gradient(to right, #ff8800 1px, transparent 1px)',
            backgroundSize: '30px 30px'
          }}
        />
        
        {/* Radial Gradient */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(circle at 50% 50%, rgba(255,136,0,0.03) 0%, rgba(139,92,246,0.02) 50%, rgba(0,0,0,0) 100%)'
          }}
        />

        <div className="container mx-auto px-4 sm:px-6 relative">
          <motion.div 
            className="max-w-5xl mx-auto relative"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="bg-[#232323] p-[2px] rounded-lg shadow-xl">
              <div className="bg-[#181818] rounded-lg px-8 py-12 relative">
                {/* Corner Decorations */}
                <div className="absolute top-0 left-0 w-20 h-20 border-t-2 border-l-2 border-[#ff8800]/30 rounded-tl-lg"></div>
                <div className="absolute bottom-0 right-0 w-20 h-20 border-b-2 border-r-2 border-[#ff8800]/30 rounded-br-lg"></div>
                
                <h2 className="text-2xl md:text-4xl text-center mb-6 uppercase tracking-widest font-bold">
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff8800] to-[#ffa733]">
                    Level Up
                  </span>
                  {" "}
                  <span className="text-white">Your Career</span>
                </h2>
                
                <p className="text-gray-300 text-center max-w-2xl mx-auto mb-10 text-lg">
                  Whether you're looking to explore new careers or find young talent, 
                  Next Level connects you with opportunities that matter.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                  <Button
                    asChild
                    className="group bg-gradient-to-r from-[#ff8800] to-[#ffa733] text-black font-bold px-8 py-6 rounded-lg hover:from-[#ffa733] hover:to-[#ff8800] border-2 border-[#ff8800] hover:shadow-lg hover:scale-[1.02] transition-all duration-200 text-lg uppercase tracking-wide min-w-[200px]"
                  >
                    <Link href="/auth/login" className="flex items-center gap-2">
                      <span>Get Started</span>
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  )
}