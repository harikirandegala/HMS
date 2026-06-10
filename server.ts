import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { createClient } from '@supabase/supabase-js';

let _filename = '';
let _dirname = '';
try {
  _filename = __filename;
  _dirname = __dirname;
} catch (e) {
  _filename = fileURLToPath(import.meta.url);
  _dirname = path.dirname(_filename);
}

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Middleware to reload database for any incoming API request to avoid serverless/multiprocess out-of-sync states
app.use(async (req, res, next) => {
  if (req.path.startsWith('/api/')) {
    await loadDatabase();
  }
  next();
});

// Initialize Supabase if DATABASE_TYPE is configured (with robust URL check and fallbacks)
const rawSupabaseUrl = process.env.SUPABASE_URL || 'zaiqdetznfouiqztkser.supabase.co';
const supabaseUrl = rawSupabaseUrl ? (rawSupabaseUrl.startsWith('http') ? rawSupabaseUrl : `https://${rawSupabaseUrl}`) : '';
const supabaseKey = process.env.SUPABASE_KEY || 'sb_publishable_Hq9my4inLvIBqM2om2qxtQ_u7pDrifz';
const databaseType = process.env.DATABASE_TYPE || 'Supabase';
const supabase = (databaseType === 'Supabase' && supabaseUrl && supabaseKey)
  ? createClient(supabaseUrl, supabaseKey)
  : null;

// Persistent JSON database filepath
const DB_FILE = path.join(process.cwd(), 'server_db.json');

// Types corresponding to our local schema
interface AuditLog {
  timestamp: string;
  user: string;
  action: string;
  details: string;
}

interface InDbUser {
  id: string;
  email: string;
  passwordHash: string; // Plaintext for demo credentials ease
  role: 'admin' | 'doctor' | 'patient';
  fullName: string;
  avatarUrl?: string;
  createdAt: string;
}

interface DbSchema {
  users: InDbUser[];
  patients: {
    id: string;
    fullName: string;
    email: string;
    dob: string;
    gender: string;
    insuranceNo: string;
    medicalHistorySummary?: string;
    age?: number;
    occupation?: string;
    address?: string;
  }[];
  doctors: {
    id: string;
    fullName: string;
    email: string;
    specialization: string;
    departmentName: string;
    schedule: { days: string[]; hours: string };
  }[];
  appointments: {
    id: string;
    patientId: string;
    patientName: string;
    doctorId: string;
    doctorName: string;
    startTime: string;
    status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
    reason: string;
    createdAt: string;
  }[];
  medicalRecords: {
    id: string;
    patientId: string;
    doctorName: string;
    date: string;
    diagnosis: string;
    notes: string;
    prescriptions: string[];
    vitals?: {
      bloodPressure: string;
      heartRate: string;
      temperature: string;
      weight?: string;
    };
  }[];
  invoices: {
    id: string;
    patientId: string;
    patientName: string;
    description: string;
    amount: number;
    status: 'paid' | 'unpaid';
    createdAt: string;
    paidAt?: string;
  }[];
  auditLogs: AuditLog[];
}

