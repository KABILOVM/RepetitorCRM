import React, { useState } from 'react';
import { storage, StorageKeys } from '../services/storage';
import { Transaction, Student } from '../types';
import { AlertCircle, Wallet, Edit2, Trash2, X, Save, Plus } from 'lucide-react';

export const Finance: React.FC = () => {
  const [students] = useState<Student[]>(() => storage.get(StorageKeys.STUDENTS, []));
  const debtors = students.filter(s => s.balance < 0);
  
  // State for transactions to allow updates
  const [transactions, setTransactions] = useState<Transaction[]>(() => storage.get(StorageKeys.TRANSACTIONS, []));
  
  // Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Partial<Transaction> | null>(null);

  const handleDelete = (id: number) => {
      if (window.confirm('Вы уверены, что хотите удалить эту транзакцию?')) {
          const updated = transactions.filter(t => t.id !== id);
          setTransactions(updated);
          storage.set(StorageKeys.TRANSACTIONS, updated);
      }
  };

  const handleEditClick = (t: Transaction) => {
      setEditingTransaction({ ...t });
      setIsModalOpen(true);
  };

  const handleAddNew = () => {
      setEditingTransaction({
          amount: 0,
          type: 'Payment',
          date: new Date().toISOString().split('T')[0],
          purpose: 'Оплата за обучение'
      });
      setIsModalOpen(true);
  }

  const saveEdit = () => {
      if (!editingTransaction?.amount || !editingTransaction?.studentName) {
          alert('Укажите сумму и имя студента');
          return;
      }

      let updated: Transaction[];
      if (editingTransaction.id) {
           updated = transactions.map(t => t.id === editingTransaction.id ? editingTransaction as Transaction : t);
      } else {
          const newT = {
              ...editingTransaction,
              id: Date.now()
          } as Transaction;
          updated = [newT, ...transactions];
      }
      
      setTransactions(updated);
      storage.set(StorageKeys.TRANSACTIONS, updated);
      setIsModalOpen(false);
      setEditingTransaction(null);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Финансы</h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Debtors List */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-rose-50 dark:bg-rose-900/20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="text-rose-600 dark:text-rose-400" size={20} />
              <h3 className="font-bold text-rose-700 dark:text-rose-300">Список должников</h3>
            </div>
            <span className="text-sm text-rose-600 dark:text-rose-400 font-medium">
              Общая задолженность: {debtors.reduce((acc, s) => acc + Math.abs(s.balance), 0).toLocaleString()} с.
            </span>
          </div>
          <table className="w-full text-left">
            <thead className="bg-slate-50 dark:bg-slate-700/30 text-slate-500 dark:text-slate-400 text-xs uppercase">
              <tr>
                <th className="p-3">Ученик</th>
                <th className="p-3">Контакты</th>
                <th className="p-3">Долг</th>
                <th className="p-3 text-right">Действие</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {debtors.map(student => (
                <tr key={student.id}>
                  <td className="p-3 font-medium text-slate-800 dark:text-slate-100">{student.fullName}</td>
                  <td className="p-3 text-sm text-slate-500 dark:text-slate-400">{student.phone}</td>
                  <td className="p-3 font-bold text-rose-600 dark:text-rose-400">{Math.abs(student.balance).toLocaleString()} с.</td>
                  <td className="p-3 text-right">
                    <button 
                        onClick={() => {
                            setEditingTransaction({
                                studentId: student.id,
                                studentName: student.fullName,
                                amount: Math.abs(student.balance),
                                type: 'Payment',
                                date: new Date().toISOString().split('T')[0],
                                purpose: 'Погашение долга'
                            });
                            setIsModalOpen(true);
                        }}
                        className="text-xs bg-emerald-600 text-white px-2 py-1 rounded hover:bg-emerald-700"
                    >
                      Принять оплату
                    </button>
                  </td>
                </tr>
              ))}
              {debtors.length === 0 && <tr><td colSpan={4} className="p-4 text-center text-slate-500 dark:text-slate-400">Должников нет.</td></tr>}
            </tbody>
          </table>
        </div>

        {/* Recent Transactions with Edit/Delete */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col h-[600px]">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                <h3 className="font-bold text-slate-800 dark:text-white">История операций</h3>
                <button onClick={handleAddNew} className="text-white bg-blue-600 hover:bg-blue-700 p-1 rounded shadow-sm">
                    <Plus size={20} />
                </button>
            </div>
            <div className="flex-1 overflow-auto p-2 space-y-2 custom-scrollbar">
                {transactions.length === 0 ? (
                    <div className="text-center text-slate-400 py-8">История пуста</div>
                ) : (
                    transactions.map(t => (
                        <div key={t.id} className="group p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg flex justify-between items-start hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-600">
                            <div>
                                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{t.studentName}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">{t.purpose}</p>
                                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">{t.date}</p>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                                <span className={`text-sm font-bold ${t.type === 'Refund' ? 'text-red-500 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                    {t.type === 'Refund' ? '-' : '+'}{t.amount.toLocaleString()} с.
                                </span>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button 
                                        onClick={() => handleEditClick(t)}
                                        className="p-1 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded"
                                        title="Редактировать"
                                    >
                                        <Edit2 size={14} />
                                    </button>
                                    <button 
                                        onClick={() => handleDelete(t.id)}
                                        className="p-1 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
                                        title="Удалить"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
      </div>

      {/* Edit/Create Modal */}
      {isModalOpen && editingTransaction && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
             <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-sm animate-in fade-in zoom-in duration-200">
                <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                    <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <Wallet size={18} className="text-blue-600 dark:text-blue-400"/>
                        {editingTransaction.id ? 'Редактирование' : 'Новая транзакция'}
                    </h3>
                    <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                        <X size={20} />
                    </button>
                </div>
                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Студент</label>
                        {/* If creating new, show input/select. If editing, typically name is fixed or selectable. Simple input for now. */}
                        <input 
                            type="text" 
                            list="students-list"
                            value={editingTransaction.studentName || ''}
                            onChange={(e) => setEditingTransaction({...editingTransaction, studentName: e.target.value})}
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
                                value={editingTransaction.type}
                                onChange={(e) => setEditingTransaction({...editingTransaction, type: e.target.value as any})}
                                className="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-2 text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                            >
                                <option value="Payment">Оплата</option>
                                <option value="Refund">Возврат</option>
                            </select>
                        </div>
                         <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Сумма</label>
                            <input 
                                type="number" 
                                value={editingTransaction.amount} 
                                onChange={(e) => setEditingTransaction({...editingTransaction, amount: Number(e.target.value)})}
                                className="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Назначение</label>
                        <input 
                            type="text" 
                            value={editingTransaction.purpose} 
                            onChange={(e) => setEditingTransaction({...editingTransaction, purpose: e.target.value})}
                            className="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                        />
                    </div>
                     <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Дата</label>
                        <input 
                            type="date" 
                            value={editingTransaction.date} 
                            onChange={(e) => setEditingTransaction({...editingTransaction, date: e.target.value})}
                            className="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                        />
                    </div>
                </div>
                <div className="p-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex justify-end gap-2">
                    <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg">Отмена</button>
                    <button onClick={saveEdit} className="px-4 py-2 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded-lg font-medium">Сохранить</button>
                </div>
             </div>
        </div>
      )}
    </div>
  );
};