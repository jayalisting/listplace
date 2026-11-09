import { Metadata } from "next"
import CrmWorkspace from "@/components/crm-workspace"
import AdminErrorBoundary from "@/components/admin-error-boundary"

export const metadata: Metadata = {
  title: "Real Estate CRM | JayaListing",
  description: "Unified client, property leads, task management and deal tracker.",
}

export default function CrmPage() {
  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <AdminErrorBoundary fallbackTitle="Real Estate CRM encountered an error">
          <CrmWorkspace />
        </AdminErrorBoundary>
      </div>
    </div>
  )
}

