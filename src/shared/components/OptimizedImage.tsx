import React from 'react';
import { Image, ImageProps, ImageStyle, StyleProp } from 'react-native';

interface OptimizedImageProps extends Omit<ImageProps, 'source'> {
  uri: string;
  style?: StyleProp<ImageStyle>;
  fallbackUri?: string;
}

/**
 * Componente de imagen optimizado para máxima calidad
 * - Fuerza caché para mejor rendimiento
 * - Usa resizeMode cover por defecto
 * - Soporta fallback
 */
export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  uri,
  style,
  fallbackUri,
  resizeMode = 'cover',
  ...props
}) => {
  const [imageUri, setImageUri] = React.useState(uri);

  return (
    <Image
      source={{
        uri: imageUri,
        cache: 'force-cache',
      }}
      style={style}
      resizeMode={resizeMode}
      onError={() => {
        if (fallbackUri && imageUri !== fallbackUri) {
          setImageUri(fallbackUri);
        }
      }}
      {...props}
    />
  );
};

/**
 * Genera una URL de avatar HD (1080px)
 */
export const getHDAvatarUrl = (existingUrl?: string | null, gender?: 'male' | 'female'): string => {
  if (existingUrl && !existingUrl.includes('ui-avatars')) {
    return existingUrl;
  }
  
  const randomNum = Math.floor(Math.random() * 70) + 1;
  return `https://i.pravatar.cc/1080?img=${randomNum}`;
};
