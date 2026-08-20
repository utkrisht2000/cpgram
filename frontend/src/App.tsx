import React, { useState, useEffect } from 'react';
import { I18nProvider, useI18n } from './locales/i18n';
import { Header } from './components/common/Header';
import { Footer } from './components/common/Footer';
import { ChatbotWidget } from './components/common/ChatbotWidget';
import { UserSession, authApi } from './api/authApi';

// Views
import { CitizenAuth } from './views/citizen/CitizenAuth';
import { FileGrievance } from './views/citizen/FileGrievance';
import { GrievanceConfirmation } from './views/citizen/GrievanceConfirmation';
import { CitizenDashboard } from './views/citizen/CitizenDashboard';
import { GrievanceDetail } from './views/citizen/GrievanceDetail';
import { FileAppeal } from './views/citizen/FileAppeal';

import { OfficerAuth } from './views/officer/OfficerAuth';
import { OfficerDashboard } from './views/officer/OfficerDashboard';
import { OfficerCaseDetail } from './views/officer/OfficerCaseDetail';
import { OfficerPerformance } from './views/officer/OfficerPerformance';

import { NodalDashboard } from './views/nodal/NodalDashboard';
import { NodalReports } from './views/nodal/NodalReports';

export const MainApp: React.FC = () => {
  const { t } = useI18n();

  const [user, setUser] = useState<UserSession | null>(() => {
    const saved = localStorage.getItem('sugam_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [activeView, setActiveView] = useState<string>(() => {
    const saved = localStorage.getItem('sugam_user');
    if (saved) {
      const u = JSON.parse(saved);
      if (u.role === 'redressal_officer' || u.role === 'nodal_officer') {
        return 'officer_dashboard';
      }
      return 'my_grievances';
    }
    return 'file_grievance';
  });

  // State parameters for subviews
  const [selectedGrievanceId, setSelectedGrievanceId] = useState<string>('');
  const [selectedTrackingNumber, setSelectedTrackingNumber] = useState<string>('');
  const [confirmationData, setConfirmationData] = useState<{
    trackingNumber: string;
    slaDays: number;
    slaDeadline: string;
  } | null>(null);

  // Sync session on mount
  useEffect(() => {
    const token = localStorage.getItem('sugam_token');
    if (token) {
      authApi.getMe()
        .then((res) => {
          setUser(res.user);
          localStorage.setItem('sugam_user', JSON.stringify(res.user));
        })
        .catch(() => {
          setUser(null);
          localStorage.removeItem('sugam_token');
          localStorage.removeItem('sugam_user');
        });
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('sugam_token');
    localStorage.removeItem('sugam_user');
    setUser(null);
    setActiveView('file_grievance');
  };

  const handleAuthSuccess = (authUser: UserSession, token: string) => {
    setUser(authUser);
    if (authUser.role === 'redressal_officer' || authUser.role === 'nodal_officer') {
      setActiveView('officer_dashboard');
    } else {
      setActiveView('my_grievances');
    }
  };

  return (
    <>
      <Header
        user={user}
        activeView={activeView}
        onNavigate={(view) => {
          if (view === 'home') {
            setActiveView(user?.role === 'redressal_officer' || user?.role === 'nodal_officer' ? 'officer_dashboard' : 'file_grievance');
          } else {
            setActiveView(view);
          }
        }}
        onLogout={handleLogout}
      />

      <main className="main-content">
        {/* Citizen Views */}
        {activeView === 'citizen_login' && (
          <CitizenAuth
            onSuccess={handleAuthSuccess}
            onSwitchToOfficer={() => setActiveView('officer_login')}
          />
        )}

        {activeView === 'file_grievance' && (
          <FileGrievance
            onSuccess={(result) => {
              setConfirmationData(result);
              setActiveView('grievance_confirmation');
            }}
            onRequireAuth={() => setActiveView('citizen_login')}
          />
        )}

        {activeView === 'grievance_confirmation' && confirmationData && (
          <GrievanceConfirmation
            trackingNumber={confirmationData.trackingNumber}
            slaDays={confirmationData.slaDays}
            slaDeadline={confirmationData.slaDeadline}
            onTrack={(trackingNumber) => {
              setSelectedTrackingNumber(trackingNumber);
              setActiveView('track_status');
            }}
            onFileAnother={() => setActiveView('file_grievance')}
          />
        )}

        {activeView === 'my_grievances' && (
          <CitizenDashboard
            onSelectGrievance={(trackingNumber) => {
              setSelectedTrackingNumber(trackingNumber);
              setActiveView('track_status');
            }}
            onFileNew={() => setActiveView('file_grievance')}
          />
        )}

        {activeView === 'track_status' && (
          <GrievanceDetail
            initialTrackingNumber={selectedTrackingNumber}
            onFileAppeal={(grvId) => {
              setSelectedGrievanceId(grvId);
              setActiveView('file_appeal');
            }}
          />
        )}

        {activeView === 'file_appeal' && (
          <FileAppeal
            grievanceId={selectedGrievanceId}
            onSuccess={(trackNum) => {
              setSelectedTrackingNumber(trackNum);
              setActiveView('track_status');
            }}
            onCancel={() => setActiveView('track_status')}
          />
        )}

        {/* Officer & Staff Views */}
        {activeView === 'officer_login' && (
          <OfficerAuth
            onSuccess={handleAuthSuccess}
            onSwitchToCitizen={() => setActiveView('citizen_login')}
          />
        )}

        {activeView === 'officer_dashboard' && user && (
          <OfficerDashboard
            user={user}
            onSelectCase={(grvId) => {
              setSelectedGrievanceId(grvId);
              setActiveView('officer_case_detail');
            }}
          />
        )}

        {activeView === 'officer_case_detail' && user && (
          <OfficerCaseDetail
            grievanceId={selectedGrievanceId}
            user={user}
            onBack={() => setActiveView('officer_dashboard')}
          />
        )}

        {activeView === 'officer_performance' && (
          <OfficerPerformance />
        )}

        {/* Nodal Supervisory Views */}
        {activeView === 'nodal_dashboard' && (
          <NodalDashboard
            onSelectCase={(grvId) => {
              setSelectedGrievanceId(grvId);
              setActiveView('officer_case_detail');
            }}
          />
        )}

        {activeView === 'nodal_reports' && (
          <NodalReports />
        )}
      </main>

      <ChatbotWidget />

      <Footer onNavigate={(view) => setActiveView(view)} />
    </>
  );
};

export const App: React.FC = () => {
  return (
    <I18nProvider>
      <MainApp />
    </I18nProvider>
  );
};

export default App;
