const ffmpeg = require("fluent-ffmpeg");
const fs = require("fs");
const path = require("path");
const https = require("https");

const alphaNumericStr =
	"1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWZYZ";

function generateAlphanumericString(size) {
	let result = "";
	for (let i = 0; i < size; i++) {
		result += alphaNumericStr.charAt(
			Math.floor(Math.random() * alphaNumericStr.length)
		);
	}
	return result;
}

async function runFluentFfmpegStreaming(
	videoInput,
	outputFolderName = "outputFolder",
	resolutionsArray = ["480", "720", "1080"],
	bandwidthsArray = ["1400000", "2800000", "5000000"]
) {
	try {
		const baseOutputDir = path.resolve(outputFolderName);
		if (!fs.existsSync(baseOutputDir)) {
			fs.mkdirSync(baseOutputDir, { recursive: true });
		}

		const randomString = generateAlphanumericString(10);
		const videoOutputDir = path.join(baseOutputDir, randomString);
		fs.mkdirSync(videoOutputDir, { recursive: true });

		const resolutions = resolutionsArray;
		const bandwidths = bandwidthsArray;
		const startTime = new Date().getTime();
		let errorOccurred = false;
		let totalTimeTaken;

		for (let i = 0; i < resolutions.length; i++) {
			if (errorOccurred) break;

			const res = resolutions[i];
			const resolutionDirectoryPath = path.join(videoOutputDir, res);
			fs.mkdirSync(resolutionDirectoryPath, { recursive: true });

			await new Promise((resolve, reject) => {
				try {
					const command = ffmpeg()
						.input(videoInput)
						.size(`?x${res}`)
						.videoCodec("libx264")
						.audioCodec("aac")
						.addOption("-hls_time", 10)
						.addOption("-hls_list_size", 0)
						.outputOptions([
							"-err_detect ignore_err",
							"-loglevel fatal",
						])
						.output(
							path.join(resolutionDirectoryPath, "output.m3u8")
						);

					command
						.on("start", () => {
							console.log(
								`Starting streaming job for resolution: ${res}p`
							);
						})
						.on("end", () => {
							console.log(
								`Finished processing resolution: ${res}p`
							);
							const endTime = new Date().getTime();
							totalTimeTaken = Math.floor(
								(endTime - startTime) / 1000
							);
							resolve();
						})
						.on("error", (err) => {
							errorOccurred = true;
							console.error("FFmpeg error: ", err);
							reject(err);
						});

					command.run();
				} catch (err) {
					console.error("Processing error: ", err);
					reject(err);
				}
			}).catch((err) => {
				console.error("Promise error: ", err);
				errorOccurred = true;
			});
		}

		if (errorOccurred) {
			return null;
		}

		let masterPlaylistContent =
			"#EXTM3U\n#EXT-X-VERSION:4\n#EXT-X-INDEPENDENT-SEGMENTS\n";
		resolutions.forEach((res, i) => {
			const bandwidth = bandwidths[i];
			const width = Math.floor((parseInt(res) * 16) / 9);
			masterPlaylistContent += `#EXT-X-STREAM-INF:BANDWIDTH=${bandwidth},CODECS="avc1.4d401f,mp4a.40.2",RESOLUTION=${width}x${res},FRAME-RATE=30.000\n`;
			masterPlaylistContent += `${res}/output.m3u8\n`;
		});

		fs.writeFileSync(
			path.join(videoOutputDir, "master.m3u8"),
			masterPlaylistContent
		);

		console.log(`Time taken to compress: ${totalTimeTaken} seconds`);
		return {
			outputFolderName: videoOutputDir,
			totalTimeTaken,
		};
	} catch (err) {
		console.error("Error in runFluentFfmpegStreaming: ", err);
		return null;
	}
}

module.exports = { runFluentFfmpegStreaming };
