'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence, useMotionValue, useSpring } from 'framer-motion'
import { Check, Loader2, Sparkles, Star, Zap, Shield, Award, Heart, User, Feather, Target, Calendar, Gift } from 'lucide-react'

// Luxury Font Imports
const fontImportStyle = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;800&family=Cormorant+Garamond:ital,wght@0,400;1,400&family=Montserrat:wght@400;500;600&display=swap');
`

// Luxury Tooltip Styles
const tooltipStyles = `
  .shadow-luxury-tooltip {
    box-shadow:
      0 20px 50px rgba(139, 21, 56, 0.15),
      0 10px 25px rgba(0, 0, 0, 0.08),
      0 0 30px rgba(255, 183, 0, 0.25),
      inset 0 1px 0 rgba(255, 255, 255, 0.8);
  }

  .luxury-gold-gradient {
    background: linear-gradient(135deg, #FFB700 0%, #FFC740 50%, #FFB700 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .tooltip-shimmer {
    position: relative;
    overflow: hidden;
  }

  .tooltip-shimmer::after {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      90deg,
      transparent 0%,
      rgba(255, 183, 0, 0.15) 50%,
      transparent 100%
    );
    animation: shimmerPass 3s ease-in-out 0.4s;
    pointer-events: none;
  }

  @keyframes shimmerPass {
    0% { left: -100%; }
    100% { left: 100%; }
  }

  @keyframes fadeInScale {
    0% {
      opacity: 0;
      transform: translateX(-50%) translateY(-12px) scale(0.92);
      filter: blur(4px);
    }
    100% {
      opacity: 1;
      transform: translateX(-50%) translateY(0) scale(1);
      filter: blur(0px);
    }
  }

  @keyframes fadeOutScale {
    0% {
      opacity: 1;
      transform: translateX(-50%) translateY(0) scale(1);
      filter: blur(0px);
    }
    100% {
      opacity: 0;
      transform: translateX(-50%) translateY(-8px) scale(0.95);
      filter: blur(2px);
    }
  }
`

// Tooltip Animation Variants
const tooltipVariants = {
  hidden: {
    opacity: 0,
    scale: 0.92,
    y: -12,
    filter: "blur(4px)",
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      duration: 0.4,
      ease: [0.34, 1.56, 0.64, 1], // Spring easing
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: -8,
    filter: "blur(2px)",
    transition: {
      duration: 0.25,
      ease: [0.4, 0, 1, 1],
    },
  },
}

const textStagger = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: "easeOut" },
  },
}

// Crystal Snow Globe Collection Color Palette
const colors = {
  // Primary Colors
  ivoryCream: '#FFF8E7',      // 40% - Main background
  emeraldGreen: '#165743',    // 30% - Headers, accents
  champagneGold: '#D4AF37',   // 30% - Highlights, CTAs

  // Supporting Colors
  softCream: '#FFFEF9',
  deepEmerald: '#0F3A2B',
  brightGold: '#F4E4BC',
  shadowBrown: '#8B4513',
  woodBrown: '#654321',

  // Glass Effects
  glassWhite: 'rgba(255, 255, 255, 0.8)',
  glassFrost: 'rgba(255, 255, 255, 0.3)',
  glassReflection: 'rgba(255, 255, 255, 0.9)',

  // Text Colors
  textPrimary: '#165743',
  textSecondary: '#2A5A45',
  textMuted: '#4A6B5F', // Darker shade for WCAG AA compliance (4.8:1 contrast)
}

// Particle Physics System for Snow Globes
interface Particle {
  id: number
  x: number
  y: number
  vx: number
  vy: number
  size: number
  color: string
  type: 'snow' | 'gold' | 'sparkle'
}

// Snow Globe Component with Physics
const SnowGlobe = ({
  title,
  subtitle,
  discount,
  originalPrice,
  icon,
  tint,
  globeId,
  prefersReducedMotion = false
}: {
  title: string
  subtitle: string
  discount: string
  originalPrice?: string
  icon: React.ReactNode
  tint: 'gold' | 'clear' | 'emerald'
  globeId: number
  prefersReducedMotion?: boolean
}) => {
  const [particles, setParticles] = useState<Particle[]>([])
  const [isShaking, setIsShaking] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 })
  const animationRef = useRef<number | undefined>(undefined)
  const globeRef = useRef<HTMLDivElement>(null)

  // Initialize particles
  useEffect(() => {
    const initialParticles: Particle[] = []
    const particleCount = 40

    for (let i = 0; i < particleCount; i++) {
      const particleType = i < 20 ? 'snow' : (i < 30 ? 'gold' : 'sparkle')
      initialParticles.push({
        id: i,
        x: Math.random() * 200 - 100,
        y: Math.random() * 150 - 75,
        vx: (Math.random() - 0.5) * 0.5,
        vy: Math.random() * 0.5 + 0.5,
        size: particleType === 'sparkle' ? 2 : (3 + Math.random() * 3),
        color: particleType === 'gold' ? colors.champagneGold :
               particleType === 'sparkle' ? colors.brightGold : '#FFFFFF',
        type: particleType
      })
    }
    setParticles(initialParticles)
  }, [])

  // Physics animation loop
  useEffect(() => {
    // Skip physics animations if user prefers reduced motion
    if (prefersReducedMotion) {
      // Set particles to static positions at bottom of globe
      setParticles(prev => prev.map(particle => ({
        ...particle,
        y: 60 + Math.random() * 10,
        x: (Math.random() - 0.5) * 80,
        vx: 0,
        vy: 0
      })))
      return
    }

    const animate = () => {
      setParticles(prev => prev.map(particle => {
        let { x, y, vx, vy } = particle
        const gravity = 0.15
        const friction = 0.99
        const shakeMultiplier = isShaking ? 5 : 1

        // Apply gravity
        vy += gravity

        // Apply shake velocity
        vx *= shakeMultiplier
        vy *= shakeMultiplier * 0.8

        // Update position
        x += vx
        y += vy

        // Collision with globe bottom (circular boundary)
        const radius = 90
        const distFromCenter = Math.sqrt(x * x + y * y)

        if (distFromCenter > radius) {
          // Bounce off the globe edge
          const angle = Math.atan2(y, x)
          x = Math.cos(angle) * radius * 0.95
          y = Math.sin(angle) * radius * 0.95

          // Reflect velocity
          vx *= -0.5
          vy *= -0.3
        }

        // Bottom collision (settle particles)
        if (y > 70) {
          y = 70
          vy *= -0.2
          vx *= friction
        }

        // Apply friction
        vx *= friction
        vy *= friction

        // Random drift
        if (!isShaking) {
          vx += (Math.random() - 0.5) * 0.1
        }

        return { ...particle, x, y, vx, vy }
      }))

      animationRef.current = requestAnimationFrame(animate)
    }

    animationRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isShaking, prefersReducedMotion])

  // Shake animation on hover (disabled if user prefers reduced motion)
  const handleMouseEnter = () => {
    if (!prefersReducedMotion) {
      setIsShaking(true)
      // Reset after shake animation
      setTimeout(() => setIsShaking(false), 2000)
    }
  }

  // Pick up globe interaction (disabled if user prefers reduced motion)
  const handleGlobeClick = () => {
    if (!isDragging && !prefersReducedMotion) {
      setIsDragging(true)
      setTimeout(() => {
        setIsDragging(false)
        setDragPosition({ x: 0, y: 0 })
      }, 3000)
    }
  }

  // Tint colors based on globe type
  const getTintStyles = () => {
    switch(tint) {
      case 'gold':
        return {
          background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.1), rgba(244, 228, 188, 0.05))',
          border: '2px solid rgba(212, 175, 55, 0.3)',
        }
      case 'emerald':
        return {
          background: 'linear-gradient(135deg, rgba(22, 87, 67, 0.1), rgba(42, 90, 69, 0.05))',
          border: '2px solid rgba(22, 87, 67, 0.3)',
        }
      default:
        return {
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))',
          border: '2px solid rgba(255, 255, 255, 0.3)',
        }
    }
  }

  return (
    <motion.div
      className="snow-globe-container relative"
      onMouseEnter={handleMouseEnter}
      onClick={handleGlobeClick}
      animate={{
        x: dragPosition.x,
        y: dragPosition.y,
        scale: isDragging ? 1.1 : 1,
        zIndex: isDragging ? 100 : 1,
      }}
      transition={{ type: 'spring', stiffness: 100, damping: 10 }}
      style={{ cursor: isDragging ? 'grabbing' : 'pointer' }}
    >
      {/* Snow Globe */}
      <motion.div
        ref={globeRef}
        className="snow-globe relative mx-auto"
        animate={isShaking && !prefersReducedMotion ? {
          rotate: [-5, 5, -5, 5, -5, 5, -5, 5, 0],
        } : {}}
        transition={{ duration: 0.8, ease: 'easeInOut' }}
        style={{ width: '250px', height: '250px' }}
      >
        {/* Glass Sphere */}
        <div
          className="glass-sphere absolute inset-0 rounded-full overflow-hidden"
          style={{
            ...getTintStyles(),
            boxShadow: `
              inset 0 0 20px rgba(255, 255, 255, 0.5),
              0 10px 30px rgba(0, 0, 0, 0.2),
              0 0 60px rgba(212, 175, 55, 0.1)
            `,
            backdropFilter: 'blur(2px)',
          }}
        >
          {/* Interior Scenes */}
          {globeId === 1 && <GlobeInteriorMesotherapy isShaking={isShaking} />}
          {globeId === 2 && <GlobeInteriorTattooRemoval isShaking={isShaking} />}
          {globeId === 3 && <GlobeInteriorWeightLoss isShaking={isShaking} />}

          {/* Glass Reflection */}
          <div
            className="absolute rounded-full"
            style={{
              width: '40%',
              height: '40%',
              top: '10%',
              left: '15%',
              background: `radial-gradient(circle at 30% 30%, ${colors.glassReflection}, transparent)`,
              opacity: isShaking ? 0.85 : 1,
              transition: 'opacity 0.3s',
            }}
          />

          {/* Particles - rendered in front of images */}
          <div className="particles-container absolute inset-0" style={{ zIndex: 10 }}>
            {particles.map(particle => (
              <motion.div
                key={particle.id}
                className="particle absolute"
                style={{
                  width: `${particle.size}px`,
                  height: `${particle.size}px`,
                  borderRadius: '50%',
                  background: particle.type === 'sparkle'
                    ? `radial-gradient(circle, ${particle.color}, transparent)`
                    : particle.color,
                  boxShadow: particle.type === 'sparkle'
                    ? `0 0 ${particle.size * 2}px ${particle.color}`
                    : 'none',
                  left: '50%',
                  top: '50%',
                  transform: `translate(${particle.x}px, ${particle.y}px) translate(-50%, -50%)`,
                  zIndex: 10,
                }}
                animate={{
                  opacity: particle.type === 'sparkle' ? [0.3, 1, 0.3] : 1,
                }}
                transition={{
                  opacity: { duration: 1 + Math.random(), repeat: Infinity },
                }}
              />
            ))}
          </div>

          {/* Removed Globe Content Icon - only photos with snow particles */}
        </div>
      </motion.div>

      {/* Wooden Stand with Wood Grain */}
      <motion.div
        className="wooden-stand relative mt-[-20px] mx-auto"
        style={{
          width: '180px',
          height: '80px',
          background: `linear-gradient(180deg, ${colors.shadowBrown} 0%, ${colors.woodBrown} 100%)`,
          borderRadius: '0 0 20px 20px',
          boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)',
        }}
        whileHover={{
          boxShadow: '0 6px 12px rgba(0, 0, 0, 0.4)',
        }}
      >
        {/* Wood Grain Texture */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `repeating-linear-gradient(
              90deg,
              transparent,
              transparent 10px,
              rgba(0, 0, 0, 0.1) 10px,
              rgba(0, 0, 0, 0.1) 20px
            )`,
            borderRadius: '0 0 20px 20px',
          }}
        />

        {/* Brass Plaque */}
        <div
          className="brass-plaque absolute bottom-3 left-1/2 transform -translate-x-1/2"
          style={{
            background: `linear-gradient(135deg, ${colors.champagneGold}, ${colors.brightGold})`,
            padding: '8px 20px',
            borderRadius: '4px',
            boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.3)',
          }}
        >
          <div
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: '14px',
              fontStyle: 'italic',
              color: colors.deepEmerald,
              fontWeight: 600,
              textAlign: 'center',
            }}
          >
            <div>{title}</div>
            <div style={{ fontSize: '16px', fontWeight: 700 }}>{discount}</div>
            {originalPrice && (
              <div style={{ fontSize: '11px', opacity: 0.8 }}>Regular {originalPrice}</div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

// Globe Interior - Mesotherapy: Inner Radiance (Lifestyle Image)
const GlobeInteriorMesotherapy = ({ isShaking = false }: { isShaking?: boolean }) => {
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; size: number; opacity: number; delay: number; duration: number }>>([])

  useEffect(() => {
    // Generate more particles when shaking for enhanced effect
    const particleCount = isShaking ? 50 : 35
    const generatedParticles = Array.from({ length: particleCount }, (_, i) => ({
      id: i,
      x: Math.random() * 100,        // Random X: 0-100% width
      y: Math.random() * 100,        // Random Y: 0-100% FULL HEIGHT
      size: 2 + Math.random() * 4,   // Varied sizes: 2-6px for depth
      opacity: 0.3 + Math.random() * 0.6,  // Varied opacity: 0.3-0.9 for realism
      delay: Math.random() * 3,      // Stagger start times 0-3s
      duration: isShaking ? (3 + Math.random() * 2) : (8 + Math.random() * 7),  // 3-5s when shaking, 8-15s idle
    }))
    setParticles(generatedParticles)
  }, [isShaking])

  return (
    <div className="absolute inset-0 overflow-hidden rounded-full">
      <img
        src="/hana-mesotherapy.jpg"
        alt="Radiant skin"
        className="absolute inset-0 w-full h-full"
        style={{
          objectFit: 'cover',
          objectPosition: 'center 32%',
          clipPath: 'circle(45% at center)',
          filter: 'brightness(0.9) contrast(1.1)',
          zIndex: 0,
        }}
      />
      {/* Gradient overlay for warmth */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(180deg, rgba(15, 58, 43, 0.15) 0%, rgba(212, 175, 55, 0.1) 100%)',
          zIndex: 1,
        }}
      />
      {/* Snow particles */}
      <div className="absolute inset-0" style={{ zIndex: 10 }}>
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            className="absolute rounded-full bg-white"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`, // Use the random Y position
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              opacity: particle.opacity,
              zIndex: 10,
            }}
            animate={{
              // Gentle circular/drift motion for natural snow physics
              x: isShaking
                ? [0, 20, -15, 10, -20, 0]   // Chaotic swirl when shaking
                : [0, 5, -5, 3, -3, 0],       // Gentle drift when idle
              y: isShaking
                ? [0, -15, 20, -10, 15, 0]   // Chaotic vertical swirl
                : [0, 3, -3, 5, -5, 0],       // Gentle float up and down
            }}
            transition={{
              duration: particle.duration,
              repeat: Infinity,
              delay: particle.delay,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>
    </div>
  )
}

