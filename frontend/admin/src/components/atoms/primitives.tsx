import type { ComponentProps, ReactNode } from 'react'
import { Button as EvergreenButton, TextInput } from 'evergreen-ui'
import { Link } from 'react-router-dom'
import { Aperture } from 'lucide-react'

export function Button({ className = '', type = 'button', ...props }: ComponentProps<typeof EvergreenButton>) {
  return <EvergreenButton type={type} className={'ui-button ' + className} {...props} />
}

export function Status({ tone = 'neutral', children }: { tone?: 'green' | 'amber' | 'red' | 'neutral'; children: ReactNode }) {
  return <span className={'ui-status ui-status--' + tone}>{children}</span>
}

export function Brand({ to = '/', name = 'Portal Enigma', logo = '' }: { to?: string; name?: string; logo?: string }) {
  return <Link className="brand" to={to}>
    <span className="brand-mark">{logo ? <img src={logo} alt="" /> : <Aperture size={22} aria-hidden="true" />}</span>
    <span>{name}</span>
  </Link>
}

export function Avatar({ name }: { name: string }) {
  const initials = name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('')
  return <span className="avatar" aria-hidden="true">{initials}</span>
}

export function Field({ label, ...input }: ComponentProps<typeof TextInput> & { label: string }) {
  return <label className="field"><span>{label}</span><TextInput width="100%" {...input} /></label>
}
