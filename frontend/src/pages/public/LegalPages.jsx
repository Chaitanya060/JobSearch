import { ContentContainer } from '../../components/layout/Page.jsx'

function Prose({ title, intro, children }) {
  return (
    <ContentContainer className="py-12">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-semibold text-text">{title}</h1>
        <p className="mt-2 text-sm text-muted">{intro}</p>
        <div className="mt-6 space-y-4 text-sm leading-relaxed text-text [&_h2]:mt-6 [&_h2]:font-semibold">
          {children}
        </div>
      </div>
    </ContentContainer>
  )
}

export function Privacy() {
  return (
    <Prose title="Privacy policy" intro="How JobPilot handles your data. This is placeholder copy for the scaffold.">
      <h2>Your data</h2>
      <p>We store your profile, preferences, saved jobs, applications and resume files to provide the service. Resume files are kept in private storage and are never exposed through a public URL.</p>
      <h2>What we do not do</h2>
      <p>We do not sell your data. We do not submit applications on your behalf without your explicit action. We do not display your resume to other users or to admins by default.</p>
      <h2>Sources</h2>
      <p>Job listings originate from external providers and employers. Availability may change on the original source.</p>
    </Prose>
  )
}

export function Terms() {
  return (
    <Prose title="Terms of service" intro="Placeholder terms for the scaffold phase.">
      <h2>Use of the service</h2>
      <p>JobPilot aggregates and organizes job listings. It does not employ users and does not guarantee employment outcomes. A match score is a compatibility estimate, not a hiring probability.</p>
      <h2>Accounts</h2>
      <p>You are responsible for the accuracy of the information in your profile. Do not misrepresent your experience, skills or authorization to work.</p>
    </Prose>
  )
}

export function Contact() {
  return (
    <Prose title="Contact & support" intro="Reach the JobPilot team.">
      <p>This is a scaffold. A real contact form or support address will be added before public launch.</p>
      <p>For source or listing issues, use the report option on a job once the backend is connected.</p>
    </Prose>
  )
}
