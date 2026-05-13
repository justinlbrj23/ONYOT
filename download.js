const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const urls = fs
  .readFileSync("urls.txt", "utf8")
  .split("\n")
  .map(x => x.trim())
  .filter(x => x && !x.startsWith("#"));

const inputDir = path.join(__dirname, "input");
const outputDir = path.join(__dirname, "output");

fs.mkdirSync(inputDir, { recursive: true });
fs.mkdirSync(outputDir, { recursive: true });

function run(cmd) {
  console.log(`\n> ${cmd}\n`);
  execSync(cmd, { stdio: "inherit" });
}

function sanitize(name) {
  return name.replace(/[<>:"/\\|?*]+/g, "_");
}

function convertToMpeg(inputPath, outputPath) {
  run(
    `ffmpeg -y -i "${inputPath}" ` +
    `-c:v mpeg2video ` +
    `-qscale:v 5 ` +
    `-pix_fmt yuv420p ` +
    `-c:a mp2 ` +
    `-b:a 192k ` +
    `-threads 0 ` +
    `"${outputPath}"`
  );
}

async function handleYouTube(url, index) {
  console.log(`Downloading YouTube: ${url}`);

  const tempFile = path.join(inputDir, `yt_${index}.mp4`);

  run(
    `yt-dlp ` +
    `--no-playlist ` +
    `-f "bv*[ext=mp4]+ba[ext=m4a]/b[ext=mp4]" ` +
    `-o "${tempFile}" ` +
    `"${url}"`
  );

  const outputFile = path.join(
    outputDir,
    `youtube_${index}.mpeg`
  );

  convertToMpeg(tempFile, outputFile);

  fs.unlinkSync(tempFile);
}

async function handleTorrent(magnet, index) {
  console.log(`Downloading Torrent: ${magnet}`);

  const torrentDir = path.join(inputDir, `torrent_${index}`);

  fs.mkdirSync(torrentDir, { recursive: true });

  run(
    `aria2c ` +
    `--seed-time=0 ` +
    `--bt-max-peers=64 ` +
    `--max-connection-per-server=16 ` +
    `--split=16 ` +
    `--dir="${torrentDir}" ` +
    `"${magnet}"`
  );

  const files = fs.readdirSync(torrentDir);

  const video = files.find(f =>
    /\.(mp4|mkv|avi|mov)$/i.test(f)
  );

  if (!video) {
    throw new Error("No video file found.");
  }

  const inputPath = path.join(torrentDir, video);

  const outputPath = path.join(
    outputDir,
    `torrent_${index}.mpeg`
  );

  convertToMpeg(inputPath, outputPath);

  fs.rmSync(torrentDir, {
    recursive: true,
    force: true,
  });
}

(async () => {
  const tasks = urls.map(async (url, index) => {
    try {
      if (url.startsWith("magnet:?")) {
        await handleTorrent(url, index);
      } else {
        await handleYouTube(url, index);
      }
    } catch (err) {
      console.error(`Failed: ${url}`);
      console.error(err);
    }
  });

  await Promise.all(tasks);

  console.log("All done.");
})();
