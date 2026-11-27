import { FavoriteCard } from "@/components/favorites/favorites-card";
import { FavoritesEmpty } from "@/components/favorites/favorites-empty";
import { FavoritesHeader } from "@/components/favorites/favorites-header";
import { getFavorites } from "@/services/favorites";

export default async function FavoritesPage() {
  const res = await getFavorites({ limit: 50 });
  const favorites = res.data ?? [];

  return (
    <div className="space-y-6">
      <FavoritesHeader total={res.meta?.total ?? favorites.length} />

      {favorites.length ? (
        <ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {favorites.map((favorite) => (
            <li key={favorite.id}>
              <FavoriteCard favorite={favorite} />
            </li>
          ))}
        </ul>
      ) : (
        <FavoritesEmpty />
      )}
    </div>
  );
}

export const instant = false;
