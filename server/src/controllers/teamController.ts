import { Response } from 'express';
import { Team } from '../models/Team';
import { User } from '../models/User';
import { Lead } from '../models/Lead';
import { Deal } from '../models/Deal';
import { Task } from '../models/Task';
import { recordAuditLog } from '../utils/audit';
import { AuthenticatedRequest } from '../types';
import { sanitizeUser } from '../utils/auth';

export const listTeams = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const teams = await Team.find().populate('managerId', 'name email jobTitle').sort({ name: 1 });

  // Enrich with member count
  const teamsWithCounts = await Promise.all(
    teams.map(async (t) => {
      const memberCount = await User.countDocuments({ teamId: t._id, status: 'active' });
      return {
        ...t.toObject(),
        memberCount,
      };
    })
  );

  res.json({
    success: true,
    data: teamsWithCounts,
  });
};

export const createTeam = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { name, description, managerId } = req.body;

  const existingTeam = await Team.findOne({ name: name.trim() });
  if (existingTeam) {
    res.status(400).json({ success: false, message: 'A team with this name already exists.' });
    return;
  }

  if (managerId) {
    const manager = await User.findById(managerId);
    if (!manager || manager.status !== 'active') {
      res.status(400).json({ success: false, message: 'Invalid or inactive manager selected.' });
      return;
    }
  }

  const newTeam = await Team.create({
    name: name.trim(),
    description: description?.trim(),
    managerId: managerId || null,
  });

  // If manager assigned, ensure manager's teamId is set
  if (managerId) {
    await User.findByIdAndUpdate(managerId, { teamId: newTeam._id });
  }

  await recordAuditLog({
    action: 'TEAM_CREATED',
    entityType: 'Team',
    entityId: (newTeam._id as any).toString(),
    details: { name: newTeam.name, managerId },
    req,
  });

  res.status(201).json({
    success: true,
    message: 'Team created successfully.',
    data: newTeam,
  });
};

export const updateTeam = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { name, description, managerId } = req.body;

  const team = await Team.findById(id);
  if (!team) {
    res.status(404).json({ success: false, message: 'Team not found.' });
    return;
  }

  if (name && name.trim() !== team.name) {
    const duplicate = await Team.findOne({ name: name.trim(), _id: { $ne: id } });
    if (duplicate) {
      res.status(400).json({ success: false, message: 'Another team with this name already exists.' });
      return;
    }
    team.name = name.trim();
  }

  if (description !== undefined) team.description = description.trim();
  if (managerId !== undefined) {
    team.managerId = managerId || null;
    if (managerId) {
      await User.findByIdAndUpdate(managerId, { teamId: team._id });
    }
  }

  await team.save();

  await recordAuditLog({
    action: 'TEAM_UPDATED',
    entityType: 'Team',
    entityId: id,
    details: { name, description, managerId },
    req,
  });

  res.json({
    success: true,
    message: 'Team updated successfully.',
    data: team,
  });
};

export const getTeamMembersWithWorkload = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const { id } = req.params;
  const currentUser = req.user!;

  if (currentUser.role === 'manager' && currentUser.teamId?.toString() !== id) {
    res.status(403).json({ success: false, message: 'Managers can only view their own team members.' });
    return;
  }

  const members = await User.find({ teamId: id, status: 'active' }).sort({ name: 1 });

  const membersWithWorkload = await Promise.all(
    members.map(async (member) => {
      const openLeadsCount = await Lead.countDocuments({
        assignedTo: member._id,
        status: { $nin: ['Converted', 'Unqualified'] },
        isArchived: false,
      });

      const openDealsCount = await Deal.countDocuments({
        assignedTo: member._id,
        stage: { $nin: ['Won', 'Lost'] },
        isArchived: false,
      });

      const overdueTasksCount = await Task.countDocuments({
        assignedTo: member._id,
        status: { $ne: 'Done' },
        dueDate: { $lt: new Date() },
      });

      return {
        ...sanitizeUser(member),
        workload: {
          openLeads: openLeadsCount,
          openDeals: openDealsCount,
          overdueTasks: overdueTasksCount,
        },
      };
    })
  );

  res.json({
    success: true,
    data: membersWithWorkload,
  });
};
