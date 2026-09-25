export default async function handler(req: any, res: any) {
  // CORS & Cache-busting headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    let folderIdQuery = '1bWzRk9IGpjq3slYMW0ML9Cu0fqpZ_Cm4';

    if (req.query && req.query.folderId) {
      folderIdQuery = String(req.query.folderId);
    } else if (req.url) {
      try {
        const parsedUrl = new URL(req.url, 'http://localhost');
        const qId = parsedUrl.searchParams.get('folderId');
        if (qId) folderIdQuery = qId;
      } catch {
        // fallback
      }
    }

    const folderMatch =
      folderIdQuery.match(/folders\/([a-zA-Z0-9_-]+)/) ||
      folderIdQuery.match(/[?&]id=([a-zA-Z0-9_-]+)/) ||
      folderIdQuery.match(/\/d\/([a-zA-Z0-9_-]+)/);
    const cleanFolderId = folderMatch ? folderMatch[1] : folderIdQuery.trim();

    const rootData = await parseDriveFolder(cleanFolderId);

    // Root images for the main carousel
    const carouselImages = rootData.files.map((file) => ({
      id: file.id,
      name: file.name,
      title: cleanProductName(file.name),
      subtitle: `Foto destacada de ${rootData.folderName}`,
      imageUrl: `https://lh3.googleusercontent.com/d/${file.id}=s800`,
      highResUrl: `https://lh3.googleusercontent.com/d/${file.id}=s1600`,
      webViewLink: `https://drive.google.com/file/d/${file.id}/view`,
    }));

    // Subfolders as category sections
    const categories: any[] = [];
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
          code: `${folder.name.slice(0, 3).toUpperCase()}-${(idx + 1).toString().padStart(3, '0')}`,
          description: `Producto catalogado en la colección ${folder.name}.`,
        }));

        totalProducts += items.length;

        categories.push({
          id: folder.id,
          name: folder.name,
          displayName: folder.name,
          description: `${items.length} producto(s) en esta categoría`,
          items,
        });
      } catch (subErr) {
        console.error(`Error loading subfolder ${folder.name}:`, subErr);
      }
    }

    return res.status(200).json({
      folderId: cleanFolderId,
      folderName: rootData.folderName,
      carouselImages,
      categories,
      totalProducts: totalProducts + carouselImages.length,
      lastSynced: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('Error fetching drive catalog:', err);
    return res.status(500).json({ error: err.message || 'Failed to fetch Drive folder' });
  }
}

async function parseDriveFolder(folderId: string) {
  const url = `https://drive.google.com/drive/folders/${folderId}`;
  const res = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch Google Drive folder: ${res.status}`);
  }

  const html = await res.text();

  // Extract folder name
  const titleMatch = html.match(/<title>([^<]+)<\/title>/);
  const folderName = titleMatch
    ? titleMatch[1].replace(/ - Google Drive$/, '').trim()
    : 'Catálogo Google Drive';

  // Unescape JSON/hex characters in HTML payload
  const unescaped = html
    .replace(/\\x22/g, '"')
    .replace(/\\x5b/g, '[')
    .replace(/\\x5d/g, ']')
    .replace(/\\\//g, '/');

  // Matches Drive array structures: ["FILE_ID", ["PARENT_ID"], "NAME", "MIMETYPE"]
  const itemRegex =
    /\["([0-9a-zA-Z_-]{25,})",\s*\["([0-9a-zA-Z_-]{25,})"\],\s*"([^"]+)",\s*"([^"]+)"/g;

  const files: { id: string; name: string; parentId: string; mimeType: string }[] = [];
  const folders: { id: string; name: string; parentId: string }[] = [];
  let match: RegExpExecArray | null;
  const seenIds = new Set<string>();

  while ((match = itemRegex.exec(unescaped)) !== null) {
    const [, id, parentId, name, mimeType] = match;
    if (seenIds.has(id)) continue;
    seenIds.add(id);

    if (mimeType === 'application/vnd.google-apps.folder') {
      folders.push({ id, name, parentId });
    } else if (
      mimeType.startsWith('image/') ||
      /\.(jpg|jpeg|png|webp|gif|svg|bmp|jfif)$/i.test(name)
    ) {
      files.push({ id, name, parentId, mimeType });
    }
  }

  return { folderId, folderName, files, folders };
}

function cleanProductName(filename: string): string {
  if (!filename) return 'Producto';
  return filename
    .replace(/\.[a-zA-Z0-9]+$/, '') // remove extension
    .replace(/[-_]+/g, ' ') // replace dashes/underscores with space
    .replace(/\s+/g, ' ')
    .trim();
}
