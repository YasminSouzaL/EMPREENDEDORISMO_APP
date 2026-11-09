import type { ReactNode } from 'react'

interface Props {
  eyebrow?: string
  title: string
  description?: string
  action?: ReactNode
}

export function PageHeading({ eyebrow, title, description, action }: Props) {
  return <header className="page-heading">
    <div>
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h1>{title}</h1>
      {description && <p className="page-description">{description}</p>}
    </div>
    {action}
  </header>
}