// Initial seed data if DB_FILE doesn't exist
// Initial seed data if DB_FILE doesn't exist
const initialSeed: DbSchema = {
  users: [
    {
      id: 'u-admin',
      email: 'admin@hospital.com',
      passwordHash: 'Admin123',
      role: 'admin',
      fullName: 'K. Suhasini (Directress)',
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200',
      createdAt: new Date().toISOString()
    },
    {
      id: 'u-doctor',
      email: 'doctor@hospital.com',
      passwordHash: 'Doctor123',
      role: 'doctor',
      fullName: 'Dr. Srinivas Rao',
      avatarUrl: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=200',
      createdAt: new Date().toISOString()
    },
    {
      id: 'u-doctor-2',
      email: 'sridevi@hospital.com',
      passwordHash: 'Doctor123',
      role: 'doctor',
      fullName: 'Dr. P. Sridevi',
      avatarUrl: 'https://images.unsplash.com/photo-1594824813573-246434e33963?auto=format&fit=crop&q=80&w=200',
      createdAt: new Date().toISOString()
    },
    {
      id: 'u-patient',
      email: 'patient@hospital.com',
      passwordHash: 'Patient123',
      role: 'patient',
      fullName: 'G. Rama Rao',
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200',
      createdAt: new Date().toISOString()
    }
  ],
  doctors: [
    {
      id: 'u-doctor',
      fullName: 'Dr. Srinivas Rao',
      email: 'doctor@hospital.com',
      specialization: 'Cardiology',
      departmentName: 'Cardiovascular Wellness',
      schedule: {
        days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday'],
        hours: '08:00 - 14:00'
      }
    },
    {
      id: 'u-doctor-2',
      fullName: 'Dr. P. Sridevi',
      email: 'sridevi@hospital.com',
      specialization: 'Neurology',
      departmentName: 'Neuroscience Division',
      schedule: {
        days: ['Tuesday', 'Wednesday', 'Friday'],
        hours: '09:00 - 15:00'
      }
    }
  ],
  patients: [
    {
      id: 'u-patient',
      fullName: 'G. Rama Rao',
      email: 'patient@hospital.com',
      dob: '1979-10-12',
      gender: 'Male',
      insuranceNo: 'INS-88492-AP',
      medicalHistorySummary: 'Mild hypertension, non-smoker, lives in Visakhapatnam.',
      age: 47,
      occupation: 'Steel Plant Engineer',
      address: 'Flat 402, Balaji Heights, MVP Colony, Sector 3, Visakhapatnam, AP - 530017'
    }
  ],
  appointments: [
    {
      id: 'apt-1',
      patientId: 'u-patient',
      patientName: 'G. Rama Rao',
      doctorId: 'u-doctor',
      doctorName: 'Dr. Srinivas Rao',
      startTime: '2026-06-08T09:00:00.000Z',
      status: 'confirmed',
      reason: 'Routine cardiovascular check-up for blood pressure tracking.',
      createdAt: new Date(Date.now() - 48 * 3600 * 1000).toISOString()
    },
    {
      id: 'apt-2',
      patientId: 'u-patient',
      patientName: 'G. Rama Rao',
      doctorId: 'u-doctor-2',
      doctorName: 'Dr. P. Sridevi',
      startTime: '2026-06-12T11:30:00.000Z',
      status: 'pending',
      reason: 'Persistent mild headaches during computer work sessions.',
      createdAt: new Date(Date.now() - 12 * 3600 * 1000).toISOString()
    }
  ],
  medicalRecords: [
    {
      id: 'rec-1',
      patientId: 'u-patient',
      doctorName: 'Dr. Srinivas Rao',
      date: '2026-05-15',
      diagnosis: 'Controlled Stage 1 Essential Hypertension',
      notes: 'Patient reports steady stamina. Advised morning walks along RK Beach. Scheduled ECG test for next quarterly review.',
      prescriptions: ['Lisinopril 10mg - Once daily morning', 'Amlodipine 5mg - As needed for spike readings'],
      vitals: {
        bloodPressure: '132/84 mmHg',
        heartRate: '72 bpm',
        temperature: '36.7 °C',
        weight: '78 kg'
      }
    }
  ],
  invoices: [
    {
      id: 'inv-1',
      patientId: 'u-patient',
      patientName: 'G. Rama Rao',
      description: 'First Consultation Fee - Dr. Srinivas Rao',
      amount: 150.00,
      status: 'paid',
      createdAt: '2026-05-15T10:30:00.000Z',
      paidAt: '2026-05-15T11:00:00.000Z'
    },
    {
      id: 'inv-2',
      patientId: 'u-patient',
      patientName: 'G. Rama Rao',
      description: 'Prescription Dispensing & Visakhapatnam Care Surcharge',
      amount: 45.50,
      status: 'unpaid',
      createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString()
    }
  ],
  auditLogs: [
    {
      timestamp: new Date().toISOString(),
      user: 'SYSTEM',
      action: 'BOOTSTRAP',
      details: 'Hospital Pre-seed Datastores Initialized Successfully.'
    }
  ]
};

// Database state management
let dbData: DbSchema = initialSeed;

function loadLocalDatabase() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf8');
      dbData = JSON.parse(data);
    } else {
      saveLocalDatabase(initialSeed);
    }
  } catch (e) {
    console.error('Failed reading server_db.json, fallback', e);
  }
}

