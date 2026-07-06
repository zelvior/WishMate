import { useEffect, useRef, useState } from "react";
import { CelebrationTheme } from "../types";

interface ThemeBackgroundProps {
  theme: CelebrationTheme;
}

interface Particle {
  x: number;
  y: number;
  size: number;
  vx: number;
  vy: number;
  color: string;
  alpha: number;
  decay?: number;
  spin?: number;
  angle?: number;
  shape?: 'star' | 'circle' | 'square' | 'bubble';
}

export default function ThemeBackground({ theme }: ThemeBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Handle responsive canvas sizing using ResizeObserver as instructed!
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let debounceTimeout: number;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        
        // Debounce resize updates for performance on rapid window resizing
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

  // Update canvas scale when dimensions change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = dimensions.width;
    canvas.height = dimensions.height;
  }, [dimensions]);

  // Particle simulation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || dimensions.width === 0 || dimensions.height === 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let particles: Particle[] = [];
    let animationFrameId: number;

    // Helper to generate a random particle based on theme
    const createParticle = (initAtBottom = false): Particle => {
      const x = Math.random() * dimensions.width;
      const y = initAtBottom ? dimensions.height + 20 : Math.random() * dimensions.height;
      const size = Math.random() * 4 + 1;

      if (theme === "cosmic") {
        // Star particle
        return {
          x,
          y,
          size: Math.random() * 2 + 0.5,
          vx: (Math.random() - 0.5) * 0.05,
          vy: Math.random() * 0.04 + 0.01, // slow drift down
          color: `rgba(${180 + Math.floor(Math.random() * 75)}, ${180 + Math.floor(Math.random() * 75)}, 255, ${Math.random() * 0.8 + 0.2})`,
          alpha: Math.random(),
          decay: Math.random() * 0.01 + 0.002, // twinkle
          shape: "circle",
        };
      } else if (theme === "neon") {
        // Neon cyber particles
        const colors = ["#ff007f", "#00f3ff", "#9d00ff", "#00ff66"];
        return {
          x,
          y,
          size: Math.random() * 3 + 1.5,
          vx: (Math.random() - 0.5) * 0.1,
          vy: -(Math.random() * 0.8 + 0.3), // rise up
          color: colors[Math.floor(Math.random() * colors.length)],
          alpha: Math.random() * 0.7 + 0.3,
          shape: Math.random() > 0.5 ? "square" : "circle",
          angle: Math.random() * Math.PI * 2,
          spin: (Math.random() - 0.5) * 0.02,
        };
      } else if (theme === "rose_gold") {
        // Luxury champagne gold sparkles
        const goldColors = [
          "rgba(250, 225, 185, ",
          "rgba(240, 195, 140, ",
          "rgba(225, 160, 110, ",
          "rgba(215, 140, 80, ",
        ];
        return {
          x,
          y,
          size: Math.random() * 3.5 + 1,
          vx: (Math.random() - 0.5) * 0.1,
          vy: Math.random() * 0.2 + 0.1, // slow elegant descent
          color: goldColors[Math.floor(Math.random() * goldColors.length)],
          alpha: Math.random() * 0.9 + 0.1,
          shape: "star",
          angle: Math.random() * Math.PI,
          spin: (Math.random() - 0.5) * 0.01,
        };
      } else {
        // Playful confetti bubbles
        const brightColors = ["#ff4136", "#2ecc40", "#0074d9", "#ffdc00", "#f012be", "#7fdbff"];
        return {
          x,
          y,
          size: Math.random() * 8 + 3,
          vx: (Math.random() - 0.5) * 0.3,
          vy: -(Math.random() * 1.2 + 0.5), // bubble floating up
          color: brightColors[Math.floor(Math.random() * brightColors.length)],
          alpha: Math.random() * 0.5 + 0.4,
          shape: "bubble",
        };
      }
    };

    // Populate initial particles
    const maxParticles = theme === "cosmic" ? 150 : theme === "rose_gold" ? 100 : 70;
    for (let i = 0; i < maxParticles; i++) {
      particles.push(createParticle(false));
    }

    const drawStar = (cx: number, cy: number, spikes: number, outerRadius: number, innerRadius: number, color: string) => {
      let rot = (Math.PI / 2) * 3;
      let x = cx;
      let y = cy;
      const step = Math.PI / spikes;

      ctx.beginPath();
      ctx.moveTo(cx, cy - outerRadius);
      for (let i = 0; i < spikes; i++) {
        x = cx + Math.cos(rot) * outerRadius;
        y = cy + Math.sin(rot) * outerRadius;
        ctx.lineTo(x, y);
        rot += step;

        x = cx + Math.cos(rot) * innerRadius;
        y = cy + Math.sin(rot) * innerRadius;
        ctx.lineTo(x, y);
        rot += step;
      }
      ctx.lineTo(cx, cy - outerRadius);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
    };

    // Main animation step
    const render = () => {
      // Background clears or trails
      if (theme === "cosmic") {
        ctx.fillStyle = "rgba(10, 8, 20, 1)"; // dark cosmos
        ctx.fillRect(0, 0, dimensions.width, dimensions.height);
        
        // Nebula glow in corner
        const gradient = ctx.createRadialGradient(
          dimensions.width * 0.2,
          dimensions.height * 0.3,
          10,
          dimensions.width * 0.2,
          dimensions.height * 0.3,
          dimensions.width * 0.6
        );
        gradient.addColorStop(0, "rgba(50, 20, 100, 0.3)");
        gradient.addColorStop(0.5, "rgba(30, 10, 60, 0.1)");
        gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, dimensions.width, dimensions.height);
      } else if (theme === "neon") {
        ctx.fillStyle = "rgba(13, 10, 25, 0.9)"; // cyber charcoal dark
        ctx.fillRect(0, 0, dimensions.width, dimensions.height);

        // Grid lines (retro wave synthwave grid)
        ctx.strokeStyle = "rgba(255, 0, 127, 0.06)";
        ctx.lineWidth = 1;
        const gridGap = 40;
        
        // Perspective vertical lines
        const horizonY = dimensions.height * 0.45;
        for (let x = -dimensions.width; x < dimensions.width * 2; x += gridGap) {
          ctx.beginPath();
          ctx.moveTo(dimensions.width / 2 + x * 0.1, horizonY);
          ctx.lineTo(x, dimensions.height);
          ctx.stroke();
        }
        
        // Horizontal grid lines
        for (let y = horizonY; y < dimensions.height; y += 25) {
          const depth = (y - horizonY) / (dimensions.height - horizonY);
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(dimensions.width, y);
          ctx.strokeStyle = `rgba(0, 243, 255, ${0.1 * depth})`;
          ctx.stroke();
        }
      } else if (theme === "rose_gold") {
        // luxury champagne background
        const bgGrad = ctx.createLinearGradient(0, 0, 0, dimensions.height);
        bgGrad.addColorStop(0, "#1c1410");
        bgGrad.addColorStop(1, "#120a06");
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, dimensions.width, dimensions.height);
      } else {
        // playful confetti pastel background
        const bgGrad = ctx.createLinearGradient(0, 0, dimensions.width, dimensions.height);
        bgGrad.addColorStop(0, "#081b15");
        bgGrad.addColorStop(1, "#030c0a");
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, dimensions.width, dimensions.height);
      }

      // Update and draw particles
      particles.forEach((p, idx) => {
        // Physics update
        p.x += p.vx;
        p.y += p.vy;

        if (theme === "cosmic") {
          // Twinkle twinkle
          if (p.decay) {
            p.alpha += p.decay;
            if (p.alpha > 1 || p.alpha < 0.1) {
              p.decay = -p.decay;
            }
          }
          ctx.fillStyle = p.color.replace(/[\d.]+\)$/, `${Math.max(0, p.alpha)})`);
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        } else if (theme === "neon") {
          if (p.spin && p.angle !== undefined) p.angle += p.spin;
          ctx.save();
          ctx.translate(p.x, p.y);
          if (p.angle !== undefined) ctx.rotate(p.angle);
          ctx.fillStyle = p.color;
          ctx.shadowBlur = 10;
          ctx.shadowColor = p.color;
          ctx.globalAlpha = p.alpha;
          
          if (p.shape === "square") {
            ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
          } else {
            ctx.beginPath();
            ctx.arc(0, 0, p.size, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.restore();
        } else if (theme === "rose_gold") {
          if (p.spin && p.angle !== undefined) p.angle += p.spin;
          ctx.save();
          ctx.translate(p.x, p.y);
          if (p.angle !== undefined) ctx.rotate(p.angle);
          ctx.globalAlpha = p.alpha;
          
          drawStar(0, 0, 4, p.size * 1.5, p.size * 0.4, p.color + p.alpha + ")");
          ctx.restore();
        } else if (theme === "playful") {
          // Draw floating shiny bubbles
          ctx.save();
          ctx.globalAlpha = p.alpha;
          ctx.strokeStyle = p.color;
          ctx.fillStyle = p.color + "11"; // semi transparent
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // Bubble shine highlight
          ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
          ctx.beginPath();
          ctx.arc(p.x - p.size * 0.3, p.y - p.size * 0.3, p.size * 0.2, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }

        // Boundary recycling
        if (
          p.x < -50 ||
          p.x > dimensions.width + 50 ||
          p.y < -50 ||
          p.y > dimensions.height + 50
        ) {
          particles[idx] = createParticle(true);
        }
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [theme, dimensions]);

  return (
    <div
      ref={containerRef}
      id="theme-background-container"
      className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-0"
    >
      <canvas ref={canvasRef} id="theme-background-canvas" className="w-full h-full block" />
    </div>
  );
}
