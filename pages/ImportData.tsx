import React, { useState, useRef } from 'react';
import { Database, FileCode, CheckCircle, RefreshCw, Trash2, Info, FileSpreadsheet, Upload, AlertCircle, X, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { storage, StorageKeys } from '../services/storage';
import { StudentStatus, PipelineStage, Student, Teacher, Group, Transaction } from '../types';
import * as XLSX from 'xlsx';

export const ImportData: React.FC = () => {
  const [dragActive, setDragActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importStats, setImportStats] = useState<Record<string, number> | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const addLog = (msg: string) => setLogs(prev => [...prev, msg]);

  // --- Logic to map Sheet Names to Database Keys ---
  const getInternalTableName = (sheetName: string): string | null => {
      const lower = sheetName.toLowerCase().trim();
      
      // Assume the main sheet usually contains student data if no specific name match
      if (['students', 'pupils', 'users', 'children', 'student', 'ученики', 'студенты', 'лиды', 'лист1', 'sheet1'].some(k => lower.includes(k))) return 'students';
      if (['groups', 'classes', 'subjects', 'courses', 'group', 'группы', 'классы'].some(k => lower.includes(k))) return 'groups';
      if (['transactions', 'payments', 'finance', 'invoices', 'payment', 'оплаты', 'транзакции', 'финансы'].some(k => lower.includes(k))) return 'transactions';
      if (['teachers', 'instructors', 'staff', 'employees', 'teacher', 'преподаватели', 'учителя'].some(k => lower.includes(k))) return 'teachers';
      
      return 'students'; // Default fallback for single-sheet files
  };

  // --- Logic to map Column Headers to Object Properties ---
  const mapKey = (key: string): string => {
    // Clean key: remove extra spaces, lower case, remove punctuation commonly found in headers
    const k = key.toLowerCase().trim().replace(/['"`\(\)\.\r\n]/g, '').replace(/\s+/g, '');
    
    // Exact mapping based on user request
    if (k.includes('фиородителя')) return 'parentName';
    if (k.includes('номерродителя')) return 'parentPhone';
    if (k.includes('почтародителя') || k.includes('email')) return 'parentEmail';
    if (k.includes('фио')) return 'fullName';
    if (k.includes('номер') || k.includes('телефон')) return 'phone';
    
    // Academic
    if (k.includes('школа')) return 'school';
    if (k.includes('класс')) return 'grade';
    if (k.includes('годрождения')) return 'birthYear';
    if (k.includes('предмет')) return 'subject';
    if (k.includes('язык')) return 'language';
    if (k.includes('цель')) return 'studyGoal';
    if (k.includes('аккаунт')) return 'platformAccount';
    
    // Admin / Status
    if (k.includes('статус')) return 'status';
    if (k.includes('договор')) return 'contract';
    if (k.includes('откуда')) return 'source';
    if (k.includes('примечание')) return 'note';
    if (k.includes('датаначала')) return 'startDate';
    if (k.includes('датаухода')) return 'endDate';
    if (k.includes('причина')) return 'leaveReason';
    if (k.includes('обзвон')) return 'presaleStatus';
    
    // Finance / Discount
    if (k.includes('процентскидки') || k.includes('скидка')) return 'discountPercent';
    if (k.includes('объяснение')) return 'discountReason';
    if (k.includes('дальто')) return 'isColorBlind';
    
    return k; 
  };

  const cleanPhone = (phone: any) => {
      if (!phone) return '';
      return String(phone).replace(/[^0-9+]/g, '');
  };

  const saveDataToStorage = (
    newStudents: any[],
    newGroups: any[],
    newTransactions: any[],
    newTeachers: any[]
  ) => {
    // 1. Students Processing
    if (newStudents.length > 0) {
        const current = storage.get(StorageKeys.STUDENTS, []);
        const processed = newStudents.map((s, idx) => {
            // Determine status based on string
            let status = StudentStatus.Lead;
            const statusStr = String(s.status || '').toLowerCase();
            if (statusStr.includes('актив') || statusStr.includes('учится')) status = StudentStatus.Active;
            if (statusStr.includes('пауз')) status = StudentStatus.Paused;
            if (statusStr.includes('архив') || statusStr.includes('ушел') || statusStr.includes('отказ')) status = StudentStatus.Archived;

            return {
                id: Date.now() + idx,
                fullName: s.fullName || 'Без имени',
                phone: cleanPhone(s.phone),
                
                // New Fields
                parentName: s.parentName || '',
                parentPhone: cleanPhone(s.parentPhone),
                parentEmail: s.parentEmail || '',
                school: s.school ? String(s.school) : undefined,
                grade: s.grade ? String(s.grade) : undefined,
                birthYear: s.birthYear ? String(s.birthYear) : undefined,
                subject: s.subject || '',
                language: s.language || '',
                studyGoal: s.studyGoal || '',
                platformAccount: s.platformAccount || '',
                
                contract: s.contract ? String(s.contract).toLowerCase().includes('да') || String(s.contract).includes('+') : false,
                startDate: s.startDate,
                endDate: s.endDate,
                leaveReason: s.leaveReason,
                
                discountPercent: s.discountPercent ? parseFloat(s.discountPercent) : 0,
                discountReason: s.discountReason,
                note: s.note,
                presaleStatus: s.presaleStatus,
                isColorBlind: s.isColorBlind ? String(s.isColorBlind).toLowerCase().includes('да') : false,

                status: status,
                pipelineStage: PipelineStage.New, // Default
                balance: 0, // Default 0 as balance isn't explicitly in the provided column list
                monthlyFee: 0,
                consecutiveAbsences: 0,
                source: s.source || 'Импорт'
            };
        });
        storage.set(StorageKeys.STUDENTS, [...current, ...processed]);
    }

    // 2. Groups (Standard)
    if (newGroups.length > 0) {
        const current = storage.get(StorageKeys.GROUPS, []);
        const processed = newGroups.map((g, idx) => ({
            id: Date.now() + idx + 1000,
            name: g.name || `Группа ${idx + 1}`,
            subject: g.subject || 'Общий',
            teacher: g.teacher || 'Не назначен',
            schedule: g.schedule || 'Пн/Ср 10:00',
            studentsCount: Number(g.studentsCount) || 0,
            maxStudents: Number(g.maxStudents) || 10
        }));
        storage.set(StorageKeys.GROUPS, [...current, ...processed]);
    }

    setImportStats({
        students: newStudents.length,
        groups: newGroups.length,
        transactions: newTransactions.length,
        teachers: newTeachers.length
    });
    
    setIsProcessing(false);
  };

  const processFile = async (file: File) => {
    setIsProcessing(true);
    setLogs([]);
    setImportStats(null);
    addLog(`Начало обработки файла: ${file.name}`);

    const reader = new FileReader();

    reader.onload = (e) => {
        try {
            const data = e.target?.result;
            const workbook = XLSX.read(data, { type: 'binary' });
            
            const collections: Record<string, any[]> = {
                students: [], groups: [], transactions: [], teachers: []
            };

            workbook.SheetNames.forEach(sheetName => {
                const tableName = getInternalTableName(sheetName);
                if (tableName) {
                    addLog(`Лист "${sheetName}" распознан как таблица "${tableName}"`);
                    
                    const rawData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: "" });
                    
                    if (rawData.length > 0) {
                        // Normalize keys
                        const mappedData = rawData.map((row: any) => {
                            const newRow: any = {};
                            Object.keys(row).forEach(key => {
                                newRow[mapKey(key)] = row[key];
                            });
                            return newRow;
                        });
                        collections[tableName].push(...mappedData);
                        addLog(`  -> Найдено ${mappedData.length} записей`);
                    }
                }
            });

            saveDataToStorage(
                collections.students,
                collections.groups,
                collections.transactions,
                collections.teachers
            );
            
            addLog('Импорт успешно завершен!');

        } catch (error) {
            console.error(error);
            addLog(`Ошибка при чтении файла: ${(error as Error).message}`);
            setIsProcessing(false);
        }
    };

    reader.readAsBinaryString(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleClearData = () => {
    if (confirm('Вы уверены? Все данные будут удалены безвозвратно.')) {
        storage.clear();
        addLog('База данных полностью очищена.');
        setImportStats(null);
        window.location.reload();
    }
  };

  // --- Demo Data Generator ---
  const handleLoadDemo = () => {
      setIsProcessing(true);
      addLog('Генерация расширенных тестовых данных...');
      
      const demoTeachers: Teacher[] = [
          { id: 101, fullName: 'Васильева Елена Петровна', subject: 'Математика', phone: '+992 900 00 00 01', email: 'elena@school.tj' },
          { id: 102, fullName: 'Собиров Далер', subject: 'Физика', phone: '+992 900 00 00 02', email: 'daler@school.tj' },
          { id: 103, fullName: 'Джонс Майкл', subject: 'Английский язык', phone: '+992 900 00 00 03', email: 'mike@school.tj' },
          { id: 104, fullName: 'Каримова Зарина', subject: 'Химия', phone: '+992 900 00 00 04', email: 'zarina@school.tj' },
          { id: 105, fullName: 'Ахмедова Аниса', subject: 'Биология', phone: '+992 900 00 00 05', email: 'anisa@school.tj' },
          { id: 106, fullName: 'Рахимов Рустам', subject: 'Тадж. язык', phone: '+992 900 00 00 06', email: 'rustam@school.tj' }
      ];

      const demoGroups: Group[] = [
          { id: 1, name: 'Мат-10А', subject: 'Математика', teacher: 'Васильева Е.П.', schedule: 'Пн/Ср/Пт 14:00', studentsCount: 12, maxStudents: 15 },
          { id: 2, name: 'Eng-Beginner', subject: 'Английский язык', teacher: 'Джонс М.', schedule: 'Вт/Чт 16:00', studentsCount: 8, maxStudents: 12 },
          { id: 3, name: 'Физ-ЕГЭ', subject: 'Физика', teacher: 'Собиров Д.', schedule: 'Сб 10:00', studentsCount: 5, maxStudents: 8 },
          { id: 4, name: 'Хим-Олимп', subject: 'Химия', teacher: 'Каримова З.', schedule: 'Пн/Чт 15:30', studentsCount: 6, maxStudents: 10 },
          { id: 5, name: 'Био-Мед', subject: 'Биология', teacher: 'Ахмедова А.', schedule: 'Вт/Пт 14:00', studentsCount: 7, maxStudents: 10 },
          { id: 6, name: 'Тадж-Грамматика', subject: 'Тадж. язык', teacher: 'Рахимов Р.', schedule: 'Ср/Сб 13:00', studentsCount: 4, maxStudents: 10 }
      ];

      // Helper to create students
      const createStudent = (id: number, name: string, subject: string, status: StudentStatus, start: string, end?: string): Student => ({
        id,
        fullName: name,
        phone: `+992 900 00 00 ${id < 10 ? '0' + id : id}`,
        source: id % 2 === 0 ? 'Instagram' : 'Google',
        status,
        pipelineStage: status === StudentStatus.Lead ? PipelineStage.New : PipelineStage.Payment,
        parentName: `Родитель ${name.split(' ')[0]}`,
        parentPhone: `+992 918 00 00 ${id < 10 ? '0' + id : id}`,
        subject,
        balance: status === StudentStatus.Active ? 500 : 0,
        monthlyFee: 500,
        contract: status === StudentStatus.Active,
        startDate: start,
        endDate: end,
        consecutiveAbsences: 0
      });

      const demoStudents: Student[] = [
        // Math (Active: 5, Left: 1, Lead: 2)
        createStudent(1, 'Алиев Сардор', 'Математика', StudentStatus.Active, '2025-12-01'),
        createStudent(2, 'Валиев Тимур', 'Математика', StudentStatus.Active, '2025-12-15'),
        createStudent(3, 'Ганиева Зарина', 'Математика', StudentStatus.Active, '2026-01-05'),
        createStudent(4, 'Давронов Акмал', 'Математика', StudentStatus.Active, '2026-01-06'),
        createStudent(5, 'Еров Парвиз', 'Математика', StudentStatus.Active, '2025-11-20'),
        createStudent(6, 'Жукова Елена', 'Математика', StudentStatus.Archived, '2025-11-01', '2025-12-25'),
        createStudent(7, 'Зоиров Карим', 'Математика', StudentStatus.Lead, '2026-01-07'),
        
        // English (Active: 6, Left: 0, Lead: 3)
        createStudent(10, 'Иванов Сергей', 'Английский язык', StudentStatus.Active, '2025-10-10'),
        createStudent(11, 'Каримова Нигина', 'Английский язык', StudentStatus.Active, '2025-11-05'),
        createStudent(12, 'Латипов Рустам', 'Английский язык', StudentStatus.Active, '2025-12-01'),
        createStudent(13, 'Муродов Фирдавс', 'Английский язык', StudentStatus.Active, '2026-01-03'),
        createStudent(14, 'Нозирова Мадина', 'Английский язык', StudentStatus.Active, '2026-01-04'),
        createStudent(15, 'Олимов Джамшед', 'Английский язык', StudentStatus.Active, '2025-12-20'),
        createStudent(16, 'Пиров Умед', 'Английский язык', StudentStatus.Lead, '2026-01-05'),
        createStudent(17, 'Расулова Сабина', 'Английский язык', StudentStatus.Lead, '2026-01-06'),
        createStudent(18, 'Сайфиддинов Амир', 'Английский язык', StudentStatus.Lead, '2025-12-28'),

        // Physics (Active: 3, Left: 1)
        createStudent(20, 'Саидов Алишер', 'Физика', StudentStatus.Active, '2025-11-15'),
        createStudent(21, 'Тошматов Бахром', 'Физика', StudentStatus.Active, '2025-12-10'),
        createStudent(22, 'Умаров Дилшод', 'Физика', StudentStatus.Active, '2026-01-05'),
        createStudent(23, 'Файзов Икром', 'Физика', StudentStatus.Archived, '2025-10-01', '2025-11-30'),

        // Chemistry (Active: 4)
        createStudent(30, 'Халилова Гулноза', 'Химия', StudentStatus.Active, '2025-11-01'),
        createStudent(31, 'Цой Виктор', 'Химия', StudentStatus.Active, '2025-12-05'),
        createStudent(32, 'Чкалов Валерий', 'Химия', StudentStatus.Active, '2026-01-02'),
        createStudent(33, 'Шамсов Азиз', 'Химия', StudentStatus.Active, '2026-01-06'),

        // Biology (Active: 4, Lead: 1)
        createStudent(40, 'Эргашев Комрон', 'Биология', StudentStatus.Active, '2025-11-25'),
        createStudent(41, 'Юсупова Малика', 'Биология', StudentStatus.Active, '2025-12-15'),
        createStudent(42, 'Якубов Фарид', 'Биология', StudentStatus.Active, '2026-01-04'),
        createStudent(43, 'Абдуллоева Ситора', 'Биология', StudentStatus.Active, '2026-01-05'),
        createStudent(44, 'Бобоев Султон', 'Биология', StudentStatus.Lead, '2026-01-07'),

        // Tajik (Active: 3)
        createStudent(50, 'Вахобов Ильхом', 'Тадж. язык', StudentStatus.Active, '2025-12-01'),
        createStudent(51, 'Гафуров Бободжон', 'Тадж. язык', StudentStatus.Active, '2025-12-20'),
        createStudent(52, 'Джалилов Комрон', 'Тадж. язык', StudentStatus.Active, '2026-01-03')
      ];

      const demoTransactions: Transaction[] = [
          { id: 1, studentId: 1, studentName: 'Алиев Сардор', amount: 500, date: '2025-12-05', type: 'Payment', purpose: 'Оплата за Декабрь' },
          { id: 2, studentId: 10, studentName: 'Иванов Сергей', amount: 600, date: '2025-11-12', type: 'Payment', purpose: 'Оплата за Ноябрь' },
          { id: 3, studentId: 20, studentName: 'Саидов Алишер', amount: 450, date: '2025-12-20', type: 'Payment', purpose: 'Частичная оплата' }
      ];

      // Set Targets
      const targets = {
        'Химия': 20,
        'Биология': 20,
        'Физика': 15,
        'Тадж. язык': 10,
        'Математика': 30,
        'Английский язык': 40
      };
      storage.set(StorageKeys.SUBJECT_TARGETS, targets);
      addLog('Планы по предметам установлены.');

      storage.set(StorageKeys.TEACHERS, demoTeachers);
      storage.set(StorageKeys.GROUPS, demoGroups);
      storage.set(StorageKeys.STUDENTS, demoStudents);
      storage.set(StorageKeys.TRANSACTIONS, demoTransactions);

      setImportStats({
          students: demoStudents.length,
          teachers: demoTeachers.length,
          groups: demoGroups.length,
          transactions: demoTransactions.length
      });
      addLog('Демо-данные успешно загружены! Перейдите в Аналитику для проверки.');
      setIsProcessing(false);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Импорт данных</h2>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Поддержка формата вашего журнала учеников.</p>
        </div>
        <div className="flex gap-2">
             <button 
                onClick={handleLoadDemo}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-lg transition-colors border border-blue-200 dark:border-blue-800"
            >
                <Users size={16} />
                Тестовые данные
            </button>
            <button 
                onClick={handleClearData}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-lg transition-colors border border-red-200 dark:border-red-800"
            >
                <Trash2 size={16} />
                Очистить базу
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Drop Zone */}
        <div className="md:col-span-2 space-y-4">
            <div 
                className={`relative border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center text-center transition-all cursor-pointer bg-white dark:bg-slate-800
                ${dragActive ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30' : 'border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
            >
                <input 
                    ref={fileInputRef}
                    type="file" 
                    className="hidden" 
                    accept=".xlsx, .xls, .csv" 
                    onChange={handleChange}
                />
                
                {isProcessing ? (
                    <div className="flex flex-col items-center animate-pulse">
                        <RefreshCw size={48} className="text-blue-500 animate-spin mb-4" />
                        <p className="text-lg font-medium text-slate-700 dark:text-slate-300">Обработка данных...</p>
                    </div>
                ) : (
                    <>
                        <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mb-4 shadow-sm">
                            <Upload size={32} />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-2">Загрузить Excel</h3>
                        <p className="text-slate-500 dark:text-slate-400 text-sm max-w-xs">
                            Перетащите файл сюда. Система автоматически найдет столбцы ФИО, Школа, Родители и др.
                        </p>
                    </>
                )}
            </div>

            {/* Logs Area */}
            <div className="bg-slate-900 text-slate-300 p-4 rounded-xl font-mono text-xs h-48 overflow-y-auto custom-scrollbar shadow-inner">
                <div className="flex items-center gap-2 text-slate-400 border-b border-slate-700 pb-2 mb-2">
                    <FileCode size={14} />
                    <span>Системный журнал</span>
                </div>
                {logs.length === 0 && <span className="opacity-50">Ожидание файла...</span>}
                {logs.map((log, i) => (
                    <div key={i} className="mb-1">
                        <span className="text-slate-500 mr-2">[{new Date().toLocaleTimeString()}]</span>
                        {log}
                    </div>
                ))}
            </div>
        </div>

        {/* Info Panel */}
        <div className="space-y-6">
            {importStats ? (
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-emerald-200 dark:border-emerald-800">
                    <div className="flex items-center gap-2 mb-4 text-emerald-700 dark:text-emerald-400">
                        <CheckCircle size={24} />
                        <h3 className="font-bold text-lg">Готово</h3>
                    </div>
                    <div className="text-slate-600 dark:text-slate-300 text-sm mb-4">
                        Данные успешно импортированы.
                    </div>
                    <button 
                        onClick={() => navigate('/students')}
                        className="w-full bg-emerald-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
                    >
                        Открыть список
                    </button>
                </div>
            ) : (
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                     <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                        <Info size={18} className="text-blue-500"/>
                        Поддерживаемые поля
                     </h3>
                     <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-2 list-disc list-inside">
                        <li>ФИО, Телефон, Статус</li>
                        <li>ФИО Родителя, Телефон родителя</li>
                        <li>Школа, Класс, Год рождения</li>
                        <li>Предмет, Язык, Цель</li>
                        <li>Скидки, Договор, Примечание</li>
                        <li>Аккаунт платформы</li>
                     </ul>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};