
import React, { useState, useEffect, useMemo, Suspense, useRef } from 'react';
import { INITIAL_INPUTS, COUNTRY_CONFIG } from './lib/constants';
import { UserInput, Scenario, CountryCode } from './lib/types';
import { runSimulation } from './lib/financeMath';
import { InputPanel } from './components/InputPanel';
import { ResultsSummary } from './components/ResultsSummary';
import { ViewToggle } from './components/ViewToggle';
import { LayoutDashboard, Sliders, PieChart, Menu, Trash2, Plus, Loader2, Layers, User, ChevronDown, X, Save, Calculator } from 'lucide-react';
import { ComplianceBanner } from './components/ComplianceBanner';
import { LegalFooter } from './components/LegalFooter';
import { LandingPage } from './components/LandingPage';
import { Wizard } from './components/Wizard';

// Lazy load heavy components to save bandwidth and initial load time
const ChartPanel = React.lazy(() => import('./components/ChartPanel').then(module => ({ default: module.ChartPanel })));
const RealityCheck = React.lazy(() => import('./components/RealityCheck').then(module => ({ default: module.RealityCheck })));
const InflationModule = React.lazy(() => import('./components/EducationModules').then(module => ({ default: module.InflationModule })));
const GoalSandbox = React.lazy(() => import('./components/GoalSandbox').then(module => ({ default: module.GoalSandbox })));
const ScenarioComparison = React.lazy(() => import('./components/ScenarioComparison').then(module => ({ default: module.ScenarioComparison })));
const ExtrasDashboard = React.lazy(() => import('./components/extras/ExtrasDashboard').then(module => ({ default: module.ExtrasDashboard })));

type ViewState = 'landing' | 'wizard' | 'app';

