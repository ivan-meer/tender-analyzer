import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut as firebaseSignOut, signInAnonymously } from 'firebase/auth';
import { getFirestore, collection, addDoc, getDocs, doc, deleteDoc, updateDoc, query, where, orderBy, serverTimestamp, getDoc } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

const configAny = firebaseConfig as any;
export const db = configAny.firestoreDatabaseId
  ? getFirestore(app, configAny.firestoreDatabaseId)
  : getFirestore(app);

export interface SavedCustomer {
  id?: string;
  userId: string;
  name: string;
  normalizedName: string;
  inn?: string;
  tendersCount: number;
  totalProcurementSum?: string;
  createdAt: any;
  updatedAt?: any;
}

export type TenderParticipationStatus = 'NEW' | 'PARTICIPATING' | 'SUBMITTED' | 'WON' | 'REJECTED' | 'ARCHIVED';

export interface SavedAnalysis {
  id?: string;
  userId: string;
  userEmail?: string;
  customerId?: string;
  customerName?: string;
  title: string;
  projectName?: string;
  procurementSum?: string;
  auctionDate?: string;
  procurementNumber?: string;
  status?: string;
  participationStatus?: TenderParticipationStatus;
  riskScore: number;
  riskLevel: string;
  createdAt: any;
  updatedAt?: any;
  analysisResult: any;
  isFavorite?: boolean;
  notes?: string;
  tags?: string[];
}

/**
 * Finds or creates a unique Customer account for the user, ensuring a customer is stored ONLY ONCE.
 * Repeat tenders from the same customer link to the existing account ID.
 */
export async function getOrCreateCustomerRecord(userId: string, customerName: string, procurementSumStr?: string): Promise<SavedCustomer> {
  const rawName = (customerName || 'Заказчик 223-ФЗ').trim();
  const normalizedName = rawName.toLowerCase().replace(/["'«»]/g, '').replace(/\s+/g, ' ').trim();

  try {
    const custCollection = collection(db, 'customers');
    const q = query(custCollection, where('userId', '==', userId));
    const snapshot = await getDocs(q);

    const existingDoc = snapshot.docs.find(d => {
      const data = d.data();
      const n = (data.normalizedName || data.name || '').toLowerCase().replace(/["'«»]/g, '').replace(/\s+/g, ' ').trim();
      return n === normalizedName;
    });

    if (existingDoc) {
      const existingData = existingDoc.data() as SavedCustomer;
      const currentCount = existingData.tendersCount || 1;
      const updatedCount = currentCount + 1;

      // Update tender count on existing customer account
      const docRef = doc(db, 'customers', existingDoc.id);
      await updateDoc(docRef, {
        tendersCount: updatedCount,
        updatedAt: serverTimestamp(),
      });

      return {
        id: existingDoc.id,
        ...existingData,
        tendersCount: updatedCount
      };
    }

    // Create new unique Customer account
    const newCustData = {
      userId,
      name: rawName,
      normalizedName,
      tendersCount: 1,
      totalProcurementSum: procurementSumStr || '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const newDocRef = await addDoc(custCollection, newCustData);
    return {
      id: newDocRef.id,
      ...newCustData
    };
  } catch (err) {
    console.warn('Customer account resolution warning:', err);
    return {
      id: 'local_cust_' + Date.now(),
      userId,
      name: rawName,
      normalizedName,
      tendersCount: 1,
      createdAt: new Date().toISOString()
    };
  }
}

// Helper functions for analysis database operations
export async function saveAnalysisToDb(userId: string, userEmail: string, result: any, title?: string): Promise<string> {
  const collectionRef = collection(db, 'analyses');
  const docTitle = title || result.summary?.projectName || result.summary?.procurementTitle || 'Анализ закупки 223-ФЗ';
  const rawCustomer = result.summary?.customerName || 'Заказчик по 223-ФЗ';
  const procSum = result.summary?.procurementSum || 'Определяется заявкой';

  // Ensure Customer Account uniqueness: linking repeat tenders to existing account
  const customerAccount = await getOrCreateCustomerRecord(userId, rawCustomer, procSum);
  
  const docRef = await addDoc(collectionRef, {
    userId,
    userEmail: userEmail || 'анонимный',
    customerId: customerAccount.id || '',
    customerName: customerAccount.name,
    title: docTitle,
    projectName: result.summary?.projectName || docTitle,
    procurementSum: procSum,
    auctionDate: result.summary?.auctionDate || new Date().toLocaleDateString('ru-RU'),
    procurementNumber: result.submissionRulesCheck?.procedureType || result.summary?.procurementNumber || '223-ФЗ',
    status: result.summary?.status || 'На рассмотрении',
    participationStatus: 'NEW',
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

export async function getUserCustomersFromDb(userId: string): Promise<SavedCustomer[]> {
  try {
    const custRef = collection(db, 'customers');
    const q = query(custRef, where('userId', '==', userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({
      id: d.id,
      ...d.data()
    })) as SavedCustomer[];
  } catch (err) {
    console.warn('Error fetching customers:', err);
    return [];
  }
}

export async function deleteAnalysisFromDb(analysisId: string): Promise<void> {
  const docRef = doc(db, 'analyses', analysisId);
  await deleteDoc(docRef);
}

export async function updateAnalysisInDb(analysisId: string, updates: Partial<SavedAnalysis>): Promise<void> {
  const docRef = doc(db, 'analyses', analysisId);
  await updateDoc(docRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

export async function toggleFavoriteAnalysisInDb(analysisId: string, currentStatus: boolean): Promise<void> {
  const docRef = doc(db, 'analyses', analysisId);
  await updateDoc(docRef, {
    isFavorite: !currentStatus,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteCustomerFromDb(customerId: string): Promise<void> {
  const docRef = doc(db, 'customers', customerId);
  await deleteDoc(docRef);
}

export async function deleteSelectedAnalysesFromDb(analysisIds: string[]): Promise<void> {
  const promises = analysisIds.map(id => {
    if (id && !id.startsWith('sample-')) {
      return deleteDoc(doc(db, 'analyses', id));
    }
    return Promise.resolve();
  });
  await Promise.all(promises);
}

export async function deleteAllUserAnalysesFromDb(userId: string): Promise<void> {
  const collectionRef = collection(db, 'analyses');
  const q = query(collectionRef, where('userId', '==', userId));
  const snapshot = await getDocs(q);
  const promises = snapshot.docs.map(docSnap => deleteDoc(docSnap.ref));
  await Promise.all(promises);
}

