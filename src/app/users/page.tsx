"use client"

import { DashboardLayout } from "@/components/DashboardLayout"
import UserManagement from "@/components/UserManagement"
import { withAuth } from "@/hooks/useAuth"

function UsersPage() {
  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        <UserManagement />
      </div>
    </DashboardLayout>
  )
}

// Wrap with authentication HOC
export default withAuth(UsersPage)