function saveLocalDatabase(newData: DbSchema) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(newData, null, 2), 'utf8');
  } catch (e) {
    console.error('Failed writing server_db.json', e);
  }
}

async function loadDatabase() {
  if (supabase) {
    try {
      console.log('[DATABASE] Connecting to Supabase...');
      const { data, error } = await supabase
        .from('hms_data')
        .select('data')
        .eq('id', 1)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Row not found (table exists but no row with id: 1)
          console.log('[DATABASE] No row found in hms_data. Seeding database state...');
          await saveDatabase(initialSeed);
        } else {
          throw error;
        }
      } else if (data) {
        let loadedData = data.data as DbSchema;
        // Check if it's the old dataset containing 'Sarah Jenkins' or 'Arthur Dent' or 'Alexander Sterling'
        const hasOldData = loadedData.users.some(u => 
          u.fullName.includes('Sarah Jenkins') || 
          u.fullName.includes('Arthur Dent') || 
          u.fullName.includes('Alexander Sterling')
        );
        if (hasOldData) {
          console.log('[DATABASE] Detected legacy seed data. Upgrading database state to Visakhapatnam localization...');
          dbData = initialSeed;
          await saveDatabase(initialSeed);
        } else {
          dbData = loadedData;
          console.log('[DATABASE] Successfully loaded state from Supabase.');
        }
      }
    } catch (e) {
      console.error('[DATABASE] Supabase load error. Falling back to local server_db.json...', e);
      loadLocalDatabase();
    }
  } else {
    loadLocalDatabase();
  }
}

async function saveDatabase(newData: DbSchema) {
  dbData = newData;
  // Always save locally to ensure fallback is kept up-to-date
  saveLocalDatabase(newData);
  if (supabase) {
    try {
      const { error } = await supabase
        .from('hms_data')
        .upsert({ id: 1, data: newData, updated_at: new Date().toISOString() });

      if (error) throw error;
      console.log('[DATABASE] Saved database state to Supabase.');
    } catch (e) {
      console.error('[DATABASE] Failed to save state to Supabase.', e);
    }
  }
}

function addAudit(user: string, action: string, details: string) {
  const newLog: AuditLog = {
    timestamp: new Date().toISOString(),
    user,
    action,
    details
  };
  const logs = [newLog, ...dbData.auditLogs].slice(0, 100); // limit to 100 log trace
  saveDatabase({ ...dbData, auditLogs: logs });
}

// --- HELPER FUNCTION: AUTH token verify simulation ---
// Since we don't need real heavy symmetric token validation for our beautiful sandbox app,
// we map the credentials and return simple user meta. The client sends 'Authorization' header
// as a simulated JWT token string (representing email or userId).
function authenticateSimulatedUser(headers: any): InDbUser | null {
  const authHeader = headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.substring(7);
  // Match exact token, which for simplicity is the user ID or email
  const user = dbData.users.find(u => u.id === token || u.email === token);
  return user || null;
}

// ================= API ENDPOINTS =================

// Standard Login
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Missing required credential inputs.' });
  }

  const user = dbData.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!user || user.passwordHash !== password) {
    return res.status(401).json({ error: 'Invalid email or password combination.' });
  }

  addAudit(user.fullName, 'LOGIN', `Successfully logged in via secure gate.`);
  res.json({
    token: user.id, // we give user.id as the session token
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
      avatarUrl: user.avatarUrl
    }
  });
});

// Patient Self Registry
app.post('/api/auth/register', (req, res) => {
  const { email, password, fullName, dob, gender, insuranceNo = '' } = req.body;

  if (!email || !password || !fullName || !dob || !gender) {
    return res.status(400).json({ error: 'All fields are mandatory for clinical compliance registration.' });
  }

  const existingUser = dbData.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (existingUser) {
    return res.status(409).json({ error: 'An account with this email already exists in our system.' });
  }

  const newId = 'u-' + Math.random().toString(36).substring(2, 9);
  const newUser: InDbUser = {
    id: newId,
    email,
    passwordHash: password,
    role: 'patient',
    fullName,
    avatarUrl: `https://images.unsplash.com/photo-${Math.random() > 0.5 ? '1534528741775-53994a69daeb' : '1507003211169-0a1dd7228f2d'}?auto=format&fit=crop&q=80&w=200`,
    createdAt: new Date().toISOString()
  };

  const newPatient = {
    id: newId,
    fullName,
    email,
    dob,
    gender,
    insuranceNo,
    medicalHistorySummary: ''
  };

  const users = [...dbData.users, newUser];
  const patients = [...dbData.patients, newPatient];

  saveDatabase({ ...dbData, users, patients });
  addAudit(fullName, 'REGISTER', `New patient registered with ID ${newId}`);

  res.status(201).json({
    token: newId,
    user: {
      id: newId,
      email,
      role: 'patient',
      fullName,
      avatarUrl: newUser.avatarUrl
    }
  });
});

