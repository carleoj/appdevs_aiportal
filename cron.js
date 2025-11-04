import cron from "cron";
import https from "https";

const wakeUp = () => {
  https
    .get(process.env.API_URL, (res) => {
      if (res.statusCode === 200) console.log("GET request sent successfully");
      else console.log("GET request failed", res.statusCode);
    })
    .on("error", (e) => console.error("Error while sending request", e));
};

// Fire once immediately
wakeUp();

// Cron job every 14 minutes
const job = new cron.CronJob("*/14 * * * *", wakeUp);
job.start();

export default job;
