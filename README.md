# GemTry - Product Management with File Upload

This project has been updated to include file upload functionality for product images in the create and update operations.

## Features Added

### Backend Changes

1. **Multer Configuration** (`backend/utils/multer.js`)
   - File upload middleware with proper storage configuration
   - Image file filtering (JPG, PNG, GIF only)
   - 5MB file size limit
   - Unique filename generation with timestamps

2. **Updated Product Controller** (`backend/controllers/products.js`)
   - Modified `createNewProduct` to handle file uploads
   - Modified `updateProductDetails` to handle file uploads and image replacement
   - Enhanced `deleteProduct` to remove associated image files
   - Improved error handling and database field mapping

3. **Updated Product Routes** (`backend/routes/products.js`)
   - Added multer middleware to POST and PUT endpoints
   - Added error handling for file upload issues

4. **Server Configuration** (`backend/server.js`)
   - Added static file serving for uploaded images
   - Added CORS support for cross-origin requests

### Frontend Changes

1. **Updated Product Form** (`frontend/views/admin/product.html`)
   - Added file input field for image upload
   - Added image preview functionality
   - Added file type restrictions and size information

2. **New JavaScript File** (`frontend/js/products.js`)
   - Complete product management functionality
   - File upload handling with FormData
   - Image preview and validation
   - CRUD operations with API integration

## API Endpoints

### Create Product
- **POST** `/api/v1/product`
- **Content-Type**: `multipart/form-data`
- **Body**: 
  - `name` (required): Product name
  - `price` (required): Product price
  - `description` (optional): Product description
  - `image` (optional): Product image file

### Update Product
- **PUT** `/api/v1/product/:id`
- **Content-Type**: `multipart/form-data`
- **Body**: Same as create, but `image` is optional (only upload if changing)

### Get Product
- **GET** `/api/v1/product/:id`
- Returns product details including image path

### Delete Product
- **DELETE** `/api/v1/product/:id`
- Automatically removes associated image file

## File Storage

- Images are stored in `backend/storage/items/`
- Files are accessible via `/storage/items/filename`
- Unique filenames prevent conflicts
- Old images are automatically deleted when replaced

## Usage

1. **Starting the Backend**:
   ```bash
   cd backend
   npm install
   npm start
   ```

2. **Accessing the Admin Panel**:
   - Open `frontend/views/admin/product.html` in a browser
   - Or serve the frontend files using a local server

3. **Adding a Product**:
   - Click "Add Product" button
   - Fill in required fields (name, price)
   - Optionally add description and image
   - Click "Save Product"

4. **Editing a Product**:
   - Click the edit button on any product row
   - Modify fields as needed
   - Upload new image to replace existing one
   - Click "Save Product"

## File Upload Restrictions

- **File Types**: JPG, JPEG, PNG, GIF only
- **File Size**: Maximum 5MB
- **Field Name**: Must be `image` for single file upload

## Error Handling

- File type validation with user-friendly error messages
- File size limit enforcement
- Database error handling
- Image file cleanup on product deletion

## Database Schema

The `items` table includes:
- `item_id`: Primary key
- `item_name`: Product name
- `item_price`: Product price
- `item_desc`: Product description
- `item_img`: Image file path (nullable)
- `created_at`: Creation timestamp
- `updated_at`: Last update timestamp

## Security Considerations

- File type validation prevents malicious uploads
- File size limits prevent server overload
- Unique filenames prevent path traversal attacks
- Automatic cleanup of old files 