// GET /api/doctors (List all or specialty filter)
app.get('/api/doctors', (req, res) => {
  res.json(dbData.doctors);
});

// POST /api/doctors (Admins registering new specialist physicians)
app.post('/api/doctors', (req, res) => {
  const user = authenticateSimulatedUser(req.headers);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: 'Access restricted to administrators only.' });
  }

  const { fullName, email, specialization, departmentName, scheduleDays, scheduleHours, password } = req.body;

  if (!fullName || !email || !specialization || !departmentName || !scheduleDays || !scheduleHours) {
    return res.status(400).json({ error: 'All physician details are mandatory.' });
  }

  const existingUser = dbData.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (existingUser) {
    return res.status(409).json({ error: 'An account with this email already exists.' });
  }

  const newId = 'u-' + Math.random().toString(36).substring(2, 9);
  const newUser: InDbUser = {
    id: newId,
    email,
    passwordHash: password || 'Doctor123', // Default password for newly registered doctors
    role: 'doctor',
    fullName,
    avatarUrl: `https://images.unsplash.com/photo-${Math.random() > 0.5 ? '1622253692010-333f2da6031d' : '1594824813573-246434e33963'}?auto=format&fit=crop&q=80&w=200`,
    createdAt: new Date().toISOString()
  };

  const newDoctor = {
    id: newId,
    fullName,
    email,
    specialization,
    departmentName,
    schedule: {
      days: scheduleDays,
      hours: scheduleHours
    }
  };

  const users = [...dbData.users, newUser];
  const doctors = [...dbData.doctors, newDoctor];

  saveDatabase({ ...dbData, users, doctors });
  addAudit(user.fullName, 'REGISTER_DOCTOR', `Registered physician ${fullName} with ID ${newId}`);

  res.status(201).json(newDoctor);
});

// DELETE /api/doctors/:id (Admins deleting physicians)
app.delete('/api/doctors/:id', (req, res) => {
  const user = authenticateSimulatedUser(req.headers);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: 'Access restricted to administrators only.' });
  }

  const doctorId = req.params.id;
  const doctorExists = dbData.doctors.some(d => d.id === doctorId);
  if (!doctorExists) {
    return res.status(404).json({ error: 'Physician not found.' });
  }

  const doctors = dbData.doctors.filter(d => d.id !== doctorId);
  const users = dbData.users.filter(u => u.id !== doctorId);

  saveDatabase({ ...dbData, users, doctors });
  addAudit(user.fullName, 'DELETE_DOCTOR', `Deleted physician with ID ${doctorId}`);

  res.status(200).json({ success: true, message: 'Physician deleted successfully.' });
});

