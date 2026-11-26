interface UserAvatarProps {
  name: string;
  image: string | null;
  width?: number; // px
  height?: number; // px
}

export function UserAvatar({
  name,
  image,
  width = 160,
  height = 120,
}: UserAvatarProps) {
  const style = { width, height };
  const initialFontSize = Math.min(width, height) / 2.5;

  if (image) {
    return (
      <img
        src={image}
        alt={name}
        style={style}
        className="rounded-xl object-cover"
      />
    );
  }

  return (
    <div
      style={{ ...style, fontSize: initialFontSize }}
      className="flex items-center justify-center rounded-xl bg-muted font-semibold text-muted-foreground"
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );
}