// Globe Interior - Tattoo Removal: Fresh Canvas (Lifestyle Image)
const GlobeInteriorTattooRemoval = ({ isShaking = false }: { isShaking?: boolean }) => {
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; size: number; opacity: number; delay: number; duration: number }>>([])

  useEffect(() => {
    // Generate more particles when shaking for enhanced effect
    const particleCount = isShaking ? 50 : 35
    const generatedParticles = Array.from({ length: particleCount }, (_, i) => ({
      id: i,
      x: Math.random() * 100,        // Random X: 0-100% width
      y: Math.random() * 100,        // Random Y: 0-100% FULL HEIGHT
      size: 2 + Math.random() * 4,   // Varied sizes: 2-6px for depth
      opacity: 0.3 + Math.random() * 0.6,  // Varied opacity: 0.3-0.9 for realism
      delay: Math.random() * 3,      // Stagger start times 0-3s
      duration: isShaking ? (3 + Math.random() * 2) : (8 + Math.random() * 7),  // 3-5s when shaking, 8-15s idle
    }))
    setParticles(generatedParticles)
  }, [isShaking])

  return (
    <div className="absolute inset-0 overflow-hidden rounded-full">
      <img
        src="/hana-tattoo-removal.jpg"
        alt="Confident woman"
        className="absolute inset-0 w-full h-full"
        style={{
          objectFit: 'cover',
          objectPosition: 'center 5%',
          clipPath: 'circle(45% at center)',
          filter: 'brightness(0.9) contrast(1.1)',
          zIndex: 0,
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(180deg, rgba(26, 31, 46, 0.2) 0%, rgba(74, 85, 104, 0.1) 100%)',
          zIndex: 1,
        }}
      />
      {/* Snow particles */}
      <div className="absolute inset-0" style={{ zIndex: 10 }}>
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            className="absolute rounded-full bg-white"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`, // Use the random Y position
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              opacity: particle.opacity,
              zIndex: 10,
            }}
            animate={{
              // Gentle circular/drift motion for natural snow physics
              x: isShaking
                ? [0, 20, -15, 10, -20, 0]   // Chaotic swirl when shaking
                : [0, 5, -5, 3, -3, 0],       // Gentle drift when idle
              y: isShaking
                ? [0, -15, 20, -10, 15, 0]   // Chaotic vertical swirl
                : [0, 3, -3, 5, -5, 0],       // Gentle float up and down
            }}
            transition={{
              duration: particle.duration,
              repeat: Infinity,
              delay: particle.delay,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>
    </div>
  )
}

// Globe Interior - Weight Loss: Transformation Journey (Lifestyle Image)
const GlobeInteriorWeightLoss = ({ isShaking = false }: { isShaking?: boolean }) => {
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; size: number; opacity: number; delay: number; duration: number }>>([])

  useEffect(() => {
    // Generate more particles when shaking for enhanced effect
    const particleCount = isShaking ? 50 : 35
    const generatedParticles = Array.from({ length: particleCount }, (_, i) => ({
      id: i,
      x: Math.random() * 100,        // Random X: 0-100% width
      y: Math.random() * 100,        // Random Y: 0-100% FULL HEIGHT
      size: 2 + Math.random() * 4,   // Varied sizes: 2-6px for depth
      opacity: 0.3 + Math.random() * 0.6,  // Varied opacity: 0.3-0.9 for realism
      delay: Math.random() * 3,      // Stagger start times 0-3s
      duration: isShaking ? (3 + Math.random() * 2) : (8 + Math.random() * 7),  // 3-5s when shaking, 8-15s idle
    }))
    setParticles(generatedParticles)
  }, [isShaking])

  return (
    <div className="absolute inset-0 overflow-hidden rounded-full">
      <img
        src="/hana-weight-loss.jpg"
        alt="Confident transformation"
        className="absolute inset-0 w-full h-full"
        style={{
          objectFit: 'cover',
          objectPosition: 'center 22%',
          clipPath: 'circle(45% at center)',
          filter: 'brightness(0.9) contrast(1.1)',
          zIndex: 0,
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(165deg, rgba(12, 20, 69, 0.2) 0%, rgba(255, 215, 0, 0.1) 100%)',
          zIndex: 1,
        }}
      />
      {/* Snow particles */}
      <div className="absolute inset-0" style={{ zIndex: 10 }}>
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            className="absolute rounded-full bg-white"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`, // Use the random Y position
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              opacity: particle.opacity,
              zIndex: 10,
            }}
            animate={{
              // Gentle circular/drift motion for natural snow physics
              x: isShaking
                ? [0, 20, -15, 10, -20, 0]   // Chaotic swirl when shaking
                : [0, 5, -5, 3, -3, 0],       // Gentle drift when idle
              y: isShaking
                ? [0, -15, 20, -10, 15, 0]   // Chaotic vertical swirl
                : [0, 3, -3, 5, -5, 0],       // Gentle float up and down
            }}
            transition={{
              duration: particle.duration,
              repeat: Infinity,
              delay: particle.delay,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>
    </div>
  )
}

