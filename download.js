const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const WebTorrent = require("webtorrent");

const client = new WebTorrent();

const urlsFile = "urls.txt";
const outputDir = path.join(__dirname, "output");

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}

const urls = fs
  .readFileSync(urlsFile, "utf8")
  .split("\n")
  .map((x) => x.replace(/\r$/, "").trim())
  .filter((x) => x && !x.startsWith("#"));

if (urls.length === 0) {
  console.log("No URLs found.");
  process.exit(0);
}

function convertToMpeg(inputPath, outputPath) {
  console.log("Converting to MPEG...");

  const cmd =
    `ffmpeg -y -i "${inputPath}" ` +
    `-c:v mpeg2video ` +
    `-qscale:v 2 ` +
    `-pix_fmt yuv420p ` +
    `-c:a mp2 ` +
    `-ar 44100 ` +
    `-ac 2 ` +
    `-b:a 224k ` +
    `-f mpeg ` +
    `"${outputPath}"`;

  console.log(cmd);

  execSync(cmd, { stdio: "inherit" });

  console.log(`Saved: ${path.basename(outputPath)}`);
}

async function handleYouTube(url, index) {
  const tempFile = `temp_${index}.mp4`;
  const outputFile = `video_${index}.mpeg`;

  console.log(`\nDownloading YouTube: ${url}`);

  execSync(
    `yt-dlp --no-playlist ` +
      `-f "bv*[ext=mp4][vcodec^=avc1]+ba[ext=m4a]/b[ext=mp4]/b" ` +
      `-o "${tempFile}" "${url}"`,
    { stdio: "inherit" }
  );

  convertToMpeg(
    tempFile,
    path.join(outputDir, outputFile)
  );

  fs.unlinkSync(tempFile);
}

async function handleTorrent(magnet, index) {
  return new Promise((resolve, reject) => {
    console.log(`\nDownloading Torrent: ${magnet}`);

    client.add(magnet, (torrent) => {
      const videoFile = torrent.files.find((file) =>
        /\.(mp4|mkv|avi|mov)$/i.test(file.name)
      );

      if (!videoFile) {
        reject("No video file found in torrent.");
        return;
      }

      const tempPath = path.join(__dirname, videoFile.name);

      console.log(`Found video: ${videoFile.name}`);

      const readStream = videoFile.createReadStream();
      const writeStream = fs.createWriteStream(tempPath);

      readStream.pipe(writeStream);

      writeStream.on("finish", () => {
        try {
          const outputPath = path.join(
            outputDir,
            `torrent_${index}.mpeg`
          );

          convertToMpeg(tempPath, outputPath);

          fs.unlinkSync(tempPath);

          resolve();
        } catch (err) {
          reject(err);
        }
      });

      writeStream.on("error", (err) => {
        reject(err);
      });
    });
  });
}

(async () => {
  for (const [index, url] of urls.entries()) {
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
  }

  client.destroy();

  console.log("\nAll done.");
})();
