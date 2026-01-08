import React, { useState, useEffect } from 'react';
import { storage, StorageKeys } from '../services/storage';
import { Group } from '../types';
import { X, Clock, MapPin, User, BookOpen, Save } from 'lucide-react';

// Configuration
const days = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
const times = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'];

// Helper to map short day codes to full Russian names for initial parsing
const dayCodeMap: Record<string, string> = {
  'Пн': 'Понедельник',
  'Вт': 'Вторник',
  'Ср': 'Среда',
  'Чт': 'Четверг',
  'Пт': 'Пятница',
  'Сб': 'Суббота',
  'Mon': 'Понедельник',
  'Tue': 'Вторник',
  'Wed': 'Среда',
  'Thu': 'Четверг',
  'Fri': 'Пятница',
  'Sat': 'Суббота'
};

interface ScheduleEvent {
  uniqueId: string;
  groupId: number;
  name: string;
  subject: string;
  teacher: string;
  day: string;
  time: string;
  room: string;
  color: string;
}

const COLORS = [
  'bg-blue-100 border-blue-500 text-blue-800 dark:bg-blue-900/50 dark:border-blue-600 dark:text-blue-100',
  'bg-emerald-100 border-emerald-500 text-emerald-800 dark:bg-emerald-900/50 dark:border-emerald-600 dark:text-emerald-100',
  'bg-purple-100 border-purple-500 text-purple-800 dark:bg-purple-900/50 dark:border-purple-600 dark:text-purple-100',
  'bg-amber-100 border-amber-500 text-amber-800 dark:bg-amber-900/50 dark:border-amber-600 dark:text-amber-100',
  'bg-rose-100 border-rose-500 text-rose-800 dark:bg-rose-900/50 dark:border-rose-600 dark:text-rose-100',
];