// Background Snowfall Component
const BackgroundSnowfall = () => {
  const [snowflakes, setSnowflakes] = useState<Array<{
    id: number
    x: number
    size: number
    duration: number
    delay: number
    opacity: number
    drift: number
  }>>([])

  useEffect(() => {
    const generated = Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      size: 2 + Math.random() * 4,
      duration: 12 + Math.random() * 18,
      delay: Math.random() * 10,
      opacity: 0.2 + Math.random() * 0.3,
      drift: Math.random() * 30 - 15,
    }))
    setSnowflakes(generated)
  }, [])

  if (snowflakes.length === 0) return null

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 1 }}>
      {snowflakes.map(flake => (
        <motion.div
          key={flake.id}
          className="absolute"
          style={{
            left: `${flake.x}%`,
            width: `${flake.size}px`,
            height: `${flake.size}px`,
            borderRadius: '50%',
            background: 'white',
            opacity: flake.opacity,
          }}
          animate={{
            y: ['-10vh', '110vh'],
            x: [0, flake.drift],
          }}
          transition={{
            duration: flake.duration,
            delay: flake.delay,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      ))}
    </div>
  )
}

// Form Field with Snowflake Melt Animation
const FormField = ({
  label,
  type = 'text',
  value,
  onChange,
  error,
  placeholder,
  name,
  prefersReducedMotion = false,
}: {
  label: string
  type?: string
  value: string
  onChange: (value: string) => void
  error?: string
  placeholder?: string
  name: string
  prefersReducedMotion?: boolean
}) => {
  const [isFocused, setIsFocused] = useState(false)
  const [showSnowflake, setShowSnowflake] = useState(false)

  const handleFocus = () => {
    setIsFocused(true)
    if (!prefersReducedMotion) {
      setShowSnowflake(true)
      // Melt animation after 500ms
      setTimeout(() => setShowSnowflake(false), 500)
    }
  }

  return (
    <div className="relative">
      <label
        htmlFor={name}
        style={{
          fontFamily: "'Montserrat', sans-serif",
          fontSize: '14px',
          fontWeight: 500,
          color: colors.emeraldGreen,
        }}
      >
        {label}
      </label>
      <div className="relative mt-1">
        <input
          id={name}
          name={name}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          onFocus={handleFocus}
          onBlur={() => setIsFocused(false)}
          className="w-full px-4 py-3 rounded-lg transition-all duration-300"
          style={{
            background: isFocused ? colors.softCream : 'white',
            border: `2px solid ${error ? '#ef4444' : isFocused ? colors.champagneGold : colors.emeraldGreen}`,
            color: colors.textPrimary,
            fontFamily: "'Montserrat', sans-serif",
            fontSize: '16px',
            outline: 'none',
          }}
        />

        {/* Snowflake Icon on Focus */}
        <AnimatePresence>
          {showSnowflake && (
            <motion.div
              className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
              initial={{ scale: 1, opacity: 1 }}
              animate={{ scale: 0, opacity: 0 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              style={{
                fontSize: '20px',
              }}
            >
              ❄️
            </motion.div>
          )}
        </AnimatePresence>

        {error && (
          <motion.p
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm mt-1"
            style={{ color: '#ef4444' }}
          >
            {error}
          </motion.p>
        )}
      </div>
    </div>
  )
}

// Success Snow Globe Component
const SuccessSnowGlobe = () => {
  const [particles, setParticles] = useState<Array<{ id: number, angle: number }>>([])

  useEffect(() => {
    const newParticles = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      angle: (i * 18) + Math.random() * 10,
    }))
    setParticles(newParticles)
  }, [])

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0, y: 50 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ scale: 0, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 200, damping: 15 }}
      className="relative w-32 h-32 mx-auto"
    >
      {/* Mini Snow Globe */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: `linear-gradient(135deg, ${colors.glassWhite}, ${colors.glassFrost})`,
          border: `2px solid ${colors.champagneGold}`,
          boxShadow: `
            inset 0 0 20px rgba(255, 255, 255, 0.5),
            0 5px 20px rgba(0, 0, 0, 0.2)
          `,
        }}
      >
        {/* Checkmark */}
        <div className="absolute inset-0 flex items-center justify-center">
          <Check className="w-12 h-12" style={{ color: colors.emeraldGreen }} />
        </div>

        {/* Swirling Snow */}
        {particles.map((particle, i) => (
          <motion.div
            key={particle.id}
            className="absolute"
            style={{
              width: '3px',
              height: '3px',
              borderRadius: '50%',
              background: 'white',
              left: '50%',
              top: '50%',
            }}
            animate={{
              x: [0, Math.cos(particle.angle * Math.PI / 180) * 40, 0],
              y: [0, Math.sin(particle.angle * Math.PI / 180) * 40, 0],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 2,
              delay: i * 0.1,
              repeat: Infinity,
            }}
          />
        ))}
      </div>
    </motion.div>
  )
}

