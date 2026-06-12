const { z } = require('zod');

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('5000'),
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  CLOUDINARY_CLOUD_NAME: z.string().optional().default(''),
  CLOUDINARY_API_KEY: z.string().optional().default(''),
  CLOUDINARY_API_SECRET: z.string().optional().default(''),
  OPENWA_URL: z.string().default('http://localhost:3001'),
  WHATSAPP_ENABLED: z.string().default('false'),
  FRONTEND_URL: z.string().default('http://localhost:5173'),
  WA_API_KEY: z.string().optional().default(''),
});

const validateEnv = () => {
  try {
    const env = envSchema.parse(process.env);
    return env;
  } catch (error) {
    console.error('❌ Environment validation failed:');
    error.errors.forEach((err) => {
      console.error(`   ${err.path.join('.')}: ${err.message}`);
    });
    process.exit(1);
  }
};

module.exports = { validateEnv, envSchema };
