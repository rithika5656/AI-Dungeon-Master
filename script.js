// ========================================
// SMOOTH SCROLL & NAVBAR INTERACTIONS
// ========================================

// Smooth scroll for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Navbar scroll effect
let lastScrollTop = 0;
const navbar = document.querySelector('.navbar');

window.addEventListener('scroll', () => {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    
    if (scrollTop > 100) {
        navbar.style.padding = '0.5rem 0';
        navbar.style.background = 'hsla(240, 20%, 8%, 0.95)';
    } else {
        navbar.style.padding = '1rem 0';
        navbar.style.background = 'hsla(240, 20%, 8%, 0.8)';
    }
    
    lastScrollTop = scrollTop;
});

// ========================================
// FEATURE CARDS ANIMATION
// ========================================

const observerOptions = {
    threshold: 0.2,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, index) => {
        if (entry.isIntersecting) {
            setTimeout(() => {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }, index * 100);
        }
    });
}, observerOptions);

// Observe feature cards
document.querySelectorAll('.feature-card').forEach((card, index) => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(30px)';
    card.style.transition = 'all 0.6s ease';
    observer.observe(card);
});

// ========================================
// INTERACTIVE FEATURE CARDS
// ========================================

const featureCards = document.querySelectorAll('.feature-card');

featureCards.forEach(card => {
    card.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-10px) scale(1.02)';
    });
    
    card.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0) scale(1)';
    });
});

// ========================================
// BUTTON RIPPLE EFFECT
// ========================================

const buttons = document.querySelectorAll('.btn');

buttons.forEach(button => {
    button.addEventListener('click', function(e) {
        const ripple = document.createElement('span');
        ripple.classList.add('ripple');
        this.appendChild(ripple);
        
        const rect = this.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;
        
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        
        setTimeout(() => ripple.remove(), 600);
    });
});

// ========================================
// GET STARTED BUTTON ACTION
// ========================================

const getStartedBtn = document.getElementById('getStartedBtn');

getStartedBtn.addEventListener('click', () => {
    // Create a celebratory effect
    createConfetti();
    
    // Show a nice message
    setTimeout(() => {
        alert('🎉 Welcome! Let\'s get started on something amazing!');
    }, 300);
});

// ========================================
// CONTACT FORM HANDLING
// ========================================

const contactForm = document.getElementById('contactForm');

contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const formData = {
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        message: document.getElementById('message').value
    };
    
    // Simulate form submission
    const submitBtn = contactForm.querySelector('.submit-btn');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '✓ Sent!';
    submitBtn.style.background = 'linear-gradient(135deg, #10b981, #059669)';
    
    // Reset form
    setTimeout(() => {
        contactForm.reset();
        submitBtn.innerHTML = originalText;
        submitBtn.style.background = '';
        alert('Thank you! Your message has been sent successfully. 📧');
    }, 2000);
    
    console.log('Form submitted:', formData);
});

// ========================================
// CONFETTI EFFECT
// ========================================

function createConfetti() {
    const colors = ['#8b5cf6', '#ec4899', '#3b82f6', '#10b981', '#f59e0b'];
    
    for (let i = 0; i < 50; i++) {
        setTimeout(() => {
            const confetti = document.createElement('div');
            confetti.style.position = 'fixed';
            confetti.style.width = '10px';
            confetti.style.height = '10px';
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.left = Math.random() * window.innerWidth + 'px';
            confetti.style.top = '-10px';
            confetti.style.opacity = '1';
            confetti.style.borderRadius = '50%';
            confetti.style.pointerEvents = 'none';
            confetti.style.zIndex = '9999';
            confetti.style.transition = 'all 2s ease-out';
            
            document.body.appendChild(confetti);
            
            setTimeout(() => {
                confetti.style.top = window.innerHeight + 'px';
                confetti.style.left = (parseInt(confetti.style.left) + (Math.random() - 0.5) * 200) + 'px';
                confetti.style.opacity = '0';
                confetti.style.transform = 'rotate(720deg)';
            }, 10);
            
            setTimeout(() => confetti.remove(), 2000);
        }, i * 30);
    }
}

// ========================================
// PARALLAX EFFECT
// ========================================

window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const circles = document.querySelectorAll('.circle');
    
    circles.forEach((circle, index) => {
        const speed = (index + 1) * 0.05;
        circle.style.transform = `translateY(${scrolled * speed}px)`;
    });
});

// ========================================
// CURSOR TRAIL EFFECT (Optional)
// ========================================

let cursorTrail = [];
const trailLength = 10;

document.addEventListener('mousemove', (e) => {
    // Only on larger screens
    if (window.innerWidth < 768) return;
    
    cursorTrail.push({x: e.clientX, y: e.clientY});
    
    if (cursorTrail.length > trailLength) {
        cursorTrail.shift();
    }
});

// ========================================
// STATS COUNTER ANIMATION
// ========================================

const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const statValue = entry.target;
            const targetText = statValue.textContent;
            
            // Simple animation for the stats
            statValue.style.transform = 'scale(1.1)';
            setTimeout(() => {
                statValue.style.transform = 'scale(1)';
            }, 300);
            
            statsObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.5 });

document.querySelectorAll('.stat-value').forEach(stat => {
    stat.style.transition = 'transform 0.3s ease';
    statsObserver.observe(stat);
});

// ========================================
// THEME INITIALIZATION
// ========================================

console.log('%c🚀 Welcome to the Future! ', 'background: linear-gradient(135deg, #8b5cf6, #ec4899); color: white; font-size: 20px; padding: 10px; border-radius: 5px;');
console.log('%cEnjoy this beautifully crafted experience!', 'color: #8b5cf6; font-size: 14px;');
