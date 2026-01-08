import React, { useState } from 'react';
import { storage, StorageKeys } from '../services/storage';
import { StudentStatus, Student, PipelineStage } from '../types';
import { Search, Phone, MoreHorizontal, CheckSquare, Square, ChevronDown, X, User, GraduationCap, CreditCard, Mail, Save, Trash2, Plus } from 'lucide-react';

export const Students: React.FC = () => {
  const [students, setStudents] = useState<Student[]>(() => storage.get(StorageKeys.STUDENTS, []));
  const [filter, setFilter] = useState<string>('Все');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Partial<Student> | null>(null);

  const filteredStudents = students.filter(student => {
    const matchesStatus = filter === 'Все' || student.status === filter;
    const matchesSearch = student.fullName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getStatusColor = (status: StudentStatus) => {
    switch (status) {
      case StudentStatus.Active: return 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800';
      case StudentStatus.Lead: return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800';
      case StudentStatus.Paused: return 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800';
      default: return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600';
    }
  };

  const handleStatusChange = (id: number, newStatus: string) => {
    const updated = students.map(s => s.id === id ? { ...s, status: newStatus as StudentStatus } : s);
    setStudents(updated);
    storage.set(StorageKeys.STUDENTS, updated);
  };

  const toggleSelect = (id: number) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredStudents.length && filteredStudents.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredStudents.map(s => s.id)));
    }
  };

  const bulkUpdateStatus = (status: StudentStatus) => {
    const updated = students.map(s => selectedIds.has(s.id) ? { ...s, status } : s);
    setStudents(updated);
    storage.set(StorageKeys.STUDENTS, updated);
    setSelectedIds(new Set());
  };

  // CRUD Operations
  const handleAddNew = () => {
    setEditingStudent({
      status: StudentStatus.Lead,
      pipelineStage: PipelineStage.New,
      balance: 0,
      monthlyFee: 0,
      consecutiveAbsences: 0,
      source: 'Администратор'
    });
    setIsModalOpen(true);
  };

  const handleEdit = (student: Student) => {
    setEditingStudent({ ...student });
    setIsModalOpen(true);
  };

  const handleDelete = () => {
    if (!editingStudent?.id) return;
    if (confirm('Вы уверены? Это действие нельзя отменить.')) {
      const updated = students.filter(s => s.id !== editingStudent.id);
      setStudents(updated);
      storage.set(StorageKeys.STUDENTS, updated);
      setIsModalOpen(false);
      setEditingStudent(null);
    }
  };

  const handleSave = () => {
    if (!editingStudent?.fullName || !editingStudent?.phone) {
      alert('Пожалуйста, заполните ФИО и телефон');
      return;
    }

    let updatedStudents: Student[];
    
    if (editingStudent.id) {
      // Update existing
      updatedStudents = students.map(s => s.id === editingStudent.id ? { ...s, ...editingStudent } as Student : s);
    } else {
      // Create new
      const newStudent: Student = {
        ...editingStudent as Student,
        id: Date.now(),
      };
      updatedStudents = [newStudent, ...students];
    }

    setStudents(updatedStudents);
    storage.set(StorageKeys.STUDENTS, updatedStudents);
    setIsModalOpen(false);
    setEditingStudent(null);
  };

  // Form Components helper
  const InputGroup = ({ label, value, onChange, type = "text", placeholder = "" }: any) => (
    <div>
      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">{label}</label>
      <input
        type={type}
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400"
      />
    </div>
  );

  return (
    <div className="space-y-6 pb-20 relative">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Список учеников</h2>
        <button 
          onClick={handleAddNew}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm flex items-center gap-2"
        >
          <Plus size={18} />
          Добавить ученика
        </button>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        {/* Filters and Search */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-50 dark:bg-slate-800/50">
          <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0 hide-scrollbar">
            {['Все', ...Object.values(StudentStatus)].map(status => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                  filter === status 
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm ring-1 ring-slate-200 dark:ring-slate-600' 
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Поиск..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400"
            />
          </div>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-700/30 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider border-b border-slate-100 dark:border-slate-700">
                <th className="p-4 w-12 text-center">
                    <button 
                        onClick={toggleSelectAll} 
                        className={`p-1 rounded transition-colors ${selectedIds.size === filteredStudents.length && filteredStudents.length > 0 ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/20' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                    >
                        {selectedIds.size === filteredStudents.length && filteredStudents.length > 0 ? <CheckSquare size={20}/> : <Square size={20}/>}
                    </button>
                </th>
                <th className="p-4 font-medium">ФИО / Предмет</th>
                <th className="p-4 font-medium">Контакты</th>
                <th className="p-4 font-medium">Статус</th>
                <th className="p-4 font-medium">Родитель</th>
                <th className="p-4 font-medium">Школа</th>
                <th className="p-4 font-medium text-right">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {filteredStudents.map(student => (
                <tr key={student.id} className={`hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group ${selectedIds.has(student.id) ? 'bg-blue-50/30 dark:bg-blue-900/10' : ''}`}>
                  <td className="p-4 text-center">
                      <button 
                        onClick={() => toggleSelect(student.id)} 
                        className={`p-1 rounded transition-colors ${selectedIds.has(student.id) ? 'text-blue-600 dark:text-blue-400' : 'text-slate-300 dark:text-slate-600 hover:text-slate-500 dark:hover:text-slate-400'}`}
                      >
                        {selectedIds.has(student.id) ? <CheckSquare size={20}/> : <Square size={20}/>}
                      </button>
                  </td>
                  <td className="p-4 cursor-pointer" onClick={() => handleEdit(student)}>
                    <span className="font-medium text-slate-800 dark:text-slate-100 hover:text-blue-600 dark:hover:text-blue-400 text-left block">
                        {student.fullName}
                    </span>
                    {student.subject && <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{student.subject}</div>}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                      <Phone size={14} className="text-slate-400 dark:text-slate-500" />
                      <span>{student.phone}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="relative group/status inline-block">
                        <select 
                            value={student.status}
                            onChange={(e) => handleStatusChange(student.id, e.target.value)}
                            className={`appearance-none cursor-pointer pl-3 pr-8 py-1 rounded-full text-xs font-semibold border transition-shadow ${getStatusColor(student.status)} focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-400 dark:bg-slate-800`}
                        >
                            {Object.values(StudentStatus).map(s => <option key={s} value={s} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">{s}</option>)}
                        </select>
                        <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-50" />
                    </div>
                  </td>
                  <td className="p-4">
                     {student.parentName ? (
                        <div className="text-sm">
                            <span className="text-slate-700 dark:text-slate-300 block max-w-[150px] truncate">{student.parentName}</span>
                            <span className="text-xs text-slate-400 dark:text-slate-500">{student.parentPhone}</span>
                        </div>
                     ) : (
                         <span className="text-slate-300 dark:text-slate-600 text-sm">-</span>
                     )}
                  </td>
                  <td className="p-4">
                    {student.school ? (
                        <div className="text-xs bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded inline-block text-slate-600 dark:text-slate-300">
                            {student.school} {student.grade && `(${student.grade})`}
                        </div>
                    ) : <span className="text-slate-300 dark:text-slate-600 text-sm">-</span>}
                  </td>
                  <td className="p-4 text-right">
                    <button 
                        onClick={() => handleEdit(student)}
                        className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                    >
                      <MoreHorizontal size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredStudents.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-500 dark:text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                        <Search size={32} className="text-slate-300 dark:text-slate-600" />
                        <p>Ученики не найдены</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedIds.size > 0 && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-full max-w-3xl px-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="bg-slate-800 dark:bg-slate-700 text-white p-2 sm:p-3 rounded-2xl shadow-2xl flex flex-col sm:flex-row items-center justify-between border border-slate-700/50 backdrop-blur-md gap-3 sm:gap-0">
                <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-start px-2">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold ring-2 ring-slate-800 ring-offset-2 ring-offset-blue-600">
                            {selectedIds.size}
                        </div>
                        <span className="font-medium text-slate-200 text-sm">выбрано</span>
                    </div>
                    <div className="h-6 w-px bg-slate-600 hidden sm:block"></div>
                    <div className="flex gap-1">
                        {Object.values(StudentStatus).map(status => (
                            <button 
                              key={status}
                              onClick={() => bulkUpdateStatus(status)}
                              className="px-3 py-1.5 text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg border border-slate-600 transition-all"
                            >
                              {status}
                            </button>
                        ))}
                    </div>
                </div>
                <button 
                    onClick={() => setSelectedIds(new Set())} 
                    className="text-slate-400 hover:text-white p-2"
                >
                    <X size={18} />
                </button>
            </div>
          </div>
      )}

      {/* Edit/Create Modal */}
      {isModalOpen && editingStudent && (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-end">
            <div className="w-full max-w-xl bg-white dark:bg-slate-800 h-full overflow-y-auto shadow-2xl animate-in slide-in-from-right duration-300">
                <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 p-6 flex items-start justify-between z-10">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
                            {editingStudent.id ? 'Редактирование' : 'Новый ученик'}
                        </h2>
                        {editingStudent.id && (
                             <span className="text-xs text-slate-500 dark:text-slate-400">ID: {editingStudent.id}</span>
                        )}
                    </div>
                    <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-slate-400">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-6 space-y-8">
                    {/* Main Info */}
                    <div className="space-y-4">
                        <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-700">
                            <User size={18} className="text-blue-500"/>
                            Личные данные
                        </h3>
                        <div className="grid grid-cols-1 gap-4">
                            <InputGroup label="ФИО Ученика *" value={editingStudent.fullName} onChange={(v: string) => setEditingStudent({...editingStudent, fullName: v})} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <InputGroup label="Телефон *" value={editingStudent.phone} onChange={(v: string) => setEditingStudent({...editingStudent, phone: v})} />
                            <InputGroup label="Год рождения" value={editingStudent.birthYear} onChange={(v: string) => setEditingStudent({...editingStudent, birthYear: v})} type="number" />
                            <InputGroup label="Школа" value={editingStudent.school} onChange={(v: string) => setEditingStudent({...editingStudent, school: v})} />
                            <InputGroup label="Класс" value={editingStudent.grade} onChange={(v: string) => setEditingStudent({...editingStudent, grade: v})} />
                        </div>
                    </div>

                    {/* Parents */}
                    <div className="space-y-4">
                        <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-700">
                            <User size={18} className="text-emerald-500"/>
                            Родители
                        </h3>
                        <div className="grid grid-cols-1 gap-4">
                            <InputGroup label="ФИО Родителя" value={editingStudent.parentName} onChange={(v: string) => setEditingStudent({...editingStudent, parentName: v})} />
                            <div className="grid grid-cols-2 gap-4">
                                <InputGroup label="Телефон родителя" value={editingStudent.parentPhone} onChange={(v: string) => setEditingStudent({...editingStudent, parentPhone: v})} />
                                <InputGroup label="Email" value={editingStudent.parentEmail} onChange={(v: string) => setEditingStudent({...editingStudent, parentEmail: v})} />
                            </div>
                        </div>
                    </div>

                    {/* Academic */}
                    <div className="space-y-4">
                        <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-700">
                            <GraduationCap size={18} className="text-purple-500"/>
                            Обучение
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                             <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Статус</label>
                                <select 
                                    value={editingStudent.status}
                                    onChange={(e) => setEditingStudent({...editingStudent, status: e.target.value as StudentStatus})}
                                    className="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                                >
                                    {Object.values(StudentStatus).map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                            <InputGroup label="Предмет" value={editingStudent.subject} onChange={(v: string) => setEditingStudent({...editingStudent, subject: v})} />
                            <InputGroup label="Цель обучения" value={editingStudent.studyGoal} onChange={(v: string) => setEditingStudent({...editingStudent, studyGoal: v})} />
                            <InputGroup label="Язык обучения" value={editingStudent.language} onChange={(v: string) => setEditingStudent({...editingStudent, language: v})} />
                        </div>
                    </div>

                    {/* Admin */}
                    <div className="space-y-4">
                        <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-700">
                            <CreditCard size={18} className="text-amber-500"/>
                            Административное
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <InputGroup label="Стоимость в месяц" value={editingStudent.monthlyFee} onChange={(v: string) => setEditingStudent({...editingStudent, monthlyFee: Number(v)})} type="number" />
                            <InputGroup label="Баланс" value={editingStudent.balance} onChange={(v: string) => setEditingStudent({...editingStudent, balance: Number(v)})} type="number" />
                            <InputGroup label="Скидка (%)" value={editingStudent.discountPercent} onChange={(v: string) => setEditingStudent({...editingStudent, discountPercent: Number(v)})} type="number" />
                            <div className="flex items-center pt-6">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        checked={editingStudent.contract || false}
                                        onChange={(e) => setEditingStudent({...editingStudent, contract: e.target.checked})}
                                        className="w-4 h-4 text-blue-600 rounded border-slate-300 dark:border-slate-600 focus:ring-blue-500 bg-white dark:bg-slate-700"
                                    />
                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Договор подписан</span>
                                </label>
                            </div>
                        </div>
                         <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Примечание</label>
                            <textarea
                                value={editingStudent.note || ''}
                                onChange={e => setEditingStudent({...editingStudent, note: e.target.value})}
                                className="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none h-20 resize-none bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400"
                            ></textarea>
                        </div>
                    </div>
                </div>
                
                <div className="sticky bottom-0 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 p-4 flex justify-between items-center z-10">
                    {editingStudent.id ? (
                        <button 
                            onClick={handleDelete}
                            className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-sm font-medium transition-colors"
                        >
                            <Trash2 size={18} />
                            Удалить
                        </button>
                    ) : <div></div>}
                    
                    <div className="flex gap-2">
                        <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-sm font-medium">
                            Отмена
                        </button>
                        <button onClick={handleSave} className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 shadow-sm">
                            <Save size={18} />
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