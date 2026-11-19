let QDATA = {};
let T = {};
let lang = "fr";
let profile = null;
let currentIndex = 0;
let answers = {};
let activeQuestions = [];

const $ = (s) => document.querySelector(s);
const t = (key) => (T[lang] && T[lang][key]) || key;

async function loadData() {
  const [q, tr] = await Promise.all([
    fetch("questionnaires.json").then(r => r.json()),
    fetch("translations.json").then(r => r.json())
  ]);
  QDATA = q; T = tr;
  setLanguage("fr");
}

function setLanguage(next) {
  lang = next;
  document.documentElement.lang = lang;
  document.querySelectorAll("[data-t]").forEach(el => {
    const key = el.dataset.t;
    if (T[lang][key]) el.textContent = T[lang][key];
  });
  document.querySelectorAll("[data-lang]").forEach(btn => {
    const active = btn.dataset.lang === lang;
    btn.classList.toggle("active", active);
    btn.setAttribute("aria-pressed", String(active));
  });
  if (profile) renderQuestion();
}

function getQuestionSet() {
  return QDATA[`${profile}_${lang}`] || [];
}

function isVisible(q) {
  if ([12,13].includes(q.number)) {
    const q11 = answers["11"];
    return profile === "user" && (String(q11 || "").startsWith("Oui") || String(q11 || "").startsWith("Sí"));
  }
  return true;
}

function updateVisibleQuestions() {
  activeQuestions = getQuestionSet().filter(isVisible);
  if (currentIndex >= activeQuestions.length) currentIndex = activeQuestions.length - 1;
  if (currentIndex < 0) currentIndex = 0;
}

function valueFor(q) {
  return answers[String(q.number)];
}

function isMultiple(type) {
  return /multiple|múltiple/i.test(type);
}
function isScale(type) {
  return /échelle|escala/i.test(type);
}
function isOpen(type) {
  return /libre|abierta/i.test(type);
}
function isSelect(type) {
  return /liste déroulante|lista desplegable/i.test(type);
}
function isPrice(q) { return q.number === 26 && profile === "user"; }

function priceOptions(country) {
  const all = getQuestionSet().find(q => q.number === 26).options;
  const countryName = country || "";
  const currencyRows = {
    "France": ["France :"],
    "Colombie": ["Colombie :"],
    "Pérou": ["Pérou :"],
    "Mexique": ["Mexique :"],
    "Francia": ["France :"],
    "Colombia": ["Colombie :"],
    "Perú": ["Pérou :"],
    "México": ["Mexique :"]
  };
  const prefix = currencyRows[countryName] || [];
  const fixed = all.filter(o => !/^(France|Colombie|Pérou|Mexique) :/.test(o));
  const local = prefix.length ? all.filter(o => o.startsWith(prefix[0])) : [];
  return [...fixed.slice(0,1), ...local, ...fixed.slice(1)];
}

function getOptions(q) {
  if (isPrice(q)) {
    const country = answers["1"];
    if (!country || /autre|other/i.test(country) || /prefiero no|préfère pas/i.test(country)) return priceOptions("");
    return priceOptions(country);
  }
  return q.options.filter(o => !/^Note d’intégration/.test(o));
}

