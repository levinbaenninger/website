"use client";

import { formatDuration } from "./format-duration";

export const ExperienceDuration = ({
  endDate,
  startDate,
}: {
  endDate: string | null;
  startDate: string;
}) => (
  <span className="tabular-nums">{formatDuration(startDate, endDate)}</span>
);
