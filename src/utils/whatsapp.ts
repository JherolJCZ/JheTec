import { ProductItem, CartItem } from '../types/catalog';

export const WHATSAPP_NUMBER = '51952004149';
export const WHATSAPP_DISPLAY = '+51 952 004 149';

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
  customNotes?: string
): string => {
  const name = product.name
    ? product.name.replace(/\.[^/.]+$/, '')
    : (product.displayName || 'este producto');
  const link =
    product.webViewLink ||
    (product.id ? `https://drive.google.com/file/d/${product.id}/view` : '');

  let message = `¡Hola! Estoy interesado(a) en comprar este producto *${name}*: ${link}\n¿Tienen disponibilidad para envío o entrega? ¡Muchas gracias!`;

  if (customNotes && customNotes.trim()) {
    message += `\n\nNota: ${customNotes.trim()}`;
  }

  const encoded = encodeURIComponent(message);
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encoded}`;
};

export const createCartWhatsappUrl = (
  items: CartItem[],
  customerInfo?: { name?: string; address?: string; notes?: string }
): string => {
  const message = formatCartWhatsAppMessage(
    items,
    customerInfo?.name,
    customerInfo?.address,
    customerInfo?.notes
  );
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
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
