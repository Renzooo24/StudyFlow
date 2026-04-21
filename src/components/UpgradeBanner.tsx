import { motion } from 'framer-motion'
import { Zap } from 'lucide-react'

export default function UpgradeBanner({ onClose }: { onClose: () => void }) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-4 sm:pb-0"
      style={{ backgroundColor: 'rgba(0,0,0,0.65)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <motion.div
        className="w-full max-w-sm rounded-2xl p-8 text-center"
        style={{ backgroundColor: '#16161F', border: '1px solid #2A2A3A' }}
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 260 }}
      >
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5"
          style={{ backgroundColor: 'rgba(124,111,255,0.15)' }}
        >
          <Zap size={26} style={{ color: '#7C6FFF' }} />
        </div>
        <h2 className="text-lg font-bold mb-2" style={{ color: '#E8E8F0' }}>
          Free-Limit erreicht
        </h2>
        <p className="text-sm mb-6" style={{ color: '#9090A8' }}>
          Im Free-Plan ist maximal 1 Prüfung möglich. Upgrade auf Premium für unbegrenzte Prüfungen.
        </p>
        <button
          className="w-full py-3 rounded-xl text-sm font-semibold text-white mb-3 transition-opacity hover:opacity-80"
          style={{ backgroundColor: '#7C6FFF' }}
        >
          Upgrade auf Premium
        </button>
        <button
          onClick={onClose}
          className="w-full py-2.5 text-sm transition-opacity hover:opacity-70"
          style={{ color: '#6060A0' }}
        >
          Schließen
        </button>
      </motion.div>
    </motion.div>
  )
}
