// ⚠️ ADMOB DESHABILITADO - Componente dummy
import React from 'react';

interface InterstitialFallbackModalProps {
    visible: boolean;
    onClose: () => void;
}

export const InterstitialFallbackModal: React.FC<InterstitialFallbackModalProps> = ({ onClose }) => {
    // Cierra inmediatamente mientras AdMob está deshabilitado
    React.useEffect(() => {
        onClose();
    }, [onClose]);
    
    return null;
};