function questionControl(q) {
  const type = q.type || "";
  const current = valueFor(q);
  const options = getOptions(q);
  const wrapper = document.createElement("div");
  wrapper.className = "answer-control";

  if (isOpen(type) || (options.length === 1 && /autre|otro/i.test(options[0]))) {
    const textarea = document.createElement("textarea");
    textarea.rows = 4;
    textarea.value = typeof current === "string" ? current : "";
    textarea.placeholder = lang === "fr" ? "Votre réponse…" : "Tu respuesta…";
    textarea.addEventListener("input", () => answers[q.number] = textarea.value);
    wrapper.appendChild(textarea);
    return wrapper;
  }

  if (isSelect(type)) {
    const select = document.createElement("select");
    select.innerHTML = `<option value="">${t("select")}</option>`;
    options.forEach(opt => {
      const option = document.createElement("option");
      option.value = opt; option.textContent = opt;
      if (current === opt) option.selected = true;
      select.appendChild(option);
    });
    select.addEventListener("change", () => {
      answers[q.number] = select.value;
      if (q.number === 1 && answers["26"]) delete answers["26"];
      refreshProgress();
    });
    wrapper.appendChild(select);
    if (q.number === 1) {
      const other = document.createElement("input");
      other.type = "text";
      other.className = "other-field";
      other.placeholder = lang === "fr" ? "Précisez le pays si nécessaire" : "Especifica el país si es necesario";
      other.value = answers["1_other"] || "";
      other.hidden = !/Autre|Otro/i.test(current || "");
      other.addEventListener("input", () => answers["1_other"] = other.value);
      select.addEventListener("change", () => other.hidden = !/Autre|Otro/i.test(select.value));
      wrapper.appendChild(other);
    }
    return wrapper;
  }

  if (isScale(type)) {
    const scale = document.createElement("div");
    scale.className = "scale-options";
    options.forEach(opt => {
      const match = opt.match(/^([1-5])/);
      if (!match) {
        const label = document.createElement("label");
        label.className = "choice-option";
        const input = document.createElement("input");
        input.type = "radio"; input.name = `q${q.number}`; input.value = opt;
        input.checked = current === opt;
        input.addEventListener("change", () => answers[q.number] = opt);
        label.append(input, document.createTextNode(opt));
        scale.appendChild(label);
        return;
      }
      const val = match[1];
      const label = document.createElement("label");
      label.className = "scale-option";
      const input = document.createElement("input");
      input.type = "radio"; input.name = `q${q.number}`; input.value = val;
      input.checked = current === val;
      input.addEventListener("change", () => answers[q.number] = val);
      label.append(input, document.createTextNode(val));
      scale.appendChild(label);
    });
    wrapper.appendChild(scale);
    const ends = document.createElement("div");
    ends.className = "scale-ends";
    ends.textContent = options.filter(o => /^[15]\s/.test(o)).join("   —   ");
    wrapper.appendChild(ends);
    return wrapper;
  }

  const multi = isMultiple(type) || /maximum 5|maximo 5/i.test(type);
  const list = document.createElement("div");
  list.className = "choice-list";
  options.forEach(opt => {
    const label = document.createElement("label");
    label.className = "choice-option";
    const input = document.createElement("input");
    input.type = multi ? "checkbox" : "radio";
    input.name = `q${q.number}`;
    input.value = opt;
    const saved = current || (multi ? [] : "");
    input.checked = multi ? Array.isArray(saved) && saved.includes(opt) : saved === opt;
    input.addEventListener("change", () => {
      if (multi) {
        let vals = Array.isArray(answers[q.number]) ? [...answers[q.number]] : [];
        if (input.checked) {
          if (vals.length >= 5 && /maximum 5|maximo 5/i.test(type)) {
            input.checked = false;
            alert(t("maxFive"));
            return;
          }
          vals.push(opt);
        } else vals = vals.filter(v => v !== opt);
        answers[q.number] = vals;
      } else answers[q.number] = opt;
      refreshProgress();
    });
    label.append(input, document.createTextNode(opt));
    list.appendChild(label);
  });
  wrapper.appendChild(list);

  if (options.some(o => /^(Autre|Otra|Otro)(\s|$)/i.test(o))) {
    const other = document.createElement("input");
    other.type = "text"; other.className = "other-field";
    other.placeholder = t("other");
    other.value = answers[`${q.number}_other`] || "";
    other.addEventListener("input", () => answers[`${q.number}_other`] = other.value);
    wrapper.appendChild(other);
  }
  return wrapper;
}

function renderQuestion() {
  updateVisibleQuestions();
  const q = activeQuestions[currentIndex];
  if (!q) return;
  $("#surveyKind").textContent = profile === "user" ? t("userKind") : t("proKind");
  $("#surveyTitle").textContent = profile === "user" ? t("userSurveyTitle") : t("proSurveyTitle");
  $("#surveyDescription").textContent = profile === "user" ? t("userSurveyDesc") : t("proSurveyDesc");
  const holder = $("#questions");
  holder.innerHTML = "";
  const card = document.createElement("section");
  card.className = "question-card";
  const heading = document.createElement("p");
  heading.className = "question-count";
  heading.textContent = `${t("question")} ${currentIndex + 1} ${t("of")} ${activeQuestions.length}`;
  const title = document.createElement("h3");
  title.textContent = q.label;
  card.append(heading, title);
  if (q.number === 23 && profile === "user") {
    const explainer = document.createElement("p");
    explainer.className = "neutral-description";
    explainer.textContent = lang === "fr"
      ? "KALY est un projet d’application qui permet de noter des situations associées au Food Noise, les pensées, les sensations corporelles, la faim, les émotions, les besoins et les actions. L’objectif est d’observer des tendances dans le temps, sans compter les calories ni poser de diagnostic, et de pouvoir partager une synthèse avec un professionnel de santé."
      : "KALY es un proyecto de aplicación que permite registrar situaciones relacionadas con el Food Noise, pensamientos, sensaciones corporales, hambre, emociones, necesidades y acciones. El objetivo es observar tendencias a lo largo del tiempo, sin contar calorías ni realizar diagnósticos, y poder compartir un resumen con un profesional de la salud.";
    card.appendChild(explainer);
  }
  card.appendChild(questionControl(q));
  holder.appendChild(card);
  $("#previousButton").disabled = currentIndex === 0;
  $("#nextButton").textContent = currentIndex === activeQuestions.length - 1 ? (lang === "fr" ? "Terminer" : "Finalizar") : t("next");
  refreshProgress();
}

