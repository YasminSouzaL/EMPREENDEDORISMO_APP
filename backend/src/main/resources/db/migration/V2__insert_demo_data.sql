INSERT INTO trilha (nome)
VALUES
    ('Lógica de programação com matemática'),
    ('Conceitos de português com algoritmos');

INSERT INTO pais (nome, email, senha)
VALUES (
    'Responsável de demonstração',
    'responsavel.demo@example.invalid',
    'disabled-' || gen_random_uuid()::TEXT
);

WITH alunos_demo (nome, matricula, turma, trilha_nome) AS (
    VALUES
        ('Ana Beatriz Oliveira', 'DEMO-0001', '6º ano A', 'Lógica de programação com matemática'),
        ('Bruno Henrique Souza', 'DEMO-0002', '6º ano B', 'Conceitos de português com algoritmos'),
        ('Camila Rodrigues Lima', 'DEMO-0003', '7º ano A', 'Lógica de programação com matemática'),
        ('Daniel Ferreira Costa', 'DEMO-0004', '7º ano B', 'Conceitos de português com algoritmos'),
        ('Eduarda Martins Alves', 'DEMO-0005', '8º ano A', 'Lógica de programação com matemática'),
        ('Felipe Gomes Ribeiro', 'DEMO-0006', '8º ano B', 'Conceitos de português com algoritmos'),
        ('Gabriela Carvalho Santos', 'DEMO-0007', '9º ano A', 'Lógica de programação com matemática'),
        ('Heitor Barbosa Mendes', 'DEMO-0008', '9º ano B', 'Conceitos de português com algoritmos'),
        ('Isabela Nunes Rocha', 'DEMO-0009', '1ª série A', 'Lógica de programação com matemática'),
        ('João Pedro Cardoso', 'DEMO-0010', '1ª série B', 'Conceitos de português com algoritmos'),
        ('Larissa Teixeira Dias', 'DEMO-0011', '2ª série A', 'Lógica de programação com matemática'),
        ('Mateus Correia Freitas', 'DEMO-0012', '2ª série B', 'Conceitos de português com algoritmos'),
        ('Nicole Araújo Pinto', 'DEMO-0013', '3ª série A', 'Lógica de programação com matemática'),
        ('Otávio Moreira Castro', 'DEMO-0014', '3ª série B', 'Conceitos de português com algoritmos'),
        ('Paula Mendes Farias', 'DEMO-0015', '1º ano A', 'Lógica de programação com matemática'),
        ('Rafael Pires Monteiro', 'DEMO-0016', '2º ano B', 'Conceitos de português com algoritmos'),
        ('Sofia Batista Campos', 'DEMO-0017', '3º ano A', 'Lógica de programação com matemática'),
        ('Theo Gonçalves Reis', 'DEMO-0018', '4º ano B', 'Conceitos de português com algoritmos'),
        ('Valentina Lopes Machado', 'DEMO-0019', '5º ano A', 'Lógica de programação com matemática'),
        ('William Duarte Azevedo', 'DEMO-0020', '5º ano B', 'Conceitos de português com algoritmos')
)
INSERT INTO aluno (nome, matricula, turma, trilha_id, pontos, senha, pais_id)
SELECT
    alunos_demo.nome,
    alunos_demo.matricula,
    alunos_demo.turma,
    trilha.id,
    0,
    'disabled-' || gen_random_uuid()::TEXT,
    pais.id
FROM alunos_demo
JOIN trilha ON trilha.nome = alunos_demo.trilha_nome
CROSS JOIN pais
WHERE pais.email = 'responsavel.demo@example.invalid';
