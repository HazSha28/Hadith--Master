import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  setDoc,
  query, 
  where, 
  orderBy, 
  limit,
  Timestamp,
  addDoc,
  serverTimestamp,
  arrayUnion
} from 'firebase/firestore';
import { db } from '../firebase';
import { ADMIN_CONFIG } from '../config/adminConfig';

export interface UserApproval {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  createdAt: Timestamp;
  lastLoginAt?: Timestamp;
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  role: 'user' | 'scholar' | 'admin';
  requestedRole?: 'scholar' | 'admin';
  rejectionReason?: string;
  approvedBy?: string;
  approvedAt?: Timestamp;
  preferences?: {
    theme?: 'light' | 'dark';
    notifications?: boolean;
  };
}

export interface ScholarComment {
  id: string;
  hadithId: string;
  userId: string;
  userEmail: string;
  userName: string;
  content: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Timestamp;
  approvedBy?: string;
  approvedAt?: Timestamp;
  rejectionReason?: string;
  likes?: number;
  replies?: number;
}

export interface AdminUser {
  uid: string;
  email: string;
  displayName?: string;
  role: 'admin';
  permissions: string[];
}

const ADMIN_UIDS = ADMIN_CONFIG.ADMIN_UIDS;

export const isAdmin = async (uid: string): Promise<boolean> => {
  try {
    // Check if user exists in admins collection
    const adminRef = doc(db, 'admins', uid);
    const adminDoc = await getDoc(adminRef);
    
    if (adminDoc.exists()) {
      return true;
    }
    
    // Fallback: Check user role in users collection
    const userRef = doc(db, 'users', uid);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      const userData = userDoc.data() as UserApproval;
      return userData.role === 'admin';
    }
    
    return false;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
};

export const getAllUsers = async (): Promise<UserApproval[]> => {
  try {
    const usersRef = collection(db, 'users');
    const snapshot = await getDocs(usersRef);
    
    return snapshot.docs.map(doc => ({
      uid: doc.id,
      ...doc.data()
    } as UserApproval));
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
};

export const getPendingUsers = async (): Promise<UserApproval[]> => {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('status', '==', 'pending'));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      uid: doc.id,
      ...doc.data()
    } as UserApproval));
  } catch (error) {
    console.error('Error fetching pending users:', error);
    throw error;
  }
};

export const approveUser = async (uid: string, approvedBy: string): Promise<void> => {
  try {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      status: 'approved',
      approvedBy,
      approvedAt: serverTimestamp(),
      lastLoginAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error approving user:', error);
    throw error;
  }
};

export const rejectUser = async (uid: string, reason: string, rejectedBy: string): Promise<void> => {
  try {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      status: 'rejected',
      rejectionReason: reason,
      approvedBy: rejectedBy,
      approvedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error rejecting user:', error);
    throw error;
  }
};

export const suspendUser = async (uid: string, reason: string, suspendedBy: string): Promise<void> => {
  try {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      status: 'suspended',
      rejectionReason: reason,
      approvedBy: suspendedBy,
      approvedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error suspending user:', error);
    throw error;
  }
};

export const updateUserRole = async (uid: string, role: 'user' | 'scholar' | 'admin', updatedBy: string): Promise<void> => {
  try {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      role,
      approvedBy: updatedBy,
      approvedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating user role:', error);
    throw error;
  }
};

export const getScholarComments = async (): Promise<ScholarComment[]> => {
  try {
    const commentsRef = collection(db, 'scholarComments');
    const q = query(commentsRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as ScholarComment));
  } catch (error) {
    console.error('Error fetching scholar comments:', error);
    throw error;
  }
};

export const getPendingComments = async (): Promise<ScholarComment[]> => {
  try {
    const commentsRef = collection(db, 'scholarComments');
    const q = query(commentsRef, where('status', '==', 'pending'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as ScholarComment));
  } catch (error) {
    console.error('Error fetching pending comments:', error);
    throw error;
  }
};

export const approveComment = async (commentId: string, approvedBy: string): Promise<void> => {
  try {
    const commentRef = doc(db, 'scholarComments', commentId);
    await updateDoc(commentRef, {
      status: 'approved',
      approvedBy,
      approvedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error approving comment:', error);
    throw error;
  }
};

export const rejectComment = async (commentId: string, reason: string, rejectedBy: string): Promise<void> => {
  try {
    const commentRef = doc(db, 'scholarComments', commentId);
    await updateDoc(commentRef, {
      status: 'rejected',
      rejectionReason: reason,
      approvedBy: rejectedBy,
      approvedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error rejecting comment:', error);
    throw error;
  }
};

export const deleteComment = async (commentId: string): Promise<void> => {
  try {
    const commentRef = doc(db, 'scholarComments', commentId);
    await deleteDoc(commentRef);
  } catch (error) {
    console.error('Error deleting comment:', error);
    throw error;
  }
};

export const getAdminStats = async () => {
  try {
    const usersRef = collection(db, 'users');
    const commentsRef = collection(db, 'scholarComments');
    
    const [usersSnapshot, commentsSnapshot] = await Promise.all([
      getDocs(usersRef),
      getDocs(commentsRef)
    ]);
    
    const users = usersSnapshot.docs.map(doc => doc.data() as UserApproval);
    const comments = commentsSnapshot.docs.map(doc => doc.data() as ScholarComment);
    
    return {
      totalUsers: users.length,
      pendingUsers: users.filter(u => u.status === 'pending').length,
      approvedUsers: users.filter(u => u.status === 'approved').length,
      suspendedUsers: users.filter(u => u.status === 'suspended').length,
      totalScholars: users.filter(u => u.role === 'scholar').length,
      totalComments: comments.length,
      pendingComments: comments.filter(c => c.status === 'pending').length,
      approvedComments: comments.filter(c => c.status === 'approved').length,
      rejectedComments: comments.filter(c => c.status === 'rejected').length
    };
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    throw error;
  }
};

// Admin collection management
export const addAdmin = async (uid: string, email: string, displayName?: string): Promise<void> => {
  try {
    const adminRef = doc(db, 'admins', uid);
    await setDoc(adminRef, {
      uid,
      email,
      displayName,
      role: 'admin',
      createdAt: serverTimestamp(),
      addedBy: uid // Self-added or by existing admin
    });
  } catch (error) {
    console.error('Error adding admin:', error);
    throw error;
  }
};

export const removeAdmin = async (uid: string): Promise<void> => {
  try {
    const adminRef = doc(db, 'admins', uid);
    await deleteDoc(adminRef);
  } catch (error) {
    console.error('Error removing admin:', error);
    throw error;
  }
};

export const getAllAdmins = async (): Promise<AdminUser[]> => {
  try {
    const adminsRef = collection(db, 'admins');
    const snapshot = await getDocs(adminsRef);
    
    return snapshot.docs.map(doc => ({
      uid: doc.id,
      ...doc.data()
    } as AdminUser));
  } catch (error) {
    console.error('Error fetching admins:', error);
    throw error;
  }
};
