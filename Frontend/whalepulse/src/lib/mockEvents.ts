import { Transfer } from "@/lib/whaleEngine";

function rand(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

/**
 * Starts generating mock STT transfer events.
 * Returns a cleanup function — call it to stop the generator.
 * No module-level state: each call is independent, React Strict Mode safe.
 */
export default function startMockEvents(onEvent: (t: Transfer) => void): () => void {
  let active = true;
  let timer: ReturnType<typeof setTimeout> | null = null;

  function step() {
    if (!active) return;

    const roll = Math.random();
    // 5% mega-whale, 15% whale, 80% normal transfer
    const rawAmount =
      roll < 0.05 ? rand(5000, 50000)
        : roll < 0.20 ? rand(100, 5000)
          : rand(0.001, 50);

    onEvent({
      from: `0x${Math.floor(Math.random() * 1e16).toString(16).padStart(40, "0").slice(0, 40)}`,
      to: `0x${Math.floor(Math.random() * 1e16).toString(16).padStart(40, "0").slice(0, 40)}`,
      amount: parseFloat(rawAmount.toFixed(6)),
      timestamp: Date.now(),
      txHash: `0x${Math.floor(Math.random() * 1e16).toString(16).padStart(64, "0")}`,
    });

    timer = setTimeout(step, Math.floor(rand(900, 2200)));
  }

  step(); // kick off immediately

  return () => {
    active = false;
    if (timer !== null) { clearTimeout(timer); timer = null; }
  };
}
