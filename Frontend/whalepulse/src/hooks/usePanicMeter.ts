"use client"

import { useEffect } from "react";
import { useWhaleStore } from "@/store/whaleStore";

export default function usePanicMeter(): void {
  const recalc = useWhaleStore((s: any) => s.recalculatePanicMeter);

  useEffect(() => {
    recalc();
    const id = setInterval(() => {
      recalc();
    }, 5000);
    return () => clearInterval(id);
  }, [recalc]);
}
