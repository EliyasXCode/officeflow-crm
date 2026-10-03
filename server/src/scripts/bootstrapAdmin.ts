import { connectDB, disconnectDB } from '../config/db';
import { User } from '../models/User';
import { OfficeSettings } from '../models/OfficeSettings';
import { hashPassword } from '../utils/auth';
import { recordAuditLog } from '../utils/audit';

const bootstrapAdmin = async () => {
  try {
    console.log('[Bootstrap] Initializing database connection...');
    await connectDB();

    const existingAdmin = await User.findOne({ role: 'admin', status: 'active' });
    if (existingAdmin) {
      console.log(`[Bootstrap] An active admin account already exists: ${existingAdmin.email}`);
      await disconnectDB();
      return;
    }

    const email = process.env.ADMIN_EMAIL || 'admin@officeflow.internal';
    const name = process.env.ADMIN_NAME || 'OfficeFlow Administrator';
    const password = process.env.ADMIN_PASSWORD || 'Admin@123456';

    const passwordHash = await hashPassword(password);

    const admin = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
      role: 'admin',
      status: 'active',
      jobTitle: 'Head of Operations',
    });

    // Ensure initial office settings
    const settings = await OfficeSettings.findOne();
    if (!settings) {
      await OfficeSettings.create({
        officeName: 'OfficeFlow Global HQ',
        currency: 'INR',
        timezone: 'Asia/Kolkata',
        updatedBy: admin._id,
      });
    }

    await recordAuditLog({
      userId: (admin._id as any).toString(),
      userName: admin.name,
      userRole: 'admin',
      action: 'ADMIN_BOOTSTRAP',
      entityType: 'User',
      entityId: (admin._id as any).toString(),
      details: { email: admin.email },
    });

    console.log('====================================================');
    console.log(' OfficeFlow CRM - Initial Admin Bootstrapped!       ');
    console.log('====================================================');
    console.log(` Admin Name    : ${name}`);
    console.log(` Admin Email   : ${email}`);
    console.log(` Password      : ${password}`);
    console.log(' Please change this password upon initial production login.');
    console.log('====================================================');

    await disconnectDB();
  } catch (err) {
    console.error('[Bootstrap] Failed to bootstrap admin:', err);
    process.exit(1);
  }
};

bootstrapAdmin();
