const API_URL = "http://127.0.0.1:8000";

let currentMode = 'manual';

// State for dynamic lists
const state = {
    skills: [],
    experience: [],
    projects: [],
    education: [],
    achievements: []
};

const modeConfig = {
    manual: {
        title: "Manual Creation",
        desc: "Fill in the details yourself. Exact output.",
        show: ['manual-inputs']
    },
    guided: {
        title: "AI Assisted Creation",
        desc: "Provide rough notes/points for each section, and AI will rewrite and format them professionally.",
        show: ['manual-inputs']
    }
};

function switchMode(mode) {
    currentMode = mode;

    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.mode === mode);
    });

    document.getElementById('mode-title').textContent = modeConfig[mode].title;
    document.getElementById('mode-desc').textContent = modeConfig[mode].desc;

    // Show AI Context input ONLY in Guided ('guided') mode
    const contextContainer = document.getElementById('ai-context-container');
    if (contextContainer) {
        contextContainer.style.display = (mode === 'guided') ? 'block' : 'none';
    }

    // Trigger doc type change to ensure correct subsection is visible
    document.getElementById('doc-type').dispatchEvent(new Event('change'));

    document.getElementById('result-area').style.display = 'none';
}

// --- Doc Type Switching ---
// --- Doc Type Switching ---
document.getElementById('doc-type').addEventListener('change', function () {
    const type = this.value;
    const sections = ['inputs-resume', 'inputs-sop', 'inputs-letter', 'inputs-contract', 'inputs-report'];

    // Hide all first
    sections.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });

    // Show selected
    const activeId = `inputs-${type}`;
    const activeEl = document.getElementById(activeId);
    if (activeEl) activeEl.style.display = 'block';
});

// Initialize: trigger change to ensure correct inputs are shown based on default/browser-restored value
document.getElementById('doc-type').dispatchEvent(new Event('change'));

function renderList(id, items, renderer) {
    const list = document.getElementById(id);
    list.innerHTML = items.map((item, index) => `
        <div class="list-item">
            <div>${renderer(item)}</div>
            <div class="icon-btn-group">
                <button onclick="editItem('${id}', ${index})" class="btn-icon btn-edit"><i class="fa-solid fa-pen"></i></button>
                <button onclick="removeItem('${id}', ${index})" class="btn-icon btn-delete"><i class="fa-solid fa-trash"></i></button>
            </div>
        </div>
    `).join('');
}

function editItem(listId, index) {
    let item = null;
    if (listId === 'skills-list') {
        item = state.skills[index];
        document.getElementById('new-skill').value = item;
        state.skills.splice(index, 1);
    }
    if (listId === 'experience-list') {
        item = state.experience[index];
        document.getElementById('exp-title').value = item.title;
        document.getElementById('exp-company').value = item.company;
        document.getElementById('exp-period').value = item.period;
        document.getElementById('exp-bullets').value = (item.bullets || []).join('\n');
        state.experience.splice(index, 1);
    }
    if (listId === 'project-list') {
        item = state.projects[index];
        document.getElementById('proj-name').value = item.name;
        document.getElementById('proj-stack').value = item.tech_stack;
        document.getElementById('proj-desc').value = item.description;
        state.projects.splice(index, 1);
    }
    if (listId === 'edu-list') {
        item = state.education[index];
        document.getElementById('edu-degree').value = item.degree;
        document.getElementById('edu-institute').value = item.institute;
        document.getElementById('edu-year').value = item.year;
        document.getElementById('edu-grade').value = item.grade || '';
        state.education.splice(index, 1);
    }
    if (listId === 'ach-list') {
        item = state.achievements[index];
        document.getElementById('new-ach').value = item;
        state.achievements.splice(index, 1);
    }
    refreshLists();
}

function removeItem(listId, index) {
    if (listId === 'skills-list') state.skills.splice(index, 1);
    if (listId === 'experience-list') state.experience.splice(index, 1);
    if (listId === 'project-list') state.projects.splice(index, 1);
    if (listId === 'edu-list') state.education.splice(index, 1);
    if (listId === 'ach-list') state.achievements.splice(index, 1);
    refreshLists();
}

function refreshLists() {
    renderList('skills-list', state.skills, item => item);
    renderList('ach-list', state.achievements, item => item);
    renderList('experience-list', state.experience, item => `<strong>${item.title}</strong> at ${item.company}`);
    renderList('project-list', state.projects, item => `<strong>${item.name}</strong> (${item.tech_stack})`);
    renderList('edu-list', state.education, item => `<strong>${item.degree}</strong>, ${item.institute} ${item.grade ? `(Grade: ${item.grade})` : ''}`);
}

function addSkill() {
    const input = document.getElementById('new-skill');
    if (input.value.trim()) {
        state.skills.push(input.value.trim());
        input.value = '';
        refreshLists();
    }
}

function addAch() {
    const input = document.getElementById('new-ach');
    if (input.value.trim()) {
        state.achievements.push(input.value.trim());
        input.value = '';
        refreshLists();
    }
}

// --- Inline Add Logic ---

function addExp() {
    const title = document.getElementById('exp-title');
    const company = document.getElementById('exp-company');
    const period = document.getElementById('exp-period');
    const bullets = document.getElementById('exp-bullets');

    if (title.value.trim() && company.value.trim()) {
        state.experience.push({
            title: title.value.trim(),
            company: company.value.trim(),
            period: period.value.trim(),
            bullets: bullets.value.split('\n').filter(x => x.trim())
        });

        // Clear fields
        title.value = '';
        company.value = '';
        period.value = '';
        bullets.value = '';
        refreshLists();
    } else {
        alert("Job Title and Company are required.");
    }
}

