export interface IRoutePoint {
  id?: string;
  name: string;
  latitude: number;
  longitude: number;
}

export type TravelMode = "WALKING" | "WHEELCHAIR" | "CYCLING" | "DRIVING";

export type PickKind = "origin" | "destination";
