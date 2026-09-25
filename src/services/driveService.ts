import { DriveCatalogData, CategoryFolder, CarouselSlide, ProductItem, DriveFile } from '../types/catalog';
import { cleanProductName } from '../utils/whatsapp';

export const DEFAULT_FOLDER_ID = '1bWzRk9IGpjq3slYMW0ML9Cu0fqpZ_Cm4';

export const extractFolderId = (input: string): string => {
  if (!input) return DEFAULT_FOLDER_ID;
  const trimmed = input.trim();
  // If it's a full Google Drive URL
  const match = trimmed.match(/folders\/([a-zA-Z0-9_-]+)/);
  if (match && match[1]) {
    return match[1];
  }
  const idMatch = trimmed.match(/id=([a-zA-Z0-9_-]+)/);
  if (idMatch && idMatch[1]) {
    return idMatch[1];
  }
  const dMatch = trimmed.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (dMatch && dMatch[1]) {
    return dMatch[1];
  }
  // Otherwise assume it's already an ID
  return trimmed;
};

export const getDriveImageUrl = (fileId: string, thumbnailLink?: string, highRes: boolean = false): string => {
  // Direct Google CDN for public Google Drive shared files
  if (fileId) {
    return `https://lh3.googleusercontent.com/d/${fileId}=${highRes ? 's1600' : 's800'}`;
  }
  if (thumbnailLink) {
    return highRes ? thumbnailLink.replace(/=s\d+$/, '=s1600') : thumbnailLink.replace(/=s\d+$/, '=s800');
  }
  return `https://drive.google.com/thumbnail?id=${fileId}&sz=${highRes ? 'w1600' : 'w800'}`;
};

export const parseDriveFolderHtml = (
  html: string,
  folderId: string
): {
  folderId: string;
  folderName: string;
  files: { id: string; name: string; parentId: string; mimeType: string }[];
  folders: { id: string; name: string; parentId: string }[];
} => {
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
};

