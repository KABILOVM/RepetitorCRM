
export enum UserRole {
  SuperAdmin = 'Супер-админ',
  Admin = 'Администратор',
  Teacher = 'Преподаватель',
  Student = 'Ученик'
}

export enum StudentStatus {
  Lead = 'Лид',
  Active = 'Активный',
  Paused = 'На паузе',
  Archived = 'Архив'
}

export enum PipelineStage {
  New = 'Новая заявка',
  Call = 'Звонок',
  Trial = 'Пробный урок',
  Contract = 'Договор',
  Payment = 'Оплата'
}

export interface Student {
  id: number;
  // Основное
  fullName: string;
  phone: string;
  source: string;
  status: StudentStatus;
  pipelineStage: PipelineStage;
  
  // Родители
  parentName?: string;
  parentPhone: string;
  parentEmail?: string;
  
  // Учеба
  school?: string;
  grade?: string; // Класс
  birthYear?: string;
  subject?: string; // Предмет
  language?: string; // Язык предмета
  studyGoal?: string; // Цель изучения
  platformAccount?: string; // Аккаунт repetitor.mobi
  
  // Административное
  contract?: boolean; // Договор
  startDate?: string;
  endDate?: string;
  leaveReason?: string; // Причина ухода
  
  // Финансы и скидки
  balance: number;
  monthlyFee: number;
  discountPercent?: number;
  discountReason?: string;
  
  // Дополнительно
  presaleStatus?: string; // Статус обзвона предзаписи
  note?: string; // Примечание
  isColorBlind?: boolean; // Справка о дальтонизме
  
  // Технические поля
  lastAttendance?: string;
  consecutiveAbsences: number;
}

export interface Group {
  id: number;
  name: string;
  subject: string;
  teacher: string;
  schedule: string;
  studentsCount: number;
  maxStudents: number;
}

export interface Transaction {
  id: number;
  studentId: number;
  studentName: string;
  amount: number;
  date: string;
  type: 'Payment' | 'Refund';
  purpose: string;
}

export interface Lesson {
  id: number;
  groupId: number;
  groupName: string;
  date: string;
  topic: string;
  completed: boolean;
}

export interface Teacher {
  id: number;
  fullName: string;
  subject: string;
  phone: string;
  email: string;
}

export interface Violation {
  id: number;
  studentId: number;
  studentName: string;
  date: string;
  type: 'Опоздание' | 'Поведение' | 'ДЗ';
  comment: string;
}

export interface CallTask {
  id: number;
  studentId: number;
  studentName: string;
  parentPhone: string;
  reason: string;
  status: 'Ожидает' | 'Выполнено';
  date: string;
}

export interface ExamResult {
  id: number;
  studentId: number;
  studentName: string;
  subject: string;
  date: string;
  score: number;
  maxScore: number;
  feedback?: string;
}