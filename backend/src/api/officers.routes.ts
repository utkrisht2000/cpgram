import { Router, Response } from 'express';
import { z } from 'zod';
import { GrievanceModel, GrievanceStatus, GrievancePriority } from '../models/grievance.model';
import { DepartmentModel } from '../models/department.model';
import { StatusHistoryModel } from '../models/statusHistory.model';
import { GrievanceNoteModel } from '../models/grievanceNote.model';
import { NotificationModel } from '../models/notification.model';
import { AppealModel } from '../models/appeal.model';
import { SlaEngine } from '../rules/slaEngine';
import { EscalationRules } from '../rules/escalationRules';
import { draftOfficerResponse } from '../ai/officerResponseDrafter';
import { authenticate, requireRole, AuthenticatedRequest } from '../middleware/auth.middleware';

export const officersRouter = Router();

// Triage Queue: Sorted by SLA Risk with Filters
officersRouter.get('/triage', authenticate, requireRole('redressal_officer', 'nodal_officer'), (req: AuthenticatedRequest, res: Response) => {
  const { status, departmentId, isEscalated, priority, startDate, endDate, searchQuery } = req.query;

  // Officers are bounded to their assigned department, whereas Nodal officers have supervisory cross-department visibility
  let targetDepartmentId = departmentId as string | undefined;
  if (req.user!.role === 'redressal_officer' && req.user!.departmentId) {
    targetDepartmentId = req.user!.departmentId;
  }

  const grievances = GrievanceModel.findMany({
    departmentId: targetDepartmentId,
    status: status as GrievanceStatus | undefined,
    isEscalated: isEscalated !== undefined ? isEscalated === 'true' : undefined,
    priority: priority as GrievancePriority | undefined,
    startDate: startDate as string | undefined,
    endDate: endDate as string | undefined,
    searchQuery: searchQuery as string | undefined,
  });

  // Calculate dynamic SLA metrics and sort by risk score
  const enriched = grievances.map((g) => {
    const sla = SlaEngine.evaluateStatus(g.created_at, g.sla_deadline, g.resolved_at);
    const escalation = EscalationRules.evaluateEscalation(
      g.created_at,
      g.sla_deadline,
      g.status,
      g.status === 'appealed',
      g.priority
    );

    // Auto-sync escalation flag if threshold exceeded
    if (escalation.shouldEscalate && !g.is_escalated) {
      GrievanceModel.setEscalated(g.id, true);
      g.is_escalated = 1;
    }

    return {
      ...g,
      sla,
      escalation,
    };
  });

  res.json({ grievances: enriched });
});

// Officer: Case Detail View
officersRouter.get('/grievance/:id', authenticate, requireRole('redressal_officer', 'nodal_officer'), (req: AuthenticatedRequest, res: Response) => {
  const grievance = GrievanceModel.findById(req.params.id);
  if (!grievance) {
    return res.status(404).json({ error: 'Grievance not found.' });
  }

  // Check departmental boundary for standard redressal officers
  if (req.user!.role === 'redressal_officer' && req.user!.departmentId && grievance.department_id !== req.user!.departmentId) {
    return res.status(403).json({ error: 'Access forbidden: Case is assigned to another department.' });
  }

  const history = StatusHistoryModel.findByGrievance(grievance.id);
  const notes = GrievanceNoteModel.findByGrievance(grievance.id);
  const department = DepartmentModel.findById(grievance.department_id);
  const sla = SlaEngine.evaluateStatus(grievance.created_at, grievance.sla_deadline, grievance.resolved_at);
  const appeal = AppealModel.findByGrievanceId(grievance.id);

  res.json({
    grievance,
    department,
    history,
    notes,
    sla,
    appeal,
  });
});

// Officer: AI Draft Response Helper
officersRouter.post('/draft-response', authenticate, requireRole('redressal_officer', 'nodal_officer'), async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { grievanceText, category, actionType, officerNotes } = z.object({
      grievanceText: z.string().min(5),
      category: z.string().min(1),
      actionType: z.enum(['request_info', 'resolve', 'internal_note']),
      officerNotes: z.string().optional(),
    }).parse(req.body);

    const draft = await draftOfficerResponse(grievanceText, category, actionType, officerNotes);
    res.json(draft);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors[0].message });
    }
    next(err);
  }
});

