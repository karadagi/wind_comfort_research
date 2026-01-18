
import React, { useRef, useEffect, useState } from 'react';
import { motion, useScroll, useSpring, AnimatePresence } from 'framer-motion';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { WindRose, MeshGrid, LogProfile } from './components/Diagrams';
import { COMFORT_COLORS } from './types';

const SCENES = [
  { id: 'context', title: 'Context / Problem', duration: 1 },
  { id: 'model3d', title: '3D Site Exploration', duration: 1 },
  { id: 'climate', title: 'Climate Input', duration: 1 },
  { id: 'setup', title: 'CFD Setup', duration: 1 },
  { id: 'profile', title: 'Reference Profile', duration: 1 },
  { id: 'existing', title: 'Existing Condition', duration: 1 },
  { id: 'flow', title: 'Flow Explanation', duration: 1 },
  { id: 'design', title: 'Design Intervention', duration: 1 },
  { id: 'final', title: 'Final Condition', duration: 1 },
];

const ThreeDViewer: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(12, 10, 15);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = false;
    containerRef.current.appendChild(renderer.domElement);

    // Controls - Using standard defaults (Left: Rotate, Right: Pan)
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = true;
    controls.minDistance = 5;
    controls.maxDistance = 60;
    controls.target.set(0, 1, 0);

    // Load User Model
    const loader = new GLTFLoader();
    loader.load('/Garanti.glb', (gltf) => {
      const model = gltf.scene;
      model.scale.set(0.05, 0.05, 0.05);

      // Auto-center and normalize scale if needed
      const box = new THREE.Box3().setFromObject(model);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());

      // Center the model
      model.position.x = -center.x;
      model.position.y = -box.min.y; // Sit on ground
      model.position.z = -center.z;

      const monoMaterial = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.8,
        metalness: 0.1,
        side: THREE.DoubleSide
      });

      const edgeMaterial = new THREE.LineBasicMaterial({ color: 0x000000 });

      model.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          (child as THREE.Mesh).material = monoMaterial;

          // Add outline
          const edges = new THREE.EdgesGeometry((child as THREE.Mesh).geometry);
          const line = new THREE.LineSegments(edges, edgeMaterial);
          child.add(line);
        }
      });

      scene.add(model);
    }, undefined, (error) => {
      console.error('An error occurred loading the model:', error);
    });

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(20, 30, 10);
    scene.add(dirLight);

    // Animation Loop
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (containerRef.current) {
        containerRef.current.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div className="relative w-full h-full flex flex-col group">
      <div ref={containerRef} className="flex-1 rounded-2xl overflow-hidden shadow-2xl border border-slate-100 bg-white cursor-move" />

      {/* Dynamic Overlay Info */}
      <div className="absolute top-6 left-6 bg-white/90 backdrop-blur-xl p-4 rounded-xl border border-slate-200 shadow-xl pointer-events-none transition-all duration-500 opacity-90 group-hover:opacity-100">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          <p className="text-[11px] font-bold text-slate-700 uppercase tracking-widest">Active Model Viewport</p>
        </div>
        <div className="space-y-1">
          <p className="text-[10px] text-slate-500 flex justify-between gap-4"><span>Orbit</span> <span className="font-mono text-slate-400">Left Click</span></p>
          <p className="text-[10px] text-slate-500 flex justify-between gap-4"><span>Pan</span> <span className="font-mono text-slate-400">Right Click</span></p>
          <p className="text-[10px] text-slate-500 flex justify-between gap-4"><span>Zoom</span> <span className="font-mono text-slate-400">Scroll</span></p>
        </div>
      </div>

      <div className="absolute bottom-6 right-6 flex gap-2">
        <div className="px-3 py-1 bg-slate-900 text-white text-[9px] font-bold rounded-full uppercase tracking-tighter shadow-lg">Site-A01</div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  const [activeSceneIndex, setActiveSceneIndex] = useState(0);

  useEffect(() => {
    return scrollYProgress.onChange((latest) => {
      const index = Math.min(
        Math.floor(latest * SCENES.length),
        SCENES.length - 1
      );
      setActiveSceneIndex(index);
    });
  }, [scrollYProgress]);

  const getPhaseLabel = (index: number) => {
    if (index === 0) return "01-1";
    if (index === 1) return "01-2";
    return `0${index}`;
  };

  return (
    <div ref={containerRef} className="relative bg-white selection:bg-blue-100">
      <div className="sticky top-0 h-screen w-full flex items-center justify-center overflow-hidden">
        <div className="relative w-full max-w-7xl h-[85vh] flex flex-col lg:flex-row items-center justify-between px-6 lg:px-12 gap-12 lg:gap-20">

          {/* Main Visual Content */}
          <div className="relative flex-1 h-full w-full flex items-center justify-center">
            <AnimatePresence mode="wait">
              {activeSceneIndex === 0 && <SceneContext key="0" />}
              {activeSceneIndex === 1 && <motion.div key="1" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.02 }} className="w-full h-full"><ThreeDViewer /></motion.div>}
              {activeSceneIndex === 2 && <SceneClimate key="2" />}
              {activeSceneIndex === 3 && <SceneSetup key="3" />}
              {activeSceneIndex === 4 && <SceneProfile key="4" />}
              {activeSceneIndex === 5 && <SceneResults key="5" isImproved={false} />}
              {activeSceneIndex === 6 && <SceneFlow key="6" />}
              {activeSceneIndex === 7 && <SceneIntervention key="7" />}
              {activeSceneIndex === 8 && <SceneResults key="8" isImproved={true} />}
            </AnimatePresence>
          </div>

          {/* Narrative Sidebar */}
          <div className="lg:w-96 shrink-0 z-10 flex flex-col justify-center">
            <motion.div
              key={activeSceneIndex}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-6"
            >
              <div className="flex items-center gap-3">
                <span className="h-px w-8 bg-slate-300" />
                <h2 className="text-xs font-bold uppercase tracking-widest text-blue-500">
                  Step {getPhaseLabel(activeSceneIndex)}
                </h2>
              </div>
              <h1 className="text-4xl font-light text-slate-900 leading-tight tracking-tight">
                {SCENES[activeSceneIndex].title}
              </h1>
              <div className="text-slate-500 font-light text-base lg:text-lg leading-relaxed antialiased">
                <SceneDescription index={activeSceneIndex} />
              </div>
              <div className="pt-6">
                <div className="flex items-center gap-4 text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                  <span className={activeSceneIndex === 1 ? 'text-blue-500' : ''}>3D View</span>
                  <span>•</span>
                  <span>Infographic</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Global UI Elements */}
        <div className="absolute bottom-10 left-10 right-10 flex justify-between items-center pointer-events-none">
          <div className="flex gap-6 pointer-events-auto">
            <LegendItem label="Comfort A" color={COMFORT_COLORS.A} />
            <LegendItem label="Comfort E" color={COMFORT_COLORS.E} />
          </div>
          <div className="hidden lg:flex items-center gap-6 pointer-events-auto">
            <div className="flex flex-col items-end gap-1">
              <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Progress</span>
              <div className="w-48 h-1 bg-slate-100 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-blue-500"
                  style={{ scaleX: smoothProgress, transformOrigin: 'left' }}
                />
              </div>
            </div>
            <div className="text-[10px] font-mono text-slate-400">
              {Math.round(activeSceneIndex / (SCENES.length - 1) * 100)}%
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Trigger Sections */}
      {SCENES.map((_, i) => (
        <div key={i} className="h-[50vh] pointer-events-none" />
      ))}
    </div>
  );
};

