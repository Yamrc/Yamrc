import 'dotenv/config';
import { WakaClient } from 'wakaclient';
import { Octokit } from '@octokit/rest';

const { GIST_ID, GH_PAT, WAKATIME_KEY } = process.env;
if (!GIST_ID || !GH_PAT || !WAKATIME_KEY)
  throw new Error('Missing environment variables');

const waka = new WakaClient(WAKATIME_KEY);
const octo = new Octokit({ auth: `token ${GH_PAT}` });

(async () => {
  try {
    const data = (await waka.getStats()).data;

    const topLanguage = data.languages.filter(l => l.name !== 'Other')[0];
    const topEditor = data.editors.filter(e => e.name !== 'Other')[0];
    const topOS = data.operating_systems.filter(os => os.name !== 'Other')[0];

    const lines = [
      `Most Used Language: ${topLanguage.name} (${topLanguage.text})`,
      `Most Used IDE: ${topEditor.name} (${topEditor.text})`,
      `Most Used OS: ${topOS.name} (${topOS.text})`,
    ];

    const gist = await octo.gists.get({ gist_id: GIST_ID });
    const filename = Object.keys(gist.data.files)[0];
    await octo.gists.update({
      gist_id: GIST_ID,
      description: `Total Time Coding ${data.human_readable_total_including_other_language}`,
      files: {
        [filename]: {
          filename: 'profile.md',
          content: lines.join('\n'),
        },
      },
    });
  } catch (error) {
    console.error('Failed to update gist:', error);
  }
})();