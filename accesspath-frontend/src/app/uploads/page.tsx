import { PageHeader } from "@/components/shared/page-header";

import { UploadForm } from "./_components/upload-form";

export default function UploadsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Uploads"
        description="Register image metadata for locations and reports, or request an upload URL."
      />
      <UploadForm />
    </div>
  );
}