// Officer: Update Case Status (In Progress, Info Requested, Resolved, Rejected)
officersRouter.post('/grievance/:id/status', authenticate, requireRole('redressal_officer', 'nodal_officer'), async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const grievance = GrievanceModel.findById(req.params.id);
    if (!grievance) {
      return res.status(404).json({ error: 'Grievance not found.' });
    }

    if (req.user!.role === 'redressal_officer' && req.user!.departmentId && grievance.department_id !== req.user!.departmentId) {
      return res.status(403).json({ error: 'Access forbidden: Case is assigned to another department.' });
    }

    const { status, remarks, resolutionSummary } = z.object({
      status: z.enum(['acknowledged', 'in_progress', 'info_requested', 'resolved', 'rejected']),
      remarks: z.string().min(3, 'Please provide status remarks.'),
      resolutionSummary: z.string().optional(),
    }).parse(req.body);

    const fromStatus = grievance.status;
    GrievanceModel.updateStatus(grievance.id, status, resolutionSummary || remarks);

    // Record in timeline history
    StatusHistoryModel.create({
      id: `sh_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      grievance_id: grievance.id,
      from_status: fromStatus,
      to_status: status,
      remarks,
      changed_by_type: req.user!.role === 'nodal_officer' ? 'nodal' : 'officer',
      changed_by_id: req.user!.userId,
    });

    // Notify citizen about milestone change
    const titleEn = status === 'resolved' ? 'Grievance Resolved' : 'Grievance Status Updated';
    const titleHi = status === 'resolved' ? 'शिकायत का समाधान किया गया' : 'शिकायत की स्थिति अपडेट की गई';
    const messageEn = `Your grievance ${grievance.tracking_number} is now marked as ${status.replace('_', ' ')}. Remarks: ${remarks}`;
    const messageHi = `आपकी शिकायत ${grievance.tracking_number} को अब ${status} के रूप में चिह्नित किया गया है। विवरण: ${remarks}`;

    NotificationModel.create({
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      user_id: grievance.user_id,
      grievance_id: grievance.id,
      title_en: titleEn,
      title_hi: titleHi,
      message_en: messageEn,
      message_hi: messageHi,
    });

    res.json({ message: 'Grievance status updated successfully.' });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors[0].message });
    }
    next(err);
  }
});

// Officer: Add Internal Note or Citizen Query
officersRouter.post('/grievance/:id/notes', authenticate, requireRole('redressal_officer', 'nodal_officer'), async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const grievance = GrievanceModel.findById(req.params.id);
    if (!grievance) {
      return res.status(404).json({ error: 'Grievance not found.' });
    }

    const { content, noteType } = z.object({
      content: z.string().min(3, 'Note content cannot be empty.'),
      noteType: z.enum(['internal', 'citizen_query', 'resolution']).default('internal'),
    }).parse(req.body);

    const noteId = `gn_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    GrievanceNoteModel.create({
      id: noteId,
      grievance_id: grievance.id,
      officer_id: req.user!.userId,
      note_type: noteType,
      content,
    });

    res.status(201).json({ message: 'Note recorded successfully.', noteId });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors[0].message });
    }
    next(err);
  }
});

