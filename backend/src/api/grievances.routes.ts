import { Router, Response } from 'express';
import { z } from 'zod';
import { GrievanceModel } from '../models/grievance.model';
import { DepartmentModel } from '../models/department.model';
import { StatusHistoryModel } from '../models/statusHistory.model';
import { NotificationModel } from '../models/notification.model';
import { AppealModel } from '../models/appeal.model';
import { GrievanceNoteModel } from '../models/grievanceNote.model';
import { SlaEngine } from '../rules/slaEngine';
import { EscalationRules } from '../rules/escalationRules';
import { AppealEligibility } from '../rules/appealEligibility';
import { classifyAndRoute } from '../ai/classifyAndRoute';
import { clarifyText } from '../ai/clarifyText';
import { translateStatus } from '../ai/statusTranslator';
import { draftAppeal } from '../ai/appealDrafter';
import { authenticate, requireRole, AuthenticatedRequest } from '../middleware/auth.middleware';

export const grievancesRouter = Router();

// Helper to generate official tracking registration number (e.g. SGM-2026-8942)
function generateTrackingNumber(): string {
  const year = new Date().getFullYear();
  const randomDigits = Math.floor(10000 + Math.random() * 90000).toString();
  return `SGM-${year}-${randomDigits}`;
}

// AI: Classify and Route Citizen Input
grievancesRouter.post('/classify', async (req, res, next) => {
  try {
    const { text } = z.object({ text: z.string().min(5, 'Please provide more details on your grievance.') }).parse(req.body);
    const result = await classifyAndRoute(text);
    res.json(result);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors[0].message });
    }
    next(err);
  }
});

// AI: Clarify and Polish Citizen Input
grievancesRouter.post('/clarify', async (req, res, next) => {
  try {
    const { text, language } = z.object({
      text: z.string().min(10, 'Grievance text is too short to clarify.'),
      language: z.string().optional(),
    }).parse(req.body);

    const result = await clarifyText(text, language || 'en');
    res.json(result);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors[0].message });
    }
    next(err);
  }
});

// Citizen: Submit Grievance
const createGrievanceSchema = z.object({
  departmentId: z.string().min(1, 'Please select or confirm a department.'),
  category: z.string().min(1, 'Please specify a category.'),
  rawText: z.string().min(10, 'Please describe your grievance in at least 10 characters.'),
  clarifiedText: z.string().optional(),
  language: z.string().default('en'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  photoUrl: z.string().optional(),
  aiClassificationConfidence: z.number().optional(),
  aiReasoning: z.string().optional(),
});

grievancesRouter.post('/', authenticate, requireRole('citizen'), async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const data = createGrievanceSchema.parse(req.body);
    const department = DepartmentModel.findById(data.departmentId);

    if (!department) {
      return res.status(400).json({ error: 'Selected department does not exist.' });
    }

    const grievanceId = `grv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const trackingNumber = generateTrackingNumber();
    
    // Deterministic SLA calculation grounded in DB department parameters
    const slaCalculation = SlaEngine.calculateDeadline(department.sla_days);

    const createdGrievance = GrievanceModel.create({
      id: grievanceId,
      tracking_number: trackingNumber,
      user_id: req.user!.userId,
      department_id: department.id,
      category: data.category,
      raw_text: data.rawText,
      clarified_text: data.clarifiedText || null,
      language: data.language,
      status: 'submitted',
      priority: data.priority,
      photo_url: data.photoUrl || null,
      sla_deadline: slaCalculation.deadlineIso,
      is_escalated: 0,
      ai_classification_confidence: data.aiClassificationConfidence || null,
      ai_reasoning: data.aiReasoning || null,
      resolution_summary: null,
      citizen_feedback_rating: null,
      citizen_feedback_comments: null,
    });

    // Record initial status in history
    StatusHistoryModel.create({
      id: `sh_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      grievance_id: grievanceId,
      from_status: null,
      to_status: 'submitted',
      remarks: 'Grievance submitted and registered in system.',
      changed_by_type: 'citizen',
      changed_by_id: req.user!.userId,
    });

    // Generate in-app confirmation notification
    NotificationModel.create({
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      user_id: req.user!.userId,
      grievance_id: grievanceId,
      title_en: 'Grievance Registered Successfully',
      title_hi: 'शिकायत सफलतापूर्वक दर्ज की गई',
      message_en: `Your grievance has been registered under Tracking ID ${trackingNumber} and forwarded to ${department.name_en}. SLA resolution target: ${department.sla_days} days.`,
      message_hi: `आपकी शिकायत ट्रैकिंग आईडी ${trackingNumber} के तहत दर्ज की गई है और ${department.name_hi} को अग्रेषित की गई है। समाधान का लक्ष्य: ${department.sla_days} दिन।`,
    });

    res.status(201).json({
      grievance: createdGrievance,
      trackingNumber,
      slaDeadline: slaCalculation.deadlineIso,
      slaDays: department.sla_days,
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors[0].message });
    }
    next(err);
  }
});

