import { Router, Request, Response } from 'express';
import { DepartmentModel } from '../models/department.model';

export const departmentsRouter = Router();

// Public: Get all active departments for manual picker and informational display
departmentsRouter.get('/', (req: Request, res: Response) => {
  const departments = DepartmentModel.findAll();
  res.json({ departments });
});

// Public: Get single department by ID
departmentsRouter.get('/:id', (req: Request, res: Response) => {
  const dept = DepartmentModel.findById(req.params.id);
  if (!dept) {
    return res.status(404).json({ error: 'Department not found.' });
  }
  res.json({ department: dept });
});
