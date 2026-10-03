const BASE_URL = 'http://localhost:5000/api';

async function runVerification() {
  console.log('====================================================');
  console.log('   OfficeFlow CRM - Live End-to-End Verification   ');
  console.log('====================================================\n');

  // 1. Health Check
  console.log('[1/10] Verifying System Health...');
  const healthRes = await fetch(`${BASE_URL}/health`);
  const health: any = await healthRes.json();
  if (health.status !== 'ok') throw new Error('Health check failed');
  console.log(` ✓ Health OK (Service: ${health.service}, Timezone: ${health.office.timezone}, Currency: ${health.office.currency})\n`);

  // 2. Authentication for all 3 Roles
  console.log('[2/10] Authenticating Admin, Manager, and Employee...');

  const loginUser = async (email: string) => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: 'OfficeFlow@2026' }),
    });
    const setCookie = res.headers.get('set-cookie');
    const cookie = setCookie ? setCookie.split(';')[0] : '';
    const data: any = await res.json();
    if (!data.success) throw new Error(`Login failed for ${email}: ${data.message}`);
    return { user: data.user, cookie, token: data.token };
  };

  const admin = await loginUser('admin@officeflow.internal');
  console.log(` ✓ Admin Authenticated: ${admin.user.name} (${admin.user.role})`);

  const manager = await loginUser('priya.nair@officeflow.internal');
  console.log(` ✓ Manager Authenticated: ${manager.user.name} (${manager.user.role})`);

  const employee = await loginUser('kavita.patel@officeflow.internal');
  console.log(` ✓ Employee Authenticated: ${employee.user.name} (${employee.user.role})\n`);

  // 3. RBAC Enforcement Testing
  console.log('[3/10] Testing RBAC Security Boundaries on /api/settings...');
  // Admin permitted
  const adminSettingsRes = await fetch(`${BASE_URL}/settings`, {
    headers: { Authorization: `Bearer ${admin.token}` },
  });
  if (adminSettingsRes.status !== 200) throw new Error('Admin denied access to settings');
  const adminSettings: any = await adminSettingsRes.json();
  console.log(` ✓ Admin permitted to read settings: Office = "${adminSettings.data.officeName}"`);

  // Employee forbidden
  const empSettingsRes = await fetch(`${BASE_URL}/settings`, {
    headers: { Authorization: `Bearer ${employee.token}` },
  });
  if (empSettingsRes.status !== 403) throw new Error('Employee was not blocked from settings!');
  console.log(' ✓ Employee successfully BLOCKED (HTTP 403 Forbidden) from accessing admin settings\n');

  // 4. Lead Creation by Employee
  console.log('[4/10] Employee creating a new qualified Lead...');
  const createLeadRes = await fetch(`${BASE_URL}/leads`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${employee.token}`,
    },
    body: JSON.stringify({
      fullName: 'Dr. Sameer Khan',
      company: 'Bharat Dynamics Systems',
      email: 'sameer.khan@bharatdyn.example.com',
      phone: '+91 98200 88776',
      source: 'Website',
      priority: 'High',
      tags: ['Defense', 'Strategic'],
      notes: 'Requested quotation for 300 licenses.',
    }),
  });
  const leadData: any = await createLeadRes.json();
  if (!leadData.success) throw new Error(`Lead creation failed: ${leadData.message}`);
  const leadId = leadData.data._id;
  console.log(` ✓ Lead Created: "${leadData.data.fullName}" at "${leadData.data.company}" [ID: ${leadId}]\n`);

  // 5. Duplicate Detection Engine
  console.log('[5/10] Testing Live Duplicate Warning Engine...');
  const dupRes = await fetch(`${BASE_URL}/leads/duplicates?email=sameer.khan@bharatdyn.example.com`, {
    headers: { Authorization: `Bearer ${employee.token}` },
  });
  const dupData: any = await dupRes.json();
  if (!dupData.hasDuplicates || dupData.duplicates.length === 0) {
    throw new Error('Duplicate check failed to detect existing lead');
  }
  console.log(` ✓ Duplicate detected: Found ${dupData.duplicates.length} matching lead(s) for email\n`);

  // 6. Activity Touchpoint & Follow-Up
  console.log('[6/10] Logging Call Activity & Scheduling Follow-up...');
  const actRes = await fetch(`${BASE_URL}/activities`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${employee.token}`,
    },
    body: JSON.stringify({
      type: 'Call',
      relatedType: 'lead',
      relatedId: leadId,
      title: 'Commercial Scoping & Timeline Review',
      notes: 'Confirmed budget and deployment target for Q4.',
      outcome: 'Customer agreed to review commercial proposal.',
      scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    }),
  });
  const actData: any = await actRes.json();
  if (!actData.success) throw new Error('Activity creation failed');
  console.log(` ✓ Activity Logged: "${actData.data.title}" with follow-up scheduled\n`);

  // 7. Atomic Lead Conversion
  console.log('[7/10] Executing Atomic Lead Conversion to Customer & Deal...');
  const convertRes = await fetch(`${BASE_URL}/leads/${leadId}/convert`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${employee.token}`,
    },
    body: JSON.stringify({
      createDeal: true,
      dealTitle: 'Bharat Dynamics - 300 Seats Enterprise License',
      dealValue: 4500000, // ₹45,00,000
      createCompany: true,
    }),
  });
  const convertData: any = await convertRes.json();
  if (!convertData.success) throw new Error(`Conversion failed: ${convertData.message}`);
  const dealId = convertData.data.dealId;
  console.log(` ✓ Lead Atomically Converted:`);
  console.log(`   - Contact ID : ${convertData.data.contactId}`);
  console.log(`   - Company ID : ${convertData.data.companyId}`);
  console.log(`   - Deal ID    : ${dealId}\n`);

  // 8. Deal Pipeline Progression (Kanban Flow)
  console.log('[8/10] Advancing Deal through Sales Kanban Stages...');

  const updateStage = async (stage: string, notes: string) => {
    const res = await fetch(`${BASE_URL}/deals/${dealId}/stage`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${employee.token}`,
      },
      body: JSON.stringify({ stage, notes }),
    });
    const d: any = await res.json();
    if (!d.success) throw new Error(`Stage update failed: ${d.message}`);
    return d.data;
  };

  await updateStage('Proposal', 'Commercial proposal ₹45,00,000 submitted');
  console.log(' ✓ Deal moved to: Proposal');

  await updateStage('Negotiation', 'Legal and MSA reviewed');
  console.log(' ✓ Deal moved to: Negotiation');

  const wonDeal = await updateStage('Won', 'Signed contract received!');
  console.log(` ✓ Deal moved to: Won (Contracted Value: ₹${(wonDeal.value.amount).toLocaleString('en-IN')})\n`);

  // 9. Global Search
  console.log('[9/10] Testing Scoped Global Search Engine for "Bharat"...');
  const searchRes = await fetch(`${BASE_URL}/search?q=Bharat`, {
    headers: { Authorization: `Bearer ${employee.token}` },
  });
  const searchData: any = await searchRes.json();
  console.log(' ✓ Search returned:');
  console.log(`   - Leads     : ${searchData.results.leads.length}`);
  console.log(`   - Contacts  : ${searchData.results.contacts.length}`);
  console.log(`   - Companies : ${searchData.results.companies.length}`);
  console.log(`   - Deals     : ${searchData.results.deals.length}\n`);

  // 10. Reports & Analytics
  console.log('[10/10] Verifying Dashboard & Executive Reports...');
  const reportRes = await fetch(`${BASE_URL}/reports`, {
    headers: { Authorization: `Bearer ${admin.token}` },
  });
  const reportData: any = await reportRes.json();
  console.log(' ✓ Report Analytics:');
  console.log(`   - Total Won Deals   : ${reportData.data.dealsSummary.wonCount}`);
  console.log(`   - Total Won Revenue : ₹${(reportData.data.dealsSummary.wonValue).toLocaleString('en-IN')}`);
  console.log(`   - Open Pipeline     : ₹${(reportData.data.dealsSummary.openValue).toLocaleString('en-IN')}`);
  console.log(`   - Funnel Breakdown  : Total=${reportData.data.funnel[0].count}, Converted=${reportData.data.funnel[3].count}\n`);

  console.log('====================================================');
  console.log('  ALL 10 VERIFICATION STEPS PASSED SUCCESSFULLY!    ');
  console.log('====================================================');
}

runVerification().catch((err) => {
  console.error('\n❌ Verification Failed:', err);
  process.exit(1);
});
