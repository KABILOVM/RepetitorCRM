import { Student, Group, Transaction, Lesson, Teacher, Violation, CallTask } from '../types';

const STORAGE_PREFIX = 'educrm_';

export const StorageKeys = {
  STUDENTS: `${STORAGE_PREFIX}students`,
  GROUPS: `${STORAGE_PREFIX}groups`,
  TRANSACTIONS: `${STORAGE_PREFIX}transactions`,
  LESSONS: `${STORAGE_PREFIX}lessons`,
  TEACHERS: `${STORAGE_PREFIX}teachers`,
  VIOLATIONS: `${STORAGE_PREFIX}violations`,
  CALLS: `${STORAGE_PREFIX}calls`,
  // New keys for your DB structure
  ENROLLMENTS: `${STORAGE_PREFIX}enrollments`,
  EXAM_RESULTS: `${STORAGE_PREFIX}exam_results`,
  ATTENDANCE: `${STORAGE_PREFIX}attendance`,
  SUBJECT_TARGETS: `${STORAGE_PREFIX}subject_targets`, // Added for Analytics Report
};

export const storage = {
  get: <T>(key: string, defaultValue: T): T => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (e) {
      console.error(`Error reading ${key} from storage`, e);
      return defaultValue;
    }
  },

  set: (key: string, value: any): void => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error(`Error saving ${key} to storage`, e);
    }
  },

  clear: () => {
    Object.values(StorageKeys).forEach(key => localStorage.removeItem(key));
  }
};