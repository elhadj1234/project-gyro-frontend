import React, { useEffect, useRef, useState, useLayoutEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowRight, CheckCircle2, ChevronRight, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Grainient from '../components/ui/Grainient/Grainient';

gsap.registerPlugin(ScrollTrigger);

// --- 1. NAVBAR ("The Floating Island") ---
const Navbar = () => {
  const navRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 100) {
        navRef.current.classList.add('bg-ghost/60', 'backdrop-blur-xl', 'border-deepvoid/10', 'border');
        navRef.current.classList.remove('bg-transparent', 'border-transparent');
      } else {
        navRef.current.classList.remove('bg-ghost/60', 'backdrop-blur-xl', 'border-deepvoid/10', 'border');
        navRef.current.classList.add('bg-transparent', 'border-transparent');
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav
      ref={navRef}
      className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-5xl rounded-[3rem] px-6 py-4 flex items-center justify-between transition-all duration-300 border-transparent text-ghost hover:text-graphite"
    >
      <div className="font-sans font-bold text-xl tracking-tight text-current">Tempra</div>
      <div className="hidden md:flex gap-8 font-mono text-sm uppercase tracking-widest text-current/80">
        <a href="#features" className="hover:-translate-y-[1px] transition-transform duration-200">Features</a>
        <a href="#process" className="hover:-translate-y-[1px] transition-transform duration-200">Protocol</a>
        <a href="#pricing" className="hover:-translate-y-[1px] transition-transform duration-200">Membership</a>
      </div>
      <button className="relative overflow-hidden bg-plasma text-ghost px-6 py-2 rounded-[2rem] font-sans font-semibold group hover:scale-[1.03] transition-transform duration-300" style={{ transitionTimingFunction: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)' }}>
        <span className="relative z-10 flex items-center gap-2">Start free trial <ArrowRight size={16} /></span>
        <span className="absolute inset-0 bg-deepvoid transform scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-500 ease-in-out z-0"></span>
      </button>
    </nav>
  );
};

// --- 2. HERO SECTION ("The Opening Shot") ---
const Hero = () => {
  const heroRef = useRef(null);
  const text1Ref = useRef(null);
  const text2Ref = useRef(null);
  const ctaRef = useRef(null);
  const navigate = useNavigate();

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo([text1Ref.current, text2Ref.current, ctaRef.current],
        { y: 40, opacity: 0 },
        { y: 0, opacity: 1, duration: 1.2, stagger: 0.15, ease: 'power3.out', delay: 0.2 }
      );
    }, heroRef);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={heroRef} className="relative h-[100dvh] w-full flex items-end pb-24 px-6 md:px-16 overflow-hidden">
      {/* Background Image & Gradient Overlays */}
      <div className="absolute inset-0 z-0 bg-deepvoid">
        <Grainient
          color1="#FF9000"
          color2="#F8481C"
          color3="#ff1f84"
          timeSpeed={0.01}
          colorBalance={0}
          warpStrength={1}
          warpFrequency={5}
          warpSpeed={0.5}
          warpAmplitude={50}
          blendAngle={0}
          blendSoftness={0.05}
          rotationAmount={100}
          noiseScale={3}
          grainAmount={0.1}
          grainScale={2}
          grainAnimated={false}
          contrast={2.2}
          gamma={1}
          saturation={1}
          centerX={0}
          centerY={0}
          zoom={0.9}
          className="opacity-70 mix-blend-screen"
        />

      </div>

      <div className="relative z-10 max-w-4xl text-ghost">
        <h1 className="flex flex-col gap-2 mb-10">
          <span ref={text1Ref} className="text-xl md:text-3xl font-sans font-bold tracking-tight opacity-0">
            Automation beyond
          </span>
          <span ref={text2Ref} className="text-6xl md:text-[8rem] leading-[0.9] text-plasma drama-text opacity-0">
            Limits.
          </span>
        </h1>
        <div ref={ctaRef} className="opacity-0">
          <button 
            onClick={() => navigate('/demo')}
            className="relative overflow-hidden bg-ghost text-deepvoid px-8 py-4 rounded-[2rem] font-sans font-bold text-lg group hover:scale-[1.03] transition-transform duration-300" style={{ transitionTimingFunction: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)' }}>
            <span className="relative z-10 flex items-center gap-2">Deploy Applications <ArrowRight size={20} /></span>
            <span className="absolute inset-0 bg-plasma text-ghost transform scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-500 ease-out z-0"></span>
          </button>
        </div>
      </div>
    </section>
  );
};


