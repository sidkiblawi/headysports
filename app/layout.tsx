import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title:"HeadySports — The game has a soundtrack", description:"The community archive of jam-band songs heard on sports broadcasts. Find the song behind the commercial break."};
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){return <html lang="en"><body>{children}</body></html>}
