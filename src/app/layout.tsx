import type { Metadata, Viewport } from "next";
import { Inter, Noto_Serif_SC, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Script from "next/script"; 
import { MusicProvider } from "../context/MusicContext";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const serif = Noto_Serif_SC({ 
  subsets: ["latin"], 
  weight: ["400", "700"],
  variable: "--font-serif" 
});
const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono"
});

export const metadata: Metadata = {
  title: "Mutsu Studio",
  description: "Advanced AI Chat Interface",
  manifest: "/manifest.json", 
  icons: {
    icon: "/icon.png", 
    apple: "/icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Mutsu Studio",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover", 
  themeColor: "#0a0a0c",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className={`${inter.variable} ${serif.variable} ${mono.variable} font-sans`}>
        <Script 
          src="/lib/live2d.min.js" 
          strategy="beforeInteractive" 
        />
        
        <Script 
          src="/lib/live2dcubismcore.min.js" 
          strategy="beforeInteractive" 
        />
        
        <Script 
          src="/lib/vconsole.min.js"
          strategy="beforeInteractive"
        />
        <Script id="init-vconsole" strategy="afterInteractive">
          {`
            // 简单的移动端检测正则
            if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
                var vConsole = new VConsole();
            }
          `}
        </Script>
        <MusicProvider>
        {children}
        </MusicProvider>
      </body>
    </html>
  );
}