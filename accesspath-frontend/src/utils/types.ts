import { ReactNode } from "react";

export interface IMe {
  id: string;
  name: string;
  email: string;
  image: string | null;
  emailVerifiedAt: string | null;
  role: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  preference: Record<string, unknown> | null;
  _count: {
    createdLocations: number;
    reports: number;
    reviews: number;
    favorites: number;
    savedRoutes: number;
    contributions: number;
  };
}

// Adjust to match your Prisma models
export interface IRecentItem {
  id: string;
  createdAt: string;
  status?: string;
  type?: string;
  description?: string;
  location?: { id: string; name: string; slug: string } | null;
}


export interface UserAvatarProps {
  name: string;
  image: string | null;
  size?: number;
}


export  interface ProfileCardProps {
  title: string;
  href?: string;
  children: ReactNode;
}


export interface ProfileHeaderProps {
  user: IMe;
  activeTab: string;
}

export interface ProfileOverviewProps {
  user: IMe;
  contributions: IRecentItem[];
  reports: IRecentItem[];
}
