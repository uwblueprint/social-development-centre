"use client";

import { useEffect, useRef } from "react";
import { recordPageVisit } from "@/features/welcome/actions";

export type AnalyticsValue =
  | string
  | number
  | boolean
  | null
  | AnalyticsValue[]
  | { [key: string]: AnalyticsValue };

export type PageVisitLeaveVia = "next" | "back" | "close" | "submit";

type PageVisitAnswer = {
  question_key: string;
  value: AnalyticsValue;
  ms_since_enter: number;
  ms_since_prev: number;
};

type PageVisitPayload = {
  page_key: string;
  total_ms: number;
  active_ms: number;
  first_answer_ms: number | null;
  last_answer_ms: number | null;
  left_via: PageVisitLeaveVia;
  answers: PageVisitAnswer[];
};

type PageVisitMetricsOptions = {
  pageKey: string;
};

class PageVisitMetrics {
  private readonly enteredAt = performance.now();
  private activeSince: number | null = document.hidden ? null : this.enteredAt;
  private activeMs = 0;
  private firstAnswerMs: number | null = null;
  private lastAnswerMs: number | null = null;
  private answers: PageVisitAnswer[] = [];
  private finished = false;

  constructor(private readonly pageKey: string) {
    document.addEventListener("visibilitychange", this.onVisibilityChange);
    window.addEventListener("pagehide", this.onPageHide);
  }

  recordAnswer(questionKey: string, value: AnalyticsValue) {
    if (this.finished) return;

    const now = performance.now();
    const msSinceEnter = Math.round(now - this.enteredAt);
    const msSincePrevious = this.lastAnswerMs === null
      ? msSinceEnter
      : msSinceEnter - this.lastAnswerMs;

    if (this.firstAnswerMs === null) this.firstAnswerMs = msSinceEnter;
    this.lastAnswerMs = msSinceEnter;
    this.answers.push({
      question_key: questionKey,
      value,
      ms_since_enter: msSinceEnter,
      ms_since_prev: msSincePrevious,
    });
  }

  async finish(leftVia: PageVisitLeaveVia) {
    if (this.finished) return;
    this.finished = true;
    this.stopTracking();

    const now = performance.now();
    if (this.activeSince !== null) this.activeMs += now - this.activeSince;

    const payload: PageVisitPayload = {
      page_key: this.pageKey,
      total_ms: Math.round(now - this.enteredAt),
      active_ms: Math.round(this.activeMs),
      first_answer_ms: this.firstAnswerMs,
      last_answer_ms: this.lastAnswerMs,
      left_via: leftVia,
      answers: this.answers,
    };

    try {
      await recordPageVisit(payload);
    } catch {
      // Analytics must not interrupt form navigation.
    }
  }

  private onVisibilityChange = () => {
    const now = performance.now();
    if (document.hidden) {
      if (this.activeSince !== null) this.activeMs += now - this.activeSince;
      this.activeSince = null;
    } else if (this.activeSince === null && !this.finished) {
      this.activeSince = now;
    }
  };

  private onPageHide = () => {
    void this.finish("close");
  };

  private stopTracking() {
    document.removeEventListener("visibilitychange", this.onVisibilityChange);
    window.removeEventListener("pagehide", this.onPageHide);
  }
}

export function usePageVisitMetrics({ pageKey }: PageVisitMetricsOptions) {
  const metricsRef = useRef<PageVisitMetrics | null>(null);

  useEffect(() => {
    const metrics = new PageVisitMetrics(pageKey);
    metricsRef.current = metrics;

    return () => {
      queueMicrotask(() => {
        if (metricsRef.current === metrics) void metrics.finish("close");
      });
    };
  }, [pageKey]);

  return {
    recordAnswer(questionKey: string, value: AnalyticsValue) {
      metricsRef.current?.recordAnswer(questionKey, value);
    },
    finish(leftVia: PageVisitLeaveVia) {
      return metricsRef.current?.finish(leftVia) ?? Promise.resolve();
    },
  };
}