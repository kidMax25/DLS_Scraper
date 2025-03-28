import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { getUserSettings } from "@/lib/user"

import SettingsHeader from "@/components/settings/settings-header"
import BinanceSettings from "@/components/settings/binance-settings"
import DlsIdSettings from "@/components/settings/dls-id-settings"
import NotificationSettings from "@/components/settings/notification-settings"
import ThemeSettings from "@/components/settings/theme-settings"

export default async function SettingsPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/auth/signin")
  }

  const userId = session.user.id
  const settings = await getUserSettings(userId)

  return (
    <div className="container mx-auto px-4 py-6">
      <SettingsHeader />

      <div className="grid grid-cols-1 gap-8 mt-6">
        <BinanceSettings binanceConnected={settings.binanceConnected} />
        <DlsIdSettings dlsId={settings.dlsId} />
        <NotificationSettings notifications={settings.notifications} />
        <ThemeSettings />
      </div>
    </div>
  )
}

