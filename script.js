(function() {
    'use strict';

    // ===== إعدادات النظام =====
    const CONFIG = {
        MIN_CODE: 1,
        MAX_CODE: 200,
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

    // ===== عداد الزيارات الحقيقي (يبدأ من صفر) =====
    function initRealVisitorCounter() {
        let visitorCount = 0;
        
        try {
            // مفتاح فريد للعداد
            const COUNTER_KEY = 'mm_global_visitor_counter';
            const SESSION_KEY = 'mm_session_counted';
            
            // قراءة العداد الحالي
            const stored = localStorage.getItem(COUNTER_KEY);
            if (stored) {
                visitorCount = parseInt(stored);
            } else {
                // إذا لم يكن هناك عداد، نبدأ من صفر
                visitorCount = 0;
            }
            
            // التحقق إذا كان هذا الجهاز قد سجل زيارة في هذه الجلسة
            const sessionCounted = sessionStorage.getItem(SESSION_KEY);
            
            if (!sessionCounted) {
                // زيادة العداد للزائر الجديد فقط
                visitorCount++;
                
                // حفظ العداد الجديد
                localStorage.setItem(COUNTER_KEY, visitorCount.toString());
                
                // تسجيل أن هذه الجلسة تم عدها
                sessionStorage.setItem(SESSION_KEY, 'true');
            }
            
            // عرض العداد
            if (visitorCountEl) {
                visitorCountEl.textContent = visitorCount;
            }
            
            console.log('عدد الزيارات الحقيقي:', visitorCount); // للتأكد من العمل
            
        } catch (e) {
            console.warn('فشل تحديث عداد الزيارات');
            // في حالة الخطأ، نظهر صفر على الأقل
            if (visitorCountEl) {
                visitorCountEl.textContent = '0';
            }
        }
    }

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

    // ===== تحميل الأكواد المخزنة =====
    try {
        const stored = localStorage.getItem('mm_codes_v8');
        if (stored) {
            usedCodes = new Set(JSON.parse(stored));
        }
    } catch (e) {
        console.warn('فشل تحميل الأكواد');
    }

    // ===== دوال الكود (النظام الدائري 1-200) =====
    const findNextAvailableCode = (startFrom) => {
        let code = startFrom;
        
        if (code > CONFIG.MAX_CODE) {
            code = CONFIG.MIN_CODE;
        }
        if (code < CONFIG.MIN_CODE) {
            code = CONFIG.MIN_CODE;
        }
        
        for (let i = 0; i <= CONFIG.MAX_CODE - CONFIG.MIN_CODE; i++) {
            let candidateCode = code + i;
            
            if (candidateCode > CONFIG.MAX_CODE) {
                candidateCode = candidateCode - CONFIG.MAX_CODE + CONFIG.MIN_CODE - 1;
            }
            
            if (!usedCodes.has(candidateCode.toString())) {
                return candidateCode;
            }
        }
        
        return CONFIG.MIN_CODE;
    };

    const isCodeUsed = () => usedCodes.has(codeDisplay.textContent);

    const handleInputChange = () => {
        if (isCodeUsed()) {
            const currentValue = parseInt(codeDisplay.textContent);
            const nextCode = findNextAvailableCode(currentValue + 1);
            codeDisplay.textContent = nextCode;
            currentCode = nextCode;
            codeError.classList.add('show');
            
            setTimeout(() => {
                codeError.classList.remove('show');
            }, 3000);
        }
    };

    // ===== التحقق من صحة البيانات =====
    const validateForm = () => {
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
    };

    // ===== دالة معالجة الحجز =====
    const processBooking = (phoneNumber, name) => {
        if (!validateForm()) {
            return false;
        }
        
        const barberCode = codeDisplay.textContent;
        
        if (usedCodes.has(barberCode)) {
            codeError.classList.add('show');
            const currentValue = parseInt(barberCode);
            const newCode = findNextAvailableCode(currentValue + 1);
            codeDisplay.textContent = newCode;
            currentCode = newCode;
            
            setTimeout(() => {
                codeError.classList.remove('show');
            }, 3000);
            return false;
        }
        
        usedCodes.add(barberCode);
        try {
            localStorage.setItem('mm_codes_v8', JSON.stringify(Array.from(usedCodes)));
        } catch (error) {}
        
        const message = `🔹 *حجز حلاقة M&M* 🔹
👤 *الاسم:* ${inputs.firstName.value.trim()} ${inputs.lastName.value.trim()}
📞 *الهاتف:* ${inputs.phone.value.trim()}
✂️ *كود الحجز:* ${barberCode}
👨‍💼 *تم الإرسال إلى:* ${name}`;
        
        window.open(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`, '_blank');
        
        inputs.firstName.value = '';
        inputs.lastName.value = '';
        inputs.phone.value = '';
        
        const nextCode = findNextAvailableCode(parseInt(barberCode) + 1);
        codeDisplay.textContent = nextCode;
        currentCode = nextCode;
        
        return true;
    };

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
        // بدء عداد الزيارات الحقيقي (يبدأ من صفر)
        initRealVisitorCounter();
        
        // تهيئة الكود
        const startCode = findNextAvailableCode(CONFIG.MIN_CODE);
        codeDisplay.textContent = startCode;
        currentCode = startCode;
        
        // بدء شاشة التحميل
        initLoader();
    });

    // ===== فحص دوري للكود =====
    setInterval(() => {
        const disp = codeDisplay.textContent;
        if (usedCodes.has(disp)) {
            const currentValue = parseInt(disp);
            const nextCode = findNextAvailableCode(currentValue + 1);
            codeDisplay.textContent = nextCode;
            currentCode = nextCode;
            codeError.classList.add('show');
            
            setTimeout(() => {
                codeError.classList.remove('show');
            }, 3000);
        }
    }, 15000);
})();