export const theme = {
    colors: {
        // Fonds
        background: '#0a0a0f',          // Fond principal (accueil-container)
        card: '#1a1a24',                // Fond solide pour les cartes ou formulaires
        cardTransparent: 'rgba(255, 255, 255, 0.05)', // Fond translucide pour les boutons/tags

        // Accents (Basés sur tes dégradés linear-gradient)
        primary: '#9333ea',             // Violet principal
        primaryLight: '#c084fc',        // Violet clair (hover/textes)
        secondary: '#3b82f6',           // Bleu secondaire

        // Textes
        text: '#ffffff',                // Texte blanc standard
        textMuted: '#9ca3af',           // Texte secondaire (sous-titres)
        textDark: '#64748b',            // Texte très discret (placeholders, dates)

        // Utilitaires
        border: 'rgba(255, 255, 255, 0.1)', // Bordures subtiles
        notification: '#ef4444'         // Rouge des alertes (notification-dot)
    },
    radius: {
        small: 8,       // 0.5rem (logo-icon)
        medium: 12,     // 0.75rem (filter-select)
        large: 16,      // 1rem (game-card-modern)
        pill: 9999      // Arrondi total (category-btn)
    }
};