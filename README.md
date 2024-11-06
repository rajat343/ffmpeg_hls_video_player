# Video Processor & HLS Player

A Node.js application that processes video files into HLS (HTTP Live Streaming) format with adaptive bitrate streaming support. The application allows users to upload video files or provide video URLs, processes them into multiple quality levels, and plays them back using an HLS player.

## Features

-   Video file upload support
-   Video URL processing support
-   Multiple quality levels (480p, 720p, 1080p)
-   Adaptive bitrate streaming
-   HLS playback with quality selection
-   Clean and responsive UI
-   Temporary file cleanup
-   Progress indication
-   Error handling

## Prerequisites

Before running this application, make sure you have the following installed:

-   Node.js (v14 or higher)
-   FFmpeg
    -   **Mac**: `brew install ffmpeg`
    -   **Ubuntu/Debian**: `sudo apt-get install ffmpeg`
    -   **Windows**: Download from [FFmpeg website](https://ffmpeg.org/download.html)

## Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd video-processor-hls-player
```

2. Install dependencies:

```bash
npm install
```

3. Create required directories:

```bash
mkdir -p public/streams
```

## Running the Application

1. Start the server:

```bash
node app.js
```

2. Open your browser and navigate to:

```
http://localhost:3000
```

## Usage

1. **Upload a Video File**:

    - Click "Choose Video File" button
    - Select a video file from your computer
    - Click "Process Video"

2. **Process Video URL**:

    - Paste a video URL in the input field
    - Click "Process Video"

3. **Watch Processed Video**:
    - Wait for processing to complete
    - Use the quality selector to choose resolution
    - Video will automatically start playing

## Project Structure

```
├── app.js              # Main server file
├── ffmpeg.js           # FFmpeg processing logic
├── client.html         # Frontend UI
├── public/
│   └── streams/       # Processed video files
├── package.json
└── README.md
```

## Technical Details

-   **Frontend**: HTML5, CSS3, JavaScript
-   **Backend**: Node.js, Express
-   **Video Processing**: FFmpeg
-   **Streaming**: HLS (HTTP Live Streaming)
-   **Libraries**:
    -   express
    -   fluent-ffmpeg
    -   hls-server
    -   multer

## Limitations

-   Maximum file size: 200MB
-   Supported video formats: Most common video formats (MP4, MOV, AVI, etc.)
-   Processing time depends on video size and server capabilities
-   Keeps only last 5 processed videos to manage storage

## Error Handling

The application includes error handling for common scenarios:

-   Invalid file types
-   File size limits
-   Processing failures
-   Network issues
-   Missing files/URLs

## Cleanup

The application automatically:

-   Removes temporary upload files after processing
-   Keeps only the 5 most recent processed videos
-   Cleans up incomplete processing attempts

## Development

To modify quality levels, update the resolution arrays in `app.js`:

```javascript
const resolutions = ["480", "720", "1080"];
const bandwidths = ["1400000", "2800000", "5000000"];
```

## Troubleshooting

1. **FFmpeg Error**:

    - Ensure FFmpeg is installed and accessible in system PATH
    - Check FFmpeg installation: `ffmpeg -version`

2. **Upload Issues**:

    - Verify file size is under 200MB
    - Ensure file format is supported
    - Check server logs for specific errors

3. **Playback Issues**:
    - Ensure browser supports HLS playback
    - Check browser console for errors
    - Verify network connectivity
