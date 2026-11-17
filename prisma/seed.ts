import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Default Search Queries
  const queries = [
    {
      name: 'React Developers Needed',
      query: 'looking for a React developer',
      source: 'TWITTER' as const,
      category: 'Frontend Development',
      frequency: 'DAILY',
      maxResults: 25,
      isActive: true,
    },
    {
      name: 'Next.js SaaS MVP',
      query: 'need Next.js developer for SaaS',
      source: 'TWITTER' as const,
      category: 'SaaS Projects',
      frequency: 'DAILY',
      maxResults: 25,
      isActive: true,
    },
    {
      name: 'Python Automation Contracts',
      query: 'looking for Python developer automation',
      source: 'TWITTER' as const,
      category: 'Backend Development',
      frequency: 'DAILY',
      maxResults: 20,
      isActive: true,
    },
    {
      name: 'Software Agency Subcontracting',
      query: 'looking for software development agency',
      source: 'TWITTER' as const,
      category: 'Software Agencies',
      frequency: 'DAILY',
      maxResults: 15,
      isActive: true,
    },
    {
      name: 'AI Application Developers',
      query: 'looking for AI developer to build',
      source: 'TWITTER' as const,
      category: 'AI Projects',
      frequency: 'DAILY',
      maxResults: 20,
      isActive: true,
    },
  ];

  for (const q of queries) {
    await prisma.searchQuery.upsert({
      where: { id: `default-${q.category.toLowerCase().replace(/\s+/g, '-')}` },
      update: {},
      create: {
        id: `default-${q.category.toLowerCase().replace(/\s+/g, '-')}`,
        ...q,
      },
    });
  }

  console.log('✅ Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
