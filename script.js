// Load environment variables from .env file
import dotenv from 'dotenv';
import { BskyAgent } from '@atproto/api';

dotenv.config();

async function main() {
  const agent = new BskyAgent({
    service: 'https://bsky.social'
  })
  await agent.login({
    identifier: process.env.BSKY_HANDLE,
    password: process.env.BSKY_PASSWORD,
  });

  const profile = await agent.getProfile({
    actor: process.env.BSKY_HANDLE,
  });

  console.log(profile.data);
}

main().catch(console.error);

