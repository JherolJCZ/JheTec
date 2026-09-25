var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_vite = require("vite");
async function parseDriveFolder(folderId) {
  const url = `https://drive.google.com/drive/folders/${folderId}`;
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
    }
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch Google Drive folder: ${res.status}`);
  }
  const html = await res.text();
  const titleMatch = html.match(/<title>([^<]+)<\/title>/);
  let folderName = titleMatch ? titleMatch[1].replace(/ - Google Drive$/, "").trim() : "Cat\xE1logo Google Drive";
  const unescaped = html.replace(/\\x22/g, '"').replace(/\\x5b/g, "[").replace(/\\x5d/g, "]").replace(/\\\//g, "/");
  const itemRegex = /\["([0-9a-zA-Z_-]{25,})",\s*\["([0-9a-zA-Z_-]{25,})"\],\s*"([^"]+)",\s*"([^"]+)"/g;
  const files = [];
  const folders = [];
  let match;
  const seenIds = /* @__PURE__ */ new Set();
  while ((match = itemRegex.exec(unescaped)) !== null) {
    const [, id, parentId, name, mimeType] = match;
    if (seenIds.has(id)) continue;
    seenIds.add(id);
    if (mimeType === "application/vnd.google-apps.folder") {
      folders.push({ id, name, parentId });
    } else if (mimeType.startsWith("image/") || /\.(jpg|jpeg|png|webp|gif|svg|bmp|jfif)$/i.test(name)) {
      files.push({ id, name, parentId, mimeType });
    }
  }
  return { folderId, folderName, files, folders };
}
function cleanProductName(filename) {
  if (!filename) return "Producto";
  return filename.replace(/\.[a-zA-Z0-9]+$/, "").replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim();
}
async function startServer() {
  const app = (0, import_express.default)();
  const PORT = 3e3;
  app.use(import_express.default.json());
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });
  app.get("/api/drive/catalog", async (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.setHeader("Surrogate-Control", "no-store");
    try {
      const folderIdQuery = req.query.folderId || "1bWzRk9IGpjq3slYMW0ML9Cu0fqpZ_Cm4";
      const folderMatch = folderIdQuery.match(/folders\/([a-zA-Z0-9_-]+)/) || folderIdQuery.match(/[?&]id=([a-zA-Z0-9_-]+)/) || folderIdQuery.match(/\/d\/([a-zA-Z0-9_-]+)/);
      const cleanFolderId = folderMatch ? folderMatch[1] : folderIdQuery.trim();
      const rootData = await parseDriveFolder(cleanFolderId);
      const carouselImages = rootData.files.map((file) => ({
        id: file.id,
        name: file.name,
        title: cleanProductName(file.name),
        subtitle: `Foto destacada de ${rootData.folderName}`,
        imageUrl: `https://lh3.googleusercontent.com/d/${file.id}=s800`,
        highResUrl: `https://lh3.googleusercontent.com/d/${file.id}=s1600`,
        webViewLink: `https://drive.google.com/file/d/${file.id}/view`
      }));
      const categories = [];
      let totalProducts = 0;
      for (const folder of rootData.folders) {
        try {
          const subData = await parseDriveFolder(folder.id);
          const items = subData.files.map((file, idx) => ({
            id: file.id,
            name: file.name,
            displayName: cleanProductName(file.name),
            imageUrl: `https://lh3.googleusercontent.com/d/${file.id}=s800`,
            highResUrl: `https://lh3.googleusercontent.com/d/${file.id}=s1600`,
            webViewLink: `https://drive.google.com/file/d/${file.id}/view`,
            categoryId: folder.id,
            categoryName: folder.name,
            code: `${folder.name.slice(0, 3).toUpperCase()}-${(idx + 1).toString().padStart(3, "0")}`,
            description: `Producto catalogado en la colecci\xF3n ${folder.name}.`
          }));
          totalProducts += items.length;
          categories.push({
            id: folder.id,
            name: folder.name,
            displayName: folder.name,
            description: `${items.length} producto(s) en esta categor\xEDa`,
            items
          });
        } catch (subErr) {
          console.error(`Error loading subfolder ${folder.name}:`, subErr);
        }
      }
      res.json({
        folderId: cleanFolderId,
        folderName: rootData.folderName,
        carouselImages,
        categories,
        totalProducts: totalProducts + carouselImages.length,
        lastSynced: (/* @__PURE__ */ new Date()).toISOString()
      });
    } catch (err) {
      console.error("Error fetching drive catalog:", err);
      res.status(500).json({ error: err.message || "Failed to fetch Drive folder" });
    }
  });
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
