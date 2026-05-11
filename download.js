const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const urlsFile = "urls.txt";
const outputDir = path.join(__dirname, "output");

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}

const urls = fs
  .readFileSync(urlsFile, "utf8")
  .split("\n")
  .map(x => x.trim())
  .filter(Boolean);

if (urls.length === 0) {
  console.log("No URLs found.");
  process.exit(0);
}

urls.forEach((url, index) => {
  const tempFile = `temp_${index}.mp4`;
  const outputFile = `video_${index}.mpeg`;

  console.log(`Downloading: ${url}`);

  // Download best MP4
  execSync(
    `yt-dlp -f mp4 -o "${tempFile}" "${url}"`,
    { stdio: "inherit" }
  );

  console.log(`Converting to MPEG...`);

  // Convert to MPEG
  execSync(
    `ffmpeg -i "${tempFile}" "${outputDir}/${outputFile}"`,
    { stdio: "inherit" }
  );

  // Cleanup
  fs.unlinkSync(tempFile);

  console.log(`Saved: ${outputFile}`);
});

console.log("All done.");
