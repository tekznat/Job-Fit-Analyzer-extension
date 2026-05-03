let lastAnalyzedText = '';

// Wait for the page to load
function init() {
    // Inject UI on any page matched by manifest.json
    injectUI();
}

function extractJobDescription() {
    const selectors = [
        '#job-details', '.jobs-search__job-details--container', '.jobs-description', // LinkedIn
        '#jobsearch-ViewJobLayout-jobDisplay', '.jobsearch-RightPane', '#jobDescriptionText', // Indeed
        '.job-desc', '.styles_job-desc-container__txpYf', // Naukri
        '.job_description', '#details', '.detail_view', // Internshala
        'main', 'article', '[role="main"]' // Generic fallbacks
    ];

    for (const selector of selectors) {
        const el = document.querySelector(selector);
        if (el && el.innerText.trim().length > 200) {
            return el.innerText.substring(0, 30000);
        }
    }
    return document.body.innerText.substring(0, 30000);
}

function injectUI() {
    if (document.getElementById('jobfit-widget-container')) return;

    const container = document.createElement('div');
    container.id = 'jobfit-widget-container';
    
    // Create the floating icon
    const icon = document.createElement('div');
    icon.id = 'jobfit-icon';
    icon.innerHTML = `
        <svg width="32" height="32" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="12" y="10" width="6" height="18" fill="#0A1930"/>
            <rect x="4" y="22" width="8" height="6" fill="#0A1930"/>
            <rect x="20" y="10" width="6" height="14" fill="#0A1930"/>
            <rect x="26" y="10" width="8" height="5" fill="#0A1930"/>
            <rect x="26" y="17" width="5" height="5" fill="#0A1930"/>
        </svg>
    `;
    container.appendChild(icon);

    // Create the popover panel
    const panel = document.createElement('div');
    panel.id = 'jobfit-panel';
    panel.innerHTML = `
        <div class="jobfit-header">
            <h3>JobFit Analyzer</h3>
        </div>
        <div id="jobfit-content" class="jobfit-content">
            <div id="jobfit-loading" class="jobfit-hidden">
                <div class="jobfit-spinner"></div>
                <p>Analyzing job...</p>
            </div>
            <div id="jobfit-results" class="jobfit-hidden">
                <div class="jobfit-score-ring">
                    <span id="jobfit-score-text">0%</span>
                </div>
                <h4>Matched Skills & Projects</h4>
                <ul id="jobfit-matched-list"></ul>
                <h4>Skill Gaps</h4>
                <ul id="jobfit-gaps-list"></ul>
                <p id="jobfit-insights"></p>
                <button id="jobfit-letter-btn" class="jobfit-btn jobfit-btn-secondary">Generate Cover Letter</button>
            </div>
            <div id="jobfit-error" class="jobfit-hidden jobfit-error-text"></div>
        </div>
        <div id="jobfit-letter-view" class="jobfit-hidden">
            <textarea id="jobfit-letter-text" readonly></textarea>
            <button id="jobfit-copy-btn" class="jobfit-btn">Copy to Clipboard</button>
            <button id="jobfit-back-btn" class="jobfit-btn jobfit-btn-text">Back</button>
        </div>
    `;
    container.appendChild(panel);

    document.body.appendChild(container);

    // Event Listeners
    icon.addEventListener('mouseenter', () => {
        panel.classList.add('show');
    });

    container.addEventListener('mouseleave', () => {
        // Optional: panel.classList.remove('show');
        // Let's keep it open if they are interacting, maybe close on outside click instead
    });

    // Close if clicked outside
    document.addEventListener('click', (e) => {
        if (!container.contains(e.target)) {
            panel.classList.remove('show');
        }
    });

    icon.addEventListener('click', () => {
        panel.classList.toggle('show');
        if (panel.classList.contains('show')) {
            const currentText = extractJobDescription();
            if (currentText !== lastAnalyzedText) {
                lastAnalyzedText = currentText;
                handleAnalyze(currentText);
            }
        }
    });

    document.getElementById('jobfit-letter-btn').addEventListener('click', handleGenerateLetter);
    document.getElementById('jobfit-copy-btn').addEventListener('click', () => {
        const text = document.getElementById('jobfit-letter-text');
        text.select();
        document.execCommand('copy');
        document.getElementById('jobfit-copy-btn').innerText = 'Copied!';
        setTimeout(() => document.getElementById('jobfit-copy-btn').innerText = 'Copy to Clipboard', 2000);
    });
    document.getElementById('jobfit-back-btn').addEventListener('click', () => {
        document.getElementById('jobfit-letter-view').classList.add('jobfit-hidden');
        document.getElementById('jobfit-content').classList.remove('jobfit-hidden');
    });
}