// POST /api/patients/offline (Admins or doctors registering offline/walk-in patients)
app.post('/api/patients/offline', (req, res) => {
  const user = authenticateSimulatedUser(req.headers);
  if (!user || (user.role !== 'admin' && user.role !== 'doctor')) {
    return res.status(403).json({ error: 'Access restricted to authorized personnel only.' });
  }

  const { email, fullName, dob, gender, age, occupation, address, medicalHistorySummary = '', password } = req.body;

  if (!email || !fullName || !dob || !gender) {
    return res.status(400).json({ error: 'Email, Full Name, DOB, and Gender are mandatory fields.' });
  }

  const existingUser = dbData.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (existingUser) {
    return res.status(409).json({ error: 'An account with this email already exists in our system.' });
  }

  const newId = 'u-' + Math.random().toString(36).substring(2, 9);
  const newUser: InDbUser = {
    id: newId,
    email,
    passwordHash: password || 'Patient123', // Default password for walk-in patients
    role: 'patient',
    fullName,
    avatarUrl: `https://images.unsplash.com/photo-${Math.random() > 0.5 ? '1534528741775-53994a69daeb' : '1507003211169-0a1dd7228f2d'}?auto=format&fit=crop&q=80&w=200`,
    createdAt: new Date().toISOString()
  };

  const newPatient = {
    id: newId,
    fullName,
    email,
    dob,
    gender,
    insuranceNo: '', // No insurance card field as per HIPAA/User req
    medicalHistorySummary,
    age: age ? parseInt(age, 10) : undefined,
    occupation,
    address
  };

  const users = [...dbData.users, newUser];
  const patients = [...dbData.patients, newPatient];

  saveDatabase({ ...dbData, users, patients });
  addAudit(user.fullName, 'REGISTER_OFFLINE_PATIENT', `Registered offline patient ${fullName} with ID ${newId}`);

  res.status(201).json(newPatient);
});

// DELETE /api/patients/:id (Admins deleting patients)
app.delete('/api/patients/:id', (req, res) => {
  const user = authenticateSimulatedUser(req.headers);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: 'Access restricted to administrators only.' });
  }

  const patientId = req.params.id;
  const patientExists = dbData.patients.some(p => p.id === patientId);
  if (!patientExists) {
    return res.status(404).json({ error: 'Patient not found.' });
  }

  const patients = dbData.patients.filter(p => p.id !== patientId);
  const users = dbData.users.filter(u => u.id !== patientId);

  saveDatabase({ ...dbData, users, patients });
  addAudit(user.fullName, 'DELETE_PATIENT', `Deleted patient with ID ${patientId}`);

  res.status(200).json({ success: true, message: 'Patient deleted successfully.' });
});

// GET /api/patients (Requires doctor or admin privileges)
app.get('/api/patients', (req, res) => {
  const user = authenticateSimulatedUser(req.headers);
  if (!user || (user.role !== 'admin' && user.role !== 'doctor')) {
    return res.status(403).json({ error: 'Access restricted to medical personnel only.' });
  }
  res.json(dbData.patients);
});

// GET /api/patients/:id (Requires session user matching the patient ID, or doctor/admin role)
app.get('/api/patients/:id', (req, res) => {
  const user = authenticateSimulatedUser(req.headers);
  if (!user) {
    return res.status(401).json({ error: 'Session token expired or missing.' });
  }

  const patient = dbData.patients.find(p => p.id === req.params.id);
  if (!patient) {
    return res.status(404).json({ error: 'Patient account not found.' });
  }

  if (user.role !== 'admin' && user.role !== 'doctor' && user.id !== req.params.id) {
    return res.status(403).json({ error: 'Access restricted to authorized personnel only.' });
  }

  res.json(patient);
});

// PUT /api/patients/:id (Requires session user matching the patient ID, or doctor/admin role)
app.put('/api/patients/:id', (req, res) => {
  const user = authenticateSimulatedUser(req.headers);
  if (!user) {
    return res.status(401).json({ error: 'Session token expired or missing.' });
  }

  const patientIndex = dbData.patients.findIndex(p => p.id === req.params.id);
  if (patientIndex === -1) {
    return res.status(404).json({ error: 'Patient account not found.' });
  }

  if (user.role !== 'admin' && user.role !== 'doctor' && user.id !== req.params.id) {
    return res.status(403).json({ error: 'Access restricted.' });
  }

  const patient = dbData.patients[patientIndex];
  const { fullName, dob, gender, insuranceNo, age, occupation, address } = req.body;

  const updatedPatient = {
    ...patient,
    fullName: fullName !== undefined ? fullName : patient.fullName,
    dob: dob !== undefined ? dob : patient.dob,
    gender: gender !== undefined ? gender : patient.gender,
    insuranceNo: insuranceNo !== undefined ? insuranceNo : patient.insuranceNo,
    age: age !== undefined ? (age ? parseInt(age, 10) : undefined) : patient.age,
    occupation: occupation !== undefined ? occupation : patient.occupation,
    address: address !== undefined ? address : patient.address
  };

  const users = dbData.users.map(u => {
    if (u.id === req.params.id) {
      return {
        ...u,
        fullName: fullName !== undefined ? fullName : u.fullName
      };
    }
    return u;
  });

  const patients = [...dbData.patients];
  patients[patientIndex] = updatedPatient;

  const appointments = dbData.appointments.map(a => {
    if (a.patientId === req.params.id && fullName !== undefined) {
      return {
        ...a,
        patientName: fullName
      };
    }
    return a;
  });

  const invoices = dbData.invoices.map(inv => {
    if (inv.patientId === req.params.id && fullName !== undefined) {
      return {
        ...inv,
        patientName: fullName
      };
    }
    return inv;
  });

  saveDatabase({ ...dbData, users, patients, appointments, invoices });
  addAudit(user.fullName, 'UPDATE_PATIENT_PROFILE', `Updated profile details for patient ID ${req.params.id}`);

  res.json(updatedPatient);
});