// Officer: Personal Performance Metrics
officersRouter.get('/performance', authenticate, requireRole('redressal_officer', 'nodal_officer'), (req: AuthenticatedRequest, res: Response) => {
  const departmentId = req.user!.departmentId;
  const grievances = GrievanceModel.findMany(departmentId ? { departmentId } : {});

  let totalCases = grievances.length;
  let resolvedCases = 0;
  let pendingCases = 0;
  let breachedCases = 0;
  let resolvedWithinSla = 0;
  let totalResolutionDays = 0;

  for (const g of grievances) {
    const sla = SlaEngine.evaluateStatus(g.created_at, g.sla_deadline, g.resolved_at);
    if (g.status === 'resolved' || g.status === 'rejected') {
      resolvedCases++;
      if (!sla.isBreached) {
        resolvedWithinSla++;
      }
      if (g.resolved_at) {
        const days = Math.max(1, Math.round((new Date(g.resolved_at).getTime() - new Date(g.created_at).getTime()) / (1000 * 60 * 60 * 24)));
        totalResolutionDays += days;
      }
    } else {
      pendingCases++;
      if (sla.isBreached) {
        breachedCases++;
      }
    }
  }

  const avgResolutionDays = resolvedCases > 0 ? (totalResolutionDays / resolvedCases).toFixed(1) : '0';
  const slaCompliancePercent = resolvedCases > 0 ? Math.round((resolvedWithinSla / resolvedCases) * 100) : 100;

  res.json({
    metrics: {
      totalCases,
      resolvedCases,
      pendingCases,
      breachedCases,
      avgResolutionDays: Number(avgResolutionDays),
      slaCompliancePercent,
    }
  });
});

// Nodal Officer: Supervisory Dashboard Overview
officersRouter.get('/nodal/dashboard', authenticate, requireRole('nodal_officer'), (req: AuthenticatedRequest, res: Response) => {
  const departments = DepartmentModel.findAll();
  const allGrievances = GrievanceModel.findMany({});
  const allAppeals = AppealModel.findAll();

  let totalReceived = allGrievances.length;
  let totalResolved = 0;
  let totalPending = 0;
  let totalBreached = 0;
  let totalAppealsPending = allAppeals.filter(a => a.status === 'submitted' || a.status === 'under_review').length;

  const departmentBreakdown = departments.map(d => {
    const deptGrievances = allGrievances.filter(g => g.department_id === d.id);
    let deptResolved = 0;
    let deptPending = 0;
    let deptBreached = 0;

    for (const g of deptGrievances) {
      const sla = SlaEngine.evaluateStatus(g.created_at, g.sla_deadline, g.resolved_at);
      if (g.status === 'resolved' || g.status === 'rejected') {
        deptResolved++;
      } else {
        deptPending++;
        if (sla.isBreached) {
          deptBreached++;
        }
      }
    }

    return {
      departmentId: d.id,
      departmentCode: d.code,
      departmentNameEn: d.name_en,
      departmentNameHi: d.name_hi,
      slaDays: d.sla_days,
      total: deptGrievances.length,
      resolved: deptResolved,
      pending: deptPending,
      breached: deptBreached,
      breachRate: deptPending > 0 ? Math.round((deptBreached / deptPending) * 100) : 0,
    };
  });

  for (const g of allGrievances) {
    const sla = SlaEngine.evaluateStatus(g.created_at, g.sla_deadline, g.resolved_at);
    if (g.status === 'resolved' || g.status === 'rejected') {
      totalResolved++;
    } else {
      totalPending++;
      if (sla.isBreached) {
        totalBreached++;
      }
    }
  }

  const overallBreachRate = totalPending > 0 ? Math.round((totalBreached / totalPending) * 100) : 0;

  res.json({
    overview: {
      totalReceived,
      totalResolved,
      totalPending,
      totalBreached,
      overallBreachRate,
      totalAppealsPending,
    },
    departments: departmentBreakdown,
  });
});

