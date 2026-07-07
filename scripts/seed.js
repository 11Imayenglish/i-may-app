// One-time seed script — populates a fresh Supabase project with the same
// sample content the original prototype shipped with.
//
// Usage:
//   SUPABASE_URL=https://xxx.supabase.co SUPABASE_SERVICE_ROLE_KEY=xxx node scripts/seed.js
//
// The service_role key bypasses RLS, so this must only ever run from a trusted
// machine/CI job — never ship it to the browser.

import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables first.");
  process.exit(1);
}

const supabase = createClient(url, serviceKey);

function daysAgoISO(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

const exercises = [
  {
    track: "civil", type: "grammar", title: "Present Perfect vs. Past Simple", level: "B1",
    date_added: daysAgoISO(0), instructions: "Elige la forma correcta para cada frase.", passage: "", min_words: null,
    questions: [
      { question: "I ___ this report since Monday.", options: ["wrote", "have written", "was writing", "write"], correctIndex: 1, explanation: "Acción que empezó en el pasado y continúa: Present Perfect." },
      { question: "She ___ the meeting yesterday at 9 a.m.", options: ["has attended", "attends", "attended", "was attend"], correctIndex: 2, explanation: "Tiempo específico en el pasado (\"yesterday\"): Past Simple." },
      { question: "___ you ever ___ to a client in English before?", options: ["Did / speak", "Have / spoken", "Do / speak", "Were / speaking"], correctIndex: 1, explanation: "Experiencia sin tiempo concreto: Present Perfect (\"ever\")." },
    ],
  },
  {
    track: "civil", type: "grammar", title: "Conditionals in Business Emails", level: "B2",
    date_added: daysAgoISO(3), instructions: "Selecciona la opción correcta en cada condicional.", passage: "", min_words: null,
    questions: [
      { question: "If we ___ the deadline, the client will be upset.", options: ["miss", "will miss", "missed", "would miss"], correctIndex: 0, explanation: "First conditional: if + present, will + infinitivo." },
      { question: "If I ___ you, I would renegotiate the contract.", options: ["am", "was", "were", "will be"], correctIndex: 2, explanation: "Second conditional: \"If I were you\" es la forma fija." },
    ],
  },
  {
    track: "civil", type: "listening", title: "Voicemail: Rescheduling a Meeting", level: "A2",
    date_added: daysAgoISO(1), instructions: "Escucha el mensaje y responde a las preguntas.",
    passage: "Hi, this is Claire from the marketing team. I'm calling about tomorrow's meeting. Something has come up and I won't be able to attend at ten. Could we move it to two in the afternoon instead? Please let me know if that works for you. Thanks, bye.",
    min_words: null,
    questions: [
      { question: "Who left the voicemail?", options: ["A client", "Claire from marketing", "The receptionist", "Her manager"], correctIndex: 1, explanation: "\"This is Claire from the marketing team.\"" },
      { question: "What time does she suggest instead?", options: ["Ten in the morning", "Twelve", "Two in the afternoon", "Four"], correctIndex: 2, explanation: "\"Could we move it to two in the afternoon instead?\"" },
    ],
  },
  {
    track: "civil", type: "reading", title: "Article: The Rise of Remote Work", level: "B1",
    date_added: daysAgoISO(2), instructions: "Lee el texto y responde a las preguntas.",
    passage: "Over the past decade, remote work has shifted from a rare perk to a standard practice at many companies. Employees report higher satisfaction when given flexibility over where they work, though managers sometimes worry about maintaining team culture from a distance. Many organizations now use a hybrid model, asking staff to come to the office two or three days a week while working from home the rest of the time.",
    min_words: null,
    questions: [
      { question: "According to the text, what do many companies use now?", options: ["A fully remote model", "A hybrid model", "A fully in-office model", "No fixed policy"], correctIndex: 1, explanation: "\"Many organizations now use a hybrid model.\"" },
      { question: "What do managers sometimes worry about?", options: ["Salaries", "Team culture", "Office rent", "Commute times"], correctIndex: 1, explanation: "\"Managers sometimes worry about maintaining team culture from a distance.\"" },
    ],
  },
  {
    track: "civil", type: "writing", title: "Email: Following Up After an Interview", level: "B2",
    date_added: daysAgoISO(0), instructions: "",
    passage: "Write a short follow-up email to a hiring manager one week after your interview. Thank them for their time, reaffirm your interest in the role, and politely ask about next steps.",
    min_words: 60, questions: [],
  },
  {
    track: "military", type: "grammar", title: "Imperatives in Field Orders", level: "A2",
    date_added: daysAgoISO(0), instructions: "Elige la forma correcta de la orden.", passage: "", min_words: null,
    questions: [
      { question: "___ to your positions immediately!", options: ["Moving", "Move", "Moved", "Will move"], correctIndex: 1, explanation: "Las órdenes directas usan el imperativo: verbo base sin sujeto." },
      { question: "Do not ___ until you receive the signal.", options: ["advancing", "advanced", "advance", "advances"], correctIndex: 2, explanation: "Imperativo negativo: \"Do not\" + verbo base." },
      { question: "The convoy ___ delayed due to weather conditions.", options: ["is", "are", "was being", "have"], correctIndex: 0, explanation: "\"Convoy\" es singular colectivo: concuerda con \"is\"." },
    ],
  },
  {
    track: "military", type: "grammar", title: "Passive Voice in Incident Reports", level: "B2",
    date_added: daysAgoISO(4), instructions: "Selecciona la forma pasiva correcta.", passage: "", min_words: null,
    questions: [
      { question: "The perimeter ___ secured at 0600 hours.", options: ["was", "is being", "has", "were"], correctIndex: 0, explanation: "Voz pasiva en pasado simple: \"was secured\"." },
      { question: "All personnel ___ briefed before the exercise begins.", options: ["must been", "must be", "must to be", "must has"], correctIndex: 1, explanation: "Modal + be + participio: \"must be briefed\"." },
    ],
  },
  {
    track: "military", type: "listening", title: "Radio Check: Call Sign Exchange", level: "A2",
    date_added: daysAgoISO(1), instructions: "Escucha el intercambio por radio y responde a las preguntas.",
    passage: "Alpha One, this is Bravo Two, radio check, over. Bravo Two, this is Alpha One, I read you loud and clear, over. Roger, Alpha One. Be advised, we are proceeding to checkpoint Charlie, estimated time of arrival, fifteen hundred hours, over. Copy that, Bravo Two, proceed to checkpoint Charlie, out.",
    min_words: null,
    questions: [
      { question: "What is Bravo Two's destination?", options: ["Checkpoint Alpha", "Checkpoint Bravo", "Checkpoint Charlie", "Base camp"], correctIndex: 2, explanation: "\"We are proceeding to checkpoint Charlie.\"" },
      { question: "What is the estimated time of arrival?", options: ["1300 hours", "1400 hours", "1500 hours", "1600 hours"], correctIndex: 2, explanation: "\"Estimated time of arrival, fifteen hundred hours.\"" },
    ],
  },
  {
    track: "military", type: "reading", title: "Article: The NATO Phonetic Alphabet in Practice", level: "B1",
    date_added: daysAgoISO(2), instructions: "Lee el texto y responde a las preguntas.",
    passage: "The NATO phonetic alphabet was designed to prevent confusion when letters are transmitted over radio or telephone, especially in noisy conditions. Each letter is assigned a code word, such as Alpha for A or Tango for T, chosen because it is difficult to mishear. Although it was originally developed for military communication, the system is now used widely by pilots, emergency services, and any professional who needs to spell words clearly under pressure.",
    min_words: null,
    questions: [
      { question: "Why was the NATO phonetic alphabet created?", options: ["To make radio messages shorter", "To prevent confusion between similar-sounding letters", "To replace written reports", "To translate foreign languages"], correctIndex: 1, explanation: "\"Designed to prevent confusion when letters are transmitted... in noisy conditions.\"" },
      { question: "Who else uses the system today, besides the military?", options: ["Only air traffic controllers", "Pilots and emergency services", "Only translators", "No one else"], correctIndex: 1, explanation: "\"Used widely by pilots, emergency services, and any professional...\"" },
    ],
  },
  {
    track: "military", type: "writing", title: "Incident Report: After-Action Summary", level: "B2",
    date_added: daysAgoISO(0), instructions: "",
    passage: "Write a short after-action report summarizing a routine training exercise. Include what the objective was, what happened, and one recommendation for next time. Use clear, factual language.",
    min_words: 70, questions: [],
  },
].map((e, i) => ({ ...e, sort_order: i * 1000 }));

const articles = [
  {
    track: "civil",
    title: "5 errores comunes al escribir emails en inglés",
    cover_image_url: "",
    excerpt: "Los fallos más frecuentes de nivel intermedio al redactar correos profesionales, y cómo corregirlos.",
    body:
      "Uno de los errores más comunes es empezar un email formal con \"Dear Sir/Madam\" cuando ya conoces el nombre del destinatario. Usa siempre el nombre si lo tienes: \"Dear Mr. Smith\" suena mucho más natural y profesional.\n\nOtro fallo frecuente es traducir literalmente \"asunto\" como \"asunto\" en el cuerpo del email en vez de usar el campo de subject. Recuerda que el subject debe ser breve y descriptivo, no una frase completa.\n\nPor último, muchos estudiantes olvidan la despedida adecuada según el nivel de formalidad: \"Best regards\" para un tono neutro, \"Kind regards\" para algo ligeramente más cercano, y \"Yours faithfully\" solo si no conoces el nombre del destinatario.",
    date_added: daysAgoISO(2),
  },
  {
    track: "military",
    title: "Cómo sonar natural en un radio check",
    cover_image_url: "",
    excerpt: "Las frases exactas que se usan en un intercambio de radio real, y por qué la precisión importa más que la fluidez.",
    body:
      "En comunicaciones por radio, la claridad importa más que la naturalidad. Frases como \"Say again\" (en vez de \"What did you say?\") y \"Roger\" (en vez de \"OK\") no son solo jerga: están diseñadas para minimizar la ambigüedad cuando la señal es mala.\n\nUna estructura típica es: identificación propia, identificación del receptor, mensaje, y palabra de procedimiento (\"over\" si esperas respuesta, \"out\" si terminas la conversación). Practicar esta estructura una y otra vez es más útil que aprender vocabulario suelto.",
    date_added: daysAgoISO(5),
  },
];

const materials = [
  {
    track: "civil",
    category: "grammar",
    kind: "theory",
    title: "Present Perfect vs. Past Simple — la regla en dos frases",
    body:
      "Usa Present Perfect cuando el momento exacto no importa o la acción sigue teniendo efecto ahora (\"I have lost my keys\"). Usa Past Simple cuando das o preguntas por un momento concreto en el pasado (\"I lost my keys yesterday\").",
    file_url: "",
    file_name: "",
    date_added: daysAgoISO(1),
  },
];

async function main() {
  const { error: exError } = await supabase.from("exercises").insert(exercises);
  if (exError) throw exError;
  console.log(`Inserted ${exercises.length} exercises.`);

  const { error: artError } = await supabase.from("articles").insert(articles);
  if (artError) throw artError;
  console.log(`Inserted ${articles.length} articles.`);

  const { error: matError } = await supabase.from("materials").insert(materials);
  if (matError) throw matError;
  console.log(`Inserted ${materials.length} materials.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
