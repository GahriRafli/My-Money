import "./globals.css";
import PwaRegister from "@/components/PwaRegister";

export const metadata = {
  title: "My Money",
  description: "Aplikasi keuangan pribadi dan keluarga",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "My Money",
  },
  icons: {
    icon: "/icons/icon.svg",
    apple: "/icons/icon.svg",
  },
};

export const viewport = {
  themeColor: "#6366F1",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="format-detection" content="telephone=no" />
      </head>
      <body>
        <PwaRegister />
        {children}
        <div className="desktop-hint">
          <div>
            <p style={{ fontSize:12, color:"rgba(255,255,255,0.3)", marginBottom:8, fontWeight:600, letterSpacing:"0.1em", textTransform:"uppercase" }}>My Money</p>
            <h1>Keuangan<br/>Bersama,<br/>Lebih Mudah.</h1>
          </div>
          <p>Catat pengeluaran, kelola budget, dan pantau keuangan bersama keluarga atau teman.</p>
          <span className="badge-pwa">📱 Install sebagai PWA</span>
        </div>
      </body>
    </html>
  );
}
