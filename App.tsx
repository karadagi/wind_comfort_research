import React, { useRef, useEffect, useState } from 'react';
import { motion, useScroll, useSpring, AnimatePresence, useInView } from 'framer-motion';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { WindRose, MeshGrid, LogProfile } from './components/Diagrams';
import { COMFORT_COLORS, ComfortClass } from './types';

const SCENES = [
  { id: 'context', title: 'Context / Problem', duration: 1 },
  { id: 'model3d', title: '3D Site Exploration', duration: 1 },
  { id: 'climate', title: 'Climate Input', duration: 1 },
  { id: 'setup1', title: 'CFD Setup (Global)', duration: 1 },
  { id: 'setup2', title: 'CFD Setup (Local)', duration: 1 },
  { id: 'profile', title: 'Boundary Conditions', duration: 1 },
  { id: 'existing', title: 'Existing Condition', duration: 1 },
  { id: 'existing_discomfort', title: 'Discomfort Analysis', duration: 1 },
  { id: 'flow', title: 'Flow Explanation', duration: 1 },
  { id: 'flow2', title: 'Flow Visualization', duration: 1 },
  { id: 'design', title: 'Design Intervention', duration: 1 },
  { id: 'design2', title: 'Design Visualization', duration: 1 },
  { id: 'design3', title: 'Design Validation', duration: 1 },
  { id: 'final', title: 'Final Condition', duration: 1 },
  { id: 'comparison', title: 'Impact Analysis', duration: 1 },
];

