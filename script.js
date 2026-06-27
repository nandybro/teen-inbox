/* ============================================================
   TEENINBOX LANDING PAGE — MAIN SCRIPT
   Handles:
     1. Cinematic phone demo (two scenarios, cycling)
     2. Waitlist form submission
     3. Scroll-reveal animations
     4. Navbar scroll effect
============================================================ */

// ============================================================
// SCENARIO ENGINE
// ============================================================

const SCENARIOS = [
    {
        id: 0,
        appName: "Snapchat",
        appColor: "#FFFC00",
        appIcon: "fa-brands fa-snapchat",
        avatarInitials: "ST",
        avatarBg: "linear-gradient(135deg, #fffc00, #ffa500)",
        avatarColor: "#000",
        steps: [
            {
                delay: 800,
                type: "typing",
                duration: 1200
            },
            {
                delay: 2200,
                type: "them",
                text: "Hey, I found some secrets about you online..."
            },
            {
                delay: 3800,
                type: "me",
                text: "Who are you?"
            },
            {
                delay: 5200,
                type: "typing",
                duration: 1400
            },
            {
                delay: 6800,
                type: "threat",
                text: "Send me your photos or I'll send these screenshots to everyone at your school. You have 1 hour. Don't tell your parents."
            },
            {
                delay: 7400,
                type: "detect_text",
                alertTitle: "Blackmail Detected",
                alertApp: "Snapchat",
                alertMsg: "Coercive blackmail message intercepted",
                parentMsg: "A stranger is blackmailing your teen on Snapchat. Message saved."
            }
        ]
    },
    {
        id: 1,
        appName: "Instagram",
        appColor: "#E1306C",
        appIcon: "fa-brands fa-instagram",
        avatarInitials: "UN",
        avatarBg: "linear-gradient(135deg, #405DE6, #5851DB, #833AB4, #E1306C, #FD1D1D, #F56040)",
        avatarColor: "#fff",
        steps: [
            {
                delay: 800,
                type: "typing",
                duration: 1000
            },
            {
                delay: 1900,
                type: "them",
                text: "Check this out 😏"
            },
            {
                delay: 3200,
                type: "typing",
                duration: 800
            },
            {
                delay: 4200,
                type: "image",
                caption: "Sending photo..."
            },
            {
                delay: 4800,
                type: "detect_image",
                alertTitle: "Explicit Content Blocked",
                alertApp: "Instagram",
                alertMsg: "Adult image intercepted before display",
                parentMsg: "An explicit image was sent to your teen on Instagram. Image captured."
            }
        ]
    }
];

let currentScenario = 0;
let animationTimers = [];
let blockedCount = 0;

function clearTimers() {
    animationTimers.forEach(t => clearTimeout(t));
    animationTimers = [];
}

function later(fn, delay) {
    const t = setTimeout(fn, delay);
    animationTimers.push(t);
    return t;
}

// ============================================================
// DOM HELPERS
// ============================================================

function el(id) { return document.getElementById(id); }

function createTypingIndicator() {
    const div = document.createElement('div');
    div.className = 'typing-indicator';
    div.innerHTML = `<div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>`;
    return div;
}

function createBubble(type, text) {
    const div = document.createElement('div');
    div.className = `msg-bubble ${type}`;
    div.textContent = text;
    return div;
}

function createThreatBubble(text) {
    const div = document.createElement('div');
    div.className = 'msg-bubble msg-threat';
    div.innerHTML = `
        <div class="threat-text-content">${text}</div>
        <div class="threat-blocked-bar" id="threat-bar">
            <i class="fa-solid fa-shield-halved"></i>
            <span>Threat Blocked</span>
            <div class="tb-share"><i class="fa-solid fa-arrow-up-right-dots"></i> Shared to Parent</div>
        </div>
    `;
    return div;
}

