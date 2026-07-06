import { useEffect, useRef, useState } from "react";

interface ConfettiExplosionProps {
  triggerCount: number; // Incrementing this triggers a new burst!
}

interface ConfettiPiece {
  x: number;
  y: number;
  size: number;
  vx: number;
  vy: number;
  color: string;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
  shape: 'rect' | 'circle' | 'triangle';
}

export default function ConfettiExplosion({ triggerCount }: ConfettiExplosionProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const piecesRef = useRef<ConfettiPiece[]>([]);

  // Track parent box dimensions
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
        }, 150);
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

  // Handle explosion trigger
  useEffect(() => {
    if (triggerCount === 0 || dimensions.width === 0 || dimensions.height === 0) return;

    const colors = [
      "#ff4136", "#2ecc40", "#0074d9", "#ffdc00", "#f012be", 
      "#7fdbff", "#ff851b", "#b10dc9", "#39cccc", "#01ff70"
    ];

    const newPieces: ConfettiPiece[] = [];
    const centerX = dimensions.width / 2;
    const centerY = dimensions.height / 2;

    // Create 180 confetti pieces exploding from the center
    for (let i = 0; i < 180; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 12 + 6;
      const shapes: ('rect' | 'circle' | 'triangle')[] = ['rect', 'circle', 'triangle'];
      
      newPieces.push({
        x: centerX,
        y: centerY,
        size: Math.random() * 8 + 6,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - (Math.random() * 3 + 2), // slightly upwards biased
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.25,
        opacity: 1.0,
        shape: shapes[Math.floor(Math.random() * shapes.length)]
      });
    }

    // Accumulate pieces
    piecesRef.current = [...piecesRef.current, ...newPieces];

  }, [triggerCount, dimensions]);

  // Animation and physics simulation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;

    const update = () => {
      ctx.clearRect(0, 0, dimensions.width, dimensions.height);
      const pieces = piecesRef.current;

      if (pieces.length === 0) {
        animationId = requestAnimationFrame(update);
        return;
      }

      // Filter out faded-out pieces
      piecesRef.current = pieces.filter(p => {
        // Apply physics
        p.x += p.vx;
        p.y += p.vy;

        // Apply friction and gravity
        p.vx *= 0.98;
        p.vy += 0.22; // gravity pull
        p.vy *= 0.98;

        // Apply rotation
        p.rotation += p.rotationSpeed;

        // Slow fadeout over time
        p.opacity -= 0.012;

        if (p.opacity <= 0) return false;

        // Draw individual piece
        ctx.save();
        ctx.globalAlpha = p.opacity;
        ctx.fillStyle = p.color;
        ctx.strokeStyle = p.color;
        
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);

        if (p.shape === 'rect') {
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        } else if (p.shape === 'circle') {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Triangle
          ctx.beginPath();
          ctx.moveTo(0, -p.size / 2);
          ctx.lineTo(-p.size / 2, p.size / 2);
          ctx.lineTo(p.size / 2, p.size / 2);
          ctx.closePath();
          ctx.fill();
        }

        ctx.restore();
        return true;
      });

      animationId = requestAnimationFrame(update);
    };

    update();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [dimensions]);

  return (
    <div
      ref={containerRef}
      id="confetti-explosion-container"
      className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-50"
    >
      <canvas ref={canvasRef} id="confetti-explosion-canvas" className="w-full h-full block" />
    </div>
  );
}