// GET /api/appointments (RBAC Filtered)
app.get('/api/appointments', (req, res) => {
  const user = authenticateSimulatedUser(req.headers);
  if (!user) {
    return res.status(401).json({ error: 'Session token expired or missing.' });
  }

  let filtered = dbData.appointments;
  if (user.role === 'patient') {
    filtered = dbData.appointments.filter(a => a.patientId === user.id);
  } else if (user.role === 'doctor') {
    filtered = dbData.appointments.filter(a => a.doctorId === user.id);
  } // Admins can view all

  res.json(filtered);
});

// POST /api/appointments (Book with strict conflict mitigation check)
app.post('/api/appointments', (req, res) => {
  const user = authenticateSimulatedUser(req.headers);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized.' });
  }

  const { doctorId, startTime, reason, patientIdOverride } = req.body;
  if (!doctorId || !startTime || !reason) {
    return res.status(400).json({ error: 'Doctor, start time and reason are mandatory fields.' });
  }

  // Conflict Mitigation Logic: Check if the doctor has an appointment during this exact hour/time
  const pendingOrConfirmed = dbData.appointments.filter(a => a.status === 'confirmed' || a.status === 'pending');
  const hasConflict = pendingOrConfirmed.some(a => 
    a.doctorId === doctorId && 
    new Date(a.startTime).getTime() === new Date(startTime).getTime()
  );

  if (hasConflict) {
    return res.status(409).json({ 
      error: 'Scheduling Conflict: The chosen doctor is already reserved during this specific time slot.' 
    });
  }

  let finalPatientId = user.id;
  let finalPatientName = user.fullName;

  // Support Admin/reception booking on behalf of another patient
  if (user.role === 'admin' && patientIdOverride) {
    const overridePt = dbData.patients.find(p => p.id === patientIdOverride);
    if (!overridePt) {
      return res.status(404).json({ error: 'Sought patient override ID not discovered.' });
    }
    finalPatientId = overridePt.id;
    finalPatientName = overridePt.fullName;
  }

  const targetDoc = dbData.doctors.find(d => d.id === doctorId);
  if (!targetDoc) {
    return res.status(404).json({ error: 'Assigned physician not found.' });
  }

  const newApt = {
    id: 'apt-' + Math.random().toString(36).substring(2, 9),
    patientId: finalPatientId,
    patientName: finalPatientName,
    doctorId,
    doctorName: targetDoc.fullName,
    startTime: new Date(startTime).toISOString(),
    status: 'pending' as const, // Books as pending initially
    reason,
    createdAt: new Date().toISOString()
  };

  const appointments = [...dbData.appointments, newApt];
  saveDatabase({ ...dbData, appointments });

  addAudit(
    user.fullName, 
    'BOOK_APPOINTMENT', 
    `Booked appointment with ${targetDoc.fullName} for patient ${finalPatientName} at ${startTime}`
  );

  res.status(201).json(newApt);
});

