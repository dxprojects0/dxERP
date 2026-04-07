import React, { useState } from 'react';
import { CheckCircle2, ListTodo, Plus, Trash2 } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { addTask, deleteTask, toggleTask } from '../features/configSlice';

const Tasks: React.FC = () => {
  const dispatch = useDispatch();
  const tasks = useSelector((state: RootState) => state.config.tasks);
  const [newTask, setNewTask] = useState('');

  const completedCount = tasks.filter((task) => task.done).length;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-24 md:pb-20 overflow-x-hidden">
      <section className="rounded-[2rem] border border-app bg-surface p-6 md:p-8">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-black/5"><ListTodo size={20} /></div>
          <div>
            <h1 className="text-3xl font-black tracking-tight">Task Checklist</h1>
            <p className="text-sm text-subtle">Track daily execution, one clean list.</p>
          </div>
        </div>
      </section>

      <section className="rounded-[1rem] border border-app bg-surface p-3">
        <div className="flex gap-2 mb-4">
          <input
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            placeholder="Add a task..."
            className="flex-1 border border-app bg-transparent rounded-xl px-3 py-2 outline-none"
          />
          <button
            onClick={() => {
              if (!newTask.trim()) return;
              dispatch(addTask(newTask));
              setNewTask('');
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-app text-white font-semibold"
          >
            <Plus size={16}/>
          </button>
        </div>
        <div className="text-xs text-subtle mb-3">{completedCount}/{tasks.length} done</div>
        <div className="space-y-3 max-h-[62vh] overflow-y-auto overflow-x-hidden pr-0.5">
          {tasks.map((task) => (
            <div key={task.id} className="rounded-2xl border border-app px-4 py-3 flex items-center gap-3">
              <button onClick={() => dispatch(toggleTask(task.id))} className="shrink-0">
                <CheckCircle2 size={18} className={task.done ? 'text-[color:var(--success)]' : 'text-subtle'} />
              </button>
              <div className={`flex-1 text-sm ${task.done ? 'line-through text-subtle' : ''}`}>{task.title}</div>
              <button
                onClick={() => dispatch(deleteTask(task.id))}
                className="px-3 py-1.5 rounded-lg text-white bg-red-600/80 border-2 border-red-500 font-semibold inline-flex items-center gap-1"
              >
                <Trash2 size={13} /> Delete
              </button>
            </div>
          ))}
          {tasks.length === 0 && <div className="text-sm text-subtle text-center py-10">No tasks yet.</div>}
        </div>
      </section>
    </div>
  );
};

export default Tasks;
