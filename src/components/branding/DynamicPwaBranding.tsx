'use client';

import { useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { resolveBrand } from '@/lib/branding/brandsConfig';

export function DynamicPwaBranding() {
  const sedeActiva = useAppStore((state) => state.sedeActiva);

  useEffect(() => {
    const brand = resolveBrand(sedeActiva?.id);

    // 1. Persistir cookie para SSR y peticiones de manifest nativas de Android
    if (typeof document !== 'undefined') {
      document.cookie = `vaikuntha_sede_id=${brand.id}; path=/; max-age=31536000; SameSite=Lax`;

      // 2. Actualizar o crear tag de Manifest dinámico
      let manifestLink = document.querySelector<HTMLLinkElement>('link[rel="manifest"]');
      const manifestUrl = `/api/manifest?sedeId=${brand.id}`;
      if (manifestLink) {
        manifestLink.href = manifestUrl;
      } else {
        manifestLink = document.createElement('link');
        manifestLink.rel = 'manifest';
        manifestLink.href = manifestUrl;
        document.head.appendChild(manifestLink);
      }

      // 3. Actualizar o crear Icono y Apple Touch Icon
      let iconLink = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
      const iconUrl = `/api/branding/icon?sedeId=${brand.id}&size=192`;
      if (iconLink) {
        iconLink.href = iconUrl;
      } else {
        iconLink = document.createElement('link');
        iconLink.rel = 'icon';
        iconLink.href = iconUrl;
        document.head.appendChild(iconLink);
      }

      let appleIconLink = document.querySelector<HTMLLinkElement>('link[rel="apple-touch-icon"]');
      const appleIconUrl = `/api/branding/icon?sedeId=${brand.id}&size=apple`;
      if (appleIconLink) {
        appleIconLink.href = appleIconUrl;
      } else {
        appleIconLink = document.createElement('link');
        appleIconLink.rel = 'apple-touch-icon';
        appleIconLink.href = appleIconUrl;
        document.head.appendChild(appleIconLink);
      }

      // 4. Actualizar títulos de app instalable en Android / iOS
      let appTitleMeta = document.querySelector<HTMLMetaElement>('meta[name="apple-mobile-web-app-title"]');
      if (appTitleMeta) {
        appTitleMeta.content = brand.shortName;
      } else {
        appTitleMeta = document.createElement('meta');
        appTitleMeta.name = 'apple-mobile-web-app-title';
        appTitleMeta.content = brand.shortName;
        document.head.appendChild(appTitleMeta);
      }

      let appNameMeta = document.querySelector<HTMLMetaElement>('meta[name="application-name"]');
      if (appNameMeta) {
        appNameMeta.content = brand.shortName;
      } else {
        appNameMeta = document.createElement('meta');
        appNameMeta.name = 'application-name';
        appNameMeta.content = brand.shortName;
        document.head.appendChild(appNameMeta);
      }

      // 5. Color de barra de estado
      let themeColorMeta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
      if (themeColorMeta) {
        themeColorMeta.content = brand.themeColor;
      } else {
        themeColorMeta = document.createElement('meta');
        themeColorMeta.name = 'theme-color';
        themeColorMeta.content = brand.themeColor;
        document.head.appendChild(themeColorMeta);
      }
    }
  }, [sedeActiva?.id]);

  return null;
}
