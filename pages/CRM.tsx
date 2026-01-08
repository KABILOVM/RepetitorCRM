import React from 'react';
import { storage, StorageKeys } from '../services/storage';
import { PipelineStage, StudentStatus, Student } from '../types';
import { Phone, CalendarCheck, FileText } from 'lucide-react';

const KanbanColumn = ({ title, stage, color, students }: { title: string; stage: PipelineStage; color: string; students: Student[] }) => (
  <div className="flex-1 min-w-[300px] bg-slate-100 dark:bg-slate-800/50 rounded-xl p-4 flex flex-col gap-3">
    <div className={`flex items-center justify-between pb-2 border-b-2 ${color}`}>
      <h3 className="font-semibold text-slate-700 dark:text-slate-200">{title}</h3>
      <span className="bg-white dark:bg-slate-700 px-2 py-0.5 rounded-full text-xs font-bold text-slate-500 dark:text-slate-300 shadow-sm">
        {students.length}
      </span>
    </div>
    <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar">
      {students.map(student => (
        <div key={student.id} className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow cursor-move group">
          <div className="flex justify-between items-start mb-2">
            <span className="font-medium text-slate-800 dark:text-slate-100">{student.fullName}</span>
            <span className="text-[10px] uppercase bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded">
              {student.source}
            </span>
          </div>
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <Phone size={12} />
              {student.phone}
            </div>
            {stage === PipelineStage.Call && (
              <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 px-2 py-1 rounded">
                <Phone size={12} />
                Позвонить сегодня
              </div>
            )}
            {stage === PipelineStage.Trial && (
              <div className="flex items-center gap-2 text-xs text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30 px-2 py-1 rounded">
                <CalendarCheck size={12} />
                Пробный урок
              </div>
            )}
            {stage === PipelineStage.Contract && (
              <div className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded">
                <FileText size={12} />
                Договор отправлен
              </div>
            )}
          </div>
          <div className="mt-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button className="flex-1 text-xs bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 py-1.5 rounded text-slate-600 dark:text-slate-300">
              Профиль
            </button>
            <button className="flex-1 text-xs bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 py-1.5 rounded text-blue-600 dark:text-blue-400">
              Двигать
            </button>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export const CRM: React.FC = () => {
  const students = storage.get<Student[]>(StorageKeys.STUDENTS, []);
  
  // Filter only leads or those in pipeline
  const pipelineStudents = students.filter(s => s.status === StudentStatus.Lead || s.pipelineStage !== PipelineStage.Payment);

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Воронка продаж</h2>
        <div className="flex gap-2">
            <button className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700">
                Статистика
            </button>
            <button className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700">
                + Заявка
            </button>
        </div>
      </div>
      
      <div className="flex-1 flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
        <KanbanColumn 
          title="Новые заявки" 
          stage={PipelineStage.New} 
          color="border-slate-400 dark:border-slate-500" 
          students={pipelineStudents.filter(s => s.pipelineStage === PipelineStage.New)} 
        />
        <KanbanColumn 
          title="На обзвон" 
          stage={PipelineStage.Call} 
          color="border-amber-400 dark:border-amber-500" 
          students={pipelineStudents.filter(s => s.pipelineStage === PipelineStage.Call)} 
        />
        <KanbanColumn 
          title="Пробный урок" 
          stage={PipelineStage.Trial} 
          color="border-purple-400 dark:border-purple-500" 
          students={pipelineStudents.filter(s => s.pipelineStage === PipelineStage.Trial)} 
        />
        <KanbanColumn 
          title="Подписание договора" 
          stage={PipelineStage.Contract} 
          color="border-blue-400 dark:border-blue-500" 
          students={pipelineStudents.filter(s => s.pipelineStage === PipelineStage.Contract)} 
        />
      </div>
    </div>
  );
};