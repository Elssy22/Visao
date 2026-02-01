import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Rss, Bell, Bookmark, TrendingUp } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  // Stats mockées pour l'instant (seront remplacées par des vraies données)
  const stats: Array<{
    name: string
    value: string
    icon: typeof Rss
    change: string
    changeType: 'positive' | 'negative' | 'neutral'
  }> = [
    {
      name: 'Sources actives',
      value: '0',
      icon: Rss,
      change: '+0%',
      changeType: 'neutral',
    },
    {
      name: 'Alertes aujourd\'hui',
      value: '0',
      icon: Bell,
      change: '+0%',
      changeType: 'neutral',
    },
    {
      name: 'Contenus sauvegardés',
      value: '0',
      icon: Bookmark,
      change: '+0%',
      changeType: 'neutral',
    },
    {
      name: 'Publications ce mois',
      value: '0',
      icon: TrendingUp,
      change: '+0%',
      changeType: 'neutral',
    },
  ]

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Bonjour, {user?.user_metadata?.name || 'utilisateur'} 👋
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Voici un aperçu de votre veille aujourd&apos;hui
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.name}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-500 dark:text-slate-400">
                {stat.name}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                <span
                  className={
                    stat.changeType === 'positive'
                      ? 'text-green-500'
                      : stat.changeType === 'negative'
                      ? 'text-red-500'
                      : 'text-slate-400'
                  }
                >
                  {stat.change}
                </span>{' '}
                vs hier
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent alerts + Quick actions */}
      <div className="grid gap-4 lg:grid-cols-7">
        {/* Recent alerts */}
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Alertes récentes</CardTitle>
            <CardDescription>
              Les dernières alertes de vos sources
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Bell className="h-12 w-12 text-slate-300 dark:text-slate-600 mb-4" />
              <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                Aucune alerte pour le moment
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm">
                Commencez par ajouter des sources pour recevoir des alertes en temps réel
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Quick actions */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Actions rapides</CardTitle>
            <CardDescription>
              Commencez votre veille
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <QuickAction
              title="Ajouter une source Twitter"
              description="Surveillez un compte Twitter"
              href="/sources/new?type=twitter"
              badge="Populaire"
            />
            <QuickAction
              title="Ajouter un flux RSS"
              description="Surveillez un blog ou site d'actualités"
              href="/sources/new?type=rss"
            />
            <QuickAction
              title="Inviter un membre"
              description="Collaborez avec votre équipe"
              href="/settings/team"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function QuickAction({
  title,
  description,
  href,
  badge,
}: {
  title: string
  description: string
  href: string
  badge?: string
}) {
  return (
    <a
      href={href}
      className="flex items-center justify-between p-4 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
    >
      <div>
        <div className="flex items-center gap-2">
          <h4 className="font-medium text-slate-900 dark:text-white">{title}</h4>
          {badge && (
            <Badge variant="secondary" className="text-xs">
              {badge}
            </Badge>
          )}
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400">{description}</p>
      </div>
      <svg
        className="h-5 w-5 text-slate-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 5l7 7-7 7"
        />
      </svg>
    </a>
  )
}