// --- 3. FEATURES ("Interactive Functional Artifacts") ---

// Card 1 - Diagnostic Shuffler
const FeatureShuffler = () => {
  const [cards, setCards] = useState([
    { id: 1, label: 'Workday Flow', color: 'bg-deepvoid', opacity: 'opacity-100', scale: 'scale-100', y: 'translate-y-0', z: 'z-30' },
    { id: 2, label: 'Greenhouse Flow', color: 'bg-graphite', opacity: 'opacity-60', scale: 'scale-95', y: '-translate-y-4', z: 'z-20' },
    { id: 3, label: 'Lever Flow', color: 'bg-[#05050A]', opacity: 'opacity-30', scale: 'scale-90', y: '-translate-y-8', z: 'z-10' }
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCards(prev => {
        const newCards = [...prev];
        const last = newCards.pop();
        newCards.unshift(last);
        return newCards.map((c, i) => ({
          ...c,
          opacity: i === 0 ? 'opacity-100' : i === 1 ? 'opacity-60' : 'opacity-30',
          scale: i === 0 ? 'scale-100' : i === 1 ? 'scale-95' : 'scale-90',
          y: i === 0 ? 'translate-y-0' : i === 1 ? '-translate-y-4' : '-translate-y-8',
          z: i === 0 ? 'z-30' : i === 1 ? 'z-20' : 'z-10',
          color: i === 0 ? 'bg-deepvoid' : i === 1 ? 'bg-graphite' : 'bg-[#05050A]'
        }));
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-ghost rounded-[2.5rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-deepvoid/5 h-full flex flex-col min-h-[400px]">
      <div className="mb-auto">
        <h3 className="font-sans font-bold text-2xl mb-2 text-deepvoid">Absolute Transparency</h3>
        <p className="text-graphite/70 font-sans">Watch forms complete in real-time. You always know exactly what data is submitted.</p>
      </div>
      <div className="relative h-48 mt-8 flex justify-center items-end pb-4">
        {cards.map((card) => (
          <div
            key={card.id}
            className={`absolute w-4/5 h-32 rounded-2xl ${card.color} text-ghost p-4 transition-all duration-700 ease-in-out ${card.opacity} ${card.scale} ${card.y} ${card.z}`}
            style={{ transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)' }}
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full bg-plasma animate-pulse"></div>
              <div className="font-mono text-xs uppercase tracking-wider">{card.label}</div>
            </div>
            <div className="space-y-2">
              <div className="h-2 w-3/4 bg-white/20 rounded-full"></div>
              <div className="h-2 w-1/2 bg-white/20 rounded-full"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Card 2 - Telemetry Typewriter
const FeatureTypewriter = () => {
  const statements = React.useMemo(() => [
    "Applying: Google",
    "Applying: Meta",
    "Applying: Apple",
    "Applying: Microsoft",
    "Applying: Amazon",
    "Applying: NVIDIA",
    "Applying: OpenAI",
    "Applying: Tesla",
    "Applying: Netflix",
    "Applying: Stripe",
    "Applying: Databricks",
    "Applying: Palantir",
    "Applying: Airbnb",
    "Applying: Uber",
    "Applying: Lyft",
    "Applying: Snap",
    "Applying: TikTok",
    "Applying: Adobe",
    "Applying: Salesforce",
    "Applying: LinkedIn",
    "Applying: Pinterest",
    "Applying: Roblox",
    "Applying: Coinbase",
    "Applying: Block (Square)",
    "Applying: Zoom"
  ], []);
  const [text, setText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [loopNum, setLoopNum] = useState(0);
  const typingSpeed = 50;

  useEffect(() => {
    let timer;
    const currentString = statements[loopNum % statements.length];

    if (isDeleting) {
      timer = setTimeout(() => {
        setText(currentString.substring(0, text.length - 1));
        if (text === '') {
          setIsDeleting(false);
          setLoopNum(loopNum + 1);
        }
      }, typingSpeed / 2);
    } else {
      timer = setTimeout(() => {
        setText(currentString.substring(0, text.length + 1));
        if (text === currentString) {
          setTimeout(() => setIsDeleting(true), 1500);
        }
      }, typingSpeed);
    }
    return () => clearTimeout(timer);
  }, [text, isDeleting, loopNum, statements]);

  // Fix linter unused vars
  // const _unused = [setIndex]; // setIndex was unused

  return (
    <div className="bg-ghost rounded-[2.5rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-deepvoid/5 h-full flex flex-col min-h-[400px]">
      <div className="mb-auto">
        <h3 className="font-sans font-bold text-2xl mb-2 text-deepvoid">Granular Control</h3>
        <p className="text-graphite/70 font-sans">Apply only to the companies you want. No rigid platform suggestions.</p>
      </div>
      <div className="mt-8 bg-graphite rounded-2xl p-6 text-ghost h-48 flex flex-col">
        <div className="flex items-center justify-between border-b border-ghost/10 pb-4 mb-4">
          <div className="font-mono text-xs text-ghost/50">Terminal Output</div>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-plasma opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-plasma"></span>
            </span>
            <span className="font-mono text-[10px] uppercase text-plasma tracking-widest">Live Feed</span>
          </div>
        </div>
        <div className="font-mono text-sm leading-relaxed">
          <span className="text-deepvoid">&gt;</span> init_targeting_protocol
          <br />
          <span className="text-plasma mt-2 inline-block">
            <span className="text-ghost/50 mr-2">$</span>
            {text}<span className="animate-pulse bg-plasma w-2 h-4 inline-block ml-1 align-middle"></span>
          </span>
        </div>
      </div>
    </div>
  );
};

// Card 3 - Cursor Protocol Scheduler
const FeatureScheduler = () => {
  const containerRef = useRef(null);
  const cursorRef = useRef(null);
  const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const [activeDays, setActiveDays] = useState([false, false, true, false, false, false, false]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ repeat: -1, repeatDelay: 1 });

      tl.set(cursorRef.current, { x: 200, y: 150, opacity: 0 })
        .to(cursorRef.current, { opacity: 1, duration: 0.3 })
        .to(cursorRef.current, { x: 75, y: 40, duration: 0.8, ease: "power2.inOut" })
        .to(cursorRef.current, {
          scale: 0.8, duration: 0.1, yoyo: true, repeat: 1, onStart: () => {
            setActiveDays(prev => { const n = [...prev]; n[2] = true; return n; })
          }
        })
        .to(cursorRef.current, { x: 140, y: 40, duration: 0.6, ease: "power2.inOut", delay: 0.2 })
        .to(cursorRef.current, {
          scale: 0.8, duration: 0.1, yoyo: true, repeat: 1, onStart: () => {
            setActiveDays(prev => { const n = [...prev]; n[4] = true; return n; })
          }
        })
        .to(cursorRef.current, { opacity: 0, duration: 0.3, delay: 0.5 })
        .call(() => setActiveDays([false, false, false, false, false, false, false])); // reset
    }, containerRef);
    return () => ctx.revert();
  }, []);

  return (
    <div className="bg-ghost rounded-[2.5rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-deepvoid/5 h-full flex flex-col min-h-[400px]">
      <div className="mb-auto">
        <h3 className="font-sans font-bold text-2xl mb-2 text-deepvoid">Built For Students</h3>
        <p className="text-graphite/70 font-sans">Maximize your reach on a university budget. 1,000 applications for $10.</p>
      </div>
      <div ref={containerRef} className="relative mt-8 bg-white border border-deepvoid/10 rounded-2xl p-6 h-48 overflow-hidden">
        <div className="flex justify-between mb-4">
          {days.map((d, i) => (
            <div key={i} className={`w-8 h-8 rounded-full flex items-center justify-center font-mono text-xs transition-colors duration-300 ${activeDays[i] ? 'bg-plasma text-ghost' : 'text-graphite/40 bg-ghost'}`}>
              {d}
            </div>
          ))}
        </div>
        <div className="w-full h-12 bg-ghost rounded-xl border border-deepvoid/10 flex items-center justify-center mt-6">
          <span className="font-mono text-xs uppercase text-deepvoid tracking-widest">Execute Batch</span>
        </div>

        {/* Animated Cursor SVG */}
        <div ref={cursorRef} className="absolute top-0 left-0 w-6 h-6 z-20 pointer-events-none drop-shadow-md">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M5.5 3.21V20.8C5.5 21.45 6.27 21.8 6.75 21.36L11.45 17.06H17.5C18.05 17.06 18.5 16.61 18.5 16.06V14.5L5.5 3.21Z" fill="#1A1A1A" stroke="white" strokeWidth="2" />
          </svg>
        </div>
      </div>
    </div>
  );
};

// --- 4. PHILOSOPHY ("The Manifesto") ---
const Philosophy = () => {
  const containerRef = useRef(null);
  const text1Ref = useRef(null);
  const text2Ref = useRef(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      // Parallax text reveal
      gsap.fromTo(text1Ref.current,
        { y: 50, opacity: 0 },
        {
          y: 0, opacity: 1, duration: 1, ease: "power3.out",
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top 70%",
          }
        }
      );

      gsap.fromTo(text2Ref.current,
        { y: 80, opacity: 0 },
        {
          y: 0, opacity: 1, duration: 1.2, ease: "power3.out", delay: 0.2,
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top 70%",
          }
        }
      );
    }, containerRef);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={containerRef} className="relative py-48 px-6 md:px-16 bg-graphite text-ghost overflow-hidden">
      <div className="absolute inset-0 z-0 opacity-20">
        <img
          src="https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=2000&auto=format&fit=crop"
          alt="Dark neon waves"
          className="w-full h-full object-cover mix-blend-overlay"
        />
      </div>
      <div className="relative z-10 max-w-5xl mx-auto flex flex-col gap-12">
        <p ref={text1Ref} className="text-xl md:text-3xl font-sans text-ghost/70 opacity-0 bg-graphite/40 p-2 rounded backdrop-blur-sm self-start inline-block">
          Most application tracking focuses on: <span className="text-ghost">endless manual entry.</span>
        </p>
        <p ref={text2Ref} className="text-5xl md:text-7xl drama-text leading-[1.1] opacity-0 bg-graphite/40 p-4 rounded backdrop-blur-sm">
          We focus on: <span className="text-plasma italic">frictionless autonomous deployment.</span>
        </p>
      </div>
    </section>
  );
};

// --- 5. PROTOCOL ("Sticky Stacking Archive") ---
const ProtocolCard = ({ step, title, description, AnimationComponent }) => {
  return (
    <div className="protocol-card sticky top-0 h-screen w-full flex items-center justify-center p-6 bg-deepvoid">
      <div className="w-full max-w-6xl aspect-[4/3] max-h-[85vh] bg-ghost rounded-[3rem] p-8 md:p-16 shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-deepvoid/5 flex flex-col md:flex-row gap-12 items-center">

        <div className="flex-1 w-full flex flex-col justify-center">
          <div className="font-mono text-deepvoid mb-6 text-sm uppercase tracking-widest flex items-center gap-4">
            <span className="w-8 h-[1px] bg-deepvoid/30 inline-block"></span>
            Phase 0{step}
          </div>
          <h2 className="text-4xl md:text-6xl font-sans font-bold text-deepvoid mb-6 leading-tight">{title}</h2>
          <p className="text-xl text-graphite/70 font-sans max-w-md leading-relaxed">{description}</p>
        </div>

        <div className="flex-1 w-full bg-graphite rounded-[2rem] aspect-square flex items-center justify-center relative overflow-hidden">
          <AnimationComponent />
        </div>

      </div>
    </div>
  );
};

// Protocol SVG Animations
const HelixAnim = () => (
  <svg className="w-1/2 h-1/2 animate-[spin_20s_linear_infinite]" viewBox="0 0 100 100" fill="none" opacity="0.8">
    <path d="M20 50 Q 50 10 80 50 T 20 50" stroke="#F0EFF4" strokeWidth="2" strokeDasharray="5,5" />
    <path d="M20 50 Q 50 90 80 50 T 20 50" stroke="#7B61FF" strokeWidth="2" />
    <circle cx="50" cy="50" r="30" stroke="#0A0A14" strokeWidth="1" />
  </svg>
);

const ScannerAnim = () => (
  <div className="w-2/3 h-2/3 grid grid-cols-6 grid-rows-6 gap-2 relative">
    {Array.from({ length: 36 }).map((_, i) => (
      <div key={i} className="bg-ghost/10 rounded-sm"></div>
    ))}
    <div className="absolute top-0 left-0 w-full h-[2px] bg-plasma shadow-[0_0_10px_#7B61FF] animate-[scan_3s_ease-in-out_infinite_alternate]"></div>
    <style>{`@keyframes scan { 0% { top: 0; } 100% { top: 100%; } }`}</style>
  </div>
);

const EkgAnim = () => (
  <svg className="w-3/4 h-1/2" viewBox="0 0 200 100" fill="none">
    <path
      d="M0 50 L40 50 L50 20 L60 80 L70 50 L200 50"
      stroke="#7B61FF"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="animate-[dash_2s_linear_infinite]"
      strokeDasharray="250"
      strokeDashoffset="250"
    />
    <style>{`@keyframes dash { to { stroke-dashoffset: 0; } }`}</style>
  </svg>
);

const Protocol = () => {
  const containerRef = useRef(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const cards = gsap.utils.toArray('.protocol-card');

      cards.forEach((card, i) => {
        if (i === cards.length - 1) return; // Don't animate the last card out

        gsap.to(card.querySelector('.bg-ghost'), {
          scale: 0.9,
          opacity: 0.5,
          filter: 'blur(10px)',
          scrollTrigger: {
            trigger: cards[i + 1],
            start: "top bottom",
            end: "top top",
            scrub: true,
          }
        });
      });
    }, containerRef);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={containerRef} id="process" className="relative bg-deepvoid">
      <ProtocolCard
        step="1"
        index={0}
        title="Configure Identity"
        description="Upload your resume and input core competencies. We map your profile to exactly match required data structures."
        AnimationComponent={HelixAnim}
      />
      <ProtocolCard
        step="2"
        index={1}
        title="Target Matrix"
        description="Define boolean constraints to source companies precisely aligned with your growth trajectory."
        AnimationComponent={ScannerAnim}
      />
      <ProtocolCard
        step="3"
        index={2}
        title="Autonomous Apply"
        description="Watch as the protocol dynamically fills, adapts, and submits applications at scale."
        AnimationComponent={EkgAnim}
      />
    </section>
  );
};

