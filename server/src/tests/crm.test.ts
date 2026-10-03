import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../app';
import { connectDB, disconnectDB } from '../config/db';
import { User } from '../models/User';
import { Lead } from '../models/Lead';
import { Deal } from '../models/Deal';
import { Team } from '../models/Team';
import { hashPassword } from '../utils/auth';

describe('OfficeFlow CRM - Integration & RBAC Tests', () => {
  let adminCookie: string;
  let managerCookie: string;
  let employeeCookie: string;

  let northTeamId: string;
  let southTeamId: string;
  let adminUser: any;
  let managerUser: any;
  let employeeUser: any;
  let otherEmployeeUser: any;

  beforeAll(async () => {
    await connectDB();
    await User.deleteMany({});
    await Lead.deleteMany({});
    await Deal.deleteMany({});
    await Team.deleteMany({});

    const passwordHash = await hashPassword('Test@123456');

    // Create Teams
    const northTeam = await Team.create({ name: 'Test North Team' });
    const southTeam = await Team.create({ name: 'Test South Team' });
    northTeamId = (northTeam._id as any).toString();
    southTeamId = (southTeam._id as any).toString();

    // Create Admin
    adminUser = await User.create({
      name: 'Admin Tester',
      email: 'admin.test@officeflow.internal',
      passwordHash,
      role: 'admin',
      status: 'active',
    });

    // Create North Manager
    managerUser = await User.create({
      name: 'Manager Tester',
      email: 'manager.test@officeflow.internal',
      passwordHash,
      role: 'manager',
      status: 'active',
      teamId: northTeam._id,
    });

    // Create North Employee
    employeeUser = await User.create({
      name: 'Employee Tester',
      email: 'employee.test@officeflow.internal',
      passwordHash,
      role: 'employee',
      status: 'active',
      teamId: northTeam._id,
    });

    // Create South Employee
    otherEmployeeUser = await User.create({
      name: 'Other Employee',
      email: 'other.employee@officeflow.internal',
      passwordHash,
      role: 'employee',
      status: 'active',
      teamId: southTeam._id,
    });

    // Log in all 3 roles to capture session cookies
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin.test@officeflow.internal', password: 'Test@123456' });
    adminCookie = adminLogin.headers['set-cookie'][0];

    const managerLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'manager.test@officeflow.internal', password: 'Test@123456' });
    managerCookie = managerLogin.headers['set-cookie'][0];

    const employeeLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'employee.test@officeflow.internal', password: 'Test@123456' });
    employeeCookie = employeeLogin.headers['set-cookie'][0];
  }, 30000);

  afterAll(async () => {
    await disconnectDB();
  });

  describe('1. Authentication & Session Verification', () => {
    it('should authenticate user and return profile on /api/auth/me', async () => {
      const res = await request(app).get('/api/auth/me').set('Cookie', employeeCookie);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user.email).toBe('employee.test@officeflow.internal');
      expect(res.body.user.role).toBe('employee');
    });

    it('should reject unauthenticated requests to protected routes', async () => {
      const res = await request(app).get('/api/leads');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('2. RBAC Permissions Matrix', () => {
    it('Admin can access office settings', async () => {
      const res = await request(app).get('/api/settings').set('Cookie', adminCookie);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('Manager and Employee are FORBIDDEN from accessing office settings', async () => {
      const managerRes = await request(app).get('/api/settings').set('Cookie', managerCookie);
      expect(managerRes.status).toBe(403);

      const employeeRes = await request(app).get('/api/settings').set('Cookie', employeeCookie);
      expect(employeeRes.status).toBe(403);
    });

    it('Employee can only create leads assigned to themselves', async () => {
      const res = await request(app)
        .post('/api/leads')
        .set('Cookie', employeeCookie)
        .send({
          fullName: 'Siddharth Roy',
          email: 'siddharth@example.com',
          company: 'Roy Technologies',
          assignedTo: (otherEmployeeUser._id as any).toString(), // Employee trying to assign to another
        });

      expect(res.status).toBe(201);
      // Backend must strictly force assignment to the calling employee
      expect(res.body.data.assignedTo).toBe((employeeUser._id as any).toString());
    });
  });

  describe('3. Scoped Record Visibility', () => {
    let leadAssignedToOther: any;

    beforeAll(async () => {
      leadAssignedToOther = await Lead.create({
        fullName: 'Secret Client South',
        email: 'secret@southclient.com',
        company: 'South Enterprises',
        source: 'Website',
        status: 'New',
        assignedTo: otherEmployeeUser._id,
        teamId: southTeamId,
      });
    });

    it('Employee cannot view a lead assigned to another team/employee', async () => {
      const res = await request(app)
        .get(`/api/leads/${leadAssignedToOther._id}`)
        .set('Cookie', employeeCookie);
      expect(res.status).toBe(403);
    });

    it('Admin CAN view the lead assigned to any team/employee', async () => {
      const res = await request(app)
        .get(`/api/leads/${leadAssignedToOther._id}`)
        .set('Cookie', adminCookie);
      expect(res.status).toBe(200);
      expect(res.body.data.fullName).toBe('Secret Client South');
    });
  });

  describe('4. Atomic Lead Conversion Transaction', () => {
    it('should atomically convert lead to contact, company, and deal', async () => {
      const lead = await Lead.create({
        fullName: 'Dr. Vikram Sarabhai',
        email: 'vikram.s@isro-partner.org',
        company: 'Sarabhai Aerospace Systems',
        phone: '+91 98440 12345',
        source: 'Referral',
        status: 'Qualified',
        priority: 'High',
        assignedTo: adminUser._id,
        teamId: northTeamId,
      });

      const res = await request(app)
        .post(`/api/leads/${lead._id}/convert`)
        .set('Cookie', adminCookie)
        .send({
          createDeal: true,
          dealTitle: 'Sarabhai Satellite Ground Station CRM',
          dealValue: 5000000, // ₹50,00,000
          createCompany: true,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.contactId).toBeDefined();
      expect(res.body.data.dealId).toBeDefined();

      // Verify updated lead status
      const updatedLead = await Lead.findById(lead._id);
      expect(updatedLead?.status).toBe('Converted');
      expect(updatedLead?.convertedContactId).toBeDefined();

      // Verify created Deal
      const deal = await Deal.findById(res.body.data.dealId);
      expect(deal).toBeDefined();
      expect(deal?.title).toBe('Sarabhai Satellite Ground Station CRM');
      expect(deal?.value.amount).toBe(5000000);
      expect(deal?.value.currency).toBe('INR');
      expect(deal?.stage).toBe('Discovery');
    });

    it('should reject duplicate conversion on already converted lead', async () => {
      const convertedLead = await Lead.findOne({ status: 'Converted' });
      expect(convertedLead).toBeDefined();

      const res = await request(app)
        .post(`/api/leads/${convertedLead?._id}/convert`)
        .set('Cookie', adminCookie)
        .send({ createDeal: true });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('already been converted');
    });
  });

  describe('5. Deal Stage Persistence & History', () => {
    it('should change deal stage and log transition history', async () => {
      const deal = await Deal.findOne();
      expect(deal).toBeDefined();

      const res = await request(app)
        .put(`/api/deals/${deal?._id}/stage`)
        .set('Cookie', adminCookie)
        .send({
          stage: 'Won',
          notes: 'Customer accepted final contract.',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.stage).toBe('Won');

      const reloadedDeal = await Deal.findById(deal?._id);
      expect(reloadedDeal?.stage).toBe('Won');
      expect(reloadedDeal?.stageHistory.length).toBeGreaterThan(1);
    });
  });
});