const StepTrigger: React.FC<{ index: number; onInView: (index: number) => void }> = ({ index, onInView }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { margin: "-50% 0px -50% 0px", amount: 0 });

  useEffect(() => {
    if (isInView) {
      onInView(index);
    }
  }, [isInView, index, onInView]);

  return <div ref={ref} className="h-[75vh] pointer-events-none" />;
};

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
    loader.load(`${import.meta.env.BASE_URL}Garanti.glb`, (gltf) => {
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

const SceneComparison: React.FC = () => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleDrag = (event: MouseEvent | TouchEvent | React.MouseEvent | React.TouchEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = 'touches' in event ? event.touches[0].clientX : (event as React.MouseEvent).clientX;
    const position = ((x - rect.left) / rect.width) * 100;
    setSliderPosition(Math.min(100, Math.max(0, position)));
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      className="w-full max-w-lg aspect-[4/3] relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white select-none touch-none"
      ref={containerRef}
      onMouseMove={(e) => e.buttons === 1 && handleDrag(e)}
      onTouchMove={(e) => handleDrag(e)}
      onMouseDown={handleDrag}
    >
      {/* After Image (Background) */}
      <img
        src={`${import.meta.env.BASE_URL}Figure 11.jpg`}
        alt="After Intervention"
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        draggable="false"
      />
      <div className="absolute top-4 right-4 bg-blue-500/80 backdrop-blur text-white px-2 py-1 rounded text-xs font-bold uppercase pointer-events-none select-none">
        After
      </div>

      {/* Before Image (Foreground - Clipped) */}
      <div
        className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none"
        style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
      >
        <img
          src={`${import.meta.env.BASE_URL}Figure 7.jpg`}
          alt="Before Intervention"
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          draggable="false"
        />
        <div className="absolute top-4 left-4 bg-slate-800/80 backdrop-blur text-white px-2 py-1 rounded text-xs font-bold uppercase pointer-events-none select-none">
          Before
        </div>
      </div>

      {/* Slider Handle */}
      <div
        className="absolute inset-y-0 w-1 bg-white shadow-[0_0_10px_rgba(0,0,0,0.3)] cursor-ew-resize"
        style={{ left: `${sliderPosition}%` }}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg text-slate-400">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8L22 12L18 16" />
            <path d="M6 8L2 12L6 16" />
          </svg>
        </div>
      </div>
    </motion.div>
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

  // Removed scrollYProgress-based index setting. 
  // activeSceneIndex is now driven by StepTrigger components.

  const getPhaseLabel = (index: number) => {
    if (index === 0) return "01-1";
    if (index === 1) return "01-2";
    if (index === 2) return "02";
    if (index === 3) return "03-01";
    if (index === 4) return "03-02";
    if (index === 5) return "04";
    if (index === 6) return "05-01";
    if (index === 7) return "05-02";
    if (index === 8) return "06-01";
    if (index === 9) return "06-02";
    if (index === 10) return "07-01";
    if (index === 11) return "07-02";
    if (index === 12) return "07-03";
    if (index === 13) return "08-01";
    if (index === 14) return "08-02";
    if (index >= 15) return `0${index - 6}`;
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
              {activeSceneIndex === 3 && <SceneSetupPart1 key="3" />}
              {activeSceneIndex === 4 && <SceneSetupPart2 key="4" />}
              {activeSceneIndex === 5 && <SceneProfile key="5" />}
              {activeSceneIndex === 6 && <SceneResults key="6" isImproved={false} />}
              {activeSceneIndex === 7 && <SceneDiscomfort key="7" />}
              {activeSceneIndex === 8 && <SceneFlow key="8" />}
              {activeSceneIndex === 9 && <SceneFlowPart2 key="9" />}
              {activeSceneIndex === 10 && <SceneIntervention key="10" />}
              {activeSceneIndex === 11 && <SceneInterventionPart2 key="11" />}
              {activeSceneIndex === 12 && <SceneDesignValidation key="12" />}
              {activeSceneIndex === 13 && <SceneResults key="13" isImproved={true} />}
              {activeSceneIndex === 14 && <SceneComparison key="14" />}
            </AnimatePresence>

            {/* Comfort Legend - Only for steps 05-02(7) and 08-02(14) */}
            {(activeSceneIndex === 7 || activeSceneIndex === 14) && <ComfortLegend />}
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
              <div className="flex items-center gap-3 mb-2">
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
        <div className="absolute bottom-10 left-10 right-10 flex justify-end items-center pointer-events-none">

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
        <StepTrigger key={i} index={i} onInView={setActiveSceneIndex} />
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
    "The simulation domain is established. A large, virtual wind tunnel is created around the site, respecting blockage ratios to prevent artificial acceleration.",
    "The mesh is locally refined around key structures. High-density cells capture complex flow separation and turbulence where it matters most for pedestrian comfort.",
    "We define the atmospheric boundary layer conditions. The inlet wind profile follows a logarithmic law (z0 = 0.5m), representing the urban roughness of the surrounding cityscape.",
    // 05-01 (Index 6)
    "Initial CFD results reveal extensive Class E zones. In these areas, the probability of exceeding the 5m/s comfort threshold makes static activities impossible.",
    // 05-02 (Index 7) - Duplicate of 06-03 content
    "Mapping the discomfort levels (Figure 7). The red areas (Class E) represent danger zones where gusts exceed safety limits. This requires immediate mitigation.",
    // 06-01 (Index 8)
    "Detailed analysis highlights the specific areas of high turbulence intensity. The generated streamlines confirm the channeling effect caused by the tower geometry.",
    // 06-02 (Index 9)
    "Flow visualizations highlight a massive recirculation vortex. Accelerated air is channeled directly into the courtyard, creating a hostile environment.",
    "Cross-section analysis (Figure 10) reveals the vertical extent of the vortex. The downwash from the tower hits the podium and recirculates into the pedestrian zone.",
    "Our design-led intervention: a system of aerodynamic canopies and vertical baffles. These elements break the channeling path and dissipate energy.",
    "The proposed canopy design integrates with the existing architecture. It provides necessary shelter while maintaining the visual connection to the surrounding towers.",
    "Dynamic simulation confirms the effectiveness of the intervention. The video demonstrates how the proposed structure disrupts the vortex formation.",
    "Validation: The final simulation shows a dramatic reduction in wind velocity. Class E areas are reclaimed, ensuring a safe, comfortable public realm.",
    "Compare the original vs. improved condition. Use the slider to reveal how the baffle system drastically reduces the critical turbulence zones."
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
    <img
      src={`${import.meta.env.BASE_URL}windrose.png`}
      alt="Wind Rose Analysis"
      className="w-full h-full object-contain drop-shadow-xl"
    />
  </motion.div>
);

// New Scene Components
const SceneSetupPart1: React.FC = () => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -30 }}
    className="w-full max-w-lg space-y-6 flex flex-col items-center"
  >
    <div className="w-full bg-white p-2 rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
      <img
        src={`${import.meta.env.BASE_URL}Figure 4.jpg`}
        alt="Global Domain Setup"
        className="w-full h-auto object-cover rounded-2xl"
      />
    </div>
    <div className="flex justify-between text-[11px] text-slate-400 font-bold uppercase tracking-widest w-full px-4">
      <span className="text-blue-500">Global Domain</span>
      <span>Setup Phase 01</span>
    </div>
  </motion.div>
);

