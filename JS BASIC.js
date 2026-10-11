(function () {
  const root = document.documentElement;
  const menuButton = document.getElementById('menuButton');
  const siteNav = document.getElementById('siteNav');
  const themeButton = document.getElementById('themeButton');
  const navLinks = [...document.querySelectorAll('.nav-link')];
  const sections = [...document.querySelectorAll('main section[id]')];
  const revealItems = [...document.querySelectorAll('.reveal')];

  // Mobile navigation
  menuButton?.addEventListener('click', () => {
    const isOpen = siteNav.classList.toggle('open');
    menuButton.setAttribute('aria-expanded', String(isOpen));
    menuButton.setAttribute('aria-label', isOpen ? 'Close navigation' : 'Open navigation');
  });

  navLinks.forEach((link) => {
    link.addEventListener('click', () => {
      siteNav.classList.remove('open');
      menuButton?.setAttribute('aria-expanded', 'false');
      menuButton?.setAttribute('aria-label', 'Open navigation');
    });
  });

  // Dark theme is the default; an explicit light choice is remembered.
  const storedTheme = localStorage.getItem('ananthan-theme');
  if (storedTheme === 'light') {
    root.setAttribute('data-theme', 'light');
  } else {
    root.setAttribute('data-theme', 'dark');
  }

  const syncThemeButton = () => {
    const dark = root.getAttribute('data-theme') === 'dark';
    if (themeButton) {
      themeButton.textContent = dark ? '☼' : '◐';
      themeButton.setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme');
      themeButton.setAttribute('title', dark ? 'Switch to light theme' : 'Switch to dark theme');
    }
  };

  syncThemeButton();

  themeButton?.addEventListener('click', () => {
    const dark = root.getAttribute('data-theme') === 'dark';
    root.setAttribute('data-theme', dark ? 'light' : 'dark');
    localStorage.setItem('ananthan-theme', dark ? 'light' : 'dark');
    syncThemeButton();
  });

  // Fade sections into view.
  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );

  revealItems.forEach((item) => revealObserver.observe(item));

  // Keep the navigation state in sync with the visible section.
  const sectionObserver = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

      if (!visible) return;
      navLinks.forEach((link) => {
        link.classList.toggle('active', link.getAttribute('href') === `#${visible.target.id}`);
      });
    },
    { rootMargin: '-35% 0px -55% 0px', threshold: [0, 0.25, 0.6] }
  );

  sections.forEach((section) => sectionObserver.observe(section));

  // Spiral galaxy particle animation forming letter "A"
  const canvas = document.getElementById('aParticleCanvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let particles = [];
  let targets = [];
  let targetSequence = [];
  let dpr = Math.min(window.devicePixelRatio || 1, 2);
  let width = 0;
  let height = 0;
  let lastTime = performance.now();
  let cycleTime = 0; // Start at 0 (scattered state)
  let started = false;
  let rafId = null;
  let mouseX = 0;
  let mouseY = 0;
  let isHovering = false;
  let distortionStrength = 0;
  const animationWords = ['A', 'Ananthan'];

  // Luminous nebula tones for a more recognizable starfield.
  const starColors = [
    [111, 204, 255],  // Starlight blue
    [165, 137, 255],  // Nebula violet
    [132, 239, 225],  // Aurora teal
    [225, 190, 255],  // Pale lavender
    [255, 220, 170],  // Warm star gold
    [122, 164, 255],  // Deep sky blue
    [244, 170, 220],  // Nebula pink
    [220, 235, 255]   // Ice white
  ];

  const planetColors = [
    [100, 150, 200],  // Deep blue
    [150, 120, 180],  // Purple
    [120, 160, 160],  // Teal
    [180, 140, 160],  // Muted pink
    [140, 160, 180],  // Steel blue
    [160, 130, 150]   // Cosmic magenta
  ];

  function sizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    width = Math.max(1, Math.floor(rect.width));
    height = Math.max(1, Math.floor(rect.height));
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    buildTargets();
  }

  function buildTargets() {
    const scale = 2;
    const off = document.createElement('canvas');
    const octx = off.getContext('2d', { willReadFrequently: true });
    off.width = Math.floor(width * scale);
    off.height = Math.floor(height * scale);
    octx.fillStyle = '#ffffff';
    octx.textAlign = 'center';
    octx.textBaseline = 'middle';

    const maxWidth = width * 0.86;
    const maxHeight = height * 0.84;
    const step = Math.max(3, Math.round(width / 115));
    const maxTargets = Math.floor(Math.min(1500, Math.max(800, width * 2)));

    targetSequence = animationWords.map((word) => {
      const isMonogram = word === 'A';
      const baseSize = isMonogram
        ? Math.min(width * 0.9, height * 0.86)
        : Math.min(width * 0.72, height * 0.5);
      const fontFamily = 'Great Vibes, cursive';
      const fontWeight = 400;
      octx.font = `${fontWeight} ${baseSize * scale}px ${fontFamily}`;
      const fontSize = Math.min(baseSize, baseSize * maxWidth * scale / octx.measureText(word).width, maxHeight);
      octx.font = `${fontWeight} ${fontSize * scale}px ${fontFamily}`;
      octx.clearRect(0, 0, off.width, off.height);
      octx.fillText(word, (width * scale) / 2, (height * 0.49) * scale);

      const image = octx.getImageData(0, 0, off.width, off.height).data;
      const points = [];
      for (let y = step; y < off.height - step; y += step) {
        for (let x = step; x < off.width - step; x += step) {
          if (image[(y * off.width + x) * 4 + 3] > 100) points.push({ x: x / scale, y: y / scale });
        }
      }
      return points.length > maxTargets
        ? points.filter((_, i) => i % Math.ceil(points.length / maxTargets) === 0)
        : points;
    });

    targets = targetSequence[0] || [];
    const largestTargetCount = Math.max(...targetSequence.map((points) => points.length), 0);
    if (!particles.length) {
      particles = Array.from({ length: Math.min(1800, Math.max(1000, largestTargetCount + 200)) }, (_, index) => createParticle(index));
    }
  }

  function createParticle(index) {
    // Start scattered across the entire section
    const x = Math.random() * width;
    const y = Math.random() * height;
    
    // Keep the field mostly made of stars, with a few larger celestial bodies.
    const isPlanet = Math.random() > 0.94;
    const isBrightStar = !isPlanet && Math.random() > 0.6;
    const isSuperBright = !isPlanet && Math.random() > 0.9;
    
    let size, color, brightness;
    
    if (isPlanet) {
      size = Math.random() * 3 + 2;
      color = planetColors[Math.floor(Math.random() * planetColors.length)];
      brightness = 1.0 + Math.random() * 0.3;
    } else if (isSuperBright) {
      size = Math.random() * 2 + 1.5;
      color = starColors[Math.floor(Math.random() * starColors.length)];
      brightness = 2.5 + Math.random() * 1;
    } else if (isBrightStar) {
      size = Math.random() * 1.5 + 1;
      color = starColors[Math.floor(Math.random() * starColors.length)];
      brightness = 1.8 + Math.random() * 0.5;
    } else {
      size = Math.random() * 1 + 0.3;
      color = starColors[Math.floor(Math.random() * starColors.length)];
      brightness = 0.6 + Math.random() * 0.4;
    }
    
    return {
      x: x,
      y: y,
      ox: x - width * 0.5,
      oy: y - height * 0.5,
      tx: width * 0.5,
      ty: height * 0.5,
      size: size,
      alpha: Math.random() * 0.7 + 0.2,
      color: color,
      brightness: brightness,
      seed: Math.random() * 1000,
      speed: Math.random() * 0.7 + 0.55,
      isPlanet: isPlanet,
      isBrightStar: isBrightStar,
      isSuperBright: isSuperBright,
      twinkleOffset: Math.random() * Math.PI * 2,
      twinkleSpeed: 0.002 + Math.random() * 0.003
    };
  }

  function resetParticles() {
    cycleTime = 0;
    particles.forEach((particle, index) => {
      // Reset to scattered positions
      particle.x = Math.random() * width;
      particle.y = Math.random() * height;
      particle.ox = particle.x - width * 0.5;
      particle.oy = particle.y - height * 0.5;
      particle.seed = Math.random() * 1000 + index;
    });
  }

  function drawBackground(time) {
    const lightTheme = root.getAttribute('data-theme') === 'light';
    ctx.clearRect(0, 0, width, height);

    // Keep the cosmic haze visible against both dark and light page themes.
    const gradient = ctx.createRadialGradient(width * 0.5, height * 0.47, 0, width * 0.5, height * 0.47, Math.min(width, height) * 0.6);
    gradient.addColorStop(0, lightTheme ? 'rgba(95, 128, 180, 0.18)' : 'rgba(25, 35, 55, 0.35)');
    gradient.addColorStop(0.5, lightTheme ? 'rgba(110, 105, 165, 0.09)' : 'rgba(15, 20, 35, 0.18)');
    gradient.addColorStop(1, 'rgba(5, 8, 15, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Subtle cosmic center glow - less bright, more ethereal
    const centerGlow = ctx.createRadialGradient(width * 0.5, height * 0.47, 0, width * 0.5, height * 0.47, 100);
    centerGlow.addColorStop(0, lightTheme ? 'rgba(70, 105, 165, 0.20)' : 'rgba(150, 180, 220, 0.12)');
    centerGlow.addColorStop(0.2, lightTheme ? 'rgba(95, 105, 170, 0.14)' : 'rgba(130, 160, 200, 0.08)');
    centerGlow.addColorStop(0.5, lightTheme ? 'rgba(90, 130, 175, 0.08)' : 'rgba(100, 140, 180, 0.04)');
    centerGlow.addColorStop(1, 'rgba(60, 90, 130, 0)');
    ctx.fillStyle = centerGlow;
    ctx.fillRect(0, 0, width, height);

    // Subtle orbiting halos - softer, less visible
    ctx.save();
    ctx.translate(width * 0.5, height * 0.47);
    ctx.rotate(time * 0.00008);
    ctx.strokeStyle = lightTheme ? 'rgba(56, 80, 125, 0.10)' : 'rgba(140, 170, 200, 0.03)';
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 11]);
    ctx.beginPath();
    ctx.ellipse(0, 0, width * 0.29, height * 0.19, -0.3, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.translate(width * 0.5, height * 0.47);
    ctx.rotate(time * 0.00005);
    ctx.strokeStyle = lightTheme ? 'rgba(76, 80, 130, 0.07)' : 'rgba(130, 160, 190, 0.02)';
    ctx.lineWidth = 0.5;
    ctx.setLineDash([3, 15]);
    ctx.beginPath();
    ctx.ellipse(0, 0, width * 0.38, height * 0.25, 0.4, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  function drawStar(x, y, size, color, alpha, brightness) {
    const [r, g, b] = color;
    
    // Core - softer, less harsh
    ctx.beginPath();
    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha * brightness * 0.8})`;
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
    
    // Soft inner glow for all stars
    const innerGlowSize = size * 2.5;
    const innerGlow = ctx.createRadialGradient(x, y, 0, x, y, innerGlowSize);
    innerGlow.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${alpha * brightness * 0.25})`);
    innerGlow.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
    ctx.fillStyle = innerGlow;
    ctx.beginPath();
    ctx.arc(x, y, innerGlowSize, 0, Math.PI * 2);
    ctx.fill();
    
    // Ethereal glow for bright stars
    if (brightness > 1.8) {
      const glowSize = size * 4;
      const glow = ctx.createRadialGradient(x, y, 0, x, y, glowSize);
      glow.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${alpha * brightness * 0.15})`);
      glow.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, ${alpha * brightness * 0.06})`);
      glow.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(x, y, glowSize, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Soft glow for super bright stars
    if (brightness > 2.5) {
      const superGlowSize = size * 6;
      const superGlow = ctx.createRadialGradient(x, y, 0, x, y, superGlowSize);
      superGlow.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${alpha * brightness * 0.08})`);
      superGlow.addColorStop(0.3, `rgba(${r}, ${g}, ${b}, ${alpha * brightness * 0.04})`);
      superGlow.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
      ctx.fillStyle = superGlow;
      ctx.beginPath();
      ctx.arc(x, y, superGlowSize, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawPlanet(x, y, size, color, alpha) {
    const [r, g, b] = color;
    
    // Planet body - softer colors
    ctx.beginPath();
    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha * 0.9})`;
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
    
    // Soft shadow for 3D effect - less harsh contrast
    const shadow = ctx.createRadialGradient(x - size * 0.3, y - size * 0.3, 0, x, y, size);
    shadow.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${alpha * 0.3})`);
    shadow.addColorStop(0.6, `rgba(${r}, ${g}, ${b}, ${alpha * 0.85})`);
    shadow.addColorStop(1, `rgba(${r * 0.5}, ${g * 0.5}, ${b * 0.5}, ${alpha * 0.8})`);
    ctx.fillStyle = shadow;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
    
    // Subtle atmosphere glow - softer
    const atmos = ctx.createRadialGradient(x, y, size * 0.8, x, y, size * 1.8);
    atmos.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${alpha * 0.1})`);
    atmos.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, ${alpha * 0.03})`);
    atmos.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
    ctx.fillStyle = atmos;
    ctx.beginPath();
    ctx.arc(x, y, size * 1.8, 0, Math.PI * 2);
    ctx.fill();
  }

  function render(time) {
    const dt = Math.min((time - lastTime) / 1000, 0.035);
    lastTime = time;
    cycleTime += dt;
    const lightTheme = root.getAttribute('data-theme') === 'light';

    // Smoothly transition distortion strength
    const targetDistortion = isHovering ? 1 : 0;
    distortionStrength += (targetDistortion - distortionStrength) * dt * 3;

    drawBackground(time);

    // Each mark forms, holds, then disperses fully before the next one begins.
    const introDuration = 1.5;
    const transitionDuration = 2.3;
    const holdDuration = 4;
    const disperseDuration = 2.5;
    const shapeDuration = transitionDuration + holdDuration + disperseDuration;
    const sequenceDuration = introDuration + animationWords.length * shapeDuration;
    const t = cycleTime % sequenceDuration;
    const shapeIndex = Math.floor((t - introDuration) / shapeDuration);
    let fromIndex = -1;
    let toIndex = -1;
    let progress = 0;

    if (t >= introDuration && shapeIndex < animationWords.length) {
      const localTime = (t - introDuration) % shapeDuration;
      toIndex = shapeIndex;
      // Every word starts from the scattered galaxy, after the previous mark has faded away.
      fromIndex = -1;
      if (localTime < transitionDuration) {
        progress = localTime / transitionDuration;
      } else if (localTime < transitionDuration + holdDuration) {
        fromIndex = toIndex;
        progress = 1;
      } else {
        fromIndex = toIndex;
        toIndex = -1;
        progress = (localTime - transitionDuration - holdDuration) / disperseDuration;
      }
    }

    const ease = progress < 0.5 ? 4 * progress * progress * progress : 1 - Math.pow(-2 * progress + 2, 3) / 2;
    const pointAt = (shape, index) => {
      if (shape < 0) return { x: width * 0.5 + particles[index].ox, y: height * 0.47 + particles[index].oy };
      const points = targetSequence[shape];
      return points[index % points.length];
    };

    targets = toIndex >= 0 ? targetSequence[toIndex] : (fromIndex >= 0 ? targetSequence[fromIndex] : []);
    if (targets.length && toIndex >= 0 && fromIndex !== toIndex) {
      const guideAlpha = Math.min(1, progress) * (lightTheme ? 0.045 : 0.018);
      ctx.save();
      ctx.fillStyle = lightTheme ? `rgba(53, 76, 125, ${guideAlpha})` : `rgba(180, 200, 230, ${guideAlpha})`;
      const guideStep = Math.max(1, Math.floor(targets.length / 520));
      for (let i = 0; i < targets.length; i += guideStep) {
        const point = targets[i];
        ctx.beginPath();
        ctx.arc(point.x, point.y, 0.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    particles.forEach((particle, index) => {
      const jitter = Math.sin(time * 0.0011 * particle.speed + particle.seed) * 1.15;
      const orbitAngle = time * 0.00021 * particle.speed + particle.seed;
      const fromPoint = pointAt(fromIndex, index);
      const toPoint = pointAt(toIndex, index);
      const targetX = fromPoint.x + (toPoint.x - fromPoint.x) * ease + jitter;
      const targetY = fromPoint.y + (toPoint.y - fromPoint.y) * ease + Math.cos(orbitAngle) * 0.55;
      const spiralPull = 0.55 + ease * 1.9;
      let desiredX = targetX;
      let desiredY = targetY;

      // Apply hover distortion
      if (distortionStrength > 0.01) {
        const dx = particle.x - mouseX;
        const dy = particle.y - mouseY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const maxDist = 150;
        
        if (dist < maxDist) {
          const force = (1 - dist / maxDist) * distortionStrength * 80;
          const angle = Math.atan2(dy, dx);
          desiredX += Math.cos(angle) * force;
          desiredY += Math.sin(angle) * force;
        }
      }

      particle.x += (desiredX - particle.x) * Math.min(1, dt * (2.2 + spiralPull));
      particle.y += (desiredY - particle.y) * Math.min(1, dt * (2.2 + spiralPull));

      if (toIndex < 0 && fromIndex >= 0) {
        const dx = particle.x - width * 0.5;
        const dy = particle.y - height * 0.47;
        const radius = Math.hypot(dx, dy) || 1;
        const swirl = (1 - ease) * dt * 24;
        particle.x += (-dy / radius) * swirl;
        particle.y += (dx / radius) * swirl;
      }

      // Softer twinkle effect for stars
      let twinkle = 1;
      if (!particle.isPlanet) {
        const twinkleIntensity = particle.isSuperBright ? 0.35 : 0.25;
        twinkle = 0.7 + twinkleIntensity * Math.sin(time * particle.twinkleSpeed + particle.twinkleOffset);
      }

      const displayAlpha = particle.alpha * twinkle * (0.5 + ease * 0.5);
      const displaySize = particle.size * (0.8 + ease * 0.4);
      const displayColor = lightTheme ? particle.color.map((channel) => Math.round(channel * 0.48)) : particle.color;
      const visibleAlpha = lightTheme ? Math.min(1, displayAlpha * 1.3) : displayAlpha;

      if (particle.isPlanet) {
        drawPlanet(particle.x, particle.y, displaySize, displayColor, visibleAlpha);
      } else {
        drawStar(particle.x, particle.y, displaySize, displayColor, visibleAlpha, particle.brightness);
      }
    });

    rafId = requestAnimationFrame(render);
  }

  function start() {
    if (started) return;
    started = true;
    rafId = requestAnimationFrame(render);
  }

  // Mouse hover effects
  const heroSection = canvas.closest('.hero');
  const portrait = heroSection?.querySelector('.portrait-image');

  heroSection?.addEventListener('pointermove', (e) => {
    if (e.pointerType === 'touch') return;
    const rect = canvas.getBoundingClientRect();
    mouseX = (e.clientX - rect.left) * (canvas.width / rect.width / dpr);
    mouseY = (e.clientY - rect.top) * (canvas.height / rect.height / dpr);
    isHovering = true;

    if (portrait?.contains(e.target)) {
      const portraitRect = portrait.getBoundingClientRect();
      const horizontal = (e.clientX - portraitRect.left) / portraitRect.width * 2 - 1;
      const vertical = (e.clientY - portraitRect.top) / portraitRect.height * 2 - 1;
      portrait.style.setProperty('--portrait-tilt-x', `${-vertical * 4}deg`);
      portrait.style.setProperty('--portrait-tilt-y', `${horizontal * 4}deg`);
      portrait.style.setProperty('--portrait-scale', '1.025');
      portrait.classList.add('is-hovered');
    } else if (portrait) {
      portrait.style.setProperty('--portrait-tilt-x', '0deg');
      portrait.style.setProperty('--portrait-tilt-y', '0deg');
      portrait.style.setProperty('--portrait-scale', '1');
      portrait.classList.remove('is-hovered');
    }
  });

  heroSection?.addEventListener('pointerleave', () => {
    isHovering = false;
    portrait?.style.setProperty('--portrait-tilt-x', '0deg');
    portrait?.style.setProperty('--portrait-tilt-y', '0deg');
    portrait?.style.setProperty('--portrait-scale', '1');
    portrait?.classList.remove('is-hovered');
  });

  window.addEventListener('resize', () => {
    sizeCanvas();
    resetParticles();
  });

  sizeCanvas();
  start();
})();
