/**
 * Bíblia — index de livros do cânon protestante (66) + fetcher de capítulo.
 * Fonte de texto: bible-api.com (Almeida Corrigida Fiel) — sem custo, sem rate limit duro,
 * com cache server-side de 1 ano (capítulos são imutáveis).
 */

export type Livro = {
  slug: string;
  nome: string;
  abreviacao: string;
  capitulos: number;
  testamento: "AT" | "NT";
};

export const LIVROS: Livro[] = [
  // Antigo Testamento
  { slug: "genesis", nome: "Gênesis", abreviacao: "Gn", capitulos: 50, testamento: "AT" },
  { slug: "exodo", nome: "Êxodo", abreviacao: "Êx", capitulos: 40, testamento: "AT" },
  { slug: "levitico", nome: "Levítico", abreviacao: "Lv", capitulos: 27, testamento: "AT" },
  { slug: "numeros", nome: "Números", abreviacao: "Nm", capitulos: 36, testamento: "AT" },
  { slug: "deuteronomio", nome: "Deuteronômio", abreviacao: "Dt", capitulos: 34, testamento: "AT" },
  { slug: "josue", nome: "Josué", abreviacao: "Js", capitulos: 24, testamento: "AT" },
  { slug: "juizes", nome: "Juízes", abreviacao: "Jz", capitulos: 21, testamento: "AT" },
  { slug: "rute", nome: "Rute", abreviacao: "Rt", capitulos: 4, testamento: "AT" },
  { slug: "1samuel", nome: "1 Samuel", abreviacao: "1Sm", capitulos: 31, testamento: "AT" },
  { slug: "2samuel", nome: "2 Samuel", abreviacao: "2Sm", capitulos: 24, testamento: "AT" },
  { slug: "1reis", nome: "1 Reis", abreviacao: "1Rs", capitulos: 22, testamento: "AT" },
  { slug: "2reis", nome: "2 Reis", abreviacao: "2Rs", capitulos: 25, testamento: "AT" },
  { slug: "1cronicas", nome: "1 Crônicas", abreviacao: "1Cr", capitulos: 29, testamento: "AT" },
  { slug: "2cronicas", nome: "2 Crônicas", abreviacao: "2Cr", capitulos: 36, testamento: "AT" },
  { slug: "esdras", nome: "Esdras", abreviacao: "Ed", capitulos: 10, testamento: "AT" },
  { slug: "neemias", nome: "Neemias", abreviacao: "Ne", capitulos: 13, testamento: "AT" },
  { slug: "ester", nome: "Ester", abreviacao: "Et", capitulos: 10, testamento: "AT" },
  { slug: "jo", nome: "Jó", abreviacao: "Jó", capitulos: 42, testamento: "AT" },
  { slug: "salmos", nome: "Salmos", abreviacao: "Sl", capitulos: 150, testamento: "AT" },
  { slug: "proverbios", nome: "Provérbios", abreviacao: "Pv", capitulos: 31, testamento: "AT" },
  { slug: "eclesiastes", nome: "Eclesiastes", abreviacao: "Ec", capitulos: 12, testamento: "AT" },
  { slug: "cantares", nome: "Cânticos", abreviacao: "Ct", capitulos: 8, testamento: "AT" },
  { slug: "isaias", nome: "Isaías", abreviacao: "Is", capitulos: 66, testamento: "AT" },
  { slug: "jeremias", nome: "Jeremias", abreviacao: "Jr", capitulos: 52, testamento: "AT" },
  { slug: "lamentacoes", nome: "Lamentações", abreviacao: "Lm", capitulos: 5, testamento: "AT" },
  { slug: "ezequiel", nome: "Ezequiel", abreviacao: "Ez", capitulos: 48, testamento: "AT" },
  { slug: "daniel", nome: "Daniel", abreviacao: "Dn", capitulos: 12, testamento: "AT" },
  { slug: "oseias", nome: "Oseias", abreviacao: "Os", capitulos: 14, testamento: "AT" },
  { slug: "joel", nome: "Joel", abreviacao: "Jl", capitulos: 3, testamento: "AT" },
  { slug: "amos", nome: "Amós", abreviacao: "Am", capitulos: 9, testamento: "AT" },
  { slug: "obadias", nome: "Obadias", abreviacao: "Ob", capitulos: 1, testamento: "AT" },
  { slug: "jonas", nome: "Jonas", abreviacao: "Jn", capitulos: 4, testamento: "AT" },
  { slug: "miqueias", nome: "Miqueias", abreviacao: "Mq", capitulos: 7, testamento: "AT" },
  { slug: "naum", nome: "Naum", abreviacao: "Na", capitulos: 3, testamento: "AT" },
  { slug: "habacuque", nome: "Habacuque", abreviacao: "Hc", capitulos: 3, testamento: "AT" },
  { slug: "sofonias", nome: "Sofonias", abreviacao: "Sf", capitulos: 3, testamento: "AT" },
  { slug: "ageu", nome: "Ageu", abreviacao: "Ag", capitulos: 2, testamento: "AT" },
  { slug: "zacarias", nome: "Zacarias", abreviacao: "Zc", capitulos: 14, testamento: "AT" },
  { slug: "malaquias", nome: "Malaquias", abreviacao: "Ml", capitulos: 4, testamento: "AT" },
  // Novo Testamento
  { slug: "mateus", nome: "Mateus", abreviacao: "Mt", capitulos: 28, testamento: "NT" },
  { slug: "marcos", nome: "Marcos", abreviacao: "Mc", capitulos: 16, testamento: "NT" },
  { slug: "lucas", nome: "Lucas", abreviacao: "Lc", capitulos: 24, testamento: "NT" },
  { slug: "joao", nome: "João", abreviacao: "Jo", capitulos: 21, testamento: "NT" },
  { slug: "atos", nome: "Atos", abreviacao: "At", capitulos: 28, testamento: "NT" },
  { slug: "romanos", nome: "Romanos", abreviacao: "Rm", capitulos: 16, testamento: "NT" },
  { slug: "1corintios", nome: "1 Coríntios", abreviacao: "1Co", capitulos: 16, testamento: "NT" },
  { slug: "2corintios", nome: "2 Coríntios", abreviacao: "2Co", capitulos: 13, testamento: "NT" },
  { slug: "galatas", nome: "Gálatas", abreviacao: "Gl", capitulos: 6, testamento: "NT" },
  { slug: "efesios", nome: "Efésios", abreviacao: "Ef", capitulos: 6, testamento: "NT" },
  { slug: "filipenses", nome: "Filipenses", abreviacao: "Fp", capitulos: 4, testamento: "NT" },
  { slug: "colossenses", nome: "Colossenses", abreviacao: "Cl", capitulos: 4, testamento: "NT" },
  { slug: "1tessalonicenses", nome: "1 Tessalonicenses", abreviacao: "1Ts", capitulos: 5, testamento: "NT" },
  { slug: "2tessalonicenses", nome: "2 Tessalonicenses", abreviacao: "2Ts", capitulos: 3, testamento: "NT" },
  { slug: "1timoteo", nome: "1 Timóteo", abreviacao: "1Tm", capitulos: 6, testamento: "NT" },
  { slug: "2timoteo", nome: "2 Timóteo", abreviacao: "2Tm", capitulos: 4, testamento: "NT" },
  { slug: "tito", nome: "Tito", abreviacao: "Tt", capitulos: 3, testamento: "NT" },
  { slug: "filemom", nome: "Filemom", abreviacao: "Fm", capitulos: 1, testamento: "NT" },
  { slug: "hebreus", nome: "Hebreus", abreviacao: "Hb", capitulos: 13, testamento: "NT" },
  { slug: "tiago", nome: "Tiago", abreviacao: "Tg", capitulos: 5, testamento: "NT" },
  { slug: "1pedro", nome: "1 Pedro", abreviacao: "1Pe", capitulos: 5, testamento: "NT" },
  { slug: "2pedro", nome: "2 Pedro", abreviacao: "2Pe", capitulos: 5, testamento: "NT" },
  { slug: "1joao", nome: "1 João", abreviacao: "1Jo", capitulos: 5, testamento: "NT" },
  { slug: "2joao", nome: "2 João", abreviacao: "2Jo", capitulos: 1, testamento: "NT" },
  { slug: "3joao", nome: "3 João", abreviacao: "3Jo", capitulos: 1, testamento: "NT" },
  { slug: "judas", nome: "Judas", abreviacao: "Jd", capitulos: 1, testamento: "NT" },
  { slug: "apocalipse", nome: "Apocalipse", abreviacao: "Ap", capitulos: 22, testamento: "NT" },
];

