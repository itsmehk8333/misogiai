// Service worker for push notifications
self.addEventListener('push', event => {
  console.log('Push event received:', event);

  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: 'Medication Reminder', body: event.data.text() };
    }
  }

  const options = {
    body: data.body || 'Time to take your medication',
    icon: data.icon || '/medication-icon.png',
    badge: data.badge || '/medication-badge.png',
    tag: data.tag || 'medication-reminder',
    data: data.data || {},
    actions: [
      {
        action: 'mark-taken',
        title: 'Mark as Taken',
        icon: '/check-icon.png'
      },
      {
        action: 'snooze',
        title: 'Remind Later',
        icon: '/snooze-icon.png'
      }
    ],
    requireInteraction: true,
    silent: false
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Medication Reminder', options)
  );
});

self.addEventListener('notificationclick', event => {
  console.log('Notification clicked:', event);

  event.notification.close();

  if (event.action === 'mark-taken') {
    // Handle marking dose as taken
    event.waitUntil(
      clients.openWindow('/dose-logging?action=mark-taken&doseId=' + event.notification.data.doseId)
    );
  } else if (event.action === 'snooze') {
    // Handle snoozing the reminder
    event.waitUntil(
      fetch('/api/notifications/snooze', {
        method: 'POST',
        body: JSON.stringify({
          doseId: event.notification.data.doseId,
          minutes: 15
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      })
    );
  } else {
    // Default action - open the app
    event.waitUntil(
      clients.openWindow('/dose-logging')
    );
  }
});

self.addEventListener('notificationclose', event => {
  console.log('Notification closed:', event);
  // Track notification dismissal if needed
});

// Handle background sync for offline functionality
self.addEventListener('sync', event => {
  if (event.tag === 'dose-sync') {
    event.waitUntil(syncDoses());
  }
});

async function syncDoses() {
  // Sync any pending dose logs when back online
  try {
    const pendingDoses = await getFromIndexedDB('pendingDoses');
    for (const dose of pendingDoses) {
      await fetch('/api/doses', {
        method: 'POST',
        body: JSON.stringify(dose),
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
    await clearFromIndexedDB('pendingDoses');
  } catch (error) {
    console.error('Dose sync failed:', error);
  }
}

// Simple IndexedDB helpers
async function getFromIndexedDB(storeName) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('MedicationApp', 1);
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const getRequest = store.getAll();
      getRequest.onsuccess = () => resolve(getRequest.result);
      getRequest.onerror = () => reject(getRequest.error);
    };
    request.onerror = () => reject(request.error);
  });
}

async function clearFromIndexedDB(storeName) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('MedicationApp', 1);
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const clearRequest = store.clear();
      clearRequest.onsuccess = () => resolve();
      clearRequest.onerror = () => reject(clearRequest.error);
    };
    request.onerror = () => reject(request.error);
  });
}
