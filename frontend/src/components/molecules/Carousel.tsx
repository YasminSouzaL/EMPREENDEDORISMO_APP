import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@atoms'

interface Slide {
  src: string
  alt: string
  caption: string
}

export function Carousel({ slides, label, eager = false }: { slides: Slide[]; label: string; eager?: boolean }) {
  const [active, setActive] = useState(0)
  const current = slides[active]
  const move = (offset: number) => setActive((index) => (index + offset + slides.length) % slides.length)

  return <section className="carousel" aria-label={label} aria-roledescription="carrossel">
    <img src={current.src} alt={current.alt} width="620" height="480" loading={eager ? 'eager' : 'lazy'} decoding="async" />
    <div className="carousel-bar">
      <p aria-live="polite"><span>{String(active + 1).padStart(2, '0')} / {String(slides.length).padStart(2, '0')}</span>{current.caption}</p>
      <div className="carousel-buttons">
        <Button aria-label="Imagem anterior" onClick={() => move(-1)}><ChevronLeft size={17} /></Button>
        <Button aria-label="Próxima imagem" onClick={() => move(1)}><ChevronRight size={17} /></Button>
      </div>
    </div>
  </section>
}
