import { CompanyEmployee } from '../types';

export const maskPanNumber = (pan: string): string => {
  if (!pan) return 'XXXXX****X';
  const clean = pan.trim().toUpperCase();
  if (clean.length < 10) {
    return clean.replace(/.(?=.{2})/g, '*');
  }
  // Standard Indian PAN format: 5 letters + 4 digits + 1 letter -> ABCDE****F
  return `${clean.slice(0, 5)}****${clean.slice(9, 10)}`;
};

export const DEFAULT_COMPANY_EMPLOYEES: CompanyEmployee[] = [
  {
    id: 'emp-1042',
    employeeId: 'IL-EXEC-1042',
    name: 'Rahul Sharma',
    phone: '9876543210',
    email: 'rahul.sharma@indianlalaji.com',
    panNumber: 'ABCPS1244M',
    maskedPan: 'ABCPS****M',
    designation: 'Software Consultation Executive',
    department: 'Software Consultation & Lab Solutions',
    photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400',
    status: 'verified',
    badge: 'Verified Employee • IndianLalaji OS',
    joiningDate: '12 Jan 2024',
    bloodGroup: 'B+',
    emergencyContact: '+91 98765 00000',
    notes: 'Authorized executive for pathology software demonstrations, licensing, and client onboarding.',
    password: 'emp12345',
    role: 'team_member',
  },
  {
    id: 'emp-1098',
    employeeId: 'IL-EXEC-1098',
    name: 'Priya Sundaram',
    phone: '9823456781',
    email: 'priya.s@indianlalaji.com',
    panNumber: 'BXZPS9821K',
    maskedPan: 'BXZPS****K',
    designation: 'Software Consultation Executive',
    department: 'Software Consultation & Diagnostic Implementations',
    photoUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400',
    status: 'verified',
    badge: 'Verified Employee • IndianLalaji OS',
    joiningDate: '01 Mar 2024',
    bloodGroup: 'O+',
    emergencyContact: '+91 98234 00000',
    notes: 'Authorized enterprise consultant for multi-branch diagnostic labs and NABL compliance setups.',
    password: 'emp12345',
    role: 'team_member',
  },
  {
    id: 'emp-2026',
    employeeId: 'IL-EXEC-2026',
    name: 'Amit Verma',
    phone: '7087033009',
    email: 'amit.verma@indianlalaji.com',
    panNumber: 'CJLPA4512D',
    maskedPan: 'CJLPA****D',
    designation: 'Software Consultation Executive',
    department: 'Client Success & Enterprise Software Advisory',
    photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400',
    status: 'verified',
    badge: 'Verified Employee • IndianLalaji OS',
    joiningDate: '15 Aug 2023',
    bloodGroup: 'A+',
    emergencyContact: '+91 70870 33009',
    notes: 'Headquarter-linked Software Consultation Executive for North India regional deployment.',
    password: 'emp12345',
    role: 'team_member',
  },
  {
    id: 'emp-3015',
    employeeId: 'IL-EXEC-3015',
    name: 'Ananya Mehta',
    phone: '9123456780',
    email: 'ananya.m@indianlalaji.com',
    panNumber: 'DKRPA8923E',
    maskedPan: 'DKRPA****E',
    designation: 'Software Consultation Executive',
    department: 'Software Consultation & Customer Experience',
    photoUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=400',
    status: 'verified',
    badge: 'Verified Employee • IndianLalaji OS',
    joiningDate: '10 Nov 2024',
    bloodGroup: 'AB+',
    emergencyContact: '+91 91234 00000',
    notes: 'Senior consultant specializing in barcode station workflows and laboratory automation.',
    password: 'emp12345',
    role: 'team_member',
  },
];
