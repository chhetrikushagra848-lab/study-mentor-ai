// SECTION: State & Memory Model
const state = {
    profile: {
      level: null,
      hoursPerDay: null,
      learningStyle: null,
    },
    goals: {
      shortTerm: null,
      longTerm: null,
      mainGoalLabel: null,
      examDate: null,
    },
    subjects: [], // { name, mastery (0-100), weakTopics: [], strongTopics: [] }
    todayPlan: [], // { id, topic, subject, difficulty, estimatedTime, status }
    revisions: [], // { id, topic, subject, cycleLabel, dueDate }
    reflections: [], // { id, topic, hardest, clearer, needsRevision, timestamp }
    streakDays: 0,
  };
  
  /* global Chart */
  let progressChart;
  
  // SECTION: Utilities
  function formatDateShort(date) {
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  }
  
  function getDayLabel(date) {
    return date.toLocaleDateString(undefined, { weekday: "short" });
  }
  
  function uid() {
    return Math.random().toString(36).slice(2, 9);
  }
  
  // SECTION: DOM References
  const todayPlanListEl = document.getElementById("today-plan-list");
  const todayPlanEmptyEl = document.getElementById("today-plan-empty");
  const revisionListEl = document.getElementById("revision-list");
  const revisionEmptyEl = document.getElementById("revision-empty");
  const reflectionListEl = document.getElementById("reflection-list");
  const reflectionEmptyEl = document.getElementById("reflection-empty");
  const chatStreamEl = document.getElementById("chat-stream");
  const chatFormEl = document.getElementById("chat-form");
  const chatInputEl = document.getElementById("chat-input");
  const quickActionButtons = document.querySelectorAll(".qa-btn");
  const calendarTimelineEl = document.getElementById("calendar-timeline");
  const performanceLegendEl = document.getElementById("performance-legend");
  
  const contextTodayFocusEl = document.getElementById("context-today-focus");
  const contextNextRevisionEl = document.getElementById("context-next-revision");
  const contextMainGoalEl = document.getElementById("context-main-goal");
  const contextProgressEl = document.getElementById("context-progress");
  
  const headerMainGoalEl = document.getElementById("header-main-goal");
  const headerStreakEl = document.getElementById("header-streak");
  
  const generateTodayPlanBtn = document.getElementById("generate-today-plan-btn");
  const startReflectionBtn = document.getElementById("start-reflection-btn");
  
  // SECTION: Rendering Functions
  function renderTodayPlan() {
    todayPlanListEl.innerHTML = "";
    if (!state.todayPlan.length) {
      todayPlanEmptyEl.style.display = "block";
      return;
    }
    todayPlanEmptyEl.style.display = "none";
  
    state.todayPlan.forEach((task) => {
      const li = document.createElement("li");
      li.className = "task-item";
  
      const main = document.createElement("div");
      main.className = "task-main";
  
      const title = document.createElement("p");
      title.className = "task-title";
      title.textContent = `${task.topic}`;
  
      const meta = document.createElement("p");
      meta.className = "task-meta";
      meta.textContent = `${task.subject} • ${task.estimatedTime} min • ${task.difficulty}`;
  
      main.appendChild(title);
      main.appendChild(meta);
  
      const controls = document.createElement("div");
      controls.className = "task-controls";
  
      const pill = document.createElement("span");
      pill.className = "task-pill";
      pill.textContent = task.status === "done" ? "Completed" : "Planned";
  
      const button = document.createElement("button");
      button.type = "button";
      button.className = "task-complete";
      if (task.status === "done") {
        button.classList.add("completed");
        button.textContent = "✓";
      } else {
        button.textContent = "";
      }
  
      button.addEventListener("click", () => {
        task.status = task.status === "done" ? "pending" : "done";
        if (task.status === "done") {
          state.streakDays = Math.max(state.streakDays, 1);
        }
        updateHeaderAndContext();
        renderTodayPlan();
        renderProgressChart();
      });
  
      controls.appendChild(pill);
      controls.appendChild(button);
  
      li.appendChild(main);
      li.appendChild(controls);
  
      todayPlanListEl.appendChild(li);
    });
  }
  
  function renderRevisions() {
    revisionListEl.innerHTML = "";
    if (!state.revisions.length) {
      revisionEmptyEl.style.display = "block";
      contextNextRevisionEl.textContent = "None scheduled";
      return;
    }
    revisionEmptyEl.style.display = "none";
  
    const sorted = [...state.revisions].sort(
      (a, b) => a.dueDate.getTime() - b.dueDate.getTime()
    );
  
    const next = sorted[0];
    contextNextRevisionEl.textContent = `${next.topic} (${formatDateShort(
      next.dueDate
    )})`;
  
    sorted.forEach((rev) => {
      const li = document.createElement("li");
      li.className = "revision-item";
  
      const main = document.createElement("div");
      main.className = "revision-main";
  
      const topic = document.createElement("span");
      topic.className = "revision-topic";
      topic.textContent = rev.topic;
  
      const cycle = document.createElement("span");
      cycle.className = "revision-cycle";
      cycle.textContent = `${rev.subject} • ${rev.cycleLabel}`;
  
      main.appendChild(topic);
      main.appendChild(cycle);
  
      const badge = document.createElement("span");
      badge.className = "revision-badge";
      badge.textContent = formatDateShort(rev.dueDate);
  
      li.appendChild(main);
      li.appendChild(badge);
  
      revisionListEl.appendChild(li);
    });
  }
  
  function renderReflections() {
    reflectionListEl.innerHTML = "";
    if (!state.reflections.length) {
      reflectionEmptyEl.style.display = "block";
      return;
    }
    reflectionEmptyEl.style.display = "none";
  
    state.reflections
      .slice()
      .reverse()
      .slice(0, 4)
      .forEach((r) => {
        const card = document.createElement("article");
        card.className = "reflection-card";
        card.innerHTML = `
          <div><strong>${r.topic}</strong> • ${new Date(
          r.timestamp
        ).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
          <div>Hardest: ${r.hardest}</div>
          <div>Clearer: ${r.clearer}</div>
          <div>Needs revision: ${r.needsRevision}</div>
        `;
        reflectionListEl.appendChild(card);
      });
  }
  
  function renderCalendar() {
    calendarTimelineEl.innerHTML = "";
    const today = new Date();
    for (let i = 0; i < 7; i += 1) {
      const d = new Date();
      d.setDate(today.getDate() + i);
  
      const dayEl = document.createElement("div");
      dayEl.className = "timeline-day";
      if (i === 0) {
        dayEl.classList.add("today");
      }
  
      const header = document.createElement("div");
      header.className = "timeline-day-header";
  
      const label = document.createElement("span");
      label.className = "timeline-day-label";
      label.textContent = getDayLabel(d);
  
      const dateEl = document.createElement("span");
      dateEl.className = "timeline-day-date";
      dateEl.textContent = d.getDate().toString();
  
      header.appendChild(label);
      header.appendChild(dateEl);
  
      const badges = document.createElement("div");
      badges.className = "timeline-badges";
  
      const hasPlan = state.todayPlan.length && i === 0;
      if (hasPlan) {
        const b = document.createElement("span");
        b.className = "timeline-badge";
        b.textContent = "Today plan";
        badges.appendChild(b);
      }
  
      const revisionsForDay = state.revisions.filter(
        (rev) =>
          rev.dueDate.getDate() === d.getDate() &&
          rev.dueDate.getMonth() === d.getMonth() &&
          rev.dueDate.getFullYear() === d.getFullYear()
      );
  
      revisionsForDay.forEach((rev) => {
        const b = document.createElement("span");
        b.className = "timeline-badge";
        b.textContent = `Rev: ${rev.topic}`;
        badges.appendChild(b);
      });
  
      dayEl.appendChild(header);
      dayEl.appendChild(badges);
  
      calendarTimelineEl.appendChild(dayEl);
    }
  }
  
  function renderProgressChart() {
    const ctx = document.getElementById("progress-chart");
    if (!ctx) return;
  
    // Simple seed data if no subjects yet
    if (!state.subjects.length) {
      state.subjects = [
        { name: "Math", mastery: 35 },
        { name: "Physics", mastery: 25 },
        { name: "Chemistry", mastery: 20 },
        { name: "Biology", mastery: 15 },
      ];
    }
  
    const labels = state.subjects.map((s) => s.name);
    const data = state.subjects.map((s) => s.mastery);
    const colors = ["#38bdf8", "#a855f7", "#22c55e", "#f97316", "#eab308"];
  
    if (progressChart) {
      progressChart.destroy();
    }
  
    progressChart = new Chart(ctx, {
      type: "radar",
      data: {
        labels,
        datasets: [
          {
            label: "Concept Mastery",
            data,
            backgroundColor: "rgba(56, 189, 248, 0.18)",
            borderColor: "#38bdf8",
            borderWidth: 2,
            pointBackgroundColor: "#38bdf8",
            pointRadius: 3,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
        },
        scales: {
          r: {
            beginAtZero: true,
            min: 0,
            max: 100,
            ticks: {
              display: false,
            },
            grid: {
              color: "rgba(148, 163, 184, 0.4)",
            },
            angleLines: {
              color: "rgba(148, 163, 184, 0.4)",
            },
            pointLabels: {
              color: "#cbd5f5",
              font: { size: 10 },
            },
          },
        },
      },
    });
  
    // Legend
    performanceLegendEl.innerHTML = "";
    state.subjects.forEach((s, index) => {
      const li = document.createElement("li");
      const label = document.createElement("div");
      label.className = "performance-label";
  
      const swatch = document.createElement("span");
      swatch.className = "performance-swatch";
      swatch.style.backgroundColor = colors[index % colors.length];
  
      const name = document.createElement("span");
      name.textContent = s.name;
  
      label.appendChild(swatch);
      label.appendChild(name);
  
      const value = document.createElement("span");
      value.textContent = `${s.mastery}%`;
  
      li.appendChild(label);
      li.appendChild(value);
  
      performanceLegendEl.appendChild(li);
    });
  
    const avg = data.reduce((sum, v) => sum + v, 0) / (data.length || 1);
    contextProgressEl.textContent = `${Math.round(avg)}% avg mastery`;
  }
  
  function updateHeaderAndContext() {
    headerMainGoalEl.textContent =
      state.goals.mainGoalLabel || "Set your target exam";
    contextMainGoalEl.textContent =
      state.goals.mainGoalLabel || "Define your main goal";
  
    headerStreakEl.textContent = `${state.streakDays} days`;
  
    if (state.todayPlan.length) {
      const uniqueTopics = [...new Set(state.todayPlan.map((t) => t.topic))];
      contextTodayFocusEl.textContent = uniqueTopics.slice(0, 2).join(", ");
    } else {
      contextTodayFocusEl.textContent = "Not set";
    }
  }
  
  // SECTION: Chat Helpers
  function addMessage(role, text) {
    const msg = document.createElement("div");
    msg.className = "chat-message";
  
    if (role === "mentor") {
      const avatar = document.createElement("div");
      avatar.className = "avatar";
      avatar.textContent = "AI";
      msg.appendChild(avatar);
    } else {
      msg.style.justifyContent = "flex-end";
    }
  
    const bubble = document.createElement("div");
    bubble.className =
      "chat-bubble " +
      (role === "mentor" ? "chat-bubble-mentor" : "chat-bubble-user");
    bubble.textContent = text;
  
    msg.appendChild(bubble);
  
    const meta = document.createElement("div");
    meta.className = "chat-meta";
    meta.textContent = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  
    const container = document.createElement("div");
    container.appendChild(msg);
    container.appendChild(meta);
  
    chatStreamEl.appendChild(container);
    chatStreamEl.scrollTop = chatStreamEl.scrollHeight;
  }
  
  function initialMentorMessage() {
    const intro =
      "I am your Study Mentor Brain System. I track your goals, build plans, schedule revisions, and help you reflect. " +
      "To start, tell me your main exam or goal, your academic level, and how many hours per day you can usually study.";
    addMessage("mentor", intro);
  }
  
  function handleQuickAction(action) {
    switch (action) {
      case "today-plan":
        generateSampleTodayPlan();
        addMessage(
          "mentor",
          "I have drafted a focused plan for today. You can mark tasks done as you progress."
        );
        break;
      case "log-session":
        askForSessionLog();
        break;
      case "weak-topics":
        addMessage(
          "mentor",
          "Let’s focus on weak areas. Tell me one subject and which topics feel shaky right now."
        );
        break;
      case "reflection":
        startReflectionFlow();
        break;
      case "adjust-plan":
        addMessage(
          "mentor",
          "We can adjust your plan. Share your upcoming exam date, weekly availability, and any topic that feels overloaded."
        );
        break;
      default:
        break;
    }
  }
  
  // SECTION: Sample Logic Generators
  function generateSampleTodayPlan() {
    state.todayPlan = [
      {
        id: uid(),
        topic: "Limits & Continuity",
        subject: "Math",
        difficulty: "Medium",
        estimatedTime: 60,
        status: "pending",
      },
      {
        id: uid(),
        topic: "Newton’s Laws conceptual questions",
        subject: "Physics",
        difficulty: "High",
        estimatedTime: 45,
        status: "pending",
      },
      {
        id: uid(),
        topic: "Biomolecules overview",
        subject: "Biology",
        difficulty: "Low",
        estimatedTime: 30,
        status: "pending",
      },
    ];
  
    // Seed revisions for one topic based on spaced repetition
    const base = new Date();
    const topic = "Limits & Continuity";
    const subject = "Math";
    const cycleOffsets = [1, 7, 21, 60];
    const cycleLabels = [
      "Day 1 • Quick recall",
      "Day 7 • Reinforcement",
      "Day 21 • Long-term",
      "Day 60 • Consolidation",
    ];
  
    state.revisions = cycleOffsets.map((offset, index) => {
      const d = new Date(base);
      d.setDate(d.getDate() + offset);
      return {
        id: uid(),
        topic,
        subject,
        cycleLabel: cycleLabels[index],
        dueDate: d,
      };
    });
  
    updateHeaderAndContext();
    renderTodayPlan();
    renderRevisions();
    renderCalendar();
  }
  
  function askForSessionLog() {
    const text =
      "Let’s log your latest study session. Reply with: \n" +
      "1) Subject & topic \n2) Duration \n3) Hardest idea \n4) What became clearer \n5) What still needs revision.";
    addMessage("mentor", text);
  }
  
  function startReflectionFlow() {
    const text =
      "Study Reflection: \n" +
      "1. Which topic did you study? \n" +
      "2. What was the hardest concept? \n" +
      "3. Which idea became clearer? \n" +
      "4. Which topic requires another revision?";
    addMessage("mentor", text);
  }
  
  // SECTION: Event Handlers
  chatFormEl.addEventListener("submit", (e) => {
    e.preventDefault();
    const value = chatInputEl.value.trim();
    if (!value) return;
  
    addMessage("user", value);
    chatInputEl.value = "";
  
    // Very lightweight intent handling demo
    const lower = value.toLowerCase();
    if (lower.includes("today") && lower.includes("plan")) {
      generateSampleTodayPlan();
      addMessage(
        "mentor",
        "Based on a generic STEM profile, I created a sample plan. We’ll personalize this once you share your subjects and exam."
      );
    } else if (lower.includes("reflection")) {
      startReflectionFlow();
    } else if (lower.includes("goal") || lower.includes("exam")) {
      state.goals.mainGoalLabel = value;
      updateHeaderAndContext();
      addMessage(
        "mentor",
        "Got it. I’ve locked this in as your current main goal. Next, tell me your academic level and daily study hours so I can size the plan."
      );
    } else if (lower.includes("hours") || lower.includes("per day")) {
      // Simple extraction for demo
      const numMatch = value.match(/(\d+)(?:\s*–|-\s*\d+)?/);
      if (numMatch) {
        state.profile.hoursPerDay = Number(numMatch[1]);
        headerMainGoalEl.textContent =
          state.goals.mainGoalLabel || "Main study goal set";
        addMessage(
          "mentor",
          "Great. I’ll assume an average of " +
            state.profile.hoursPerDay +
            " hours/day. We can refine this later."
        );
      } else {
        addMessage(
          "mentor",
          "I didn’t catch the number of hours clearly. Tell me something like ‘around 2–3 hours per day’."
        );
      }
    } else {
      addMessage(
        "mentor",
        "I’ve noted this. As we continue, I’ll update your memory, plans, and revision schedule around what you share."
      );
    }
  });
  
  quickActionButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const action = btn.getAttribute("data-action");
      handleQuickAction(action);
    });
  });
  
  generateTodayPlanBtn.addEventListener("click", () => {
    handleQuickAction("today-plan");
  });
  
  startReflectionBtn.addEventListener("click", () => {
    handleQuickAction("reflection");
  });
  
  // SECTION: Init
  window.addEventListener("DOMContentLoaded", () => {
    renderTodayPlan();
    renderRevisions();
    renderReflections();
    renderCalendar();
    renderProgressChart();
    updateHeaderAndContext();
    initialMentorMessage();
  });

const hamburger = document.getElementById('hamburger');
const headerMenu = document.getElementById('headerMenu');

hamburger.addEventListener('click', () => {
  if(headerMenu.style.display === 'flex') {
    headerMenu.style.display = 'none';
  } else {
    headerMenu.style.display = 'flex';
  }
});

  

const performanceLegendEl = document.getElementById("performance-legend");
// Remove renderProgressChart() calls if you want

// MOBILE HAMBURGER MENU TOGGLE
const hamburgerEl = document.getElementById("hamburger");
const headerMenuEl = document.querySelector(".header-meta");

hamburgerEl.addEventListener("click", () => {
  headerMenuEl.classList.toggle("active"); // toggles visibility
});
