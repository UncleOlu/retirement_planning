
import React, { useState, useEffect, useMemo, Suspense, useRef } from 'react';
import { INITIAL_INPUTS } from './lib/constants';
import { UserInput, Scenario } from './lib/types';
import { runSimulation } from './lib/financeMath';
import { InputPanel } from './components/InputPanel';
import { ResultsSummary } from './components/ResultsSummary';
import { ViewToggle } from './components/ViewToggle';
import { LayoutDashboard, Sliders, PieChart, Menu, Trash2, Plus, Loader2, Layers, User, ArrowDown, ChevronDown, X, Save, Calculator, ArrowRight } from 'lucide-react';
import { ComplianceBanner } from './components/ComplianceBanner';
import { LegalFooter } from './components/LegalFooter';

// Lazy load heavy components to save bandwidth and initial load time
const ChartPanel = React.lazy(() => import('./components/ChartPanel').then(module => ({ default: module.ChartPanel })));
const RealityCheck = React.lazy(() => import('./components/RealityCheck').then(module => ({ default: module.RealityCheck })));
const InflationModule = React.lazy(() => import('./components/EducationModules').then(module => ({ default: module.InflationModule })));
const GoalSandbox = React.lazy(() => import('./components/GoalSandbox').then(module => ({ default: module.GoalSandbox })));
const ScenarioComparison = React.lazy(() => import('./components/ScenarioComparison').then(module => ({ default: module.ScenarioComparison })));
const ExtrasDashboard = React.lazy(() => import('./components/extras/ExtrasDashboard').then(module => ({ default: module.ExtrasDashboard })));

