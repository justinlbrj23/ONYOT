const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const urlsFile = "urls.txt";
const outputDir = path.join(__dirname, "output");

if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

const urls = fs
  .readFileSync(urlsFile, "utf8")
  .split("\n")
  .map((x) => x.replace(/\r$/, "").trim())
  .filter((x) => x && !x.startsWith("#"));

if (urls.length === 0) {
  console.log("No URLs found.");
  process.exit(0);
}

urls.forEach((url, index) => {
  const tempFile = `temp_${index}.mp4`;
  const outputFile = `video_${index}.mpeg`;

  console.log(`\nDownloading: ${url}`);

  try {
    execSync(
      `yt-dlp --no-playlist --js-runtimes deno --remote-components ejs:github ` +
        `-f "bv*[ext=mp4][vcodec^=avc1]+ba[ext=m4a]/b[ext=mp4]/b" ` +
        `-o "${tempFile}" "${url}"`,
      { stdio: "inherit" }
    );

    console.log("Converting to MPEG...");

    execSync(
      `ffmpeg -y -i "${tempFile}" ` +
        `-c:v mpeg2video -qscale:v 2 -c:a mp2 -b:a 192k ` +
        `"${path.join(outputDir, outputFile)}"`,
      { stdio: "inherit" }
    );

    fs.unlinkSync(tempFile);
    console.log(`Saved: ${outputFile}`);
  } catch (err) {
    console.error(`Failed on URL: ${url}`);
  }
});

console.log("\nAll done.");
