// Server Configuration
module.exports = {
    // Network Configuration
    HOST: process.env.HOST || '0.0.0.0',  // Bind to all network interfaces
    PORT: process.env.PORT || 8080,        // Default port
    
    // Database Configuration
    DB_HOST: process.env.DB_HOST || 'localhost',
    DB_USER: process.env.DB_USER || 'root',
    DB_PASSWORD: process.env.DB_PASSWORD || '',
    DB_NAME: process.env.DB_NAME || 'final',
    DB_PORT: process.env.DB_PORT || 3306,
    
    // File Upload Configuration
    UPLOAD_PATH: process.env.UPLOAD_PATH || 'storage/items',
    MAX_FILE_SIZE: process.env.MAX_FILE_SIZE || 5 * 1024 * 1024, // 5MB
    
    // CORS Configuration
    CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
    CORS_METHODS: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    CORS_HEADERS: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization']
}; 