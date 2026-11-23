export interface IPagination {
	page: number;
	limit: number;
}

export interface IPaginationMeta extends IPagination {
	total: number;
	totalPages: number;
}
