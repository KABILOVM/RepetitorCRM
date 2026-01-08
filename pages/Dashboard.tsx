import React from 'react';
import { storage, StorageKeys } from '../services/storage';
import { StudentStatus, Student, Transaction } from '../types';
import { TrendingUp, Users, AlertTriangle, Wallet } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const KpiCard = ({ title, value, subValue, icon: Icon, colorClass, bgClass, textClass }: any) => (
  <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-start justify-between transition-colors">
    <div>
      <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mb-1">{title}</p>
      <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{value}</h3>
      <p className={`text-xs mt-2 font-medium ${textClass}`}>
        {subValue}
      </p>
    </div>
    <div className={`p-3 rounded-xl ${bgClass}`}>
      <Icon className={colorClass} size={24} />
    </div>
  </div>
);

export const Dashboard: React.FC = () => {
  const students = storage.get<Student[]>(StorageKeys.STUDENTS, []);
  const transactions = storage.get<Transaction[]>(StorageKeys.TRANSACTIONS, []);

  const totalStudents = students.filter(s => s.status === StudentStatus.Active).length;
  const totalRevenue = transactions.reduce((acc, curr) => acc + curr.amount, 0);
  const totalDebt = students.reduce((acc, curr) => acc + (curr.balance < 0 ? Math.abs(curr.balance) : 0), 0);
  const atRisk = students.filter(s => s.consecutiveAbsences >= 3).length;

  const data = [
    { name: 'Авг', students: 30 },
    { name: 'Сен', students: 45 },
    { name: 'Окт', students: 52 },
    { name: 'Ноя', students: totalStudents + 10 }, // Прогноз
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Дашборд</h2>
        <span className="text-sm text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700">Октябрь 2023</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard 
          title="Активные ученики" 
          value={totalStudents} 
          subValue="+12% с прошлого месяца" 
          icon={Users} 
          colorClass="text-blue-600 dark:text-blue-400"
          bgClass="bg-blue-50 dark:bg-blue-900/20"
          textClass="text-emerald-500 dark:text-emerald-400"
        />
        <KpiCard 
          title="Выручка (Месяц)" 
          value={`${totalRevenue.toLocaleString()} с.`} 
          subValue="92% от плана" 
          icon={Wallet} 
          colorClass="text-emerald-600 dark:text-emerald-400"
          bgClass="bg-emerald-50 dark:bg-emerald-900/20"
          textClass="text-emerald-500 dark:text-emerald-400"
        />
        <KpiCard 
          title="Задолженность" 
          value={`${totalDebt.toLocaleString()} с.`} 
          subValue="12 должников" 
          icon={AlertTriangle} 
          colorClass="text-amber-600 dark:text-amber-400"
          bgClass="bg-amber-50 dark:bg-amber-900/20"
          textClass="text-amber-500 dark:text-amber-400"
        />
        <KpiCard 
          title="Риск оттока" 
          value={atRisk} 
          subValue=">3 пропусков" 
          icon={TrendingUp} 
          colorClass="text-rose-600 dark:text-rose-400"
          bgClass="bg-rose-50 dark:bg-rose-900/20"
          textClass="text-rose-500 dark:text-rose-400"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 transition-colors">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6">Рост учеников</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:opacity-10" />
                <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#94a3b8', fontSize: 12}} 
                    dy={10}
                />
                <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#94a3b8', fontSize: 12}} 
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1e293b', 
                    borderColor: '#334155', 
                    color: '#f8fafc',
                    borderRadius: '8px',
                    border: 'none',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                  }}
                  itemStyle={{ color: '#818cf8' }}
                  cursor={{fill: 'rgba(255,255,255,0.05)'}}
                />
                <Bar dataKey="students" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 transition-colors">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6">Последние транзакции</h3>
          <div className="space-y-4">
            {transactions.slice(0, 4).map(t => (
              <div key={t.id} className="flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-lg transition-colors border border-transparent hover:border-slate-100 dark:hover:border-slate-700">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-emerald-100 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                    <Wallet size={18} />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900 dark:text-slate-100">{t.studentName}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{t.date}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-emerald-600 dark:text-emerald-400">+{t.amount.toLocaleString()} с.</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500">{t.purpose}</p>
                </div>
              </div>
            ))}
            {transactions.length === 0 && <div className="text-slate-400 text-center py-4">Нет данных</div>}
          </div>
        </div>
      </div>
    </div>
  );
};