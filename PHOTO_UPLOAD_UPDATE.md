# Photo Upload Feature Update

## Summary
Updated Step 2 of the auction creation form to allow users to select and upload **multiple photos at once** (up to 10) from any single photo upload button.

## Changes Made

### File Modified
- `app/auction/create/steps/step2-photos.tsx`

### What Changed

#### Before
- Each "Photo 1", "Photo 2", etc. upload button could only select **1 photo** at a time
- User had to click and upload 10 times to add 10 photos

#### After
- Each upload button can now select **multiple photos** at once (up to 10 total)
- User can Ctrl+Click or Shift+Click to select multiple files in the file picker
- If user selects 1 photo → uploads to that specific slot
- If user selects multiple photos → uploads all of them starting from available slots

### Technical Implementation

#### 1. Added `multiple` Attribute to File Input
```tsx
<input
  type="file"
  accept="image/jpeg,image/jpg,image/png,image/webp"
  multiple  // ← NEW: Allow multiple file selection
  onChange={(e) => {
    if (e.target.files && e.target.files.length > 0) {
      if (e.target.files.length === 1) {
        handleFileUpload(e.target.files[0], index)  // Single file
      } else {
        handleMultipleFileUpload(e.target.files, index)  // Multiple files
      }
    }
  }}
/>
```

#### 2. New Function: `handleMultipleFileUpload`
```typescript
const handleMultipleFileUpload = async (files: FileList, startIndex: number) => {
  // Calculate available slots
  const currentPhotoCount = formData.photos.filter((p) => p && p.trim() !== "").length
  const availableSlots = 10 - currentPhotoCount
  
  // Check if user is trying to upload too many
  if (files.length > availableSlots) {
    setUploadError(`You can only upload ${availableSlots} more photo(s)`)
    return
  }
  
  // Validate each file (type, size)
  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    // Check file type and size...
  }
  
  // Upload all files in parallel
  const uploadPromises = Array.from(files).map(async (file) => {
    // Upload to /api/upload
  })
  
  const uploadedUrls = await Promise.all(uploadPromises)
  
  // Add URLs to available slots
  const newPhotos = [...formData.photos]
  uploadedUrls.forEach((url, i) => {
    const targetIndex = currentPhotoCount + i
    if (targetIndex < 10) {
      newPhotos[targetIndex] = url
    }
  })
  
  updateFormData({ photos: newPhotos })
}
```

### User Experience

#### How to Use
1. Click on any "Upload" button (Photo 1, Photo 2, etc.)
2. In the file picker:
   - **Single photo**: Click one file and open
   - **Multiple photos**: Hold Ctrl (or Cmd on Mac) and click multiple files, or hold Shift to select a range
3. All selected photos upload at once
4. Photos fill available slots automatically

#### Example Scenarios
- **Scenario 1**: Click "Photo 1" → Select 5 photos → Photos appear in slots 1-5
- **Scenario 2**: Already have 3 photos → Click "Photo 4" → Select 7 more → Photos fill slots 4-10
- **Scenario 3**: Already have 8 photos → Try to upload 5 more → Error: "You can only upload 2 more photo(s)"

### Validation Rules (Unchanged)
- **Minimum**: 5 photos required to proceed
- **Maximum**: 10 photos total
- **File Types**: JPG, PNG, WEBP only
- **File Size**: 5MB maximum per photo

### Error Messages
- `"You can only upload X more photo(s). Maximum 10 photos total."`
- `"File [filename] is not a valid image type (JPG, PNG, or WEBP only)"`
- `"File [filename] is too large (max 5MB)"`
- `"Failed to upload some images. Please try again."`

### UI Updates
Added helpful hint in requirements section:
- "**You can select multiple photos at once (Ctrl+Click or Shift+Click)**"

Added hint under upload button:
- "(select up to 10)"

### Browser Compatibility
The `multiple` attribute is supported by all modern browsers:
- ✅ Chrome/Edge
- ✅ Firefox  
- ✅ Safari
- ✅ Opera

### Testing Checklist
- [x] Single photo upload works
- [x] Multiple photos upload (2-5 at once)
- [x] Upload exactly 10 photos at once
- [x] Try to upload more than available slots (shows error)
- [x] Upload invalid file type (shows specific error)
- [x] Upload file > 5MB (shows specific error)
- [x] Remove photos and upload more
- [x] Verify minimum 5 photos required to proceed

## Notes
- Original UI layout preserved (Photo 1, Photo 2, etc. grid)
- Upload endpoint `/api/upload` remains unchanged
- Database structure unchanged
- Photos stored in `public/uploads/vehicles/`
- All validation rules remain the same
