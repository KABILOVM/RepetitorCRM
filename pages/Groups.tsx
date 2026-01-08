import React, { useState } from 'react';
import { storage, StorageKeys } from '../services/storage';
import { Group, Teacher } from '../types';
import { Users, Calendar, Plus, Save, X, Library, Trash2 } from 'lucide-react';

export const Groups: React.FC = () => {
  const [groups, setGroups] = useState<Group[]>(() => storage.get(StorageKeys.GROUPS, []));
  const teachers = storage.get<Teacher[]>(StorageKeys.TEACHERS, []);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Partial<Group> | null>(null);

  const handleAddNew = () => {
    setEditingGroup({
        studentsCount: 0,
        maxStudents: 10,
        schedule: 'Пн/Ср/Пт 14:00'
    });
    setIsModalOpen(true);
  };

  const handleEdit = (group: Group) => {
    setEditingGroup({ ...group });
    setIsModalOpen(true);
  };

  const handleDelete = () => {
    if (!editingGroup?.id) return;
    if (confirm('Удалить группу? Это также удалит занятия из расписания.')) {
        const updated = groups.filter(g => g.id !== editingGroup.id);
        setGroups(updated);
        storage.set(StorageKeys.GROUPS, updated);
        setIsModalOpen(false);
        setEditingGroup(null);
    }
  };

  const handleSave = () => {
    if (!editingGroup?.name || !editingGroup?.subject) {
        alert('Пожалуйста, заполните Название и Предмет');
        return;
    }

    let updated: Group[];
    if (editingGroup.id) {
        updated = groups.map(g => g.id === editingGroup.id ? { ...g, ...editingGroup } as Group : g);
    } else {
        const newGroup = { ...editingGroup, id: Date.now() } as Group;
        updated = [...groups, newGroup];
    }
    setGroups(updated);
    storage.set(StorageKeys.GROUPS, updated);
    setIsModalOpen(false);
    setEditingGroup(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Группы</h2>
        <button 
            onClick={handleAddNew}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 shadow-sm"
        >
          <Plus size={18} />
          Создать группу
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {groups.map(group => (
          <div 
            key={group.id} 
            onClick={() => handleEdit(group)}
            className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{group.name}</h3>
                <span className="text-sm text-slate-500 dark:text-slate-400">{group.subject}</span>
              </div>
              <span className={`px-2 py-1 rounded text-xs font-bold ${
                group.studentsCount >= group.maxStudents 
                  ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' 
                  : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
              }`}>
                {group.studentsCount}/{group.maxStudents} мест
              </span>
            </div>
            
            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                <Users size={16} className="text-slate-400 dark:text-slate-500" />
                <span>Преп: {group.teacher || 'Не назначен'}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                <Calendar size={16} className="text-slate-400 dark:text-slate-500" />
                <span>{group.schedule}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button className="flex-1 bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 py-2 rounded-lg text-sm font-medium transition-colors">
                Расписание
              </button>
              <button className="flex-1 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 py-2 rounded-lg text-sm font-medium transition-colors">
                Журнал
              </button>
            </div>
          </div>
        ))}
        {groups.length === 0 && (
            <div className="col-span-full text-center text-slate-500 dark:text-slate-400 py-10 bg-white dark:bg-slate-800 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                Группы не найдены. Создайте новую группу.
            </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && editingGroup && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-md animate-in fade-in zoom-in duration-200">
                <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                    <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <Library size={18} className="text-blue-600 dark:text-blue-400"/>
                        {editingGroup.id ? 'Редактировать группу' : 'Новая группа'}
                    </h3>
                    <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                        <X size={20} />
                    </button>
                </div>
                
                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Название группы *</label>
                        <input 
                            type="text" 
                            value={editingGroup.name || ''}
                            onChange={(e) => setEditingGroup({...editingGroup, name: e.target.value})}
                            className="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                            placeholder="Например: Math-10A"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Предмет *</label>
                        <input 
                            type="text" 
                            value={editingGroup.subject || ''}
                            onChange={(e) => setEditingGroup({...editingGroup, subject: e.target.value})}
                            className="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                            placeholder="Математика"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Преподаватель</label>
                        <select 
                            value={editingGroup.teacher || ''}
                            onChange={(e) => setEditingGroup({...editingGroup, teacher: e.target.value})}
                            className="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                        >
                            <option value="">Выберите преподавателя...</option>
                            {teachers.map(t => (
                                <option key={t.id} value={t.fullName}>{t.fullName} ({t.subject})</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Расписание (строка)</label>
                        <input 
                            type="text" 
                            value={editingGroup.schedule || ''}
                            onChange={(e) => setEditingGroup({...editingGroup, schedule: e.target.value})}
                            className="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                            placeholder="Например: Пн/Ср/Пт 14:00"
                        />
                        <p className="text-[10px] text-slate-400 mt-1">Используйте дни: Пн, Вт, Ср, Чт, Пт, Сб</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Учеников сейчас</label>
                            <input 
                                type="number" 
                                value={editingGroup.studentsCount || 0}
                                onChange={(e) => setEditingGroup({...editingGroup, studentsCount: Number(e.target.value)})}
                                className="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Макс. мест</label>
                            <input 
                                type="number" 
                                value={editingGroup.maxStudents || 10}
                                onChange={(e) => setEditingGroup({...editingGroup, maxStudents: Number(e.target.value)})}
                                className="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                            />
                        </div>
                    </div>
                </div>

                <div className="p-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex justify-between">
                     {editingGroup.id ? (
                        <button onClick={handleDelete} className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 px-3 py-2 rounded-lg text-sm font-medium transition-colors">
                            Удалить
                        </button>
                     ) : <div></div>}
                    <div className="flex gap-2">
                        <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg">Отмена</button>
                        <button onClick={handleSave} className="px-4 py-2 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded-lg font-medium flex items-center gap-2">
                            <Save size={16} /> Сохранить
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};