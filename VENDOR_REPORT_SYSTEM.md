# Vendor Report System - Implementation Guide

## Overview
A comprehensive reporting system for vendor shops that allows users to report problematic vendors and admins to review, manage, and take action on those reports.

## Features Implemented

### User Features
1. **Report Vendor Button** - Added to each vendor card
2. **Report Modal** - Professional modal with multiple report categories
3. **Report Categories**:
   - Incorrect Information
   - Closed Permanently
   - Duplicate Listing
   - Inappropriate Content
   - Spam
   - Scam/Fraud
   - Safety Concern
   - Other

### Admin Features
1. **Dedicated Admin Panel** - `/admin/vendor-reports`
2. **Report Statistics Dashboard**
3. **Report Management**:
   - View all reports with filtering (All, Pending, Under Review, Resolved, Dismissed)
   - Detailed report view with vendor and reporter information
   - Update report status
   - Add admin notes
4. **Vendor Management**:
   - Delete vendors with reason logging
   - Action tracking (vendor-updated, vendor-deleted, warning-sent)

## Backend Implementation

### Models
**File**: `backend/src/models/vendorReport.model.js`
- Report tracking with status management
- Category classification
- Admin review tracking
- Action logging

### Controllers
**File**: `backend/src/controllers/vendorReport.controller.js`
- `createVendorReport` - Users can submit reports
- `getVendorReports` - Admin retrieves all reports with filters
- `getVendorReportById` - Get detailed report info
- `updateVendorReportStatus` - Admin updates report status
- `deleteVendor` - Admin deletes vendor and updates report
- `getVendorReportStats` - Statistics for admin dashboard

### Routes
**File**: `backend/src/routers/vendorReport.router.js`
```javascript
// User routes
POST   /api/vendor-reports              - Submit a report (protected)

// Admin routes (protected + admin check)
GET    /api/vendor-reports              - Get all reports with filters
GET    /api/vendor-reports/stats        - Get report statistics
GET    /api/vendor-reports/:reportId    - Get report details
PUT    /api/vendor-reports/:reportId    - Update report status
DELETE /api/vendor-reports/vendor/:vendorId - Delete vendor
```

## Frontend Implementation

### Components

#### VendorReportModal
**File**: `frontend/src/components/VendorReportModal.jsx`
- User-friendly report submission form
- Category selection with descriptions
- Reason text area with character counter
- Validation and error handling

#### VendorReportsAdmin
**File**: `frontend/src/pages/VendorReportsAdmin.jsx`
- Full admin interface for managing vendor reports
- Filter by status (Pending, Under Review, Resolved, Dismissed)
- Detailed report view modal
- Quick actions for status updates
- Vendor deletion with confirmation

### Pages Updates

#### VendorsPage
**File**: `frontend/src/pages/VendorsPage.jsx`
- Added "Report" button to vendor action bar
- Integrated report modal
- Only visible to authenticated users

#### AdminDashboard
**File**: `frontend/src/pages/AdminDashboard.jsx`
- Added quick link to Vendor Reports section

#### App Routes
**File**: `frontend/src/App.jsx`
- Added `/admin/vendor-reports` route (admin only)

## API Usage

### Submit a Report (User)
```javascript
POST /api/vendor-reports
Content-Type: application/json
Authorization: Bearer <token>

{
  "vendorId": "vendor_id_here",
  "category": "incorrect-information",
  "reason": "The phone number and address are wrong..."
}
```

### Get All Reports (Admin)
```javascript
GET /api/vendor-reports?status=pending
Authorization: Bearer <admin_token>
```

### Update Report Status (Admin)
```javascript
PUT /api/vendor-reports/:reportId
Authorization: Bearer <admin_token>

{
  "status": "resolved",
  "adminNotes": "Issue resolved - vendor information updated",
  "actionTaken": "vendor-updated"
}
```

### Delete Vendor (Admin)
```javascript
DELETE /api/vendor-reports/vendor/:vendorId
Authorization: Bearer <admin_token>

{
  "reportId": "report_id_here",
  "reason": "Confirmed fraudulent business"
}
```

## User Flow

### For Regular Users
1. Browse vendors on the Vendors page
2. Click "Report" button on a vendor card
3. Select appropriate report category
4. Provide detailed reason (minimum 10 characters)
5. Submit report
6. Receive confirmation

### For Admins
1. Access Admin Dashboard
2. Click "Vendor Reports" quick link
3. View report statistics
4. Filter reports by status
5. Click "Details" on any report to:
   - View full vendor information
   - See reporter details
   - Review report reason
   - Take action:
     - Mark as "Under Review"
     - Resolve the report
     - Dismiss the report
     - Delete the vendor

## Security Features

1. **Authentication Required**:
   - Users must be logged in to submit reports
   - Duplicate report prevention (one pending report per user per vendor)

2. **Admin Authorization**:
   - All admin endpoints protected with `adminCheck` middleware
   - Only users with `role: 'admin'` can access

3. **Validation**:
   - Required fields validation
   - Character limits (1000 for reason, notes)
   - Status enum validation
   - Category enum validation

4. **Audit Trail**:
   - Tracks who submitted the report
   - Tracks who reviewed the report
   - Timestamps for all actions
   - Action logging (what was done)

## Testing

### Test User Report Flow
1. Create a test user account
2. Navigate to `/vendors`
3. Find any vendor and click "Report"
4. Fill out the form and submit
5. Check for success toast notification

### Test Admin Flow
1. Create/use an admin account (role: 'admin')
2. Navigate to `/admin/vendor-reports`
3. Verify you can see submitted reports
4. Test filtering by status
5. Click "Details" on a report
6. Test status updates
7. Test vendor deletion (use a test vendor)

## Database Schema

### VendorReport Collection
```javascript
{
  _id: ObjectId,
  reportedBy: ObjectId(User),
  vendor: ObjectId(Vendor),
  vendorName: String,
  reason: String,
  category: String (enum),
  status: String (enum: pending/under-review/resolved/dismissed),
  reviewedBy: ObjectId(User),
  reviewedAt: Date,
  adminNotes: String,
  actionTaken: String (enum),
  createdAt: Date,
  updatedAt: Date
}
```

## Deployment Notes

1. **Backend**:
   - Import vendorReport router in `index.js`
   - Mount at `/api/vendor-reports`
   - Ensure `adminCheck` middleware is working

2. **Frontend**:
   - Import and add `VendorReportsAdmin` page
   - Add route in `App.jsx`
   - Import and use `VendorReportModal` in `VendorsPage`

## Future Enhancements

1. Email notifications to admins when new reports arrive
2. Email notifications to reporters when status changes
3. Bulk actions for reports
4. Report analytics and trends
5. Auto-flag vendors with multiple reports
6. Integration with vendor verification system
7. Report export functionality (CSV, PDF)

## Troubleshooting

### "Access denied" when accessing admin panel
- Check user's role field in database
- Ensure `authUser.role === 'admin'`

### Reports not showing up
- Check backend logs for errors
- Verify API endpoint is correctly mounted
- Check browser console for frontend errors

### Cannot delete vendor
- Ensure vendor exists in database
- Check admin has proper permissions
- Verify vendorId is correct

## Support

For issues or questions, check:
1. Backend logs in terminal
2. Browser console for frontend errors
3. Network tab for API responses
4. Database collections for data integrity
