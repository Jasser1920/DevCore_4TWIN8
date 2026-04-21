import { Injectable } from '@nestjs/common';

@Injectable()
export class ApiUsageService {
  // Map: minute timestamp (e.g., 202604191230) -> count
  private usage: Map<number, number> = new Map();

  logUsage(date: Date = new Date()) {
    const key = Number(
      date.getFullYear().toString() +
      (date.getMonth() + 1).toString().padStart(2, '0') +
      date.getDate().toString().padStart(2, '0') +
      date.getHours().toString().padStart(2, '0') +
      date.getMinutes().toString().padStart(2, '0')
    );
    this.usage.set(key, (this.usage.get(key) || 0) + 1);
  }

  getUsageStats(minutes: number = 60) {
    const now = new Date();
    const stats: { timestamp: number, count: number }[] = [];
    for (let i = minutes - 1; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 60000);
      const key = Number(
        d.getFullYear().toString() +
        (d.getMonth() + 1).toString().padStart(2, '0') +
        d.getDate().toString().padStart(2, '0') +
        d.getHours().toString().padStart(2, '0') +
        d.getMinutes().toString().padStart(2, '0')
      );
      stats.push({ timestamp: key, count: this.usage.get(key) || 0 });
    }
    return stats;
  }
}