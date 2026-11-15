package com.ex.grupoempr.empreendedorismo.learning;

import java.time.Instant;
import java.time.format.DateTimeParseException;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

/** Valida os registros pedagógicos antes da persistência. */
public final class LearningDomainValidator {
    private LearningDomainValidator() {}

    public static void validate(Map<String, Object> data, Map<String, Object> previous) {
        Map<String, Map<String, Object>> questions = indexed(data, "questions");
        Map<String, Map<String, Object>> results = indexed(data, "results");
        Map<String, Map<String, Object>> observations = indexed(data, "observations");
        Map<String, Map<String, Object>> oldQuestions = indexed(previous, "questions");
        Map<String, Map<String, Object>> oldResults = indexed(previous, "results");
        Set<String> usedQuestions = new HashSet<>();
        for (Map<String, Object> result : oldResults.values()) {
            if (result.get("questionId") instanceof String id) usedQuestions.add(id);
            String id = string(result, "id", 120);
            require(result.equals(results.get(id)), "Resultados salvos são imutáveis e não podem ser removidos.");
        }
        for (String id : usedQuestions) {
            require(oldQuestions.containsKey(id) && oldQuestions.get(id).equals(questions.get(id)),
                "Questões com resultados não podem ser alteradas ou removidas. Crie uma nova versão.");
        }
        for (Map<String, Object> question : questions.values()) {
            string(question, "courseId", 120);
            string(question, "content", 200);
            string(question, "skill", 200);
            string(question, "prompt", 10000);
            stringList(question, "tags", 30, 100);
            stringList(question, "prerequisites", 30, 200);
            String status = string(question, "status", 20);
            require(status.equals("draft") || status.equals("approved"), "Situação de questão inválida.");
            double min = number(question, "minSeconds", 0, 86400, false);
            double max = number(question, "maxSeconds", 0, 86400, false);
            require(max > min, "O tempo máximo deve superar o mínimo.");
            List<?> options = list(question, "options", 8);
            require(options.size() >= 2, "Informe de duas a oito alternativas.");
            String correctId = string(question, "correctOptionId", 120);
            Set<String> optionIds = new HashSet<>();
            for (Object value : options) {
                Map<String, Object> option = object(value);
                String optionId = string(option, "id", 120);
                require(optionIds.add(optionId), "Alternativas duplicadas.");
                string(option, "text", 5000);
                optionalString(option, "distractor", 2000);
            }
            require(optionIds.contains(correctId), "O gabarito deve apontar para uma alternativa existente.");
        }
        for (Map<String, Object> result : results.values()) {
            number(result, "studentId", 1, 9007199254740991D, true);
            String courseId = string(result, "courseId", 120);
            string(result, "classId", 120);
            string(result, "content", 200);
            string(result, "skill", 200);
            double total = number(result, "totalQuestions", 1, 10000, true);
            double correctAnswers = number(result, "correctAnswers", 0, total, true);
            number(result, "grade", 0, 10, false);
            number(result, "seconds", 0, 86400, false);
            bool(result, "extra");
            timestamp(result);
            if (result.containsKey("questionId")) {
                Map<String, Object> question = questions.get(string(result, "questionId", 120));
                require(question != null, "Questão inexistente.");
                require("approved".equals(question.get("status")), "A questão deve estar aprovada.");
                require(courseId.equals(question.get("courseId")), "A questão pertence a outra disciplina.");
                require(result.get("content").equals(question.get("content")) && result.get("skill").equals(question.get("skill")), "Conteúdo e habilidade devem corresponder à questão.");
                boolean correct = bool(result, "correct");
                if (result.containsKey("selectedOptionId")) {
                    String selected = string(result, "selectedOptionId", 120);
                    boolean exists = list(question, "options", 8).stream().map(LearningDomainValidator::object).anyMatch(option -> selected.equals(option.get("id")));
                    require(exists, "Alternativa selecionada inexistente.");
                    require(correct == selected.equals(question.get("correctOptionId")), "O acerto não corresponde à alternativa selecionada.");
                }
                require(total == 1 && correctAnswers == (correct ? 1 : 0), "Totais incompatíveis com a resposta detalhada.");
            } else {
                require(!result.containsKey("correct") && !result.containsKey("selectedOptionId"), "Registros agregados não podem atribuir respostas a alternativas.");
            }
        }
        for (Map<String, Object> observation : observations.values()) {
            string(observation, "courseId", 120);
            string(observation, "classId", 120);
            if (observation.containsKey("studentId")) number(observation, "studentId", 1, 9007199254740991D, true);
            String type = string(observation, "type", 20);
            require(type.equals("observation") || type.equals("incident"), "Tipo de registro inválido.");
            string(observation, "text", 5000);
            timestamp(observation);
        }
    }