const LegendItem: React.FC<{ label: string; color: string }> = ({ label, color }) => (
  <div className="flex items-center gap-3">
    <div className="w-2.5 h-2.5 rounded-full ring-2 ring-slate-100" style={{ backgroundColor: color }} />
    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">{label}</span>
  </div>
);

const SceneDescription: React.FC<{ index: number }> = ({ index }) => {
  const descriptions = [
    "High-rise structures significantly alter local microclimates. Our target: a central courtyard experiencing severe wind nuisance due to downwash and corner effects.",
    "Navigate the site model to inspect the architectural constraints. Use your mouse to rotate and zoom into the sunken courtyard where wind speeds peak.",
    "Historical climate data from the nearest weather station is analyzed. We extract the prevailing wind vectors that trigger discomfort at the pedestrian level.",
    "The simulation space is partitioned. We apply a fine mesh to the tower facade and courtyard surfaces to capture turbulent eddies and flow separation precisely.",
    "Wind behavior is height-dependent. We establish a logarithmic reference profile, mapping the acceleration from 60m down to the 1.75m pedestrian zone.",
    "Initial CFD results reveal extensive Class E zones. In these areas, the probability of exceeding the 5m/s comfort threshold makes static activities impossible.",
    "Flow visualizations highlight a massive recirculation vortex. Accelerated air is channeled directly into the courtyard, creating a hostile environment.",
    "Our design-led intervention: a system of aerodynamic canopies and vertical baffles. These elements break the channeling path and dissipate energy.",
    "Validation: The final simulation shows a dramatic reduction in wind velocity. Class E areas are reclaimed, ensuring a safe, comfortable public realm."
  ];
  return <p>{descriptions[index]}</p>;
};

