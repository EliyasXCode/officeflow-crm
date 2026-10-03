import { connectDB, disconnectDB } from '../config/db';
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

const seedDatabase = async () => {
  try {
    console.log('[Seed] Connecting to database...');
    await connectDB();

    console.log('[Seed] Clearing existing demo data...');
    await Promise.all([
      User.deleteMany({}),
      Team.deleteMany({}),
      Company.deleteMany({}),
      Contact.deleteMany({}),
      Lead.deleteMany({}),
      Deal.deleteMany({}),
      Task.deleteMany({}),
      Activity.deleteMany({}),
      OfficeSettings.deleteMany({}),
      Notification.deleteMany({}),
    ]);

    const defaultPassword = process.env.SEED_PASSWORD || 'OfficeFlow@2026';
    const passwordHash = await hashPassword(defaultPassword);

    console.log('[Seed] Creating Office Settings...');
    await OfficeSettings.create({
      officeName: 'OfficeFlow Technologies (India HQ)',
      currency: 'INR',
      timezone: 'Asia/Kolkata',
      allowedLeadSources: ['Website', 'Referral', 'LinkedIn', 'Call', 'Walk-in', 'Other'],
      pipelineStages: ['Discovery', 'Proposal', 'Negotiation', 'Won', 'Lost'],
    });

    console.log('[Seed] Creating Teams...');
    const northTeam = await Team.create({
      name: 'North Enterprise Sales',
      description: 'Focusing on large enterprise accounts in NCR, Mumbai, and Gujarat.',
    });

    const southTeam = await Team.create({
      name: 'South Mid-Market Sales',
      description: 'Focusing on high-growth mid-market SaaS and fintech in Bengaluru and Hyderabad.',
    });

    console.log('[Seed] Creating Admin, Managers, and Employees...');
    // 1. Admin
    const admin = await User.create({
      name: 'Rajesh Sharma',
      email: 'admin@officeflow.internal',
      passwordHash,
      role: 'admin',
      status: 'active',
      jobTitle: 'VP of Global Operations',
      phone: '+91 98201 11223',
    });

    // 2. Managers
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

    // 3. Employees
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

    console.log('[Seed] Creating Companies...');
    const comp1 = await Company.create({
      name: 'Tata Apex Logistics',
      industry: 'Supply Chain & Logistics',
      website: 'https://tata-apex.example.com',
      phone: '+91 22 6665 8282',
      address: {
        street: 'Bombay House, Homi Mody Street',
        city: 'Mumbai',
        state: 'Maharashtra',
        postalCode: '400001',
        country: 'India',
      },
      assignedTo: emp1._id,
      teamId: northTeam._id,
      notes: 'Leading national 3PL provider looking for unified sales workflows.',
    });

    const comp2 = await Company.create({
      name: 'Infosys Cloud Labs',
      industry: 'Information Technology',
      website: 'https://infycloud.example.com',
      phone: '+91 80 2852 0261',
      address: {
        street: 'Electronics City, Hosur Road',
        city: 'Bengaluru',
        state: 'Karnataka',
        postalCode: '560100',
        country: 'India',
      },
      assignedTo: emp3._id,
      teamId: southTeam._id,
      notes: 'Global consulting partner evaluating enterprise CRM subscription.',
    });

    const comp3 = await Company.create({
      name: 'RazorSecure Fintech',
      industry: 'Fintech & Payments',
      website: 'https://razorsecure.example.com',
      phone: '+91 80 4666 7777',
      address: {
        street: 'Koramangala 4th Block',
        city: 'Bengaluru',
        state: 'Karnataka',
        postalCode: '560034',
        country: 'India',
      },
      assignedTo: emp3._id,
      teamId: southTeam._id,
      notes: 'Fast growing payment gateway expanding corporate merchant sales.',
    });

    console.log('[Seed] Creating Contacts...');
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
      notes: 'Met at Mumbai Logistics Summit 2026.',
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
      tags: ['Technical Evaluator', 'SaaS'],
      notes: 'Requested security compliance questionnaire.',
    });

    const contact3 = await Contact.create({
      name: 'Deepak Reddy',
      jobTitle: 'Director of Business Partnerships',
      email: 'deepak.reddy@razorsecure.example.com',
      phone: '+91 99880 12345',
      companyId: comp3._id,
      companyName: comp3.name,
      assignedTo: emp3._id,
      teamId: southTeam._id,
      tags: ['VIP', 'Fintech'],
    });

    console.log('[Seed] Creating Leads across various statuses...');
    const now = new Date();
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
    const yesterday = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000);
    const tomorrow = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000);
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const lead1 = await Lead.create({
      fullName: 'Aakash Gupta',
      company: 'Delhi Logistics Express',
      email: 'aakash@delhiexpress.example.com',
      phone: '+91 98110 99887',
      source: 'Website',
      status: 'New',
      priority: 'High',
      assignedTo: emp1._id,
      teamId: northTeam._id,
      tags: ['High Value', 'Logistics'],
      notes: 'Submitted demo request on website pricing page.',
      nextFollowUpDate: tomorrow,
    });

    const lead2 = await Lead.create({
      fullName: 'Pooja Hegde',
      company: 'Hyderabad BioPharm',
      email: 'pooja.h@biopharm.example.com',
      phone: '+91 94401 22334',
      source: 'LinkedIn',
      status: 'Contacted',
      priority: 'Medium',
      assignedTo: emp3._id,
      teamId: southTeam._id,
      tags: ['Pharma', 'Mid-Market'],
      notes: 'Introductory phone call completed. Needs product slide deck.',
      nextFollowUpDate: tomorrow,
    });

    const lead3 = await Lead.create({
      fullName: 'Gaurav Mehta',
      company: 'Ahmedabad Chemicals Ltd',
      email: 'gaurav.m@ahmedabadchem.example.com',
      phone: '+91 98250 55667',
      source: 'Referral',
      status: 'Qualified',
      priority: 'High',
      assignedTo: emp2._id,
      teamId: northTeam._id,
      tags: ['B2B Manufacturing'],
      notes: 'Budget confirmed at 15 Lakhs INR. Ready for proposal.',
      nextFollowUpDate: nextWeek,
    });

    const lead4 = await Lead.create({
      fullName: 'Ramesh Sundaram',
      company: 'Sundaram Small Motors',
      email: 'ramesh@sundarammotors.example.com',
      phone: '+91 94441 88990',
      source: 'Walk-in',
      status: 'Unqualified',
      priority: 'Low',
      assignedTo: emp4._id,
      teamId: southTeam._id,
      notes: 'Needs single-user freemium software, not enterprise CRM.',
    });

    console.log('[Seed] Creating Deals across stages...');
    const deal1 = await Deal.create({
      title: 'Tata Apex - 250 Seats Enterprise CRM Rollout',
      contactId: contact1._id,
      companyId: comp1._id,
      value: { amount: 3500000, currency: 'INR' }, // ₹35,00,000
      stage: 'Proposal',
      expectedCloseDate: new Date(now.getTime() + 20 * 24 * 60 * 60 * 1000),
      assignedTo: emp1._id,
      teamId: northTeam._id,
      notes: 'Custom ERP integration and annual support included.',
      stageHistory: [
        { stage: 'Discovery', changedBy: emp1._id, changedAt: twoDaysAgo, notes: 'Requirements gathered' },
        { stage: 'Proposal', changedBy: emp1._id, changedAt: yesterday, notes: 'Proposal submitted' },
      ],
    });

    const deal2 = await Deal.create({
      title: 'Infosys Cloud Labs - 120 Seats Annual License',
      contactId: contact2._id,
      companyId: comp2._id,
      value: { amount: 1800000, currency: 'INR' }, // ₹18,00,000
      stage: 'Negotiation',
      expectedCloseDate: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000),
      assignedTo: emp3._id,
      teamId: southTeam._id,
      notes: 'Legal and security MSA under review.',
      stageHistory: [
        { stage: 'Discovery', changedBy: emp3._id, changedAt: twoDaysAgo },
        { stage: 'Proposal', changedBy: emp3._id, changedAt: yesterday },
        { stage: 'Negotiation', changedBy: emp3._id, changedAt: now },
      ],
    });

    const deal3 = await Deal.create({
      title: 'RazorSecure Fintech - Merchant Portal CRM Expansion',
      contactId: contact3._id,
      companyId: comp3._id,
      value: { amount: 2400000, currency: 'INR' }, // ₹24,00,000
      stage: 'Won',
      expectedCloseDate: yesterday,
      assignedTo: emp3._id,
      teamId: southTeam._id,
      notes: 'Contract signed. Note: Invoiced amount collected separately.',
      stageHistory: [
        { stage: 'Discovery', changedBy: emp3._id, changedAt: twoDaysAgo },
        { stage: 'Proposal', changedBy: emp3._id, changedAt: yesterday },
        { stage: 'Negotiation', changedBy: emp3._id, changedAt: yesterday },
        { stage: 'Won', changedBy: emp3._id, changedAt: yesterday },
      ],
    });

    const deal4 = await Deal.create({
      title: 'North Logistics Cloud Pilot',
      contactId: contact1._id,
      companyId: comp1._id,
      value: { amount: 650000, currency: 'INR' }, // ₹6,50,000
      stage: 'Discovery',
      expectedCloseDate: new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000),
      assignedTo: emp2._id,
      teamId: northTeam._id,
      notes: 'Initial scoping session with branch heads.',
      stageHistory: [
        { stage: 'Discovery', changedBy: emp2._id, changedAt: now },
      ],
    });

    console.log('[Seed] Creating Tasks (Overdue, Due Today, Upcoming, Done)...');
    // Overdue task
    await Task.create({
      title: 'Send Revised Architecture Deck to Sunil Deshmukh',
      description: 'Incorporate Tata Apex feedback regarding on-prem security compliance.',
      assignedTo: emp1._id,
      teamId: northTeam._id,
      priority: 'High',
      status: 'To Do',
      dueDate: yesterday,
      relatedType: 'deal',
      relatedId: deal1._id,
    });

    // Today task
    await Task.create({
      title: 'Call Aakash Gupta for Lead Qualification',
      description: 'Discuss Delhi Logistics Express user count and timeline.',
      assignedTo: emp1._id,
      teamId: northTeam._id,
      priority: 'Medium',
      status: 'To Do',
      dueDate: now,
      relatedType: 'lead',
      relatedId: lead1._id,
    });

    // Upcoming task
    await Task.create({
      title: 'Prepare Contract Addendum for Infosys Cloud Labs',
      description: 'Draft SLA schedule for 99.9% uptime requirement.',
      assignedTo: emp3._id,
      teamId: southTeam._id,
      priority: 'High',
      status: 'To Do',
      dueDate: tomorrow,
      relatedType: 'deal',
      relatedId: deal2._id,
    });

    // Completed task
    await Task.create({
      title: 'Finalize Pricing Proposal for RazorSecure',
      description: 'Approved by Amit Verma (South Regional Manager).',
      assignedTo: emp3._id,
      teamId: southTeam._id,
      priority: 'High',
      status: 'Done',
      dueDate: yesterday,
      completedAt: yesterday,
      relatedType: 'deal',
      relatedId: deal3._id,
    });

    console.log('[Seed] Creating Activities...');
    await Activity.create({
      type: 'Meeting',
      authorId: emp1._id,
      relatedType: 'deal',
      relatedId: deal1._id,
      title: 'Executive Stakeholder Demonstration',
      notes: 'Presented product flow to VP of Logistics and VP of IT.',
      outcome: 'Client approved feature scope; requested formal commercial quote.',
      scheduledAt: yesterday,
      completedAt: yesterday,
    });

    await Activity.create({
      type: 'Call',
      authorId: emp3._id,
      relatedType: 'lead',
      relatedId: lead2._id,
      title: 'Discovery Phone Call',
      notes: 'Spoke with Pooja Hegde regarding Hyderabad BioPharm team size (45 users).',
      outcome: 'Interested in Q4 rollout. Scheduled follow-up email.',
      completedAt: yesterday,
    });

    await Activity.create({
      type: 'Follow-up',
      authorId: emp1._id,
      relatedType: 'lead',
      relatedId: lead1._id,
      title: 'Scheduled Follow-up Qualification Call',
      notes: 'Initial check-in after whitepaper download.',
      scheduledAt: tomorrow,
    });

    console.log('[Seed] Creating Notifications...');
    await Notification.create({
      userId: emp1._id,
      title: 'Task Overdue Notice',
      message: 'Task "Send Revised Architecture Deck to Sunil Deshmukh" was due yesterday.',
      type: 'task_due',
      link: '/tasks',
    });

    await Notification.create({
      userId: emp3._id,
      title: 'Deal Won Congratulations!',
      message: 'RazorSecure Fintech deal (₹24,00,000) has moved to Won stage.',
      type: 'system',
      link: '/deals',
    });

    console.log('====================================================');
    console.log(' OfficeFlow CRM - Development Demo Seed Complete!  ');
    console.log('====================================================');
    console.log(` Admin User     : ${admin.email} (Password: ${defaultPassword})`);
    console.log(` Manager (North): ${managerNorth.email} (Password: ${defaultPassword})`);
    console.log(` Manager (South): ${managerSouth.email} (Password: ${defaultPassword})`);
    console.log(` Employee (North): ${emp1.email} (Password: ${defaultPassword})`);
    console.log(` Employee (South): ${emp3.email} (Password: ${defaultPassword})`);
    console.log('====================================================');

    await disconnectDB();
  } catch (err) {
    console.error('[Seed] Database seeding failed:', err);
    process.exit(1);
  }
};

seedDatabase();
