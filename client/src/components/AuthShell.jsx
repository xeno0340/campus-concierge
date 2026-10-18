import PageTransition from './PageTransition.jsx'
import { Stagger, Item } from './motion.jsx'

export default function AuthShell({ title, subtitle, children, footer }) {
  return (
    <PageTransition>
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-6 sm:px-6 lg:min-h-[calc(100svh-4rem)] lg:grid-cols-2 lg:py-8">
        {/* Brand panel */}
        <aside
          className="relative hidden flex-col justify-between overflow-hidden rounded-3xl p-12 text-[#faf7f2] lg:flex"
          style={{
            backgroundColor: '#1e2a4a',
            backgroundImage:
              'radial-gradient(560px circle at 90% 8%, rgb(176 141 87 / 0.32), transparent 60%), radial-gradient(480px circle at 0% 100%, rgb(143 163 209 / 0.16), transparent 55%)',
          }}
        >
          <span className="text-sm tracking-[0.2em] text-[#c9a66b] uppercase">Smart Campus</span>
          <div>
            <p className="font-display text-5xl leading-[1.05] tracking-tight">
              Everything on campus,
              <br />
              <em className="text-[#d9b97f]">one calm place.</em>
            </p>
            <ul className="mt-8 space-y-3 text-[15px] text-[#faf7f2]/75">
              <li>Live availability for every room, lab and court</li>
              <li>Seats held fairly, with no double bookings</li>
              <li>Track every request from pending to confirmed</li>
            </ul>
          </div>
          <span className="text-sm text-[#faf7f2]/50">Campus Concierge</span>
        </aside>

        {/* Form */}
        <section className="flex items-center justify-center py-6 lg:px-10">
          <Stagger className="w-full max-w-md">
            <Item>
              <h1 className="font-display text-4xl tracking-tight text-ink sm:text-5xl">{title}</h1>
              <p className="mt-3 text-muted">{subtitle}</p>
            </Item>
            <Item className="mt-8">{children}</Item>
            <Item className="mt-6 text-sm text-muted">{footer}</Item>
          </Stagger>
        </section>
      </div>
    </PageTransition>
  )
}