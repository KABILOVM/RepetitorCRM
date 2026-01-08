import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { storage, StorageKeys } from '../services/storage';
import { Student, StudentStatus } from '../types';
import { Calendar, Settings, ArrowUpRight, ArrowDownRight, TrendingUp, Users, Target, Minus, Plus, Filter, RefreshCcw } from 'lucide-react';
import { DateRangePicker } from '../components/DateRangePicker';

// --- Charts Data (Legacy) ---
const data = [
  { name: 'Авг', students: 30 },
  { name: 'Сен', students: 45 },
  { name: 'Окт', students: 52 },
  { name: 'Ноя', students: 62 },
];

const sourceData = [
  { name: 'Instagram', value: 400 },
  { name: 'Google', value: 300 },
  { name: 'Друзья', value: 300 },
  { name: 'Прочее', value: 200 },
];

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

// Custom Tooltip for Dark/Light mode compatibility
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-slate-700 p-3 border border-slate-200 dark:border-slate-600 rounded-lg shadow-lg">
        <p className="text-sm font-bold text-slate-700 dark:text-slate-100">{label}</p>
        <p className="text-sm text-blue-600 dark:text-blue-400">
          Учеников: {payload[0].value}
        </p>
      </div>
    );
  }
  return null;
};

// --- Report Interfaces ---
type ReportMode = 'charts' | 'report';
type DateMode = 'daily' | 'period';

interface SubjectStats {
  subject: string;
  plan: number;
  fact: number; // Active students at end of period
  presale: number; // Leads
  joined: number; // New in period
  left: number; // Left in period
  dynamics: number; // joined - left
}