export function getLivro(slug: string): Livro | undefined {
  return LIVROS.find((l) => l.slug === slug);
}

// Mapeamento pro endpoint inglês de bible-api.com (Almeida está em pt)
const SLUG_PT_PARA_BIBLE_API: Record<string, string> = {
  genesis: "genesis",
  exodo: "exodus",
  levitico: "leviticus",
  numeros: "numbers",
  deuteronomio: "deuteronomy",
  josue: "joshua",
  juizes: "judges",
  rute: "ruth",
  "1samuel": "1 samuel",
  "2samuel": "2 samuel",
  "1reis": "1 kings",
  "2reis": "2 kings",
  "1cronicas": "1 chronicles",
  "2cronicas": "2 chronicles",
  esdras: "ezra",
  neemias: "nehemiah",
  ester: "esther",
  jo: "job",
  salmos: "psalms",
  proverbios: "proverbs",
  eclesiastes: "ecclesiastes",
  cantares: "song of solomon",
  isaias: "isaiah",
  jeremias: "jeremiah",
  lamentacoes: "lamentations",
  ezequiel: "ezekiel",
  daniel: "daniel",
  oseias: "hosea",
  joel: "joel",
  amos: "amos",
  obadias: "obadiah",
  jonas: "jonah",
  miqueias: "micah",
  naum: "nahum",
  habacuque: "habakkuk",
  sofonias: "zephaniah",
  ageu: "haggai",
  zacarias: "zechariah",
  malaquias: "malachi",
  mateus: "matthew",
  marcos: "mark",
  lucas: "luke",
  joao: "john",
  atos: "acts",
  romanos: "romans",
  "1corintios": "1 corinthians",
  "2corintios": "2 corinthians",
  galatas: "galatians",
  efesios: "ephesians",
  filipenses: "philippians",
  colossenses: "colossians",
  "1tessalonicenses": "1 thessalonians",
  "2tessalonicenses": "2 thessalonians",
  "1timoteo": "1 timothy",
  "2timoteo": "2 timothy",
  tito: "titus",
  filemom: "philemon",
  hebreus: "hebrews",
  tiago: "james",
  "1pedro": "1 peter",
  "2pedro": "2 peter",
  "1joao": "1 john",
  "2joao": "2 john",
  "3joao": "3 john",
  judas: "jude",
  apocalipse: "revelation",
};

