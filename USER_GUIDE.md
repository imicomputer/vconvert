# Video Converter Web Application - User Guide

**Version**: 1.0.0  
**Access**: http://localhost:3000

---

## Getting Started

### 1. Open the Application

Navigate to `http://localhost:3000` in your web browser.

You'll see the **Video Converter** interface with three main steps:

```
┌─────────────────────────────────────────────┐
│  🎬 Video Converter                         │
│  [Hardware Status Badge]  [Theme Toggle]    │
├─────────────────────────────────────────────┤
│ Step 1  ─────  Step 2  ─────  Step 3        │
│ Upload       Format       Convert           │
└─────────────────────────────────────────────┘
```

### 2. Theme & Settings

- **Dark Mode**: Default theme (respects your system preference)
- **Theme Toggle**: Click the sun/moon icon to switch themes
- **Persistent**: Your theme choice is saved and restored on next visit

---

## Step-by-Step Conversion

### Step 1: Upload Your Video

1. **Drag and Drop Method**:
   - Drag a video file from your computer
   - Drop it onto the upload zone
   - File will be uploaded immediately

2. **Browse Method**:
   - Click "Browse Files" button
   - Select a video file from your computer
   - File will be uploaded immediately

**Supported Input Formats**:
- MP4, MKV, WebM, AVI, MOV, FLV, WMV, 3GP

**File Limits**:
- Maximum size: 2GB
- If file exceeds limit: Error message will appear

**File Information**:
- Once uploaded, you'll see:
  - File name
  - File size (MB)
  - File extension
  - "Change" button to select different file

### Step 2: Choose Output Format

Once file is uploaded, you'll proceed to Step 2.

**Available Formats**:

| Format | Quality | Use Case | GPU Support |
|--------|---------|----------|-------------|
| MP4 | High | Web, mobile, universal | ✅ Yes |
| MKV | High | Streaming, archival | ✅ Yes |
| WebM | High | Modern web browsers | ✅ Yes |
| AVI | Medium | Legacy, Windows | ❌ No |
| MOV | High | Apple devices | ✅ Yes |
| FLV | Low | Flash, legacy | ❌ No |
| WMV | Medium | Windows Media | ❌ No |
| 3GP | Low | Mobile phones (352x288) | ❌ No |

**Selecting Format**:
- Click a format to select it
- Selected format shows highlighted
- Cannot select same format as input (will show as unavailable)
- Description shows what each format is best for

**Navigation**:
- "Back": Return to Step 1 to select different file
- "Continue": Proceed to Step 3 (starts conversion)

### Step 3: Monitor Conversion

Once you click "Continue", conversion starts immediately.

**What You'll See**:
- **Progress Bar**: Visual indicator of conversion progress (0-99%)
- **Percentage**: Current progress as number
- **Status Text**: Human-readable status (e.g., "Encoding video...")
- **Estimated Time**: Based on file size and format

**During Conversion**:
- Application is responsive
- You can navigate or do other work
- Progress updates in real-time (every ~500ms)
- Do NOT close the browser or refresh page

**Conversion Complete**:
When progress reaches 100%, you'll see:
- ✅ "Conversion complete!" notification
- Green download button becomes active
- "Convert Another File" button appears

**Download Options**:
1. **Download Button**: Downloads the converted file
   - File automatically saves to your Downloads folder
   - Named: `{original-name}.{new-format}`
   
2. **Convert Another File**: 
   - Returns to Step 1
   - Previous file and conversion cleared
   - Ready for new conversion

---

## Notifications

You'll see notifications for different events:

### Success Notifications (Green)
```
✓ File selected: video.mkv
✓ Conversion complete!
✓ Ready for new conversion
```
- Appear in bottom right
- Auto-dismiss after 5 seconds
- Green color (emerald)

### Error Notifications (Red)
```
✗ File size exceeds 2GB limit
✗ Output format cannot be same as input
✗ Conversion failed
```
- Appear in bottom right
- Require manual dismiss (click X)
- Red color (danger)
- Detailed error message provided

### Info Notifications (Blue)
```
ℹ Starting conversion...
ℹ Conversion started, streaming progress...
```
- Blue color (info)
- Auto-dismiss or manual close

---

## Hardware Acceleration

The application automatically detects available GPU acceleration.

**Hardware Badge** (top right):
- **Green indicator**: GPU acceleration active (NVIDIA/AMD)
- **Yellow indicator**: CPU encoding (no GPU)
- **Gray indicator**: Detecting...

**What This Means**:
- **GPU (NVIDIA/AMD)**: 10-20x faster encoding
- **CPU**: Slower but works on all systems
- **Fallback**: If GPU fails mid-conversion, automatically retries with CPU

**No user action needed** - all automatic!

---

## Common Workflows

### Workflow 1: Quick Conversion

```
1. Drag MP4 file onto upload zone
2. Select MKV format
3. Click Continue
4. Wait for completion
5. Click Download
6. Done!
```

Time: 5-30 minutes depending on file size

### Workflow 2: Multiple Formats

