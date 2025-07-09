import { PrismaClient, UserRole } from '@prisma/client';
import { createHash } from 'crypto';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

function hashKey(key: string): string {
  return createHash('sha256').update(key).digest('hex');
}

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

async function main() {
  console.log('🌱 Seeding database...');

  // Create admin user
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@rnd.local' },
    update: {},
    create: {
      email: 'admin@rnd.local',
      name: 'System Administrator',
      password: await hashPassword('admin123'), // Default admin password
      role: UserRole.SUPER_ADMIN,
    },
  });

  console.log('✅ Created admin user:', adminUser.email);

  // Create API key policy
  const defaultPolicy = await prisma.apiKeyPolicy.upsert({
    where: { name: 'default' },
    update: {},
    create: {
      name: 'default',
      description: 'Default API key policy for regular users',
      maxKeysPerUser: 5,
      defaultRateLimit: 100,
      maxRateLimit: 1000,
      allowedEndpoints: ['random:*', 'esp32:raw'],
    },
  });

  console.log('✅ Created API key policy:', defaultPolicy.name);

  // Create API keys from environment variables
  const apiKeys = [
    {
      name: 'Main Application Key',
      key: process.env.API_KEY_MAIN || 'rnd_dev_main_key_12345',
      permissions: ['random:*'],
      rateLimit: 100,
      userId: adminUser.id,
    },
    {
      name: 'Admin Key',
      key: process.env.API_KEY_ADMIN || 'rnd_dev_admin_key_67890',
      permissions: ['*'],
      rateLimit: 1000,
      userId: adminUser.id,
    },
    {
      name: 'Limited Access Key',
      key: process.env.API_KEY_LIMITED || 'rnd_dev_limited_key_abcde',
      permissions: ['random:number', 'random:boolean'],
      rateLimit: 10,
      userId: adminUser.id,
    },
  ];

  for (const keyData of apiKeys) {
    const keyHash = hashKey(keyData.key);
    const keyPreview = `${keyData.key.substring(0, 12)}...`;

    const apiKey = await prisma.apiKey.upsert({
      where: { keyHash },
      update: {
        permissions: keyData.permissions,
        rateLimit: keyData.rateLimit,
      },
      create: {
        name: keyData.name,
        keyHash,
        keyPreview,
        permissions: keyData.permissions,
        rateLimit: keyData.rateLimit,
        userId: keyData.userId,
      },
    });

    console.log('✅ Created/updated API key:', apiKey.name);
  }

  // Create initial app configuration
  const configs = [
    {
      key: 'rate_limit_global_max',
      value: process.env.RATE_LIMIT_GLOBAL_MAX || '100',
      description: 'Global rate limit maximum requests per minute',
    },
    {
      key: 'rate_limit_random_max',
      value: process.env.RATE_LIMIT_RANDOM_MAX || '30',
      description: 'Random endpoint rate limit maximum requests per minute',
    },
    {
      key: 'rate_limit_strict_max',
      value: process.env.RATE_LIMIT_STRICT_MAX || '10',
      description: 'Strict endpoint rate limit maximum requests per 5 minutes',
    },
    {
      key: 'max_request_size',
      value: process.env.MAX_REQUEST_SIZE || '10240',
      description: 'Maximum request body size in bytes',
    },
    {
      key: 'enable_request_logging',
      value: process.env.ENABLE_REQUEST_LOGGING || 'true',
      description: 'Enable detailed request logging',
    },
    {
      key: 'allowed_origins',
      value: process.env.ALLOWED_ORIGINS || 'http://localhost:3000,https://rnd.so',
      description: 'Comma-separated list of allowed CORS origins',
    },
  ];

  for (const config of configs) {
    await prisma.appConfig.upsert({
      where: { key: config.key },
      update: { value: config.value },
      create: config,
    });

    console.log('✅ Created/updated config:', config.key);
  }

  console.log('🎉 Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
