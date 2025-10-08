"use client"

import { DashboardLayout } from "@/components/DashboardLayout"
import SystemLogs from "@/components/SystemLogs"
import { withAuth } from "@/hooks/useAuth"

function LogsPage() {
  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        <SystemLogs />
      </div>
    </DashboardLayout>
  )
}

// Wrap with authentication HOC
export default withAuth(LogsPage)