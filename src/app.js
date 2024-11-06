const express = require("express");
const app = express();
const fs = require("fs");
const hls = require("hls-server");
const multer = require("multer");
const path = require("path");
const { runFluentFfmpegStreaming } = require("./ffmpeg");
const os = require("os");

const publicDir = path.join(__dirname, "public");
const streamsDir = path.join(publicDir, "streams");
const tempDir = path.join(os.tmpdir(), "video-uploads");

// Ensure directories exist
[publicDir, streamsDir, tempDir].forEach((dir) => {
	if (!fs.existsSync(dir)) {
		fs.mkdirSync(dir, { recursive: true });
	}
});

// Configure multer to use disk storage for temporary files
const storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, tempDir);
	},
	filename: function (req, file, cb) {
		cb(null, Date.now() + path.extname(file.originalname));
	},
});

const upload = multer({
	storage: storage,
	limits: {
		fileSize: 1024 * 1024 * 200, // 200MB limit
	},
	fileFilter: function (req, file, cb) {
		// Accept video files only
		if (!file.mimetype.startsWith("video/")) {
			return cb(new Error("Only video files are allowed!"), false);
		}
		cb(null, true);
	},
});

app.use(express.json());
app.use(express.static("public"));

app.get("/", (req, res) => {
	res.sendFile(`${__dirname}/client.html`);
});

app.post("/process-video", upload.single("video"), async (req, res) => {
	let tempFilePath = null;

	try {
		let videoInput;

		if (req.file) {
			videoInput = req.file.path;
			tempFilePath = req.file.path;
		} else if (req.body.videoUrl) {
			videoInput = req.body.videoUrl;
		} else {
			return res.status(400).json({
				success: false,
				error: "No video file or URL provided",
			});
		}

		// Clean up old files (keep last 5)
		const files = fs.readdirSync(streamsDir);
		if (files.length > 5) {
			files
				.map((f) => ({
					name: f,
					time: fs.statSync(path.join(streamsDir, f)).mtime,
				}))
				.sort((a, b) => b.time - a.time)
				.slice(5)
				.forEach((file) => {
					fs.rmSync(path.join(streamsDir, file.name), {
						recursive: true,
						force: true,
					});
				});
		}

		const result = await runFluentFfmpegStreaming(
			videoInput,
			streamsDir,
			["480", "720", "1080"],
			["1400000", "2800000", "5000000"]
		);

		if (!result) {
			return res.status(500).json({
				success: false,
				error: "Video processing failed",
			});
		}

		const masterPlaylistPath = `/streams/${path.basename(
			result.outputFolderName
		)}/master.m3u8`;

		res.json({
			success: true,
			playlistUrl: masterPlaylistPath,
			processingTime: result.totalTimeTaken,
			message: "Video processed successfully",
		});
	} catch (error) {
		console.error("Error processing video:", error);
		res.status(500).json({
			success: false,
			error: error.message || "Video processing failed",
		});
	} finally {
		// Clean up temporary file if it exists
		if (tempFilePath && fs.existsSync(tempFilePath)) {
			try {
				fs.unlinkSync(tempFilePath);
			} catch (err) {
				console.error("Error removing temporary file:", err);
			}
		}
	}
});

const server = app.listen(3000, () => {
	console.log("App running at http://localhost:3000");
});

new hls(server, {
	provider: {
		exists: (req, cb) => {
			const ext = req.url.split(".").pop();
			if (ext !== "m3u8" && ext !== "ts") {
				return cb(null, true);
			}

			fs.access(
				__dirname + "/public" + req.url,
				fs.constants.F_OK,
				(err) => {
					if (err) {
						console.log("File not exist");
						return cb(null, false);
					}
					cb(null, true);
				}
			);
		},
		getManifestStream: (req, cb) => {
			const stream = fs.createReadStream(__dirname + "/public" + req.url);
			cb(null, stream);
		},
		getSegmentStream: (req, cb) => {
			const stream = fs.createReadStream(__dirname + "/public" + req.url);
			cb(null, stream);
		},
	},
});
