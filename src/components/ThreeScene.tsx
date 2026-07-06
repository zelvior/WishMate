import { useEffect, useRef } from "react";
import * as THREE from "three";
import { CakeType, CelebrationTheme } from "../types";

interface ThreeSceneProps {
  theme: CelebrationTheme;
  cakeType: CakeType;
}

export default function ThreeScene({ theme, cakeType }: ThreeSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    
    // 1. Scene, Camera, and Renderer Setup
    const scene = new THREE.Scene();
    
    // Choose ambient background color based on theme
    let bgClearColor = new THREE.Color(0xfcfcfc);
    let fogColor = 0xfcfcfc;
    if (theme === "cosmic") {
      bgClearColor = new THREE.Color(0x0a0620);
      fogColor = 0x0a0620;
    } else if (theme === "neon") {
      bgClearColor = new THREE.Color(0x050508);
      fogColor = 0x050508;
    } else if (theme === "rose_gold") {
      bgClearColor = new THREE.Color(0xfbfaf7);
      fogColor = 0xfbfaf7;
    } else {
      bgClearColor = new THREE.Color(0xfffbeb); // warm playful amber-50
      fogColor = 0xfffbeb;
    }

    scene.background = bgClearColor;
    scene.fog = new THREE.FogExp2(fogColor, 0.04);

    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      100
    );
    camera.position.set(0, 4.5, 9.5);
    camera.lookAt(0, 0.6, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // 2. Lighting Setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(5, 10, 7);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    scene.add(dirLight);

    // Dynamic theme-specific point lights for a glowing vibe
    const pointLight = new THREE.PointLight(0xffb703, 1.2, 15);
    pointLight.position.set(0, 2.5, 0);
    scene.add(pointLight);

    if (theme === "cosmic") {
      pointLight.color.setHex(0x22d3ee); // cyan glow
      dirLight.color.setHex(0x818cf8);   // indigo directional tint
    } else if (theme === "neon") {
      pointLight.color.setHex(0xf43f5e); // hot pink glow
      dirLight.color.setHex(0x00f0ff);   // neon blue secondary tint
    } else if (theme === "rose_gold") {
      pointLight.color.setHex(0xeab308); // warm gold glow
      dirLight.color.setHex(0xfda4af);   // soft pink tint
    } else {
      pointLight.color.setHex(0x10b981); // emerald green
      dirLight.color.setHex(0xfbbf24);   // bright yellow
    }

    // 3. Constructing the 3D Cake Group
    const cakeGroup = new THREE.Group();
    scene.add(cakeGroup);

    // Helper to get Cake Materials based on cakeType selection
    let baseMat: THREE.Material;
    let middleMat: THREE.Material;
    let frostingMat: THREE.Material;

    const roughness = 0.4;
    const metalness = theme === "rose_gold" ? 0.3 : 0.05;

    if (cakeType === "chocolate") {
      baseMat = new THREE.MeshStandardMaterial({ color: 0x4e3629, roughness, metalness }); // Chocolate Fudge
      middleMat = new THREE.MeshStandardMaterial({ color: 0x2b1d0c, roughness: 0.6 }); // Deep Dark Fudge
      frostingMat = new THREE.MeshStandardMaterial({ color: 0xfffdd0, roughness: 0.1 }); // Cream Custard
    } else if (cakeType === "strawberry") {
      baseMat = new THREE.MeshStandardMaterial({ color: 0xfca5a5, roughness, metalness }); // Strawberry icing pink
      middleMat = new THREE.MeshStandardMaterial({ color: 0xf43f5e, roughness: 0.3 }); // Red strawberry syrup
      frostingMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 }); // White whipped cream
    } else if (cakeType === "rainbow") {
      baseMat = new THREE.MeshStandardMaterial({ color: 0x93c5fd, roughness, metalness }); // Pastel sky blue
      middleMat = new THREE.MeshStandardMaterial({ color: 0xc4b5fd, roughness }); // Pastel lilac
      frostingMat = new THREE.MeshStandardMaterial({ color: 0xfde047, roughness: 0.1 }); // Yellow cream drops
    } else if (cakeType === "cyberpunk") {
      baseMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.8, metalness: 0.8 }); // Matte charcoal plate
      middleMat = new THREE.MeshStandardMaterial({ color: 0x06b6d4, roughness: 0.2, emissive: 0x06b6d4, emissiveIntensity: 0.5 }); // Glowing neon teal band
      frostingMat = new THREE.MeshStandardMaterial({ color: 0xec4899, roughness: 0.1, emissive: 0xec4899, emissiveIntensity: 0.3 }); // Glowing neon pink piping
    } else {
      // Space cake theme
      baseMat = new THREE.MeshStandardMaterial({ color: 0x1e1b4b, roughness: 0.5, metalness: 0.4 }); // Dark galactic purple
      middleMat = new THREE.MeshStandardMaterial({ color: 0x7c3aed, roughness: 0.3 }); // Cosmos violet ring
      frostingMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.1, metalness: 0.6 }); // Luxury gold icing stars
    }

    const plateMat = new THREE.MeshStandardMaterial({
      color: theme === "neon" ? 0x111115 : theme === "rose_gold" ? 0xebd9b4 : 0xe2e8f0,
      roughness: 0.2,
      metalness: theme === "rose_gold" ? 0.8 : 0.2
    });

    // --- Draw plate/stand ---
    const plateGeom = new THREE.CylinderGeometry(3.0, 3.2, 0.15, 32);
    const plate = new THREE.Mesh(plateGeom, plateMat);
    plate.position.y = -0.1;
    plate.receiveShadow = true;
    cakeGroup.add(plate);

    // --- Draw main cake tier ---
    const cakeHeight = 1.6;
    const cakeRadius = 2.4;
    const cakeGeom = new THREE.CylinderGeometry(cakeRadius, cakeRadius, cakeHeight, 32);
    const cakeBase = new THREE.Mesh(cakeGeom, baseMat);
    cakeBase.position.y = cakeHeight / 2;
    cakeBase.castShadow = true;
    cakeBase.receiveShadow = true;
    cakeGroup.add(cakeBase);

    // --- Draw middle frosting layer ring ---
    const middleRingGeom = new THREE.CylinderGeometry(cakeRadius + 0.03, cakeRadius + 0.03, 0.2, 32);
    const middleRing = new THREE.Mesh(middleRingGeom, middleMat);
    middleRing.position.y = cakeHeight / 2;
    cakeGroup.add(middleRing);

    // --- Draw top cream drops (Frosting decoration) ---
    const creamGroup = new THREE.Group();
    const creamCount = 12;
    const creamRadius = 2.15;
    const creamGeom = new THREE.SphereGeometry(0.2, 8, 8);
    
    for (let i = 0; i < creamCount; i++) {
      const angle = (i / creamCount) * Math.PI * 2;
      const cream = new THREE.Mesh(creamGeom, frostingMat);
      cream.position.x = Math.cos(angle) * creamRadius;
      cream.position.z = Math.sin(angle) * creamRadius;
      cream.position.y = cakeHeight + 0.05;
      cream.scale.set(1, 1.3, 1);
      creamGroup.add(cream);
    }
    cakeGroup.add(creamGroup);

    // --- Add 5 Candles with glowing flames ---
    const candleGroup = new THREE.Group();
    const candleCount = 5;
    const candleRadius = 1.3;
    const candlesArray: THREE.Mesh[] = [];
    const flamesArray: THREE.Mesh[] = [];

    const candleColors = [0xec4899, 0x06b6d4, 0xfacc15, 0x10b981, 0xa855f7];

    for (let i = 0; i < candleCount; i++) {
      const angle = (i / candleCount) * Math.PI * 2;
      const cColor = candleColors[i % candleColors.length];
      
      const candleMat = new THREE.MeshStandardMaterial({
        color: cColor,
        roughness: 0.3,
        metalness: 0.1
      });

      // Candle Stick
      const stickGeom = new THREE.CylinderGeometry(0.08, 0.08, 1.0, 12);
      const stick = new THREE.Mesh(stickGeom, candleMat);
      stick.position.x = Math.cos(angle) * candleRadius;
      stick.position.z = Math.sin(angle) * candleRadius;
      stick.position.y = cakeHeight + 0.5;
      stick.castShadow = true;
      candleGroup.add(stick);
      candlesArray.push(stick);

      // Candle Wick (tiny black top)
      const wickGeom = new THREE.CylinderGeometry(0.015, 0.015, 0.15, 6);
      const wickMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
      const wick = new THREE.Mesh(wickGeom, wickMat);
      wick.position.set(stick.position.x, stick.position.y + 0.55, stick.position.z);
      candleGroup.add(wick);

      // Glowing flame (using double-sided BasicMaterial for intense glow)
      const flameGeom = new THREE.ConeGeometry(0.12, 0.32, 10);
      const flameMat = new THREE.MeshBasicMaterial({
        color: 0xffaa00,
        transparent: true,
        opacity: 0.95
      });
      const flame = new THREE.Mesh(flameGeom, flameMat);
      flame.position.set(stick.position.x, stick.position.y + 0.72, stick.position.z);
      candleGroup.add(flame);
      flamesArray.push(flame);
    }
    cakeGroup.add(candleGroup);

    // 4. Generate Particle System (Dust / Confetti matching theme)
    let particleCount = 150;
    let particleGeom = new THREE.BufferGeometry();
    let positions = new Float32Array(particleCount * 3);
    let speeds = new Float32Array(particleCount);
    let originalY = new Float32Array(particleCount);
    
    // Choose particle colors
    let particleColors: number[] = [];
    if (theme === "cosmic") {
      particleColors = [0x22d3ee, 0x818cf8, 0xc084fc, 0xffffff];
    } else if (theme === "neon") {
      particleColors = [0xf43f5e, 0x00f0ff, 0x10b981, 0xec4899];
    } else if (theme === "rose_gold") {
      particleColors = [0xc5a059, 0xfda4af, 0xeab308, 0xffffff];
    } else {
      // Playful rainbow
      particleColors = [0xff4b4b, 0xffb347, 0xffff7f, 0x7fff7f, 0x7f7fff, 0xff7fff];
    }

    const colorArray = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      // Spanning particles randomly in a volume
      positions[i * 3] = (Math.random() - 0.5) * 15;
      positions[i * 3 + 1] = Math.random() * 8 - 2;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 15;

      originalY[i] = positions[i * 3 + 1];
      speeds[i] = Math.random() * 0.02 + 0.005;

      // Assign random theme colors
      const hex = particleColors[Math.floor(Math.random() * particleColors.length)];
      const c = new THREE.Color(hex);
      colorArray[i * 3] = c.r;
      colorArray[i * 3 + 1] = c.g;
      colorArray[i * 3 + 2] = c.b;
    }

    particleGeom.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    particleGeom.setAttribute("color", new THREE.BufferAttribute(colorArray, 3));

    // Create custom circle particle texture
    const pCanvas = document.createElement("canvas");
    pCanvas.width = 16;
    pCanvas.height = 16;
    const pCtx = pCanvas.getContext("2d");
    if (pCtx) {
      pCtx.arc(8, 8, 7, 0, Math.PI * 2);
      pCtx.fillStyle = "white";
      pCtx.fill();
    }
    const pTexture = new THREE.CanvasTexture(pCanvas);

    const particleMat = new THREE.PointsMaterial({
      size: 0.18,
      map: pTexture,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });

    const particleSystem = new THREE.Points(particleGeom, particleMat);
    scene.add(particleSystem);

    // 5. Interactive Mouse-Tilt Feedback Configuration
    let targetRotationX = 0;
    let targetRotationY = 0;
    let mouseX = 0;
    let mouseY = 0;

    const handleMouseMove = (event: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      
      mouseX = (x / rect.width) * 2 - 1;
      mouseY = -(y / rect.height) * 2 + 1;

      targetRotationY = mouseX * 0.4;
      targetRotationX = -mouseY * 0.25;
    };

    container.addEventListener("mousemove", handleMouseMove);

    // 6. Spawn interactive particle spray on mouse click
    const handleMouseClick = () => {
      // Trigger temporary high velocity burst of particles
      const tempCount = 15;
      const burstGeom = new THREE.BufferGeometry();
      const burstPos = new Float32Array(tempCount * 3);
      const burstVel: THREE.Vector3[] = [];
      const burstColors = new Float32Array(tempCount * 3);

      for (let i = 0; i < tempCount; i++) {
        // Spawns near top of cake
        burstPos[i * 3] = (Math.random() - 0.5) * 0.5;
        burstPos[i * 3 + 1] = cakeHeight + 1.2;
        burstPos[i * 3 + 2] = (Math.random() - 0.5) * 0.5;

        // Radial burst velocity
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos((Math.random() * 2) - 1);
        const speed = Math.random() * 0.08 + 0.04;
        
        burstVel.push(new THREE.Vector3(
          Math.sin(phi) * Math.cos(theta) * speed,
          Math.cos(phi) * speed + 0.03, // bias upward
          Math.sin(phi) * Math.sin(theta) * speed
        ));

        const hex = particleColors[Math.floor(Math.random() * particleColors.length)];
        const c = new THREE.Color(hex);
        burstColors[i * 3] = c.r;
        burstColors[i * 3 + 1] = c.g;
        burstColors[i * 3 + 2] = c.b;
      }

      burstGeom.setAttribute("position", new THREE.BufferAttribute(burstPos, 3));
      burstGeom.setAttribute("color", new THREE.BufferAttribute(burstColors, 3));

      const burstMat = new THREE.PointsMaterial({
        size: 0.22,
        map: pTexture,
        vertexColors: true,
        transparent: true,
        opacity: 1.0,
        depthWrite: false,
        blending: THREE.AdditiveBlending
      });

      const burstPoints = new THREE.Points(burstGeom, burstMat);
      scene.add(burstPoints);

      // Animate the burst and clean it up after 1.5 seconds
      let burstAge = 0;
      const maxAge = 60;
      
      const animateBurst = () => {
        if (burstAge >= maxAge) {
          scene.remove(burstPoints);
          burstGeom.dispose();
          burstMat.dispose();
          return;
        }

        const positionsAttr = burstGeom.attributes.position as THREE.BufferAttribute;
        for (let i = 0; i < tempCount; i++) {
          positionsAttr.setX(i, positionsAttr.getX(i) + burstVel[i].x);
          positionsAttr.setY(i, positionsAttr.getY(i) + burstVel[i].y);
          positionsAttr.setZ(i, positionsAttr.getZ(i) + burstVel[i].z);

          // gravity pull
          burstVel[i].y -= 0.0015;
        }
        positionsAttr.needsUpdate = true;
        burstMat.opacity = 1.0 - (burstAge / maxAge);

        burstAge++;
        requestAnimationFrame(animateBurst);
      };

      animateBurst();
    };

    container.addEventListener("click", handleMouseClick);

    // 7. Handle full responsive resizing inside container smoothly
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
      }
    });
    resizeObserver.observe(container);

    // 8. Animation & Render loop
    let animationFrameId = 0;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const elapsedTime = clock.getElapsedTime();

      // Gentle rotating of whole cake assembly
      cakeGroup.rotation.y += 0.005;

      // Inertial spring motion for mouse-tilt feedback
      cakeGroup.rotation.x += (targetRotationX - cakeGroup.rotation.x) * 0.08;
      cakeGroup.rotation.z += (targetRotationY - cakeGroup.rotation.z) * 0.08;

      // Animate candle flames (waving/flickering organic effect)
      for (let i = 0; i < flamesArray.length; i++) {
        const f = flamesArray[i];
        const scaleVariation = 0.95 + Math.sin(elapsedTime * 12 + i * 1.5) * 0.12 + (Math.random() - 0.5) * 0.05;
        f.scale.set(scaleVariation, scaleVariation, scaleVariation);
        
        // Slight flame wobble
        f.rotation.z = Math.sin(elapsedTime * 8 + i * 2) * 0.06;
      }

      // Drift floating background particles downward
      const posAttr = particleSystem.geometry.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < particleCount; i++) {
        let y = posAttr.getY(i);
        y -= speeds[i];

        // Loop particles to the top once they sink past -3
        if (y < -3.0) {
          y = 5.0 + Math.random() * 2;
        }
        posAttr.setY(i, y);

        // Subtle side swaying
        let x = posAttr.getX(i);
        x += Math.sin(elapsedTime * 0.5 + i) * 0.003;
        posAttr.setX(i, x);
      }
      posAttr.needsUpdate = true;

      // Render frame
      renderer.render(scene, camera);
    };

    animate();

    // 9. Strict Cleanup routine to prevent active GL leaks
    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      
      container.removeEventListener("mousemove", handleMouseMove);
      container.removeEventListener("click", handleMouseClick);
      
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }

      // Dispose Geometries and Materials
      plateGeom.dispose();
      cakeGeom.dispose();
      middleRingGeom.dispose();
      creamGeom.dispose();
      particleGeom.dispose();
      particleMat.dispose();
      plateMat.dispose();
      baseMat.dispose();
      middleMat.dispose();
      frostingMat.dispose();
      pTexture.dispose();
      
      renderer.dispose();
    };
  }, [theme, cakeType]);

  return (
    <div 
      ref={containerRef} 
      className="w-full h-full min-h-[300px] cursor-grab active:cursor-grabbing relative overflow-hidden"
    >
      {/* Tiny instructions helper overlay */}
      <div className="absolute bottom-2.5 left-2.5 bg-black/60 backdrop-blur-md px-2.5 py-1.5 rounded-lg border border-white/10 text-[9px] text-white/80 font-semibold tracking-wider uppercase pointer-events-none z-10 flex items-center gap-1.5">
        <span>🎮 Drag to Rotate</span>
        <span className="opacity-40">•</span>
        <span>✨ Click to Burst</span>
      </div>
    </div>
  );
}
