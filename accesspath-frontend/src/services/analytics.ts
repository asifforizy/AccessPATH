"use server";

import { apiFetch, buildQuery } from "@/lib/api";

export async function getAnalyticsOverview() {
  return apiFetch<{
    users: number;
    locations: number;
    reports: number;
    contributions: number;
    reviews: number;
    favorites: number;
    pending: {
      reports: number;
      contributions: number;
      locations: number;
      total: number;
    };
  }>("/analytics/overview");
}

export async function getLocationAnalytics() {
  return apiFetch<{
    total: number;
    byStatus: Record<string, number>;
    byCategory: Array<{
      categoryId: string;
      category: { id: string; name: string; slug: string } | null;
      count: number;
    }>;
    topCities: Array<{ city: string; count: number }>;
    averageAccessibilityScore: number;
    profiles: number;
  }>("/analytics/locations");
}

export async function getReportAnalytics() {
  return apiFetch<{
    total: number;
    byStatus: Record<string, number>;
    byType: Record<string, number>;
  }>("/analytics/reports");
}

export async function getContributionAnalytics() {
  return apiFetch<{
    total: number;
    byStatus: Record<string, number>;
    byType: Record<string, number>;
  }>("/analytics/contributions");
}

export async function getUserAnalytics() {
  return apiFetch<{
    total: number;
    byRole: Record<string, number>;
    byStatus: Record<string, number>;
    newUsersLast30Days: number;
  }>("/analytics/users");
}

export async function getModerationAnalytics() {
  return apiFetch<{
    pendingReports: number;
    underReviewReports: number;
    resolvedReports: number;
    pendingContributions: number;
    flaggedSubmissions: number;
    totalReviews: number;
  }>("/analytics/moderation");
}

export async function getMonthlyTrends(months = 12) {
  return apiFetch<
    Array<{
      month: string;
      users: number;
      locations: number;
      reports: number;
      contributions: number;
      reviews: number;
    }>
  >(`/analytics/trends/monthly${buildQuery({ months })}`);
}

export async function getTopBarrierAreas(limit = 10) {
  return apiFetch<Array<{ area: string; count: number }>>(
    `/analytics/barriers/top-areas${buildQuery({ limit })}`,
  );
}

export async function getCategoryDistribution() {
  return apiFetch<
    Array<{
      categoryId: string;
      name: string;
      slug: string | null;
      count: number;
    }>
  >("/analytics/categories/distribution");
}

export async function getAccessibilityDistribution() {
  return apiFetch<{
    total: number;
    verified: number;
    buckets: Array<{ range: string; count: number }>;
  }>("/analytics/accessibility/distribution");
}

export async function getHeatmap(limit = 500) {
  return apiFetch<{
    total: number;
    points: Array<{
      locationId: string;
      name: string;
      latitude: number;
      longitude: number;
      weight: number;
    }>;
  }>(`/analytics/heatmap${buildQuery({ limit })}`);
}
