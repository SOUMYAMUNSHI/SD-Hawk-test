'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Cctv, 
  ShieldAlert, 
  ListChecks, 
  Settings, 
  Menu,
  X,
  Bird
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Cameras', href: '/cameras', icon: Cctv },
  { name: 'Rule Builder', href: '/rules', icon: ListChecks },
];

export default function DashboardLayout({ children }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="flex h-screen bg-neutral-950 text-white overflow-hidden">
      
      {/* Mobile Top Nav */}
      <div className="lg:hidden absolute top-0 left-0 right-0 h-16 bg-neutral-900 border-b border-neutral-800 flex items-center justify-between px-4 z-50">
        <div className="flex items-center gap-2 text-emerald-500">
          <Bird size={24} />
          <span className="font-bold text-xl text-white tracking-wide">SD-HAWK</span>
        </div>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 text-neutral-400 hover:text-white"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: -300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -300 }}
            transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
            className="fixed inset-0 z-40 flex lg:hidden pt-16"
          >
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
            <div className="relative w-64 h-full bg-neutral-900 border-r border-neutral-800 p-4 flex flex-col gap-2">
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link 
                    key={item.name} 
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive ? 'bg-emerald-500/10 text-emerald-500 font-medium' : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'}`}
                  >
                    <item.icon size={20} />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <div className="hidden lg:flex flex-col w-72 bg-neutral-900 border-r border-neutral-800 p-6 h-full">
        <div className="flex items-center gap-3 text-emerald-500 mb-10 pl-2">
          <Bird size={32} />
          <span className="font-bold text-2xl text-white tracking-wider">SD-HAWK</span>
        </div>
        
        <nav className="flex-1 flex flex-col gap-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link 
                key={item.name} 
                href={item.href}
                className={`flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all ${isActive ? 'bg-emerald-500/10 text-emerald-500 font-medium' : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'}`}
              >
                <item.icon size={22} className={isActive ? 'animate-pulse' : ''} />
                <span className="text-sm">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto p-4 bg-neutral-950 rounded-xl border border-neutral-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center font-bold text-neutral-950">
            A
          </div>
          <div>
            <div className="text-sm font-medium">Admin User</div>
            <div className="text-xs text-neutral-500">System Owner</div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto bg-neutral-950 pt-16 lg:pt-0">
        <div className="p-6 lg:p-10 max-w-7xl mx-auto h-full">
          {children}
        </div>
      </main>
    </div>
  );
}