const SceneSetupPart2: React.FC = () => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -30 }}
    className="w-full max-w-lg space-y-6 flex flex-col items-center"
  >
    <div className="w-full bg-white p-2 rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
      <img
        src={`${import.meta.env.BASE_URL}Figure 5.jpg`}
        alt="Local Mesh Refinement"
        className="w-full h-auto object-cover rounded-2xl"
      />
    </div>
    <div className="flex justify-between text-[11px] text-slate-400 font-bold uppercase tracking-widest w-full px-4">
      <span>Mesh Grid</span>
      <span className="text-blue-500">Local Refinement</span>
    </div>
  </motion.div>
);

const SceneProfile: React.FC = () => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, scale: 0.9 }}
    className="w-full max-w-lg space-y-6 flex flex-col items-center"
  >
    <div className="w-full h-64 bg-white p-4 rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex items-center justify-center">
      <LogProfile />
    </div>
    <div className="flex justify-between text-[11px] text-slate-400 font-bold uppercase tracking-widest w-full px-4">
      <span>Inlet Profile</span>
      <span className="text-blue-500">Logarithmic Law</span>
    </div>
  </motion.div>
);

const SceneResults: React.FC<{ isImproved: boolean }> = ({ isImproved }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.95 }}
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

const SceneExistingPart2: React.FC = () => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -30 }}
    className="w-full max-w-lg space-y-6 flex flex-col items-center"
  >
    <div className="w-full bg-white p-2 rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
      <img
        src={`${import.meta.env.BASE_URL}Figure 7.jpg`}
        alt="Existing Condition Analysis"
        className="w-full h-auto object-cover rounded-2xl"
      />
    </div>
    <div className="flex justify-between text-[11px] text-slate-400 font-bold uppercase tracking-widest w-full px-4">
      <span>Baseline</span>
      <span className="text-red-500">Critical Zone</span>
    </div>
  </motion.div>
);

