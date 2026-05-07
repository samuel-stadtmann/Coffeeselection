export type QuizOption = {
  id: string;
  label: string;
  description?: string;
};

export type QuizQuestion = {
  step: number;
  slug: string;
  title: string;
  subtitle?: string;
  options: QuizOption[];
};

export const quizQuestions: QuizQuestion[] = [
  {
    step: 1,
    slug: "question-1-brewing-method",
    title: "Wie bereitest du deinen Kaffee zu?",
    subtitle: "Die Brühmethode bestimmt den passenden Mahlgrad und Röstungstyp.",
    options: [
      { id: "vollautomat", label: "Vollautomat", description: "Auf Knopfdruck ohne Aufwand" },
      { id: "siebtraeger", label: "Siebträger", description: "Espresso-Handwerk mit Druck" },
      { id: "v60-filter", label: "V60 / Filter", description: "Klarheit & Aroma im Pour Over" },
      { id: "french-press", label: "French Press", description: "Vollmundig, Stempel-Methode" },
      { id: "moka-pot", label: "Moka Pot", description: "Italienische Tradition" },
    ],
  },
  {
    step: 2,
    slug: "question-2-consumption-routine",
    title: "Wie oft trinkst du Kaffee?",
    subtitle: "Hilft uns, das passende Liefer-Intervall zu finden.",
    options: [
      { id: "1-cup", label: "1 Tasse pro Tag", description: "Genussvoll und bewusst" },
      { id: "2-3-cups", label: "2–3 Tassen pro Tag", description: "Der Klassiker" },
      { id: "4-plus", label: "4+ Tassen pro Tag", description: "Kaffee ist mein Lebenselixier" },
      { id: "occasional", label: "Nur am Wochenende", description: "Wenn Zeit für Genuss ist" },
    ],
  },
  {
    step: 3,
    slug: "question-3-milk-preference",
    title: "Mit oder ohne Milch?",
    subtitle: "Milch verändert die Aromen-Wahrnehmung deutlich.",
    options: [
      { id: "black", label: "Schwarz", description: "Pur, ohne Beigaben" },
      { id: "splash", label: "Schuss Milch", description: "Cortado-Stil" },
      { id: "latte", label: "Mit viel Milch", description: "Latte, Cappuccino, Flat White" },
      { id: "plant", label: "Pflanzenmilch", description: "Hafer, Mandel, Soja" },
      { id: "varies", label: "Variiert je nach Stimmung", description: "Mal so, mal so" },
    ],
  },
  {
    step: 4,
    slug: "question-4-breakfast-personality",
    title: "Wie startest du in den Morgen?",
    subtitle: "Dein Frühstücks-Stil verrät viel über dein Geschmacksprofil.",
    options: [
      { id: "sweet", label: "Süß & gemütlich", description: "Müsli, Pancakes, Brioche" },
      { id: "hearty", label: "Herzhaft & kräftig", description: "Eier, Bacon, Käse" },
      { id: "light", label: "Leicht & frisch", description: "Smoothie Bowl, Joghurt, Obst" },
      { id: "minimal", label: "Wenig & funktional", description: "Kaffee und vielleicht ein Croissant" },
    ],
  },
  {
    step: 5,
    slug: "question-5-chocolate-preference",
    title: "Welche Schokolade bevorzugst du?",
    subtitle: "Schokolade-Vorlieben korrelieren stark mit Kaffee-Präferenzen.",
    options: [
      { id: "milk", label: "Milchschokolade", description: "Cremig & süß" },
      { id: "dark-50", label: "Dunkle Schokolade 50–70%", description: "Ausgewogen" },
      { id: "dark-85", label: "Dunkle Schokolade 85%+", description: "Intensiv & herb" },
      { id: "white", label: "Weiße Schokolade", description: "Sahnig & mild" },
      { id: "fruity", label: "Mit Frucht-Einlage", description: "Beeren, Orange, Limette" },
    ],
  },
  {
    step: 6,
    slug: "question-6-drink-preference",
    title: "Was trinkst du am liebsten ausser Kaffee?",
    subtitle: "Andere Getränke-Vorlieben helfen unserem Algorithmus.",
    options: [
      { id: "wine", label: "Wein", description: "Rotwein, Weißwein, Champagner" },
      { id: "beer", label: "Bier", description: "Craft Beer, IPA, Pils" },
      { id: "spirits", label: "Spirituosen", description: "Whisky, Gin, Cognac" },
      { id: "tea", label: "Tee", description: "Schwarz-, Grün-, Kräutertee" },
      { id: "soft", label: "Erfrischungsgetränke", description: "Limonade, Saft, Wasser" },
    ],
  },
  {
    step: 7,
    slug: "question-7-aroma-trigger",
    title: "Welcher Duft spricht dich am meisten an?",
    subtitle: "Aromen-Wahrnehmung ist die Basis jedes Geschmacksprofils.",
    options: [
      { id: "berries", label: "Frische Beeren", description: "Erdbeere, Brombeere, Heidelbeere" },
      { id: "chocolate", label: "Schokolade & Karamell", description: "Süß & warm" },
      { id: "citrus", label: "Zitrus & Frische", description: "Limette, Bergamotte, Orange" },
      { id: "floral", label: "Blüten & Tee", description: "Jasmin, Rose, Lavendel" },
      { id: "spices", label: "Gewürze & Holz", description: "Zimt, Tabak, Zedernholz" },
    ],
  },
  {
    step: 8,
    slug: "question-8-tea-preference",
    title: "Welche Art Tee magst du?",
    subtitle: "Tee-Vorlieben zeigen deine Sensitivität für feine Aromen.",
    options: [
      { id: "black-tea", label: "Schwarztee", description: "Earl Grey, English Breakfast" },
      { id: "green-tea", label: "Grüntee", description: "Sencha, Matcha, Genmaicha" },
      { id: "herbal", label: "Kräutertee", description: "Pfefferminze, Kamille, Rooibos" },
      { id: "fruit", label: "Früchtetee", description: "Hagebutte, Hibiskus, Beeren" },
      { id: "no-tea", label: "Trinke ich selten", description: "Tee ist nicht meins" },
    ],
  },
  {
    step: 9,
    slug: "question-9-acidity-sensitivity",
    title: "Wie reagiert dein Magen auf Kaffee?",
    subtitle: "Wichtig für die Empfehlung der richtigen Röstung.",
    options: [
      { id: "no-issues", label: "Keine Probleme", description: "Mein Magen verträgt alles" },
      { id: "sometimes", label: "Manchmal empfindlich", description: "Bei zu starkem Kaffee" },
      { id: "often", label: "Oft empfindlich", description: "Brauche säurearme Sorten" },
      { id: "always", label: "Sehr empfindlich", description: "Ich vermeide säurereiche Kaffees" },
    ],
  },
  {
    step: 10,
    slug: "question-10-mouthfeel",
    title: "Welche Konsistenz magst du im Kaffee?",
    subtitle: "Mouthfeel ist der Körper deines Kaffees.",
    options: [
      { id: "tea-like", label: "Leicht & klar", description: "Wie schwarzer Tee" },
      { id: "balanced", label: "Mittlerer Körper", description: "Ausbalanciert" },
      { id: "creamy", label: "Cremig & rund", description: "Wie Vollmilch" },
      { id: "syrupy", label: "Dicht & sirupartig", description: "Espresso-Crema-Niveau" },
    ],
  },
  {
    step: 11,
    slug: "question-11-experience-level",
    title: "Wie erfahren bist du mit Specialty Coffee?",
    subtitle: "Das hilft uns, dir die passende Kaffee-Tiefe zu empfehlen.",
    options: [
      { id: "beginner", label: "Einsteiger", description: "Ich entdecke die Welt des Specialty Coffee" },
      { id: "casual", label: "Genießer", description: "Ich kenne mich aus, aber bin kein Experte" },
      { id: "enthusiast", label: "Enthusiast", description: "Ich kenne Röster, Mahlgrade, Origins" },
      { id: "expert", label: "Profi", description: "Ich Cuppe regelmäßig und verfolge SCA-Awards" },
    ],
  },
  {
    step: 12,
    slug: "question-12-openness",
    title: "Wie offen bist du für Neues?",
    subtitle: "Bestimmt, ob wir dir lieber Klassiker oder Entdeckungen empfehlen.",
    options: [
      { id: "comfort", label: "Lieber Verlässlich", description: "Ich bleibe bei dem, was mir schmeckt" },
      { id: "open", label: "Offen für Neues", description: "Mit Empfehlungen probiere ich gerne" },
      { id: "explorer", label: "Aktive Entdeckerin", description: "Ich liebe es, Neues zu probieren" },
      { id: "extreme", label: "Maximale Vielfalt", description: "Jede Lieferung soll überraschen" },
    ],
  },
];

export const totalQuizSteps = quizQuestions.length;
export const quizQuestionBySlug = (slug: string) => quizQuestions.find((q) => q.slug === slug);
export const nextQuizSlug = (current: string) => {
  const i = quizQuestions.findIndex((q) => q.slug === current);
  return i >= 0 && i < quizQuestions.length - 1 ? quizQuestions[i + 1].slug : null;
};
export const prevQuizSlug = (current: string) => {
  const i = quizQuestions.findIndex((q) => q.slug === current);
  return i > 0 ? quizQuestions[i - 1].slug : null;
};
