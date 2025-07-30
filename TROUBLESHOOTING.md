# Troubleshooting Backend Connection Issues

## Common Issues and Solutions

### 1. Database Connection Issues

**Problem**: Database connection fails
**Solutions**:
- Ensure MySQL is running on your system
- Check if the database `final` exists
- Verify database credentials

**Quick Fix**:
1. Open MySQL command line or phpMyAdmin
2. Create database if it doesn't exist:
   ```sql
   CREATE DATABASE IF NOT EXISTS final;
   ```
3. Import the `final.sql` file to create tables

### 2. Environment Variables Missing

**Problem**: Database configuration not found
**Solution**: Create a `.env` file in the `backend` folder:

```env
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=final
DB_PORT=3306

# Server Configuration
PORT=8080
HOST=0.0.0.0
```

### 3. Port Already in Use

**Problem**: Port 8000 is already occupied
**Solution**: 
- Change the port in `.env` file: `PORT=3000`
- Or kill the process using port 8000

### 4. CORS Issues

**Problem**: Frontend can't connect to backend
**Solution**: The CORS middleware is already configured, but if issues persist:
- Check if the backend URL in frontend matches the backend port
- Ensure both frontend and backend are running

## Testing Steps

### Step 0: Check Environment Configuration
```bash
cd backend
node check_env.js
```

### Step 1: Test Database Connection
```bash
cd backend
node test_connection.js
```

### Step 2: Test Backend API
1. Start the backend server:
   ```bash
   cd backend
   npm start
   ```

2. Open `simple_test.html` in your browser
3. Check if the connection test passes

### Step 3: Test Full Application
1. Ensure backend is running on port 8080
2. Open `frontend/views/admin/product.html` in browser
3. Check browser console for any errors

## Quick Diagnostic Commands

### Check if MySQL is running:
```bash
# Windows
net start mysql

# macOS/Linux
sudo service mysql start
# or
brew services start mysql
```

### Check if port 8080 is available:
```bash
# Windows
netstat -an | findstr :8080

# macOS/Linux
lsof -i :8080
```

### Test database connection manually:
```bash
mysql -u root -p
USE final;
SELECT * FROM items LIMIT 5;
```

## Common Error Messages

### "Cannot connect to server"
- Backend server is not running
- Wrong port number
- Firewall blocking connection

### "Database connection failed"
- MySQL not running
- Wrong database credentials
- Database doesn't exist

### "CORS error"
- Backend URL mismatch
- CORS middleware not working
- Browser security settings

## Quick Fixes

1. **If database connection fails**:
   - Create `.env` file with correct credentials
   - Ensure MySQL is running
   - Import `final.sql` to create database

2. **If backend won't start**:
   - Check if port 8080 is free
   - Install dependencies: `npm install`
   - Check Node.js version: `node --version`

3. **If frontend can't connect**:
   - Verify backend is running on correct port
   - Check browser console for errors
   - Try using `simple_test.html` first

## Testing Files

- `check_env.js` - Environment configuration checker
- `simple_test.html` - Basic connection test
- `test_connection.js` - Backend database test
- `test_products.html` - Full DataTable test

Start with `simple_test.html` to isolate the issue, then move to the full application. 