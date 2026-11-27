import { getFavorites } from "@/services/favorites";
import { SavedPlacesCard } from "./saved-place-card";

export async function SavedPlacesSection() {
  const favorites = await getFavorites({ limit: 4 });
  return <SavedPlacesCard favorites={favorites.data ?? []} />;
}
