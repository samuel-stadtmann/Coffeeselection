-- Quiz-Texte: Umlaute wiederherstellen.
--
-- Auf der Live-DB stehen Frage-Titel und Optionen-Labels mit ASCII-
-- Transliteration (ae/oe/ue/ss) statt mit echten Umlauten — z.B.
-- "Siebtraeger" statt "Siebträger". Diese Migration setzt fuer alle 12
-- Quiz-Fragen und ihre Optionen text_de zurueck auf die kanonische
-- Variante aus lib/quiz.ts. Idempotent: wo der Text schon korrekt ist,
-- ist das UPDATE ein No-Op.
--
-- Schema-Annahme: quiz_questions.question_code == slug ("question-1-...")
-- und quiz_options.answer_code == option-id ("siebtraeger"), wie in
-- lib/db/quiz.ts:160-181 referenziert.

------------------------------------------------------------------------
-- Frage-Titel
------------------------------------------------------------------------

update quiz_questions set text_de = 'Wie bereitest du deinen Kaffee zu?'        where question_code = 'question-1-brewing-method';
update quiz_questions set text_de = 'Wie oft trinkst du Kaffee?'                 where question_code = 'question-2-consumption-routine';
update quiz_questions set text_de = 'Mit oder ohne Milch?'                       where question_code = 'question-3-milk-preference';
update quiz_questions set text_de = 'Wie startest du in den Morgen?'             where question_code = 'question-4-breakfast-personality';
update quiz_questions set text_de = 'Welche Schokolade bevorzugst du?'           where question_code = 'question-5-chocolate-preference';
update quiz_questions set text_de = 'Was trinkst du am liebsten ausser Kaffee?'  where question_code = 'question-6-drink-preference';
update quiz_questions set text_de = 'Welcher Duft spricht dich am meisten an?'   where question_code = 'question-7-aroma-trigger';
update quiz_questions set text_de = 'Welche Art Tee magst du?'                   where question_code = 'question-8-tea-preference';
update quiz_questions set text_de = 'Wie reagiert dein Magen auf Kaffee?'        where question_code = 'question-9-acidity-sensitivity';
update quiz_questions set text_de = 'Welche Konsistenz magst du im Kaffee?'      where question_code = 'question-10-mouthfeel';
update quiz_questions set text_de = 'Wie erfahren bist du mit Specialty Coffee?' where question_code = 'question-11-experience-level';
update quiz_questions set text_de = 'Wie offen bist du für Neues?'               where question_code = 'question-12-openness';

------------------------------------------------------------------------
-- Antwort-Optionen (nur Eintraege auflisten, deren Label Umlaute hat —
-- den Rest setzt der Code unten via generischem UPDATE-Block ebenfalls
-- mit, damit die Tabelle deterministisch dem Source-Of-Truth entspricht.)
------------------------------------------------------------------------

-- Q1
update quiz_options set text_de = 'Vollautomat'   where question_code = 'question-1-brewing-method' and answer_code = 'vollautomat';
update quiz_options set text_de = 'Siebträger'    where question_code = 'question-1-brewing-method' and answer_code = 'siebtraeger';
update quiz_options set text_de = 'V60 / Filter'  where question_code = 'question-1-brewing-method' and answer_code = 'v60-filter';
update quiz_options set text_de = 'French Press'  where question_code = 'question-1-brewing-method' and answer_code = 'french-press';
update quiz_options set text_de = 'Moka Pot'      where question_code = 'question-1-brewing-method' and answer_code = 'moka-pot';

-- Q2
update quiz_options set text_de = '1 Tasse pro Tag'      where question_code = 'question-2-consumption-routine' and answer_code = '1-cup';
update quiz_options set text_de = '2–3 Tassen pro Tag'   where question_code = 'question-2-consumption-routine' and answer_code = '2-3-cups';
update quiz_options set text_de = '4+ Tassen pro Tag'    where question_code = 'question-2-consumption-routine' and answer_code = '4-plus';
update quiz_options set text_de = 'Nur am Wochenende'    where question_code = 'question-2-consumption-routine' and answer_code = 'occasional';

-- Q3
update quiz_options set text_de = 'Schwarz'                  where question_code = 'question-3-milk-preference' and answer_code = 'black';
update quiz_options set text_de = 'Schuss Milch'             where question_code = 'question-3-milk-preference' and answer_code = 'splash';
update quiz_options set text_de = 'Mit viel Milch'           where question_code = 'question-3-milk-preference' and answer_code = 'latte';
update quiz_options set text_de = 'Pflanzenmilch'            where question_code = 'question-3-milk-preference' and answer_code = 'plant';
update quiz_options set text_de = 'Variiert je nach Stimmung' where question_code = 'question-3-milk-preference' and answer_code = 'varies';

-- Q4
update quiz_options set text_de = 'Süß & gemütlich'      where question_code = 'question-4-breakfast-personality' and answer_code = 'sweet';
update quiz_options set text_de = 'Herzhaft & kräftig'   where question_code = 'question-4-breakfast-personality' and answer_code = 'hearty';
update quiz_options set text_de = 'Leicht & frisch'      where question_code = 'question-4-breakfast-personality' and answer_code = 'light';
update quiz_options set text_de = 'Wenig & funktional'   where question_code = 'question-4-breakfast-personality' and answer_code = 'minimal';

