import React, { useState } from 'react';
import { storage, StorageKeys } from '../services/storage';
import { Violation, Student } from '../types';
import { AlertTriangle, Plus, X, Save } from 'lucide-react';

export const Violations: React.FC = () => {
  const [violations, setViolations] = useState<Violation[]>(() => storage.get(StorageKeys.VIOLATIONS, []));
  const students = storage.get<Student[]>(StorageKeys.STUDENTS, []);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newViolation, setNewViolation] = useState<Partial<Violation>>({
      type: 'Поведение',
      date: new Date().toISOString().split('T')[0]
  });

  const handleSave = () => {
      if (!newViolation.studentName || !newViolation.comment) {
          alert('Выберите студента и укажите комментарий');
          return;
      }
      
      const v = { ...newViolation, id: Date.now() } as Violation;
      const updated = [v, ...violations];
      setViolations(updated);
      storage.set(StorageKeys.VIOLATIONS, updated);
      setIsModalOpen(false);
      setNewViolation({ type: 'Поведение', date: new Date().toISOString().split('T')[0] });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Нарушения</h2>
        <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
        >
          <Plus size={18} />
          Зафиксировать нарушение
        </button>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <table className="w-full text-left">
            <thead className="bg-slate-50 dark:bg-slate-700/30 text-slate-500 dark:text-slate-400 text-xs uppercase">
                <tr>
                    <th className="p-4">Ученик</th>
                    <th className="p-4">Дата</th>
                    <th className="p-4">Тип</th>
                    <th className="p-4">Комментарий</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {violations.map(v => (
                    <tr key={v.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                        <td className="p-4 font-medium text-slate-800 dark:text-slate-100">{v.studentName}</td>
                        <td className="p-4 text-slate-500 dark:text-slate-400 text-sm">{v.date}</td>
                        <td className="p-4">
                            <span className="inline-flex items-center gap-1 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 px-2 py-1 rounded text-xs font-bold border border-red-100 dark:border-red-800">
                                <AlertTriangle size={12} />
                                {v.type}
                            </span>
                        </td>
                        <td className="p-4 text-slate-600 dark:text-slate-300 text-sm">{v.comment}</td>
                    </tr>
                ))}
                {violations.length === 0 && <tr><td colSpan={4} className="p-6 text-center text-slate-500 dark:text-slate-400">Нарушений не зафиксировано.</td></tr>}
            </tbody>
        </table>
      </div>

       {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-md animate-in fade-in zoom-in duration-200">
                <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                    <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <AlertTriangle size={18} className="text-red-600 dark:text-red-400"/>
                        Новое нарушение
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
                            value={newViolation.studentName || ''}
                            onChange={(e) => setNewViolation({...newViolation, studentName: e.target.value})}
                            className="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                            placeholder="Начните вводить имя..."
                        />
                         <datalist id="students-list">
                            {students.map(s => <option key={s.id} value={s.fullName} />)}
                        </datalist>
                    </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Тип</label>
                            <select 
                                value={newViolation.type}
                                onChange={(e) => setNewViolation({...newViolation, type: e.target.value as any})}
                                className="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-2 text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                            >
                                <option value="Опоздание">Опоздание</option>
                                <option value="Поведение">Поведение</option>
                                <option value="ДЗ">Отсутствие ДЗ</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Дата</label>
                            <input 
                                type="date"
                                value={newViolation.date}
                                onChange={(e) => setNewViolation({...newViolation, date: e.target.value})}
                                className="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-2 text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Комментарий</label>
                        <textarea
                            value={newViolation.comment || ''}
                            onChange={(e) => setNewViolation({...newViolation, comment: e.target.value})}
                            className="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-2 text-sm h-20 resize-none focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                        ></textarea>
                    </div>
                </div>

                <div className="p-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex justify-end gap-2">
                    <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg">Отмена</button>
                    <button onClick={handleSave} className="px-4 py-2 text-sm bg-red-600 text-white hover:bg-red-700 rounded-lg font-medium flex items-center gap-2">
                        <Save size={16} /> Сохранить
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};