export interface ICoordinates {
	latitude: number;
	longitude: number;
}

const EARTH_RADIUS_METERS = 6_371_000;

const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

export const haversineMeters = (a: ICoordinates, b: ICoordinates): number => {
	const lat1 = toRadians(a.latitude);
	const lat2 = toRadians(b.latitude);
	const deltaLat = toRadians(b.latitude - a.latitude);
	const deltaLng = toRadians(b.longitude - a.longitude);

	const h =
		Math.sin(deltaLat / 2) ** 2 +
		Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) ** 2;

	return 2 * EARTH_RADIUS_METERS * Math.asin(Math.min(1, Math.sqrt(h)));
};

export const isValidLatitude = (value: number) =>
	Number.isFinite(value) && value >= -90 && value <= 90;

export const isValidLongitude = (value: number) =>
	Number.isFinite(value) && value >= -180 && value <= 180;

export const roundMeters = (value: number) => Math.round(value);
