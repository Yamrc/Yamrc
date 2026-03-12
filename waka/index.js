import { WakaClient } from 'wakaclient';
import { Octokit } from '@octokit/rest';

const { GIST_ID_1, GIST_ID_2, GH_PAT, WAKATIME_KEY } = process.env;
if (!GIST_ID_1 || !GIST_ID_2 || !GH_PAT || !WAKATIME_KEY)
  throw new Error('Missing environment variables');

const waka = new WakaClient(WAKATIME_KEY);
const octo = new Octokit({ auth: GH_PAT });

(async () => {
  try {
    const data = (await waka.getStats()).data;

    const total = data.human_readable_total_including_other_language;
    const avg = data.human_readable_daily_average_including_other_language;

    const language = excludeOther(data.languages);
    const ide = excludeOther(data.editors);
    const os = excludeOther(data.operating_systems);

    const best_day = data.best_day;
    const minus_holidays = data.days_minus_holidays;
    const lines = `${data.human_additions.toLocaleString('en-US')} insertions(+) ${data.human_deletions.toLocaleString('en-US')} deletions(-)`

    const profile = [
      `Most Used language: ${language[0].name} #${language[0].text}`,
      `Most Used IDE: ${ide[0].name} #${ide[0].text}`,
      `Most Used OS: ${os[0].name} #${os[0].text}`,
    ];
    const stat = [
      `Best day: ${best_day.date} #${best_day.text}`,
      `Active days: ${minus_holidays}`,
      `Lines: ${lines}`
    ];

    await Promise.all([
      updateGist(GIST_ID_1, `Total Time Coding: ${total}`, "profile.yml", profile),
      updateGist(GIST_ID_2, `Daily Average: ${avg}`, "stat.yml", stat)
    ]);
  } catch (error) { console.error(`Something went wrong:`, error.message); }
})();

async function updateGist(gist_id, description, file_name, file_content) {
  try {
    await octo.gists.update({
      gist_id,
      description,
      files: {
        [file_name]: {
          content: file_content.join('\n'),
        }
      }
    });
    console.log(`Updated ${file_name}(${gist_id}).`)
  } catch (error) { console.error(`Update failed ${file_name}(${gist_id}):`, error.message); }
}

function excludeOther (cont) {
  return cont.filter(s => s.name !== "Other");
}
