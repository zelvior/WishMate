import { useEffect, useRef, useState } from "react";

interface Balloon {
  id: number;
  x: number;
  y: number;
  radiusX: number;
  radiusY: number;
  speed: number;
  color: string;
  swaySpeed: number;
  swayAmount: number;
  swayOffset: number;
  stringLength: number;
  opacity: number;
}

export default function FloatingBalloons() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Monitor parent dimensions
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let debounceTimeout: number;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        window.clearTimeout(debounceTimeout);
        debounceTimeout = window.setTimeout(() => {
          setDimensions({ width, height });
        }, 100);
      }
    });

    observer.observe(container);
    return () => {
      observer.disconnect();
      window.clearTimeout(debounceTimeout);
    };
  }, []);

  // Update canvas scale
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = dimensions.width;
    canvas.height = dimensions.height;
  }, [dimensions]);

  // Balloon rendering loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || dimensions.width === 0 || dimensions.height === 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let balloons: Balloon[] = [];
    let animationFrameId: number;
    let balloonIdCounter = 0;

    const colors = [
      "rgba(236, 72, 153, 0.75)",  // Pink
      "rgba(59, 130, 246, 0.75)",  // Blue
      "rgba(16, 185, 129, 0.75)",  // Green
      "rgba(245, 158, 11, 0.75)",  // Amber
      "rgba(139, 92, 246, 0.75)",  // Purple
      "rgba(239, 68, 68, 0.75)",   // Red
      "rgba(6, 182, 212, 0.75)"    // Cyan
    ];

    const createBalloon = (initAtBottom = false): Balloon => {
      const radiusX = Math.random() * 10 + 18; // Width radius
      const radiusY = radiusX * 1.25;          // Taller oval ratio
      return {
        id: ++balloonIdCounter,
        x: Math.random() * (dimensions.width - 60) + 30,
        y: initAtBottom ? dimensions.height + radiusY + 30 : Math.random() * dimensions.height,
        radiusX,
        radiusY,
        speed: Math.random() * 0.6 + 0.4, // float speed
        color: colors[Math.floor(Math.random() * colors.length)],
        swaySpeed: Math.random() * 0.01 + 0.005,
        swayAmount: Math.random() * 15 + 5,
        swayOffset: Math.random() * Math.PI * 2,
        stringLength: Math.random() * 40 + 60,
        opacity: Math.random() * 0.2 + 0.7
      };
    };

    // Populate initial batch
    const count = Math.min(18, Math.floor(dimensions.width / 70) + 5);
    for (let i = 0; i < count; i++) {
      balloons.push(createBalloon(false));
    }

    // Animation runner
    const render = () => {
      ctx.clearRect(0, 0, dimensions.width, dimensions.height);

      balloons.forEach((b, idx) => {
        // Float up
        b.y -= b.speed;
        
        // Sway side to side using sine-wave oscillation
        const currentSway = Math.sin(b.y * b.swaySpeed + b.swayOffset) * b.swayAmount * 0.05;
        b.x += currentSway;

        ctx.save();
        ctx.globalAlpha = b.opacity;

        // Draw string (winding curves)
        ctx.beginPath();
        ctx.moveTo(b.x, b.y + b.radiusY);
        // control point 1, control point 2, end point
        ctx.bezierCurveTo(
          b.x - 5, b.y + b.radiusY + b.stringLength / 3,
          b.x + 5, b.y + b.radiusY + (b.stringLength * 2) / 3,
          b.x, b.y + b.radiusY + b.stringLength
        );
        ctx.strokeStyle = "rgba(100, 116, 139, 0.4)";
        ctx.lineWidth = 1;
        ctx.stroke();

        // Draw Balloon Body (ellipse)
        ctx.beginPath();
        ctx.ellipse(b.x, b.y, b.radiusX, b.radiusY, 0, 0, Math.PI * 2);
        ctx.fillStyle = b.color;
        ctx.fill();
        ctx.strokeStyle = "rgba(0, 0, 0, 0.15)";
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Draw shiny highlight
        ctx.beginPath();
        ctx.ellipse(b.x - b.radiusX * 0.3, b.y - b.radiusY * 0.3, b.radiusX * 0.25, b.radiusY * 0.25, -Math.PI / 6, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255, 255, 255, 0.45)";
        ctx.fill();

        // Draw knot triangle at bottom
        ctx.beginPath();
        ctx.moveTo(b.x, b.y + b.radiusY);
        ctx.lineTo(b.x - 4, b.y + b.radiusY + 6);
        ctx.lineTo(b.x + 4, b.y + b.radiusY + 6);
        ctx.closePath();
        ctx.fillStyle = b.color;
        ctx.fill();
        ctx.strokeStyle = "rgba(0, 0, 0, 0.1)";
        ctx.stroke();

        ctx.restore();

        // Recycle if goes off top
        if (b.y < -b.radiusY - b.stringLength) {
          balloons[idx] = createBalloon(true);
        }
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    // Check click/tap events for balloon popping!
    const handleCanvasClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      for (let i = balloons.length - 1; i >= 0; i--) {
        const b = balloons[i];
        // Calculate standard distance
        const dx = clickX - b.x;
        const dy = clickY - b.y;
        
        // Ellipse containment check
        if ((dx * dx) / (b.radiusX * b.radiusX) + (dy * dy) / (b.radiusY * b.radiusY) <= 1.1) {
          // Play pop sound
          try {
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            const popCtx = new AudioContextClass();
            const osc = popCtx.createOscillator();
            const gain = popCtx.createGain();
            osc.connect(gain);
            gain.connect(popCtx.destination);
            osc.frequency.setValueAtTime(600, popCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(100, popCtx.currentTime + 0.08);
            gain.gain.setValueAtTime(0.1, popCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.0001, popCtx.currentTime + 0.08);
            osc.start();
            osc.stop(popCtx.currentTime + 0.1);
          } catch (_) {}

          // Replace popped balloon
          balloons[i] = createBalloon(true);
          break;
        }
      }
    };

    canvas.addEventListener("click", handleCanvasClick);

    return () => {
      cancelAnimationFrame(animationFrameId);
      canvas.removeEventListener("click", handleCanvasClick);
    };
  }, [dimensions]);

  return (
    <div
      ref={containerRef}
      id="floating-balloons-container"
      className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-10"
    >
      <canvas ref={canvasRef} id="floating-balloons-canvas" className="w-full h-full block cursor-pointer" />
    </div>
  );
}
