"""Coleta reproduzível do banco público, sem gerar questões artificiais."""
import json
import re
import time
import urllib.request
from pathlib import Path
from datetime import datetime, timezone

ROOT = Path(__file__).resolve().parents[1]
TARGET = ROOT / 'backend/src/main/resources/questions/enem-500.json'
QUOTAS = {'matematica': 250, 'linguagens': 180, 'ciencias-natureza': 70}
COURSES = {'matematica': 'matematica', 'linguagens': 'portugues', 'ciencias-natureza': 'ciencias'}
questions = []
seen = set()
counts = dict.fromkeys(QUOTAS, 0)
for year in range(2023, 2008, -1):
    for offset in range(0, 200, 50):
        url = f'https://api.enem.dev/v1/exams/{year}/questions?limit=50&offset={offset}'
        request = urllib.request.Request(url, headers={'User-Agent': 'PortalEnigma/1.0 (educational question collection)'})
        for attempt in range(3):
            try:
                with urllib.request.urlopen(request, timeout=60) as response:
                    page = json.load(response)
                break
            except Exception:
                if attempt == 2:
                    raise
                time.sleep(5 * (attempt + 1))
        for item in page['questions']:
            area = item.get('discipline')
            if area not in QUOTAS or counts[area] >= QUOTAS[area] or item.get('language'):
                continue
            alternatives = item.get('alternatives') or []
            prompt = '\n\n'.join(filter(None, [item.get('context'), item.get('alternativesIntroduction')]))
            if not prompt or len(prompt) > 10000 or 'broken-image' in json.dumps(item) or len(alternatives) != 5:
                continue
            if item.get('correctAlternative') not in {entry['letter'] for entry in alternatives}:
                continue
            fingerprint = re.sub(r'\s+', ' ', prompt).strip()
            if fingerprint in seen:
                continue
            seen.add(fingerprint)
            images = list(dict.fromkeys((item.get('files') or []) + re.findall(r'!\[[^\]]*\]\((https://[^)]+)\)', prompt)))
            clean_prompt = re.sub(r'!\[[^\]]*\]\([^)]+\)', '[Imagem de apoio abaixo]', prompt)
            question = {
                'id': f'enem-{year}-{item["index"]}', 'courseId': COURSES[area],
                'content': f'ENEM · {area}', 'skill': 'Revisão pedagógica pendente',
                'tags': ['enem', str(year), area], 'prerequisites': [], 'prompt': clean_prompt,
                'options': [{'id': option['letter'].lower(), 'text': option.get('text') or 'Alternativa em imagem',
                             'image': option.get('file'), 'distractor': ''} for option in alternatives],
                'correctOptionId': item['correctAlternative'].lower(), 'minSeconds': 15, 'maxSeconds': 180,
                'status': 'draft', 'images': images, 'level': 'Ensino médio — ENEM',
                'source': {'provider': 'API ENEM / Inep', 'year': year, 'index': item['index'],
                           'url': f'https://api.enem.dev/v1/exams/{year}/questions/{item["index"]}',
                           'examUrl': 'https://www.gov.br/inep/pt-br/areas-de-atuacao/avaliacao-e-exames-educacionais/enem/provas-e-gabaritos',
                           'termsUrl': 'https://docs.enem.dev/introduction', 'license': 'GPL-2.0 (distribuição da API); origem pública declarada pelo provedor'},
            }
            questions.append(question)
            counts[area] += 1
        if sum(counts.values()) == 500:
            break
        time.sleep(1.1)
    print(year, counts, flush=True)
    if sum(counts.values()) == 500:
        break
if len(questions) != 500 or len({question['id'] for question in questions}) != 500:
    raise RuntimeError(f'Coleta incompleta: {counts}')
TARGET.parent.mkdir(parents=True, exist_ok=True)
TARGET.write_text(json.dumps({'collectedAt': datetime.now(timezone.utc).isoformat(), 'counts': counts, 'questions': questions}, ensure_ascii=False, indent=2), encoding='utf-8')
print(f'500 questões únicas salvas em {TARGET}')
