// Firebase Cloud Function for daily hadith rotation
const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
admin.initializeApp();

// Schedule daily hadith rotation at midnight every day
exports.scheduleDailyHadith = functions.pubsub
  .schedule('0 0 * * *') // Every day at midnight
  .timeZone('UTC')
  .onRun(async (context) => {
    try {
      console.log('🚀 Starting daily hadith scheduling...');
      
      const db = admin.firestore();
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];
      
      // Check if tomorrow's hadith is already scheduled
      const existingSchedule = await db
        .collection('dailyHadithSchedule')
        .where('date', '==', tomorrowStr)
        .limit(1)
        .get();
      
      if (!existingSchedule.empty) {
        console.log(`ℹ️ Hadith already scheduled for ${tomorrowStr}`);
        return null;
      }
      
      // Get all active hadiths
      const hadithsSnapshot = await db
        .collection('hadiths')
        .where('isActive', '==', true)
        .get();
      
      if (hadithsSnapshot.empty) {
        console.log('❌ No active hadiths found');
        return null;
      }
      
      // Select a random hadith
      const hadiths = hadithsSnapshot.docs;
      const randomIndex = Math.floor(Math.random() * hadiths.length);
      const selectedHadith = hadiths[randomIndex];
      
      // Create schedule for tomorrow
      await db.collection('dailyHadithSchedule').add({
        date: tomorrowStr,
        hadithId: selectedHadith.id,
        featured: true,
        sent: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      console.log(`✅ Daily hadith scheduled for ${tomorrowStr}: Hadith ID ${selectedHadith.id}`);
      
      // Optional: Send notification to users (if you have notification system)
      // await sendDailyHadithNotification(selectedHadith);
      
      return null;
    } catch (error) {
      console.error('❌ Error scheduling daily hadith:', error);
      return null;
    }
  });

// Function to get today's hadith
exports.getTodayHadith = functions.https.onCall(async (data, context) => {
  try {
    const db = admin.firestore();
    const todayStr = new Date().toISOString().split('T')[0];
    
    // Get today's scheduled hadith
    const scheduleSnapshot = await db
      .collection('dailyHadithSchedule')
      .where('date', '==', todayStr)
      .limit(1)
      .get();
    
    if (!scheduleSnapshot.empty) {
      const scheduleDoc = scheduleSnapshot.docs[0];
      const scheduleData = scheduleDoc.data();
      
      // Get the hadith details
      const hadithDoc = await db
        .collection('hadiths')
        .doc(scheduleData.hadithId)
        .get();
      
      if (hadithDoc.exists) {
        return {
          success: true,
          hadith: {
            id: hadithDoc.id,
            ...hadithDoc.data()
          },
          schedule: {
            id: scheduleDoc.id,
            ...scheduleData
          }
        };
      }
    }
    
    // Fallback to random hadith if no schedule found
    const hadithsSnapshot = await db
      .collection('hadiths')
      .where('isActive', '==', true)
      .limit(10)
      .get();
    
    if (!hadithsSnapshot.empty) {
      const hadiths = hadithsSnapshot.docs;
      const randomDoc = hadiths[Math.floor(Math.random() * hadiths.length)];
      
      return {
        success: true,
        hadith: {
          id: randomDoc.id,
          ...randomDoc.data()
        },
        schedule: null
      };
    }
    
    return {
      success: false,
      error: 'No hadiths found'
    };
  } catch (error) {
    console.error('❌ Error getting today\'s hadith:', error);
    return {
      success: false,
      error: error.message
    };
  }
});

// Function to refresh daily hadith manually
exports.refreshDailyHadith = functions.https.onCall(async (data, context) => {
  try {
    const db = admin.firestore();
    const todayStr = new Date().toISOString().split('T')[0];
    
    // Get all active hadiths
    const hadithsSnapshot = await db
      .collection('hadiths')
      .where('isActive', '==', true)
      .get();
    
    if (hadithsSnapshot.empty) {
      return {
        success: false,
        error: 'No active hadiths found'
      };
    }
    
    // Select a random hadith
    const hadiths = hadithsSnapshot.docs;
    const randomIndex = Math.floor(Math.random() * hadiths.length);
    const selectedHadith = hadiths[randomIndex];
    
    // Update or create today's schedule
    const existingSchedule = await db
      .collection('dailyHadithSchedule')
      .where('date', '==', todayStr)
      .limit(1)
      .get();
    
    if (!existingSchedule.empty) {
      // Update existing schedule
      await existingSchedule.docs[0].ref.update({
        hadithId: selectedHadith.id,
        featured: true,
        sent: false,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    } else {
      // Create new schedule
      await db.collection('dailyHadithSchedule').add({
        date: todayStr,
        hadithId: selectedHadith.id,
        featured: true,
        sent: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }
    
    return {
      success: true,
      hadith: {
        id: selectedHadith.id,
        ...selectedHadith.data()
      }
    };
  } catch (error) {
    console.error('❌ Error refreshing daily hadith:', error);
    return {
      success: false,
      error: error.message
    };
  }
});

// Function to add a new hadith (admin only)
exports.addHadith = functions.https.onCall(async (data, context) => {
  // Check if user is admin (you'll need to implement admin verification)
  if (!context.auth) {
    return {
      success: false,
      error: 'Authentication required'
    };
  }
  
  try {
    const db = admin.firestore();
    const hadithData = {
      ...data.hadith,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      isActive: data.hadith.isActive !== false // Default to true
    };
    
    const docRef = await db.collection('hadiths').add(hadithData);
    
    return {
      success: true,
      hadithId: docRef.id
    };
  } catch (error) {
    console.error('❌ Error adding hadith:', error);
    return {
      success: false,
      error: error.message
    };
  }
});

// Function to update a hadith (admin only)
exports.updateHadith = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    return {
      success: false,
      error: 'Authentication required'
    };
  }
  
  try {
    const db = admin.firestore();
    const { hadithId, updateData } = data;
    
    await db.collection('hadiths').doc(hadithId).update({
      ...updateData,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    return {
      success: true
    };
  } catch (error) {
    console.error('❌ Error updating hadith:', error);
    return {
      success: false,
      error: error.message
    };
  }
});

// Function to delete a hadith (admin only)
exports.deleteHadith = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    return {
      success: false,
      error: 'Authentication required'
    };
  }
  
  try {
    const db = admin.firestore();
    const { hadithId } = data;
    
    await db.collection('hadiths').doc(hadithId).delete();
    
    return {
      success: true
    };
  } catch (error) {
    console.error('❌ Error deleting hadith:', error);
    return {
      success: false,
      error: error.message
    };
  }
});

// Function to get hadith statistics
exports.getHadithStats = functions.https.onCall(async (data, context) => {
  try {
    const db = admin.firestore();
    
    // Get total hadiths
    const totalSnapshot = await db.collection('hadiths').get();
    const totalHadiths = totalSnapshot.size;
    
    // Get active hadiths
    const activeSnapshot = await db.collection('hadiths').where('isActive', '==', true).get();
    const activeHadiths = activeSnapshot.size;
    
    // Get category breakdown
    const categorySnapshot = await db.collection('hadiths').get();
    const categories = {};
    categorySnapshot.forEach(doc => {
      const category = doc.data().category;
      categories[category] = (categories[category] || 0) + 1;
    });
    
    // Get difficulty breakdown
    const difficulties = {};
    categorySnapshot.forEach(doc => {
      const difficulty = doc.data().difficulty;
      difficulties[difficulty] = (difficulties[difficulty] || 0) + 1;
    });
    
    return {
      success: true,
      stats: {
        totalHadiths,
        activeHadiths,
        categories,
        difficulties
      }
    };
  } catch (error) {
    console.error('❌ Error getting hadith stats:', error);
    return {
      success: false,
      error: error.message
    };
  }
});