const App: React.FC = () => {
  // Single source of truth for inputs
  const [inputs, setInputs] = useState<UserInput>(INITIAL_INPUTS);
  
  // Debounce inputs for simulation to save CPU cycles on client
  const [debouncedInputs, setDebouncedInputs] = useState<UserInput>(INITIAL_INPUTS);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedInputs(inputs);
    }, 300); // 300ms delay prevents calculation on every keystroke
    return () => clearTimeout(handler);
  }, [inputs]);
  
  const [isBuyingPowerReal, setIsBuyingPowerReal] = useState<boolean>(true);
  
  // Initialize tab based on screen size: Mobile starts with 'inputs' (Profile), Desktop starts with 'dashboard'
  const [activeTab, setActiveTab] = useState<'inputs' | 'dashboard' | 'sandbox' | 'compare' | 'extras'>(() => 
    window.innerWidth < 768 ? 'inputs' : 'dashboard'
  );
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Scenarios State
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [showScenarioModal, setShowScenarioModal] = useState(false);
  const [newScenarioName, setNewScenarioName] = useState('');

  // Refs for scrolling
  const profileRef = useRef<HTMLDivElement>(null);
  const dashboardRef = useRef<HTMLDivElement>(null);

  // Ensure we switch to dashboard if resized to desktop width while on inputs tab
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768 && activeTab === 'inputs') {
        setActiveTab('dashboard');
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [activeTab]);

  // Handle scrolling when tabs change on mobile
  useEffect(() => {
    if (window.innerWidth < 768) {
      // Short timeout to allow render to complete if switching from a different view like 'compare'
      const timer = setTimeout(() => {
        if (activeTab === 'inputs') {
          profileRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else if (activeTab === 'dashboard') {
          // On dashboard click, scroll to dashboard section
          dashboardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [activeTab]);

  // Load scenarios from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem('retirementPlannerScenarios');
    if (saved) {
      try {
        setScenarios(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load scenarios", e);
      }
    }
  }, []);

  // Save scenarios to local storage whenever they change
  useEffect(() => {
    localStorage.setItem('retirementPlannerScenarios', JSON.stringify(scenarios));
  }, [scenarios]);

  const handleSaveScenario = () => {
    if (!newScenarioName.trim()) return;
    const newScenario: Scenario = {
      id: crypto.randomUUID(),
      name: newScenarioName,
      createdAt: Date.now(),
      inputs: { ...inputs }
    };
    setScenarios([...scenarios, newScenario]);
    setNewScenarioName('');
    setShowScenarioModal(false);
    setMobileMenuOpen(false); // Close mobile menu after saving
  };

  const handleLoadScenario = (scenario: Scenario) => {
    // Merge saved inputs with INITIAL_INPUTS to ensure new fields exist
    setInputs({ ...INITIAL_INPUTS, ...scenario.inputs });
    
    if (activeTab === 'compare') {
      setActiveTab(window.innerWidth < 768 ? 'inputs' : 'dashboard');
    }
    
    if (window.innerWidth < 768) setMobileMenuOpen(false);
  };

  const handleDeleteScenario = (id: string) => {
    setScenarios(scenarios.filter(s => s.id !== id));
  };

  const handleMobileNav = (tab: typeof activeTab) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  // Run simulation using debounced inputs
  const result = useMemo(() => runSimulation(debouncedInputs), [debouncedInputs]);

  // Determine if we are in the "Main View" (Profile + Dashboard combined)
  const isMainView = activeTab === 'inputs' || activeTab === 'dashboard';

  // Scroll Spy for Mobile: Syncs active tab with scroll position
  useEffect(() => {
    // Only run on mobile and in main view
    if (window.innerWidth >= 768 || !isMainView) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // We use a threshold of 0.5 (50% visibility)
            // If profile comes into view, set active tab to inputs
            if (entry.target === profileRef.current) {
              setActiveTab('inputs');
            } 
            // If dashboard comes into view, set active tab to dashboard
            else if (entry.target === dashboardRef.current) {
              setActiveTab('dashboard');
            }
          }
        });
      },
      { threshold: 0.4 } // Slightly generous threshold
    );

    if (profileRef.current) observer.observe(profileRef.current);
    if (dashboardRef.current) observer.observe(dashboardRef.current);

    return () => observer.disconnect();
  }, [isMainView]);

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50">
      <ComplianceBanner />
      
      {/* Mobile Header */}
      <div className="md:hidden bg-white p-4 border-b flex justify-between items-center sticky top-0 z-20 shadow-sm">
        <h1 className="font-bold text-slate-900 flex items-center gap-2">
          <LayoutDashboard className="text-emerald-600" />
          Retirement Planning
        </h1>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 text-slate-600 hover:bg-slate-100 rounded-full transition">
          <Menu size={24} />
        </button>
      </div>

      {/* Mobile Menu Overlay - Scenarios & Save */}
      {mobileMenuOpen && (
         <div className="fixed inset-0 z-50 bg-white p-4 md:hidden overflow-y-auto animate-fade-in">
            <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
               <h2 className="font-bold text-xl text-slate-800">Menu</h2>
               <button onClick={() => setMobileMenuOpen(false)} className="text-slate-500 p-2 bg-slate-100 rounded-full hover:bg-slate-200">
                 <X size={20} />
                 <span className="sr-only">Close</span>
               </button>
            </div>
            
            {/* 1. Save Current Scenario Mobile UI */}
            <div className="mb-8 bg-emerald-50 rounded-xl p-4 border border-emerald-100 shadow-sm">
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-800 mb-3 flex items-center gap-2">
                <Save size={14} /> Current Simulation
              </h3>
              
              {!showScenarioModal ? (
                 <button 
                   onClick={() => setShowScenarioModal(true)}
                   className="w-full bg-white border border-emerald-200 text-emerald-700 font-bold py-3 rounded-lg text-sm flex items-center justify-center gap-2 shadow-sm hover:bg-emerald-100 transition"
                 >
                   <Plus size={18} /> Save as Scenario
                 </button>
              ) : (
                 <div className="animate-fade-in">
                    <label className="text-xs font-bold text-emerald-700 mb-1 block">Scenario Name</label>
                    <input 
                      type="text" 
                      autoFocus
                      placeholder="e.g. Retire Early at 55"
                      value={newScenarioName}
                      onChange={(e) => setNewScenarioName(e.target.value)}
                      className="w-full p-3 border border-emerald-300 rounded-lg mb-3 focus:ring-2 focus:ring-emerald-200 outline-none bg-white text-slate-900 text-sm"
                      onKeyDown={(e) => e.key === 'Enter' && handleSaveScenario()}
                    />
                    <div className="flex gap-3">
                      <button onClick={handleSaveScenario} className="flex-1 bg-emerald-600 text-white text-sm font-bold py-2.5 rounded-lg shadow-md shadow-emerald-200">Save</button>
                      <button onClick={() => { setShowScenarioModal(false); setNewScenarioName(''); }} className="flex-1 bg-white text-slate-600 border border-slate-200 text-sm font-bold py-2.5 rounded-lg">Cancel</button>
                    </div>
                 </div>
              )}
            </div>

            {/* 2. Quick Navigation - Placed between Save and Saved List */}
            <div className="mb-8">
               <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Quick Navigation</h3>
               <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => handleMobileNav('dashboard')} className="p-3 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-100 flex flex-col items-center justify-center gap-2 transition">
                     <PieChart size={20} className="text-blue-500" />
                     <span className="text-xs font-bold text-slate-700">Dashboard</span>
                  </button>
                   <button onClick={() => handleMobileNav('extras')} className="p-3 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-100 flex flex-col items-center justify-center gap-2 transition">
                     <Calculator size={20} className="text-purple-500" />
                     <span className="text-xs font-bold text-slate-700">Extras</span>
                  </button>
                  <button onClick={() => handleMobileNav('compare')} className="p-3 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-100 flex flex-col items-center justify-center gap-2 transition">
                     <Layers size={20} className="text-indigo-500" />
                     <span className="text-xs font-bold text-slate-700">Compare</span>
                  </button>
                  <button onClick={() => handleMobileNav('sandbox')} className="p-3 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-100 flex flex-col items-center justify-center gap-2 transition">
                     <Sliders size={20} className="text-amber-500" />
                     <span className="text-xs font-bold text-slate-700">Sandbox</span>
                  </button>
               </div>
            </div>

            {/* 3. Saved Scenarios List */}
            <h2 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Layers size={18} className="text-slate-500" /> Saved Scenarios
            </h2>
            
            {scenarios.length > 0 ? (
              <div className="space-y-3">
                {scenarios.map(s => (
                  <div key={s.id} className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <button onClick={() => handleLoadScenario(s)} className="text-sm font-bold text-slate-700 text-left flex-1">
                      {s.name}
                    </button>
                    <button onClick={() => handleDeleteScenario(s.id)} className="text-slate-400 hover:text-red-500 p-2">
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <p className="text-slate-400 font-medium">No saved scenarios yet.</p>
                <p className="text-xs text-slate-400 mt-1">Save your current setup above!</p>
              </div>
            )}
         </div>
      )}

      {/* Left Sidebar (Inputs) - Only show on Desktop */}
      <aside className="hidden md:flex w-[400px] h-screen sticky top-0 p-0 bg-white border-r border-slate-200 z-10 flex-col shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
        <div className="p-6 border-b border-slate-100">
            <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-600 rounded-lg text-white shadow-lg shadow-emerald-600/20">
              <LayoutDashboard size={20} />
            </div>
            <h1 className="font-bold text-xl text-slate-900 tracking-tight">Retirement Planning</h1>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
          
          {/* Scenarios Quick Access */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Saved Scenarios</h3>
              <button 
                onClick={() => setShowScenarioModal(true)}
                className="text-emerald-600 hover:text-emerald-700 text-xs font-bold flex items-center gap-1"
              >
                <Plus size={14} /> Save Current
              </button>
            </div>
            
            {scenarios.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No scenarios saved yet.</p>
            ) : (
              <div className="space-y-2">
                {scenarios.map(s => (
                  <div key={s.id} className="group flex justify-between items-center bg-white p-2 rounded border border-slate-100 hover:border-indigo-200 transition shadow-sm">
                      <button onClick={() => handleLoadScenario(s)} className="text-sm text-slate-700 hover:text-indigo-600 font-medium truncate text-left flex-1">
                        {s.name}
                      </button>
                      <button onClick={() => handleDeleteScenario(s.id)} className="text-slate-300 hover:text-red-400 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Trash2 size={14} />
                      </button>
                  </div>
                ))}
              </div>
            )}
            
            {/* Save Scenario Input (Inline if active) */}
            {showScenarioModal && (
              <div className="mt-3 animate-fade-in">
                  <input 
                    type="text" 
                    autoFocus
                    placeholder="Scenario Name"
                    value={newScenarioName}
                    onChange={(e) => setNewScenarioName(e.target.value)}
                    className="w-full text-sm p-2 border border-emerald-300 rounded mb-2 focus:ring-2 focus:ring-emerald-200 outline-none bg-white text-slate-900"
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveScenario()}
                  />
                  <div className="flex gap-2">
                    <button onClick={handleSaveScenario} className="flex-1 bg-emerald-600 text-white text-xs font-bold py-1.5 rounded">Save</button>
                    <button onClick={() => setShowScenarioModal(false)} className="flex-1 bg-slate-200 text-slate-600 text-xs font-bold py-1.5 rounded">Cancel</button>
                  </div>
              </div>
            )}
          </div>

          <InputPanel 
            inputs={inputs} 
            onChange={setInputs} 
          />
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        
        {/* Navigation Bar */}
        <header className="bg-white border-b border-slate-200 px-6 py-3 flex justify-between items-center sticky top-0 z-10">
          <div className="flex space-x-2 sm:space-x-4 overflow-x-auto no-scrollbar">
            {/* Profile Tab - Mobile Only - Scrolls to top */}
            <button 
              onClick={() => setActiveTab('inputs')}
              className={`md:hidden flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap ${
                activeTab === 'inputs' 
                  ? 'bg-emerald-50 text-emerald-700' 
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              <User size={18} />
              Profile
            </button>

            <button 
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap ${
                activeTab === 'dashboard' 
                  ? 'bg-slate-100 text-slate-900' 
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              <PieChart size={18} />
              Dashboard
            </button>
            <button 
              onClick={() => setActiveTab('compare')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap ${
                activeTab === 'compare' 
                  ? 'bg-indigo-50 text-indigo-700' 
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Layers size={18} />
              Compare
            </button>
            <button 
              onClick={() => setActiveTab('sandbox')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap ${
                activeTab === 'sandbox' 
                  ? 'bg-amber-50 text-amber-700' 
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Sliders size={18} />
              Sandbox
            </button>
             <button 
              onClick={() => setActiveTab('extras')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap ${
                activeTab === 'extras' 
                  ? 'bg-purple-50 text-purple-700' 
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Calculator size={18} />
              Extras
            </button>
          </div>

          {/* Desktop View Toggle - Only visible on dashboard and desktop sizes */}
          {isMainView && (
             <div className="hidden sm:block">
               <ViewToggle isReal={isBuyingPowerReal} onChange={setIsBuyingPowerReal} />
             </div>
          )}
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50 scroll-smooth">
          <div className="max-w-6xl mx-auto space-y-8 pb-10">
            <Suspense fallback={
              <div className="flex items-center justify-center h-64 text-slate-400 gap-2">
                <Loader2 className="animate-spin" /> Loading Module...
              </div>
            }>
            
            {isMainView ? (
              <>
                {/* Mobile: Profile Section (Hidden on Desktop) */}
                <div ref={profileRef} className="md:hidden space-y-6 scroll-mt-24 min-h-[50vh]">
                   <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                      <div className="flex justify-between items-center mb-6">
                         <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                           <User className="text-emerald-600" size={24} />
                           Profile & Data
                         </h2>
                      </div>
                      <InputPanel inputs={inputs} onChange={setInputs} />
                   </div>

                   {/* Visual Connector to encourage scrolling */}
                   <div className="flex flex-col items-center justify-center text-slate-300 gap-1 py-2 animate-pulse">
                      <span className="text-[10px] font-bold uppercase tracking-widest">Scroll for Results</span>
                      <ChevronDown size={20} />
                   </div>
                </div>

                {/* Dashboard Section - Ref helps scroll-to on mobile */}
                <div ref={dashboardRef} className="scroll-mt-24 min-h-[80vh]">
                  {/* Mobile View Toggle */}
                  <div className="md:hidden mb-4">
                     <ViewToggle isReal={isBuyingPowerReal} onChange={setIsBuyingPowerReal} className="w-full" />
                  </div>

                  <ResultsSummary result={result} inputs={debouncedInputs} isBuyingPowerReal={isBuyingPowerReal} />
                  
                  <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mt-6">
                    {/* Main Chart - Takes up 2 columns on large screens */}
                    <div className="xl:col-span-2">
                      <ChartPanel 
                        data={result.projections} 
                        isBuyingPowerReal={isBuyingPowerReal} 
                        targetAmount={isBuyingPowerReal ? result.targetReal : result.targetNominal}
                        currency={inputs.currency}
                      />
                    </div>
                    
                    {/* Reality Check - Takes up 1 column */}
                    <div className="xl:col-span-1">
                      <RealityCheck inputs={debouncedInputs} result={result} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
                    {inputs.retirementAge > inputs.currentAge && (
                      <div className="lg:col-span-2">
                        <InflationModule 
                            inflationRate={inputs.inflationRate} 
                            retirementYearsAway={inputs.retirementAge - inputs.currentAge} 
                            currency={inputs.currency}
                        />
                      </div>
                    )}
                    
                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm h-full">
                      <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4">Assumptions</h3>
                      <ul className="space-y-4 text-sm">
                        <li className="flex justify-between pb-2 border-b border-slate-50">
                          <span className="text-slate-600">Growth Rate</span>
                          <span className="font-mono font-medium text-slate-900">
                            {inputs.strategy === 'Custom' ? inputs.customReturnRate : 
                              (inputs.strategy === 'Conservative' ? 4 : inputs.strategy === 'Balanced' ? 6 : 9)}%
                          </span>
                        </li>
                        <li className="flex justify-between pb-2 border-b border-slate-50">
                          <span className="text-slate-600">Inflation</span>
                          <span className="font-mono font-medium text-slate-900">{inputs.inflationRate}%</span>
                        </li>
                        <li className="flex justify-between pb-2 border-b border-slate-50">
                          <span className="text-slate-600">Est. Tax Rate</span>
                          <span className="font-mono font-medium text-slate-900">{inputs.retirementTaxRate}%</span>
                        </li>
                         <li className="flex justify-between pb-2 border-b border-slate-50">
                          <span className="text-slate-600">Social Security / National Pension</span>
                          <span className="font-mono font-medium text-slate-900">
                              {new Intl.NumberFormat('en-US', { style: 'currency', currency: inputs.currency, maximumFractionDigits: 0 }).format(inputs.estimatedSocialSecurity)}/mo
                          </span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </>
            ) : activeTab === 'compare' ? (
               <ScenarioComparison scenarios={scenarios} />
            ) : activeTab === 'extras' ? (
               <ExtrasDashboard currency={inputs.currency} />
            ) : (
              <GoalSandbox inputs={inputs} />
            )}
            </Suspense>
          </div>

          {/* Legal Footer Component */}
          <LegalFooter />
        </div>
      </main>
    </div>
  );
};

export default App;
