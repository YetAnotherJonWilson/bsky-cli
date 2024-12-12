import dotenv from 'dotenv';
import { BskyAgent } from '@atproto/api';

dotenv.config();

async function main() {
  const serviceUrl = process.env.BSKY_PDS_ENDPOINT || 'https://bsky.social';

  const agent = new BskyAgent({
    service: serviceUrl,
  });

  await agent.login({
    identifier: process.env.BSKY_HANDLE,
    password: process.env.BSKY_PASSWORD,
  });

  const profile = await agent.getProfile({
    actor: process.env.BSKY_HANDLE,
  });

  console.log(`Connected to: ${serviceUrl}`);
  console.log('Profile Data:', profile.data);
}

main().catch(console.error);