function createImageBubble() {
    const div = document.createElement('div');
    div.className = 'img-bubble';
    div.id = 'img-bubble-main';
    // Use the AI-generated blurred/censored image asset (included in project)
    div.style.backgroundImage = "url('explicit_blocked.png')";
    div.style.backgroundSize = 'cover';
    div.style.backgroundPosition = 'center';
    div.innerHTML = `
        <div class="img-bubble-inner" id="img-inner"></div>
        <div class="img-scanner" id="img-scanner"></div>
        <div class="img-blocked-badge" id="img-blocked">
            <i class="fa-solid fa-ban"></i>
            <div class="blocked-title">Explicit<br>Blocked</div>
            <div class="shared-pill">
                <i class="fa-solid fa-paper-plane"></i>
                <span>Sent to Parent</span>
            </div>
        </div>
    `;
    return div;
}

// ============================================================
// PARENT ALERT
// ============================================================

function fireParentAlert(step) {
    // Activate connection line
    const line = el('connection-line');
    if (line) {
        line.classList.add('active');
        later(() => line.classList.remove('active'), 4000);
    }

    // Flash the teen phone screen
    const flash = el('detection-flash');
    if (flash) {
        flash.classList.add('active');
        later(() => flash.classList.remove('active'), 1500);
    }

    // Update parent status bar
    const statusDefault = el('parent-status-default');
    if (statusDefault) {
        statusDefault.className = 'parent-status-item alert';
        statusDefault.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> <span>Threat Detected!</span>`;
        later(() => {
            statusDefault.className = 'parent-status-item safe';
            statusDefault.innerHTML = `<i class="fa-solid fa-circle-check"></i> <span>All clear — No threats</span>`;
        }, 5000);
    }

    // Inject new alert card
    const alertList = el('parent-alerts-list');
    if (alertList) {
        const card = document.createElement('div');
        card.className = 'parent-alert-card';
        const now = new Date();
        const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        card.innerHTML = `
            <div class="pac-top">
                <span class="pac-badge">Alert</span>
                <span class="pac-app"><i class="${SCENARIOS[currentScenario].appIcon}" style="color:${SCENARIOS[currentScenario].appColor}"></i> ${step.alertApp}</span>
            </div>
            <div class="pac-msg">${step.parentMsg}</div>
            <div class="pac-time">Just now · ${time}</div>
        `;
        alertList.prepend(card);

        // Remove old alerts after 2 cycles to keep it clean
        if (alertList.children.length > 3) {
            alertList.removeChild(alertList.lastChild);
        }
    }

    // Update blocked count
    blockedCount++;
    const statBlocked = el('stat-blocked');
    if (statBlocked) statBlocked.textContent = blockedCount;
}

// ============================================================
// MAIN SCENARIO RUNNER
// ============================================================

function buildAppHeader(scenario) {
    const messages = el('app-messages');
    const scene = el('app-scene');
    if (!scene) return;

    scene.innerHTML = '';

    const appBg = document.createElement('div');
    appBg.className = 'app-bg';

    // Header
    const header = document.createElement('div');
    header.className = 'app-header-bar';
    header.innerHTML = `
        <div class="app-header-avatar" style="background:${scenario.avatarBg}; color:${scenario.avatarColor}">
            ${scenario.avatarInitials}
        </div>
        <div>
            <div class="app-header-name">${scenario.avatarInitials === 'UN' ? 'Unknown User' : 'Stranger'}</div>
            <div class="app-header-sub"><i class="${scenario.appIcon}" style="color:${scenario.appColor}"></i> ${scenario.appName}</div>
        </div>
        <i class="fa-solid fa-ellipsis-vertical app-header-icon"></i>
    `;
    appBg.appendChild(header);

    // Messages
    const msgContainer = document.createElement('div');
    msgContainer.className = 'app-messages';
    msgContainer.id = 'app-messages';
    appBg.appendChild(msgContainer);

    // Input
    const inputBar = document.createElement('div');
    inputBar.className = 'app-input-bar';
    inputBar.innerHTML = `
        <div class="app-fake-input">Type a message...</div>
        <i class="fa-solid fa-paper-plane app-send-icon"></i>
    `;
    appBg.appendChild(inputBar);

    scene.appendChild(appBg);

    // TeenInbox Overlay
    const overlay = document.createElement('div');
    overlay.className = 'teeninbox-overlay';
    overlay.id = 'ti-overlay';
    overlay.innerHTML = `
        <div class="ti-bar">
            <i class="fa-solid fa-shield-halved"></i>
            <span>TeenInbox Active</span>
            <span class="ti-status-dot"></span>
        </div>
    `;
    scene.appendChild(overlay);

    // Detection Flash
    const flash = document.createElement('div');
    flash.className = 'detection-flash';
    flash.id = 'detection-flash';
    scene.appendChild(flash);
}

function runScenario(idx) {
    clearTimers();

    const scenario = SCENARIOS[idx];
    buildAppHeader(scenario);

    // Animate steps
    scenario.steps.forEach((step) => {
        later(() => {
            const msgContainer = el('app-messages');
            if (!msgContainer) return;

            if (step.type === 'typing') {
                const indicator = createTypingIndicator();
                indicator.id = 'typing-ind';
                msgContainer.appendChild(indicator);
                msgContainer.scrollTop = msgContainer.scrollHeight;

                later(() => {
                    const ind = el('typing-ind');
                    if (ind) ind.remove();
                }, step.duration);

            } else if (step.type === 'them') {
                const bubble = createBubble('msg-them', step.text);
                bubble.style.animationDelay = '0s';
                msgContainer.appendChild(bubble);
                msgContainer.scrollTop = msgContainer.scrollHeight;

            } else if (step.type === 'me') {
                const bubble = createBubble('msg-me', step.text);
                bubble.style.animationDelay = '0s';
                msgContainer.appendChild(bubble);
                msgContainer.scrollTop = msgContainer.scrollHeight;

            } else if (step.type === 'threat') {
                const bubble = createThreatBubble(step.text);
                bubble.style.animationDelay = '0s';
                msgContainer.appendChild(bubble);
                msgContainer.scrollTop = msgContainer.scrollHeight;

            } else if (step.type === 'image') {
                const imgBubble = createImageBubble();
                imgBubble.style.animationDelay = '0s';
                msgContainer.appendChild(imgBubble);
                msgContainer.scrollTop = msgContainer.scrollHeight;

            } else if (step.type === 'detect_text') {
                // Highlight threat bubble
                const threatBubble = msgContainer.querySelector('.msg-threat');
                if (threatBubble) {
                    threatBubble.classList.add('flagged');
                    const bar = threatBubble.querySelector('.threat-blocked-bar');
                    if (bar) {
                        later(() => {
                            bar.classList.add('visible');
                        }, 400);
                    }
                }
                later(() => fireParentAlert(step), 600);

            } else if (step.type === 'detect_image') {
                // Run laser over image then block
                const imgBubble = el('img-bubble-main');
                const scanner = el('img-scanner');
                const blocked = el('img-blocked');
                const imgInner = el('img-inner');

                if (scanner) {
                    // Laser sweep
                    scanner.style.transition = 'none';
                    scanner.style.top = '-100%';
                    scanner.style.opacity = '0';
                    scanner.style.display = 'block';

                    later(() => {
                        scanner.style.transition = 'top 1.2s ease-in-out, opacity 0.3s ease';
                        scanner.style.opacity = '1';
                        scanner.style.top = '110%';
                    }, 50);

                    later(() => {
                        scanner.style.opacity = '0';
                        // Censor image
                        if (imgInner) imgBubble.classList.add('censored');
                        // Show blocked badge
                        later(() => {
                            if (blocked) blocked.classList.add('visible');
                        }, 300);
                        // Fire parent alert
                        later(() => fireParentAlert(step), 500);
                    }, 1400);
                }
            }

        }, step.delay);
    });

    // Auto-restart after scenario completes
    const totalDuration = Math.max(...scenario.steps.map(s => s.delay)) + 5000;
    later(() => {
        // Fade out and switch
        const scene = el('app-scene');
        if (scene) {
            scene.style.transition = 'opacity 0.5s ease';
            scene.style.opacity = '0';
            later(() => {
                currentScenario = (currentScenario + 1) % SCENARIOS.length;
                updateScenarioBtns();
                scene.style.opacity = '1';
                runScenario(currentScenario);
            }, 600);
        }
    }, totalDuration);
}

function updateScenarioBtns() {
    SCENARIOS.forEach((s, i) => {
        const btn = document.querySelector(`[data-scenario="${i}"]`);
        if (btn) btn.classList.toggle('active', i === currentScenario);
    });
}

// ============================================================
// INIT
// ============================================================

document.addEventListener('DOMContentLoaded', () => {

    // Start demo
    runScenario(currentScenario);

    // ============================================================
    // PERSONA CAROUSEL
    // ============================================================
    const personaCards = document.querySelectorAll('.persona-card');
    const personaDots  = document.querySelectorAll('.persona-dot');
    let currentPersona = 0;

    function showPersona(idx) {
        personaCards.forEach((c, i) => c.classList.toggle('active', i === idx));
        personaDots.forEach((d, i)  => d.classList.toggle('active', i === idx));
        currentPersona = idx;
    }

    // Click dots to jump
    personaDots.forEach(dot => {
        dot.addEventListener('click', () => {
            showPersona(parseInt(dot.dataset.dot));
            clearInterval(personaTimer);
            personaTimer = setInterval(advancePersona, 3000);
        });
    });

    function advancePersona() {
        showPersona((currentPersona + 1) % personaCards.length);
    }

    let personaTimer = setInterval(advancePersona, 3000);

    // Scenario buttons
    document.querySelectorAll('.scenario-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const idx = parseInt(btn.dataset.scenario);
            currentScenario = idx;
            updateScenarioBtns();
            const scene = el('app-scene');
            if (scene) {
                scene.style.transition = 'opacity 0.4s ease';
                scene.style.opacity = '0';
                later(() => {
                    scene.style.opacity = '1';
                    runScenario(idx);
                }, 400);
            }
        });
    });

    // Waitlist form
    const form = el('waitlist-form');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = el('wl-email').value;
            const phone = el('wl-phone').value;
            if (!email || !phone) return;

            const wrap = el('waitlist-form-wrap');
            const success = el('waitlist-success');
            const submitBtn = form.querySelector('.btn-submit-main');
            const origText = submitBtn.innerHTML;

            submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Securing your spot...';
            submitBtn.disabled = true;

            fetch('https://script.google.com/macros/s/AKfycbyznv7coa1iXhK3BQbD2I0mDoCtjPa04RAHvLenftPnjTcw9nPfcLQUXHJW9P9olb7K/exec', {
                method: 'POST',
                headers: {
                    'Content-Type': 'text/plain;charset=utf-8',
                },
                body: JSON.stringify({ email: email, phone: phone })
            })
            .then(() => {
                wrap.classList.add('d-none');
                success.classList.remove('d-none');
            })
            .catch(error => {
                console.error('Error submitting form', error);
                submitBtn.innerHTML = origText;
                submitBtn.disabled = false;
                alert('Something went wrong. Please try again.');
            });
        });
    }

    // Scroll reveal
    const reveals = document.querySelectorAll('.reveal');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(e => {
            if (e.isIntersecting) {
                e.target.classList.add('visible');
                observer.unobserve(e.target);
            }
        });
    }, { threshold: 0.15 });
    reveals.forEach(r => observer.observe(r));

    // Navbar scroll effect
    const navbar = el('navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.style.boxShadow = '0 1px 30px rgba(0,0,0,0.5)';
        } else {
            navbar.style.boxShadow = 'none';
        }
    });

    // Add reveal to sections on init
    document.querySelectorAll('#apps, #features, #waitlist').forEach(sec => {
        sec.querySelectorAll('.section-eyebrow, .section-title, .section-sub, .feature-card, .waitlist-card, .contact-strip').forEach(el => {
            el.classList.add('reveal');
            observer.observe(el);
        });
    });
});
