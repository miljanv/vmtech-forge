export const GENERATION_STEPS = [
  {
    key: "QUEUED",
    label: "Na čekanju",
    description: "Posao je kreiran i čeka slobodan izvršilac.",
  },
  {
    key: "SOURCE_CHECK",
    label: "Provera izvora",
    description: "Proveravamo URL-ove, robots.txt i bezbednost izvora.",
  },
  {
    key: "PAGE_COLLECTION",
    label: "Prikupljanje stranica",
    description: "Prikupljamo javne stranice i čistimo sadržaj.",
  },
  {
    key: "FACT_EXTRACTION",
    label: "Izdvajanje podataka",
    description: "Izvlačimo činjenice o firmi bez izmišljanja.",
  },
  {
    key: "IMAGE_DOWNLOAD",
    label: "Preuzimanje fotografija",
    description: "Preuzimamo i proveravamo logo, proizvode i galeriju.",
  },
  {
    key: "BRAND_ANALYSIS",
    label: "Analiza brenda",
    description: "Analiziramo vizuelni identitet i ton komunikacije.",
  },
  {
    key: "DESIGN_PLANNING",
    label: "Planiranje dizajna",
    description: "Biramo jedinstven vizuelni pravac i raspored sekcija.",
  },
  {
    key: "CONTENT_GENERATION",
    label: "Generisanje sadržaja",
    description: "Pišemo sadržaj sajta na osnovu proverenih činjenica.",
  },
  {
    key: "SITE_CREATION",
    label: "Kreiranje sajta",
    description: "Sastavljamo SiteSpec i povezujemo odobrene komponente.",
  },
  {
    key: "QUALITY_CHECK",
    label: "Provera kvaliteta",
    description: "Validiramo strukturu, kontrast, činjenice i jedinstvenost.",
  },
  {
    key: "READY",
    label: "Sajt je spreman",
    description: "Predlog sajta je spreman za pregled i prodajni kontakt.",
  },
] as const;

export type GenerationStepKey = (typeof GENERATION_STEPS)[number]["key"];
