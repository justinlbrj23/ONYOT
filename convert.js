const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const inputDir = path.join(__dirname, "input");
const outputDir = path.join(__dirname, "output");

if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

if (!fs.existsSync(inputDir)) {
  console.log("Input folder missing:", inputDir);
  process.exit(0);
}

const files = fs.readdirSync(inputDir).filter((file) => file.endsWith(".mp4"));

if (files.length === 0) {
  console.log("No MP4 files found.");
  process.exit(0);
}

files.forEach((file) => {
  const inputPath = path.join(inputDir, file);
  const outputFile = path.parse(file).name + ".mpeg";
  const outputPath = path.join(outputDir, outputFile);

  console.log(`Converting ${file} -> ${outputFile}`);

  execSync(
    `ffmpeg -y -i "${inputPath}" ` +
      `-c:v mpeg2video -qscale:v 2 -c:a mp2 -b:a 192k ` +
      `"${outputPath}"`,
    { stdio: "inherit" }
  );
});

console.log("Conversion completed.");
``
