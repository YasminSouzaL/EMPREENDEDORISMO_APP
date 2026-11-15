import { useEffect, useState } from 'react'
import { Button } from '@atoms'
import { getPublicQuestions, importPublicQuestions } from '@api/questionBank'
import type { PublicQuestion } from '@api/questionBank'
export function PublicQuestionBank({ token, courseId, onImported }: { token: string; courseId: string; onImported: () => void }) {
  const [items, setItems] = useState<PublicQuestion[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [pending, setPending] = useState(false)
  const [selected, setSelected] = useState<string[]>([])
  const [search, setSearch] = useState('')
  const [version, setVersion] = useState(0)
  useEffect(() => {
    const controller = new AbortController(); setLoading(true); setItems([]); setSelected([]); setError('')
    void getPublicQuestions(token, courseId, controller.signal).then((items) => { if (!controller.signal.aborted) setItems(items) }).catch(() => { if (!controller.signal.aborted) setError('Não foi possível consultar o banco público.') }).finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [token, courseId, version])
  async function importSelected() { setPending(true); setError(''); try { await importPublicQuestions(token, selected); setSelected([]); onImported() } catch { setError('Não foi possível importar. Confira sua conexão e seus vínculos.') } finally { setPending(false) } }
  return <section className="portal-panel grid gap-4"><h2>Acervo público · 500 questões</h2><p className="subtle">ENEM: 250 de matemática, 180 de linguagens e 70 de ciências. As questões entram como rascunho: revise conteúdo, habilidade e adequação ao 8º/9º ano antes de aprovar.</p>{loading && <p role="status">Consultando acervo…</p>}{error && <div role="alert"><p>{error}</p><Button onClick={() => setVersion((v) => v + 1)}>Tentar novamente</Button></div>}
    <label className="field"><span>Buscar no enunciado</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tema ou palavra-chave" /></label>
    <p>{items.length} questões nesta disciplina · {selected.length} selecionadas</p><Button disabled={!selected.length || pending} onClick={() => void importSelected()}>{pending ? 'Importando…' : 'Importar selecionadas (até 50)'}</Button>
    <div className="max-h-[32rem] overflow-auto grid gap-3">{items.filter((item) => item.prompt.toLocaleLowerCase('pt-BR').includes(search.toLocaleLowerCase('pt-BR'))).map((item) => <article className="border border-line rounded-[3px] p-3" key={item.id}><label className="check-row"><input type="checkbox" checked={selected.includes(item.id)} disabled={pending || (!selected.includes(item.id) && selected.length >= 50)} onChange={(event) => setSelected(event.target.checked ? [...selected, item.id] : selected.filter((id) => id !== item.id))} />{item.id} · {item.level}</label><details><summary>Ver enunciado e origem</summary><p className="whitespace-pre-wrap py-3">{item.prompt}</p>{item.images?.map((image) => <img key={image} src={image} className="max-w-full max-h-64 object-contain" alt="Imagem da questão original" loading="lazy" />)}<a href={item.source.url} target="_blank" rel="noreferrer">{item.source.provider} · {item.source.year}</a></details></article>)}</div>
  </section>
}
