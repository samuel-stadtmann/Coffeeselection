-- Quiz-Frage-Titel: Umlaute + Klammer-Entfernung (Q9).
--
-- Ergaenzt 20260515130000_quiz_text_fixes.sql um die Frage-Titel.
-- 6 von 12 Titeln brauchen Anpassung — die anderen 6 sind bereits
-- korrekt und werden nicht angefasst.

------------------------------------------------------------------------
-- Q1: haeufigsten -> häufigsten
------------------------------------------------------------------------
update quiz_questions
   set text_de = 'Wie bereitest du deinen Kaffee am häufigsten zu?'
 where question_code = 'Q1_brewing_method';

------------------------------------------------------------------------
-- Q4: Fruehstueck -> Frühstück
------------------------------------------------------------------------
update quiz_questions
   set text_de = 'Welches Frühstück passt am ehesten zu deinem Lieblings-Wochenendmorgen?'
 where question_code = 'Q4_breakfast';

------------------------------------------------------------------------
-- Q6: Getraenk -> Getränk
------------------------------------------------------------------------
update quiz_questions
   set text_de = 'Welches Getränk reizt dich bei einem Restaurantbesuch am meisten?'
 where question_code = 'Q6_drink';

------------------------------------------------------------------------
-- Q9: Klammer "(Zitrone, Grapefruit)" aus dem Titel entfernen
------------------------------------------------------------------------
update quiz_questions
   set text_de = 'Wenn du an einer Zitrusfrucht riechst — was empfindest du?'
 where question_code = 'Q9_citrus';

------------------------------------------------------------------------
-- Q10: Heissgetraenk + anfuehlen -> Heissgetränk + anfühlen
--     (Schweizer Orthografie: Heiss bleibt, nur ä/ü).
------------------------------------------------------------------------
update quiz_questions
   set text_de = 'Wenn du an dein Lieblings-Heissgetränk denkst — wie soll es sich im Mund anfühlen?'
 where question_code = 'Q10_mouthfeel';

------------------------------------------------------------------------
-- Q11: wuerdest + einschaetzen -> würdest + einschätzen
------------------------------------------------------------------------
update quiz_questions
   set text_de = 'Wie würdest du dein Kaffee-Wissen einschätzen?'
 where question_code = 'Q11_experience';

-- Q2, Q3, Q5, Q7, Q8, Q12 sind bereits korrekt — kein UPDATE.