// Citizen: Get own grievances list
grievancesRouter.get('/my', authenticate, requireRole('citizen'), (req: AuthenticatedRequest, res: Response) => {
  const grievances = GrievanceModel.findByUser(req.user!.userId);
  
  // Attach evaluated SLA status and escalation triggers to each record
  const enriched = grievances.map((g) => {
    const sla = SlaEngine.evaluateStatus(g.created_at, g.sla_deadline, g.resolved_at);
    return {
      ...g,
      sla,
    };
  });

  res.json({ grievances: enriched });
});

// Public / Citizen Tracking by Registration Number
grievancesRouter.get('/track/:trackingNumber', async (req, res, next) => {
  try {
    const trackingNumber = req.params.trackingNumber.trim().toUpperCase();
    const grievance = GrievanceModel.findByTrackingNumber(trackingNumber);

    if (!grievance) {
      return res.status(404).json({ error: 'No grievance found with this registration tracking number.' });
    }

    const history = StatusHistoryModel.findByGrievance(grievance.id);
    const department = DepartmentModel.findById(grievance.department_id);
    const sla = SlaEngine.evaluateStatus(grievance.created_at, grievance.sla_deadline, grievance.resolved_at);
    
    // Check appeal status & eligibility
    const existingAppeal = AppealModel.findByGrievanceId(grievance.id);
    const appealEligibility = AppealEligibility.evaluate(
      grievance.status,
      grievance.resolved_at,
      existingAppeal?.status
    );

    // AI plain-language status translation
    const lastRemark = history.length > 0 ? history[history.length - 1].remarks : null;
    const translatedStatus = await translateStatus(
      grievance.status,
      {
        daysRemaining: sla.daysRemaining,
        isBreached: sla.isBreached,
        isWarning: sla.isWarning,
        departmentNameEn: department?.name_en || 'Department',
        departmentNameHi: department?.name_hi || 'विभाग',
      },
      lastRemark
    );

    res.json({
      grievance,
      department,
      history,
      sla,
      appeal: existingAppeal,
      appealEligibility,
      plainLanguageStatus: translatedStatus,
    });
  } catch (err) {
    next(err);
  }
});

// Citizen: Get full grievance detail by ID
grievancesRouter.get('/:id', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  const grievance = GrievanceModel.findById(req.params.id);
  if (!grievance) {
    return res.status(404).json({ error: 'Grievance not found.' });
  }

  // Enforce caller ownership if citizen
  if (req.user!.role === 'citizen' && grievance.user_id !== req.user!.userId) {
    return res.status(403).json({ error: 'Access denied: You do not own this grievance.' });
  }

  const history = StatusHistoryModel.findByGrievance(grievance.id);
  const department = DepartmentModel.findById(grievance.department_id);
  const sla = SlaEngine.evaluateStatus(grievance.created_at, grievance.sla_deadline, grievance.resolved_at);
  const existingAppeal = AppealModel.findByGrievanceId(grievance.id);
  const appealEligibility = AppealEligibility.evaluate(
    grievance.status,
    grievance.resolved_at,
    existingAppeal?.status
  );

  res.json({
    grievance,
    department,
    history,
    sla,
    appeal: existingAppeal,
    appealEligibility,
  });
});

