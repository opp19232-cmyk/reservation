(function() {
    'use strict';

    // ===== إعدادات النظام (1 إلى 500) =====
    const CONFIG = {
        MIN_CODE: 1,
        MAX_CODE: 500,        // من 1 إلى 500
        WHATSAPP_NUMBERS: {
            first: '201126432778',
            second: '201503258404'
        }
    };

    // ===== تهيئة المتغيرات =====
    let usedCodes = new Set();
    let currentCode = CONFIG.MIN_CODE;

    // عناصر DOM
    const loader = document.getElementById('loader');
    const mainContent = document.getElementById('mainContent');
    const loaderProgress = document.getElementById('loaderProgress');
    const codeDisplay = document.getElementById('codeDisplay');
    const codeError = document.getElementById('codeError');
    const validationError = document.getElementById('validationError');
    const bookingForm = document.getElementById('bookingForm');
    const devLink = document.getElementById('devLink');
    const visitorCountEl = document.getElementById('visitorCount');
    
    // أزرار واتساب
    const sendToFirstBtn = document.getElementById('sendToFirstBtn');
    const sendToSecondBtn = document.getElementById('sendToSecondBtn');
    
    // حقول الإدخال
    const inputs = {
        firstName: document.getElementById('firstName'),
        lastName: document.getElementById('lastName'),
        phone: document.getElementById('phone')
    };

    // ===== دالة عرض رسالة تأكيد =====
    function showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = 'toast-message';
        
        if (type === 'success') {
            toast.style.background = 'linear-gradient(135deg, #25D366, #128C7E)';
            toast.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
        } else {
            toast.style.background = 'linear-gradient(135deg, #FF4D4D, #CC0000)';
            toast.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
        }
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                toast.remove();
            }, 300);
        }, 3000);
    }

    // ===== تحميل الأكواد المخزنة =====
    function loadStoredCodes() {
        try {
            const stored = localStorage.getItem('mm_codes_500');
            if (stored) {
                usedCodes = new Set(JSON.parse(stored));
                console.log('الأكواد المستخدمة:', Array.from(usedCodes));
            } else {
                usedCodes = new Set();
            }
            
            updateCurrentCode();
            
        } catch (e) {
            console.warn('فشل تحميل الأكواد', e);
            usedCodes = new Set();
        }
    }

    // ===== حفظ الأكواد =====
    function saveCodes() {
        try {
            localStorage.setItem('mm_codes_500', JSON.stringify(Array.from(usedCodes)));
        } catch (e) {
            console.warn('فشل حفظ الأكواد', e);
        }
    }

    // ===== البحث عن الكود التالي المتاح =====
    function findNextAvailableCode() {
        let code = CONFIG.MIN_CODE;
        while (usedCodes.has(code.toString()) && code <= CONFIG.MAX_CODE) {
            code++;
        }
        
        if (code > CONFIG.MAX_CODE) {
            for (let i = CONFIG.MIN_CODE; i <= CONFIG.MAX_CODE; i++) {
                if (!usedCodes.has(i.toString())) {
                    return i;
                }
            }
            return CONFIG.MAX_CODE + 1;
        }
        
        return code;
    }

    // ===== تحديث الكود المعروض =====
    function updateCurrentCode() {
        const newCode = findNextAvailableCode();
        currentCode = newCode;
        if (codeDisplay) {
            if (currentCode > CONFIG.MAX_CODE) {
                codeDisplay.textContent = 'نفدت الأكواد';
                codeDisplay.style.color = '#FF4D4D';
            } else {
                codeDisplay.textContent = currentCode;
                codeDisplay.style.color = '#D4AF37';
            }
        }
    }

    // ===== التحقق من أن الكود متاح =====
    function isCodeAvailable(code) {
        if (parseInt(code) > CONFIG.MAX_CODE) return false;
        return !usedCodes.has(code.toString());
    }

    // ===== معالجة تغيير المدخلات =====
    function handleInputChange() {
        const currentDisplayCode = codeDisplay.textContent;
        
        if (currentDisplayCode === 'نفدت الأكواد') return;
        
        if (!isCodeAvailable(currentDisplayCode)) {
            const nextCode = findNextAvailableCode();
            if (nextCode > CONFIG.MAX_CODE) {
                codeDisplay.textContent = 'نفدت الأكواد';
                codeDisplay.style.color = '#FF4D4D';
            } else {
                codeDisplay.textContent = nextCode;
                currentCode = nextCode;
            }
            
            codeError.classList.add('show');
            setTimeout(() => {
                codeError.classList.remove('show');
            }, 3000);
        }
    }

    // ===== التحقق من صحة البيانات =====
    function validateForm() {
        if (!inputs.firstName.value.trim() || 
            !inputs.lastName.value.trim() || 
            !inputs.phone.value.trim()) {
            
            validationError.querySelector('span').textContent = 'الرجاء تعبئة جميع الحقول المطلوبة';
            validationError.classList.add('show');
            return false;
        }
        
        const phoneRegex = /^[0-9]+$/;
        if (!phoneRegex.test(inputs.phone.value.trim())) {
            validationError.querySelector('span').textContent = 'رقم الهاتف يجب أن يحتوي على أرقام فقط';
            validationError.classList.add('show');
            return false;
        }
        
        validationError.classList.remove('show');
        return true;
    }

    // ===== معالجة الحجز (بدون تاريخ ووقت) =====
    const processBooking = (phoneNumber, name) => {
        if (!validateForm()) {
            return false;
        }
        
        const barberCode = codeDisplay.textContent;
        
        if (barberCode === 'نفدت الأكواد') {
            showToast('عذراً، نفدت جميع الأكواد (1-500)', 'error');
            return false;
        }
        
        if (!isCodeAvailable(barberCode)) {
            codeError.classList.add('show');
            const newCode = findNextAvailableCode();
            if (newCode > CONFIG.MAX_CODE) {
                codeDisplay.textContent = 'نفدت الأكواد';
                codeDisplay.style.color = '#FF4D4D';
            } else {
                codeDisplay.textContent = newCode;
                currentCode = newCode;
            }
            
            setTimeout(() => {
                codeError.classList.remove('show');
            }, 3000);
            return false;
        }
        
        usedCodes.add(barberCode);
        saveCodes();
        
        // إنشاء رسالة واتساب (بدون تاريخ ووقت)
        let message = '';
        message += '🔹 *حجز حلاقة M&M* 🔹\n';
        message += '👤 *الاسم:* ' + inputs.firstName.value.trim() + ' ' + inputs.lastName.value.trim() + '\n';
        message += '📞 *الهاتف:* ' + inputs.phone.value.trim() + '\n';
        message += '✂️ *كود الحجز:* ' + barberCode + '\n';
        message += '📩 *تم الإرسال إلى:* ' + name;
        
        window.open(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`, '_blank');
        
        // عرض رسالة تأكيد
        showToast(`✅ تم إرسال الحجز إلى ${name} بنجاح`, 'success');
        
        inputs.firstName.value = '';
        inputs.lastName.value = '';
        inputs.phone.value = '';
        
        updateCurrentCode();
        
        return true;
    };

    // ===== شاشة التحميل =====
    function initLoader() {
        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.random() * 15;
            if (progress >= 100) {
                progress = 100;
                clearInterval(interval);
                
                setTimeout(() => {
                    loader.classList.add('hidden');
                    mainContent.classList.add('visible');
                    createParticles();
                }, 500);
            }
            loaderProgress.style.width = progress + '%';
        }, 100);
    }

    // ===== إنشاء جسيمات الخلفية =====
    function createParticles() {
        const particlesDiv = document.getElementById('particles');
        for (let i = 0; i < 30; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.left = Math.random() * 100 + '%';
            particle.style.animationDelay = Math.random() * 5 + 's';
            particle.style.animationDuration = (Math.random() * 10 + 10) + 's';
            particlesDiv.appendChild(particle);
        }
    }

    // ===== عداد الزيارات =====
    function initVisitorCounter() {
        if (!visitorCountEl) return;
        
        try {
            const COUNTER_KEY = 'mm_visitor_counter';
            const SESSION_KEY = 'mm_session_counted';
            
            let visitorCount = 0;
            const stored = localStorage.getItem(COUNTER_KEY);
            if (stored) {
                visitorCount = parseInt(stored);
                if (isNaN(visitorCount)) visitorCount = 0;
            }
            
            const sessionCounted = sessionStorage.getItem(SESSION_KEY);
            
            if (!sessionCounted) {
                visitorCount++;
                localStorage.setItem(COUNTER_KEY, visitorCount.toString());
                sessionStorage.setItem(SESSION_KEY, 'true');
            }
            
            visitorCountEl.textContent = visitorCount;
            
        } catch (e) {
            console.warn('فشل تحديث عداد الزيارات');
            visitorCountEl.textContent = '0';
        }
    }

    // ===== ربط الأحداث =====
    Object.values(inputs).forEach(input => {
        if (input) {
            input.addEventListener('input', () => {
                handleInputChange();
                validationError.classList.remove('show');
            });
        }
    });

    sendToFirstBtn.addEventListener('click', (e) => {
        e.preventDefault();
        processBooking(CONFIG.WHATSAPP_NUMBERS.first, 'محمود');
    });

    sendToSecondBtn.addEventListener('click', (e) => {
        e.preventDefault();
        processBooking(CONFIG.WHATSAPP_NUMBERS.second, 'محمد');
    });

    bookingForm.addEventListener('submit', (e) => {
        e.preventDefault();
    });

    devLink.addEventListener('click', () => {
        window.open('https://wa.me/201025844231', '_blank');
    });

    // ===== بدء التطبيق =====
    window.addEventListener('load', () => {
        loadStoredCodes();
        initVisitorCounter();
        initLoader();
        
        console.log('الأكواد من 1 إلى 500');
        console.log('الأكواد المستخدمة:', usedCodes.size);
    });

})();