export type CapituloTexto = {
  livro: Livro;
  capitulo: number;
  versiculos: { numero: number; texto: string }[];
  fonte: string;
};

export async function carregarCapitulo(
  slug: string,
  capitulo: number,
): Promise<CapituloTexto | null> {
  const livro = getLivro(slug);
  if (!livro) return null;
  if (capitulo < 1 || capitulo > livro.capitulos) return null;
  const enName = SLUG_PT_PARA_BIBLE_API[slug];
  if (!enName) return null;

  const url = `https://bible-api.com/${encodeURIComponent(`${enName} ${capitulo}`)}?translation=almeida`;
  try {
    const r = await fetch(url, {
      next: { revalidate: 60 * 60 * 24 * 365 },
    });
    if (!r.ok) return null;
    type ResponseAPI = {
      verses?: { verse: number; text: string }[];
      translation_name?: string;
    };
    const j = (await r.json()) as ResponseAPI;
    return {
      livro,
      capitulo,
      versiculos: (j.verses ?? []).map((v) => ({
        numero: v.verse,
        texto: v.text.trim(),
      })),
      fonte: j.translation_name ?? "João Ferreira de Almeida",
    };
  } catch {
    return null;
  }
}

// Versículos pra "verso do dia" — pool curado, rotaciona por dia do ano
export const VERSICULOS_POOL: { ref: string; texto: string; slug: string; cap: number; v: number }[] =
  [
    {
      ref: "Sl 23.1",
      texto: "O SENHOR é o meu pastor, nada me faltará.",
      slug: "salmos",
      cap: 23,
      v: 1,
    },
    {
      ref: "Jo 3.16",
      texto:
        "Porque Deus amou o mundo de tal maneira que deu o seu Filho unigênito, para que todo aquele que nele crê não pereça, mas tenha a vida eterna.",
      slug: "joao",
      cap: 3,
      v: 16,
    },
    {
      ref: "Fp 4.13",
      texto: "Posso todas as coisas naquele que me fortalece.",
      slug: "filipenses",
      cap: 4,
      v: 13,
    },
    {
      ref: "Pv 3.5",
      texto:
        "Confia no SENHOR de todo o teu coração, e não te estribes no teu próprio entendimento.",
      slug: "proverbios",
      cap: 3,
      v: 5,
    },
    {
      ref: "Is 41.10",
      texto:
        "Não temas, porque eu sou contigo; não te assombres, porque eu sou teu Deus; eu te esforço, e te ajudo, e te sustento com a destra da minha justiça.",
      slug: "isaias",
      cap: 41,
      v: 10,
    },
    {
      ref: "Rm 8.28",
      texto:
        "E sabemos que todas as coisas contribuem juntamente para o bem daqueles que amam a Deus, daqueles que são chamados segundo o seu propósito.",
      slug: "romanos",
      cap: 8,
      v: 28,
    },
    {
      ref: "Js 1.9",
      texto:
        "Não te mandei eu? Esforça-te, e tem bom ânimo; não pasmes, nem te espantes, porque o SENHOR teu Deus é contigo, por onde quer que andares.",
      slug: "josue",
      cap: 1,
      v: 9,
    },
    {
      ref: "Mt 11.28",
      texto:
        "Vinde a mim, todos os que estais cansados e oprimidos, e eu vos aliviarei.",
      slug: "mateus",
      cap: 11,
      v: 28,
    },
    {
      ref: "Sl 46.1",
      texto:
        "Deus é o nosso refúgio e fortaleza, socorro bem presente na angústia.",
      slug: "salmos",
      cap: 46,
      v: 1,
    },
    {
      ref: "Gl 2.20",
      texto:
        "Já estou crucificado com Cristo; e vivo, não mais eu, mas Cristo vive em mim.",
      slug: "galatas",
      cap: 2,
      v: 20,
    },
    {
      ref: "1Co 13.13",
      texto:
        "Agora, pois, permanecem a fé, a esperança e o amor, estes três, mas o maior destes é o amor.",
      slug: "1corintios",
      cap: 13,
      v: 13,
    },
    {
      ref: "Pv 16.3",
      texto:
        "Confia ao SENHOR as tuas obras, e teus pensamentos serão estabelecidos.",
      slug: "proverbios",
      cap: 16,
      v: 3,
    },
    {
      ref: "Jr 29.11",
      texto:
        "Porque eu bem sei os pensamentos que tenho a vosso respeito, diz o SENHOR; pensamentos de paz, e não de mal, para vos dar o fim que esperais.",
      slug: "jeremias",
      cap: 29,
      v: 11,
    },
    {
      ref: "Sl 119.105",
      texto:
        "Lâmpada para os meus pés é tua palavra, e luz para o meu caminho.",
      slug: "salmos",
      cap: 119,
      v: 105,
    },
  ];

export function versiculoDoDia(data = new Date()): (typeof VERSICULOS_POOL)[number] {
  const inicioAno = new Date(data.getFullYear(), 0, 0);
  const diasNoAno = Math.floor((data.getTime() - inicioAno.getTime()) / 86_400_000);
  return VERSICULOS_POOL[diasNoAno % VERSICULOS_POOL.length];
}
