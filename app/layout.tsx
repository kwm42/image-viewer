import "../styles/globals.css";
import { AppProvider } from "@/contexts/AppContext";

export const metadata = {
  title: "图片查看器",
  description: "基于 Next.js 的本地图片查看器",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
