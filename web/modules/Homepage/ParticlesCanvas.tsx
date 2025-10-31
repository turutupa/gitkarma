'use client';

import React, { useEffect, useRef } from 'react';
import styles from './ParticlesCanvas.module.css';

interface Particle {
  x: number;
  y: number;
  size: number;
  baseSize: number;
  color: string;
  speedX: number;
  speedY: number;
}

const ParticlesCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationIdRef = useRef<number | null>(null);
  const particlesRef = useRef<Particle[]>([]);

  // Random neon colors
  const getRandomColor = () => {
    const colors = ['#ff2a6d', '#05d9e8', '#a239ea', '#39ff14'];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  // Initialize particles
  const initParticles = (width: number, height: number) => {
    const particles: Particle[] = [];
    for (let i = 0; i < 100; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 5 + 1,
        baseSize: Math.random() * 5 + 1,
        color: getRandomColor(),
        speedX: Math.random() * 3 - 1.5,
        speedY: Math.random() * 3 - 1.5,
      });
    }
    particlesRef.current = particles;
  };

  // Resize canvas
  const resizeCanvas = (canvas: HTMLCanvasElement) => {
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
  };

  // Animation loop
  const animate = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Gradient background
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#070610');
    gradient.addColorStop(1, '#0f0e17');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const particles = particlesRef.current;

    particles.forEach((p) => {
      // Gentle pulsing (simulated "beat" without audio)
      const time = Date.now() * 0.001;
      const beatPulse = Math.sin(time + p.x * 0.01) * 0.3 + 0.7;
      const targetSize = p.baseSize + beatPulse * 3;
      p.size = p.size * 0.95 + targetSize * 0.05;

      // Update position
      p.x += p.speedX;
      p.y += p.speedY;

      // Bounce off edges
      if (p.x < 0 || p.x > canvas.width) {
        p.speedX *= -1;
      }
      if (p.y < 0 || p.y > canvas.height) {
        p.speedY *= -1;
      }

      // Reset if too far off-screen
      if (p.x < -50 || p.x > canvas.width + 50 || p.y < -50 || p.y > canvas.height + 50) {
        p.x = Math.random() * canvas.width;
        p.y = Math.random() * canvas.height;
        p.speedX = Math.random() * 3 - 1.5;
        p.speedY = Math.random() * 3 - 1.5;
      }

      // Draw particle with glow
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.shadowBlur = 15;
      ctx.shadowColor = p.color;
      ctx.fill();
    });

    ctx.shadowBlur = 0; // Reset shadow

    animationIdRef.current = requestAnimationFrame(() => animate(ctx, canvas));
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    // Set initial size
    resizeCanvas(canvas);
    initParticles(canvas.width, canvas.height);

    // Handle resize
    const handleResize = () => {
      resizeCanvas(canvas);
      initParticles(canvas.width, canvas.height);
    };

    window.addEventListener('resize', handleResize);

    // Start animation
    animate(ctx, canvas);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
    };
  }, []);

  return <canvas ref={canvasRef} className={styles.canvas} />;
};

export default ParticlesCanvas;
