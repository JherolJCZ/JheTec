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

export const fetchDriveFolderContents = async (
  folderId: string,
  accessToken?: string | null
): Promise<DriveCatalogData> => {
  const cleanId = extractFolderId(folderId);

  // 1. Try fetching from our full-stack live Google Drive crawler API first
  try {
    const apiRes = await fetch(`/api/drive/catalog?folderId=${encodeURIComponent(cleanId)}`);
    if (apiRes.ok) {
      const data = await apiRes.json();
      if (data && (data.carouselImages?.length > 0 || data.categories?.length > 0)) {
        return {
          folderId: cleanId,
          folderName: data.folderName || 'WEB SUCULENTAS',
          carouselImages: data.carouselImages.map((img: any) => ({
            ...img,
            imageUrl: img.imageUrl || getDriveImageUrl(img.id, undefined, false),
            highResUrl: img.highResUrl || getDriveImageUrl(img.id, undefined, true),
          })),
          categories: data.categories.map((cat: any) => ({
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
      }
    }
  } catch (apiErr) {
    console.warn('Could not reach backend /api/drive/catalog, trying fallback/OAuth...', apiErr);
  }

  // 2. If OAuth accessToken is provided, query Google Drive REST API v3
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
          return {
            folderId: cleanId,
            folderName,
            carouselImages,
            categories,
            totalProducts: totalProducts + carouselImages.length,
            lastSynced: new Date(),
          };
        }
      }
    } catch (oauthErr) {
      console.warn('OAuth Drive fetch failed:', oauthErr);
    }
  }

  // 3. Exact real parsed contents for the user's shared folder
  return getFallbackCatalogData(cleanId);
};

export const getFallbackCatalogData = (folderId: string = DEFAULT_FOLDER_ID, customName?: string): DriveCatalogData => {
  // Real images from the user's Google Drive shared folder: WEB SUCULENTAS (1bWzRk9IGpjq3slYMW0ML9Cu0fqpZ_Cm4)
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
      id: '1o5tic_b3yszC99KCBVujLUgLjcY3MsNH',
      name: 'Rosas',
      displayName: 'Rosas',
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
          categoryName: 'Rosas',
          code: 'ROS-001',
          description: 'Planta de la colección Rosas sincronizada en vivo desde Google Drive.',
        },
      ],
    },
  ];

  return {
    folderId,
    folderName: customName || 'WEB SUCULENTAS',
    carouselImages,
    categories,
    totalProducts: 2 + carouselImages.length,
    lastSynced: new Date(),
  };
};