function handleAnalyze(pageText) {
    document.getElementById('jobfit-error').classList.add('jobfit-hidden');
    document.getElementById('jobfit-loading').classList.remove('jobfit-hidden');
    document.getElementById('jobfit-results').classList.add('jobfit-hidden');

    chrome.runtime.sendMessage({ action: 'analyzeJob', pageText: pageText }, (response) => {
        document.getElementById('jobfit-loading').classList.add('jobfit-hidden');
        
        if (chrome.runtime.lastError || !response) {
            document.getElementById('jobfit-error').innerText = "Extension updated. Please refresh the page!";
            document.getElementById('jobfit-error').classList.remove('jobfit-hidden');
            return;
        }

        if (response.error) {
            document.getElementById('jobfit-error').innerText = response.error;
            document.getElementById('jobfit-error').classList.remove('jobfit-hidden');
            return;
        }

        const data = response.data;
        showResults(data);
    });
}

function showResults(data) {
    document.getElementById('jobfit-results').classList.remove('jobfit-hidden');
    document.getElementById('jobfit-score-text').innerText = `${data.score}%`;
    
    // Set color based on score
    const ring = document.querySelector('.jobfit-score-ring');
    if (data.score >= 80) ring.style.borderColor = '#10B981';
    else if (data.score >= 50) ring.style.borderColor = '#F59E0B';
    else ring.style.borderColor = '#EF4444';

    const matchedList = document.getElementById('jobfit-matched-list');
    matchedList.innerHTML = '';
    if (data.matched_skills) {
        data.matched_skills.forEach(skill => {
            const li = document.createElement('li');
            li.innerText = skill;
            li.style.color = '#10B981';
            matchedList.appendChild(li);
        });
    }

    const gapsList = document.getElementById('jobfit-gaps-list');
    gapsList.innerHTML = '';
    data.skill_gaps.forEach(gap => {
        const li = document.createElement('li');
        li.innerText = gap;
        li.style.color = '#EF4444';
        gapsList.appendChild(li);
    });

    document.getElementById('jobfit-insights').innerText = data.insights;
}

function handleGenerateLetter() {
    document.getElementById('jobfit-content').classList.add('jobfit-hidden');
    document.getElementById('jobfit-letter-view').classList.remove('jobfit-hidden');
    
    const textArea = document.getElementById('jobfit-letter-text');
    textArea.value = "Generating tailored cover letter...";
    
    const pageText = extractJobDescription();

    chrome.runtime.sendMessage({ action: 'generateCoverLetter', pageText: pageText }, (response) => {
        if (chrome.runtime.lastError || !response) {
            textArea.value = "Extension updated. Please refresh the page!";
            return;
        }
        
        if (response.error) {
            textArea.value = "Error: " + response.error;
            return;
        }
        textArea.value = response.letter;
    });
}

// Run init when DOM is ready or if already ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    // Some SPAs like LinkedIn might need a slight delay or observer to detect URL changes
    init();
    
    // MutationObserver to detect URL changes in SPAs
    let lastUrl = location.href; 
    new MutationObserver(() => {
        const url = location.href;
        if (url !== lastUrl) {
            lastUrl = url;
            init();
        }
    }).observe(document, {subtree: true, childList: true});
}
