import { apiClient, handleApiResponse, handleApiError } from './api';

export const calendarService = {
  // Initialize Google Calendar integration
  initializeGoogleCalendar: async () => {
    try {
      const response = await apiClient.post('/calendar/google/init');
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Get Google Calendar auth URL
  getAuthUrl: async () => {
    try {
      const response = await apiClient.get('/calendar/google/auth-url');
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Handle OAuth callback
  handleCallback: async (code) => {
    try {
      const response = await apiClient.post('/calendar/google/callback', { code });
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Check calendar connection status
  getConnectionStatus: async () => {
    try {
      const response = await apiClient.get('/calendar/status');
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Sync medication schedule to Google Calendar
  syncScheduleToCalendar: async (regimenId) => {
    try {
      const response = await apiClient.post(`/calendar/sync-regimen/${regimenId}`);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Sync all active regimens to calendar
  syncAllRegimens: async () => {
    try {
      const response = await apiClient.post('/calendar/sync-all');
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Remove regimen from calendar
  removeFromCalendar: async (regimenId) => {
    try {
      const response = await apiClient.delete(`/calendar/regimen/${regimenId}`);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Update calendar event
  updateCalendarEvent: async (regimenId, updates) => {
    try {
      const response = await apiClient.patch(`/calendar/regimen/${regimenId}`, updates);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Get calendar settings
  getCalendarSettings: async () => {
    try {
      const response = await apiClient.get('/calendar/settings');
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Update calendar settings
  updateCalendarSettings: async (settings) => {
    try {
      const response = await apiClient.put('/calendar/settings', settings);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Disconnect calendar
  disconnectCalendar: async () => {
    try {
      const response = await apiClient.delete('/calendar/disconnect');
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Create a one-time calendar event for missed dose makeup
  createMakeupEvent: async (doseData, newTime) => {
    try {
      const response = await apiClient.post('/calendar/makeup-event', {
        dose: doseData,
        scheduledTime: newTime
      });
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Export medication schedule as iCal file
  exportAsIcal: async (regimenIds = []) => {
    try {
      const response = await apiClient.get('/calendar/export/ical', {
        params: { regimens: regimenIds.join(',') },
        responseType: 'blob'
      });
      
      // Create download link
      const blob = new Blob([response.data], { type: 'text/calendar' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'medication-schedule.ics';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      return { success: true, message: 'Calendar file downloaded successfully' };
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Get upcoming calendar events
  getUpcomingEvents: async (days = 7) => {
    try {
      const response = await apiClient.get('/calendar/upcoming', {
        params: { days }
      });
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }
};

export default calendarService;
