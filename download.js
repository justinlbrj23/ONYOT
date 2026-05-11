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

  console.log(`\nDownloading: ${url}`);

  try {
    // ✅ safer format
    execSync(
      `yt-dlp -f mp4 --no-playlist -o "${tempFile}" "${url}"`,
      { stdio: "inherit" }
    );

    console.log("Converting...");

    execSync(
      `ffmpeg -y -i "${tempFile}" -c:v mpeg2video -qscale:v 2 -c:a mp2 -b:a 192k "${outputDir}/${outputFile}"`,
      { stdio: "inherit" }
    );

    fs.unlinkSync(tempFile);
    console.log(`Saved: ${outputFile}`);
  } catch (err) {
    console.error(`Failed on ${url}`);
  }
});

console.log("\nAll done.");
