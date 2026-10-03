import { User } from '../models/User';
import { Team } from '../models/Team';
import { Company } from '../models/Company';
import { Contact } from '../models/Contact';
import { Lead } from '../models/Lead';
import { Deal } from '../models/Deal';
import { Task } from '../models/Task';
import { Activity } from '../models/Activity';
import { OfficeSettings } from '../models/OfficeSettings';
import { Notification } from '../models/Notification';
import { hashPassword } from '../utils/auth';

export const ensureDevSeed = async () => {
  const userCount = await User.countDocuments();
  if (userCount > 0) return;

  console.log('[DevSeed] Empty database detected. Auto-seeding development records...');

  const defaultPassword = process.env.SEED_PASSWORD || 'OfficeFlow@2026';
  const passwordHash = await hashPassword(defaultPassword);

  await OfficeSettings.create({
    officeName: 'OfficeFlow Technologies (India HQ)',
    currency: 'INR',
    timezone: 'Asia/Kolkata',
    allowedLeadSources: ['Website', 'Referral', 'LinkedIn', 'Call', 'Walk-in', 'Other'],
    pipelineStages: ['Discovery', 'Proposal', 'Negotiation', 'Won', 'Lost'],
  });

  const northTeam = await Team.create({
    name: 'North Enterprise Sales',
    description: 'Focusing on large enterprise accounts in NCR, Mumbai, and Gujarat.',
  });

  const southTeam = await Team.create({
    name: 'South Mid-Market Sales',
    description: 'Focusing on high-growth mid-market SaaS and fintech in Bengaluru and Hyderabad.',
  });

  const admin = await User.create({
    name: 'Rajesh Sharma',
    email: 'admin@officeflow.internal',
    passwordHash,
    role: 'admin',
    status: 'active',
    jobTitle: 'VP of Global Operations',
    phone: '+91 98201 11223',
  });

  const managerNorth = await User.create({
    name: 'Priya Nair',
    email: 'priya.nair@officeflow.internal',
    passwordHash,
    role: 'manager',
    status: 'active',
    teamId: northTeam._id,
    jobTitle: 'Enterprise Sales Director',
    phone: '+91 98450 33445',
  });
  northTeam.managerId = managerNorth._id;
  await northTeam.save();

  const managerSouth = await User.create({
    name: 'Amit Verma',
    email: 'amit.verma@officeflow.internal',
    passwordHash,
    role: 'manager',
    status: 'active',
    teamId: southTeam._id,
    jobTitle: 'Regional Sales Manager',
    phone: '+91 97110 55667',
  });
  southTeam.managerId = managerSouth._id;
  await southTeam.save();

  const emp1 = await User.create({
    name: 'Kavita Patel',
    email: 'kavita.patel@officeflow.internal',
    passwordHash,
    role: 'employee',
    status: 'active',
    teamId: northTeam._id,
    jobTitle: 'Senior Account Executive',
    phone: '+91 99302 77889',
  });

  const emp2 = await User.create({
    name: 'Rohan Joshi',
    email: 'rohan.joshi@officeflow.internal',
    passwordHash,
    role: 'employee',
    status: 'active',
    teamId: northTeam._id,
    jobTitle: 'Business Development Representative',
    phone: '+91 98199 22334',
  });

  const emp3 = await User.create({
    name: 'Ananya Iyer',
    email: 'ananya.iyer@officeflow.internal',
    passwordHash,
    role: 'employee',
    status: 'active',
    teamId: southTeam._id,
    jobTitle: 'Account Executive',
    phone: '+91 94440 66778',
  });

  const emp4 = await User.create({
    name: 'Vikram Singh',
    email: 'vikram.singh@officeflow.internal',
    passwordHash,
    role: 'employee',
    status: 'active',
    teamId: southTeam._id,
    jobTitle: 'Inside Sales Specialist',
    phone: '+91 96500 88990',
  });

  const comp1 = await Company.create({
    name: 'Tata Apex Logistics',
    industry: 'Supply Chain & Logistics',
    website: 'https://tata-apex.example.com',
    phone: '+91 22 6665 8282',
    assignedTo: emp1._id,
    teamId: northTeam._id,
    notes: 'Leading national 3PL provider looking for unified sales workflows.',
  });

  const comp2 = await Company.create({
    name: 'Infosys Cloud Labs',
    industry: 'Information Technology',
    website: 'https://infycloud.example.com',
    phone: '+91 80 2852 0261',
    assignedTo: emp3._id,
    teamId: southTeam._id,
  });

  const comp3 = await Company.create({
    name: 'RazorSecure Fintech',
    industry: 'Fintech & Payments',
    website: 'https://razorsecure.example.com',
    phone: '+91 80 4666 7777',
    assignedTo: emp3._id,
    teamId: southTeam._id,
  });

  const contact1 = await Contact.create({
    name: 'Sunil Deshmukh',
    jobTitle: 'Chief Procurement Officer',
    email: 'sunil.deshmukh@tata-apex.example.com',
    phone: '+91 98200 44556',
    companyId: comp1._id,
    companyName: comp1.name,
    assignedTo: emp1._id,
    teamId: northTeam._id,
    tags: ['Decision Maker', 'Enterprise'],
  });

  const contact2 = await Contact.create({
    name: 'Meera Krishnan',
    jobTitle: 'Head of Sales Operations',
    email: 'meera.k@infycloud.example.com',
    phone: '+91 98451 77889',
    companyId: comp2._id,
    companyName: comp2.name,
    assignedTo: emp3._id,
    teamId: southTeam._id,
  });

  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  await Lead.create([
    {
      fullName: 'Aakash Gupta',
      company: 'Delhi Logistics Express',
      email: 'aakash@delhiexpress.example.com',
      phone: '+91 98110 99887',
      source: 'Website',
      status: 'New',
      priority: 'High',
      assignedTo: emp1._id,
      teamId: northTeam._id,
      tags: ['High Value'],
      nextFollowUpDate: tomorrow,
    },
    {
      fullName: 'Pooja Hegde',
      company: 'Hyderabad BioPharm',
      email: 'pooja.h@biopharm.example.com',
      phone: '+91 94401 22334',
      source: 'LinkedIn',
      status: 'Contacted',
      priority: 'Medium',
      assignedTo: emp3._id,
      teamId: southTeam._id,
      tags: ['Pharma'],
      nextFollowUpDate: tomorrow,
    },
    {
      fullName: 'Gaurav Mehta',
      company: 'Ahmedabad Chemicals Ltd',
      email: 'gaurav.m@ahmedabadchem.example.com',
      phone: '+91 98250 55667',
      source: 'Referral',
      status: 'Qualified',
      priority: 'High',
      assignedTo: emp2._id,
      teamId: northTeam._id,
    },
  ]);

  await Deal.create([
    {
      title: 'Tata Apex - 250 Seats Enterprise CRM Rollout',
      contactId: contact1._id,
      companyId: comp1._id,
      value: { amount: 3500000, currency: 'INR' },
      stage: 'Proposal',
      expectedCloseDate: new Date(now.getTime() + 20 * 24 * 60 * 60 * 1000),
      assignedTo: emp1._id,
      teamId: northTeam._id,
      stageHistory: [{ stage: 'Proposal', changedAt: now, notes: 'Seeded' }],
    },
    {
      title: 'RazorSecure Fintech - Merchant Portal Expansion',
      contactId: contact2._id,
      companyId: comp3._id,
      value: { amount: 2400000, currency: 'INR' },
      stage: 'Won',
      expectedCloseDate: yesterday,
      assignedTo: emp3._id,
      teamId: southTeam._id,
      stageHistory: [{ stage: 'Won', changedAt: yesterday, notes: 'Contract executed' }],
    },
  ]);

  await Task.create([
    {
      title: 'Call Aakash Gupta for Lead Qualification',
      description: 'Discuss Delhi Logistics Express user count and timeline.',
      assignedTo: emp1._id,
      teamId: northTeam._id,
      priority: 'Medium',
      status: 'To Do',
      dueDate: now,
    },
    {
      title: 'Prepare Contract Addendum for Infosys Cloud Labs',
      description: 'Draft SLA schedule for 99.9% uptime requirement.',
      assignedTo: emp3._id,
      teamId: southTeam._id,
      priority: 'High',
      status: 'To Do',
      dueDate: tomorrow,
    },
  ]);

  await Notification.create({
    userId: emp1._id,
    title: 'Welcome to OfficeFlow CRM',
    message: 'Your sales workspace is configured and ready.',
    type: 'system',
  });

  console.log('[DevSeed] Auto-seeding completed successfully.');
};