// --- 6. MEMBERSHIP / PRICING ---
const PricingCard = ({ title, price, description, features, highlighted }) => {
  return (
    <div className={`p-8 rounded-[2rem] flex flex-col h-full transition-transform duration-300 ${highlighted ? 'bg-deepvoid text-ghost scale-105 shadow-xl z-10' : 'bg-ghost text-graphite shadow-sm border border-deepvoid/10'}`}>
      <h3 className="font-mono text-sm uppercase tracking-widest mb-4 opacity-80">{title}</h3>
      <div className="flex items-baseline gap-2 mb-2">
        <span className="text-4xl md:text-5xl font-sans font-bold">${price}</span>
        <span className="text-sm opacity-70">/month</span>
      </div>
      <p className={`mb-8 opacity-80 text-sm ${highlighted ? 'text-ghost/90' : 'text-graphite/80'}`}>{description}</p>

      <div className="flex-1">
        <ul className="space-y-4 mb-8">
          {features.map((item, idx) => (
            <li key={idx} className="flex gap-3 items-start">
              <CheckCircle2 className={`w-5 h-5 shrink-0 ${highlighted ? 'text-plasma' : 'text-deepvoid'}`} />
              <span className="text-sm">{item}</span>
            </li>
          ))}
        </ul>
      </div>

      <button className={`w-full py-4 rounded-full font-sans font-bold flex items-center justify-center gap-2 group transition-all duration-300 ${highlighted ? 'bg-plasma text-ghost hover:bg-plasma/90 hover:scale-[1.02]' : 'bg-graphite text-ghost hover:bg-deepvoid hover:scale-[1.02]'}`}>
        Select Tier
        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
      </button>
    </div>
  );
};