const App: React.FC = () => {
  // Application View State
  const [viewState, setViewState] = useState<ViewState>('landing');

  // Country State
  const [country, setCountry] = useState<CountryCode>('US');

  // Single source of truth for inputs
  const [inputs, setInputs] = useState<UserInput>(INITIAL_INPUTS);
  
  // Update default inputs when country changes (currency & some base values)
  const handleCountryChange = (newCountry: CountryCode) => {
    setCountry(newCountry);
    const config = COUNTRY_CONFIG[newCountry];
    setInputs(prev => ({
      ...prev,
      currency: config.currency,
      estimatedSocialSecurity: newCountry === 'UK' ? 900 : newCountry === 'CA' ? 1400 : 2000, 
      targetValue: newCountry === 'UK' ? 40000 : 60000
    }));
  };

  // Debounce inputs for simulation to save CPU cycles on client
  const [debouncedInputs, setDebouncedInputs] = useState<UserInput>(INITIAL_INPUTS);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedInputs(inputs);
    }, 300); // 300ms delay prevents calculation on every keystroke
    return () => clearTimeout(handler);
  }, [inputs]);
  
  const [isBuyingPowerReal, setIsBuyingPowerReal] = useState<boolean>(true);
  
  // Initialize tab based on screen size
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
    if (window.innerWidth < 768 && viewState === 'app') {
      const timer = setTimeout(() => {
        if (activeTab === 'inputs') {
          profileRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else if (activeTab === 'dashboard') {
          dashboardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [activeTab, viewState]);

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
    setInputs({ ...INITIAL_INPUTS, ...scenario.inputs });
    if (scenario.inputs.currency === 'GBP') setCountry('UK');
    else if (scenario.inputs.currency === 'CAD') setCountry('CA');
    else if (scenario.inputs.currency === 'USD') setCountry('US');

    // Switch to app view if loading from a scenario
    setViewState('app');
    
    // Immediate update for scenarios too
    setDebouncedInputs({ ...INITIAL_INPUTS, ...scenario.inputs });

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

  // Scroll Spy for Mobile
  useEffect(() => {
    if (window.innerWidth >= 768 || !isMainView || viewState !== 'app') return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (entry.target === profileRef.current) {
              setActiveTab('inputs');
            } else if (entry.target === dashboardRef.current) {
              setActiveTab('dashboard');
            }
          }
        });
      },
      { threshold: 0.4 }
    );

    if (profileRef.current) observer.observe(profileRef.current);
    if (dashboardRef.current) observer.observe(dashboardRef.current);

    return () => observer.disconnect();
  }, [isMainView, viewState]);

  // --- Handlers for Landing Page ---
  const handleModeChoice = (mode: 'wizard' | 'full') => {
    if (mode === 'wizard') {
      setViewState('wizard');
    } else {
      setViewState('app');
    }
  };

  const handleOpenTools = () => {
    setViewState('app');
    setActiveTab('extras');
  };

  const handleWizardComplete = (newInputs: UserInput) => {
    setInputs(newInputs);
    // Crucial: Update debouncedInputs immediately so the results render instantly
    // without waiting for the 300ms effect timer.
    setDebouncedInputs(newInputs); 
    setViewState('app');
    // Ensure dashboard is visible immediately
    setActiveTab('dashboard'); 
  };

  // --- Render Logic ---

  if (viewState === 'landing') {
    return (
      <LandingPage 
        onChooseMode={handleModeChoice} 
        onOpenTools={handleOpenTools}
        country={country} 
        onCountryChange={handleCountryChange} 
      />
    );
  }

  if (viewState === 'wizard') {
    return (
      <Wizard 
        currentInputs={inputs} 
        country={country}
        onCountryChange={handleCountryChange}
        onComplete={handleWizardComplete} 
        onCancel={() => setViewState('landing')} 
      />
    );
  }

  // --- Main App Render ---
  return (
    <div className="h-screen w-full flex flex-col md:flex-row bg-slate-50 overflow-hidden">
      <ComplianceBanner country={country} />
      
      {/* Mobile Header - Static at top of flex column on mobile */}
      <div className="md:hidden bg-white px-4 py-3 border-b flex justify-between items-center shrink-0 z-50 relative shadow-sm h-[60px]">
        <div className="flex items-center gap-2 overflow-hidden">
           <div className="bg-emerald-100 p-1.5 rounded-lg shrink-0">
             <LayoutDashboard className="text-emerald-600" size={18} />
           </div>
           <span className="font-bold text-slate-900 text-sm truncate">Retirement Planner</span>
        </div>

        {/* Right Side: Region Switcher + Menu */}
        <div className="flex items-center gap-3">
            <div className="flex bg-slate-100 p-1 rounded-lg shrink-0">
               <button onClick={() => handleCountryChange('US')} className={`px-2 py-1 rounded-md text-xs font-bold transition-all ${country === 'US' ? 'bg-white shadow text-indigo-700' : 'text-slate-400'}`}>🇺🇸</button>
               <button onClick={() => handleCountryChange('UK')} className={`px-2 py-1 rounded-md text-xs font-bold transition-all ${country === 'UK' ? 'bg-white shadow text-indigo-700' : 'text-slate-400'}`}>🇬🇧</button>
               <button onClick={() => handleCountryChange('CA')} className={`px-2 py-1 rounded-md text-xs font-bold transition-all ${country === 'CA' ? 'bg-white shadow text-indigo-700' : 'text-slate-400'}`}>🇨🇦</button>
            </div>
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition">
              <Menu size={20} />
            </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
         <div className="fixed inset-0 z-[60] bg-white p-4 md:hidden overflow-y-auto animate-fade-in">
            <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
               <h2 className="font-bold text-xl text-slate-800">Menu</h2>
               <button onClick={() => setMobileMenuOpen(false)} className="text-slate-500 p-2 bg-slate-100 rounded-full hover:bg-slate-200">
                 <X size={20} />
                 <span className="sr-only">Close</span>
               </button>
            </div>
            
            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-3 mb-6">
                <button onClick={() => handleMobileNav('dashboard')} className="p-4 bg-blue-50 hover:bg-blue-100 rounded-xl border border-blue-100 flex flex-col items-center justify-center gap-2 transition">
                   <PieChart size={24} className="text-blue-600" />
                   <span className="text-xs font-bold text-slate-700">Dashboard</span>
                </button>
                <button onClick={() => handleMobileNav('extras')} className="p-4 bg-purple-50 hover:bg-purple-100 rounded-xl border border-purple-100 flex flex-col items-center justify-center gap-2 transition">
                   <Calculator size={24} className="text-purple-600" />
                   <span className="text-xs font-bold text-slate-700">Calculators</span>
                </button>
                <button onClick={() => handleMobileNav('compare')} className="p-4 bg-indigo-50 hover:bg-indigo-100 rounded-xl border border-indigo-100 flex flex-col items-center justify-center gap-2 transition">
                   <Layers size={24} className="text-indigo-600" />
                   <span className="text-xs font-bold text-slate-700">Compare</span>
                </button>
                 <button onClick={() => handleMobileNav('sandbox')} className="p-4 bg-amber-50 hover:bg-amber-100 rounded-xl border border-amber-100 flex flex-col items-center justify-center gap-2 transition">
                   <Sliders size={24} className="text-amber-600" />
                   <span className="text-xs font-bold text-slate-700">Sandbox</span>
                </button>
            </div>

            {/* Save Scenario UI */}
            <div className="mb-6 bg-emerald-50 rounded-xl p-4 border border-emerald-100">
               <h3 className="text-xs font-bold text-emerald-800 uppercase mb-3 flex items-center gap-2"><Save size={14}/> Save Current Plan</h3>
               {!showScenarioModal ? (
                 <button onClick={() => setShowScenarioModal(true)} className="w-full bg-white text-emerald-700 font-bold py-2.5 rounded-lg shadow-sm border border-emerald-200 text-sm">Save as Scenario</button>
               ) : (
                 <div className="animate-fade-in">
                    <input type="text" autoFocus placeholder="Scenario Name" value={newScenarioName} onChange={(e) => setNewScenarioName(e.target.value)} className="w-full p-2.5 border border-emerald-300 rounded-lg mb-2 text-sm" />
                    <div className="flex gap-2">
                      <button onClick={handleSaveScenario} className="flex-1 bg-emerald-600 text-white text-sm font-bold py-2 rounded-lg">Save</button>
                      <button onClick={() => setShowScenarioModal(false)} className="flex-1 bg-white text-slate-600 border border-slate-200 text-sm font-bold py-2 rounded-lg">Cancel</button>
                    </div>
                 </div>
               )}
            </div>

            {/* Saved List */}
            <h2 className="font-bold text-slate-800 mb-3 text-sm uppercase tracking-wider">Saved Scenarios</h2>
            {scenarios.length > 0 ? (
              <div className="space-y-2">
                {scenarios.map(s => (
                  <div key={s.id} className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                    <button onClick={() => handleLoadScenario(s)} className="text-sm font-bold text-slate-700 text-left flex-1">{s.name}</button>
                    <button onClick={() => handleDeleteScenario(s.id)} className="text-slate-400 hover:text-red-500 p-2"><Trash2 size={16} /></button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400 italic">No scenarios saved yet.</p>
            )}
            
            {/* Back to Home Button */}
            <div className="mt-8 pt-6 border-t border-slate-100">
               <button onClick={() => setViewState('landing')} className="w-full py-3 bg-slate-100 text-slate-600 font-bold rounded-xl text-sm">
                  Back to Start Screen
               </button>
            </div>
         </div>
      )}

      {/* Left Sidebar (Inputs) - Desktop Only */}
      <aside className="hidden md:flex w-[380px] lg:w-[420px] h-full overflow-hidden bg-white border-r border-slate-200 z-20 flex-col shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
        <div className="p-6 border-b border-slate-100 shrink-0">
            <div className="flex items-center justify-between mb-4">
               <div className="flex items-center gap-2 cursor-pointer" onClick={() => setViewState('landing')}>
                  <div className="p-2 bg-emerald-600 rounded-lg text-white shadow-lg shadow-emerald-600/20">
                    <LayoutDashboard size={20} />
                  </div>
                  <h1 className="font-bold text-xl text-slate-900 tracking-tight">Retirement</h1>
               </div>
               <div className="flex bg-slate-100 rounded-lg p-1">
                 <button onClick={() => handleCountryChange('US')} className={`px-2 py-1 rounded text-xs font-bold transition ${country === 'US' ? 'bg-white shadow text-indigo-700' : 'text-slate-400'}`}>🇺🇸 US</button>
                 <button onClick={() => handleCountryChange('UK')} className={`px-2 py-1 rounded text-xs font-bold transition ${country === 'UK' ? 'bg-white shadow text-indigo-700' : 'text-slate-400'}`}>🇬🇧 UK</button>
                 <button onClick={() => handleCountryChange('CA')} className={`px-2 py-1 rounded text-xs font-bold transition ${country === 'CA' ? 'bg-white shadow text-indigo-700' : 'text-slate-400'}`}>🇨🇦 CA</button>
               </div>
            </div>
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
          {/* Saved Scenarios Desktop Widget */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 group hover:border-indigo-100 transition-colors">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Saved Scenarios</h3>
              <button onClick={() => setShowScenarioModal(true)} className="text-emerald-600 hover:text-emerald-700 text-xs font-bold flex items-center gap-1 bg-white px-2 py-1 rounded border border-emerald-100 shadow-sm"><Plus size={12} /> Save</button>
            </div>
            {showScenarioModal && (
               <div className="mb-3 animate-fade-in">
                  <input type="text" autoFocus placeholder="Name..." value={newScenarioName} onChange={(e) => setNewScenarioName(e.target.value)} className="w-full text-sm p-2 border border-emerald-300 rounded mb-2" onKeyDown={(e) => e.key === 'Enter' && handleSaveScenario()} />
                  <div className="flex gap-2"><button onClick={handleSaveScenario} className="flex-1 bg-emerald-600 text-white text-xs font-bold py-1.5 rounded">Confirm</button><button onClick={() => setShowScenarioModal(false)} className="flex-1 bg-slate-200 text-slate-600 text-xs font-bold py-1.5 rounded">Cancel</button></div>
               </div>
            )}
            <div className="space-y-1 max-h-[120px] overflow-y-auto custom-scrollbar">
               {scenarios.map(s => (
                  <div key={s.id} className="flex justify-between items-center px-2 py-1.5 rounded hover:bg-white hover:shadow-sm group/item">
                      <button onClick={() => handleLoadScenario(s)} className="text-sm text-slate-600 font-medium truncate flex-1 text-left">{s.name}</button>
                      <button onClick={() => handleDeleteScenario(s.id)} className="text-slate-300 hover:text-red-400 opacity-0 group-hover/item:opacity-100 transition"><Trash2 size={12} /></button>
                  </div>
               ))}
               {scenarios.length === 0 && <p className="text-xs text-slate-400 italic">No saved plans.</p>}
            </div>
          </div>

          <InputPanel inputs={inputs} onChange={setInputs} country={country} />
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        
        {/* Navigation Bar */}
        <header className="bg-white border-b border-slate-200 px-4 md:px-6 py-3 flex justify-between items-center shrink-0 z-40 shadow-sm">
          <div className="flex space-x-1 sm:space-x-2 overflow-x-auto no-scrollbar mask-gradient">
            <button onClick={() => setActiveTab('inputs')} className={`md:hidden flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${activeTab === 'inputs' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-500'}`}><User size={16} /> Profile</button>
            <button onClick={() => setActiveTab('dashboard')} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${activeTab === 'dashboard' ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}><PieChart size={16} /> Dashboard</button>
            <button onClick={() => setActiveTab('compare')} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${activeTab === 'compare' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:text-slate-700'}`}><Layers size={16} /> Compare</button>
            <button onClick={() => setActiveTab('sandbox')} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${activeTab === 'sandbox' ? 'bg-amber-50 text-amber-700' : 'text-slate-500 hover:text-slate-700'}`}><Sliders size={16} /> Sandbox</button>
             <button onClick={() => setActiveTab('extras')} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${activeTab === 'extras' ? 'bg-purple-50 text-purple-700' : 'text-slate-500 hover:text-slate-700'}`}><Calculator size={16} /> Extras</button>
          </div>

          {isMainView && <div className="hidden sm:block"><ViewToggle isReal={isBuyingPowerReal} onChange={setIsBuyingPowerReal} /></div>}
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50 scroll-smooth">
          <div className="max-w-7xl mx-auto space-y-8 pb-10">
            <Suspense fallback={<div className="flex items-center justify-center h-64 text-slate-400 gap-2"><Loader2 className="animate-spin" /> Loading Module...</div>}>
            
            {isMainView ? (
              <>
                {/* Mobile: Profile Section */}
                <div ref={profileRef} className="md:hidden space-y-6 scroll-mt-24 min-h-[50vh]">
                   <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                      <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-6"><User className="text-emerald-600" size={24} /> Profile & Data</h2>
                      <InputPanel inputs={inputs} onChange={setInputs} country={country} />
                   </div>
                   <div className="flex flex-col items-center justify-center text-slate-300 gap-1 py-2 animate-pulse">
                      <span className="text-[10px] font-bold uppercase tracking-widest">Scroll for Results</span>
                      <ChevronDown size={20} />
                   </div>
                </div>

                {/* Dashboard Section */}
                <div ref={dashboardRef} className="scroll-mt-24 min-h-[80vh]">
                  <div className="md:hidden mb-4"><ViewToggle isReal={isBuyingPowerReal} onChange={setIsBuyingPowerReal} className="w-full" /></div>

                  <ResultsSummary result={result} inputs={debouncedInputs} isBuyingPowerReal={isBuyingPowerReal} />
                  
                  <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mt-6">
                    <div className="xl:col-span-2">
                      <ChartPanel data={result.projections} isBuyingPowerReal={isBuyingPowerReal} targetAmount={isBuyingPowerReal ? result.targetReal : result.targetNominal} currency={inputs.currency} />
                    </div>
                    <div className="xl:col-span-1">
                      <RealityCheck inputs={debouncedInputs} result={result} country={country} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
                    {inputs.retirementAge > inputs.currentAge && (
                      <div className="lg:col-span-2">
                        <InflationModule inflationRate={inputs.inflationRate} retirementYearsAway={inputs.retirementAge - inputs.currentAge} currency={inputs.currency} />
                      </div>
                    )}
                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm h-full">
                      <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4">Assumptions Summary</h3>
                      <ul className="space-y-4 text-sm">
                        <li className="flex justify-between pb-2 border-b border-slate-50"><span className="text-slate-600">Growth Rate</span><span className="font-mono font-medium text-slate-900">{inputs.strategy === 'Custom' ? inputs.customReturnRate : (inputs.strategy === 'Conservative' ? 4 : inputs.strategy === 'Balanced' ? 6 : 9)}%</span></li>
                        <li className="flex justify-between pb-2 border-b border-slate-50"><span className="text-slate-600">Inflation</span><span className="font-mono font-medium text-slate-900">{inputs.inflationRate}%</span></li>
                        <li className="flex justify-between pb-2 border-b border-slate-50"><span className="text-slate-600">Est. Tax Rate</span><span className="font-mono font-medium text-slate-900">{inputs.retirementTaxRate}%</span></li>
                      </ul>
                    </div>
                  </div>
                </div>
              </>
            ) : activeTab === 'compare' ? (
               <ScenarioComparison scenarios={scenarios} />
            ) : activeTab === 'extras' ? (
               <ExtrasDashboard currency={inputs.currency} country={country} />
            ) : (
              <GoalSandbox inputs={inputs} />
            )}
            </Suspense>
          </div>

          <LegalFooter country={country} />
        </div>
      </main>
    </div>
  );
};

export default App;
