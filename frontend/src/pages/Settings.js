import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, Button, Alert, LoadingSpinner } from '../components';
import useAuthStore from '../store/authStore';
import { useTheme } from '../context/ThemeContext';
import notificationService from '../services/notificationService';
import api from '../services/api';

const Settings = React.memo(() => {  const { user, updateUser } = useAuthStore();
  const { theme, setTheme } = useTheme();
  
  // Memoize initial settings to prevent unnecessary re-renders
  const initialSettings = useMemo(() => ({
    notifications: {
      email: true,
      push: true,
      reminderMinutes: 15
    },
    preferences: {
      theme: theme,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      lateLoggingWindow: 240, // 4 hours in minutes
      autoMarkMissed: true
    },
    privacy: {
      shareData: false,
      analytics: true
    }
  }), [theme]);
  
  const [settings, setSettings] = useState(initialSettings);
    const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState('success');  const [pushSupported, setPushSupported] = useState(false);
  const [pushSubscribed, setPushSubscribed] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState('default');
  const [subscriptionChecked, setSubscriptionChecked] = useState(false);

  // Memoized function to check push subscription status with error handling
  const checkPushSubscription = useCallback(async () => {
    if (subscriptionChecked) return; // Prevent multiple checks
    
    try {
      const subscription = await notificationService.getPushSubscription();
      setPushSubscribed(!!subscription);
      setSubscriptionChecked(true);
    } catch (error) {
      console.error('Failed to check push subscription:', error);
      setPushSubscribed(false);
      setSubscriptionChecked(true);
    }
  }, [subscriptionChecked]);
  useEffect(() => {
    let isMounted = true;
    
    // Load user settings if available
    if (user?.settings) {
      setSettings(prev => ({ ...prev, ...user.settings }));
    }
    
    // Check push notification support and permission
    const pushSupport = notificationService.isPushSupported();
    setPushSupported(pushSupport);
    
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
    
    // Check current push subscription only if supported and component is mounted
    if (pushSupport && isMounted && !subscriptionChecked) {
      checkPushSubscription();
    }
    
    return () => {
      isMounted = false;
    };
  }, [user, checkPushSubscription, subscriptionChecked]);// Memoized function to handle setting changes
  const handleSettingChange = useCallback((section, key, value) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }));

    // Update theme immediately when changed
    if (section === 'preferences' && key === 'theme') {
      setTheme(value);
    }
  }, [setTheme]);  // Optimized push toggle handler with batched state updates
  const handlePushToggle = useCallback(async () => {
    if (!pushSupported) {
      setMessage('Push notifications are not supported in this browser.');
      setMessageType('error');
      return;
    }

    setLoading(true);
    setMessage(null); // Clear previous messages
    
    try {
      if (settings.notifications.push && pushSubscribed) {
        // Unsubscribe from push notifications
        await notificationService.unsubscribeFromPush();
        
        // Batch state updates
        setPushSubscribed(false);
        setSubscriptionChecked(false); // Allow re-checking
        handleSettingChange('notifications', 'push', false);
        setMessage('Unsubscribed from push notifications');
        setMessageType('success');
      } else {
        // Request permission first
        const permission = await notificationService.requestPermission();
        if (!permission) {
          setMessage('Notification permission denied. Please enable in browser settings.');
          setMessageType('error');
          return;
        }

        // Subscribe to push notifications
        const result = await notificationService.subscribeToPush();
        console.log('Push subscription result:', result);
        
        // Batch state updates
        setPushSubscribed(true);
        setSubscriptionChecked(false); // Allow re-checking to confirm
        handleSettingChange('notifications', 'push', true);
        setMessage('Successfully subscribed to push notifications');
        setMessageType('success');
        setNotificationPermission('granted');
      }
    } catch (error) {
      console.error('Push toggle error:', error);
      setMessage('Failed to update push notification settings: ' + error.message);
      setMessageType('error');
      handleSettingChange('notifications', 'push', false);
      setPushSubscribed(false);
      setSubscriptionChecked(false); // Allow retry
    } finally {
      setLoading(false);
    }
  }, [pushSupported, settings.notifications.push, pushSubscribed, handleSettingChange]);// Memoized test notification handler
  const handleTestNotification = useCallback(async (type) => {
    try {
      setLoading(true);
      setMessage(null); // Clear previous messages
      
      if (type === 'email' && !settings.notifications.email) {
        setMessage('📧 Email medication reminders are disabled. Please enable them first.');
        setMessageType('error');
        return;
      }
      
      if (type === 'push' && !settings.notifications.push) {
        setMessage('📱 Push medication reminders are disabled. Please enable them first.');
        setMessageType('error');
        return;
      }

      // Send test notification via API
      const response = await api.post('/notifications/test', { type });
      
      if (response.status === 200) {
        if (type === 'email') {
          setMessage(`📧 Test email medication reminder sent successfully! Check your inbox.`);
        } else {
          setMessage(`📱 Test push medication reminder sent successfully! Check your notifications.`);
        }
        setMessageType('success');
      } else {
        throw new Error('Failed to send test notification');
      }
    } catch (error) {
      console.error('Test notification failed:', error);
      setMessage(`Failed to send test ${type} notification: ${error.response?.data?.message || error.message}`);
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  }, [settings.notifications.email, settings.notifications.push]);
  // Memoized save settings handler
  const handleSaveSettings = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    
    try {
      // Save settings to user profile
      await updateUser({ settings });
      
      // Apply settings
      setTheme(settings.preferences.theme);
      
      setMessage('Settings saved successfully!');
      setMessageType('success');
    } catch (error) {
      console.error('Save settings error:', error);
      setMessage('Failed to save settings. Please try again.');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  }, [updateUser, settings, setTheme]);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 dark:bg-gray-900">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Manage your account settings and preferences
        </p>
      </div>

      {message && (
        <Alert type={messageType} message={message} className="mb-6" />
      )}

      <div className="space-y-6">
        {/* Notification Settings */}        <Card className="p-6 dark:bg-gray-800">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            🔔 Medication Reminders
          </h2>
          
          <div className="space-y-4">            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  📧 Email Medication Reminders
                </label>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Receive medication reminders and dose schedules via email
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleSettingChange('notifications', 'email', !settings.notifications.email)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.notifications.email ? 'bg-medical-600' : 'bg-gray-200 dark:bg-gray-700'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.notifications.email ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  📱 Push Medication Reminders
                </label>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Receive instant medication reminders on your device
                  {!pushSupported && <span className="text-red-500"> (Not supported in this browser)</span>}
                  {pushSupported && notificationPermission === 'granted' && pushSubscribed && <span className="text-green-500"> (✅ Active)</span>}
                  {pushSupported && notificationPermission === 'denied' && <span className="text-red-500"> (❌ Permission denied)</span>}
                </p>
              </div>
              <button
                type="button"
                disabled={!pushSupported || loading}
                onClick={handlePushToggle}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.notifications.push && pushSubscribed ? 'bg-medical-600' : 'bg-gray-200 dark:bg-gray-700'
                } ${!pushSupported || loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.notifications.push && pushSubscribed ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>            {/* Test Notifications */}
            <div className="border-t pt-4 mt-4">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                🧪 Test Medication Reminders
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                Send test notifications to verify your medication reminder setup is working correctly.
              </p>
              <div className="flex space-x-3">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleTestNotification('email')}
                  disabled={loading || !settings.notifications.email}
                  className="text-xs flex items-center gap-1"
                >
                  📧 Test Email Reminder
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleTestNotification('push')}
                  disabled={loading || !settings.notifications.push || !pushSubscribed}
                  className="text-xs flex items-center gap-1"
                >
                  📱 Test Push Reminder
                </Button>
              </div>
              {(!settings.notifications.email || (!settings.notifications.push || !pushSubscribed)) && (
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                  💡 Enable the notification types above to test them
                </p>
              )}
            </div>            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                ⏰ Early Reminder Time
              </label>
              <select
                value={settings.notifications.reminderMinutes}
                onChange={(e) => handleSettingChange('notifications', 'reminderMinutes', parseInt(e.target.value))}
                className="w-48 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-medical-500 dark:bg-gray-700 dark:text-white"
              >
                <option value={5}>5 minutes before dose</option>
                <option value={10}>10 minutes before dose</option>
                <option value={15}>15 minutes before dose</option>
                <option value={30}>30 minutes before dose</option>
                <option value={60}>1 hour before dose</option>
              </select>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                How early to send reminders before your scheduled medication times
              </p>
            </div>
          </div>
        </Card>

        {/* App Preferences */}
        <Card className="p-6 dark:bg-gray-800">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">App Preferences</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Theme</label>
              <select
                value={settings.preferences.theme}
                onChange={(e) => handleSettingChange('preferences', 'theme', e.target.value)}
                className="w-48 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-medical-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="auto">Auto (System)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Late Logging Window (hours)
              </label>
              <select
                value={settings.preferences.lateLoggingWindow}
                onChange={(e) => handleSettingChange('preferences', 'lateLoggingWindow', parseInt(e.target.value))}
                className="w-48 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-medical-500 dark:bg-gray-700 dark:text-white"
              >
                <option value={60}>1 hour</option>
                <option value={120}>2 hours</option>
                <option value={240}>4 hours</option>
                <option value={480}>8 hours</option>
                <option value={720}>12 hours</option>
              </select>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                How long after a missed dose you can still log it as late
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Auto-mark as Missed</label>
                <p className="text-sm text-gray-500 dark:text-gray-400">Automatically mark doses as missed after the late window</p>
              </div>
              <button
                type="button"
                onClick={() => handleSettingChange('preferences', 'autoMarkMissed', !settings.preferences.autoMarkMissed)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.preferences.autoMarkMissed ? 'bg-medical-600' : 'bg-gray-200 dark:bg-gray-700'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.preferences.autoMarkMissed ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </Card>

        {/* Privacy Settings */}
        <Card className="p-6 dark:bg-gray-800">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Privacy</h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Share Anonymous Data</label>
                <p className="text-sm text-gray-500 dark:text-gray-400">Help improve the app by sharing anonymized usage data</p>
              </div>
              <button
                type="button"
                onClick={() => handleSettingChange('privacy', 'shareData', !settings.privacy.shareData)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.privacy.shareData ? 'bg-medical-600' : 'bg-gray-200 dark:bg-gray-700'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.privacy.shareData ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Analytics</label>
                <p className="text-sm text-gray-500 dark:text-gray-400">Allow analytics to help us understand app usage</p>
              </div>
              <button
                type="button"
                onClick={() => handleSettingChange('privacy', 'analytics', !settings.privacy.analytics)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.privacy.analytics ? 'bg-medical-600' : 'bg-gray-200 dark:bg-gray-700'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.privacy.analytics ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </Card>

        {/* Account Info */}
        <Card className="p-6 dark:bg-gray-800">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Account Information</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
              <p className="text-sm text-gray-900 dark:text-gray-100">{user?.email || 'Not provided'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
              <p className="text-sm text-gray-900 dark:text-gray-100">{user?.name || 'Not provided'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Member Since</label>
              <p className="text-sm text-gray-900 dark:text-gray-100">
                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Not available'}
              </p>
            </div>
          </div>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button
            onClick={handleSaveSettings}
            disabled={loading}
            className="px-6 py-2"
          >
            {loading ? <LoadingSpinner size="sm" /> : 'Save Settings'}
          </Button>
        </div>
      </div>    </div>
  );
});

Settings.displayName = 'Settings';

export default Settings;