// PUT /api/appointments/:id (Update status cancel/confirm/complete)
app.put('/api/appointments/:id', (req, res) => {
  const user = authenticateSimulatedUser(req.headers);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized.' });
  }

  const { status } = req.body;
  if (!status || !['pending', 'confirmed', 'cancelled', 'completed'].includes(status)) {
    return res.status(400).json({ error: 'Invalid targeted clinical status.' });
  }

  const aptIndex = dbData.appointments.findIndex(a => a.id === req.params.id);
  if (aptIndex === -1) {
    return res.status(404).json({ error: 'Appointment entry not indexed.' });
  }

  const apt = dbData.appointments[aptIndex];

  // RBAC checks
  if (user.role === 'patient' && apt.patientId !== user.id) {
    return res.status(403).json({ error: 'Forbidden: Cannot alter other patients appointments.' });
  }

  const updatedApt = { ...apt, status: status as any };
  const appointments = [...dbData.appointments];
  appointments[aptIndex] = updatedApt;

  saveDatabase({ ...dbData, appointments });
  addAudit(user.fullName, 'UPDATE_APPOINTMENT', `Updated apt ${req.params.id} to state: ${status}`);

  res.json(updatedApt);
});

// GET /api/patients/:id/records (Doctor, Admin, or Patient for self only)
app.get('/api/patients/:id/records', (req, res) => {
  const user = authenticateSimulatedUser(req.headers);
  if (!user) {
    return res.status(401).json({ error: 'Session expired.' });
  }

  const patientId = req.params.id;
  if (user.role === 'patient' && user.id !== patientId) {
    return res.status(403).json({ error: 'Access forbidden for third-party PHI information.' });
  }

  const records = dbData.medicalRecords.filter(r => r.patientId === patientId);
  res.json(records);
});

// POST /api/patients/:id/records (Doctor writes a clinical note and adds medical records)
app.post('/api/patients/:id/records', (req, res) => {
  const user = authenticateSimulatedUser(req.headers);
  if (!user || user.role !== 'doctor') {
    return res.status(403).json({ error: 'Restricted: Only certified practitioners may write clinical documentation.' });
  }

  const patientId = req.params.id;
  const { diagnosis, notes, prescriptions, vitals } = req.body;

  if (!diagnosis || !notes) {
    return res.status(400).json({ error: 'Diagnosis and clinical visit notes are required.' });
  }

  const newRecord = {
    id: 'rec-' + Math.random().toString(36).substring(2, 9),
    patientId,
    doctorName: user.fullName,
    date: new Date().toISOString().split('T')[0],
    diagnosis,
    notes,
    prescriptions: prescriptions || [],
    vitals: vitals || { bloodPressure: '120/80', heartRate: '75', temperature: '36.8' }
  };

  const medicalRecords = [newRecord, ...dbData.medicalRecords];
  
  // Create an automatic invoice for $150 standard doctor consult fee
  const patient = dbData.patients.find(p => p.id === patientId);
  const invoiceId = 'inv-' + Math.random().toString(36).substring(2, 9);
  const newInvoice = {
    id: invoiceId,
    patientId,
    patientName: patient ? patient.fullName : 'G. Rama Rao',
    description: `Specialist Consultation and Care - ${user.fullName}`,
    amount: 150.00,
    status: 'unpaid' as const,
    createdAt: new Date().toISOString()
  };

  const invoices = [newInvoice, ...dbData.invoices];
  saveDatabase({ ...dbData, medicalRecords, invoices });

  addAudit(user.fullName, 'WRITE_MEDICAL_RECORD', `Created diagnosis: ${diagnosis} for patient ${patientId}`);

  res.status(201).json(newRecord);
});

// GET /api/invoices (List billing items, RBAC filtered)
app.get('/api/invoices', (req, res) => {
  const user = authenticateSimulatedUser(req.headers);
  if (!user) {
    return res.status(401).json({ error: 'Session credentials invalid.' });
  }

  if (user.role === 'patient') {
    return res.json(dbData.invoices.filter(i => i.patientId === user.id));
  }

  res.json(dbData.invoices);
});

// POST /api/invoices (Admin creates direct invoice)
app.post('/api/invoices', (req, res) => {
  const user = authenticateSimulatedUser(req.headers);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: 'Requires admin privileges.' });
  }

  const { patientId, description, amount } = req.body;
  if (!patientId || !description || !amount) {
    return res.status(400).json({ error: 'Missing required invoice elements.' });
  }

  const patientObj = dbData.patients.find(p => p.id === patientId);
  if (!patientObj) {
    return res.status(404).json({ error: 'Target patient record not registered.' });
  }

  const newInv = {
    id: 'inv-' + Math.random().toString(36).substring(2, 9),
    patientId,
    patientName: patientObj.fullName,
    description,
    amount: parseFloat(amount),
    status: 'unpaid' as const,
    createdAt: new Date().toISOString()
  };

  const invoices = [newInv, ...dbData.invoices];
  saveDatabase({ ...dbData, invoices });

  addAudit(user.fullName, 'CREATE_INVOICE', `Billed patient ${patientObj.fullName} $${amount}`);
  res.status(201).json(newInv);
});