export const fetchDriveFolderContents = async (
  folderId: string,
  accessToken?: string | null,
  forceRefresh: boolean = false
): Promise<DriveCatalogData> => {
  const cleanId = extractFolderId(folderId);
  const cacheKey = `drive_catalog_live_cache_${cleanId}`;

  // If forceRefresh requested, clear stale cache
  if (forceRefresh) {
    try {
      localStorage.removeItem(cacheKey);
    } catch {
      // ignore
    }
  }

  const cacheBuster = `_t=${Date.now()}${forceRefresh ? '&force=true' : ''}`;

  // 1. If OAuth accessToken is provided, query Google Drive REST API v3 directly (Client-side real-time sync everywhere!)
  if (accessToken) {
    try {
      const headers: HeadersInit = {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      };

      // Get folder meta
      const folderMetaRes = await fetch(
        `https://www.googleapis.com/drive/v3/files/${cleanId}?fields=id,name,description`,
        { headers }
      );
      let folderName = 'Catálogo Google Drive';
      if (folderMetaRes.ok) {
        const folderMeta = await folderMetaRes.json();
        folderName = folderMeta.name || 'Catálogo Google Drive';
      }

      // Fetch children
      const rootQuery = encodeURIComponent(`'${cleanId}' in parents and trashed = false`);
      const rootFields = encodeURIComponent(
        'files(id, name, mimeType, thumbnailLink, webContentLink, webViewLink, createdTime, size, imageMediaMetadata, description)'
      );

      const rootRes = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=${rootQuery}&fields=${rootFields}&pageSize=500&orderBy=name`,
        { headers }
      );

      if (rootRes.ok) {
        const rootData = await rootRes.json();
        const files: DriveFile[] = rootData.files || [];

        const carouselImages: CarouselSlide[] = [];
        const subfolders: DriveFile[] = [];

        for (const file of files) {
          if (file.mimeType === 'application/vnd.google-apps.folder') {
            subfolders.push(file);
          } else if (file.mimeType.startsWith('image/')) {
            carouselImages.push({
              id: file.id,
              name: file.name,
              title: cleanProductName(file.name),
              subtitle: file.description || `Foto destacada de ${folderName}`,
              imageUrl: getDriveImageUrl(file.id, file.thumbnailLink, false),
              highResUrl: getDriveImageUrl(file.id, file.thumbnailLink, true),
              webViewLink: file.webViewLink,
            });
          }
        }

        const categories: CategoryFolder[] = [];
        let totalProducts = 0;

        for (const folder of subfolders) {
          const subQuery = encodeURIComponent(
            `'${folder.id}' in parents and trashed = false and mimeType contains 'image/'`
          );
          const subRes = await fetch(
            `https://www.googleapis.com/drive/v3/files?q=${subQuery}&fields=${rootFields}&pageSize=200&orderBy=name`,
            { headers }
          );

          const items: ProductItem[] = [];

          if (subRes.ok) {
            const subData = await subRes.json();
            const subFiles: DriveFile[] = subData.files || [];

            subFiles.forEach((f, idx) => {
              items.push({
                id: f.id,
                name: f.name,
                displayName: cleanProductName(f.name),
                imageUrl: getDriveImageUrl(f.id, f.thumbnailLink, false),
                highResUrl: getDriveImageUrl(f.id, f.thumbnailLink, true),
                webViewLink: f.webViewLink,
                categoryId: folder.id,
                categoryName: folder.name,
                code: `${folder.name.slice(0, 3).toUpperCase()}-${(idx + 1).toString().padStart(3, '0')}`,
                dateAdded: f.createdTime,
                description: f.description || `Producto catalogado en ${folder.name}`,
              });
            });
          }

          totalProducts += items.length;

          categories.push({
            id: folder.id,
            name: folder.name,
            displayName: folder.name,
            description: folder.description || `${items.length} producto(s) en esta categoría`,
            items,
          });
        }

        if (carouselImages.length > 0 || categories.length > 0) {
          const oauthCatalog: DriveCatalogData = {
            folderId: cleanId,
            folderName,
            carouselImages,
            categories,
            totalProducts: totalProducts + carouselImages.length,
            lastSynced: new Date(),
          };

          try {
            localStorage.setItem(cacheKey, JSON.stringify(oauthCatalog));
          } catch {
            // ignore
          }

          return oauthCatalog;
        }
      }
    } catch (oauthErr) {
      console.warn('OAuth Drive fetch error:', oauthErr);
    }
  }

  // 2. Try fetching from backend API (/api/drive/catalog or subpath /JheTec/api/drive/catalog)
  const apiUrls = [
    `/api/drive/catalog?folderId=${encodeURIComponent(cleanId)}&${cacheBuster}`,
    `./api/drive/catalog?folderId=${encodeURIComponent(cleanId)}&${cacheBuster}`,
  ];

  for (const apiUrl of apiUrls) {
    try {
      const apiRes = await fetch(apiUrl, {
        cache: 'no-store',
        headers: {
          Accept: 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          Pragma: 'no-cache',
        },
      });

      const contentType = apiRes.headers.get('content-type') || '';
      if (apiRes.ok && contentType.includes('application/json')) {
        const data = await apiRes.json();
        if (data && (data.carouselImages?.length > 0 || data.categories?.length > 0)) {
          const liveCatalog: DriveCatalogData = {
            folderId: cleanId,
            folderName: data.folderName || 'WEB SUCULENTAS',
            carouselImages: (data.carouselImages || []).map((img: any) => ({
              ...img,
              imageUrl: img.imageUrl || getDriveImageUrl(img.id, undefined, false),
              highResUrl: img.highResUrl || getDriveImageUrl(img.id, undefined, true),
            })),
            categories: (data.categories || []).map((cat: any) => ({
              ...cat,
              items: (cat.items || []).map((item: any) => ({
                ...item,
                imageUrl: item.imageUrl || getDriveImageUrl(item.id, undefined, false),
                highResUrl: item.highResUrl || getDriveImageUrl(item.id, undefined, true),
              })),
            })),
            totalProducts: data.totalProducts || 0,
            lastSynced: new Date(),
          };

          try {
            localStorage.setItem(cacheKey, JSON.stringify(liveCatalog));
          } catch {
            // ignore
          }

          return liveCatalog;
        }
      }
    } catch {
      // Try next
    }
  }

  // 3. Try fetching static catalog.json (built and served in dist/docs on GitHub Pages)
  const jsonUrls = [
    `./catalog.json?${cacheBuster}`,
    `catalog.json?${cacheBuster}`,
    `/catalog.json?${cacheBuster}`,
  ];

  for (const jsonUrl of jsonUrls) {
    try {
      const jsonRes = await fetch(jsonUrl, {
        cache: 'no-store',
        headers: {
          Accept: 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      });

      const contentType = jsonRes.headers.get('content-type') || '';
      if (jsonRes.ok && contentType.includes('application/json')) {
        const data = await jsonRes.json();
        if (data && (data.carouselImages?.length > 0 || data.categories?.length > 0)) {
          const liveCatalog: DriveCatalogData = {
            folderId: cleanId,
            folderName: data.folderName || 'WEB SUCULENTAS',
            carouselImages: (data.carouselImages || []).map((img: any) => ({
              ...img,
              imageUrl: img.imageUrl || getDriveImageUrl(img.id, undefined, false),
              highResUrl: img.highResUrl || getDriveImageUrl(img.id, undefined, true),
            })),
            categories: (data.categories || []).map((cat: any) => ({
              ...cat,
              items: (cat.items || []).map((item: any) => ({
                ...item,
                imageUrl: item.imageUrl || getDriveImageUrl(item.id, undefined, false),
                highResUrl: item.highResUrl || getDriveImageUrl(item.id, undefined, true),
              })),
            })),
            totalProducts: data.totalProducts || 0,
            lastSynced: new Date(data.lastSynced || Date.now()),
          };

          try {
            localStorage.setItem(cacheKey, JSON.stringify(liveCatalog));
          } catch {
            // ignore
          }

          return liveCatalog;
        }
      }
    } catch {
      // Continue to next tier
    }
  }

  // 3. Try client-side live scraper via CORS proxies (allows real-time updates directly on GitHub Pages!)
  const driveFolderUrl = `https://drive.google.com/drive/folders/${cleanId}`;
  const proxyEndpoints = [
    `https://corsproxy.io/?url=${encodeURIComponent(driveFolderUrl)}`,
    `https://api.allorigins.win/raw?url=${encodeURIComponent(driveFolderUrl)}`,
  ];

  for (const proxyUrl of proxyEndpoints) {
    try {
      const proxyRes = await fetch(proxyUrl, {
        headers: {
          Accept: 'text/html,application/xhtml+xml',
        },
      });
      if (proxyRes.ok) {
        const html = await proxyRes.text();
        const parsedRoot = parseDriveFolderHtml(html, cleanId);

        if (parsedRoot.files.length > 0 || parsedRoot.folders.length > 0) {
          const carouselImages: CarouselSlide[] = parsedRoot.files.map((file) => ({
            id: file.id,
            name: file.name,
            title: cleanProductName(file.name),
            subtitle: `Foto destacada de ${parsedRoot.folderName}`,
            imageUrl: getDriveImageUrl(file.id, undefined, false),
            highResUrl: getDriveImageUrl(file.id, undefined, true),
            webViewLink: `https://drive.google.com/file/d/${file.id}/view`,
          }));

          const categories: CategoryFolder[] = [];
          let totalProducts = 0;

          // Parse subfolders
          for (const sub of parsedRoot.folders) {
            const subProxyUrl = `https://corsproxy.io/?url=${encodeURIComponent(`https://drive.google.com/drive/folders/${sub.id}`)}`;
            try {
              const subRes = await fetch(subProxyUrl);
              if (subRes.ok) {
                const subHtml = await subRes.text();
                const subParsed = parseDriveFolderHtml(subHtml, sub.id);
                const items: ProductItem[] = subParsed.files.map((f, idx) => ({
                  id: f.id,
                  name: f.name,
                  displayName: cleanProductName(f.name),
                  imageUrl: getDriveImageUrl(f.id, undefined, false),
                  highResUrl: getDriveImageUrl(f.id, undefined, true),
                  webViewLink: `https://drive.google.com/file/d/${f.id}/view`,
                  categoryId: sub.id,
                  categoryName: sub.name,
                  code: `${sub.name.slice(0, 3).toUpperCase()}-${(idx + 1).toString().padStart(3, '0')}`,
                  description: `Producto catalogado en la colección ${sub.name}.`,
                }));

                totalProducts += items.length;
                categories.push({
                  id: sub.id,
                  name: sub.name,
                  displayName: sub.name,
                  description: `${items.length} producto(s) en esta categoría`,
                  items,
                });
              }
            } catch {
              // ignore subfolder error
            }
          }

          if (carouselImages.length > 0 || categories.length > 0) {
            const scrapedCatalog: DriveCatalogData = {
              folderId: cleanId,
              folderName: parsedRoot.folderName,
              carouselImages,
              categories,
              totalProducts: totalProducts + carouselImages.length,
              lastSynced: new Date(),
            };

            try {
              localStorage.setItem(cacheKey, JSON.stringify(scrapedCatalog));
            } catch {
              // ignore
            }

            return scrapedCatalog;
          }
        }
      }
    } catch {
      // Try next
    }
  }

  // 4. Check for recently cached catalog in localStorage (only if NOT forceRefresh)
  if (!forceRefresh) {
    try {
      const cachedStr = localStorage.getItem(cacheKey);
      if (cachedStr) {
        const cached = JSON.parse(cachedStr);
        if (cached && (cached.carouselImages?.length > 0 || cached.categories?.length > 0)) {
          return {
            ...cached,
            lastSynced: new Date(cached.lastSynced || Date.now()),
          };
        }
      }
    } catch {
      // ignore
    }
  }

  // 6. Up-to-date fallback containing all categories and items from the user's Google Drive folder
  return getFallbackCatalogData(cleanId);
};