// Hover Tooltip Component for Treatment Descriptions
const HoverTooltip = ({
  children,
  text
}: {
  children: React.ReactNode
  text: string
}) => {
  const [isVisible, setIsVisible] = useState(false)

  return (
    <div className="relative">
      <div
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
      >
        {children}
      </div>
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            transition={{ duration: 0.2 }}
            className="absolute z-50 bottom-full mb-4 left-1/2 transform -translate-x-1/2 w-64 p-4 rounded-lg shadow-lg pointer-events-none"
            style={{
              background: colors.softCream,
              border: `2px solid ${colors.champagneGold}`,
            }}
          >
            <p
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: '16px',
                fontStyle: 'italic',
                color: colors.emeraldGreen,
                lineHeight: 1.4,
              }}
            >
              {text}
            </p>
            <div
              className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-px"
              style={{
                width: 0,
                height: 0,
                borderLeft: '8px solid transparent',
                borderRight: '8px solid transparent',
                borderTop: `8px solid ${colors.champagneGold}`,
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Treatment descriptions
const treatmentDescriptions = {
  mesotherapy: "Delicate micronutrient infusions that awaken your skin's natural luminosity. Gently resurface, deeply hydrate, and unveil radiant skin.",
  tattooRemoval: "Journey to renewed skin confidence with gentle laser technology. Reveal the clean canvas you envision—your fresh start begins here.",
  weightLoss: "Discover your strongest self with medically-guided weight loss designed around you. Science-backed, compassionately delivered."
}

// Main Component
export default function HanaBeautyDecember2025Page() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    service: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [showSuccessGlobe, setShowSuccessGlobe] = useState(false)
  const [snowBurst, setSnowBurst] = useState<{ x: number, y: number } | null>(null)
  const [consentChecked, setConsentChecked] = useState(false)
  const [showConsentError, setShowConsentError] = useState(false)
  const [hoveredGlobe, setHoveredGlobe] = useState<number | null>(null)

  // Scroll to form function
  const scrollToForm = () => {
    const formSection = document.getElementById('reservation-form');
    if (formSection) {
      formSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Detect user's motion preference for accessibility
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    // Check if user prefers reduced motion
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mediaQuery.matches)

    // Listen for changes to the preference
    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches)
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Form validation
  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) newErrors.name = 'Name is required'
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email'
    }
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone is required'
    } else if (!/^[\d\s\-\(\)\+]+$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number'
    }
    if (!formData.service) newErrors.service = 'Please select a service'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Submit handler with snow burst
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    // Check consent first
    if (!consentChecked) {
      setShowConsentError(true)
      return
    }

    if (!validateForm()) return

    // Get button position for snow burst
    const button = e.currentTarget.querySelector('button[type="submit"]')
    if (button) {
      const rect = button.getBoundingClientRect()
      setSnowBurst({
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
      })
    }

    setIsSubmitting(true)

    try {
      // Prepare payload for CRM
      const payload = {
        first_name: formData.name.split(' ')[0] || '',
        last_name: formData.name.split(' ').slice(1).join(' ') || '',
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        tags: ['Hana Beauty Holiday Promotion Form Submission'],
        object_id: '69305135-94d3-4c8f-805d-d1b82547192b', // Hana Beauty object ID
        custom_fields: {
          service_interest: formData.service, // Store in custom_fields JSONB
        },
        sms_consent: true,
        email_consent: true,
      }

      // Submit to API - check if we're on production or local
      const apiUrl = typeof window !== 'undefined' && window.location.hostname === 'crm.senovallc.com'
        ? 'https://crm.senovallc.com/api/v1/contacts/'
        : 'http://localhost:8000/api/v1/contacts/';

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) throw new Error('Failed to submit form')

      // Show success snow globe
      setShowSuccessGlobe(true)
      setTimeout(() => {
        setIsSubmitted(true)
      }, 2000)

    } catch (error) {
      console.error('Submission error:', error)
      alert('There was an error submitting your request. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle input changes
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: fontImportStyle }} />
      <style dangerouslySetInnerHTML={{ __html: tooltipStyles }} />
      <meta name="robots" content="noindex, nofollow" />

      <div
        className="min-h-screen relative"
        style={{
          background: 'linear-gradient(135deg, #8B1538 0%, #0F4C3A 35%, #2C5F4F 65%, #F5F0E8 100%)',
        }}
      >
        {/* Background Snowfall (disabled if user prefers reduced motion) */}
        {!prefersReducedMotion && <BackgroundSnowfall />}

        {/* Gold Snowflake Pattern Background */}
        <div
          className="fixed inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle, ${colors.champagneGold} 1px, transparent 1px)`,
            backgroundSize: '50px 50px',
          }}
        />

        {/* Snow Burst Animation on Submit (disabled if user prefers reduced motion) */}
        <AnimatePresence>
          {snowBurst && !prefersReducedMotion && (
            <>
              {Array.from({ length: 20 }, (_, i) => (
                <motion.div
                  key={i}
                  className="fixed pointer-events-none"
                  style={{
                    left: snowBurst.x,
                    top: snowBurst.y,
                    fontSize: '20px',
                    zIndex: 9999,
                  }}
                  initial={{ scale: 0, x: 0, y: 0 }}
                  animate={{
                    scale: [0, 1, 1],
                    x: (Math.random() - 0.5) * 200,
                    y: (Math.random() - 0.5) * 200,
                    opacity: [1, 1, 0],
                  }}
                  exit={{ opacity: 0 }}
                  transition={{
                    duration: 1.5,
                    ease: 'easeOut',
                  }}
                  onAnimationComplete={() => {
                    if (i === 0) setSnowBurst(null)
                  }}
                >
                  ❄️
                </motion.div>
              ))}
            </>
          )}
        </AnimatePresence>

        {/* Success Snow Globe Modal */}
        <AnimatePresence>
          {showSuccessGlobe && (
            <motion.div
              className="fixed inset-0 flex items-center justify-center z-50"
              style={{ background: 'rgba(0, 0, 0, 0.5)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <SuccessSnowGlobe />
            </motion.div>
          )}
        </AnimatePresence>

        <div className="relative z-10 container mx-auto px-4 py-12">
          {!isSubmitted ? (
            <>
              {/* Hero Section */}
              <motion.section
                initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 20 }}
                animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
                transition={prefersReducedMotion ? { duration: 0.3 } : { duration: 0.8 }}
                className="text-center mb-16 relative"
              >
                {/* Hana Beauty Logo - Absolute Top Left */}
                <div className="absolute top-[70px] md:top-[85px] left-4 z-50">
                  <div className="flex flex-col">
                    <span
                      className="text-2xl md:text-3xl tracking-wider"
                      style={{
                        fontFamily: "'Playfair Display', serif",
                        fontWeight: 700,
                        color: '#D4AF37',
                        textShadow: '1px 1px 2px rgba(0, 0, 0, 0.3)',
                        letterSpacing: '0.1em'
                      }}
                    >
                      Hana Beauty
                    </span>
                    <span
                      className="text-xs md:text-sm tracking-widest mt-1"
                      style={{
                        fontFamily: "'Cormorant Garamond', serif",
                        fontWeight: 400,
                        fontStyle: 'italic',
                        color: '#D4AF37',
                        textShadow: '1px 1px 2px rgba(0, 0, 0, 0.3)',
                        letterSpacing: '0.15em'
                      }}
                    >
                      MEDSPA
                    </span>
                  </div>
                </div>

                <h1
                  style={{
                    fontFamily: "'Playfair Display', serif",
                    fontSize: 'clamp(3rem, 7vw, 4.5rem)',
                    fontWeight: 800,
                    color: '#FFFFFF',
                    textShadow: '2px 2px 8px rgba(0, 0, 0, 0.3)',
                    lineHeight: 1.1,
                    marginBottom: '1rem',
                  }}
                >
                  Unwrap Your Most Radiant Self
                  <br />
                  This Holiday Season
                </h1>
                <p
                  style={{
                    fontFamily: "'Cormorant Garamond', serif",
                    fontSize: '28px',
                    fontStyle: 'italic',
                    color: '#F5F0E8',
                    textShadow: '1px 1px 4px rgba(0, 0, 0, 0.3)',
                  }}
                >
                  Give yourself the gift of transformation. Exclusive holiday treatments
                  designed to reveal your inner glow—because you deserve to shine.
                </p>
                <p
                  style={{
                    fontFamily: "'Montserrat', sans-serif",
                    fontSize: '18px',
                    fontWeight: 600,
                    color: colors.champagneGold,
                    textShadow: '1px 1px 3px rgba(0, 0, 0, 0.4)',
                    marginTop: '1rem',
                  }}
                >
                  Limited appointments available through December 31st
                </p>
              </motion.section>

              {/* Trust Bar Section */}
              <section className="py-12 md:py-16 px-4 bg-white/10 backdrop-blur-sm">
                <div className="max-w-6xl mx-auto">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {/* Trust Indicator 1 */}
                    <div className="text-center">
                      <Shield className="w-12 h-12 mx-auto mb-4 text-[#0F4C3A]" strokeWidth={1.5} />
                      <h3 className="font-semibold text-white mb-2 text-lg">Board-Certified Professionals</h3>
                      <p className="text-sm text-white/80">Every treatment performed by medical experts with specialized training and years of experience in advanced aesthetic medicine.</p>
                    </div>

                    {/* Trust Indicator 2 */}
                    <div className="text-center">
                      <Award className="w-12 h-12 mx-auto mb-4 text-[#0F4C3A]" strokeWidth={1.5} />
                      <h3 className="font-semibold text-white mb-2 text-lg">FDA-Approved Treatments</h3>
                      <p className="text-sm text-white/80">We exclusively use cutting-edge, clinically proven technologies that meet the highest safety standards in medical aesthetics.</p>
                    </div>

                    {/* Trust Indicator 3 */}
                    <div className="text-center">
                      <Heart className="w-12 h-12 mx-auto mb-4 text-[#0F4C3A]" strokeWidth={1.5} />
                      <h3 className="font-semibold text-white mb-2 text-lg">Proven Results</h3>
                      <p className="text-sm text-white/80">Thousands of satisfied clients have achieved their aesthetic goals through our personalized approach to beauty and wellness.</p>
                    </div>

                    {/* Trust Indicator 4 */}
                    <div className="text-center">
                      <Sparkles className="w-12 h-12 mx-auto mb-4 text-[#0F4C3A]" strokeWidth={1.5} />
                      <h3 className="font-semibold text-white mb-2 text-lg">Comfortable Experience</h3>
                      <p className="text-sm text-white/80">Luxurious environment with gentle techniques and attentive care ensuring your comfort throughout every step of your journey.</p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Snow Globes Section */}
              <section className="mb-20">
                <div className="grid lg:grid-cols-3 gap-12 max-w-6xl mx-auto">
                  {/* Mesotherapy Globe */}
                  <motion.div
                    initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, x: -50 }}
                    animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, x: 0 }}
                    transition={prefersReducedMotion ? { duration: 0.3 } : { delay: 0.2, duration: 0.8 }}
                    className="relative"
                    onMouseEnter={() => !isMobile && setHoveredGlobe(1)}
                    onMouseLeave={() => !isMobile && setHoveredGlobe(null)}
                  >
                    <SnowGlobe
                      title="Mesotherapy"
                      subtitle="Skin Rejuvenation"
                      discount="$200 OFF"
                      originalPrice=""
                      icon={<Sparkles />}
                      tint="gold"
                      globeId={1}
                      prefersReducedMotion={prefersReducedMotion}
                    />

                    {isMobile ? (
                      // Mobile: Static text below globe
                      <div className="text-center mt-4">
                        <h3 className="font-serif text-xl font-semibold text-white uppercase tracking-wider">
                          Mesotherapy
                        </h3>
                        <p className="text-2xl font-bold text-[#FFB700] mt-1">$200 OFF</p>
                        <p className="text-sm text-white/70">Customized treatment plans</p>
                        <p className="text-xs text-white/50 mt-2">Limited Time Only</p>
                      </div>
                    ) : (
                      // Desktop: Luxury tooltip on hover
                      <AnimatePresence>
                        {hoveredGlobe === 1 && (
                          <motion.div
                            className="absolute z-50 -translate-x-1/2 left-1/2 -top-4 -translate-y-full min-w-[280px] max-w-[320px] shadow-luxury-tooltip tooltip-shimmer rounded-2xl px-8 py-6 backdrop-blur-md pointer-events-none"
                            style={{
                              background: 'linear-gradient(135deg, #F5F0E8 0%, #FFFFFF 50%, #FFF9F0 100%)',
                              border: '3px solid #FFB700',
                              backdropFilter: 'blur(8px) brightness(1.1)',
                            }}
                            variants={tooltipVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                          >
                            <motion.div variants={textStagger}>
                              <h4
                                className="font-serif text-2xl font-semibold uppercase tracking-wider text-center"
                                style={{ color: '#0F4C3A' }}
                              >
                                Mesotherapy
                              </h4>
                            </motion.div>
                            <motion.div variants={textStagger}>
                              <p className="text-4xl font-bold uppercase tracking-wide text-center mt-2 luxury-gold-gradient">
                                $200 OFF
                              </p>
                            </motion.div>
                            <motion.div variants={textStagger}>
                              <p className="text-sm text-gray-500 opacity-75 text-center mt-2">
                                Customized treatment plans
                              </p>
                            </motion.div>
                            <motion.div variants={textStagger}>
                              <p
                                className="text-xs font-medium uppercase tracking-widest text-center mt-3"
                                style={{ color: '#8B1538' }}
                              >
                                Ends December 31st
                              </p>
                            </motion.div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    )}
                  </motion.div>

                  {/* Tattoo Removal Globe */}
                  <motion.div
                    initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 50 }}
                    animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
                    transition={prefersReducedMotion ? { duration: 0.3 } : { delay: 0.4, duration: 0.8 }}
                    className="relative"
                    onMouseEnter={() => !isMobile && setHoveredGlobe(2)}
                    onMouseLeave={() => !isMobile && setHoveredGlobe(null)}
                  >
                    <SnowGlobe
                      title="Tattoo Removal"
                      subtitle="Transformation"
                      discount="20% OFF"
                      icon={<Star />}
                      tint="clear"
                      globeId={2}
                      prefersReducedMotion={prefersReducedMotion}
                    />

                    {isMobile ? (
                      // Mobile: Static text below globe
                      <div className="text-center mt-4">
                        <h3 className="font-serif text-xl font-semibold text-white uppercase tracking-wider">
                          Tattoo Removal
                        </h3>
                        <p className="text-2xl font-bold text-[#FFB700] mt-1">20% OFF</p>
                        <p className="text-sm text-white/70">Start your journey today</p>
                        <p className="text-xs text-white/50 mt-2">Limited Time Only</p>
                      </div>
                    ) : (
                      // Desktop: Luxury tooltip on hover
                      <AnimatePresence>
                        {hoveredGlobe === 2 && (
                          <motion.div
                            className="absolute z-50 -translate-x-1/2 left-1/2 -top-4 -translate-y-full min-w-[280px] max-w-[320px] shadow-luxury-tooltip tooltip-shimmer rounded-2xl px-8 py-6 backdrop-blur-md pointer-events-none"
                            style={{
                              background: 'linear-gradient(135deg, #F5F0E8 0%, #FFFFFF 50%, #FFF9F0 100%)',
                              border: '3px solid #FFB700',
                              backdropFilter: 'blur(8px) brightness(1.1)',
                            }}
                            variants={tooltipVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                          >
                            <motion.div variants={textStagger}>
                              <h4
                                className="font-serif text-2xl font-semibold uppercase tracking-wider text-center"
                                style={{ color: '#0F4C3A' }}
                              >
                                Tattoo Removal
                              </h4>
                            </motion.div>
                            <motion.div variants={textStagger}>
                              <p className="text-4xl font-bold uppercase tracking-wide text-center mt-2 luxury-gold-gradient">
                                20% OFF
                              </p>
                            </motion.div>
                            <motion.div variants={textStagger}>
                              <p className="text-sm text-gray-500 opacity-75 text-center mt-2">
                                Start your journey today
                              </p>
                            </motion.div>
                            <motion.div variants={textStagger}>
                              <p
                                className="text-xs font-medium uppercase tracking-widest text-center mt-3"
                                style={{ color: '#8B1538' }}
                              >
                                Ends December 31st
                              </p>
                            </motion.div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    )}
                  </motion.div>

                  {/* Weight Loss Globe */}
                  <motion.div
                    initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, x: 50 }}
                    animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, x: 0 }}
                    transition={prefersReducedMotion ? { duration: 0.3 } : { delay: 0.6, duration: 0.8 }}
                    className="relative"
                    onMouseEnter={() => !isMobile && setHoveredGlobe(3)}
                    onMouseLeave={() => !isMobile && setHoveredGlobe(null)}
                  >
                    <SnowGlobe
                      title="New You! Weightloss"
                      subtitle="First Month"
                      discount="$50 OFF"
                      originalPrice=""
                      icon={<Zap />}
                      tint="emerald"
                      globeId={3}
                      prefersReducedMotion={prefersReducedMotion}
                    />

                    {isMobile ? (
                      // Mobile: Static text below globe
                      <div className="text-center mt-4">
                        <h3 className="font-serif text-xl font-semibold text-white uppercase tracking-wider">
                          Weight Loss
                        </h3>
                        <p className="text-2xl font-bold text-[#FFB700] mt-1">$50 OFF</p>
                        <p className="text-sm text-white/70">Transform this holiday</p>
                        <p className="text-xs text-white/50 mt-2">Limited Time Only</p>
                      </div>
                    ) : (
                      // Desktop: Luxury tooltip on hover
                      <AnimatePresence>
                        {hoveredGlobe === 3 && (
                          <motion.div
                            className="absolute z-50 -translate-x-1/2 left-1/2 -top-4 -translate-y-full min-w-[280px] max-w-[320px] shadow-luxury-tooltip tooltip-shimmer rounded-2xl px-8 py-6 backdrop-blur-md pointer-events-none"
                            style={{
                              background: 'linear-gradient(135deg, #F5F0E8 0%, #FFFFFF 50%, #FFF9F0 100%)',
                              border: '3px solid #FFB700',
                              backdropFilter: 'blur(8px) brightness(1.1)',
                            }}
                            variants={tooltipVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                          >
                            <motion.div variants={textStagger}>
                              <h4
                                className="font-serif text-2xl font-semibold uppercase tracking-wider text-center"
                                style={{ color: '#0F4C3A' }}
                              >
                                Weight Loss
                              </h4>
                            </motion.div>
                            <motion.div variants={textStagger}>
                              <p className="text-4xl font-bold uppercase tracking-wide text-center mt-2 luxury-gold-gradient">
                                $50 OFF
                              </p>
                            </motion.div>
                            <motion.div variants={textStagger}>
                              <p className="text-sm text-gray-500 opacity-75 text-center mt-2">
                                Transform this holiday
                              </p>
                            </motion.div>
                            <motion.div variants={textStagger}>
                              <p
                                className="text-xs font-medium uppercase tracking-widest text-center mt-3"
                                style={{ color: '#8B1538' }}
                              >
                                Ends December 31st
                              </p>
                            </motion.div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    )}
                  </motion.div>
                </div>
              </section>

              {/* Benefits Grid Section */}
              <section className="py-16 md:py-20 px-4">
                <div className="max-w-6xl mx-auto">
                  <h2
                    className="text-4xl md:text-5xl font-bold text-center mb-12 text-white"
                    style={{ fontFamily: "'Playfair Display', serif" }}
                  >
                    Why Choose Hana Beauty This Holiday Season
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Benefit 1 */}
                    <div className="bg-white/95 rounded-lg p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                      <Star className="w-10 h-10 mb-4 text-[#D4AF37]" strokeWidth={1.5} />
                      <h3 className="font-semibold text-lg mb-2 text-[#0F4C3A]">Expert, Certified Staff</h3>
                      <p className="text-sm text-gray-700">Our board-certified medical professionals bring years of specialized training to deliver safe, effective treatments tailored to your unique needs.</p>
                    </div>

                    {/* Benefit 2 */}
                    <div className="bg-white/95 rounded-lg p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                      <User className="w-10 h-10 mb-4 text-[#D4AF37]" strokeWidth={1.5} />
                      <h3 className="font-semibold text-lg mb-2 text-[#0F4C3A]">Personalized Treatment Plans</h3>
                      <p className="text-sm text-gray-700">No two clients are alike. We create custom solutions designed specifically for your skin type, goals, and desired timeline for transformation.</p>
                    </div>

                    {/* Benefit 3 */}
                    <div className="bg-white/95 rounded-lg p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                      <Zap className="w-10 h-10 mb-4 text-[#D4AF37]" strokeWidth={1.5} />
                      <h3 className="font-semibold text-lg mb-2 text-[#0F4C3A]">Advanced Technology</h3>
                      <p className="text-sm text-gray-700">Experience the latest innovations in aesthetic medicine with FDA-approved devices and proven techniques for optimal, lasting results.</p>
                    </div>

                    {/* Benefit 4 */}
                    <div className="bg-white/95 rounded-lg p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                      <Feather className="w-10 h-10 mb-4 text-[#D4AF37]" strokeWidth={1.5} />
                      <h3 className="font-semibold text-lg mb-2 text-[#0F4C3A]">Gentle, Minimal Downtime</h3>
                      <p className="text-sm text-gray-700">Get back to your holiday celebrations quickly with treatments designed for comfort and fast recovery, so you can glow without interruption.</p>
                    </div>

                    {/* Benefit 5 */}
                    <div className="bg-white/95 rounded-lg p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                      <Target className="w-10 h-10 mb-4 text-[#D4AF37]" strokeWidth={1.5} />
                      <h3 className="font-semibold text-lg mb-2 text-[#0F4C3A]">Visible, Lasting Results</h3>
                      <p className="text-sm text-gray-700">Watch your transformation unfold with treatments proven to deliver noticeable improvements that enhance your natural beauty and boost confidence.</p>
                    </div>

                    {/* Benefit 6 */}
                    <div className="bg-white/95 rounded-lg p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                      <Shield className="w-10 h-10 mb-4 text-[#D4AF37]" strokeWidth={1.5} />
                      <h3 className="font-semibold text-lg mb-2 text-[#0F4C3A]">Safety First, Always</h3>
                      <p className="text-sm text-gray-700">Your wellbeing is our priority. Every procedure follows strict medical protocols in our fully licensed, sterile medical spa environment.</p>
                    </div>

                    {/* Benefit 7 */}
                    <div className="bg-white/95 rounded-lg p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                      <Calendar className="w-10 h-10 mb-4 text-[#D4AF37]" strokeWidth={1.5} />
                      <h3 className="font-semibold text-lg mb-2 text-[#0F4C3A]">Flexible Scheduling</h3>
                      <p className="text-sm text-gray-700">We understand the holiday season is busy. Enjoy convenient appointment times that fit your schedule, including evening and weekend availability.</p>
                    </div>

                    {/* Benefit 8 */}
                    <div className="bg-white/95 rounded-lg p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                      <Gift className="w-10 h-10 mb-4 text-[#D4AF37]" strokeWidth={1.5} />
                      <h3 className="font-semibold text-lg mb-2 text-[#0F4C3A]">Exclusive Holiday Savings</h3>
                      <p className="text-sm text-gray-700">Celebrate yourself with limited-time offers available only through December 31st. Transform and save during our most generous promotion of the year.</p>
                    </div>
                  </div>

                  {/* CTA Button */}
                  <div className="text-center mt-12">
                    <button
                      onClick={scrollToForm}
                      className="bg-[#D4AF37] text-[#0F4C3A] px-10 py-4 rounded-lg font-semibold text-lg hover:bg-[#FFD700] hover:shadow-lg transition-all duration-300"
                    >
                      Claim Your Holiday Offer
                    </button>
                  </div>
                </div>
              </section>

              {/* Treatment Deep Dive Section */}
              <section className="py-16 md:py-20 px-4 bg-white/5">
                <div className="max-w-4xl mx-auto">
                  <h2
                    className="text-4xl md:text-5xl font-bold text-center mb-4 text-white"
                    style={{ fontFamily: "'Playfair Display', serif" }}
                  >
                    Your Holiday Transformation Options
                  </h2>
                  <p className="text-center text-white/80 mb-12 text-lg">
                    Discover which treatment is perfect for you
                  </p>

                  <div className="space-y-4">
                    {/* Treatment 1: Mesotherapy */}
                    <div className="bg-white/95 rounded-lg overflow-hidden">
                      <div className="p-6 bg-gradient-to-r from-[#0F4C3A] to-[#1a6b52]">
                        <h3 className="text-2xl font-bold text-white flex items-center">
                          <Sparkles className="w-6 h-6 mr-3 text-[#D4AF37]" />
                          Mesotherapy - Save $200
                        </h3>
                      </div>
                      <div className="p-6 space-y-4">
                        <div>
                          <h4 className="font-semibold text-[#0F4C3A] mb-2">What It Treats:</h4>
                          <p className="text-gray-700">Fine lines, uneven skin tone, dull complexion, loss of facial volume, and early signs of aging.</p>
                        </div>
                        <div>
                          <h4 className="font-semibold text-[#0F4C3A] mb-2">How It Works:</h4>
                          <p className="text-gray-700">Micro-injections of vitamins, antioxidants, and hyaluronic acid stimulate collagen production and cellular renewal for radiant, youthful skin.</p>
                        </div>
                        <div>
                          <h4 className="font-semibold text-[#0F4C3A] mb-2">Expected Results:</h4>
                          <p className="text-gray-700">Visible improvement in skin texture and glow within days. Optimal results appear after 3-4 sessions spaced 2-3 weeks apart.</p>
                        </div>
                        <div className="bg-[#D4AF37]/10 p-4 rounded-lg border border-[#D4AF37]">
                          <p className="text-[#0F4C3A] font-semibold">Holiday Offer: Save $200 - Pricing customized based on your treatment plan</p>
                        </div>
                      </div>
                    </div>

                    {/* Treatment 2: Tattoo Removal */}
                    <div className="bg-white/95 rounded-lg overflow-hidden">
                      <div className="p-6 bg-gradient-to-r from-[#8B1538] to-[#a01d45]">
                        <h3 className="text-2xl font-bold text-white flex items-center">
                          <Zap className="w-6 h-6 mr-3 text-[#D4AF37]" />
                          Tattoo Removal - 20% OFF
                        </h3>
                      </div>
                      <div className="p-6 space-y-4">
                        <div>
                          <h4 className="font-semibold text-[#0F4C3A] mb-2">What It Treats:</h4>
                          <p className="text-gray-700">Unwanted tattoos of all colors, sizes, and ages. Safe for all skin tones.</p>
                        </div>
                        <div>
                          <h4 className="font-semibold text-[#0F4C3A] mb-2">How It Works:</h4>
                          <p className="text-gray-700">Advanced laser technology breaks down tattoo ink particles, allowing your body to naturally eliminate them without damaging surrounding skin.</p>
                        </div>
                        <div>
                          <h4 className="font-semibold text-[#0F4C3A] mb-2">Expected Results:</h4>
                          <p className="text-gray-700">Gradual fading with each session. Most tattoos require 6-10 treatments spaced 6-8 weeks apart for complete removal.</p>
                        </div>
                        <div className="bg-[#D4AF37]/10 p-4 rounded-lg border border-[#D4AF37]">
                          <p className="text-[#0F4C3A] font-semibold">Holiday Offer: 20% OFF per session - Pricing varies by tattoo size and complexity</p>
                        </div>
                      </div>
                    </div>

                    {/* Treatment 3: Weight Loss */}
                    <div className="bg-white/95 rounded-lg overflow-hidden">
                      <div className="p-6 bg-gradient-to-r from-[#0F4C3A] to-[#1a6b52]">
                        <h3 className="text-2xl font-bold text-white flex items-center">
                          <Target className="w-6 h-6 mr-3 text-[#D4AF37]" />
                          Weight Loss Treatment - $50 OFF First Month
                        </h3>
                      </div>
                      <div className="p-6 space-y-4">
                        <div>
                          <h4 className="font-semibold text-[#0F4C3A] mb-2">What It Treats:</h4>
                          <p className="text-gray-700">Stubborn fat, slow metabolism, weight management challenges, and body contouring needs.</p>
                        </div>
                        <div>
                          <h4 className="font-semibold text-[#0F4C3A] mb-2">How It Works:</h4>
                          <p className="text-gray-700">Comprehensive approach combining metabolism-boosting treatments, nutritional guidance, and body contouring technology for sustainable results.</p>
                        </div>
                        <div>
                          <h4 className="font-semibold text-[#0F4C3A] mb-2">Expected Results:</h4>
                          <p className="text-gray-700">Noticeable changes in energy and measurements within 2-3 weeks. Best results achieved with consistent treatment and lifestyle adjustments.</p>
                        </div>
                        <div className="bg-[#D4AF37]/10 p-4 rounded-lg border border-[#D4AF37]">
                          <p className="text-[#0F4C3A] font-semibold">Holiday Offer: $50 OFF First Month - Customized program based on your goals</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* How It Works Section */}
              <section className="py-16 md:py-20 px-4">
                <div className="max-w-5xl mx-auto">
                  <h2
                    className="text-4xl md:text-5xl font-bold text-center mb-4 text-white"
                    style={{ fontFamily: "'Playfair Display', serif" }}
                  >
                    Your Journey to Radiance
                  </h2>
                  <p className="text-center text-white/80 mb-12 text-lg">
                    Simple steps to your transformation
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Step 1 */}
                    <div className="text-center">
                      <div className="w-20 h-20 rounded-full bg-[#D4AF37] text-white text-3xl font-bold flex items-center justify-center mx-auto mb-6">
                        1
                      </div>
                      <h3 className="text-2xl font-bold text-white mb-3">Book Your Session</h3>
                      <p className="text-white/80">Fill out the form below or call us. We'll find the perfect time for your consultation.</p>
                    </div>

                    {/* Step 2 */}
                    <div className="text-center">
                      <div className="w-20 h-20 rounded-full bg-[#D4AF37] text-white text-3xl font-bold flex items-center justify-center mx-auto mb-6">
                        2
                      </div>
                      <h3 className="text-2xl font-bold text-white mb-3">Personal Consultation</h3>
                      <p className="text-white/80">Meet with our experts to discuss your goals and create your customized treatment plan.</p>
                    </div>

                    {/* Step 3 */}
                    <div className="text-center">
                      <div className="w-20 h-20 rounded-full bg-[#D4AF37] text-white text-3xl font-bold flex items-center justify-center mx-auto mb-6">
                        3
                      </div>
                      <h3 className="text-2xl font-bold text-white mb-3">Begin Transformation</h3>
                      <p className="text-white/80">Relax and enjoy your treatment in our luxurious environment. Watch your confidence soar.</p>
                    </div>
                  </div>
                </div>
              </section>

              {/* FAQ Section */}
              <section className="py-16 md:py-20 px-4 bg-white/5">
                <div className="max-w-3xl mx-auto">
                  <h2
                    className="text-4xl md:text-5xl font-bold text-center mb-4 text-white"
                    style={{ fontFamily: "'Playfair Display', serif" }}
                  >
                    Holiday Offer Questions Answered
                  </h2>
                  <p className="text-center text-white/80 mb-12 text-lg">
                    Everything you need to know
                  </p>

                  <div className="space-y-4">
                    {/* FAQ 1 */}
                    <div className="bg-white/95 rounded-lg p-6">
                      <h3 className="font-semibold text-lg text-[#0F4C3A] mb-2">How long does the holiday offer last?</h3>
                      <p className="text-gray-700">The exclusive holiday pricing is available for appointments booked through December 31st, 2025. Don't miss this limited-time opportunity to save.</p>
                    </div>

                    {/* FAQ 2 */}
                    <div className="bg-white/95 rounded-lg p-6">
                      <h3 className="font-semibold text-lg text-[#0F4C3A] mb-2">Are these treatments safe?</h3>
                      <p className="text-gray-700">Absolutely. All our treatments are FDA-approved and performed by board-certified medical professionals in a sterile, licensed medical spa environment.</p>
                    </div>

                    {/* FAQ 3 */}
                    <div className="bg-white/95 rounded-lg p-6">
                      <h3 className="font-semibold text-lg text-[#0F4C3A] mb-2">How quickly will I see results?</h3>
                      <p className="text-gray-700">Results vary by treatment. Mesotherapy shows improvements within days, tattoo removal is gradual over sessions, and weight loss becomes noticeable within 2-3 weeks.</p>
                    </div>

                    {/* FAQ 4 */}
                    <div className="bg-white/95 rounded-lg p-6">
                      <h3 className="font-semibold text-lg text-[#0F4C3A] mb-2">Can I gift a treatment to someone?</h3>
                      <p className="text-gray-700">Yes! Our treatments make wonderful holiday gifts. We can provide elegant gift certificates and help you create a personalized gifting experience.</p>
                    </div>

                    {/* FAQ 5 */}
                    <div className="bg-white/95 rounded-lg p-6">
                      <h3 className="font-semibold text-lg text-[#0F4C3A] mb-2">What should I expect during my first visit?</h3>
                      <p className="text-gray-700">Your first visit includes a thorough consultation, skin assessment, and personalized treatment plan. We'll answer all your questions and ensure you feel comfortable.</p>
                    </div>

                    {/* FAQ 6 */}
                    <div className="bg-white/95 rounded-lg p-6">
                      <h3 className="font-semibold text-lg text-[#0F4C3A] mb-2">Is there any downtime?</h3>
                      <p className="text-gray-700">Most treatments have minimal to no downtime. You can typically return to normal activities immediately, making them perfect for busy holiday schedules.</p>
                    </div>

                    {/* FAQ 7 */}
                    <div className="bg-white/95 rounded-lg p-6">
                      <h3 className="font-semibold text-lg text-[#0F4C3A] mb-2">Do you offer payment plans?</h3>
                      <p className="text-gray-700">Yes, we offer flexible payment options to make your transformation accessible. Ask about our financing during your consultation.</p>
                    </div>

                    {/* FAQ 8 */}
                    <div className="bg-white/95 rounded-lg p-6">
                      <h3 className="font-semibold text-lg text-[#0F4C3A] mb-2">How do I prepare for my treatment?</h3>
                      <p className="text-gray-700">Preparation varies by treatment. We'll provide detailed pre-treatment instructions when you book. Generally, arrive with clean skin and avoid blood thinners beforehand.</p>
                    </div>
                  </div>
                </div>
              </section>

              {/* CTA Form */}
              <motion.section
                id="reservation-form"
                initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 30 }}
                animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
                transition={prefersReducedMotion ? { duration: 0.3 } : { delay: 0.8, duration: 0.8 }}
                className="max-w-2xl mx-auto"
              >
                <div
                  className="p-8 rounded-2xl"
                  style={{
                    background: colors.softCream,
                    border: `3px solid ${colors.champagneGold}`,
                    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
                  }}
                >
                  {/* Urgency Banner */}
                  <div
                    className="mb-6 p-3 rounded-lg text-center"
                    style={{
                      background: 'linear-gradient(135deg, #8B1538, #A01F47)',
                      color: '#FFFFFF',
                      fontFamily: "'Montserrat', sans-serif",
                      fontSize: '14px',
                      fontWeight: 600,
                    }}
                  >
                    <div>Holiday appointments filling fast — Book by December 31st</div>
                    <div style={{ marginTop: '8px', fontSize: '13px', fontWeight: 500 }}>
                      The perfect gift for yourself this holiday season
                    </div>
                  </div>

                  <h2
                    className="text-center mb-3"
                    style={{
                      fontFamily: "'Playfair Display', serif",
                      fontSize: '2.5rem',
                      fontWeight: 600,
                      color: colors.emeraldGreen,
                    }}
                  >
                    Reserve Your Exclusive Holiday Treatment
                  </h2>

                  <p
                    className="text-center mb-4"
                    style={{
                      fontFamily: "'Cormorant Garamond', serif",
                      fontSize: '18px',
                      fontStyle: 'italic',
                      color: colors.textSecondary,
                    }}
                  >
                    Share your details below, and our concierge team will contact you within 24 hours to schedule your personalized appointment.
                  </p>


                  <form onSubmit={handleSubmit} className="space-y-6">
                    <FormField
                      label="Name"
                      name="name"
                      value={formData.name}
                      onChange={(v) => handleInputChange('name', v)}
                      error={errors.name}
                      placeholder="Your full name"
                      prefersReducedMotion={prefersReducedMotion}
                    />

                    <FormField
                      label="Email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={(v) => handleInputChange('email', v)}
                      error={errors.email}
                      placeholder="your@email.com"
                      prefersReducedMotion={prefersReducedMotion}
                    />

                    <FormField
                      label="Phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(v) => handleInputChange('phone', v)}
                      error={errors.phone}
                      placeholder="(555) 555-5555"
                      prefersReducedMotion={prefersReducedMotion}
                    />

                    <div>
                      <label
                        htmlFor="service"
                        style={{
                          fontFamily: "'Montserrat', sans-serif",
                          fontSize: '14px',
                          fontWeight: 500,
                          color: colors.emeraldGreen,
                        }}
                      >
                        Service Interest
                      </label>
                      <select
                        id="service"
                        name="service"
                        value={formData.service}
                        onChange={(e) => handleInputChange('service', e.target.value)}
                        className="w-full mt-1 px-4 py-3 rounded-lg transition-all duration-300"
                        style={{
                          background: 'white',
                          border: `2px solid ${errors.service ? '#ef4444' : colors.emeraldGreen}`,
                          color: colors.textPrimary,
                          fontFamily: "'Montserrat', sans-serif",
                          fontSize: '16px',
                          outline: 'none',
                        }}
                      >
                        <option value="">Select a service</option>
                        <option value="mesotherapy">Mesotherapy - Save $200</option>
                        <option value="tattoo-removal">Tattoo Removal - 20% OFF</option>
                        <option value="weight-loss">Weight Loss - $50 OFF First Month</option>
                      </select>
                      {errors.service && (
                        <motion.p
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-sm mt-1"
                          style={{ color: '#ef4444' }}
                        >
                          {errors.service}
                        </motion.p>
                      )}
                    </div>

                    {/* A2P Consent Checkbox - CRITICAL LEGAL REQUIREMENT */}
                    <div className="flex items-start gap-3 mb-6">
                      <input
                        type="checkbox"
                        id="a2p-consent"
                        checked={consentChecked}
                        onChange={(e) => {
                          setConsentChecked(e.target.checked)
                          setShowConsentError(false)
                        }}
                        className="mt-1 w-5 h-5 cursor-pointer"
                        style={{
                          accentColor: colors.champagneGold,
                        }}
                      />
                      <label
                        htmlFor="a2p-consent"
                        className="text-sm cursor-pointer"
                        style={{
                          color: colors.textPrimary,
                          fontFamily: "'Montserrat', sans-serif",
                          lineHeight: 1.5,
                        }}
                      >
                        By checking this box, I consent to receive marketing and promotional communications,
                        including SMS/text messages and emails, from Hana Beauty Med Spa and Noveris Data LLC
                        (operating Senova CRM) at the phone number and email address provided. Message frequency varies.
                        Message and data rates may apply. Reply STOP to opt-out of SMS at any time. Reply HELP for help.
                        I understand that my consent is not a condition of purchase. View our{' '}
                        <a
                          href="https://crm.senovallc.com/privacy-policy"
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            color: colors.champagneGold,
                            textDecoration: 'underline',
                            fontWeight: 500,
                          }}
                        >
                          Privacy Policy
                        </a>
                        {' '}and{' '}
                        <a
                          href="https://crm.senovallc.com/terms-of-service"
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            color: colors.champagneGold,
                            textDecoration: 'underline',
                            fontWeight: 500,
                          }}
                        >
                          Terms of Service
                        </a>.
                      </label>
                    </div>

                    {showConsentError && (
                      <motion.p
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-sm text-center mb-4"
                        style={{
                          color: '#ef4444',
                          fontFamily: "'Montserrat', sans-serif",
                          fontWeight: 500,
                        }}
                      >
                        Please check the consent box to continue
                      </motion.p>
                    )}

                    <motion.button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-4 rounded-lg font-semibold text-lg transition-all duration-300"
                      style={{
                        background: `linear-gradient(135deg, ${colors.champagneGold}, ${colors.brightGold})`,
                        color: colors.emeraldGreen,
                        fontFamily: "'Montserrat', sans-serif",
                        boxShadow: '0 10px 20px rgba(212, 175, 55, 0.3)',
                        opacity: !consentChecked ? 0.7 : 1,
                      }}
                      whileHover={prefersReducedMotion ? {} : { scale: 1.02 }}
                      whileTap={prefersReducedMotion ? {} : { scale: 0.98 }}
                    >
                      {isSubmitting ? (
                        <span className="flex items-center justify-center gap-2">
                          <Loader2 className="animate-spin" />
                          Processing...
                        </span>
                      ) : (
                        'Claim Your Holiday Glow Session'
                      )}
                    </motion.button>
                  </form>
                </div>
              </motion.section>
            </>
          ) : (
            /* Success State */
            <motion.div
              initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.9 }}
              animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, scale: 1 }}
              transition={prefersReducedMotion ? { duration: 0.2 } : { duration: 0.5 }}
              className="min-h-[80vh] flex items-center justify-center"
            >
              <div className="text-center max-w-2xl">
                <motion.div
                  initial={prefersReducedMotion ? { opacity: 0 } : { scale: 0 }}
                  animate={prefersReducedMotion ? { opacity: 1 } : { scale: 1 }}
                  transition={prefersReducedMotion ? { duration: 0.2 } : { type: 'spring', stiffness: 200, damping: 15 }}
                  className="mb-8"
                >
                  <div
                    className="w-24 h-24 mx-auto rounded-full flex items-center justify-center"
                    style={{
                      background: `linear-gradient(135deg, ${colors.champagneGold}, ${colors.brightGold})`,
                      boxShadow: '0 10px 30px rgba(212, 175, 55, 0.4)',
                    }}
                  >
                    <Check className="w-12 h-12" style={{ color: colors.emeraldGreen }} />
                  </div>
                </motion.div>

                <h2
                  style={{
                    fontFamily: "'Playfair Display', serif",
                    fontSize: '3rem',
                    fontWeight: 600,
                    color: colors.emeraldGreen,
                    marginBottom: '1rem',
                  }}
                >
                  Your Offer is Reserved!
                </h2>

                <p
                  style={{
                    fontFamily: "'Cormorant Garamond', serif",
                    fontSize: '1.5rem',
                    color: colors.textSecondary,
                    marginBottom: '2rem',
                  }}
                >
                  Thank you for choosing Hana Beauty. We'll contact you within 24 hours
                  to schedule your exclusive holiday treatment.
                </p>

                <div
                  className="p-6 rounded-lg"
                  style={{
                    background: colors.softCream,
                    border: `2px solid ${colors.champagneGold}`,
                  }}
                >
                  <h3
                    style={{
                      fontFamily: "'Montserrat', sans-serif",
                      fontSize: '1.2rem',
                      fontWeight: 600,
                      color: colors.emeraldGreen,
                      marginBottom: '1rem',
                    }}
                  >
                    What's Next?
                  </h3>
                  <ul className="space-y-2 text-left">
                    {[
                      'Our concierge will call you within 24 hours',
                      'We\'ll schedule your treatment at your convenience',
                      'You\'ll receive a confirmation email with all details',
                      'Limited holiday appointments - book early!'
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <Check className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: colors.champagneGold }} />
                        <span style={{ color: colors.textPrimary, fontFamily: "'Montserrat', sans-serif" }}>
                          {item}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </>
  )
}