```
1. Upload video.mp4
2. Convert to MKV format
3. Download converted file
4. Click "Convert Another File"
5. File is already selected, just choose different format
6. Click Continue
7. Wait and download
```

Great for creating multiple versions for different platforms!

### Workflow 3: Batch Conversions

```
1. Convert video 1 to MP4
2. Convert video 1 to WebM
3. Download both files
4. Click "Convert Another"
5. Upload video 2
6. Repeat for each video...
```

---

## Troubleshooting

### "File size exceeds 2GB limit"
- Your file is larger than 2GB
- Solution: Use a video editor to split the file into smaller parts, or compress first

### "Output format cannot be same as input"
- You selected the same output format as input (e.g., MP4 → MP4)
- Solution: Choose a different output format
- Note: Same-format conversion isn't needed (no change)

### "Conversion failed"
- Something went wrong during encoding
- Solutions:
  - Refresh and try again
  - Verify input file plays correctly
  - Try a different output format
  - Check server logs for details

### Conversion is very slow
- File is large or system is busy
- Solutions:
  - Normal - conversions take time (5-30+ min depending on file)
  - GPU acceleration visible in Hardware Badge
  - Monitor System CPU/memory usage

### File won't upload
- File size exceeds 2GB limit
- Browser connection issue
- Solutions:
  - Check file size
  - Try uploading again
  - Check browser console (F12) for errors

### Download doesn't start
- Browser download settings
- File completed but not showing
- Solutions:
  - Check Downloads folder
  - Check browser download settings
  - Try clicking Download button again
  - Check browser console for errors

---

## Tips & Tricks

### Best Practices

1. **Check your internet**: Upload/download depend on connection quality
2. **Choose appropriate format**: 
   - Web: MP4 or WebM
   - Streaming: MKV
   - Mobile: MP4 or 3GP
3. **File naming**: Original name is preserved in converted file
4. **Keep browser open**: Don't close until download completes
5. **Multiple downloads**: Can download converted file multiple times

### Performance Tips

- **Faster conversions**: MP4 with GPU (if available)
- **Smaller files**: WebM format uses less space
- **Quality retention**: MKV preserves quality best
- **Compatibility**: MP4 works on most devices

### Format Guide

| Goal | Format |
|------|--------|
| Small file, web | WebM |
| Universal, mobile | MP4 |
| High quality, storage | MKV |
| Apple devices | MOV |
| Older systems | AVI |
| Very small (352x288) | 3GP |

---

## Frequently Asked Questions (FAQ)

**Q: How long does conversion take?**
A: Depends on file size and GPU availability. 10 minutes for a 1GB file on GPU, longer on CPU.

**Q: Can I convert while converting?**
A: Yes! When download completes, you can immediately convert another file.

**Q: Where are my files stored?**
A: Files are stored temporarily on the server and auto-deleted after 10 minutes.

**Q: Can I pause conversion?**
A: No - conversions run continuously once started. Refresh to restart.

**Q: Can I convert multiple files at once?**
A: Yes - start one conversion, then start another while the first is running.

**Q: What if the server goes down?**
A: Your conversion job is lost. You'll need to restart. Backup important files first!

**Q: Is my file private?**
A: Files are stored temporarily and auto-deleted after 10 minutes. No cloud backup.

**Q: What video codecs are supported?**
A: Most common codecs (H.264, H.265, VP8, VP9, etc.). If FFmpeg supports it, it works!

**Q: Can I change the output format after starting?**
A: No - select format before clicking Continue. Can convert same file to multiple formats separately.

---

## Browser Compatibility

**Supported Browsers**:
- Chrome/Chromium 90+
- Firefox 88+
- Safari 14+
- Edge 90+

**Features Required**:
- ES6 JavaScript support
- EventSource (SSE) for progress
- File API for uploads
- LocalStorage for theme

---

## Accessibility

- **Keyboard Navigation**: Tab to navigate, Enter to select
- **Dark Mode**: Accessible colors in both themes
- **Semantic HTML**: Screen reader friendly
- **Labels**: Form controls properly labeled
- **ARIA**: Where appropriate for dynamic content

---

## Performance Expectations

| Operation | Time |
|-----------|------|
| Page load | < 2s |
| File upload (100MB) | 5-30s (depends on network) |
| Conversion (1GB) | 5-30min (depends on GPU/CPU) |
| File download (100MB) | 10-60s (depends on network) |

---

## Support

If you experience issues:

1. **Check browser console** (F12 → Console)
   - Look for JavaScript errors
2. **Refresh and retry**
   - Sometimes transient network issues
3. **Check server logs**
   - If self-hosted, review server logs
4. **Verify FFmpeg installed**
   - Required for conversions
5. **Check disk space**
   - Server needs ~20GB free space

---

## Credits

**Video Converter Web Application v1.0.0**
- Built with Node.js + Express + TypeScript
- Frontend: HTML5 + Tailwind CSS + Vanilla JavaScript
- Video Processing: FFmpeg
- GPU Acceleration: NVIDIA NVENC, AMD VAAPI/AMF

**Supported Formats**: 8 formats with automatic GPU acceleration detection

---

**Ready to convert? Head to http://localhost:3000 and get started!**

