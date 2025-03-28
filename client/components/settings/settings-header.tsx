import { ModeToggle } from "@/components/mode-toggle"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export default function SettingsHeader() {
  return (
    <div className="flex items-center justify-between mb-8">
      <div className="flex items-center">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon" className="mr-2">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Settings</h1>
      </div>
      <ModeToggle />
    </div>
  )
}

