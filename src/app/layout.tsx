import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Inter, Plus_Jakarta_Sans, Atkinson_Hyperlegible, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import QueryProvider from "@/providers/QueryProvider";
import { DynamicPwaBranding } from "@/components/branding/DynamicPwaBranding";
import { BeautySalonJsonLd } from "@/components/seo/BeautySalonJsonLd";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  display: "swap",
});

const atkinson = Atkinson_Hyperlegible({
  weight: ["400", "700"],
  variable: "--font-hyperlegible",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://vercel-sup-b-corp-gonzales.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Gloss Salón and Relax | Santuario de Belleza, Coloración & Spa en Jesús María",
    template: "%s | Gloss Salón and Relax",
  },
  description:
    "Salón boutique de alta gama con 17 años de maestría en Jesús María, Lima. Coloración experta, balayage luminoso, rescate de fibra capilar con Plex, nail spa y bienestar sensorial asistido por Opal AI.",
  keywords: [
    "Gloss Salón and Relax",
    "Salón de belleza Jesús María",
    "Balayage Lima",
    "Coloración capilar Jesús María",
    "Tratamiento capilar Lima",
    "Spa capilar Jesús María",
    "Peluquería Mariscal Luzuriaga",
    "LuminaHQ",
    "Vaikuntha ERP",
    "Cosmiatría Lima",
    "Corporación Gonzales",
  ],
  authors: [{ name: "Corporación Gonzales" }],
  creator: "Corporación Gonzales",
  publisher: "Gloss Salón and Relax",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Gloss Salón and Relax | Tu Santuario de Belleza & Bienestar",
    description:
      "17 años de maestría artesanal en Jesús María combinados con biotecnología capilar inteligente. Descubre tu ritual de cuidado consciente.",
    url: siteUrl,
    siteName: "Gloss Salón and Relax",
    locale: "es_PE",
    type: "website",
    images: [
      {
        url: "/api/branding/icon?size=512",
        width: 512,
        height: 512,
        alt: "Gloss Salón and Relax - Corporación Gonzales",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Gloss Salón and Relax | 17 Años de Maestría",
    description:
      "Tu santuario de belleza, coloración consciente y relajación integral en Jesús María, Lima.",
    images: ["/api/branding/icon?size=512"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/brands/gloss-favicon.png", type: "image/png" },
      { url: "/api/branding/icon?size=192", sizes: "192x192", type: "image/png" },
      { url: "/api/branding/icon?size=512", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/api/branding/icon?size=apple", sizes: "180x180", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Gloss Salón",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
  themeColor: "#18181b",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${inter.variable} ${plusJakarta.variable} ${atkinson.variable} ${jetbrainsMono.variable} h-full antialiased dark`}
    >
      <head>
        <link rel="manifest" href="/api/manifest" crossOrigin="use-credentials" />
        <BeautySalonJsonLd />
      </head>
      <body suppressHydrationWarning className="min-h-full flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-x-hidden font-sans transition-colors duration-200">
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){
              try{
                var s=localStorage.getItem('theme-storage');
                if(s){var p=JSON.parse(s);if(p&&p.state&&p.state.themeMode==='light'){document.documentElement.classList.remove('dark');}}
                else{var m=localStorage.getItem('vaikuntha_theme_mode');if(m==='light'){document.documentElement.classList.remove('dark');}}
              }catch(e){}
              
              /* Supresión preventiva del bug interno de Chromium DevTools Live Metrics (reportAllChanges / startTime) */
              if(typeof window !== 'undefined'){
                window.addEventListener('error', function(e){
                  if(e && e.message && (e.message.indexOf("reading 'startTime'") !== -1 || (e.error && e.error.stack && e.error.stack.indexOf('reportAllChanges') !== -1))){
                    e.preventDefault();
                    e.stopPropagation();
                  }
                }, true);
              }
            })();`
          }}
        />
        <QueryProvider>
          <ThemeProvider>
            <DynamicPwaBranding />
            {children}
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