const SceneFlow: React.FC = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="w-full max-w-lg relative"
  >
    <div className="bg-white p-2 rounded-3xl shadow-2xl border border-slate-100 overflow-hidden relative">
      <img
        src={`${import.meta.env.BASE_URL}section.JPG`}
        alt="Section Analysis"
        className="w-full h-auto object-cover rounded-2xl opacity-90"
      />

      <svg className="absolute inset-0 w-full h-full pointer-events-none rounded-2xl" viewBox="0 0 400 300" preserveAspectRatio="none">
        <defs>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* High Flow (Undisturbed) */}
        {[0, 1].map((i) => (
          <motion.path
            key={`high-${i}`}
            d={`M -50 ${20 + i * 15} Q 200 ${20 + i * 15}, 450 ${10 + i * 15}`}
            fill="none"
            stroke="#94a3b8"
            strokeWidth="1"
            strokeDasharray="4 2"
            animate={{ strokeDashoffset: [-50, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear", delay: i * 0.5 }}
          />
        ))}

        {/* Complex Spiraling Downwash - Matching User Highlight */}
        {[0, 1, 2].map((i) => (
          <motion.path
            key={`spiral-down-${i}`}
            // Path logic: High arch out -> Sharp loop back in -> Wide spiral down
            d={`M -50 ${40 + i * 10} 
               Q 150 ${40 + i * 10}, 280 ${60 + i * 5} 
               C 380 ${80}, 380 ${180}, 240 ${200} 
               C 180 ${210}, 180 ${150}, 280 ${140}
               C 380 ${130}, 380 ${250}, 240 ${280}`}
            fill="none"
            stroke={i === 2 ? "#ef4444" : "#3b82f6"} // Core becomes redder
            strokeWidth={3}
            strokeDasharray={i === 2 ? "12 8" : "15 5"}
            opacity={0.9}
            animate={{ strokeDashoffset: [0, -300] }}
            transition={{
              duration: 3.5,
              repeat: Infinity,
              ease: "linear",
              delay: i * 0.5
            }}
          />
        ))}

        {/* Secondary Vortex loops for density */}
        <motion.path
          d="M 240 220 C 300 240, 300 270, 240 280"
          fill="none"
          stroke="#ef4444"
          strokeWidth="2"
          strokeDasharray="6 4"
          filter="url(#glow)"
          opacity={0.6}
          animate={{ strokeDashoffset: [50, 0] }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "linear"
          }}
        />

        <text x="20" y="40" fill="#3b82f6" fontSize="12" fontWeight="bold" className="uppercase tracking-widest">Incoming</text>
        <text x="280" y="140" fill="#3b82f6" fontSize="10" fontWeight="bold" className="uppercase tracking-widest" transform="rotate(90, 280, 140)">Downwash</text>
        <text x="180" y="270" fill="#ef4444" fontSize="12" fontWeight="bold" className="uppercase tracking-widest">Vortex</text>
      </svg>
    </div>

    <div className="absolute top-6 right-6 bg-white/80 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold text-slate-500 border border-slate-200 shadow-sm">
      SECTION A-A: Spiraling Wake
    </div>
  </motion.div>
);

const SceneFlowPart2: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<'perspective' | 'plan'>('perspective');

  const content = {
    perspective: {
      src: 'stream1.jpg',
      label: '3D Flow Perspective',
      tag: 'Streamline 3D'
    },
    plan: {
      src: 'stream2.jpg',
      label: 'Flow Plan View',
      tag: 'Plan Analysis'
    }
  };

  const activeContent = content[view];

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -30 }}
        className="w-full max-w-lg space-y-4 flex flex-col items-center"
      >
        <div
          className="w-full bg-white p-2 rounded-3xl shadow-2xl border border-slate-100 overflow-hidden cursor-zoom-in relative group transition-transform hover:scale-[1.02]"
          onClick={() => setIsOpen(true)}
        >
          <motion.img
            key={view}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            src={`${import.meta.env.BASE_URL}${activeContent.src}`}
            alt={activeContent.label}
            className="w-full h-auto object-cover rounded-2xl"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
            <span className="bg-white/90 backdrop-blur text-slate-800 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
              Click to Expand
            </span>
          </div>
        </div>

        {/* View Toggles */}
        <div className="flex bg-slate-100 p-1 rounded-full gap-1">
          {(['perspective', 'plan'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all ${view === v
                ? 'bg-white text-blue-500 shadow-sm'
                : 'text-slate-400 hover:text-slate-600'
                }`}
            >
              {v}
            </button>
          ))}
        </div>

        <div className="flex justify-between text-[11px] text-slate-400 font-bold uppercase tracking-widest w-full px-4">
          <span>Flow Mechanics</span>
          <span className="text-red-500">{activeContent.tag}</span>
        </div>
      </motion.div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/90 backdrop-blur-md p-4 lg:p-12 cursor-zoom-out"
            onClick={() => setIsOpen(false)}
          >
            <motion.img
              key={view}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              src={`${import.meta.env.BASE_URL}${activeContent.src}`}
              className="w-[90vw] h-[85vh] object-contain rounded-lg shadow-2xl"
              alt={activeContent.label}
            />
            <div className="absolute top-6 right-6 text-white/70 text-xs font-bold uppercase tracking-widest border border-white/20 px-3 py-1 rounded-full hover:bg-white/10 transition-colors">
              Close Preview
            </div>

            {/* Modal Toggles */}
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex bg-white/10 backdrop-blur-md p-1 rounded-full gap-1 border border-white/20" onClick={(e) => e.stopPropagation()}>
              {(['perspective', 'plan'] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all ${view === v
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-white/60 hover:text-white'
                    }`}
                >
                  {v}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

const SceneDiscomfort: React.FC = () => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -30 }}
    className="w-full max-w-lg space-y-6 flex flex-col items-center"
  >
    <div className="w-full bg-white p-2 rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
      <img
        src={`${import.meta.env.BASE_URL}Figure 7.jpg`}
        alt="Wind Comfort Analysis"
        className="w-full h-auto object-cover rounded-2xl"
      />
    </div>
    <div className="flex justify-between text-[11px] text-slate-400 font-bold uppercase tracking-widest w-full px-4">
      <span>NEN 8100</span>
      <span className="text-red-500">Discomfort Zones</span>
    </div>
  </motion.div>
);

