import { ProductItem, CartItem } from '../types/catalog';

export const DEFAULT_WHATSAPP_NUMBER = '51952004149';
export const DEFAULT_WHATSAPP_DISPLAY = '+51 952 004 149';

export const cleanWhatsappNumber = (input: string): string => {
  if (!input) return '';
  return input.replace(/[^\d]/g, '');
};

export const getStoredWhatsappNumber = (): string => {
  try {
    const saved = localStorage.getItem('catalog_whatsapp_number');
    if (saved && saved.trim()) {
      const clean = cleanWhatsappNumber(saved);
      if (clean) return clean;
    }
  } catch {
    // ignore
  }
  return DEFAULT_WHATSAPP_NUMBER;
};

export const setStoredWhatsappNumber = (num: string): string => {
  const cleaned = cleanWhatsappNumber(num);
  try {
    if (cleaned) {
      localStorage.setItem('catalog_whatsapp_number', cleaned);
    } else {
      localStorage.removeItem('catalog_whatsapp_number');
    }
  } catch {
    // ignore
  }
  return cleaned || DEFAULT_WHATSAPP_NUMBER;
};

export const formatWhatsappDisplay = (number?: string): string => {
  const clean = cleanWhatsappNumber(number || getStoredWhatsappNumber());
  if (!clean) return DEFAULT_WHATSAPP_DISPLAY;
  if (clean.length === 11 && clean.startsWith('51')) {
    return `+51 ${clean.slice(2, 5)} ${clean.slice(5, 8)} ${clean.slice(8)}`;
  }
  if (clean.length === 9) {
    return `+51 ${clean.slice(0, 3)} ${clean.slice(3, 6)} ${clean.slice(6)}`;
  }
  return `+${clean}`;
};

export const getWhatsAppNumber = getStoredWhatsappNumber;
export const getWhatsAppDisplay = formatWhatsappDisplay;

export const WHATSAPP_NUMBER = DEFAULT_WHATSAPP_NUMBER;
export const WHATSAPP_DISPLAY = DEFAULT_WHATSAPP_DISPLAY;

export const cleanProductName = (filename: string): string => {
  if (!filename) return 'Producto';
  // Remove file extension (.jpg, .png, .jpeg, .webp, etc.)
  let clean = filename.replace(/\.[^/.]+$/, '');
  // Replace underscores and hyphens with spaces
  clean = clean.replace(/[-_]+/g, ' ');
  // Capitalize words nicely
  clean = clean.replace(/\b\w/g, char => char.toUpperCase());
  return clean.trim();
};

export const createSingleProductWhatsappUrl = (
  product: ProductItem,
  customNotes?: string,
  targetWhatsapp?: string
): string => {
  const cleanTarget = targetWhatsapp ? cleanWhatsappNumber(targetWhatsapp) : '';
  const targetNumber = cleanTarget || getStoredWhatsappNumber() || DEFAULT_WHATSAPP_NUMBER;
  const name = product.name
    ? product.name.replace(/\.[^/.]+$/, '')
    : (product.displayName || 'este producto');
  const link =
    product.webViewLink ||
    (product.id ? `https://drive.google.com/file/d/${product.id}/view` : '');
  const linkText = link ? `: ${link}` : '';

  let message = `¡Hola! Estoy interesado(a) en comprar este producto *${name}*${linkText}\n¿Tienen disponibilidad para envío o entrega? ¡Muchas gracias!`;

  if (customNotes && customNotes.trim()) {
    message += `\n\nNota: ${customNotes.trim()}`;
  }

  const encoded = encodeURIComponent(message);
  return `https://wa.me/${targetNumber}?text=${encoded}`;
};

export const createCartWhatsappUrl = (
  items: CartItem[],
  customerInfo?: { name?: string; address?: string; notes?: string },
  targetWhatsapp?: string
): string => {
  const cleanTarget = targetWhatsapp ? cleanWhatsappNumber(targetWhatsapp) : '';
  const targetNumber = cleanTarget || getStoredWhatsappNumber() || DEFAULT_WHATSAPP_NUMBER;
  const message = formatCartWhatsAppMessage(
    items,
    customerInfo?.name,
    customerInfo?.address,
    customerInfo?.notes
  );
  return `https://wa.me/${targetNumber}?text=${encodeURIComponent(message)}`;
};

export const formatCartWhatsAppMessage = (
  items: CartItem[],
  customerName?: string,
  deliveryAddress?: string,
  generalNotes?: string
): string => {
  if (items.length === 0) return '¡Hola! Me gustaría hacer una consulta sobre su catálogo.';

  let message = `¡Hola! Quisiera realizar el siguiente pedido desde el catálogo web:\n`;

  items.forEach((item, index) => {
    const p = item.product;
    const name = p.name
      ? p.name.replace(/\.[^/.]+$/, '')
      : (p.displayName || 'Producto');
    const link = p.id
      ? `https://drive.google.com/file/d/${p.id}/view`
      : (p.webViewLink || '');

    message += `${index + 1}. *${name}* (Cantidad: ${item.quantity}) ${link}\n`;
  });

  if (customerName && customerName.trim()) {
    message += `\nCliente: ${customerName.trim()}`;
  }
  if (deliveryAddress && deliveryAddress.trim()) {
    message += `\nDirección/Destino: ${deliveryAddress.trim()}`;
  }
  if (generalNotes && generalNotes.trim()) {
    message += `\nNotas: ${generalNotes.trim()}`;
  }

  message += `\n¿Me confirman disponibilidad y total con envío? ¡Muchas gracias!`;

  return message;
};

export const getWhatsAppProductLink = createSingleProductWhatsappUrl;
export const getWhatsAppCartLink = createCartWhatsappUrl;
