// ============================================================
// MOCK API — swap imports to this file for UI testing
// Replace with real api.js when backend is ready
// ============================================================

const delay = (ms = 600) => new Promise(res => setTimeout(res, ms))

// ── Mock Data ─────────────────────────────────────────────────

const MOCK_PATIENT = {
	id: 1,
	name: "Shubh Test",
	email: "patient@test.com",
	age: "21",
	blood_group: "O+",
	phone_number: "9876543210",
	role: "patient"
}

const MOCK_DOCTOR_USER = {
	id: 10,
	name: "Dr. Sarah Jenkins",
	email: "doctor@test.com",
	specialty: "Pulmonologist",
	hospital: "City General Hospital",
	role: "doctor"
}

const MOCK_HISTORY = [
	{ id: 1, disease: "brain_glioma", confidence: 0.91, date: "2026-04-18", report_summary: JSON.stringify({ diagnosis: "brain_glioma", confidence: 0.91, summary: "Glioma detected in left frontal lobe. Recommend MRI follow-up.", medicines: ["Temozolomide", "Dexamethasone"] }), voice_url: null },
	{ id: 2, disease: "chest_pneumonia", confidence: 0.87, date: "2026-04-15", report_summary: JSON.stringify({ diagnosis: "chest_pneumonia", confidence: 0.87, summary: "Bacterial pneumonia in right lower lobe. Antibiotic therapy recommended.", medicines: ["Amoxicillin", "Azithromycin"] }), voice_url: null },
	{ id: 3, disease: "brain_normal", confidence: 0.96, date: "2026-04-10", report_summary: JSON.stringify({ diagnosis: "brain_normal", confidence: 0.96, summary: "No abnormalities detected. Brain scan appears normal.", medicines: [] }), voice_url: null },
	{ id: 4, disease: "brain_meningioma", confidence: 0.78, date: "2026-04-05", report_summary: JSON.stringify({ diagnosis: "brain_meningioma", confidence: 0.78, summary: "Meningioma suspected near right temporal lobe. Neurosurgery consult advised.", medicines: ["Dexamethasone"] }), voice_url: null },
	{ id: 5, disease: "chest_normal", confidence: 0.93, date: "2026-03-28", report_summary: JSON.stringify({ diagnosis: "chest_normal", confidence: 0.93, summary: "Chest X-ray clear. No signs of infection or abnormality.", medicines: [] }), voice_url: null },
]

const MOCK_DOCTORS = [
	{ id: 1, name: "Dr. Sarah Jenkins", specialty: "Pulmonologist", hospital: "City General Hospital", phone: "+91 555-0100", locality: "Hadapsar, Pune" },
	{ id: 2, name: "Dr. Michael Chen", specialty: "Neurologist", hospital: "Mercy Medical Center", phone: "+91 555-0101", locality: "Navsayadri, Pune" },
	{ id: 3, name: "Dr. Emily Patel", specialty: "Radiologist", hospital: "Valley Health Clinic", phone: "+91 555-0102", locality: "North Hills, Mumbai" },
	{ id: 4, name: "Dr. James Wilson", specialty: "Oncologist", hospital: "Hope Cancer Center", phone: "+91 555-0103", locality: "East Andheri, Mumbai" },
]

const MOCK_ALL_REPORTS = MOCK_HISTORY.map(h => ({ ...h, patient_name: "Shubh Test", patient_age: "21" }))

// ── Auth ──────────────────────────────────────────────────────

export const registerPatient = async (data) => {
	await delay()
	return { message: "Patient registered (mock)", user: { ...MOCK_PATIENT, ...data } }
}

export const registerDoctor = async (data) => {
	await delay()
	return { message: "Doctor registered (mock)", doctor: { ...MOCK_DOCTOR_USER, ...data } }
}

export const loginPatient = async (email, password) => {
	await delay()
	if (password === "") throw { response: { data: { detail: "Invalid credentials" } } }
	return {
		access_token: "mock-patient-token-abc123",
		role: "patient",
		user: MOCK_PATIENT
	}
}

export const loginDoctor = async (email, password) => {
	await delay()
	if (password === "") throw { response: { data: { detail: "Invalid credentials" } } }
	return {
		access_token: "mock-doctor-token-xyz789",
		role: "doctor",
		user: MOCK_DOCTOR_USER
	}
}

// ── Diagnose ──────────────────────────────────────────────────

export const diagnose = async (file) => {
	await delay(2000) // simulate ML inference delay
	return {
		disease: "brain_glioma",
		confidence: 0.91,
		report: {
			diagnosis: "brain_glioma",
			confidence: 0.91,
			summary: "Glioma detected in left frontal lobe. Recommend MRI follow-up within 2 weeks.",
			medicines: ["Temozolomide", "Dexamethasone"],
			doctor_note: "Patient should consult a neurologist immediately."
		}
	}
}

// ── History ───────────────────────────────────────────────────

export const getHistory = async () => {
	await delay()
	return MOCK_HISTORY
}

export const addHistory = async (data) => {
	await delay()
	return { ...data, id: Date.now() }
}

// ── Doctors ───────────────────────────────────────────────────

export const getDoctors = async (specialty = '') => {
	await delay()
	if (!specialty) return MOCK_DOCTORS
	return MOCK_DOCTORS.filter(d => d.specialty.toLowerCase().includes(specialty.toLowerCase()))
}

// ── Voice Report ──────────────────────────────────────────────

export const getVoiceReport = async () => {
	await delay()
	// return empty blob — audio won't play but won't crash
	return new Blob([], { type: 'audio/mpeg' })
}

// ── Chat ──────────────────────────────────────────────────────

export const chat = async (message, context = '') => {
	await delay(1000)
	const replies = [
		"Based on your scan history, your recent results appear stable.",
		"I recommend consulting Dr. Sarah Jenkins for a follow-up on your chest scan.",
		"Your brain_normal result from April 10th shows no abnormalities.",
		"Please ensure you complete the full antibiotic course for pneumonia treatment.",
	]
	return { reply: replies[Math.floor(Math.random() * replies.length)] }
}

// ── Doctor Endpoints ──────────────────────────────────────────

export const getAllReports = async () => {
	await delay()
	return MOCK_ALL_REPORTS
}

// ── Ping ──────────────────────────────────────────────────────

export const ping = async () => {
	await delay(100)
	return { status: "mock ok" }
}

export default { getHistory, getDoctors, diagnose, chat, ping }
