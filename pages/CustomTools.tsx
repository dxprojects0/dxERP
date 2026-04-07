import React, { useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { RootState } from '../store/store';
import { ToolFeature } from '../types';
import { setCustomTools, toggleCustomTool } from '../features/configSlice';
import { TOOL_DEFINITIONS } from '../utils/catalog';
import { ROUTES } from '../utils/routes';
import { emitToast } from '../utils/toast';
import { isPaidPlan } from '../utils/plans';

const FREE_TOOL_LIMIT = 5;

const CustomTools: React.FC = () => {
  const { customTools, plan, selectedProfessionId, isAdmin } = useSelector((state: RootState) => state.config);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const categories = useMemo(
    () => Array.from(new Set(TOOL_DEFINITIONS.map((tool) => tool.category))),
    [],
  );

  const canSelectMore = isPaidPlan(plan) || customTools.length < FREE_TOOL_LIMIT;

  if (!selectedProfessionId && !isAdmin) {
    return (
      <div className="max-w-4xl mx-auto py-10">
        <div className="rounded-2xl border border-app bg-surface p-6">
          <h1 className="text-2xl font-black">Category required first</h1>
          <p className="text-sm text-subtle mt-2">Please complete business setup and category selection before adding custom tools.</p>
          <button onClick={() => navigate(ROUTES.setup)} className="mt-4 px-4 py-2 rounded-lg bg-primary-app text-white">Go to Setup</button>
        </div>
      </div>
    );
  }

  if (!isAdmin && !isPaidPlan(plan)) {
    return (
      <div className="max-w-4xl mx-auto py-10">
        <div className="rounded-2xl border border-app bg-surface p-6">
          <h1 className="text-2xl font-black">Add More Tools is Pro Only</h1>
          <p className="text-sm text-subtle mt-2">Upgrade to Pro to add extra tools beyond your default category set.</p>
          <button onClick={() => navigate(ROUTES.userProfile)} className="mt-4 px-4 py-2 rounded-lg bg-primary-app text-white">Go to Profile</button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-6 space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-slate-900">Add More Tools</h1>
          <p className="text-slate-500 mt-2 text-sm">Choose extra tools for your selected category workspace.</p>
        </div>
        <button
          onClick={() => navigate(ROUTES.userDashboard)}
          disabled={customTools.length === 0}
          className={`px-5 py-3 rounded-xl text-sm font-semibold ${customTools.length ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-400'}`}
        >
          Launch My Workspace
        </button>
      </div>

      {(categories || []).map((category) => (
        <section key={category} className="space-y-3">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">{category}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {(TOOL_DEFINITIONS || [])
              .filter((tool) => tool.category === category)
              .map((tool) => {
                const selected = customTools.includes(tool.id);
                return (
                  <button
                    key={tool.id}
                    onClick={() => {
                      if (!selected && !canSelectMore) {
                        emitToast({ variant: 'info', message: 'Tool limit reached for current plan.' });
                        return;
                      }
                      dispatch(toggleCustomTool(tool.id as ToolFeature));
                      emitToast({ variant: 'success', message: selected ? 'Tool removed.' : 'Tool added.' });
                    }}
                    className={`rounded-xl border p-4 text-left transition-colors ${selected ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-800 border-slate-200'} ${!selected && !canSelectMore ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <p className="font-bold text-sm">{tool.label}</p>
                    <p className={`text-xs mt-1 ${selected ? 'text-slate-300' : 'text-slate-500'}`}>{tool.description}</p>
                  </button>
                );
              })}
          </div>
        </section>
      ))}

      <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <p className="text-xs text-slate-500">
          Selected tools: <span className="font-semibold text-slate-900">{customTools.length}</span>
        </p>
        <button onClick={() => { dispatch(setCustomTools([])); emitToast({ variant: 'success', message: 'Custom tool selection reset.' }); }} className="px-3 py-2 border border-slate-200 rounded-lg text-sm font-semibold text-slate-700">
          Reset Selection
        </button>
      </div>
    </div>
  );
};

export default CustomTools;
