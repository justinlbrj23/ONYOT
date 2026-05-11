const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const inputDir = path.join(__dirname, "input");
const outputDir = path.join(__dirname, "output");

// Create output directory if missing
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}

// Read all MP4 files
const files = fs.readdirSync(inputDir).filter(file => file.endsWith(".mp4"));

if (files.length === 0) {
  console.log("No MP4 files found.");
  process.exit(0);
}

files.forEach(file => {
  const inputPath = path.join(inputDir, file);

  const outputFile =
    path.parse(file).name + ".mpeg";

  const outputPath = path.join(outputDir, outputFile);

  console.log(`Converting ${file} -> ${outputFile}`);

  // FFmpeg conversion
  execSync(
    `ffmpeg -i "${inputPath}" -q:v 2 "${outputPath}"`,
    { stdio: "inherit" }
  );
});

console.log("Conversion completed.");
