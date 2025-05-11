import React from 'react';
import { Search, FileCheck, Briefcase, Award } from 'lucide-react';
import { motion } from 'framer-motion';

const Process: React.FC = () => {
  const steps = [
    {
      number: 1,
      icon: Search,
      title: "EXPLORE",
      description: "Browse through available micro-apprenticeships in your area of interest."
    },
    {
      number: 2,
      icon: FileCheck,
      title: "APPLY",
      description: "Submit your application with a simple one-click process."
    },
    {
      number: 3,
      icon: Briefcase,
      title: "WORK",
      description: "Complete your one week project and gain real experience."
    },
    {
      number: 4,
      icon: Award,
      title: "EARN",
      description: "Receive payment and add new skills to your portfolio."
    }
  ];

  return (
    <motion.section 
      id="process" 
      className="relative min-h-screen flex items-center bg-[#181818] border-t border-[#ff8800]/20 pt-16 sm:pt-0"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
    >
      <div className="container mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl text-white mb-4 font-extrabold tracking-wider">
            HOW IT <span className="text-[#FF8000]">WORKS</span>
          </h2>
          <p className="text-gray-300 text-lg">
            Get started with Next Level in four simple steps
          </p>
        </motion.div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6 max-w-5xl mx-auto">
          {steps.map((step, index) => (
            <motion.div 
              key={step.title} 
              className="relative"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              {/* Step number */}
              <div className="absolute -top-3 -left-3 w-7 h-7 bg-[#232323] rounded-full flex items-center justify-center border-2 border-[#FF8000] shadow-[0_0_10px_rgba(255,128,0,0.3)]">
                <span className="text-[#FF8000] text-sm font-bold">{step.number}</span>
              </div>

              {/* Icon */}
              <div className="w-14 h-14 mx-auto mb-6 rounded-xl border-2 border-[#FF8000] bg-[#232323] flex items-center justify-center shadow-[0_0_15px_rgba(255,128,0,0.2)]">
                <step.icon className="w-6 h-6 text-[#FF8000]" />
              </div>

              {/* Connection line */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-7 left-[calc(50%+2rem)] w-[calc(100%-4rem)] h-0.5">
                  <div className="h-full bg-[#FF8000]/30"></div>
                </div>
              )}

              {/* Content */}
              <motion.div 
                className="bg-[#232323] border-2 border-[#FF8000] p-4 rounded-xl text-center h-full shadow-[0_0_20px_rgba(255,128,0,0.15)]"
                whileHover={{ 
                  scale: 1.02,
                  boxShadow: '0 0 25px rgba(255,128,0,0.25)'
                }}
                transition={{ duration: 0.2 }}
              >
                <h3 className="text-[#FF8000] text-lg mb-3 font-bold tracking-wide">
                  {step.title}
                </h3>
                <p className="text-gray-300 text-sm leading-relaxed">
                  {step.description}
                </p>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.section>
  );
};

export default Process;