const SceneContext: React.FC = () => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 1.05 }}
    className="relative w-full h-full flex items-center justify-center"
  >
    <svg viewBox="0 0 400 300" className="w-full max-w-lg filter drop-shadow-2xl">
      <defs>
        <linearGradient id="towerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f8fafc" />
          <stop offset="100%" stopColor="#e2e8f0" />
        </linearGradient>
      </defs>
      <motion.rect
        x="160" y="40" width="80" height="220" rx="40"
        fill="url(#towerGrad)" stroke="#cbd5e1" strokeWidth="0.5"
      />
      <rect x="180" y="210" width="40" height="30" fill="#ffffff" stroke="#94a3b8" strokeWidth="1" />
      <motion.g
        initial={{ x: -60, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
      >
        <line x1="20" y1="180" x2="140" y2="180" stroke="#3b82f6" strokeWidth="1.5" strokeDasharray="4 4" />
        <path d="M 140 180 L 132 176 L 132 184 Z" fill="#3b82f6" />
        <text x="20" y="170" fontSize="10" fill="#3b82f6" fontWeight="bold" className="tracking-tighter uppercase">Incident Wind Path</text>
      </motion.g>
    </svg>
  </motion.div>
);

const SceneClimate: React.FC = () => (
  <motion.div
    initial={{ opacity: 0, rotate: -15 }}
    animate={{ opacity: 1, rotate: 0 }}
    exit={{ opacity: 0, rotate: 15 }}
    className="w-80 h-80"
  >
    <WindRose activeSector={3} />
  </motion.div>
);

const SceneSetup: React.FC = () => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    animate={{ opacity: 1, y: 0 }}
    className="w-full max-w-lg space-y-6"
  >
    <div className="bg-white p-8 rounded-3xl shadow-2xl border border-slate-100">
      <MeshGrid density={32} />
    </div>
    <div className="flex justify-between text-[11px] text-slate-400 font-bold uppercase tracking-widest">
      <span>Global Domain</span>
      <span className="text-blue-500">Local Refinement</span>
    </div>
  </motion.div>
);

const SceneProfile: React.FC = () => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    className="w-full max-w-lg h-80"
  >
    <LogProfile />
  </motion.div>
);

const SceneResults: React.FC<{ isImproved: boolean }> = ({ isImproved }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    className="relative w-full max-w-lg"
  >
    <div className="bg-white p-4 rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
      <svg viewBox="0 0 200 200" className="w-full h-full bg-slate-50 rounded-2xl">
        <rect x="70" y="70" width="60" height="60" fill="#fff" stroke="#cbd5e1" strokeWidth="0.5" />
        <AnimatePresence>
          {!isImproved ? (
            <motion.g key="bad" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <circle cx="100" cy="100" r="45" fill={COMFORT_COLORS.E} fillOpacity="0.5" />
              <circle cx="125" cy="110" r="25" fill={COMFORT_COLORS.E} fillOpacity="0.7" />
              <text x="100" y="105" fontSize="11" textAnchor="middle" fill="#991b1b" fontWeight="900" className="tracking-tighter">CLASS E</text>
            </motion.g>
          ) : (
            <motion.g key="good" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <circle cx="100" cy="100" r="40" fill={COMFORT_COLORS.A} fillOpacity="0.4" />
              <text x="100" y="105" fontSize="11" textAnchor="middle" fill="#166534" fontWeight="900" className="tracking-tighter">CLASS A</text>
            </motion.g>
          )}
        </AnimatePresence>
      </svg>
    </div>
    <div className="mt-6 flex items-center justify-center">
      <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm ${isImproved ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
        Status: {isImproved ? 'OPTIMIZED' : 'UNSAFE'}
      </div>
    </div>
  </motion.div>
);

const SceneFlow: React.FC = () => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full max-w-lg">
    <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 shadow-inner">
      <svg viewBox="0 0 200 150">
        <rect x="85" y="20" width="30" height="100" fill="none" stroke="#cbd5e1" strokeDasharray="2 2" />
        {[...Array(6)].map((_, i) => (
          <motion.path
            key={i}
            d={`M 10 ${10 + i * 25} C 60 ${10 + i * 25}, 90 ${10 + i * 25}, 100 110`}
            fill="none"
            stroke="#3b82f6"
            strokeWidth="1.5"
            strokeDasharray="4 3"
            animate={{ strokeDashoffset: [40, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'linear', delay: i * 0.2 }}
          />
        ))}
        <circle cx="100" cy="115" r="4" fill="#ef4444" className="animate-ping" />
        <text x="110" y="125" fontSize="7" fill="#ef4444" fontWeight="900" className="uppercase tracking-tight">Vortex Region</text>
      </svg>
    </div>
  </motion.div>
);

const SceneIntervention: React.FC = () => (
  <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-lg">
    <div className="bg-slate-900 p-8 rounded-3xl shadow-2xl border border-slate-700 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl" />
      <svg viewBox="0 0 200 200">
        <rect x="85" y="30" width="30" height="120" fill="none" stroke="#334155" strokeWidth="1" />
        {/* Animated Canopy Design */}
        <motion.g
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
        >
          <rect x="60" y="110" width="80" height="4" rx="2" fill="#38bdf8" />
          <line x1="60" y1="114" x2="60" y2="135" stroke="#38bdf8" strokeWidth="2.5" />
          <line x1="140" y1="114" x2="140" y2="135" stroke="#38bdf8" strokeWidth="2.5" />
          <text x="100" y="100" textAnchor="middle" fill="#38bdf8" fontSize="8" fontWeight="bold" className="uppercase tracking-widest">Baffle System</text>
        </motion.g>
      </svg>
    </div>
  </motion.div>
);

export default App;
