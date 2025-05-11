'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'
import Image from 'next/image'

export const NavBarLanding = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const scrollToSection = (sectionId: string) => {
    setIsMenuOpen(false)
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <nav className="bg-black sticky top-0 z-50 border-b-2 border-[#ff8800]/20">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center group cursor-default space-x-1.5">
            <Image src="/next-icon.png" alt="Next Level Icon" width={36} height={36} className="w-9 h-9" />
            <span className="font-bold text-white text-2xl md:text-3xl group-hover:text-[#ff8800] transition-colors duration-300">
              NEXT LEVEL
            </span>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <button
              onClick={() => {
                setIsMenuOpen(false);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="text-white font-bold hover:text-[#ff8800] transition-all duration-200 
                       text-l relative after:content-[''] after:absolute after:bottom-0 after:left-0 
                       after:w-0 after:h-0.5 after:bg-[#ff8800] hover:after:w-full 
                       after:transition-all after:duration-300"
            >
              HOME
            </button>
            <button
              onClick={() => scrollToSection('about')}
              className="text-white font-bold hover:text-[#ff8800] transition-all duration-200 
                       text-l relative after:content-[''] after:absolute after:bottom-0 after:left-0 
                       after:w-0 after:h-0.5 after:bg-[#ff8800] hover:after:w-full 
                       after:transition-all after:duration-300"
            >
              ABOUT
            </button>            <button
              onClick={() => scrollToSection('process')}
              className="text-white font-bold hover:text-[#ff8800] transition-all duration-200 
                       text-l relative after:content-[''] after:absolute after:bottom-0 after:left-0 
                       after:w-0 after:h-0.5 after:bg-[#ff8800] hover:after:w-full 
                       after:transition-all after:duration-300"
            >
              PROCESS
            </button>
            <button
              onClick={() => scrollToSection('for-who')}
              className="text-white font-bold hover:text-[#ff8800] transition-all duration-200 \
                       text-l relative after:content-[''] after:absolute after:bottom-0 after:left-0 \
                       after:w-0 after:h-0.5 after:bg-[#ff8800] hover:after:w-full \
                       after:transition-all after:duration-300"
            >
              JOIN
            </button>
            <Link href="/auth/login" 
                  className="group bg-gradient-to-r from-[#ff8800] to-[#ffa733] text-black font-bold px-6 py-2 rounded-md
                           hover:from-[#ffa733] hover:to-[#ff8800] transition-all duration-200 text-xl"
            >
              START
            </Link>
          </div>
          
          {/* Mobile Menu Button */}
          <button 
            className="md:hidden text-white hover:text-[#ff8800] transition-colors duration-200"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>
      
      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden glass-effect border-t border-[#ff8800]/20 py-4 px-4">
          <div className="flex flex-col space-y-4">
            <button
              onClick={() => {
                setIsMenuOpen(false);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="text-white hover:text-[#ff8800] py-2 text-xl
                       transition-colors duration-200 w-full hover:bg-black/20 px-4 rounded-md text-left"
            >
              HOME
            </button>
            <button
              onClick={() => scrollToSection('about')}
              className="text-white hover:text-[#ff8800] py-2 text-xl
                       transition-colors duration-200 w-full hover:bg-black/20 px-4 rounded-md text-left"
            >
              ABOUT
            </button>
            <button
              onClick={() => scrollToSection('process')}
              className="text-white hover:text-[#ff8800] py-2 text-xl
                       transition-colors duration-200 w-full hover:bg-black/20 px-4 rounded-md text-left"
            >
              PROCESS
            </button>
            <button
              onClick={() => scrollToSection('for-who')}
              className="text-white hover:text-[#ff8800] py-2 text-xl
                       transition-colors duration-200 w-full hover:bg-black/20 px-4 rounded-md text-left"
            >
              JOIN
            </button>
            <Link
              href="/auth/login"
              className="group bg-gradient-to-r from-[#ff8800] to-[#ffa733] text-black font-bold px-6 py-2 rounded-md
                       hover:from-[#ffa733] hover:to-[#ff8800] transition-all duration-200 text-xl text-center"
              onClick={() => setIsMenuOpen(false)}
            >
              START 
            </Link>
          </div>
        </div>
      )}
    </nav>
  )
}