export const Schedule: React.FC = () => {
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [draggedEvent, setDraggedEvent] = useState<string | null>(null);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<ScheduleEvent | null>(null);

  // Initialize events from groups in storage
  useEffect(() => {
    const groups = storage.get<Group[]>(StorageKeys.GROUPS, []);
    const initialEvents: ScheduleEvent[] = [];
    
    groups.forEach((group, index) => {
      const [dayPart, timePart] = group.schedule.split(' ');
      if (!dayPart || !timePart) return;

      // Split days (e.g. "Пн/Ср" -> ["Пн", "Ср"])
      const dayCodes = dayPart.split('/');
      
      dayCodes.forEach((code, i) => {
        const fullDay = dayCodeMap[code] || dayCodeMap[Object.keys(dayCodeMap).find(k => code.includes(k)) || ''];
        
        if (fullDay) {
          initialEvents.push({
            uniqueId: `${group.id}-${i}`,
            groupId: group.id,
            name: group.name,
            subject: group.subject,
            teacher: group.teacher,
            day: fullDay,
            time: timePart, // using the time from the string string
            room: 'Каб. 302', // Mock room
            color: COLORS[index % COLORS.length]
          });
        }
      });
    });
    setEvents(initialEvents);
  }, []);

  // --- Drag and Drop Handlers ---

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedEvent(id);
    e.dataTransfer.effectAllowed = 'move';
    // Transparent drag image or default
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // Necessary to allow dropping
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetDay: string, targetTime: string) => {
    e.preventDefault();
    
    if (!draggedEvent) return;

    setEvents(prev => prev.map(ev => {
      if (ev.uniqueId === draggedEvent) {
        return { ...ev, day: targetDay, time: targetTime };
      }
      return ev;
    }));
    
    setDraggedEvent(null);
  };

  // --- Modal Handlers ---

  const handleEventClick = (e: React.MouseEvent, event: ScheduleEvent) => {
    // Check for double click simulation or just use onDoubleClick on the element
    e.stopPropagation();
  };

  const handleDoubleClick = (event: ScheduleEvent) => {
    setEditingEvent({ ...event });
    setIsModalOpen(true);
  };

  const saveEventChanges = () => {
    if (!editingEvent) return;
    
    setEvents(prev => prev.map(ev => 
      ev.uniqueId === editingEvent.uniqueId ? editingEvent : ev
    ));
    setIsModalOpen(false);
    setEditingEvent(null);
  };

  const deleteEvent = () => {
    if (!editingEvent) return;
    if (window.confirm('Вы уверены, что хотите удалить это занятие из расписания?')) {
        setEvents(prev => prev.filter(ev => ev.uniqueId !== editingEvent.uniqueId));
        setIsModalOpen(false);
        setEditingEvent(null);
    }
  }

  return (
    <div className="space-y-6 relative">
        <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Расписание на неделю</h2>
            <div className="text-sm text-slate-500 dark:text-slate-400 bg-blue-50 dark:bg-blue-900/30 px-3 py-1 rounded-lg border border-blue-100 dark:border-blue-800">
                💡 Перетаскивайте карточки для изменения времени. Двойной клик для редактирования.
            </div>
        </div>
        
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-x-auto select-none custom-scrollbar">
            <table className="w-full min-w-[1000px] border-collapse">
                <thead>
                    <tr>
                        <th className="p-3 border-b border-r border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 w-20 sticky left-0 z-10 text-slate-700 dark:text-slate-300">Время</th>
                        {days.map(day => (
                            <th key={day} className="p-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 font-semibold text-slate-700 dark:text-slate-300 min-w-[140px]">
                                {day}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {times.map(time => (
                        <tr key={time}>
                            <td className="p-3 border-r border-b border-slate-100 dark:border-slate-700/50 text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/80 text-center sticky left-0 z-10">
                                {time}
                            </td>
                            {days.map(day => {
                                // Find events for this cell
                                const cellEvents = events.filter(e => e.day === day && e.time.startsWith(time.split(':')[0])); // Simple hour match
                                
                                return (
                                    <td 
                                        key={`${day}-${time}`} 
                                        className="p-1 border-b border-r border-slate-100 dark:border-slate-700/50 h-28 align-top transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/30"
                                        onDragOver={handleDragOver}
                                        onDrop={(e) => handleDrop(e, day, time)}
                                    >
                                        {cellEvents.map(ev => (
                                            <div 
                                                key={ev.uniqueId}
                                                draggable
                                                onDragStart={(e) => handleDragStart(e, ev.uniqueId)}
                                                onDoubleClick={() => handleDoubleClick(ev)}
                                                onClick={(e) => handleEventClick(e, ev)}
                                                className={`
                                                    ${ev.color} border-l-4 p-2 rounded text-xs mb-1 cursor-move shadow-sm 
                                                    hover:shadow-md transition-all hover:scale-[1.02] active:scale-95
                                                `}
                                            >
                                                <div className="font-bold truncate">{ev.name}</div>
                                                <div className="truncate opacity-80 mb-1">{ev.subject}</div>
                                                <div className="flex items-center gap-1 opacity-70 text-[10px]">
                                                    <MapPin size={10} /> {ev.room}
                                                </div>
                                                <div className="flex items-center gap-1 opacity-70 text-[10px] mt-0.5">
                                                    <User size={10} /> {ev.teacher.split(' ')[0]}
                                                </div>
                                            </div>
                                        ))}
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>

        {/* Edit Modal */}
        {isModalOpen && editingEvent && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                    <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                        <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                            <BookOpen size={18} className="text-blue-600 dark:text-blue-400"/>
                            Редактирование занятия
                        </h3>
                        <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                            <X size={20} />
                        </button>
                    </div>
                    
                    <div className="p-6 space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Группа</label>
                            <input 
                                type="text" 
                                value={editingEvent.name}
                                onChange={(e) => setEditingEvent({...editingEvent, name: e.target.value})}
                                className="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                            />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Предмет</label>
                                <input 
                                    type="text" 
                                    value={editingEvent.subject}
                                    onChange={(e) => setEditingEvent({...editingEvent, subject: e.target.value})}
                                    className="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                                />
                            </div>
                             <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Аудитория</label>
                                <input 
                                    type="text" 
                                    value={editingEvent.room}
                                    onChange={(e) => setEditingEvent({...editingEvent, room: e.target.value})}
                                    className="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Преподаватель</label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16}/>
                                <input 
                                    type="text" 
                                    value={editingEvent.teacher}
                                    onChange={(e) => setEditingEvent({...editingEvent, teacher: e.target.value})}
                                    className="w-full border border-slate-300 dark:border-slate-600 rounded-lg pl-10 pr-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">День недели</label>
                                <select 
                                    value={editingEvent.day}
                                    onChange={(e) => setEditingEvent({...editingEvent, day: e.target.value})}
                                    className="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                                >
                                    {days.map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                            </div>
                             <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Время</label>
                                <div className="relative">
                                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16}/>
                                    <select 
                                        value={editingEvent.time}
                                        onChange={(e) => setEditingEvent({...editingEvent, time: e.target.value})}
                                        className="w-full border border-slate-300 dark:border-slate-600 rounded-lg pl-10 pr-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 appearance-none"
                                    >
                                        {times.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex justify-between">
                         <button 
                            onClick={deleteEvent}
                            className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        >
                            Удалить
                        </button>
                        <div className="flex gap-2">
                            <button 
                                onClick={() => setIsModalOpen(false)}
                                className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                            >
                                Отмена
                            </button>
                            <button 
                                onClick={saveEventChanges}
                                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm"
                            >
                                <Save size={16} />
                                Сохранить
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};