// Citizen: AI Draft Appeal Helper
grievancesRouter.post('/:id/appeal-draft', authenticate, requireRole('citizen'), async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const grievance = GrievanceModel.findById(req.params.id);
    if (!grievance || grievance.user_id !== req.user!.userId) {
      return res.status(404).json({ error: 'Grievance not found.' });
    }

    const { citizenDissatisfaction, language } = z.object({
      citizenDissatisfaction: z.string().min(5, 'Please provide the reason for your dissatisfaction.'),
      language: z.string().default('en'),
    }).parse(req.body);

    const draft = await draftAppeal(
      grievance.clarified_text || grievance.raw_text,
      grievance.resolution_summary || 'Resolved per standard procedures.',
      citizenDissatisfaction,
      language
    );

    res.json(draft);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors[0].message });
    }
    next(err);
  }
});

// Citizen: Submit Appeal
grievancesRouter.post('/:id/appeal', authenticate, requireRole('citizen'), async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const grievance = GrievanceModel.findById(req.params.id);
    if (!grievance || grievance.user_id !== req.user!.userId) {
      return res.status(404).json({ error: 'Grievance not found.' });
    }

    const existingAppeal = AppealModel.findByGrievanceId(grievance.id);
    const eligibility = AppealEligibility.evaluate(grievance.status, grievance.resolved_at, existingAppeal?.status);
    if (!eligibility.isEligible) {
      return res.status(400).json({ error: eligibility.reason });
    }

    const { reason, aiDraftUsed } = z.object({
      reason: z.string().min(10, 'Please explain your appeal grounds in at least 10 characters.'),
      aiDraftUsed: z.boolean().default(false),
    }).parse(req.body);

    const appealId = `app_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const createdAppeal = AppealModel.create({
      id: appealId,
      grievance_id: grievance.id,
      user_id: req.user!.userId,
      reason,
      ai_draft_used: aiDraftUsed ? 1 : 0,
      status: 'submitted',
      remarks: null,
      appellate_officer_id: null,
    });

    // Update grievance status to appealed and mark escalated
    GrievanceModel.updateStatus(grievance.id, 'appealed');
    GrievanceModel.setEscalated(grievance.id, true);

    // Record status history
    StatusHistoryModel.create({
      id: `sh_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      grievance_id: grievance.id,
      from_status: grievance.status,
      to_status: 'appealed',
      remarks: 'First appeal filed by citizen. Case escalated to Nodal Appellate Authority.',
      changed_by_type: 'citizen',
      changed_by_id: req.user!.userId,
    });

    // Notify citizen
    NotificationModel.create({
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      user_id: req.user!.userId,
      grievance_id: grievance.id,
      title_en: 'Appeal Submitted for Supervisory Review',
      title_hi: 'अपील पर्यवेक्षी समीक्षा के लिए प्रस्तुत',
      message_en: `Your appeal for grievance ${grievance.tracking_number} has been submitted to the Nodal Appellate Officer for independent review.`,
      message_hi: `शिकायत ${grievance.tracking_number} के लिए आपकी अपील स्वतंत्र समीक्षा हेतु नोडल अपीलीय अधिकारी को प्रस्तुत कर दी गई है।`,
    });

    res.status(201).json({ appeal: createdAppeal });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors[0].message });
    }
    next(err);
  }
});

// Citizen: Submit Satisfaction Feedback
grievancesRouter.post('/:id/feedback', authenticate, requireRole('citizen'), async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const grievance = GrievanceModel.findById(req.params.id);
    if (!grievance || grievance.user_id !== req.user!.userId) {
      return res.status(404).json({ error: 'Grievance not found.' });
    }

    const { rating, comments } = z.object({
      rating: z.number().int().min(1).max(5),
      comments: z.string().optional(),
    }).parse(req.body);

    GrievanceModel.submitFeedback(grievance.id, rating, comments);
    res.json({ message: 'Thank you for your feedback.' });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors[0].message });
    }
    next(err);
  }
});

// Citizen: In-app notifications
grievancesRouter.get('/notifications/all', authenticate, requireRole('citizen'), (req: AuthenticatedRequest, res: Response) => {
  const notifications = NotificationModel.findByUser(req.user!.userId);
  res.json({ notifications });
});

// Citizen: Mark all notifications read
grievancesRouter.post('/notifications/mark-read', authenticate, requireRole('citizen'), (req: AuthenticatedRequest, res: Response) => {
  NotificationModel.markAllAsRead(req.user!.userId);
  res.json({ success: true });
});
