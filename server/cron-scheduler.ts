import { storage } from './storage/storage';

class CronScheduler {
  private scheduledJobs: Map<string, NodeJS.Timeout> = new Map();

  startDailyStudentTracking() {
    // Run immediately once on startup
    this.runStudentTracking();

    // Then schedule to run every 24 hours (86400000 milliseconds)
    const dailyInterval = setInterval(() => {
      this.runStudentTracking();
    }, 24 * 60 * 60 * 1000);

    this.scheduledJobs.set('daily_student_tracking', dailyInterval);
    console.log('Daily student tracking cron job started');
  }

  private async runStudentTracking() {
    try {
      console.log('Running daily student tracking update...');
      await storage.updateStudentTryContent();
      console.log('Daily student tracking completed successfully');
    } catch (error) {
      console.error('Error in daily student tracking:', error);
    }
  }

  stopAll() {
    this.scheduledJobs.forEach((timeout, jobName) => {
      clearInterval(timeout);
      console.log(`Stopped cron job: ${jobName}`);
    });
    this.scheduledJobs.clear();
  }
}

export const cronScheduler = new CronScheduler();