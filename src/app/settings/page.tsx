"use client"

import { DashboardLayout } from "@/components/DashboardLayout"
import Settings from "@/components/Settings"
import { withAuth } from "@/hooks/useAuth"

function SettingsPage() {
  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        <Settings />
      </div>
    </DashboardLayout>
  )
}

// Wrap with authentication HOC
export default withAuth(SettingsPage)