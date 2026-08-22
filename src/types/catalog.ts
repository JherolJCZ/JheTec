export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  thumbnailLink?: string;
  webContentLink?: string;
  webViewLink?: string;
  createdTime?: string;
  size?: string;
  imageMediaMetadata?: {
    width?: number;
    height?: number;
    rotation?: number;
  };
  description?: string;
}

export interface ProductItem {
  id: string;
  name: string;
  displayName: string;
  imageUrl: string;
  highResUrl: string;
  webViewLink?: string;
  categoryId: string;
  categoryName: string;
  price?: number;
  description?: string;
  code?: string;
  fileSize?: string;
  dateAdded?: string;
}

export interface CategoryFolder {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  icon?: string;
  items: ProductItem[];
}

export interface CarouselSlide {
  id: string;
  name: string;
  title: string;
  subtitle?: string;
  imageUrl: string;
  highResUrl: string;
  webViewLink?: string;
}

export interface CartItem {
  product: ProductItem;
  quantity: number;
  notes?: string;
}

export interface DriveCatalogData {
  folderId: string;
  folderName: string;
  carouselImages: CarouselSlide[];
  categories: CategoryFolder[];
  totalProducts: number;
  lastSynced: Date;
}
