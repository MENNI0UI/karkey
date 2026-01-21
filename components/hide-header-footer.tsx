'use client';

import { useEffect } from 'react';

export default function HideHeaderFooter() {
    useEffect(() => {
        // Safely inject styles to hide header and footer
        const style = document.createElement('style');
        style.id = 'hide-layout-styles';
        style.innerHTML = `
      header, footer { 
        display: none !important; 
        visibility: hidden !important; 
      }
    `;
        document.head.appendChild(style);

        return () => {
            // Cleanup on unmount
            const existingStyle = document.getElementById('hide-layout-styles');
            if (existingStyle) {
                existingStyle.remove();
            }
        };
    }, []);

    return null;
}
