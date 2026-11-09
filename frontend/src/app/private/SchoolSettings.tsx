import { useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { Aperture } from 'lucide-react'
import { Button, Field } from '@atoms'
import { PageHeading } from '@molecules'
import { usePortal } from '@context'

export function SchoolSettings() {
  const { school, updateSchool } = usePortal()
  const [logo, setLogo] = useState(school?.logo ?? '')
  const [reading, setReading] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [error, setError] = useState('')
  if (!school) return null

  function readLogo(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0]
    event.currentTarget.value = ''
    if (!file) return
    setError('')
    setFeedback('')
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 512 * 1024) {
      setError('Escolha uma imagem PNG, JPG ou WebP de até 512 KB.')
      return
    }
    setReading(true)
    const reader = new FileReader()
    reader.onload = () => setLogo(String(reader.result))
    reader.onerror = () => setError('Não foi possível abrir a imagem.')
    reader.onloadend = () => setReading(false)
    reader.readAsDataURL(file)
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const name = String(data.get('name') ?? '').trim()
    const accent = String(data.get('accent') ?? '')
    setFeedback('')
    setError('')
    if (!name) { setError('Informe o nome da escola.'); return }
    try {
      updateSchool({ name, accent, logo })
      setFeedback('Identidade da escola atualizada.')
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Não foi possível salvar a identidade.')
    }
  }

  return <>
    <PageHeading eyebrow="Área de trabalho / Preferências" title="Identidade da escola" description="Defina como o nome, o logotipo e a cor da escola aparecem no portal." />
    <section className="portal-panel settings-panel">
      <form className="form-stack" onSubmit={submit}>
        <Field label="Nome de exibição" name="name" defaultValue={school.name} maxLength={80} required />
        <label className="field color-field"><span>Cor de destaque</span><input name="accent" type="color" defaultValue={school.accent} /></label>
        <div className="logo-settings">
          <div className="logo-preview">{logo ? <img src={logo} alt="Prévia do logotipo" /> : <Aperture size={28} aria-label="Logotipo padrão" />}</div>
          <label className="field"><span>Logotipo da escola</span><input type="file" accept="image/png,image/jpeg,image/webp" onChange={readLogo} disabled={reading} /><small>PNG, JPG ou WebP de até 512 KB.</small></label>
          {logo && <Button disabled={reading} onClick={() => { setLogo(''); setFeedback('') }}>Remover</Button>}
        </div>
        {error && <p className="form-error" role="alert">{error}</p>}
        {feedback && <p className="form-success" role="status">{feedback}</p>}
        <Button type="submit" className="button-primary" disabled={reading}>Salvar identidade</Button>
      </form>
    </section>
  </>
}
