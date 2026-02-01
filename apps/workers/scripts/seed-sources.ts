import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Sources RSS mode/sneakers populaires
const RSS_SOURCES = [
  {
    name: 'Sneaker News',
    url: 'https://sneakernews.com/feed/',
    type: 'RSS' as const,
  },
  {
    name: 'Hypebeast',
    url: 'https://hypebeast.com/feed',
    type: 'RSS' as const,
  },
  {
    name: 'Highsnobiety',
    url: 'https://www.highsnobiety.com/feed/',
    type: 'RSS' as const,
  },
  {
    name: 'Nice Kicks',
    url: 'https://www.nicekicks.com/feed/',
    type: 'RSS' as const,
  },
  {
    name: 'Sole Collector',
    url: 'https://solecollector.com/feed',
    type: 'RSS' as const,
  },
]

async function seedSources() {
  console.log('🌱 Seeding RSS sources...\n')

  // Récupérer la première organisation
  const { data: orgs, error: orgError } = await supabase
    .from('organizations')
    .select('id, name')
    .limit(1)

  if (orgError || !orgs || orgs.length === 0) {
    console.error('❌ Aucune organisation trouvée.')
    console.log('   Crée d\'abord un compte sur http://localhost:3000/register')
    process.exit(1)
  }

  const org = orgs[0]
  console.log(`📁 Organisation: ${org.name} (${org.id})\n`)

  // Ajouter les sources
  for (const source of RSS_SOURCES) {
    const { data, error } = await supabase
      .from('sources')
      .insert({
        name: source.name,
        url: source.url,
        type: source.type,
        organization_id: org.id,
        is_active: true,
        check_interval: 300, // 5 minutes
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        console.log(`⏭️  ${source.name} - déjà existant`)
      } else {
        console.error(`❌ ${source.name} - Erreur:`, error.message)
      }
    } else {
      console.log(`✅ ${source.name} - ajouté`)
    }
  }

  console.log('\n🎉 Sources ajoutées ! Les workers vont commencer à les monitorer.')
  console.log('   Vérifie le feed sur http://localhost:3000/feed')
}

seedSources().catch(console.error)
