import fs from 'fs';
import path from 'path';

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

  const titleMatch = html.match(/<title>([^<]+)<\/title>/);
  let folderName = titleMatch
    ? titleMatch[1].replace(/ - Google Drive$/, '').trim()
    : 'Catálogo Google Drive';

  const unescaped = html
    .replace(/\\x22/g, '"')
    .replace(/\\x5b/g, '[')
    .replace(/\\x5d/g, ']')
    .replace(/\\\//g, '/');

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
    .replace(/\.[a-zA-Z0-9]+$/, '')
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function syncDriveCatalog() {
  const DEFAULT_FOLDER_ID = '1bWzRk9IGpjq3slYMW0ML9Cu0fqpZ_Cm4';
  console.log(`Syncing Google Drive catalog for folder ${DEFAULT_FOLDER_ID}...`);

  try {
    const rootData = await parseDriveFolder(DEFAULT_FOLDER_ID);

    const carouselImages = rootData.files.map((file) => ({
      id: file.id,
      name: file.name,
      title: cleanProductName(file.name),
      subtitle: `Foto destacada de ${rootData.folderName}`,
      imageUrl: `https://lh3.googleusercontent.com/d/${file.id}=s800`,
      highResUrl: `https://lh3.googleusercontent.com/d/${file.id}=s1600`,
      webViewLink: `https://drive.google.com/file/d/${file.id}/view`,
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
      } catch (err) {
        console.warn(`Could not sync subfolder ${folder.name}:`, err);
      }
    }

    const catalogData = {
      folderId: DEFAULT_FOLDER_ID,
      folderName: rootData.folderName,
      carouselImages,
      categories,
      totalProducts: totalProducts + carouselImages.length,
      lastSynced: new Date().toISOString(),
    };

    const publicDir = path.join(process.cwd(), 'public');
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }
    fs.writeFileSync(
      path.join(publicDir, 'catalog.json'),
      JSON.stringify(catalogData, null, 2),
      'utf-8'
    );
    console.log(`Successfully synced catalog.json: ${catalogData.totalProducts} total items.`);
  } catch (err) {
    console.error('Failed to sync Drive catalog:', err);
  }
}

syncDriveCatalog();
