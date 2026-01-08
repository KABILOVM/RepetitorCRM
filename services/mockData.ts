import { Student, Group, Transaction, Lesson, Teacher, Violation, CallTask } from '../types';
import { storage, StorageKeys } from './storage';

// Initialize with empty arrays to satisfy "remove fake data" requirement.
// Data will only populate if imported via SQL.

export const mockStudents: Student[] = storage.get<Student[]>(StorageKeys.STUDENTS, []);

export const mockGroups: Group[] = storage.get<Group[]>(StorageKeys.GROUPS, []);

export const mockTransactions: Transaction[] = storage.get<Transaction[]>(StorageKeys.TRANSACTIONS, []);

export const mockLessons: Lesson[] = storage.get<Lesson[]>(StorageKeys.LESSONS, []);

export const mockTeachers: Teacher[] = storage.get<Teacher[]>(StorageKeys.TEACHERS, []);

export const mockViolations: Violation[] = storage.get<Violation[]>(StorageKeys.VIOLATIONS, []);

export const mockCalls: CallTask[] = storage.get<CallTask[]>(StorageKeys.CALLS, []);
