"use client"

import React from "react";
import { AnimatePresence, motion } from "framer-motion";

export default function LoadingScreen({ visible }: { visible: boolean }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.04 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#020810] scanlines"
        >
          {/* Ambient glow blob */}
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full pointer-events-none"
            style={{ background: "radial-gradient(ellipse at center, rgba(0,229,255,0.06) 0%, transparent 70%)" }}
          />

          <div className="relative text-center z-10">
            {/* Sonar rings */}
            <div className="relative h-56 w-56 mx-auto mb-6 flex items-center justify-center">
              <div className="sonar-ring r4" />
              <div className="sonar-ring r3" />
              <div className="sonar-ring r2" />
              <div className="sonar-ring r1" />
              {/* Core dot */}
              <div className="relative z-20 flex items-center justify-center w-10 h-10 rounded-full"
                style={{ background: "radial-gradient(circle, rgba(0,229,255,0.9) 0%, rgba(0,180,200,0.6) 100%)", boxShadow: "0 0 24px rgba(0,229,255,0.8), 0 0 48px rgba(0,229,255,0.3)" }}>
                <div className="w-3 h-3 rounded-full bg-white opacity-90" />
              </div>
            </div>

            <div
              className="text-4xl font-display tracking-widest text-glow-cyan"
              style={{ fontFamily: "var(--font-orbitron)" }}
            >
              WHALEPULSE
            </div>
            <div className="mt-3 text-sm tracking-widest text-[#3b6f85] uppercase"
              style={{ fontFamily: "var(--font-jetbrains)" }}>
              Scanning Somnia depths for whale activity
            </div>

            {/* Animated dots */}
            <div className="mt-6 flex justify-center gap-2">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-[#00e5ff]"
                  animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1.2, 0.8] }}
                  transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.2 }}
                />
              ))}
            </div>

            <div className="mt-5 text-xs text-[#2d5a6e]" style={{ fontFamily: "var(--font-jetbrains)" }}>
              Auto-revealing in 6 seconds if mainnet is slow...
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
