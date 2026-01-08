import React, { useState } from 'react';
import { storage, StorageKeys } from '../services/storage';
import { Group, Student } from '../types';
import { ChevronLeft, ChevronRight, Save } from 'lucide-react';

export const Journal: React.FC = () => {
  const groups = storage.get<Group[]>(StorageKeys.GROUPS, []);
  const students = storage.get<Student[]>(StorageKeys.STUDENTS, []);

  const [selectedGroup, setSelectedGroup] = useState(groups[0]?.id || 0);
  const [selectedDate, setSelectedDate] = useState('2023-10-25');
  
  // Simulated students in group (taking first 3 for demo)
  const studentsInGroup = students.slice(0, 3);
  const [attendance, setAttendance] = useState<Record<number, string>>({});
  const [scores, setScores] = useState<Record<number, {chem: string, bio: string}>>({});

  const handleAttendance = (id: number, status: string) => {
    setAttendance(prev => ({ ...prev, [id]: status }));
  };

  const handleScore = (id: number, subject: 'chem'|'bio', val: string) => {
    setScores(prev => ({
        ...prev,
        [id]: { ...(prev[id] || {chem:'', bio:''}), [subject]: val }
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Классный журнал</h2>
        <div className="flex items-center gap-2">
            <select 
                className="border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                value={selectedGroup}
                onChange={(e) => setSelectedGroup(Number(e.target.value))}
            >
                {groups.map(g => (
                    <option key={g.id} value={g.id}>{g.name} - {g.subject}</option>
                ))}
                {groups.length === 0 && <option>Нет групп</option>}
            </select>
            <div className="flex items-center bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-600 dark:text-slate-200">
                <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-600 rounded-l-lg"><ChevronLeft size={16}/></button>
                <span className="px-2 text-sm font-medium border-x border-slate-200 dark:border-slate-600">{selectedDate}</span>
                <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-600 rounded-r-lg"><ChevronRight size={16}/></button>
            </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Тема урока</label>
                <input type="text" className="w-full border-slate-300 dark:border-slate-600 rounded-md text-sm p-2 border bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400" placeholder="Например: Основы органической химии" />
            </div>
            <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Домашнее задание</label>
                <input type="text" className="w-full border-slate-300 dark:border-slate-600 rounded-md text-sm p-2 border bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400" placeholder="Например: Читать главу 4, упр. 1-5" />
            </div>
        </div>

        <table className="w-full text-left border-collapse">
            <thead>
                <tr className="bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 text-xs">
                    <th className="p-3 border-r border-slate-200 dark:border-slate-700 w-1/3">Ученик</th>
                    <th className="p-3 border-r border-slate-200 dark:border-slate-700 text-center w-1/4">Посещаемость</th>
                    <th className="p-3 text-center">Оценки (Взвешенные)</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {studentsInGroup.map(s => (
                    <tr key={s.id}>
                        <td className="p-3 border-r border-slate-200 dark:border-slate-700 font-medium text-slate-800 dark:text-slate-100">{s.fullName}</td>
                        <td className="p-3 border-r border-slate-200 dark:border-slate-700">
                            <div className="flex justify-center gap-1">
                                {[
                                  { k: 'П', t: 'Присутствовал' }, 
                                  { k: 'Н', t: 'Не был' }, 
                                  { k: 'О', t: 'Опоздал' }, 
                                  { k: 'У', t: 'Уважительная' }
                                ].map((stat) => (
                                    <button
                                        key={stat.k}
                                        title={stat.t}
                                        onClick={() => handleAttendance(s.id, stat.k)}
                                        className={`w-8 h-8 rounded text-xs font-bold transition-colors ${
                                            attendance[s.id] === stat.k
                                            ? stat.k === 'П' ? 'bg-emerald-500 text-white' 
                                            : stat.k === 'Н' ? 'bg-red-500 text-white'
                                            : 'bg-amber-500 text-white'
                                            : 'bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'
                                        }`}
                                    >
                                        {stat.k}
                                    </button>
                                ))}
                            </div>
                        </td>
                        <td className="p-3">
                            <div className="flex items-center justify-center gap-2">
                                <div className="flex flex-col items-center">
                                    <span className="text-[10px] text-slate-400 dark:text-slate-500">Хим (60%)</span>
                                    <input 
                                        type="text" 
                                        className="w-12 text-center border border-slate-300 dark:border-slate-600 rounded p-1 text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100" 
                                        placeholder="0"
                                        onChange={(e) => handleScore(s.id, 'chem', e.target.value)}
                                    />
                                </div>
                                <span className="text-slate-300 dark:text-slate-600 text-xl">+</span>
                                <div className="flex flex-col items-center">
                                    <span className="text-[10px] text-slate-400 dark:text-slate-500">Био (40%)</span>
                                    <input 
                                        type="text" 
                                        className="w-12 text-center border border-slate-300 dark:border-slate-600 rounded p-1 text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100" 
                                        placeholder="0"
                                        onChange={(e) => handleScore(s.id, 'bio', e.target.value)}
                                    />
                                </div>
                                <span className="text-slate-300 dark:text-slate-600 text-xl">=</span>
                                <div className="font-bold text-blue-600 dark:text-blue-400 w-12 text-center">
                                    { /* Simple mock calc logic for demo */ }
                                    { Math.round((Number(scores[s.id]?.chem || 0) * 0.6) + (Number(scores[s.id]?.bio || 0) * 0.4)) }%
                                </div>
                            </div>
                        </td>
                    </tr>
                ))}
                 {studentsInGroup.length === 0 && (
                     <tr><td colSpan={3} className="p-6 text-center text-slate-500 dark:text-slate-400">Нет студентов</td></tr>
                )}
            </tbody>
        </table>
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 flex justify-end">
            <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700">
                <Save size={18} />
                Сохранить
            </button>
        </div>
      </div>
    </div>
  );
};