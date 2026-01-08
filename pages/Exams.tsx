import React, { useState } from 'react';
import { storage, StorageKeys } from '../services/storage';
import { ExamResult, Student } from '../types';
import { Award, Plus, X, Save, Search, Trash2, Edit2 } from 'lucide-react';

export const Exams: React.FC = () => {
  const [examResults, setExamResults] = useState<ExamResult[]>(() => storage.get(StorageKeys.EXAM_RESULTS, []));
  const students = storage.get<Student[]>(StorageKeys.STUDENTS, []);
  
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingResult, setEditingResult] = useState<Partial<ExamResult>>({
      date: new Date().toISOString().split('T')[0],
      maxScore: 100,
      score: 0
  });

  const handleAddNew = () => {
      setEditingResult({
          date: new Date().toISOString().split('T')[0],
          maxScore: 100,
          score: 0
      });
      setIsModalOpen(true);
  };

  const handleEdit = (result: ExamResult) => {
      setEditingResult({ ...result });
      setIsModalOpen(true);
  };

  const handleDelete = (id: number) => {
      if (confirm('Вы уверены, что хотите удалить этот результат?')) {
          const updated = examResults.filter(r => r.id !== id);
          setExamResults(updated);
          storage.set(StorageKeys.EXAM_RESULTS, updated);
      }
  };

  const handleSave = () => {
      if (!editingResult.studentName || !editingResult.subject || editingResult.score === undefined) {
          alert('Заполните обязательные поля: Студент, Предмет, Оценка');
          return;
      }
      
      // Auto-fill student ID if not present
      if (!editingResult.studentId) {
          const student = students.find(s => s.fullName === editingResult.studentName);
          if (student) {
              editingResult.studentId = student.id;
          } else {
              // Fallback ID if manual name entry without selecting from list (though list is suggested)
              editingResult.studentId = 0; 
          }
      }

      let updated: ExamResult[];
      if (editingResult.id) {
          updated = examResults.map(r => r.id === editingResult.id ? editingResult as ExamResult : r);
      } else {
          const newResult = { ...editingResult, id: Date.now() } as ExamResult;
          updated = [newResult, ...examResults];
      }

      setExamResults(updated);
      storage.set(StorageKeys.EXAM_RESULTS, updated);
      setIsModalOpen(false);
      setEditingResult(null);
  };

  const filteredResults = examResults.filter(r => 
      r.studentName.toLowerCase().includes(searchTerm.toLowerCase()) || 
      r.subject.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getScoreColor = (score: number, max: number) => {
      const percentage = (score / max) * 100;
      if (percentage >= 80) return 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800';
      if (percentage >= 50) return 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800';
      return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Успеваемость и Экзамены</h2>
        <button 
            onClick={handleAddNew}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 shadow-sm"
        >
          <Plus size={18} />
          Добавить результат
        </button>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        {/* Search */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
             <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  placeholder="Поиск по студенту или предмету..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                />
            </div>
        </div>

        <table className="w-full text-left border-collapse">
            <thead>
                <tr className="bg-slate-50 dark:bg-slate-700/30 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">
                    <th className="p-4 font-medium">Студент</th>
                    <th className="p-4 font-medium">Предмет</th>
                    <th className="p-4 font-medium">Дата</th>
                    <th className="p-4 font-medium">Результат</th>
                    <th className="p-4 font-medium">Обратная связь</th>
                    <th className="p-4 font-medium text-right">Действия</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {filteredResults.map(result => (
                    <tr key={result.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                        <td className="p-4 font-medium text-slate-800 dark:text-slate-100">{result.studentName}</td>
                        <td className="p-4 text-sm text-slate-600 dark:text-slate-300">{result.subject}</td>
                        <td className="p-4 text-sm text-slate-500 dark:text-slate-400">{result.date}</td>
                        <td className="p-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getScoreColor(result.score, result.maxScore)}`}>
                                {result.score} / {result.maxScore}
                            </span>
                        </td>
                        <td className="p-4 text-sm text-slate-600 dark:text-slate-300 max-w-xs truncate" title={result.feedback}>
                            {result.feedback || '-'}
                        </td>
                        <td className="p-4 text-right">
                             <div className="flex items-center justify-end gap-2">
                                <button 
                                    onClick={() => handleEdit(result)}
                                    className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                >
                                    <Edit2 size={16} />
                                </button>
                                <button 
                                    onClick={() => handleDelete(result.id)}
                                    className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </td>
                    </tr>
                ))}
                {filteredResults.length === 0 && (
                    <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-500 dark:text-slate-400">
                            Результаты не найдены.
                        </td>
                    </tr>
                )}
            </tbody>
        </table>
      </div>

       {/* Modal */}
      {isModalOpen && editingResult && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-md animate-in fade-in zoom-in duration-200">
                <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                    <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <Award size={18} className="text-blue-600 dark:text-blue-400"/>
                        {editingResult.id ? 'Редактировать результат' : 'Новый результат'}
                    </h3>
                    <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                        <X size={20} />
                    </button>
                </div>
                
                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Студент *</label>
                        <input 
                            type="text" 
                            list="students-list"
                            value={editingResult.studentName || ''}
                            onChange={(e) => {
                                const val = e.target.value;
                                // Auto-fill subject if student selected
                                const student = students.find(s => s.fullName === val);
                                const updates: any = { studentName: val };
                                if (student && student.subject) updates.subject = student.subject;
                                
                                setEditingResult({...editingResult, ...updates});
                            }}
                            className="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                            placeholder="Начните вводить имя..."
                        />
                         <datalist id="students-list">
                            {students.map(s => <option key={s.id} value={s.fullName} />)}
                        </datalist>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Предмет *</label>
                        <input 
                            type="text" 
                            value={editingResult.subject || ''}
                            onChange={(e) => setEditingResult({...editingResult, subject: e.target.value})}
                            className="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                            placeholder="Например: Математика"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Баллы</label>
                            <input 
                                type="number" 
                                value={editingResult.score}
                                onChange={(e) => setEditingResult({...editingResult, score: Number(e.target.value)})}
                                className="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Макс. баллы</label>
                            <input 
                                type="number" 
                                value={editingResult.maxScore}
                                onChange={(e) => setEditingResult({...editingResult, maxScore: Number(e.target.value)})}
                                className="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                            />
                        </div>
                    </div>
                    
                    <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Дата</label>
                        <input 
                            type="date"
                            value={editingResult.date}
                            onChange={(e) => setEditingResult({...editingResult, date: e.target.value})}
                            className="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-2 text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Обратная связь / Комментарий</label>
                        <textarea
                            value={editingResult.feedback || ''}
                            onChange={(e) => setEditingResult({...editingResult, feedback: e.target.value})}
                            className="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-2 text-sm h-20 resize-none focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                            placeholder="Какие темы нужно подтянуть..."
                        ></textarea>
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