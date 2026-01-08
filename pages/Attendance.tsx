import React, { useState } from 'react';
import { storage, StorageKeys } from '../services/storage';
import { Group, Student } from '../types';
import { ChevronLeft, ChevronRight, Save } from 'lucide-react';

export const Attendance: React.FC = () => {
  const groups = storage.get<Group[]>(StorageKeys.GROUPS, []);
  const students = storage.get<Student[]>(StorageKeys.STUDENTS, []);

  const [selectedGroup, setSelectedGroup] = useState(groups[0]?.id || 0);
  const [selectedDate, setSelectedDate] = useState('2023-10-25');
  
  // Simulated students in group (for now, simply taking all, in real app filter by group)
  const studentsInGroup = students.slice(0, 5); // Just taking first 5 for demo
  const [attendance, setAttendance] = useState<Record<number, string>>({});

  const handleAttendance = (id: number, status: string) => {
    setAttendance(prev => ({ ...prev, [id]: status }));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Посещаемость</h2>
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
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 uppercase">Отметка присутствия</h3>
        </div>

        <table className="w-full text-left border-collapse">
            <thead>
                <tr className="bg-slate-50 dark:bg-slate-700/30 text-slate-500 dark:text-slate-400 text-xs uppercase">
                    <th className="p-4 border-r border-slate-200 dark:border-slate-700 w-1/3">Ученик</th>
                    <th className="p-4 text-center">Статус</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {studentsInGroup.map(s => (
                    <tr key={s.id}>
                        <td className="p-4 border-r border-slate-200 dark:border-slate-700 font-medium text-slate-800 dark:text-slate-100">{s.fullName}</td>
                        <td className="p-4">
                            <div className="flex justify-center gap-2">
                                {[
                                  { k: 'П', t: 'Присутствовал', c: 'bg-emerald-500' }, 
                                  { k: 'Н', t: 'Не был', c: 'bg-red-500' }, 
                                  { k: 'О', t: 'Опоздал', c: 'bg-amber-500' }, 
                                  { k: 'У', t: 'Уважительная', c: 'bg-blue-500' }
                                ].map((stat) => (
                                    <button
                                        key={stat.k}
                                        title={stat.t}
                                        onClick={() => handleAttendance(s.id, stat.k)}
                                        className={`w-10 h-10 rounded-lg text-sm font-bold transition-all shadow-sm ${
                                            attendance[s.id] === stat.k
                                            ? `${stat.c} text-white ring-2 ring-offset-2 ring-${stat.c.split('-')[1]}-500 dark:ring-offset-slate-800`
                                            : 'bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-400 hover:border-slate-300 dark:hover:border-slate-500 hover:text-slate-600 dark:hover:text-slate-200'
                                        }`}
                                    >
                                        {stat.k}
                                    </button>
                                ))}
                            </div>
                        </td>
                    </tr>
                ))}
                {studentsInGroup.length === 0 && (
                     <tr><td colSpan={2} className="p-6 text-center text-slate-500 dark:text-slate-400">Нет студентов в выбранной группе</td></tr>
                )}
            </tbody>
        </table>
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 flex justify-end">
            <button className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 shadow-sm">
                <Save size={18} />
                Сохранить
            </button>
        </div>
      </div>
    </div>
  );
};