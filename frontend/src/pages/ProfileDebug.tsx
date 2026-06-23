import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Header } from '@/components/Header';
import { User } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase';

const ProfileDebug: React.FC = () => {
  const { currentUser, profile, loading } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [firestoreDoc, setFirestoreDoc] = useState<any>(null);

  useEffect(() => {
    console.log('Profile Debug - Current User:', currentUser);
    console.log('Profile Debug - Profile:', profile);
    console.log('Profile Debug - Loading:', loading);
  }, [currentUser, profile, loading]);

  const checkFirestoreDoc = async () => {
    if (!currentUser) return;
    
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      const docSnap = await getDoc(userRef);
      
      if (docSnap.exists()) {
        setFirestoreDoc(docSnap.data());
        console.log('Firestore document exists:', docSnap.data());
      } else {
        setFirestoreDoc(null);
        console.log('No Firestore document found for user:', currentUser.uid);
      }
    } catch (err) {
      console.error('Error checking Firestore:', err);
      setError(`Firestore error: ${err}`);
    }
  };

  useEffect(() => {
    if (currentUser) {
      checkFirestoreDoc();
    }
  }, [currentUser]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto p-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Not Logged In</h1>
            <p className="text-muted-foreground">Please log in to view your profile.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-6 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile Debug Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Current User Info:</h3>
              <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
                {JSON.stringify(currentUser, null, 2)}
              </pre>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">Profile Info (from AuthContext):</h3>
              <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
                {JSON.stringify(profile, null, 2)}
              </pre>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Raw Firestore Document:</h3>
              <pre className="bg-blue-100 p-4 rounded text-sm overflow-auto">
                {JSON.stringify(firestoreDoc, null, 2)}
              </pre>
            </div>

            {error && (
              <div>
                <h3 className="font-semibold mb-2 text-red-600">Error:</h3>
                <pre className="bg-red-100 p-4 rounded text-sm overflow-auto text-red-800">
                  {error}
                </pre>
              </div>
            )}

            <Button onClick={checkFirestoreDoc} className="mt-4">
              Refresh Firestore Check
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProfileDebug;
