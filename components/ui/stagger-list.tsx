"use client"

import { motion } from "framer-motion"

export function StaggerItem({
  children,
  index,
}: {
  children: React.ReactNode
  index: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03, duration: 0.2 }}
    >
      {children}
    </motion.div>
  )
}
