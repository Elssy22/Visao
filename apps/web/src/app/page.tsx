import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Si l'utilisateur est connecté, rediriger vers le dashboard
  if (user) {
    redirect('/dashboard')
  }

  // Sinon, afficher la landing page
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
              <span className="text-xl font-bold text-white">V</span>
            </div>
            <span className="text-xl font-bold text-white">Visao</span>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" className="text-white hover:text-white hover:bg-white/10" asChild>
              <Link href="/login">Connexion</Link>
            </Button>
            <Button asChild>
              <Link href="/register">Commencer gratuitement</Link>
            </Button>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <main className="container mx-auto px-4 py-20 lg:py-32">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl lg:text-6xl font-bold text-white mb-6">
            Veille mode & sneakers{' '}
            <span className="text-blue-400">en temps réel</span>
          </h1>
          <p className="text-lg lg:text-xl text-slate-300 mb-10 max-w-2xl mx-auto">
            Surveillez Twitter, Instagram et les blogs mode. Recevez des alertes instantanées
            et publiez rapidement sur vos réseaux sociaux.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="text-lg px-8" asChild>
              <Link href="/register">Créer un compte gratuit</Link>
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 text-white border-white/20 hover:bg-white/10" asChild>
              <Link href="/login">Se connecter</Link>
            </Button>
          </div>
        </div>

        {/* Features */}
        <div className="mt-32 grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <FeatureCard
            title="Multi-sources"
            description="Surveillez Twitter, Instagram, TikTok, RSS et sites web depuis une seule interface."
            icon="📡"
          />
          <FeatureCard
            title="Alertes instantanées"
            description="Recevez des notifications push dès qu'un nouveau contenu est détecté."
            icon="🔔"
          />
          <FeatureCard
            title="Publication rapide"
            description="Extrayez les médias et publiez sur X en un clic."
            icon="⚡"
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 border-t border-white/10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-slate-400 text-sm">
            © 2025 Visao. Tous droits réservés.
          </p>
          <div className="flex gap-6">
            <Link href="/terms" className="text-slate-400 hover:text-white text-sm">
              Conditions
            </Link>
            <Link href="/privacy" className="text-slate-400 hover:text-white text-sm">
              Confidentialité
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({
  title,
  description,
  icon,
}: {
  title: string
  description: string
  icon: string
}) {
  return (
    <div className="bg-white/5 backdrop-blur rounded-2xl p-6 border border-white/10">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
      <p className="text-slate-400">{description}</p>
    </div>
  )
}
