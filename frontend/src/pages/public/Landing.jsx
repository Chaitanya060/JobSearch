import { Link } from 'react-router-dom'
import {
  Search,
  Target,
  FileText,
  Bookmark,
  ClipboardList,
  Link2,
  UserPlus,
  Compass,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react'
import { ChevronDown } from 'lucide-react'
import { Button } from '../../components/ui/Button.jsx'
import { Card } from '../../components/ui/Card.jsx'
import { ContentContainer } from '../../components/layout/Page.jsx'
import {
  Reveal,
  StaggerContainer,
  StaggerItem,
  FadeIn,
  AmbientGradient,
  GlassSweep,
} from '../../components/motion/Motion.jsx'
import { JobCard } from '../../components/data-display/JobCard.jsx'
import { MOCK_JOBS } from '../../services/mock/jobs.js'
import { computeMatch } from '../../utils/match.js'

const STEPS = [
  { icon: UserPlus, title: 'Create your profile', desc: 'Add your skills, experience and preferences in a few minutes.' },
  { icon: Search, title: 'Discover jobs', desc: 'We aggregate roles from multiple permitted sources in one place.' },
  { icon: Target, title: 'Review matches', desc: 'See why each job fits — matched and missing skills, clearly explained.' },
  { icon: ClipboardList, title: 'Apply and track', desc: 'Prepare applications and track every one from saved to offer.' },
]

const FEATURES = [
  { icon: Search, title: 'Multi-source discovery', desc: 'Listings from feeds and employer career boards, normalized into one feed.' },
  { icon: Target, title: 'Skill & experience matching', desc: 'Transparent, rule-based match scores — never a fake hiring probability.' },
  { icon: FileText, title: 'Resume management', desc: 'Keep resumes private, pick a primary, use them when you apply.' },
  { icon: Bookmark, title: 'Saved jobs', desc: 'Bookmark roles and come back to them any time.' },
  { icon: ClipboardList, title: 'Application tracker', desc: 'Manual, honest status tracking from saved through to offer.' },
  { icon: Link2, title: 'Assisted apply', desc: 'We prepare your details and link you to the employer’s official page.' },
]

const previewJob = { ...MOCK_JOBS[0], match: computeMatch(MOCK_JOBS[0], { experienceYears: 1 }, { preferredSkills: ['Java', 'Spring Boot', 'SQL'] }) }

const FAQS = [
  ['Where do the jobs come from?', 'Listings are collected from supported public feeds and employer career boards, with the source shown on every job. We only name a provider once it is actually integrated.'],
  ['How does matching work?', 'A transparent, rule-based score compares your skills, experience and preferences against each role. It is a “Profile match”, not a prediction of being hired.'],
  ['Does JobPilot apply for me automatically?', 'No. JobPilot prepares your details and links you to the employer’s official application page. You review and submit — nothing is sent without your action.'],
  ['Is my data private?', 'Your resume and profile stay private to you, stored in private storage and never exposed through a public link. You control your information.'],
  ['How much does it cost?', 'The core experience is free to use. There are no fake trials or hidden placement fees.'],
]

export default function Landing() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <AmbientGradient />
        <ContentContainer className="relative z-10 py-16 sm:py-24">
          <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_1fr]">
            <div>
              <FadeIn>
                <span className="glass inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs text-muted">
                  <Compass className="h-3.5 w-3.5 text-primary" /> A clearer way to find your next role
                </span>
              </FadeIn>
              <FadeIn delay={0.06}>
                <h1 className="mt-5 text-4xl font-semibold leading-[1.08] tracking-tight text-text sm:text-5xl lg:text-6xl">
                  Your next opportunity, without the scattered search.
                </h1>
              </FadeIn>
              <FadeIn delay={0.12}>
                <p className="mt-5 max-w-md text-base text-muted sm:text-lg">
                  JobPilot brings roles from multiple sources into one place, explains how each one
                  fits your profile, and helps you prepare and track every application — honestly.
                </p>
              </FadeIn>
              <FadeIn delay={0.18}>
                <div className="mt-7 flex flex-wrap gap-3">
                  <Button as={Link} to="/register" size="lg">
                    Create your profile
                  </Button>
                  <Button as={Link} to="/jobs" variant="outline" size="lg">
                    Explore jobs
                  </Button>
                </div>
                <a href="#how-it-works" className="mt-4 inline-block text-sm text-muted hover:text-text">
                  See how it works →
                </a>
              </FadeIn>
            </div>

            <FadeIn delay={0.24}>
              {/* Illustrative product preview built from real components — not live data. */}
              <div className="glass relative overflow-hidden rounded-[22px] p-4">
                <GlassSweep />
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs font-medium text-muted">Illustrative example</span>
                  <span className="flex gap-1" aria-hidden>
                    <i className="h-2 w-2 rounded-full bg-error/60" />
                    <i className="h-2 w-2 rounded-full bg-warning/60" />
                    <i className="h-2 w-2 rounded-full bg-success/60" />
                  </span>
                </div>
                <JobCard job={previewJob} to="/jobs" />
                <div className="mt-3 grid grid-cols-3 gap-3">
                  {['Matched to you', 'From verified sources', 'Track to offer'].map((t) => (
                    <div key={t} className="rounded-xl bg-surface/70 p-3 text-center text-xs text-muted">
                      <CheckCircle2 className="mx-auto mb-1 h-4 w-4 text-success" />
                      {t}
                    </div>
                  ))}
                </div>
              </div>
            </FadeIn>
          </div>
        </ContentContainer>
      </section>

      {/* Trust / value strip */}
      <section className="border-y border-border bg-surface">
        <ContentContainer className="grid gap-6 py-8 sm:grid-cols-3">
          {[
            ['Multiple job sources', 'Feeds and employer boards, aggregated and attributed.'],
            ['Profile-based matches', 'Explained skill overlap and experience fit.'],
            ['Organized applications', 'Everything you’ve saved and applied to, in one tracker.'],
          ].map(([t, d]) => (
            <div key={t}>
              <p className="font-medium text-text">{t}</p>
              <p className="mt-1 text-sm text-muted">{d}</p>
            </div>
          ))}
        </ContentContainer>
      </section>

      {/* How it works */}
      <section id="how-it-works">
        <ContentContainer className="py-16">
          <Reveal>
            <h2 className="text-center text-2xl font-semibold text-text">How it works</h2>
          </Reveal>
          <StaggerContainer className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map(({ icon: Icon, title, desc }, i) => (
              <StaggerItem key={title}>
                <Card className="h-full p-5">
                  <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <p className="tabular text-xs text-muted">Step {i + 1}</p>
                  <h3 className="mt-1 font-semibold text-text">{title}</h3>
                  <p className="mt-1 text-sm text-muted">{desc}</p>
                </Card>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </ContentContainer>
      </section>

      {/* Feature grid */}
      <section id="features" className="bg-surface">
        <ContentContainer className="py-16">
          <Reveal>
            <h2 className="text-center text-2xl font-semibold text-text">Everything your search needs</h2>
          </Reveal>
          <StaggerContainer className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <StaggerItem key={title}>
                <Card className="h-full p-5">
                  <Icon className="h-5 w-5 text-primary" />
                  <h3 className="mt-3 font-semibold text-text">{title}</h3>
                  <p className="mt-1 text-sm text-muted">{desc}</p>
                </Card>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </ContentContainer>
      </section>

      {/* Source transparency */}
      <section>
        <ContentContainer className="py-16">
          <Reveal>
            <Card className="flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <h2 className="font-semibold text-text">Honest about our sources</h2>
                <p className="mt-1 text-sm text-muted">
                  Listings originate from external providers and employers, and every job shows its
                  source. Availability can change on the original site — we never claim a job is
                  guaranteed or that an application was submitted without confirmation.
                </p>
              </div>
            </Card>
          </Reveal>
        </ContentContainer>
      </section>

      {/* FAQ */}
      <section id="faq" className="bg-surface">
        <ContentContainer className="py-16">
          <Reveal>
            <h2 className="text-center text-2xl font-semibold text-text">Frequently asked questions</h2>
          </Reveal>
          <div className="mx-auto mt-8 max-w-2xl space-y-3">
            {FAQS.map(([q, a]) => (
              <Reveal key={q}>
                <details className="group rounded-[var(--radius-card)] border border-border bg-bg px-4 py-3 open:shadow-[var(--shadow-sm)]">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-medium text-text">
                    {q}
                    <ChevronDown className="h-4 w-4 shrink-0 text-muted transition-transform group-open:rotate-180" aria-hidden />
                  </summary>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{a}</p>
                </details>
              </Reveal>
            ))}
          </div>
        </ContentContainer>
      </section>

      {/* Final CTA */}
      <section className="border-t border-border bg-surface">
        <ContentContainer className="py-16 text-center">
          <Reveal>
            <h2 className="text-2xl font-semibold text-text">Start your organized job search</h2>
            <p className="mx-auto mt-2 max-w-md text-muted">
              Create a free account and bring every opportunity into one place.
            </p>
            <Button as={Link} to="/register" size="lg" className="mt-6">
              Create your account
            </Button>
          </Reveal>
        </ContentContainer>
      </section>
    </div>
  )
}