const ComfortLegend: React.FC = () => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    className="absolute bottom-6 left-6 bg-white/90 backdrop-blur-xl p-3 rounded-xl border border-slate-200 shadow-xl"
  >
    <div className="flex flex-col gap-1">
      {Object.values(ComfortClass).reverse().map((cls) => (
        <div key={cls} className="flex items-center gap-2">
          <div className="w-4 h-4 rounded shadow-sm" style={{ backgroundColor: COMFORT_COLORS[cls] }} />
          <span className="text-[10px] font-bold text-slate-600 w-4">{cls}</span>
        </div>
      ))}
    </div>
    <div className="mt-2 pt-2 border-t border-slate-100 text-[9px] font-bold text-slate-400 uppercase tracking-wider text-center">
      NEN 8100
    </div>
  </motion.div>
);

const SceneIntervention: React.FC = () => (
  <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -40 }} className="w-full max-w-lg">
    <div className="bg-white p-8 rounded-3xl shadow-2xl border border-slate-100 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl" />
      <svg viewBox="0 0 200 200">
        <rect x="85" y="30" width="30" height="120" fill="none" stroke="#e2e8f0" strokeWidth="1" />
        {/* Animated Canopy Design */}
        <motion.g
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
        >
          <rect x="60" y="110" width="80" height="4" rx="2" fill="#3b82f6" />
          <line x1="60" y1="114" x2="60" y2="135" stroke="#3b82f6" strokeWidth="2.5" />
          <line x1="140" y1="114" x2="140" y2="135" stroke="#3b82f6" strokeWidth="2.5" />
          <text x="100" y="100" textAnchor="middle" fill="#3b82f6" fontSize="8" fontWeight="bold" className="uppercase tracking-widest">Canopy System</text>
        </motion.g>
      </svg>
    </div>
  </motion.div>
);

const SceneInterventionPart2: React.FC = () => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -30 }}
    className="w-full max-w-lg space-y-6 flex flex-col items-center"
  >
    <div className="w-full bg-white p-2 rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
      <img
        src={`${import.meta.env.BASE_URL}canopy.jpg`}
        alt="Proposed Canopy Design"
        className="w-full h-auto object-cover rounded-2xl"
      />
    </div>
    <div className="flex justify-between text-[11px] text-slate-400 font-bold uppercase tracking-widest w-full px-4">
      <span>Rendering</span>
      <span className="text-blue-500">Proposed Design</span>
    </div>
  </motion.div>
);

const SceneDesignValidation: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -30 }}
        className="w-full max-w-lg space-y-6 flex flex-col items-center"
      >
        <div
          className="w-full bg-white p-2 rounded-3xl shadow-2xl border border-slate-100 overflow-hidden cursor-zoom-in relative group transition-transform hover:scale-[1.02]"
          onClick={() => setIsOpen(true)}
        >
          <video
            src={`${import.meta.env.BASE_URL}Resolution.mp4`}
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-auto object-cover rounded-2xl"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
            <span className="bg-white/90 backdrop-blur text-slate-800 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
              Click to Expand
            </span>
          </div>
        </div>
        <div className="flex justify-between text-[11px] text-slate-400 font-bold uppercase tracking-widest w-full px-4">
          <span>Simulation</span>
          <span className="text-blue-500">Transient Analysis</span>
        </div>
      </motion.div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/90 backdrop-blur-md p-4 lg:p-12 cursor-zoom-out"
            onClick={() => setIsOpen(false)}
          >
            <motion.video
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              src={`${import.meta.env.BASE_URL}Resolution.mp4`}
              autoPlay
              loop
              muted
              playsInline
              className="w-[90vw] h-[85vh] object-contain rounded-lg shadow-2xl"
            />
            <div className="absolute top-6 right-6 text-white/70 text-xs font-bold uppercase tracking-widest border border-white/20 px-3 py-1 rounded-full hover:bg-white/10 transition-colors">
              Close Preview
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default App;
