require('dotenv').config();
const config = require('./config/server');

console.log('🔧 Environment Configuration Check');
console.log('================================');
console.log('');

console.log('📊 Server Configuration:');
console.log(`   HOST: ${config.HOST}`);
console.log(`   PORT: ${config.PORT}`);
console.log('');

console.log('🗄️  Database Configuration:');
console.log(`   DB_HOST: ${config.DB_HOST}`);
console.log(`   DB_USER: ${config.DB_USER}`);
console.log(`   DB_NAME: ${config.DB_NAME}`);
console.log(`   DB_PORT: ${config.DB_PORT}`);
console.log(`   DB_PASSWORD: ${config.DB_PASSWORD ? '[SET]' : '[NOT SET]'}`);
console.log('');

console.log('📁 File Upload Configuration:');
console.log(`   UPLOAD_PATH: ${config.UPLOAD_PATH}`);
console.log(`   MAX_FILE_SIZE: ${config.MAX_FILE_SIZE / (1024 * 1024)}MB`);
console.log('');

console.log('🌐 CORS Configuration:');
console.log(`   CORS_ORIGIN: ${config.CORS_ORIGIN}`);
console.log(`   CORS_METHODS: ${config.CORS_METHODS.join(', ')}`);
console.log('');

// Check if required environment variables are set
const requiredVars = ['DB_HOST', 'DB_USER', 'DB_NAME', 'DB_PASSWORD'];
const missingVars = [];

requiredVars.forEach(varName => {
    if (!process.env[varName]) {
        missingVars.push(varName);
    }
});

if (missingVars.length > 0) {
    console.log('❌ Missing required environment variables:');
    missingVars.forEach(varName => {
        console.log(`   - ${varName}`);
    });
    console.log('');
    console.log('💡 Please check your .env file and ensure all required variables are set.');
} else {
    console.log('✅ All required environment variables are set!');
}

console.log('');
console.log('🚀 You can now start the server with: npm start'); 