-- Q5
update quiz_options set text_de = 'Milchschokolade'             where question_code = 'question-5-chocolate-preference' and answer_code = 'milk';
update quiz_options set text_de = 'Dunkle Schokolade 50–70%'    where question_code = 'question-5-chocolate-preference' and answer_code = 'dark-50';
update quiz_options set text_de = 'Dunkle Schokolade 85%+'      where question_code = 'question-5-chocolate-preference' and answer_code = 'dark-85';
update quiz_options set text_de = 'Weiße Schokolade'            where question_code = 'question-5-chocolate-preference' and answer_code = 'white';
update quiz_options set text_de = 'Mit Frucht-Einlage'          where question_code = 'question-5-chocolate-preference' and answer_code = 'fruity';

-- Q6
update quiz_options set text_de = 'Wein'                  where question_code = 'question-6-drink-preference' and answer_code = 'wine';
update quiz_options set text_de = 'Bier'                  where question_code = 'question-6-drink-preference' and answer_code = 'beer';
update quiz_options set text_de = 'Spirituosen'           where question_code = 'question-6-drink-preference' and answer_code = 'spirits';
update quiz_options set text_de = 'Tee'                   where question_code = 'question-6-drink-preference' and answer_code = 'tea';
update quiz_options set text_de = 'Erfrischungsgetränke'  where question_code = 'question-6-drink-preference' and answer_code = 'soft';

-- Q7
update quiz_options set text_de = 'Frische Beeren'           where question_code = 'question-7-aroma-trigger' and answer_code = 'berries';
update quiz_options set text_de = 'Schokolade & Karamell'    where question_code = 'question-7-aroma-trigger' and answer_code = 'chocolate';
update quiz_options set text_de = 'Zitrus & Frische'         where question_code = 'question-7-aroma-trigger' and answer_code = 'citrus';
update quiz_options set text_de = 'Blüten & Tee'             where question_code = 'question-7-aroma-trigger' and answer_code = 'floral';
update quiz_options set text_de = 'Gewürze & Holz'           where question_code = 'question-7-aroma-trigger' and answer_code = 'spices';

-- Q8
update quiz_options set text_de = 'Schwarztee'        where question_code = 'question-8-tea-preference' and answer_code = 'black-tea';
update quiz_options set text_de = 'Grüntee'           where question_code = 'question-8-tea-preference' and answer_code = 'green-tea';
update quiz_options set text_de = 'Kräutertee'        where question_code = 'question-8-tea-preference' and answer_code = 'herbal';
update quiz_options set text_de = 'Früchtetee'        where question_code = 'question-8-tea-preference' and answer_code = 'fruit';
update quiz_options set text_de = 'Trinke ich selten' where question_code = 'question-8-tea-preference' and answer_code = 'no-tea';

-- Q9
update quiz_options set text_de = 'Keine Probleme'      where question_code = 'question-9-acidity-sensitivity' and answer_code = 'no-issues';
update quiz_options set text_de = 'Manchmal empfindlich' where question_code = 'question-9-acidity-sensitivity' and answer_code = 'sometimes';
update quiz_options set text_de = 'Oft empfindlich'     where question_code = 'question-9-acidity-sensitivity' and answer_code = 'often';
update quiz_options set text_de = 'Sehr empfindlich'    where question_code = 'question-9-acidity-sensitivity' and answer_code = 'always';

-- Q10
update quiz_options set text_de = 'Leicht & klar'         where question_code = 'question-10-mouthfeel' and answer_code = 'tea-like';
update quiz_options set text_de = 'Mittlerer Körper'      where question_code = 'question-10-mouthfeel' and answer_code = 'balanced';
update quiz_options set text_de = 'Cremig & rund'         where question_code = 'question-10-mouthfeel' and answer_code = 'creamy';
update quiz_options set text_de = 'Dicht & sirupartig'    where question_code = 'question-10-mouthfeel' and answer_code = 'syrupy';

-- Q11
update quiz_options set text_de = 'Einsteiger'   where question_code = 'question-11-experience-level' and answer_code = 'beginner';
update quiz_options set text_de = 'Genießer'     where question_code = 'question-11-experience-level' and answer_code = 'casual';
update quiz_options set text_de = 'Enthusiast'   where question_code = 'question-11-experience-level' and answer_code = 'enthusiast';
update quiz_options set text_de = 'Profi'        where question_code = 'question-11-experience-level' and answer_code = 'expert';

-- Q12
update quiz_options set text_de = 'Lieber Verlässlich' where question_code = 'question-12-openness' and answer_code = 'comfort';
update quiz_options set text_de = 'Offen für Neues'    where question_code = 'question-12-openness' and answer_code = 'open';
update quiz_options set text_de = 'Aktive Entdeckerin' where question_code = 'question-12-openness' and answer_code = 'explorer';
update quiz_options set text_de = 'Maximale Vielfalt'  where question_code = 'question-12-openness' and answer_code = 'extreme';
