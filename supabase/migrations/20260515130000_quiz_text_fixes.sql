-- Quiz-Texte: Umlaute + Kachel-Anpassungen aus User-Feedback.
--
-- Die vorige Migration 20260515120000 enthielt WHERE-Klauseln auf
-- 'question-N-...'-Slugs (Quelle: lib/quiz.ts), die DB nutzt aber
-- 'QN_*'-Codes — alle UPDATEs liefen ins Leere. Diese Migration setzt
-- die Werte korrekt anhand der echten DB-Codes.
--
-- Quellen:
--   * Optionen: vom User aus quiz_options gepasted
--   * Frage-Titel: folgen im Nachtrag, sobald quiz_questions Output da
--
-- Konventionen: Schweizer Orthografie (kein ß; weiss/ausser/heiss
-- bleiben). Nur klassische Umlaute ä/ö/ü und gezielte Tip-Fixes.

------------------------------------------------------------------------
-- Q1 brewing_method — Klammer-Texte aus Kacheln entfernt
------------------------------------------------------------------------

update quiz_options set text_de = 'Espressomaschine'
  where question_code = 'Q1_brewing_method' and answer_code = 'A_espresso';
update quiz_options set text_de = 'Filterkaffee'
  where question_code = 'Q1_brewing_method' and answer_code = 'B_filter';
-- Kachel 3 (French Press) und Kachel 5 (Mokkakanne) lassen wir nach
-- User-Direktive "Klammern entfernen" auch ohne Klammer-Hinweis:
update quiz_options set text_de = 'Vollautomat'
  where question_code = 'Q1_brewing_method' and answer_code = 'D_fully_auto';
update quiz_options set text_de = 'Mokkakanne'
  where question_code = 'Q1_brewing_method' and answer_code = 'E_mokka';

------------------------------------------------------------------------
-- Q2 consumption — Umlaute + "— als Ritual" entfernen
------------------------------------------------------------------------

update quiz_options set text_de = 'Nur morgens, einmal'
  where question_code = 'Q2_consumption' and answer_code = 'A_morning_ritual';
update quiz_options set text_de = 'Mehrmals täglich, über den Tag verteilt'
  where question_code = 'Q2_consumption' and answer_code = 'B_throughout_day';
update quiz_options set text_de = 'Nur am Wochenende, dafür mit Genuss & Zeit'
  where question_code = 'Q2_consumption' and answer_code = 'C_weekend';
-- Q2/D ohne Umlaut, unveraendert.

------------------------------------------------------------------------
-- Q3 milk_or_black — Kachel 3 Klammer entfernt
------------------------------------------------------------------------

update quiz_options set text_de = 'Cappuccino oder Latte'
  where question_code = 'Q3_milk_or_black' and answer_code = 'C_cappuccino';

------------------------------------------------------------------------
-- Q4 breakfast — Umlaute
------------------------------------------------------------------------

update quiz_options set text_de = 'Joghurt mit Honig, Nüssen & Granola'
  where question_code = 'Q4_breakfast' and answer_code = 'B_yogurt_honey';
update quiz_options set text_de = 'Bauernfrühstück mit Speck & Käse'
  where question_code = 'Q4_breakfast' and answer_code = 'C_farmer_breakfast';
update quiz_options set text_de = 'Einfach ein Stück dunkle Schokolade'
  where question_code = 'Q4_breakfast' and answer_code = 'F_dark_chocolate';

------------------------------------------------------------------------
-- Q5 chocolate — Klammer in Kachel 1 entfernt + Umlaute
------------------------------------------------------------------------

update quiz_options set text_de = 'Vollmilchschokolade'
  where question_code = 'Q5_chocolate' and answer_code = 'A_milk_chocolate';
update quiz_options set text_de = 'Schokolade mit Beerenfüllung oder fruchtig'
  where question_code = 'Q5_chocolate' and answer_code = 'D_berry_filled';

------------------------------------------------------------------------
-- Q6 drink — Wein-Beispiele auf "z.B. ...", " oder Cremant" weg, Umlaute
------------------------------------------------------------------------