    private static Map<String, Map<String, Object>> indexed(Map<String, Object> data, String key) {
        Map<String, Map<String, Object>> indexed = new HashMap<>();
        if (data == null || data.isEmpty()) return indexed;
        for (Object value : list(data, key, 100000)) {
            Map<String, Object> entry = object(value);
            require(indexed.putIfAbsent(string(entry, "id", 120), entry) == null, "Identificador duplicado em " + key + ".");
        }
        return indexed;
    }

    @SuppressWarnings("unchecked")
    private static Map<String, Object> object(Object value) {
        require(value instanceof Map<?, ?>, "Registro inválido.");
        Map<?, ?> map = (Map<?, ?>) value;
        require(map.keySet().stream().allMatch(key -> key instanceof String), "Campos inválidos.");
        return (Map<String, Object>) map;
    }

    private static List<?> list(Map<String, Object> value, String key, int maximum) {
        require(value.get(key) instanceof List<?>, "Lista inválida: " + key + ".");
        List<?> entries = (List<?>) value.get(key);
        require(entries.size() <= maximum, "Limite de itens excedido: " + key + ".");
        return entries;
    }

    private static String string(Map<String, Object> value, String key, int maximum) {
        require(value.get(key) instanceof String, "Texto inválido: " + key + ".");
        String text = (String) value.get(key);
        require(!text.isBlank() && text.length() <= maximum, "Tamanho de texto inválido: " + key + ".");
        return text;
    }

    private static void optionalString(Map<String, Object> value, String key, int maximum) {
        Object text = value.get(key);
        require(text instanceof String && ((String) text).length() <= maximum, "Texto inválido: " + key + ".");
    }

    private static void stringList(Map<String, Object> value, String key, int maximum, int textMaximum) {
        for (Object entry : list(value, key, maximum)) {
            require(entry instanceof String && !((String) entry).isBlank() && ((String) entry).length() <= textMaximum, "Item inválido em " + key + ".");
        }
    }

    private static double number(Map<String, Object> value, String key, double minimum, double maximum, boolean integer) {
        require(value.get(key) instanceof Number, "Número inválido: " + key + ".");
        double number = ((Number) value.get(key)).doubleValue();
        require(Double.isFinite(number) && number >= minimum && number <= maximum && (!integer || Math.rint(number) == number), "Número fora dos limites: " + key + ".");
        return number;
    }

    private static boolean bool(Map<String, Object> value, String key) {
        require(value.get(key) instanceof Boolean, "Valor lógico inválido: " + key + ".");
        return (Boolean) value.get(key);
    }

    private static void timestamp(Map<String, Object> value) {
        try {
            Instant instant = Instant.parse(string(value, "recordedAt", 64));
            require(!instant.isAfter(Instant.now().plusSeconds(300)), "A data do registro não pode estar no futuro.");
        } catch (DateTimeParseException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Data ISO inválida.");
        }
    }

    private static void require(boolean condition, String message) {
        if (!condition) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
    }
}
