import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';

interface DateRangePickerProps {
  startDate: string;
  endDate: string;
  onChange: (start: string, end: string) => void;
  label: string;
  align?: 'left' | 'right';
}

const months = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
const weekDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

export const DateRangePicker: React.FC<DateRangePickerProps> = ({ startDate, endDate, onChange, label, align = 'left' }) => {
  const [isOpen, setIsOpen] = useState(false);
  // View date tracks the left-side month
  const [viewDate, setViewDate] = useState(() => new Date(startDate || new Date()));
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen) {
        setViewDate(new Date(startDate || new Date()));
    }
  }, [isOpen, startDate]);

  const handleDateClick = (dateStr: string) => {
    if (!startDate || (startDate && endDate)) {
      // Start new range
      onChange(dateStr, '');
    } else {
      // Complete range
      if (dateStr < startDate) {
        onChange(dateStr, startDate);
      } else {
        onChange(startDate, dateStr);
      }
      // Optional: Auto close when range selected? 
      // setIsOpen(false); 
    }
  };

  const changeMonth = (offset: number) => {
    const newDate = new Date(viewDate);
    newDate.setMonth(newDate.getMonth() + offset);
    setViewDate(newDate);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '...';
    return new Date(dateStr).toLocaleDateString('ru-RU');
  };

  const renderMonth = (baseDate: Date) => {
    const year = baseDate.getFullYear();
    const month = baseDate.getMonth();
    
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayIndex = (new Date(year, month, 1).getDay() + 6) % 7; // Adjust for Mon start

    const days = [];
    // Empty cells
    for (let i = 0; i < firstDayIndex; i++) {
      days.push(<div key={`empty-${i}`} className="h-8 w-8" />);
    }

    // Days
    for (let d = 1; d <= daysInMonth; d++) {
      // Construct date string YYYY-MM-DD in local time effectively
      const dateObj = new Date(year, month, d);
      const dateStr = dateObj.toLocaleDateString('en-CA'); // YYYY-MM-DD format

      let isSelected = false;
      let isRange = false;
      let isStart = false;
      let isEnd = false;

      if (startDate && dateStr === startDate) { isSelected = true; isStart = true; }
      if (endDate && dateStr === endDate) { isSelected = true; isEnd = true; }
      if (startDate && endDate && dateStr > startDate && dateStr < endDate) isRange = true;

      days.push(
        <button
          key={d}
          onClick={() => handleDateClick(dateStr)}
          className={`
            h-8 w-8 text-xs font-medium rounded-full flex items-center justify-center transition-all
            ${isStart || isEnd 
              ? 'bg-blue-600 text-white z-10 relative' 
              : isRange 
                ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200 rounded-none' 
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'}
            ${isStart && endDate ? 'rounded-r-none' : ''}
            ${isEnd && startDate ? 'rounded-l-none' : ''}
          `}
        >
          {d}
        </button>
      );
    }

    return (
      <div className="w-64 p-2">
        <div className="text-center font-bold text-slate-800 dark:text-white mb-4 capitalize">
          {months[month]} {year}
        </div>
        <div className="grid grid-cols-7 gap-y-2 mb-2">
          {weekDays.map(d => (
            <div key={d} className="text-center text-xs text-slate-400 font-medium">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-y-1 justify-items-center">
          {days}
        </div>
      </div>
    );
  };

  const rightViewDate = new Date(viewDate);
  rightViewDate.setMonth(rightViewDate.getMonth() + 1);

  return (
    <div className="relative" ref={containerRef}>
      <div className="flex items-center gap-2">
        <span className="text-sm font-bold text-slate-500 dark:text-slate-400 whitespace-nowrap">{label}</span>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`
            flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-700 border rounded-lg shadow-sm transition-all
            ${isOpen ? 'border-blue-500 ring-2 ring-blue-100 dark:ring-blue-900/20' : 'border-slate-300 dark:border-slate-600 hover:border-slate-400'}
          `}
        >
          <CalendarIcon size={14} className="text-slate-500 dark:text-slate-400" />
          <span className="text-sm text-slate-700 dark:text-slate-200">
            {formatDate(startDate)} - {formatDate(endDate) || '...'}
          </span>
        </button>
      </div>

      {isOpen && (
        <div 
            className={`absolute top-full mt-2 z-50 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 p-4 animate-in fade-in zoom-in-95 duration-200 ${align === 'right' ? 'right-0' : 'left-0'}`}
        >
          <div className="flex items-start gap-4">
            <button 
              onClick={() => changeMonth(-1)}
              className="absolute left-4 top-6 p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-slate-500"
            >
              <ChevronLeft size={20} />
            </button>
            
            <div className="flex divide-x divide-slate-100 dark:divide-slate-700">
              {renderMonth(viewDate)}
              {renderMonth(rightViewDate)}
            </div>

            <button 
              onClick={() => changeMonth(1)}
              className="absolute right-4 top-6 p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-slate-500"
            >
              <ChevronRight size={20} />
            </button>
          </div>
          
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-2">
            <button 
              onClick={() => setIsOpen(false)}
              className="px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
            >
              Закрыть
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
