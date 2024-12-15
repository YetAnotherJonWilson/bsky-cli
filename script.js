import readline from 'readline';
import dotenv from 'dotenv';
import { BskyAgent } from '@atproto/api';

dotenv.config();

const serviceUrl = process.env.BSKY_PDS_ENDPOINT || 'https://bsky.social';

const agent = new BskyAgent({
  service: serviceUrl,
});

function showAvailableCommands() {
  console.log('\nAvailable Commands:');
  console.log('- profile               → Show your profile information');
  console.log('- timeline              → Show your timeline feed');
  console.log(
    '- list <collection>     → List records in a specific collection'
  );
  console.log('- exit                  → Quit the program\n');
}

async function main() {
  console.clear();

  try {
    await agent.login({
      identifier: process.env.BSKY_HANDLE,
      password: process.env.BSKY_PASSWORD,
    });

    console.log(`Connected to: ${serviceUrl}`);
    console.log(`Logged in as: ${process.env.BSKY_HANDLE}`);

    startInteractiveCLI();
  } catch (error) {
    console.error('Login failed:', error.message);
    process.exit(1);
  }
}

function startInteractiveCLI() {
  showAvailableCommands();

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: '\nBskyCLI> ',
  });

  rl.prompt();

  rl.on('line', async (line) => {
    const [command, ...args] = line.trim().split(' ');

    switch (command) {
      case 'profile':
        await getProfile();
        break;

      case 'timeline':
        await getTimeline();
        break;

      case 'list':
        if (args.length === 0) {
          console.log('Please specify a collection. Usage: list <collection>');
        } else {
          const collection = args.join(' ');
          await listRecords(collection);
        }
        break;

      case 'exit':
        console.log('Goodbye!');
        rl.close();
        process.exit(0);

      default:
        console.log(`Unknown command: ${command}`);
        showAvailableCommands();
        break;
    }

    rl.prompt();
  });
}

async function getProfile() {
  try {
    const profile = await agent.getProfile({
      actor: process.env.BSKY_HANDLE,
    });
    console.log('\nProfile Data:', profile.data);
  } catch (error) {
    console.error('Error fetching profile:', error.message);
  }
}

async function getTimeline() {
  try {
    const timeline = await agent.getTimeline();
    console.log('\nTimeline Data:', timeline.data.feed);
  } catch (error) {
    console.error('Error fetching timeline:', error.message);
  }
}

async function listRecords(collection) {
  try {
    const records = await agent.api.com.atproto.repo.listRecords({
      repo: agent.session?.did, // Use the logged-in user's DID
      collection,
    });

    if (records.data.records.length === 0) {
      console.log(`No records found in ${collection}.`);
    } else {
      console.log(`\nRecords in ${collection}:`, records.data.records);
    }
  } catch (error) {
    console.error(`Error fetching records from ${collection}:`, error.message);
  }
}

main();
