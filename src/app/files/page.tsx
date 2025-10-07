"use client"

import { DashboardLayout } from "@/components/DashboardLayout"
import FileManager from "@/components/FileManager"
import { withAuth } from "@/hooks/useAuth"

function FilesPage() {
  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        <FileManager />
      </div>
    </DashboardLayout>
  )
}

// Wrap with authentication HOC
export default withAuth(FilesPage)