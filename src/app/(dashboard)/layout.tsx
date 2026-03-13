import { verifySession } from '@/lib/session'
import { SidebarProvider } from '@/components/ui/sidebar'
import { AppSidebar, SidebarTrigger } from '@/components/app-sidebar'
import { SessionExpiryModal } from '@/components/session-expiry-modal'
import { Separator } from '@/components/ui/separator'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Gate 2: independent server-side session verification (CVE-2025-29927 mitigation)
  const { expiresAt } = await verifySession()

  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="flex flex-1 flex-col min-h-screen">
        <header className="flex h-14 items-center gap-2 border-b px-4">
          <SidebarTrigger />
          <Separator orientation="vertical" className="h-6" />
        </header>
        <div className="flex-1 p-6">{children}</div>
      </main>
      <SessionExpiryModal expiresAt={expiresAt} />
    </SidebarProvider>
  )
}