update quiz_options set text_de = 'Junger Weisswein (z.B. Sauvignon Blanc)'
  where question_code = 'Q6_drink' and answer_code = 'A_white_wine';
update quiz_options set text_de = 'Kräftiger Rotwein (z.B. Cabernet)'
  where question_code = 'Q6_drink' and answer_code = 'B_strong_red';
update quiz_options set text_de = 'Glas Champagner'
  where question_code = 'Q6_drink' and answer_code = 'C_champagne';
update quiz_options set text_de = 'Naturwein oder etwas Ungewöhnliches'
  where question_code = 'Q6_drink' and answer_code = 'D_natural_wine';
update quiz_options set text_de = 'Süsslicher Cocktail oder Likör'
  where question_code = 'Q6_drink' and answer_code = 'F_sweet_cocktail';

------------------------------------------------------------------------
-- Q7 aroma — Kaminfeuer-Suffix entfernt, Kraeuter-Klammer entfernt,
-- Umlaute, Crème brûlée mit korrekten Akzenten
------------------------------------------------------------------------

update quiz_options set text_de = 'Kaminfeuer'
  where question_code = 'Q7_aroma' and answer_code = 'D_fireplace';
update quiz_options set text_de = 'Karamellisierter Zucker / Crème brûlée'
  where question_code = 'Q7_aroma' and answer_code = 'E_caramel';
update quiz_options set text_de = 'Frische Kräuter'
  where question_code = 'Q7_aroma' and answer_code = 'F_herbs';

------------------------------------------------------------------------
-- Q8 tea — Klammern entfernt + Umlaute
------------------------------------------------------------------------

update quiz_options set text_de = 'Schwarzer Tee, kräftig'
  where question_code = 'Q8_tea' and answer_code = 'A_strong_black';
update quiz_options set text_de = 'Grüner Tee oder Jasmintee'
  where question_code = 'Q8_tea' and answer_code = 'B_green_jasmine';
update quiz_options set text_de = 'Früchtetee'
  where question_code = 'Q8_tea' and answer_code = 'C_fruit_tea';
update quiz_options set text_de = 'Chai mit Gewürzen'
  where question_code = 'Q8_tea' and answer_code = 'E_chai_spices';

------------------------------------------------------------------------
-- Q9 citrus — Optionen ohne Umlauten, nichts zu aendern
-- (Frage-Titel "(Zitrone, Grapefruit)" entfernen folgt im quiz_questions-Block)
------------------------------------------------------------------------

------------------------------------------------------------------------
-- Q10 mouthfeel — Umlaute
------------------------------------------------------------------------

update quiz_options set text_de = 'Ausgewogen — nicht zu dünn, nicht zu dick'
  where question_code = 'Q10_mouthfeel' and answer_code = 'B_balanced';

------------------------------------------------------------------------
-- Q11 experience — Umlaute
------------------------------------------------------------------------

update quiz_options set text_de = 'Anfänger — ich trinke gerne Kaffee, weiss aber wenig darüber'
  where question_code = 'Q11_experience' and answer_code = 'A_beginner';
update quiz_options set text_de = 'Fortgeschritten — kenne Unterschiede zwischen Herkünften'
  where question_code = 'Q11_experience' and answer_code = 'B_advanced';
update quiz_options set text_de = 'Enthusiast — habe Equipment, lese darüber, gehe in Cafés'
  where question_code = 'Q11_experience' and answer_code = 'C_enthusiast';

------------------------------------------------------------------------
-- Q12 openness — Umlaute
------------------------------------------------------------------------

update quiz_options set text_de = 'Mir ist Konstanz wichtig — derselbe Kaffee, immer in guter Qualität'
  where question_code = 'Q12_openness' and answer_code = 'B_consistency';

------------------------------------------------------------------------
-- quiz_questions — wird nachgereicht, sobald die Frage-Titel als
-- Source vorliegen.
------------------------------------------------------------------------
