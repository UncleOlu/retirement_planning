import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";
import { UserInput, SimulationResult } from '../lib/types';
import { Sparkles, X, Loader2, MessageSquareQuote, AlertCircle, ChevronRight, FileText } from 'lucide-react';

interface ExplainPlanProps {
  inputs: UserInput;
  result: SimulationResult;
  currencySymbol: string;
}

export const ExplainPlan: React.FC<ExplainPlanProps> = ({ inputs, result, currencySymbol }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generateAnalysis = async () => {
    setLoading(true);
    setError(null);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const prompt = `
        You are an expert financial planner. Provide a brutally honest but constructive assessment of this retirement plan.
        
        **User Financial Profile:**
        - **Age:** ${inputs.currentAge} (Retiring at ${inputs.retirementAge})
        - **Savings:** ${currencySymbol}${inputs.monthlyContribution}/mo
        - **Portfolio:** ${currencySymbol}${inputs.currentPortfolio} currently.
        - **Strategy:** ${inputs.strategy} (${inputs.strategy === 'Custom' ? inputs.customReturnRate : 'Standard'}% growth).
        - **Goal:** ${inputs.targetType === 'income' ? `Monthly Income of ${currencySymbol}${inputs.targetValue/12}` : `Total Corpus of ${currencySymbol}${inputs.targetValue}`}.
        
        **Simulation Outcome:**
        - **Status:** ${result.isOnTrack ? "ON TRACK" : "OFF TRACK"}.
        - **Projected Income:** ${currencySymbol}${Math.round(result.projectedIncomeReal / 12)}/mo (Real purchasing power).
        - **Goal Income:** ${currencySymbol}${Math.round(result.targetIncomeReal / 12)}/mo.
        - **Solvency:** ${result.solvencyAge ? `Money runs out at age ${Math.floor(result.solvencyAge)}` : "Portfolio sustains indefinitely"}.
        
        **Output Format (Markdown):**
        1.  **The Verdict**: A direct 1-2 sentence summary of their reality. Start with "You are..."
        2.  **Projected Lifestyle**: Describe what their retirement actually looks like based on these numbers (e.g., "lean", "comfortable", "abundant").
        3.  **Critical Risks**: Bullet points of specific weaknesses (e.g., inflation impact, reliance on high returns, low savings rate).
        4.  **Smart Moves**: 3 high-impact, specific actions to improve the plan.
        
        Keep the tone professional yet accessible. Avoid jargon where possible.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      setAnalysis(response.text);
    } catch (err) {
      console.error(err);
      setError("Unable to connect to the financial analysis engine. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = () => {
    setIsOpen(true);
    if (!analysis) {
      generateAnalysis();
    }
  };

  return (
    <>
      <button
        onClick={handleOpen}
        className="group relative inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white text-sm font-bold rounded-lg hover:from-indigo-500 hover:to-indigo-600 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
      >
        <Sparkles size={16} className="text-indigo-200 group-hover:text-yellow-200 transition-colors animate-pulse" />
        <span>Explain My Plan</span>
        <ChevronRight size={14} className="opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden transform transition-all scale-100">
            
            {/* Header */}
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-slate-50 to-white">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-100 rounded-xl shadow-inner">
                   <MessageSquareQuote className="text-indigo-600" size={22} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-lg leading-tight">AI Assessment</h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                     <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                     <p className="text-xs font-medium text-slate-500">Gemini 2.5 Flash • Live Analysis</p>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)} 
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content Area */}
            <div className="p-6 overflow-y-auto custom-scrollbar bg-slate-50/50">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-16 space-y-4">
                  <div className="relative">
                     <div className="absolute inset-0 bg-indigo-200 rounded-full blur animate-pulse"></div>
                     <Loader2 size={40} className="relative z-10 animate-spin text-indigo-600" />
                  </div>
                  <div className="text-center space-y-1">
                     <p className="text-sm font-bold text-slate-700">Crunching the numbers...</p>
                     <p className="text-xs text-slate-400">Analyzing inflation, tax drag, and growth projections.</p>
                  </div>
                </div>
              ) : error ? (
                <div className="p-6 bg-red-50 text-red-800 rounded-xl border border-red-100 flex flex-col items-center text-center gap-2">
                  <AlertCircle size={32} className="text-red-500 mb-2" />
                  <h4 className="font-bold">Analysis Failed</h4>
                  <p className="text-sm opacity-90">{error}</p>
                  <button onClick={generateAnalysis} className="mt-2 text-xs font-bold bg-white px-3 py-1.5 rounded shadow-sm hover:bg-red-50 text-red-600 border border-red-200">Retry</button>
                </div>
              ) : (
                <div className="prose prose-sm prose-slate max-w-none text-slate-600">
                   {/* Styled Content Rendering */}
                   <div className="space-y-6">
                      {analysis?.split('\n').map((line, i) => {
                         const trimmed = line.trim();
                         if (!trimmed) return null;
                         
                         // Headings
                         if (trimmed.startsWith('**') && trimmed.endsWith('**') && trimmed.length < 50) {
                            return (
                               <div key={i} className="flex items-center gap-2 border-b border-slate-200 pb-2 mb-3 mt-6 first:mt-0">
                                  <FileText size={16} className="text-indigo-500" />
                                  <h3 className="text-slate-800 font-bold text-base m-0">
                                    {trimmed.replace(/\*\*/g, '')}
                                  </h3>
                               </div>
                            );
                         }
                         
                         // Bullet Points
                         if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
                            return (
                               <div key={i} className="flex gap-3 mb-2 pl-1">
                                  <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0 opacity-60"></div>
                                  <div className="leading-relaxed">
                                    {trimmed.replace(/^[-*] /, '').split(/(\*\*.*?\*\*)/).map((part, j) => {
                                       if (part.startsWith('**') && part.endsWith('**')) {
                                          return <strong key={j} className="text-slate-900 font-bold">{part.replace(/\*\*/g, '')}</strong>;
                                       }
                                       return <span key={j}>{part}</span>;
                                    })}
                                  </div>
                               </div>
                            );
                         }

                         // Regular Paragraphs
                         return (
                            <p key={i} className="leading-relaxed mb-3">
                               {trimmed.split(/(\*\*.*?\*\*)/).map((part, j) => {
                                   if (part.startsWith('**') && part.endsWith('**')) {
                                      return <strong key={j} className="text-slate-900 font-bold">{part.replace(/\*\*/g, '')}</strong>;
                                   }
                                   return <span key={j}>{part}</span>;
                               })}
                            </p>
                         );
                      })}
                   </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 bg-white flex justify-between items-center">
              <span className="text-[10px] text-slate-400 font-medium">
                Results are for educational purposes only.
              </span>
              <button 
                onClick={() => setIsOpen(false)}
                className="px-6 py-2.5 bg-slate-800 text-white font-bold rounded-lg hover:bg-slate-900 transition text-xs shadow-lg shadow-slate-200"
              >
                Close Analysis
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};