import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, LoadingSpinner, Alert, AdherenceDashboard } from '../components';
import { reportService } from '../services/reportService';

const AdherenceReports = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [adherenceData, setAdherenceData] = useState(null);
  const [period, setPeriod] = useState('month');

  useEffect(() => {
    fetchReportData();
  }, [period]);

  const fetchReportData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Only fetch adherence stats for now
      const adherenceStats = await reportService.getAdherenceStats(period);
      setAdherenceData(adherenceStats);
    } catch (err) {
      console.error('Failed to fetch report data:', err);
      setError('Unable to load adherence reports. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handlePeriodChange = (newPeriod) => {
    setPeriod(newPeriod);
  };

  const getPeriodLabel = () => {
    switch (period) {
      case 'week': return 'Last 7 Days';
      case 'month': return 'Last 30 Days';
      case 'year': return 'Last 12 Months';
      default: return 'Last 30 Days';
    }
  };
  const getAdherenceColor = (rate) => {
    if (rate >= 90) return 'text-green-600 dark:text-green-400';
    if (rate >= 70) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getAdherenceBgColor = (rate) => {
    if (rate >= 90) return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700';
    if (rate >= 70) return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700';
    return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700';
  };
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-medical-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-medical-600 dark:text-medical-400 font-medium">Loading adherence reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-medical-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Adherence Reports</h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2">Track your medication adherence over time</p>
            </div>
            <Button 
              variant="outline" 
              onClick={() => navigate('/dashboard')}
              className="flex items-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Dashboard
            </Button>
          </div>
        </div>

        {/* Period Selector */}
        <div className="mb-6">
          <div className="flex space-x-2">
            {['week', 'month', 'year'].map((p) => (
              <button
                key={p}
                onClick={() => handlePeriodChange(p)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  period === p
                    ? 'bg-medical-600 text-white'
                    : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-medical-50 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600'
                }`}
              >
                {p === 'week' ? 'Last 7 Days' : p === 'month' ? 'Last 30 Days' : 'Last Year'}
              </button>
            ))}
          </div>
        </div>

        {/* Adherence Dashboard */}
        <div className="mb-8">
          <AdherenceDashboard />
        </div>

        {error ? (
          <Alert type="error" className="mb-6">
            {error}
            <button 
              onClick={fetchReportData}
              className="ml-4 text-red-700 dark:text-red-400 underline hover:text-red-800 dark:hover:text-red-300"
            >
              Try Again
            </button>
          </Alert>
        ) : adherenceData ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {/* Overall Adherence */}
            <Card className={`p-6 border-2 ${getAdherenceBgColor(adherenceData.overallAdherence || 0)}`}>
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">Overall Adherence</h3>
                <div className={`text-5xl font-bold ${getAdherenceColor(adherenceData.overallAdherence || 0)} mb-2`}>
                  {adherenceData.overallAdherence || 0}%
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{getPeriodLabel()}</p>
                {adherenceData.adherenceTrend !== undefined && (
                  <div className={`mt-2 text-sm ${
                    adherenceData.adherenceTrend > 0 ? 'text-green-600 dark:text-green-400' : 
                    adherenceData.adherenceTrend < 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-400'
                  }`}>
                    {adherenceData.adherenceTrend > 0 ? '↑' : adherenceData.adherenceTrend < 0 ? '↓' : '→'} 
                    {Math.abs(adherenceData.adherenceTrend)}% from previous period
                  </div>
                )}
              </div>
            </Card>

            {/* Doses Taken */}
            <Card className="p-6 bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-700">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Doses Taken</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Total Taken</span>
                  <span className="text-2xl font-bold text-green-600 dark:text-green-400">{adherenceData.takenPercentage || 0}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">On Time</span>
                  <span className="text-xl font-semibold text-green-700 dark:text-green-300">{adherenceData.takenOnTimePercentage || 0}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Taken Late</span>
                  <span className="text-xl font-semibold text-yellow-600 dark:text-yellow-400">{adherenceData.takenLatePercentage || 0}%</span>
                </div>
              </div>
            </Card>

            {/* Missed & Skipped */}
            <Card className="p-6 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-700">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Missed & Skipped</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Missed</span>
                  <span className="text-2xl font-bold text-red-600 dark:text-red-400">{adherenceData.missedPercentage || 0}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Skipped</span>
                  <span className="text-xl font-semibold text-yellow-600 dark:text-yellow-400">{adherenceData.skippedPercentage || 0}%</span>
                </div>
              </div>
            </Card>

            {/* Streak Information */}
            {adherenceData.streakInfo && (
              <Card className="p-6 bg-purple-50 dark:bg-purple-900/20 border-2 border-purple-200 dark:border-purple-700 lg:col-span-2 xl:col-span-3">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Streak Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-1">
                      {adherenceData.streakInfo.currentStreak || 0}
                    </div>
                    <p className="text-gray-600 dark:text-gray-400">Current Streak (days)</p>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-1">
                      {adherenceData.streakInfo.bestStreak || 0}
                    </div>
                    <p className="text-gray-600 dark:text-gray-400">Best Streak (days)</p>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                      {adherenceData.streakInfo.totalPerfectDays || 0}
                    </div>
                    <p className="text-gray-600 dark:text-gray-400">Total Perfect Days</p>
                  </div>
                </div>
              </Card>
            )}
          </div>
        ) : (
          <Card className="p-8 text-center">
            <div className="text-gray-500 dark:text-gray-400">
              <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No Data Available</h3>
              <p className="text-gray-600 dark:text-gray-400">No adherence data found for the selected period.</p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AdherenceReports;
