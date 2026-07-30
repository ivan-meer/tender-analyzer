import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut as firebaseSignOut, signInAnonymously } from 'firebase/auth';
import { getFirestore, collection, addDoc, getDocs, doc, deleteDoc, updateDoc, query, where, orderBy, serverTimestamp, getDoc } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export const db = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

export interface SavedAnalysis {
  id?: string;
  userId: string;
  userEmail?: string;
  title: string;
  projectName?: string;
  customerName?: string;
  procurementSum?: string;
  auctionDate?: string;
  procurementNumber?: string;
  riskScore: number;
  riskLevel: string;
  createdAt: any;
  updatedAt?: any;
  analysisResult: any;
  isFavorite?: boolean;
  notes?: string;
  tags?: string[];
}

// Helper functions for analysis database operations
export async function saveAnalysisToDb(userId: string, userEmail: string, result: any, title?: string): Promise<string> {
  const collectionRef = collection(db, 'analyses');
  const docTitle = title || result.summary?.projectName || result.summary?.procurementTitle || 'Анализ закупки 223-ФЗ';
  
  const docRef = await addDoc(collectionRef, {
    userId,
    userEmail: userEmail || 'анонимный',
    title: docTitle,
    projectName: result.summary?.projectName || docTitle,
    customerName: result.summary?.customerName || 'Заказчик по 223-ФЗ',
    procurementSum: result.summary?.procurementSum || 'Сумма определяется заявкой',
    auctionDate: result.summary?.auctionDate || 'Срок подачи уточняется',
    procurementNumber: result.submissionRulesCheck?.procedureType || '223-ФЗ',
    riskScore: result.summary?.overallRiskScore ?? 50,
    riskLevel: result.summary?.riskLevel || 'MEDIUM',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    analysisResult: result,
    isFavorite: false,
    notes: '',
  });

  return docRef.id;
}

export async function getUserAnalysesFromDb(userId: string): Promise<SavedAnalysis[]> {
  try {
    const collectionRef = collection(db, 'analyses');
    const q = query(
      collectionRef,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(docSnap => ({
      id: docSnap.id,
      ...docSnap.data()
    })) as SavedAnalysis[];
  } catch (err) {
    console.warn('Error fetching user analyses from Firestore:', err);
    // Fallback if index is not ready yet or query fails
    const collectionRef = collection(db, 'analyses');
    const q = query(collectionRef, where('userId', '==', userId));
    const snapshot = await getDocs(q);
    const docs = snapshot.docs.map(docSnap => ({
      id: docSnap.id,
      ...docSnap.data()
    })) as SavedAnalysis[];
    return docs.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
  }
}

export async function deleteAnalysisFromDb(analysisId: string): Promise<void> {
  const docRef = doc(db, 'analyses', analysisId);
  await deleteDoc(docRef);
}

export async function toggleFavoriteAnalysisInDb(analysisId: string, currentStatus: boolean): Promise<void> {
  const docRef = doc(db, 'analyses', analysisId);
  await updateDoc(docRef, {
    isFavorite: !currentStatus,
    updatedAt: serverTimestamp(),
  });
}

export async function updateAnalysisNotesInDb(analysisId: string, notes: string): Promise<void> {
  const docRef = doc(db, 'analyses', analysisId);
  await updateDoc(docRef, {
    notes,
    updatedAt: serverTimestamp(),
  });
}
