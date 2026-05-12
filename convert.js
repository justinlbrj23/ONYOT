const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const inputDir = path.join(__dirname, "input");
const outputDir = path.join(__dirname, "output");

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}

if (!fs.existsSync(inputDir)) {
  console.log("Input folder missing:", inputDir);
  process.exit(0);
}

const files = fs
  .readdirSync(inputDir)
  .filter((file) => /\.(mp4|mkv|avi|mov)$/i.test(file));

if (files.length === 0) {
  console.log("No video files found.");
  process.exit(0);
}

function convertToMpeg(inputPath, outputPath) {
  const cmd =
    `ffmpeg -y -i "${inputPath}" ` +
    `-c:v mpeg2video ` +
    `-b:v 1200k ` +
    `-maxrate 1500k ` +
    `-bufsize 3000k ` +
    `-pix_fmt yuv420p ` +
    `-c:a mp2 ` +
    `-ar 44100 ` +
    `-ac 2 ` +
    `-b:a 128k ` +
    `-f mpeg ` +
    `"${outputPath}"`;

  console.log(cmd);

  execSync(cmd, { stdio: "inherit" });
}

files.forEach((file) => {
  const inputPath = path.join(inputDir, file);
  const outputFile = path.parse(file).name + ".mpeg";
  const outputPath = path.join(outputDir, outputFile);

  console.log(`Converting ${file} -> ${outputFile}`);

  convertToMpeg(inputPath, outputPath);
});

console.log("Conversion completed.");