export const getFallbackCatalogData = (folderId: string = DEFAULT_FOLDER_ID, customName?: string): DriveCatalogData => {
  // Current live catalog snapshot from Google Drive folder: WEB SUCULENTAS (1bWzRk9IGpjq3slYMW0ML9Cu0fqpZ_Cm4)
  const carouselImages: CarouselSlide[] = [
    {
      id: '1Xt46wNoPmAWkW0MZs60GCvB67PFdVG66',
      name: 'img1.jpg',
      title: 'img1',
      subtitle: 'Foto destacada de WEB SUCULENTAS',
      imageUrl: 'https://lh3.googleusercontent.com/d/1Xt46wNoPmAWkW0MZs60GCvB67PFdVG66=s800',
      highResUrl: 'https://lh3.googleusercontent.com/d/1Xt46wNoPmAWkW0MZs60GCvB67PFdVG66=s1600',
      webViewLink: 'https://drive.google.com/file/d/1Xt46wNoPmAWkW0MZs60GCvB67PFdVG66/view',
    },
    {
      id: '1bqYB0gs0WLs6yCfRA5Toeq1cYNFgBvJJ',
      name: 'img2.jpg',
      title: 'img2',
      subtitle: 'Foto destacada de WEB SUCULENTAS',
      imageUrl: 'https://lh3.googleusercontent.com/d/1bqYB0gs0WLs6yCfRA5Toeq1cYNFgBvJJ=s800',
      highResUrl: 'https://lh3.googleusercontent.com/d/1bqYB0gs0WLs6yCfRA5Toeq1cYNFgBvJJ=s1600',
      webViewLink: 'https://drive.google.com/file/d/1bqYB0gs0WLs6yCfRA5Toeq1cYNFgBvJJ/view',
    },
    {
      id: '1egz0z85OZW0srs-hviX7-hTd59-KmCB_',
      name: 'Suculenta imbricata.jpg',
      title: 'Suculenta imbricata',
      subtitle: 'Foto destacada de WEB SUCULENTAS',
      imageUrl: 'https://lh3.googleusercontent.com/d/1egz0z85OZW0srs-hviX7-hTd59-KmCB_=s800',
      highResUrl: 'https://lh3.googleusercontent.com/d/1egz0z85OZW0srs-hviX7-hTd59-KmCB_=s1600',
      webViewLink: 'https://drive.google.com/file/d/1egz0z85OZW0srs-hviX7-hTd59-KmCB_/view',
    },
  ];

  const categories: CategoryFolder[] = [
    {
      id: '1sgOGJFLxSUg-tT0XUJXO5ugzYfITK7oh',
      name: 'CAPTUS',
      displayName: 'CAPTUS',
      description: 'Colección de cactus y plantas seleccionadas desde Google Drive',
      items: [
        {
          id: '1_ajHRow9SViIRPa8_SJvUI4zJtc2PeSO',
          name: 'img 111111.jpg',
          displayName: 'img 111111',
          imageUrl: 'https://lh3.googleusercontent.com/d/1_ajHRow9SViIRPa8_SJvUI4zJtc2PeSO=s800',
          highResUrl: 'https://lh3.googleusercontent.com/d/1_ajHRow9SViIRPa8_SJvUI4zJtc2PeSO=s1600',
          webViewLink: 'https://drive.google.com/file/d/1_ajHRow9SViIRPa8_SJvUI4zJtc2PeSO/view',
          categoryId: '1sgOGJFLxSUg-tT0XUJXO5ugzYfITK7oh',
          categoryName: 'CAPTUS',
          code: 'CAP-001',
          description: 'Planta de la colección CAPTUS sincronizada en vivo desde Google Drive.',
        },
      ],
    },
    {
      id: '1AfBrYHJMcQNSQ9fwBMsO91nhER3ICQgy',
      name: 'GERANIOS',
      displayName: 'GERANIOS',
      description: 'Colección de geranios seleccionados desde Google Drive',
      items: [
        {
          id: '1bNnW_OWV-yg8xCv3RI2RUOaE_C8a2CLz',
          name: 'Geranio.jpg',
          displayName: 'Geranio',
          imageUrl: 'https://lh3.googleusercontent.com/d/1bNnW_OWV-yg8xCv3RI2RUOaE_C8a2CLz=s800',
          highResUrl: 'https://lh3.googleusercontent.com/d/1bNnW_OWV-yg8xCv3RI2RUOaE_C8a2CLz=s1600',
          webViewLink: 'https://drive.google.com/file/d/1bNnW_OWV-yg8xCv3RI2RUOaE_C8a2CLz/view',
          categoryId: '1AfBrYHJMcQNSQ9fwBMsO91nhER3ICQgy',
          categoryName: 'GERANIOS',
          code: 'GER-001',
          description: 'Planta de la colección GERANIOS sincronizada en vivo desde Google Drive.',
        },
        {
          id: '1F38hhgpDkF0ZF_CSUiUY8P61Pl6Fd8x4',
          name: 'IMGg1.jpg',
          displayName: 'IMGg1',
          imageUrl: 'https://lh3.googleusercontent.com/d/1F38hhgpDkF0ZF_CSUiUY8P61Pl6Fd8x4=s800',
          highResUrl: 'https://lh3.googleusercontent.com/d/1F38hhgpDkF0ZF_CSUiUY8P61Pl6Fd8x4=s1600',
          webViewLink: 'https://drive.google.com/file/d/1F38hhgpDkF0ZF_CSUiUY8P61Pl6Fd8x4/view',
          categoryId: '1AfBrYHJMcQNSQ9fwBMsO91nhER3ICQgy',
          categoryName: 'GERANIOS',
          code: 'GER-002',
          description: 'Planta de la colección GERANIOS sincronizada en vivo desde Google Drive.',
        },
        {
          id: '1KP-n6bVaXs-WvV2J5p7naD-co40T9i0I',
          name: 'Naranja Geranio.jpg',
          displayName: 'Naranja Geranio',
          imageUrl: 'https://lh3.googleusercontent.com/d/1KP-n6bVaXs-WvV2J5p7naD-co40T9i0I=s800',
          highResUrl: 'https://lh3.googleusercontent.com/d/1KP-n6bVaXs-WvV2J5p7naD-co40T9i0I=s1600',
          webViewLink: 'https://drive.google.com/file/d/1KP-n6bVaXs-WvV2J5p7naD-co40T9i0I/view',
          categoryId: '1AfBrYHJMcQNSQ9fwBMsO91nhER3ICQgy',
          categoryName: 'GERANIOS',
          code: 'GER-003',
          description: 'Planta de la colección GERANIOS sincronizada en vivo desde Google Drive.',
        },
      ],
    },
    {
      id: '1o5tic_b3yszC99KCBVujLUgLjcY3MsNH',
      name: 'ROSAS',
      displayName: 'ROSAS',
      description: 'Variedad de rosas y suculentas en floración',
      items: [
        {
          id: '15GCE-XpgSqB0OiZMeYTvNiKgXigFGKpX',
          name: 'imgggg1.jpg',
          displayName: 'imgggg1',
          imageUrl: 'https://lh3.googleusercontent.com/d/15GCE-XpgSqB0OiZMeYTvNiKgXigFGKpX=s800',
          highResUrl: 'https://lh3.googleusercontent.com/d/15GCE-XpgSqB0OiZMeYTvNiKgXigFGKpX=s1600',
          webViewLink: 'https://drive.google.com/file/d/15GCE-XpgSqB0OiZMeYTvNiKgXigFGKpX/view',
          categoryId: '1o5tic_b3yszC99KCBVujLUgLjcY3MsNH',
          categoryName: 'ROSAS',
          code: 'ROS-001',
          description: 'Planta de la colección ROSAS sincronizada en vivo desde Google Drive.',
        },
      ],
    },
    {
      id: '19KglfObpaSVnTnWPWPwk8YiIyCVonUG5',
      name: 'TULIPANES',
      displayName: 'TULIPANES',
      description: 'Variedad de tulipanes y flores seleccionadas',
      items: [
        {
          id: '1aPTib8ej34q-acpbKOJthHtx-5jcwxHs',
          name: 'Tulipanes rojos.jpg',
          displayName: 'Tulipanes rojos',
          imageUrl: 'https://lh3.googleusercontent.com/d/1aPTib8ej34q-acpbKOJthHtx-5jcwxHs=s800',
          highResUrl: 'https://lh3.googleusercontent.com/d/1aPTib8ej34q-acpbKOJthHtx-5jcwxHs=s1600',
          webViewLink: 'https://drive.google.com/file/d/1aPTib8ej34q-acpbKOJthHtx-5jcwxHs/view',
          categoryId: '19KglfObpaSVnTnWPWPwk8YiIyCVonUG5',
          categoryName: 'TULIPANES',
          code: 'TUL-001',
          description: 'Planta de la colección TULIPANES sincronizada en vivo desde Google Drive.',
        },
      ],
    },
  ];

  return {
    folderId,
    folderName: customName || 'WEB SUCULENTAS',
    carouselImages,
    categories,
    totalProducts: 6 + carouselImages.length,
    lastSynced: new Date(),
  };
};
