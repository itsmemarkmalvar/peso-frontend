export type MockUser = {
  id: number;
  username: string;
  email: string;
  role: 'admin' | 'intern' | 'supervisor' | 'coordinator';
  status: 'active' | 'inactive';
};

export type MockIntern = {
  id: number;
  user_id: number;
  student_id: string;
  full_name: string;
  course: string;
  company_name: string;
};

type MockDatabaseSchema = {
  users: MockUser[];
  interns: MockIntern[];
};

const INITIAL_DATA: MockDatabaseSchema = {
  users: [
    { id: 1, username: 'admin', email: 'admin@peso.com', role: 'admin', status: 'active' },
    { id: 2, username: 'intern1', email: 'intern1@peso.com', role: 'intern', status: 'active' },
    { id: 3, username: 'intern2', email: 'intern2@peso.com', role: 'intern', status: 'active' },
    { id: 4, username: 'intern3', email: 'intern3@peso.com', role: 'intern', status: 'active' },
    { id: 5, username: 'intern4', email: 'intern4@peso.com', role: 'intern', status: 'active' },
    { id: 6, username: 'intern5', email: 'intern5@peso.com', role: 'intern', status: 'active' },
  ],
  interns: [
    { id: 1, user_id: 2, student_id: 'S001', full_name: 'John Doe', course: 'BSCS', company_name: 'Tech Corp' },
    { id: 2, user_id: 3, student_id: 'S002', full_name: 'Jane Smith', course: 'BSIT', company_name: 'Innovate LLC' },
    { id: 3, user_id: 4, student_id: 'S003', full_name: 'Alice Johnson', course: 'BSCS', company_name: 'Web Solutions' },
    { id: 4, user_id: 5, student_id: 'S004', full_name: 'Bob Williams', course: 'BSIS', company_name: 'Data Inc' },
    { id: 5, user_id: 6, student_id: 'S005', full_name: 'Charlie Brown', course: 'BSIT', company_name: 'Network Systems' },
  ],
};

const DB_KEY = 'peso_mock_db';

export class MockDatabase {
  private data: MockDatabaseSchema;

  constructor() {
    this.data = this.loadFromStorage();
  }

  private loadFromStorage(): MockDatabaseSchema {
    if (typeof window === 'undefined') return INITIAL_DATA;
    
    const stored = localStorage.getItem(DB_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.error('Failed to parse mock DB', e);
      }
    }
    
    // Initialize if empty
    localStorage.setItem(DB_KEY, JSON.stringify(INITIAL_DATA));
    return INITIAL_DATA;
  }

  private saveToStorage() {
    if (typeof window !== 'undefined') {
      localStorage.setItem(DB_KEY, JSON.stringify(this.data));
    }
  }

  getUsers() {
    return this.data.users;
  }

  getInterns() {
    return this.data.interns;
  }

  // Add more methods as needed (insert, update, delete)
}

export const mockDb = new MockDatabase();
