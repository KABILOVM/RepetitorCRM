import React, { useState } from 'react';
import { storage, StorageKeys } from '../services/storage';
import { CallTask, Student } from '../types';
import { Phone, CheckCircle, Clock, Plus, X, Save } from 'lucide-react';

export const Calls: React.FC = () => {
  const [calls, setCalls] = useState<CallTask[]>(() => storage.get(StorageKeys.CALLS, []));
  const students = storage.get<Student[]>(StorageKeys.STUDENTS, []);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTask, setNewTask] = useState<Partial<CallTask>>({
      status: 'Ожидает',
      date: new Date().toISOString().split('T')[0]
  });

  const handleComplete = (id: number) => {
      const updated = calls.map(c => c.id === id ? { ...c, status: 'Выполнено' as const } : c);
      setCalls(updated);
      storage.set(StorageKeys.CALLS, updated);
  };

  const handleSave = () => {
      if (!newTask.studentName || !newTask.reason) {
          alert('Выберите ученика и причину звонка');
          return;
      }

      // Try to find parent phone automatically if not manually set
      let parentPhone = newTask.parentPhone;
      if (!parentPhone) {
          const student = students.find(s => s.fullName === newTask.studentName);
          parentPhone = student?.parentPhone || student?.phone || 'Не указан';
      }

      const task = { ...newTask, parentPhone, id: Date.now() } as CallTask;
      const updated = [task, ...calls];
      setCalls(updated);
      storage.set(StorageKeys.CALLS, updated);
      setIsModalOpen(false);
      setNewTask({ status: 'Ожидает', date: new Date().toISOString().split('T')[0] });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Звонки родителям</h2>
         <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
        >
          <Plus size={18} />
          Добавить задачу
        </button>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
            <h3 className="font-bold text-slate-700 dark:text-slate-200">Задачи на сегодня</h3>
            <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded text-xs font-bold">{calls.filter(c => c.status === 'Ожидает').length} активных</span>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {calls.map(call => (
                <div key={call.id} className={`p-6 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${call.status === 'Выполнено' ? 'opacity-60 bg-slate-50 dark:bg-slate-800/30' : ''}`}>
                    <div className="flex gap-4">
                        <div className={`h-12 w-12 rounded-full flex items-center justify-center ${call.status === 'Выполнено' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'}`}>
                            {call.status === 'Выполнено' ? <CheckCircle size={20}/> : <Phone size={20} />}
                        </div>
                        <div>
                            <h4 className={`font-bold text-slate-800 dark:text-slate-100 ${call.status === 'Выполнено' ? 'line-through decoration-slate-400' : ''}`}>{call.studentName}</h4>
                            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mt-1">
                                <span className="font-medium text-slate-700 dark:text-slate-300">Тел: {call.parentPhone}</span>
                                <span>•</span>
                                <span className={`${call.status === 'Выполнено' ? 'text-slate-500' : 'text-red-500 dark:text-red-400'} font-medium`}>{call.reason}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                         {call.status !== 'Выполнено' && (
                             <>
                                <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors">
                                    <Clock size={16} />
                                    Отложить
                                </button>
                                <button 
                                    onClick={() => handleComplete(call.id)}
                                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg transition-colors shadow-sm"
                                >
                                    <CheckCircle size={16} />
                                    Выполнено
                                </button>
                             </>
                         )}
                         {call.status === 'Выполнено' && <span className="text-emerald-600 dark:text-emerald-400 text-sm font-bold px-4">Завершено</span>}
                    </div>
                </div>
            ))}
            {calls.length === 0 && <div className="p-6 text-center text-slate-500 dark:text-slate-400">Нет задач на звонки.</div>}
        </div>
      </div>

       {/* Modal */}
       {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-md animate-in fade-in zoom-in duration-200">
                <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                    <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <Phone size={18} className="text-blue-600 dark:text-blue-400"/>
                        Новая задача
                    </h3>
                    <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                        <X size={20} />
                    </button>
                </div>
                
                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Студент</label>
                        <input 
                            type="text" 
                            list="students-list"
                            value={newTask.studentName || ''}
                            onChange={(e) => setNewTask({...newTask, studentName: e.target.value})}
                            className="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                            placeholder="Начните вводить имя..."
                        />
                         <datalist id="students-list">
                            {students.map(s => <option key={s.id} value={s.fullName} />)}
                        </datalist>
                    </div>
                     <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Причина звонка</label>
                        <input 
                            type="text"
                            value={newTask.reason || ''}
                            onChange={(e) => setNewTask({...newTask, reason: e.target.value})}
                            className="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                            placeholder="Например: Пропуски занятий"
                        />
                    </div>
                     <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Телефон для связи (опционально)</label>
                        <input 
                            type="text"
                            value={newTask.parentPhone || ''}
                            onChange={(e) => setNewTask({...newTask, parentPhone: e.target.value})}
                            className="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                            placeholder="+992..."
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Дата</label>
                        <input 
                            type="date"
                            value={newTask.date}
                            onChange={(e) => setNewTask({...newTask, date: e.target.value})}
                            className="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-2 text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                        />
                    </div>
                </div>

                <div className="p-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex justify-end gap-2">
                    <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg">Отмена</button>
                    <button onClick={handleSave} className="px-4 py-2 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded-lg font-medium flex items-center gap-2">
                        <Save size={16} /> Сохранить
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};