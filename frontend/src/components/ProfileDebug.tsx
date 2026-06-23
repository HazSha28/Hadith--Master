import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

const ProfileDebug = () => {
  const { currentUser, profile } = useAuth();
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const checkProfile = async () => {
    if (!currentUser) {
      setDebugInfo({ error: 'No current user' });
      return;
    }

    setLoading(true);
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      const docSnap = await getDoc(userRef);
      
      if (docSnap.exists()) {
        setDebugInfo({
          exists: true,
          data: docSnap.data(),
          id: docSnap.id
        });
      } else {
        setDebugInfo({
          exists: false,
          message: 'Profile does not exist in Firestore'
        });
      }
    } catch (error) {
      setDebugInfo({
        error: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkProfile();
  }, [currentUser]);

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Profile Debug Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <strong>Current User:</strong> {currentUser ? currentUser.uid : 'None'}
          </div>
          <div>
            <strong>Current User Email:</strong> {currentUser?.email || 'None'}
          </div>
          <div>
            <strong>Auth Profile:</strong> {profile ? 'Loaded' : 'Not Loaded'}
          </div>
          
          {profile && (
            <div>
              <strong>Profile Data:</strong>
              <pre className="bg-gray-100 p-2 rounded mt-2 text-sm">
                {JSON.stringify(profile, null, 2)}
              </pre>
            </div>
          )}

          <Button onClick={checkProfile} disabled={loading}>
            {loading ? 'Checking...' : 'Check Firestore Profile'}
          </Button>

          {debugInfo && (
            <div>
              <strong>Firestore Check:</strong>
              <pre className="bg-gray-100 p-2 rounded mt-2 text-sm">
                {JSON.stringify(debugInfo, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfileDebug;
