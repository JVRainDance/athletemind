import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'sonner'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'AthleteMind',
  description: 'Show up. Reflect. Build momentum.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        <Toaster
          position="top-right"
          richColors
          closeButton
          toastOptions={{
            duration: 4000,
            classNames: {
              toast: 'rounded-lg shadow-lg',
              title: 'font-semibold',
              description: 'text-sm',
            },
          }}
        />
      </body>
    </html>
  )
}


