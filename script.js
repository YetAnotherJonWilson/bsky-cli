import readline from 'readline';
import dotenv from 'dotenv';
import { BskyAgent } from '@atproto/api';
import { CarReader } from '@ipld/car';
import pkg from 'cbor';

const { decode } = pkg;

dotenv.config();

const serviceUrl = process.env.BSKY_PDS_ENDPOINT || 'https://bsky.social';

const agent = new BskyAgent({
  service: serviceUrl,
});

function showAvailableCommands() {
  console.log('\nAvailable Commands:');
  console.log('1. profile    → Show your profile information');
  console.log('2. timeline   → Show your timeline feed');
  console.log('3. collections → Show all the collections in your PDS');
  console.log('4. list <collection> → List records in a specific collection');
  console.log('5. exit       → Quit the program\n');
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
      case '1':
        await getProfile();
        showAvailableCommands();
        break;

      case '2':
        await getTimeline();
        showAvailableCommands();
        break;

      case '3':
        await getCollections();
        showAvailableCommands();
        break;

      case '4':
        if (args.length === 0) {
          console.log('Please specify a collection. Usage: 4 <collection>');
        } else {
          const collection = args.join(' ');
          await listRecords(collection);
        }
        showAvailableCommands();
        break;

      case '5':
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

async function getCollections() {
  try {
    const repoData = await agent.api.com.atproto.sync.getRepo({
      did: agent.session?.did,
    });

    const carReader = await CarReader.fromBytes(repoData.data);
    const collections = new Set();

    for await (const { cid, bytes } of carReader.blocks()) {
      try {
        // Decode the bytes into a record
        const record = decode(bytes);

        // Check if it's a valid AT Protocol record
        if (record && typeof record === 'object' && record.$type) {
          const collection = record.$type.split('/')[0];
          collections.add(collection);
        }
      } catch (error) {
        // Ignore non-JSON blocks
      }
    }

    if (collections.size === 0) {
      console.log('No collections found.');
    } else {
      console.log(`Collections found:\n${[...collections].join('\n')}`);
    }
  } catch (error) {
    console.error('Error fetching collections:', error.message);
  }
}

main();