function refreshProgress() {
  const total = activeQuestions.length || 1;
  const percent = Math.round(((currentIndex + 1) / total) * 100);
  $("#progressText").textContent = `${currentIndex + 1} / ${total}`;
  $("#progressPercent").textContent = `${percent} %`;
  $("#progressBar").style.width = `${percent}%`;
}

function hasAnswer(q) {
  const val = answers[q.number];
  if (Array.isArray(val)) return val.length > 0;
  return val !== undefined && val !== null && String(val).trim() !== "";
}

function startSurvey(which) {
  profile = which;
  currentIndex = 0; answers = {};
  activeQuestions = getQuestionSet();
  $("#choice").classList.add("hidden");
  $("#survey").classList.remove("hidden");
  renderQuestion();
  window.scrollTo({top: $("#survey").offsetTop - 30, behavior: "smooth"});
}

async function submitSurvey() {
  const nextButton = $("#nextButton");
  const previousButton = $("#previousButton");
  const message = $("#submitMessage");
  nextButton.disabled = true;
  previousButton.disabled = true;
  nextButton.textContent = lang === "fr" ? "Envoi…" : "Enviando…";
  message.classList.remove("hidden");
  message.textContent = t("sending");

  // Q12 et Q13 ne doivent pas être conservées si la condition d'affichage n'est plus remplie.
  const payloadAnswers = { ...answers };
  const q11 = String(payloadAnswers["11"] || "");
  if (!(q11.startsWith("Oui") || q11.startsWith("Sí"))) {
    delete payloadAnswers["12"];
    delete payloadAnswers["13"];
  }

  const country = String(payloadAnswers["1"] || "");
  const payload = {
    respondent_type: profile,
    language: lang,
    country: country && !/préfère ne pas|prefiero no/i.test(country) ? country : null,
    answers: payloadAnswers,
    schema_version: "V0.3"
  };

  try {
    const response = await fetch("/api/study-submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result.success) {
      throw new Error(result.error || "Submission failed");
    }
    $("#questions").innerHTML = `<div class="completion"><h3>${t("endTitle")}</h3><p>${t("endText")}</p></div>`;
    nextButton.classList.add("hidden");
    previousButton.classList.add("hidden");
    message.textContent = t("submitted");
    message.classList.remove("error");
  } catch (error) {
    console.error("KALY study submission error:", error);
    message.textContent = t("submitError");
    message.classList.add("error");
    nextButton.disabled = false;
    previousButton.disabled = false;
    nextButton.textContent = lang === "fr" ? "Réessayer" : "Reintentar";
  }
}

$("#changeProfile").addEventListener("click", () => {
  profile = null;
  $("#survey").classList.add("hidden");
  $("#choice").classList.remove("hidden");
});
document.querySelectorAll("[data-profile]").forEach(btn => btn.addEventListener("click", () => startSurvey(btn.dataset.profile)));
$("#previousButton").addEventListener("click", () => {
  if (currentIndex > 0) { currentIndex--; renderQuestion(); window.scrollTo({top: $("#survey").offsetTop - 20, behavior:"smooth"}); }
});
$("#nextButton").addEventListener("click", () => {
  const q = activeQuestions[currentIndex];
  $("#submitMessage").classList.add("hidden");
  if (currentIndex < activeQuestions.length - 1) {
    currentIndex++; renderQuestion();
    window.scrollTo({top: $("#survey").offsetTop - 20, behavior:"smooth"});
  } else {
    submitSurvey();
  }
});
document.querySelectorAll("[data-lang]").forEach(btn => btn.addEventListener("click", () => { if (!profile) setLanguage(btn.dataset.lang); }));
loadData().catch(() => {
  $("#intro").insertAdjacentHTML("beforeend", '<p class="error">Impossible de charger les questionnaires. Veuillez réessayer.</p>');
});