export const Analytics: React.FC = () => {
  const [mode, setMode] = useState<ReportMode>('report'); // Default to report as requested
  const [dateMode, setDateMode] = useState<DateMode>('daily');
  
  // Date State
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  
  const [primaryDate, setPrimaryDate] = useState(today);
  const [compareDate, setCompareDate] = useState(yesterday); // For daily mode comparison
  
  const [range1Start, setRange1Start] = useState(new Date(new Date().setDate(1)).toISOString().split('T')[0]); // 1st of month
  const [range1End, setRange1End] = useState(today);
  
  const [range2Start, setRange2Start] = useState(new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0]); // Last month
  const [range2End, setRange2End] = useState(new Date(new Date().setDate(0)).toISOString().split('T')[0]);

  // Data Loading
  const students = storage.get<Student[]>(StorageKeys.STUDENTS, []);
  const [targets, setTargets] = useState<Record<string, number>>(() => storage.get(StorageKeys.SUBJECT_TARGETS, {}));
  const [isTargetModalOpen, setIsTargetModalOpen] = useState(false);

  // Helper to check if date is in range (inclusive)
  const isBetween = (dateStr: string | undefined, start: string, end: string) => {
    if (!dateStr) return false;
    return dateStr >= start && dateStr <= end;
  };

  // Helper to count active students ON a specific date
  const getActiveOnDate = (studentList: Student[], date: string, subject: string) => {
    return studentList.filter(s => {
      const matchSubject = s.subject === subject;
      const joinedBeforeOrOn = s.startDate ? s.startDate <= date : false;
      const notLeftOrLeftAfter = !s.endDate || s.endDate > date;
      // Also consider status if date logic isn't strictly followed in DB, but for now date logic takes precedence
      // Fallback: if no dates, use current status if date == today
      if (!s.startDate && date === today) return matchSubject && s.status === StudentStatus.Active;
      
      return matchSubject && joinedBeforeOrOn && notLeftOrLeftAfter && s.status !== StudentStatus.Lead;
    }).length;
  };

  // Calculation Logic
  const calculateStats = (start: string, end: string): SubjectStats[] => {
    // Get unique subjects
    const subjects = Array.from(new Set(students.map(s => s.subject || 'Без предмета'))).filter(s => s);
    
    // Sort subjects specifically to match the user's order if possible, otherwise alphabetical
    const subjectOrder = ['Химия', 'Биология', 'Физика', 'Тадж. язык', 'Математика', 'Английский язык'];
    subjects.sort((a, b) => {
        const idxA = subjectOrder.indexOf(a);
        const idxB = subjectOrder.indexOf(b);
        if (idxA !== -1 && idxB !== -1) return idxA - idxB;
        if (idxA !== -1) return -1;
        if (idxB !== -1) return 1;
        return a.localeCompare(b);
    });

    const totalStats: SubjectStats[] = subjects.map(sub => {
      const subStudents = students.filter(s => s.subject === sub);
      
      // Fact: Active at the END of the selected period
      const fact = getActiveOnDate(students, end, sub);
      
      // Presale: Current Leads (Lead status usually doesn't have strict dates, so we take current snapshot)
      const presale = subStudents.filter(s => s.status === StudentStatus.Lead).length;
      
      // Joined: startDate is within range
      const joined = subStudents.filter(s => isBetween(s.startDate, start, end)).length;
      
      // Left: endDate is within range
      const left = subStudents.filter(s => isBetween(s.endDate, start, end)).length;
      
      return {
        subject: sub,
        plan: targets[sub] || 0, // Default 0 if not set
        fact,
        presale,
        joined,
        left,
        dynamics: joined - left
      };
    });

    return totalStats;
  };

  const currentStats = useMemo(() => {
    if (dateMode === 'daily') {
      return calculateStats(primaryDate, primaryDate);
    } else {
      return calculateStats(range1Start, range1End);
    }
  }, [students, targets, dateMode, primaryDate, range1Start, range1End]);

  // Comparison Stats (Yesterday or Period 2)
  const comparisonStats = useMemo(() => {
    if (dateMode === 'daily') {
        // "Yesterday" stats logic is slightly different: we just want the FACT count at end of yesterday
        // to compare against today's FACT.
        const subjects = currentStats.map(s => s.subject);
        const map: Record<string, number> = {};
        subjects.forEach(sub => {
            map[sub] = getActiveOnDate(students, compareDate, sub);
        });
        return map;
    } else {
        // Full calculation for Period 2
        const stats = calculateStats(range2Start, range2End);
        const map: Record<string, number> = {};
        stats.forEach(s => map[s.subject] = s.fact); // We mainly compare Fact
        return map;
    }
  }, [students, targets, dateMode, compareDate, range2Start, range2End, currentStats]);

  // Total Aggregation
  const totals = currentStats.reduce((acc, curr) => ({
    plan: acc.plan + curr.plan,
    fact: acc.fact + curr.fact,
    presale: acc.presale + curr.presale,
    joined: acc.joined + curr.joined,
    left: acc.left + curr.left,
    dynamics: acc.dynamics + curr.dynamics
  }), { plan: 0, fact: 0, presale: 0, joined: 0, left: 0, dynamics: 0 });

  const saveTargets = (newTargets: Record<string, number>) => {
      setTargets(newTargets);
      storage.set(StorageKeys.SUBJECT_TARGETS, newTargets);
      setIsTargetModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Controls */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-700 rounded-lg flex-shrink-0">
            <button 
                onClick={() => setMode('report')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${mode === 'report' ? 'bg-white dark:bg-slate-600 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
            >
                📋 Ежедневный отчет
            </button>
            <button 
                onClick={() => setMode('charts')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${mode === 'charts' ? 'bg-white dark:bg-slate-600 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
            >
                📊 Графики
            </button>
        </div>

        {mode === 'report' && (
            <div className="flex flex-col md:flex-row flex-wrap items-center gap-4 w-full md:w-auto">
                {/* Date Mode Toggle */}
                <div className="flex items-center border border-slate-200 dark:border-slate-600 rounded-lg overflow-hidden flex-shrink-0">
                    <button 
                        onClick={() => setDateMode('daily')}
                        className={`px-3 py-2 text-xs font-medium ${dateMode === 'daily' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                    >
                        1 День
                    </button>
                    <div className="w-px bg-slate-200 dark:bg-slate-600 h-full"></div>
                    <button 
                        onClick={() => setDateMode('period')}
                        className={`px-3 py-2 text-xs font-medium ${dateMode === 'period' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                    >
                        Сравнение периодов
                    </button>
                </div>

                {/* Date Pickers */}
                {dateMode === 'daily' ? (
                    <div className="flex items-center gap-2">
                        <input 
                            type="date" 
                            value={primaryDate}
                            onChange={(e) => setPrimaryDate(e.target.value)}
                            className="border border-slate-300 dark:border-slate-600 rounded-lg px-2 py-1.5 text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                        />
                        <span className="text-slate-400 text-xs">vs</span>
                        <input 
                            type="date" 
                            value={compareDate}
                            onChange={(e) => setCompareDate(e.target.value)}
                            disabled
                            title="Сравнение всегда со вчерашним днем (авто)"
                            className="border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-sm bg-slate-50 dark:bg-slate-800 text-slate-500 opacity-70 cursor-not-allowed"
                        />
                    </div>
                ) : (
                    <div className="flex flex-col sm:flex-row gap-4 items-center">
                        <DateRangePicker 
                            label="P1" 
                            startDate={range1Start} 
                            endDate={range1End} 
                            onChange={(start, end) => {
                                setRange1Start(start);
                                if (end) setRange1End(end);
                            }}
                        />
                        <DateRangePicker 
                            label="P2" 
                            startDate={range2Start} 
                            endDate={range2End} 
                            onChange={(start, end) => {
                                setRange2Start(start);
                                if (end) setRange2End(end);
                            }}
                            align="right"
                        />
                    </div>
                )}

                <button 
                    onClick={() => setIsTargetModalOpen(true)}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-slate-500 transition-colors ml-auto md:ml-0"
                    title="Настроить планы"
                >
                    <Settings size={20} />
                </button>
            </div>
        )}
      </div>

      {mode === 'report' ? (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            {/* Header Summary */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <Calendar size={20} className="text-blue-500" />
                        Отчет за {dateMode === 'daily' ? new Date(primaryDate).toLocaleDateString('ru-RU') : 'период'}
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Филиал Ватан (Душанбе)
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-right">
                        <span className="block text-xs text-slate-500 dark:text-slate-400 uppercase font-bold">Выполнение плана</span>
                        <span className={`text-2xl font-bold ${totals.fact >= totals.plan ? 'text-emerald-600 dark:text-emerald-400' : 'text-blue-600 dark:text-blue-400'}`}>
                            {totals.plan > 0 ? Math.round((totals.fact / totals.plan) * 100) : 0}%
                        </span>
                    </div>
                    <div className="h-10 w-px bg-slate-200 dark:bg-slate-700"></div>
                    <div className="text-right">
                        <span className="block text-xs text-slate-500 dark:text-slate-400 uppercase font-bold">Всего учеников</span>
                        <span className="text-2xl font-bold text-slate-800 dark:text-white">{totals.fact}</span>
                    </div>
                </div>
            </div>

            {/* Subject Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {currentStats.map((stat) => {
                    const percentage = stat.plan > 0 ? Math.round((stat.fact / stat.plan) * 100) : 0;
                    const prevFact = comparisonStats[stat.subject] || 0;
                    const factDiff = stat.fact - prevFact;

                    return (
                        <div key={stat.subject} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-md transition-shadow">
                            <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-start bg-slate-50/50 dark:bg-slate-800/50">
                                <div>
                                    <h4 className="font-bold text-slate-800 dark:text-white text-lg">🔷 {stat.subject}</h4>
                                    <div className="text-xs font-mono mt-1 text-slate-500 dark:text-slate-400 bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded inline-block">
                                        План: {stat.plan} / Факт: {stat.fact} / Лид: {stat.presale}
                                    </div>
                                </div>
                                <div className={`flex items-center justify-center w-12 h-12 rounded-full border-4 text-xs font-bold ${
                                    percentage >= 80 ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400' :
                                    percentage >= 50 ? 'border-blue-500 text-blue-600 dark:text-blue-400' :
                                    'border-red-500 text-red-600 dark:text-red-400'
                                }`}>
                                    {percentage}%
                                </div>
                            </div>
                            
                            <div className="p-4 space-y-3">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-2 rounded-lg">
                                        <span>Записались:</span>
                                        <span className="font-bold">+{stat.joined}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">
                                        <span>Ушли:</span>
                                        <span className="font-bold">-{stat.left}</span>
                                    </div>
                                </div>
                                
                                <div className="pt-2 border-t border-slate-100 dark:border-slate-700 flex justify-between text-sm">
                                    <span className="text-slate-500 dark:text-slate-400">Динамика (период):</span>
                                    <span className={`font-bold ${stat.dynamics > 0 ? 'text-emerald-500' : stat.dynamics < 0 ? 'text-red-500' : 'text-slate-400'}`}>
                                        {stat.dynamics > 0 ? '+' : ''}{stat.dynamics}
                                    </span>
                                </div>
                                {dateMode === 'daily' && (
                                    <div className="flex justify-between text-xs text-slate-400">
                                        <span>Сравнение (вчера):</span>
                                        <span className={factDiff > 0 ? 'text-emerald-500' : factDiff < 0 ? 'text-red-500' : ''}>
                                            {factDiff > 0 ? '+' : ''}{factDiff}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Total Summary Card */}
            <div className="bg-slate-800 dark:bg-slate-700 text-white rounded-xl shadow-lg p-6 border border-slate-700">
                <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                    <div>
                        <h3 className="text-2xl font-bold flex items-center gap-2">
                            <TrendingUp className="text-blue-400" />
                            ИТОГ: {totals.plan} / {totals.fact} / {totals.presale}
                        </h3>
                        <div className="mt-2 flex gap-4 text-sm text-slate-300">
                            <span>Общий план: <strong className="text-white">{totals.plan > 0 ? Math.round((totals.fact / totals.plan) * 100) : 0}%</strong></span>
                        </div>
                    </div>
                    <div className="flex gap-6 text-center">
                        <div>
                            <div className="text-emerald-400 text-xl font-bold">+{totals.joined}</div>
                            <div className="text-xs text-slate-400 uppercase">Записались</div>
                        </div>
                        <div>
                            <div className="text-rose-400 text-xl font-bold">-{totals.left}</div>
                            <div className="text-xs text-slate-400 uppercase">Ушли</div>
                        </div>
                        <div>
                            <div className={`text-xl font-bold ${totals.dynamics >= 0 ? 'text-blue-400' : 'text-rose-400'}`}>
                                {totals.dynamics > 0 ? '+' : ''}{totals.dynamics}
                            </div>
                            <div className="text-xs text-slate-400 uppercase">Динамика</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 transition-colors">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6">Динамика набора учеников</h3>
            <div className="h-80 w-full">
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
                    <Tooltip content={<CustomTooltip />} cursor={{fill: 'transparent'}} />
                    <Bar dataKey="students" fill="#4f46e5" radius={[6, 6, 0, 0]} barSize={50} />
                </BarChart>
                </ResponsiveContainer>
            </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 transition-colors">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6">Источники трафика</h3>
            <div className="h-80 flex items-center justify-center relative">
                <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                    data={sourceData}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={110}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                    >
                    {sourceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                    </Pie>
                    <Tooltip 
                        contentStyle={{ 
                            backgroundColor: '#1e293b', 
                            borderColor: '#334155', 
                            color: '#f8fafc',
                            borderRadius: '8px',
                            border: 'none',
                            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                        }}
                        itemStyle={{ color: '#e2e8f0' }}
                    />
                </PieChart>
                </ResponsiveContainer>
                {/* Center Text Overlay */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-3xl font-bold text-slate-800 dark:text-white">{sourceData.reduce((a, b) => a + b.value, 0)}</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">Лидов</span>
                </div>
            </div>
            <div className="flex flex-wrap justify-center gap-4 text-sm mt-4">
                {sourceData.map((entry, index) => (
                    <div key={index} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                        <span className="text-slate-600 dark:text-slate-300 font-medium">{entry.name}</span>
                    </div>
                ))}
            </div>
            </div>
        </div>
      )}

      {/* Target Setting Modal */}
      {isTargetModalOpen && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md animate-in zoom-in duration-200">
                  <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                      <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                          <Target className="text-blue-500" /> Настройка планов
                      </h3>
                      <button onClick={() => setIsTargetModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                          <Minus size={20} className="rotate-45" />
                      </button>
                  </div>
                  <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
                      <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Укажите плановое количество учеников для каждого предмета.</p>
                      {currentStats.map(s => (
                          <div key={s.subject} className="flex items-center justify-between">
                              <span className="font-medium text-slate-700 dark:text-slate-300">{s.subject}</span>
                              <input 
                                  type="number" 
                                  className="w-24 border border-slate-300 dark:border-slate-600 rounded-lg p-2 text-center text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                                  value={targets[s.subject] || ''}
                                  placeholder="0"
                                  onChange={(e) => setTargets({...targets, [s.subject]: Number(e.target.value)})}
                              />
                          </div>
                      ))}
                  </div>
                  <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex justify-end">
                      <button 
                          onClick={() => saveTargets(targets)}
                          className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
                      >
                          Сохранить
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};