import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import QueryProvider from "@/providers/QueryProvider";
import { DynamicPwaBranding } from "@/components/branding/DynamicPwaBranding";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Gloss Salón & Vaikuntha ERP",
  description: "Enterprise Resource Planning & WFM Engine Multi-Sede",
  manifest: "/api/manifest",
  icons: {
    icon: [
      { url: "/api/branding/icon?size=favicon", type: "image/png" },
      { url: "/api/branding/icon?size=192", sizes: "192x192", type: "image/png" },
    ],
    apple: [
      { url: "/api/branding/icon?size=apple", sizes: "180x180", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Gloss Salón"
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
  themeColor: "#18181b"
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
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
