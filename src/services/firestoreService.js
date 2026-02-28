import {
    collection, doc, addDoc, getDoc, getDocs, updateDoc, deleteDoc,
    query, where, orderBy, limit, serverTimestamp
} from 'firebase/firestore';
import { db } from './firebaseConfig';

// --- Students ---
export const addStudent = async (studentData) => {
    return await addDoc(collection(db, 'students'), {
        ...studentData,
        createdAt: serverTimestamp()
    });
};

export const getStudents = async (teacherId) => {
    const q = query(
        collection(db, 'students'),
        where('teacherId', '==', teacherId),
        orderBy('name')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const getStudent = async (studentId) => {
    const snap = await getDoc(doc(db, 'students', studentId));
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

// --- Corrections ---
export const addCorrection = async (correctionData) => {
    return await addDoc(collection(db, 'corrections'), {
        ...correctionData,
        createdAt: serverTimestamp()
    });
};

export const getCorrections = async (teacherId) => {
    const q = query(
        collection(db, 'corrections'),
        where('teacherId', '==', teacherId),
        orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const getStudentCorrections = async (studentId) => {
    const q = query(
        collection(db, 'corrections'),
        where('studentId', '==', studentId),
        orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const getCorrectionById = async (correctionId) => {
    const snap = await getDoc(doc(db, 'corrections', correctionId));
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

// --- Barems ---
export const addBarem = async (baremData) => {
    return await addDoc(collection(db, 'barems'), {
        ...baremData,
        createdAt: serverTimestamp()
    });
};

export const getBarems = async (teacherId) => {
    const q = query(
        collection(db, 'barems'),
        where('teacherId', '==', teacherId),
        orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const deleteBarem = async (baremId) => {
    await deleteDoc(doc(db, 'barems', baremId));
};