function addProj() {
    const name = document.getElementById('proj-name');
    const stack = document.getElementById('proj-stack');
    const desc = document.getElementById('proj-desc');

    if (name.value.trim()) {
        state.projects.push({
            name: name.value.trim(),
            tech_stack: stack.value.trim(),
            description: desc.value.trim()
        });

        name.value = '';
        stack.value = '';
        desc.value = '';
        refreshLists();
    } else {
        alert("Project Name is required.");
    }
}

function addEdu() {
    const degree = document.getElementById('edu-degree');
    const institute = document.getElementById('edu-institute');
    const year = document.getElementById('edu-year');
    const grade = document.getElementById('edu-grade');

    if (degree.value.trim()) {
        state.education.push({
            degree: degree.value.trim(),
            institute: institute.value.trim(),
            year: year.value.trim(),
            grade: grade.value.trim()
        });

        degree.value = '';
        institute.value = '';
        year.value = '';
        grade.value = '';
        refreshLists();
    } else {
        alert("Degree is required.");
    }
}

// --- Generation ---

async function generateDocument() {
    const btn = document.querySelector('.generate-btn');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Generating...';
    btn.disabled = true;

    // Collect fields
    const baseFields = {
        name: document.getElementById('field-name').value,
        email: document.getElementById('field-email').value,
        phone: document.getElementById('field-phone').value,
        location: document.getElementById('field-location').value,
    };

    let payload = {
        doc_type: document.getElementById('doc-type').value,
        use_gemini: currentMode === 'guided',
        ai_context: currentMode === 'guided' ? document.getElementById('ai-context').value : null,
        fields: baseFields,
        return_docx: false
    };

    const docType = document.getElementById('doc-type').value;

    if (docType === 'resume') {
        payload.fields.summary = document.getElementById('field-summary').value;
        payload.fields.skills = state.skills;
        payload.fields.experience_list = state.experience;
        payload.fields.education = state.education;
        payload.fields.projects = state.projects;
        payload.fields.achievements = state.achievements;

    } else if (docType === 'sop') {
        payload.fields.applicant_name = baseFields.name;
        payload.fields.intro = document.getElementById('sop-intro').value;
        payload.fields.academic_background = document.getElementById('sop-academic').value;
        payload.fields.research_experience = document.getElementById('sop-research').value;
        payload.fields.why_program = document.getElementById('sop-why-program').value;
        payload.fields.career_goals = document.getElementById('sop-goals').value;
        payload.fields.conclusion = document.getElementById('sop-conclusion').value;

    } else if (docType === 'letter') {
        payload.fields.sender_name = document.getElementById('letter-sender-name').value;
        payload.fields.sender_address = document.getElementById('letter-sender-addr').value;
        payload.fields.receiver_name = document.getElementById('letter-receiver-name').value;
        payload.fields.receiver_address = document.getElementById('letter-receiver-addr').value;
        payload.fields.receiver_salutation = document.getElementById('letter-salutation').value;
        payload.fields.subject = document.getElementById('letter-subject').value;
        payload.fields.date = document.getElementById('letter-date').value;
        payload.fields.body = document.getElementById('letter-body').value;

    } else if (docType === 'contract') {
        payload.fields.party_a = document.getElementById('cont-party-a').value;
        payload.fields.party_b = document.getElementById('cont-party-b').value;
        payload.fields.date_a = document.getElementById('cont-date-a').value;
        payload.fields.date_b = document.getElementById('cont-date-b').value;
        payload.fields.scope = document.getElementById('cont-scope').value;
        payload.fields.responsibilities = document.getElementById('cont-resp').value;
        payload.fields.payment_terms = document.getElementById('cont-payment').value;
        payload.fields.confidentiality_clause = document.getElementById('cont-confidentiality').value;
        payload.fields.termination_clause = document.getElementById('cont-termination').value;

    } else if (docType === 'report') {
        payload.fields.title = document.getElementById('rep-title').value;
        payload.fields.author = document.getElementById('rep-author').value;
        payload.fields.date = document.getElementById('rep-date').value;
        payload.fields.executive_summary = document.getElementById('rep-summary').value;
        payload.fields.objectives = document.getElementById('rep-objectives').value;
        payload.fields.methodology = document.getElementById('rep-methodology').value;
        payload.fields.findings = document.getElementById('rep-findings').value;
        payload.fields.recommendations = document.getElementById('rep-recs').value;
        payload.fields.conclusion = document.getElementById('rep-conclusion').value;
    }

    try {
        const response = await fetch(`${API_URL}/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.detail || "Generation failed");
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);

        const pdfLink = document.getElementById('download-pdf');
        pdfLink.href = url;
        pdfLink.download = `${payload.doc_type}_${Date.now()}.pdf`;

        const docxLink = document.getElementById('download-docx');
        // Hack: The backend currently only returns one file blob.
        // The user has to choose one return format or we update API to return URLs.
        // For now, since user wants PDF mainly for preview, we show that.
        // If we want DOCX, we need to toggle 'return_docx' in payload.
        // For this demo, let's keep PDF as primary.

        document.getElementById('download-docx').style.display = 'none';
        document.getElementById('result-area').style.display = 'block';

    } catch (error) {
        alert("Error: " + error.message);
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}
