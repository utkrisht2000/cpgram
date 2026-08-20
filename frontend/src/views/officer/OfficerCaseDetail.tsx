import React, { useState, useEffect } from 'react';
import { useI18n } from '../../locales/i18n';
import { officerApi, GrievanceNoteDto } from '../../api/officerApi';
import { GrievanceDto, SlaStatusDto, StatusHistoryDto, AppealDto } from '../../api/grievanceApi';
import { departmentApi, DepartmentItem } from '../../api/departmentApi';
import { TimelineStepper } from '../../components/common/TimelineStepper';
import { SlaBadge } from '../../components/common/SlaBadge';
import { AiSuggestionBanner } from '../../components/common/AiSuggestionBanner';
import { Modal } from '../../components/common/Modal';
import { IconSparkles, IconCheck, IconArrowLeft } from '../../assets/icons/Icons';
import { UserSession } from '../../api/authApi';

interface OfficerCaseDetailProps {
  grievanceId: string;
  user: UserSession;
  onBack: () => void;
}

export const OfficerCaseDetail: React.FC<OfficerCaseDetailProps> = ({ grievanceId, user, onBack }) => {
  const { language, t } = useI18n();
  const [loading, setLoading] = useState(true);
  const [caseData, setCaseData] = useState<{
    grievance: GrievanceDto;
    department: any;
    history: StatusHistoryDto[];
    notes: GrievanceNoteDto[];
    sla: SlaStatusDto;
    appeal: AppealDto | null;
  } | null>(null);

  const [departments, setDepartments] = useState<DepartmentItem[]>([]);

  // Action states
  const [actionType, setActionType] = useState<'request_info' | 'resolve' | 'internal_note'>('resolve');
  const [statusRemarks, setStatusRemarks] = useState('');
  const [internalNoteText, setInternalNoteText] = useState('');
  const [isDraftingAi, setIsDraftingAi] = useState(false);
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Nodal Reassign Modal
  const [isReassignModalOpen, setIsReassignModalOpen] = useState(false);
  const [newDepartmentId, setNewDepartmentId] = useState('');
  const [reassignReason, setReassignReason] = useState('');

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const res = await officerApi.getCaseDetail(grievanceId);
      setCaseData(res);
      setNewDepartmentId(res.grievance.department_id);
    } catch (err: any) {
      setActionError(err.message || 'Failed to load case detail.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
    departmentApi.getAll().then((res) => setDepartments(res.departments)).catch(console.warn);
  }, [grievanceId]);

  const handleGenerateAiResponse = async () => {
    if (!caseData) return;
    setIsDraftingAi(true);
    setActionError(null);

    try {
      const res = await officerApi.draftResponse({
        grievanceText: caseData.grievance.clarified_text || caseData.grievance.raw_text,
        category: caseData.grievance.category,
        actionType,
        officerNotes: statusRemarks || undefined,
      });

      setStatusRemarks(res.suggestedDraft);
    } catch (err: any) {
      console.warn('AI Response Drafter failed:', err);
    } finally {
      setIsDraftingAi(false);
    }
  };

  const handleUpdateStatus = async (status: 'in_progress' | 'info_requested' | 'resolved' | 'rejected') => {
    if (!statusRemarks.trim()) {
      setActionError(language === 'hi' ? 'कृपया कार्रवाई विवरण/टिप्पणी दर्ज करें।' : 'Please enter action remarks before submitting.');
      return;
    }

    setIsSubmittingAction(true);
    setActionError(null);

    try {
      await officerApi.updateStatus(grievanceId, {
        status,
        remarks: statusRemarks.trim(),
        resolutionSummary: status === 'resolved' ? statusRemarks.trim() : undefined,
      });

      setActionSuccess(`Case status successfully updated to ${status.toUpperCase()}.`);
      setStatusRemarks('');
      fetchDetail();
    } catch (err: any) {
      setActionError(err.message || 'Failed to update case status.');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const handleAddInternalNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!internalNoteText.trim()) return;
    setIsSubmittingAction(true);
    setActionError(null);

    try {
      await officerApi.addNote(grievanceId, {
        content: internalNoteText.trim(),
        noteType: 'internal',
      });
      setInternalNoteText('');
      fetchDetail();
    } catch (err: any) {
      setActionError(err.message || 'Failed to record internal note.');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const handleReassign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDepartmentId || !reassignReason.trim()) return;

    try {
      await officerApi.reassignDepartment(grievanceId, newDepartmentId, reassignReason.trim());
      setIsReassignModalOpen(false);
      fetchDetail();
    } catch (err: any) {
      setActionError(err.message || 'Failed to reassign department.');
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '60px', color: 'var(--color-neutral-500)' }}>
        {t('common.loading')}
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="container" style={{ marginTop: '20px' }}>
        <p>Case not found.</p>
        <button type="button" onClick={onBack} className="btn btn-secondary">{t('common.back')}</button>
      </div>
    );
  }

  const { grievance, department, history, notes, sla, appeal } = caseData;
  const deptName = language === 'hi' ? department?.name_hi : department?.name_en;

  return (
    <div className="container" style={{ maxWidth: '960px', marginTop: '20px' }}>
      {/* Top Breadcrumb & Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <button type="button" onClick={onBack} className="btn btn-secondary btn-sm">
          <IconArrowLeft size={16} />
          <span>{t('common.back')} to Queue</span>
        </button>

        {user.role === 'nodal_officer' && (
          <button
            type="button"
            onClick={() => setIsReassignModalOpen(true)}
            className="btn btn-outline btn-sm"
          >
            Reassign Department
          </button>
        )}
      </div>

      {actionSuccess && (
        <div style={{ backgroundColor: '#dcfce7', color: '#15803d', padding: '12px 16px', borderRadius: 'var(--radius-md)', marginBottom: '16px', fontWeight: 600 }}>
          {actionSuccess}
        </div>
      )}

      {actionError && (
        <div style={{ backgroundColor: '#fee2e2', color: '#dc2626', padding: '12px 16px', borderRadius: 'var(--radius-md)', marginBottom: '16px', fontWeight: 600 }}>
          {actionError}
        </div>
      )}

      {/* Main Grid: Details on Left, Actions on Right */}
      <div className="grid grid-cols-3" style={{ gap: '20px' }}>
        {/* Left 2 Columns: Case Facts & Statement */}
        <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Overview Card */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--color-neutral-500)', letterSpacing: '1px', fontWeight: 600 }}>
                  Case ID
                </span>
                <h1 style={{ fontSize: '1.6rem', fontFamily: 'monospace', color: 'var(--color-primary-900)' }}>
                  {grievance.tracking_number}
                </h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                  <span className={`badge badge-${grievance.status}`}>
                    {t(`status.${grievance.status}`, grievance.status)}
                  </span>
                  <span style={{ fontSize: '0.82rem', color: 'var(--color-neutral-600)' }}>
                    Priority: <strong style={{ textTransform: 'capitalize' }}>{grievance.priority}</strong>
                  </span>
                </div>
              </div>

              <div>
                <SlaBadge sla={sla} showProgress={true} />
              </div>
            </div>

            {/* Citizen Details */}
            <div style={{ marginTop: '16px', padding: '12px', backgroundColor: 'var(--color-neutral-50)', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
              <div>
                <span style={{ color: 'var(--color-neutral-500)', display: 'block' }}>Complainant:</span>
                <strong>{grievance.citizen_name || 'Citizen'}</strong> ({grievance.citizen_phone || '-'})
              </div>
              <div>
                <span style={{ color: 'var(--color-neutral-500)', display: 'block' }}>Department:</span>
                <strong>{deptName}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--color-neutral-500)', display: 'block' }}>Registered:</span>
                <span>{new Date(grievance.created_at).toLocaleDateString()}</span>
              </div>
            </div>

            {/* Grievance Statement */}
            <div style={{ marginTop: '16px' }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '6px' }}>{grievance.category}</h3>
              <p style={{ fontSize: '0.92rem', color: 'var(--color-neutral-800)', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
                {grievance.clarified_text || grievance.raw_text}
              </p>
            </div>
          </div>

          {/* Action & Response Box */}
          <div className="card" style={{ border: '1.5px solid var(--color-primary-300)' }}>
            <h3 style={{ fontSize: '1.15rem', marginBottom: '4px' }}>{t('officer.caseDetail')}</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-neutral-500)', marginBottom: '16px' }}>
              Draft official resolution remarks, request citizen details, or advance status.
            </p>

            {/* Response Mode Selector */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
              <button
                type="button"
                onClick={() => setActionType('resolve')}
                className={`btn btn-sm ${actionType === 'resolve' ? 'btn-primary' : 'btn-secondary'}`}
              >
                Resolve Case
              </button>
              <button
                type="button"
                onClick={() => setActionType('request_info')}
                className={`btn btn-sm ${actionType === 'request_info' ? 'btn-primary' : 'btn-secondary'}`}
              >
                Request Info
              </button>
              <button
                type="button"
                onClick={() => setActionType('internal_note')}
                className={`btn btn-sm ${actionType === 'internal_note' ? 'btn-primary' : 'btn-secondary'}`}
              >
                General Action
              </button>
            </div>

            {/* AI Response Drafter Trigger */}
            <div style={{ marginBottom: '12px' }}>
              <button
                type="button"
                onClick={handleGenerateAiResponse}
                disabled={isDraftingAi}
                className="btn btn-secondary btn-sm w-full"
                style={{
                  border: '1.5px solid var(--color-ai-border)',
                  backgroundColor: 'var(--color-ai-tag-bg)',
                  color: 'var(--color-ai-tag)',
                  fontWeight: 700,
                }}
              >
                <IconSparkles size={16} />
                <span>{isDraftingAi ? 'Drafting with AI...' : `${t('officer.draftResponseAI')} (${actionType})`}</span>
              </button>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontSize: '0.88rem' }}>
                <span>{t('officer.resolutionRemarks')} *</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-ai-tag)', fontWeight: 500 }}>
                  Suggested — please review & edit
                </span>
              </label>
              <textarea
                className="form-textarea"
                style={{ minHeight: '120px' }}
                placeholder="Enter formal inspection findings or instructions for the citizen..."
                value={statusRemarks}
                onChange={(e) => setStatusRemarks(e.target.value)}
              />
            </div>

            {/* Status Execution Triggers */}
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '12px' }}>
              <button
                type="button"
                disabled={isSubmittingAction || !statusRemarks.trim()}
                onClick={() => handleUpdateStatus('in_progress')}
                className="btn btn-secondary"
                style={{ flex: 1 }}
              >
                {t('officer.markInProgress')}
              </button>

              <button
                type="button"
                disabled={isSubmittingAction || !statusRemarks.trim()}
                onClick={() => handleUpdateStatus('info_requested')}
                className="btn btn-secondary"
                style={{ flex: 1 }}
              >
                {t('officer.requestInfo')}
              </button>

              <button
                type="button"
                disabled={isSubmittingAction || !statusRemarks.trim()}
                onClick={() => handleUpdateStatus('resolved')}
                className="btn btn-primary"
                style={{ flex: 1.5, backgroundColor: 'var(--color-status-resolved)', borderColor: 'var(--color-status-resolved)' }}
              >
                <IconCheck size={18} />
                <span>{t('officer.markResolved')}</span>
              </button>
            </div>
          </div>

          {/* Timeline History */}
          <div className="card">
            <h3 style={{ fontSize: '1.1rem', marginBottom: '8px' }}>Timeline History</h3>
            <TimelineStepper history={history} currentStatus={grievance.status} />
          </div>
        </div>

        {/* Right Column: Internal Notes & Department Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Internal Notes Card */}
          <div className="card">
            <h3 style={{ fontSize: '1.05rem', marginBottom: '8px' }}>{t('officer.internalNotes')}</h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--color-neutral-500)', marginBottom: '12px' }}>
              Restricted to authorized departmental officers. Not visible to citizen.
            </p>

            <form onSubmit={handleAddInternalNote} style={{ marginBottom: '16px' }}>
              <div className="form-group">
                <textarea
                  className="form-textarea"
                  style={{ minHeight: '80px', fontSize: '0.88rem' }}
                  placeholder="Record on-site notes, technical measurements, team dispatch..."
                  value={internalNoteText}
                  onChange={(e) => setInternalNoteText(e.target.value)}
                />
              </div>
              <button
                type="submit"
                disabled={isSubmittingAction || !internalNoteText.trim()}
                className="btn btn-secondary btn-sm w-full"
              >
                {t('officer.addNote')}
              </button>
            </form>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '360px', overflowY: 'auto' }}>
              {notes.length === 0 ? (
                <span style={{ fontSize: '0.85rem', color: 'var(--color-neutral-400)', textAlign: 'center', padding: '10px' }}>
                  No internal notes recorded yet.
                </span>
              ) : (
                notes.map((n) => (
                  <div key={n.id} style={{ padding: '8px 10px', backgroundColor: 'var(--color-neutral-50)', border: '1px solid var(--color-neutral-200)', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--color-neutral-500)' }}>
                      <strong>{n.officer_name || 'Staff Officer'}</strong>
                      <span>{new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--color-neutral-800)', marginTop: '4px' }}>
                      {n.content}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Appeal Status if present */}
          {appeal && (
            <div className="card" style={{ border: '1.5px solid #a855f7', backgroundColor: '#faf5ff' }}>
              <h3 style={{ fontSize: '1.05rem', color: '#6b21a8' }}>Active Citizen Appeal</h3>
              <p style={{ fontSize: '0.85rem', color: '#581c87', marginTop: '4px' }}>
                Status: <strong>{appeal.status.toUpperCase()}</strong>
              </p>
              <div style={{ marginTop: '8px', fontSize: '0.85rem', color: 'var(--color-neutral-800)', padding: '8px', backgroundColor: 'var(--color-white)', borderRadius: 'var(--radius-sm)' }}>
                {appeal.reason}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Nodal Reassignment Modal */}
      <Modal
        isOpen={isReassignModalOpen}
        onClose={() => setIsReassignModalOpen(false)}
        title={t('nodal.reassignTitle')}
      >
        <form onSubmit={handleReassign}>
          <div className="form-group">
            <label className="form-label">{t('nodal.selectNewDept')} *</label>
            <select
              className="form-select"
              value={newDepartmentId}
              onChange={(e) => setNewDepartmentId(e.target.value)}
              required
            >
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {language === 'hi' ? d.name_hi : d.name_en} ({d.sla_days} days SLA)
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">{t('nodal.reassignReason')} *</label>
            <textarea
              className="form-textarea"
              placeholder="Explain jurisdiction or administrative rationale for transferring case..."
              value={reassignReason}
              onChange={(e) => setReassignReason(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '16px' }}>
            <button type="button" onClick={() => setIsReassignModalOpen(false)} className="btn btn-secondary">
              {t('common.cancel')}
            </button>
            <button type="submit" className="btn btn-primary">
              {t('nodal.confirmReassign')}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