// Nodal Officer: Reassign Case Department
officersRouter.post('/nodal/reassign', authenticate, requireRole('nodal_officer'), async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { grievanceId, newDepartmentId, remarks } = z.object({
      grievanceId: z.string().min(1),
      newDepartmentId: z.string().min(1),
      remarks: z.string().min(3, 'Please provide reason for reassignment.'),
    }).parse(req.body);

    const grievance = GrievanceModel.findById(grievanceId);
    if (!grievance) {
      return res.status(404).json({ error: 'Grievance not found.' });
    }

    const newDept = DepartmentModel.findById(newDepartmentId);
    if (!newDept) {
      return res.status(400).json({ error: 'Target department does not exist.' });
    }

    GrievanceModel.updateDepartment(grievanceId, newDepartmentId);

    // Record reassignment in status history
    StatusHistoryModel.create({
      id: `sh_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      grievance_id: grievance.id,
      from_status: grievance.status,
      to_status: grievance.status,
      remarks: `Reassigned to ${newDept.name_en} by Nodal Authority. Reason: ${remarks}`,
      changed_by_type: 'nodal',
      changed_by_id: req.user!.userId,
    });

    res.json({ message: `Grievance reassigned to ${newDept.name_en} successfully.` });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors[0].message });
    }
    next(err);
  }
});

// Nodal Officer: List Appeals
officersRouter.get('/nodal/appeals', authenticate, requireRole('nodal_officer'), (req: AuthenticatedRequest, res: Response) => {
  const appeals = AppealModel.findAll();
  res.json({ appeals });
});

// Nodal Officer: Appellate Decision (Upheld or Overturned)
officersRouter.post('/nodal/appeals/:id/decide', authenticate, requireRole('nodal_officer'), async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const appeal = AppealModel.findById(req.params.id);
    if (!appeal) {
      return res.status(404).json({ error: 'Appeal record not found.' });
    }

    const { decision, remarks } = z.object({
      decision: z.enum(['upheld', 'overturned']),
      remarks: z.string().min(5, 'Please provide reasoned appellate judgment remarks.'),
    }).parse(req.body);

    AppealModel.updateStatus(appeal.id, decision, remarks, req.user!.userId);

    // If overturned, re-open grievance to in_progress with priority
    if (decision === 'overturned') {
      GrievanceModel.updateStatus(appeal.grievance_id, 'in_progress', `Re-opened per appellate order: ${remarks}`);
      GrievanceModel.setEscalated(appeal.grievance_id, true);
    } else {
      GrievanceModel.updateStatus(appeal.grievance_id, 'resolved', `Appeal concluded (prior resolution upheld): ${remarks}`);
    }

    StatusHistoryModel.create({
      id: `sh_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      grievance_id: appeal.grievance_id,
      from_status: 'appealed',
      to_status: decision === 'overturned' ? 'in_progress' : 'resolved',
      remarks: `Appellate Decision [${decision.toUpperCase()}]: ${remarks}`,
      changed_by_type: 'nodal',
      changed_by_id: req.user!.userId,
    });

    // Notify citizen
    NotificationModel.create({
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      user_id: appeal.user_id,
      grievance_id: appeal.grievance_id,
      title_en: 'Appellate Order Issued',
      title_hi: 'अपीलीय आदेश जारी किया गया',
      message_en: `Your appeal for grievance ${appeal.tracking_number} has been decided (${decision}). Order: ${remarks}`,
      message_hi: `शिकायत ${appeal.tracking_number} के लिए आपकी अपील पर आदेश जारी किया गया है (${decision})। आदेश विवरण: ${remarks}`,
    });

    res.json({ message: 'Appellate decision recorded.' });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors[0].message });
    }
    next(err);
  }
});

// Nodal Officer: Export Summary Data
officersRouter.get('/nodal/export-summary', authenticate, requireRole('nodal_officer'), (req: AuthenticatedRequest, res: Response) => {
  const grievances = GrievanceModel.findMany({});
  const rows = grievances.map(g => {
    const sla = SlaEngine.evaluateStatus(g.created_at, g.sla_deadline, g.resolved_at);
    return {
      tracking_number: g.tracking_number,
      citizen_name: g.citizen_name || 'Anonymous Citizen',
      citizen_phone: g.citizen_phone || '-',
      department: g.department_name_en,
      category: g.category,
      status: g.status,
      priority: g.priority,
      created_at: g.created_at,
      sla_deadline: g.sla_deadline,
      sla_status: sla.status,
      days_remaining: sla.daysRemaining,
      is_escalated: g.is_escalated ? 'Yes' : 'No',
      resolved_at: g.resolved_at || 'Pending',
    };
  });

  res.json({ exportData: rows });
});
