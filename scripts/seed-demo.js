import bcrypt from "bcryptjs";
import { execute, initSchema, queryOne } from "../lib/db.js";

await initSchema();

const DEMO_PASSWORD = "demo-not-used";
const passwordHash = bcrypt.hashSync(DEMO_PASSWORD, 10);

const DEMO_USERS = [
  {
    key: "anna",
    name: "Анна Королёва",
    instagram_username: "anna.lifestyle",
    email: "demo-anna@reelshub.demo",
    avatar_url: "https://i.pravatar.cc/150?img=5",
    role: "blogger",
  },
  {
    key: "masha",
    name: "Маша Путешественница",
    instagram_username: "masha.travel",
    email: "demo-masha@reelshub.demo",
    avatar_url: "https://i.pravatar.cc/150?img=9",
    role: "blogger",
  },
  {
    key: "admin",
    name: "Админ ReelsHub",
    instagram_username: "agency.admin",
    email: "demo-admin@reelshub.demo",
    avatar_url: "https://i.pravatar.cc/150?img=3",
    role: "admin",
  },
];

const DEMO_REELS = {
  anna: [
    {
      instagram_url: "https://www.instagram.com/reel/anna-demo-1/",
      cover_url: "https://picsum.photos/seed/anna-reel1/400/700",
      views: 124000,
      daysAgo: 2,
    },
    {
      instagram_url: "https://www.instagram.com/reel/anna-demo-2/",
      cover_url: "https://picsum.photos/seed/anna-reel2/400/700",
      views: 89000,
      daysAgo: 5,
    },
    {
      instagram_url: "https://www.instagram.com/reel/anna-demo-3/",
      cover_url: "https://picsum.photos/seed/anna-reel3/400/700",
      views: 56000,
      daysAgo: 8,
    },
    {
      instagram_url: "https://www.instagram.com/reel/anna-demo-4/",
      cover_url: "https://picsum.photos/seed/anna-reel4/400/700",
      views: 34200,
      daysAgo: 12,
    },
    {
      instagram_url: "https://www.instagram.com/reel/anna-demo-5/",
      cover_url: "https://picsum.photos/seed/anna-reel5/400/700",
      views: 187500,
      daysAgo: 16,
    },
  ],
  masha: [
    {
      instagram_url: "https://www.instagram.com/reel/masha-demo-1/",
      cover_url: "https://picsum.photos/seed/masha-reel1/400/700",
      views: 210000,
      daysAgo: 1,
    },
    {
      instagram_url: "https://www.instagram.com/reel/masha-demo-2/",
      cover_url: "https://picsum.photos/seed/masha-reel2/400/700",
      views: 156000,
      daysAgo: 4,
    },
    {
      instagram_url: "https://www.instagram.com/reel/masha-demo-3/",
      cover_url: "https://picsum.photos/seed/masha-reel3/400/700",
      views: 98000,
      daysAgo: 7,
    },
    {
      instagram_url: "https://www.instagram.com/reel/masha-demo-4/",
      cover_url: "https://picsum.photos/seed/masha-reel4/400/700",
      views: 72000,
      daysAgo: 11,
    },
    {
      instagram_url: "https://www.instagram.com/reel/masha-demo-5/",
      cover_url: "https://picsum.photos/seed/masha-reel5/400/700",
      views: 43000,
      daysAgo: 18,
    },
    {
      instagram_url: "https://www.instagram.com/reel/masha-demo-6/",
      cover_url: "https://picsum.photos/seed/masha-reel6/400/700",
      views: 275000,
      daysAgo: 21,
    },
  ],
};

function daysAgoIso(days) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
}

async function upsertDemoUser(user) {
  const existing = await queryOne(
    "SELECT id FROM bloggers WHERE instagram_username = $1 AND is_demo = TRUE",
    [user.instagram_username],
  );

  if (existing) {
    await execute(
      `UPDATE bloggers
       SET name = $1, email = $2, avatar_url = $3, role = $4, password_hash = $5
       WHERE id = $6`,
      [user.name, user.email, user.avatar_url, user.role, passwordHash, existing.id],
    );
    return existing.id;
  }

  const result = await execute(
    `INSERT INTO bloggers (name, instagram_username, email, password_hash, avatar_url, role, is_demo)
     VALUES ($1, $2, $3, $4, $5, $6, TRUE)
     RETURNING id`,
    [
      user.name,
      user.instagram_username,
      user.email,
      passwordHash,
      user.avatar_url,
      user.role,
    ],
  );

  return result.insertId;
}

async function seedReelsForBlogger(bloggerId, reels) {
  await execute("DELETE FROM reels WHERE blogger_id = $1", [bloggerId]);

  for (const reel of reels) {
    await execute(
      `INSERT INTO reels (blogger_id, instagram_url, cover_url, views, published_at, last_updated_at, status)
       VALUES ($1, $2, $3, $4, $5, NOW(), 'ok')`,
      [bloggerId, reel.instagram_url, reel.cover_url, reel.views, daysAgoIso(reel.daysAgo)],
    );
  }
}

console.log("Seeding demo data...");

const userIds = {};

for (const user of DEMO_USERS) {
  userIds[user.key] = await upsertDemoUser(user);
  console.log(`  ✓ ${user.name} (@${user.instagram_username})`);
}

await seedReelsForBlogger(userIds.anna, DEMO_REELS.anna);
console.log(`  ✓ ${DEMO_REELS.anna.length} reels for Anna`);

await seedReelsForBlogger(userIds.masha, DEMO_REELS.masha);
console.log(`  ✓ ${DEMO_REELS.masha.length} reels for Masha`);

console.log("Demo seed completed successfully.");

process.exit(0);
