# User Guide / How to Use VConvert

## Before you start

Ask the operator for the application URL. The server must be running with FFmpeg and FFprobe installed. The default upload size limit is 2 GiB. Keep in mind that submitted video is processed on the server, not locally in your browser.

## Convert a video

1. Open the VConvert page in a modern browser.
2. Add a video using either:
   - drag-and-drop into the upload area, or
   - **Browse Files** and select a file.
3. Check the displayed name, extension, and size.
4. Select an output format different from the source extension:
   - **MP4**: H.264/AAC
   - **MKV**: H.264/AAC
   - **MOV**: H.264/AAC
   - **WebM**: VP9/Opus
   - **AVI**: MPEG-4/MP3
   - **FLV**: MPEG-2 video/MP3
   - **WMV**: WMV2/WMA2
   - **3GP**: H.263/mono AAC at 352×288
5. Start the conversion. The progress area displays the job status and percentage while the server works.
6. When the job completes, choose **Download Converted File**.
7. Choose **Convert Another File** to start a new conversion.

The UI shows the accelerator detected on the server. The status badge does not guarantee every output format uses the GPU: WebM, AVI, FLV, WMV, and 3GP strategies use CPU encoding.

## Theme

Use the theme toggle in the page header to switch the interface theme. The application is designed with dark mode as its default.

## File lifetime and privacy

- The uploaded video is transferred to the server for conversion.
- A converted output expires after the server's configured `FILE_TTL_SECONDS` (default 600 seconds). Downloading it resets that timer.
- The current application code does not explicitly remove uploaded source files after conversion. Contact the operator if you need source data removed; operators should monitor the upload directory.
- Job IDs are in-memory and stop working after a server restart.
- Do not upload sensitive videos to an instance unless you trust its operator and its storage/network controls.

## Troubleshooting

| Symptom | What to try |
|---|---|
| File is rejected as too large | Select a smaller file or ask the operator whether the configured upload limit can be raised. |
| File type is rejected | Use a video file with a common video extension/MIME type. The server must also be able to probe/decode it with FFprobe/FFmpeg. |
| No output format is available | Choose a format different from the input extension. |
| Conversion fails | Try a readable input and another output format. If it persists, provide the operator with the job ID and server-side error log; do not send private video unless necessary and authorized. |
| Progress stops or connection is lost | Keep the page open and check the server connection. A page refresh can interrupt the progress display; the job may continue on the server. |
| Download says the file is unavailable | The output may have expired, the server may have restarted, or conversion may not have completed. Submit the file again. |
| GPU badge shows CPU | CPU encoding is the expected fallback when no supported GPU encoder is detected. |
| Page styling does not load | The current page fetches Tailwind CSS from a CDN; check browser internet access or contact the operator. |

For service status and API integration, refer to the [API Reference](./API.md).
