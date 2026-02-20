/**
 * Utilidades para sanitizar y validar inputs del usuario
 * Previene inyección de código y valida formatos
 */

/**
 * Sanitiza texto general eliminando código malicioso
 */
export const sanitizeText = (text: string, maxLength: number = 500): string => {
  if (!text) return '';
  
  return text
    .trim()
    .substring(0, maxLength)
    // Remover tags de script
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<script[^>]*>/gi, '')
    .replace(/<\/script>/gi, '')
    // Remover javascript: URLs
    .replace(/javascript:/gi, '')
    // Remover event handlers
    .replace(/on\w+\s*=/gi, '')
    // Remover iframes
    .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '');
};

/**
 * Sanitiza email
 */
export const sanitizeEmail = (email: string): string => {
  if (!email) return '';
  return email.trim().toLowerCase();
};

/**
 * Valida formato de email
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
  return emailRegex.test(email);
};

/**
 * Sanitiza URL
 */
export const sanitizeUrl = (url: string): string => {
  if (!url) return '';
  
  try {
    const parsed = new URL(url);
    // Solo permitir http y https
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return '';
    }
    return parsed.toString();
  } catch {
    return '';
  }
};

/**
 * Valida longitud de texto
 */
export const isValidLength = (text: string, min: number, max: number): boolean => {
  const length = text.trim().length;
  return length >= min && length <= max;
};

/**
 * Sanitiza nombre de usuario
 */
export const sanitizeName = (name: string): string => {
  if (!name) return '';
  
  return name
    .trim()
    .substring(0, 100)
    // Remover caracteres especiales peligrosos
    .replace(/[<>]/g, '');
};

/**
 * Sanitiza mensaje de chat
 */
export const sanitizeMessage = (message: string): string => {
  return sanitizeText(message, 500);
};

/**
 * Sanitiza descripción de imagen
 */
export const sanitizeCaption = (caption: string): string => {
  return sanitizeText(caption, 200);
};

/**
 * Sanitiza ubicación
 */
export const sanitizeLocation = (location: string): string => {
  return sanitizeText(location, 200);
};
