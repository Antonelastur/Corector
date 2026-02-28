import {
    collection, doc, addDoc, getDoc, getDocs, updateDoc, deleteDoc,
    query, where, orderBy, limit, serverTimestamp
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebaseConfig';

// In-memory fallback when Firestore is not configured
const memoryStore = {
    students: [],
    corrections: [],
    barems: []
};

// --- Students ---
export const addStudent = async (studentData) => {
    if (!isFirebaseConfigured) {
        const id = 'mem_' + Date.now();
        memoryStore.students.push({ id, ...studentData, createdAt: new Date() });
        return { id };
    }
    return await addDoc(collection(db, 'students'), {
        ...studentData,
        createdAt: serverTimestamp()
    });
};

export const getStudents = async (teacherId) => {
    if (!isFirebaseConfigured) {
        return memoryStore.students.filter(s => s.teacherId === teacherId);
    }
    const q = query(
        collection(db, 'students'),
        where('teacherId', '==', teacherId),
        orderBy('name')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const getStudent = async (studentId) => {
    if (!isFirebaseConfigured) {
        return memoryStore.students.find(s => s.id === studentId) || null;
    }
    const snap = await getDoc(doc(db, 'students', studentId));
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

// --- Corrections ---
export const addCorrection = async (correctionData) => {
    if (!isFirebaseConfigured) {
        const id = 'mem_' + Date.now();
        const entry = { id, ...correctionData, createdAt: new Date() };
        memoryStore.corrections.push(entry);
        return { id };
    }
    return await addDoc(collection(db, 'corrections'), {
        ...correctionData,
        createdAt: serverTimestamp()
    });
};

export const getCorrections = async (teacherId) => {
    if (!isFirebaseConfigured) {
        return memoryStore.corrections
            .filter(c => c.teacherId === teacherId)
            .sort((a, b) => b.createdAt - a.createdAt);
    }
    const q = query(
        collection(db, 'corrections'),
        where('teacherId', '==', teacherId),
        orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const getStudentCorrections = async (studentId) => {
    if (!isFirebaseConfigured) {
        return memoryStore.corrections
            .filter(c => c.studentId === studentId)
            .sort((a, b) => b.createdAt - a.createdAt);
    }
    const q = query(
        collection(db, 'corrections'),
        where('studentId', '==', studentId),
        orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const getCorrectionById = async (correctionId) => {
    if (!isFirebaseConfigured) {
        return memoryStore.corrections.find(c => c.id === correctionId) || null;
    }
    const snap = await getDoc(doc(db, 'corrections', correctionId));
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

// --- Barems ---
export const addBarem = async (baremData) => {
    if (!isFirebaseConfigured) {
        const id = 'mem_' + Date.now();
        memoryStore.barems.push({ id, ...baremData, createdAt: new Date() });
        return { id };
    }
    return await addDoc(collection(db, 'barems'), {
        ...baremData,
        createdAt: serverTimestamp()
    });
};

export const getBarems = async (teacherId) => {
    if (!isFirebaseConfigured) {
        return memoryStore.barems
            .filter(b => b.teacherId === teacherId)
            .sort((a, b) => b.createdAt - a.createdAt);
    }
    const q = query(
        collection(db, 'barems'),
        where('teacherId', '==', teacherId),
        orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const deleteBarem = async (baremId) => {
    if (!isFirebaseConfigured) {
        memoryStore.barems = memoryStore.barems.filter(b => b.id !== baremId);
        return;
    }
    await deleteDoc(doc(db, 'barems', baremId));
};
