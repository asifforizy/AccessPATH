import { redirect } from "next/navigation";

import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { getUserMe } from "@/services/me";
import { PlacePhotos } from "./_components/place-photos";
import { UploadPhotoPanel } from "./_components/upload-photo-panel";

export default async function UploadsPage() {
  const user = await getUserMe();

  if (!user) redirect("/login");

  const canUpload = Boolean(user.emailVerifiedAt);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Photos"
        description="Add a photo to a place by searching for its name — no IDs to copy. Photos show up on the place page straight away."
      >
        <Badge variant={canUpload ? "success" : "warning"}>
          {canUpload ? "Verified account" : "Email not verified"}
        </Badge>
      </PageHeader>

      <div className="grid items-start gap-4 xl:grid-cols-2">
        <UploadPhotoPanel canUpload={canUpload} />
        <PlacePhotos />
      </div>
    </div>
  );
}

// Every surface here is cookie-authenticated and dynamic; allow blocking render.
export const instant = false;