// POST /api/invoices/:id/pay (Secure checkout integration proxy)
app.post('/api/invoices/:id/pay', (req, res) => {
  const user = authenticateSimulatedUser(req.headers);
  if (!user || user.role !== 'patient') {
    return res.status(403).json({ error: 'Only billing policyholders can trigger payments.' });
  }

  const invIndex = dbData.invoices.findIndex(i => i.id === req.params.id);
  if (invIndex === -1) {
    return res.status(404).json({ error: 'Billing file not located.' });
  }

  const inv = dbData.invoices[invIndex];
  if (inv.patientId !== user.id) {
    return res.status(403).json({ error: 'Cannot pay bills belonging to other patients.' });
  }

  const updatedInv = { ...inv, status: 'paid' as const, paidAt: new Date().toISOString() };
  const invoices = [...dbData.invoices];
  invoices[invIndex] = updatedInv;

  saveDatabase({ ...dbData, invoices });
  addAudit(user.fullName, 'PAY_BILL', `Paid invoice ID: ${req.params.id} via simulated bank gateway.`);

  res.json(updatedInv);
});

// GET /api/analytics
app.get('/api/analytics', (req, res) => {
  const user = authenticateSimulatedUser(req.headers);
  if (!user || (user.role !== 'admin' && user.role !== 'doctor')) {
    return res.status(403).json({ error: 'Authorized directory list.' });
  }

  const totalPatients = dbData.patients.length;
  const totalDoctors = dbData.doctors.length;
  const appointmentsToday = dbData.appointments.filter(a => {
    const todayStr = new Date().toISOString().split('T')[0];
    return a.startTime.startsWith(todayStr) && a.status !== 'cancelled';
  }).length;

  const totalRevenue = dbData.invoices
    .filter(i => i.status === 'paid')
    .reduce((sum, i) => sum + i.amount, 0);

  // Status counters
  const statusLabels = {
    pending: 'Pending Intake',
    confirmed: 'Confirmed Visit',
    cancelled: 'Cancelled/No-show',
    completed: 'Session Complete'
  };

  const statusMap: Record<string, number> = {
    pending: 0,
    confirmed: 0,
    cancelled: 0,
    completed: 0
  };
  dbData.appointments.forEach(a => {
    if (statusMap[a.status] !== undefined) {
      statusMap[a.status] += 1;
    }
  });

  const appointmentsByStatus = Object.keys(statusMap).map(k => ({
    name: statusLabels[k as keyof typeof statusLabels] || k,
    value: statusMap[k]
  }));

  const payload = {
    totalPatients,
    totalDoctors,
    appointmentsToday,
    revenue: totalRevenue,
    bedOccupancy: 64, // Standard ICU / ER floor occupancy simulation
    appointmentsByStatus,
    revenueMonthly: [
      { month: 'Jan', amount: 12000 },
      { month: 'Feb', amount: 14500 },
      { month: 'Mar', amount: 19100 },
      { month: 'Apr', amount: 22000 },
      { month: 'May', amount: totalRevenue > 0 ? (totalRevenue * 0.8) : 18000 },
      { month: 'Jun', amount: totalRevenue > 0 ? totalRevenue : 24000 }
    ]
  };

  res.json(payload);
});

// GET /api/audit (Retrieve clinical logging for compliance console UI)
app.get('/api/logs', (req, res) => {
  const user = authenticateSimulatedUser(req.headers);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: 'Access limited to HIPAA Security Officers.' });
  }
  res.json(dbData.auditLogs);
});

// ================= VITE OR STATIC SERVING =================

async function startServer() {
  await loadDatabase();

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[MediFlow HMS] Server actively listening at http://localhost:${PORT}`);
  });
}

startServer();