const Pricing = () => {
  return (
    <section id="pricing" className="py-32 px-6 md:px-16 bg-deepvoid relative z-20">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-5xl font-sans font-bold text-ghost mb-4">Volume Access</h2>
          <p className="text-xl text-ghost/70 font-sans max-w-2xl mx-auto">Deploy precision applications without compromising your runway.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-0 max-w-5xl mx-auto items-center">
          <PricingCard
            title="Essential"
            price="0"
            description="For occasional, targeted applications."
            features={[
              "50 autonomous applies / month",
              "Standard company targeting",
              "Basic data extraction",
              "Community support"
            ]}
          />
          <PricingCard
            title="University Edition"
            price="10"
            description="Built specifically for students."
            features={[
              "1,000 autonomous applies / month",
              "Advanced boolean targeting",
              "Custom CV mapping",
              "Priority execution pipeline"
            ]}
            highlighted={true}
          />
          <PricingCard
            title="Performance"
            price="49"
            description="For transitioning professionals."
            features={[
              "Unlimited applications",
              "API access",
              "Custom proxy networks",
              "Dedicated support agent"
            ]}
          />
        </div>
      </div>
    </section>
  );
};

// --- 7. FOOTER ---
const Footer = () => {
  return (
    <footer className="bg-graphite text-ghost pt-24 pb-8 px-6 md:px-16 rounded-t-[4rem] relative z-30">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between gap-12 mb-20">

        <div className="max-w-sm">
          <div className="font-sans font-bold text-3xl mb-4 group inline-flex items-center gap-2">
            Tempra<span className="w-2 h-2 rounded-full bg-plasma group-hover:scale-150 transition-transform"></span>
          </div>
          <p className="text-ghost/50 text-sm font-sans mb-8">
            The precision job application weapon. Built to outpace manual entry and dominate competitive pipelines.
          </p>
          <div className="flex items-center gap-3 bg-[#18181B] w-fit px-4 py-2 rounded-full border border-ghost/10">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span className="font-mono text-[10px] uppercase tracking-widest text-ghost/70">System Operational</span>
          </div>
        </div>

        <div className="flex gap-16 font-sans">
          <div className="flex flex-col gap-4">
            <h4 className="font-bold mb-2">Platform</h4>
            <a href="#" className="text-ghost/60 hover:text-plasma text-sm transition-colors">Architecture</a>
            <a href="#" className="text-ghost/60 hover:text-plasma text-sm transition-colors">Targeting</a>
            <a href="#" className="text-ghost/60 hover:text-plasma text-sm transition-colors">Changelog</a>
          </div>
          <div className="flex flex-col gap-4">
            <h4 className="font-bold mb-2">Company</h4>
            <a href="#" className="text-ghost/60 hover:text-plasma text-sm transition-colors">Manifesto</a>
            <a href="#" className="text-ghost/60 hover:text-plasma text-sm transition-colors">Twitter</a>
            <a href="#" className="text-ghost/60 hover:text-plasma text-sm transition-colors">Contact</a>
          </div>
        </div>

      </div>
      <div className="max-w-7xl mx-auto border-t border-ghost/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-mono text-ghost/40">
        <p>© 2026 Tempra Protocol.</p>
        <div className="flex gap-4">
          <a href="#" className="hover:text-ghost">Privacy</a>
          <a href="#" className="hover:text-ghost">Terms</a>
        </div>
      </div>
    </footer>
  );
};

// --- MAIN LANDING PAGE COMPONENT ---
function LandingPage() {
  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#1a1333] via-deepvoid to-deepvoid selection:bg-plasma selection:text-ghost font-sans">
      <div className="noise-overlay" />
      <Navbar />
      <Hero />

      <section id="features" className="py-32 px-6 md:px-16 bg-ghost">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-sans font-bold text-deepvoid mb-16 text-center">
            Engineered for <span className="drama-text text-plasma font-normal lowercase">volume.</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FeatureShuffler />
            <FeatureTypewriter />
            <FeatureScheduler />
          </div>
        </div>
      </section>

      <Philosophy />
      <Protocol />
      <Pricing />
      <Footer />
    </div>
  );
}

export default LandingPage;
