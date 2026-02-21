(function() {
    'use strict';

    // ===== إعدادات النظام =====
    const CONFIG = {
        MIN_CODE: 1,
        MAX_CODE_PER_DAY: 30,
        WHATSAPP_NUMBERS: {
            first: '201126432778',
            second: '201503258404'
        }
    };

    // ===== تهيئة المتغيرات =====
    let usedCodes = new Set();
    let allTimeCodes = new Set();
    let currentCode = CONFIG.MIN_CODE;
    let today = getTodayDate();

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
    const dailyTimerEl = document.getElementById('dailyTimer');
    const remainingCodesEl = document.getElementById('remainingCodes');
    
    // أزرار واتساب
    const sendToFirstBtn = document.getElementById('sendToFirstBtn');
    const sendToSecondBtn = document.getElementById('sendToSecondBtn');
    
    // حقول الإدخال
    const inputs = {
        firstName: document.getElementById('firstName'),
        lastName: document.getElementById('lastName'),
        phone: document.getElementById('phone')
    };

    // ===== الحصول على تاريخ اليوم =====
    function getTodayDate() {
        const date = new Date();
        return date.toISOString().split('T')[0];
    }

    // ===== تحديث عداد الأكواد المتبقية =====
    function updateRemainingCodes() {
        if (!remainingCodesEl) return;
        
        const usedToday = usedCodes.size;
        let remaining = CONFIG.MAX_CODE_PER_DAY - usedToday;
        if (remaining < 0) remaining = 0;
        
        remainingCodesEl.textContent = remaining;
        
        // تغيير اللون حسب العدد المتبقي
        if (remaining <= 5 && remaining > 0) {
            remainingCodesEl.style.color = '#FFA500'; // برتقالي
        } else if (remaining === 0) {
            remainingCodesEl.style.color = '#FF4D4D'; // أحمر
        } else {
            remainingCodesEl.style.color = '#D4AF37'; // ذهبي
        }
    }

    // ===== تحميل البيانات المخزنة =====
    function loadStoredData() {
        try {
            const allTimeStored = localStorage.getItem('mm_codes_all_time');
            if (allTimeStored) {
                allTimeCodes = new Set(JSON.parse(allTimeStored));
            } else {
                allTimeCodes = new Set();
            }
            
            const dailyKey = `mm_codes_${today}`;
            const dailyStored = localStorage.getItem(dailyKey);
            
            if (dailyStored) {
                usedCodes = new Set(JSON.parse(dailyStored));
                console.log('أكواد اليوم:', Array.from(usedCodes));
            } else {
                usedCodes = new Set();
                console.log('يوم جديد - نبدأ من 1');
            }
            
            updateCurrentCode();
            updateRemainingCodes();
            
        } catch (e) {
            console.warn('فشل تحميل البيانات', e);
            usedCodes = new Set();
            allTimeCodes = new Set();
        }
    }

    // ===== حفظ أكواد اليوم =====
    function saveDailyCodes() {
        try {
            const dailyKey = `mm_codes_${today}`;
            localStorage.setItem(dailyKey, JSON.stringify(Array.from(usedCodes)));
            updateRemainingCodes();
        } catch (e) {
            console.warn('فشل حفظ أكواد اليوم', e);
        }
    }

    // ===== حفظ جميع الأكواد =====
    function saveAllTimeCodes() {
        try {
            localStorage.setItem('mm_codes_all_time', JSON.stringify(Array.from(allTimeCodes)));
        } catch (e) {
            console.warn('فشل حفظ جميع الأكواد', e);
        }
    }

    // ===== البحث عن الكود التالي المتاح =====
    function findNextAvailableCode() {
        let code = CONFIG.MIN_CODE;
        while (usedCodes.has(code.toString())) {
            code++;
        }
        return code;
    }

    // ===== تحديث الكود المعروض =====
    function updateCurrentCode() {
        const newCode = findNextAvailableCode();
        currentCode = newCode;
        if (codeDisplay) {
            codeDisplay.textContent = currentCode;
        }
    }

    // ===== التحقق من أن الكود متاح =====
    function isCodeAvailable(code) {
        return !usedCodes.has(code.toString());
    }

    // ===== معالجة تغيير المدخلات =====
    function handleInputChange() {
        const currentDisplayCode = codeDisplay.textContent;
        
        if (!isCodeAvailable(currentDisplayCode)) {
            const nextCode = findNextAvailableCode();
            codeDisplay.textContent = nextCode;
            currentCode = nextCode;
            
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

    // ===== معالجة الحجز (محدث مع إضافة التاريخ والوقت) =====
    const processBooking = (phoneNumber, name) => {
        if (!validateForm()) {
            return false;
        }
        
        const barberCode = codeDisplay.textContent;
        
        if (!isCodeAvailable(barberCode)) {
            codeError.classList.add('show');
            const newCode = findNextAvailableCode();
            codeDisplay.textContent = newCode;
            currentCode = newCode;
            
            setTimeout(() => {
                codeError.classList.remove('show');
            }, 3000);
            return false;
        }
        
        usedCodes.add(barberCode);
        saveDailyCodes();
        allTimeCodes.add(barberCode);
        saveAllTimeCodes();
        
        // الحصول على التاريخ والوقت الحالي
        const now = new Date();
        const date = now.toLocaleDateString('ar-EG'); // تنسيق: يوم/شهر/سنة
        const time = now.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }); // تنسيق: ساعة:دقيقة
        
        // إنشاء رسالة واتساب مع التاريخ والوقت
        let message = '';
        message += '🔹 *حجز حلاقة M&M* 🔹\n';
        message += '👤 *الاسم:* ' + inputs.firstName.value.trim() + ' ' + inputs.lastName.value.trim() + '\n';
        message += '📞 *الهاتف:* ' + inputs.phone.value.trim() + '\n';
        message += '✂️ *كود الحجز:* ' + barberCode + '\n';
        message += '📅 *تاريخ الحجز:* ' + date + '\n';
        message += '⏰ *وقت الحجز:* ' + time + '\n';
        message += '👨‍💼 *تم الإرسال إلى:* ' + name;
        
        window.open(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`, '_blank');
        
        inputs.firstName.value = '';
        inputs.lastName.value = '';
        inputs.phone.value = '';
        
        updateCurrentCode();
        
        if (parseInt(barberCode) > CONFIG.MAX_CODE_PER_DAY) {
            alert('تنبيه: تم تجاوز الـ 30 كود! الكود الحالي ' + barberCode);
        }
        
        return true;
    };

    // ===== المؤقت الزمني =====
    function startDailyTimer() {
        if (!dailyTimerEl) return;
        
        function updateTimer() {
            const now = new Date();
            const tomorrow = new Date(now);
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(0, 0, 0, 0);
            
            const timeRemaining = tomorrow - now;
            
            if (timeRemaining <= 0) {
                location.reload();
                return;
            }
            
            const hours = Math.floor(timeRemaining / (1000 * 60 * 60));
            const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000);
            
            const formattedHours = hours.toString().padStart(2, '0');
            const formattedMinutes = minutes.toString().padStart(2, '0');
            const formattedSeconds = seconds.toString().padStart(2, '0');
            
            dailyTimerEl.textContent = formattedHours + ':' + formattedMinutes + ':' + formattedSeconds;
        }
        
        updateTimer();
        setInterval(updateTimer, 1000);
    }

    // ===== التحقق من بداية يوم جديد =====
    function checkNewDay() {
        const lastVisitDate = localStorage.getItem('mm_last_visit_date');
        const today = getTodayDate();
        
        if (lastVisitDate && lastVisitDate !== today) {
            console.log('مرحباً بك في يوم جديد!');
        }
        
        localStorage.setItem('mm_last_visit_date', today);
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

    // ===== عداد الزيارات =====
    function initVisitorCounter() {
        let visitorCount = 0;
        
        try {
            const COUNTER_KEY = 'mm_visitor_counter';
            const SESSION_KEY = 'mm_session_counted';
            
            const stored = localStorage.getItem(COUNTER_KEY);
            if (stored) {
                visitorCount = parseInt(stored);
            }
            
            const sessionCounted = sessionStorage.getItem(SESSION_KEY);
            
            if (!sessionCounted) {
                visitorCount++;
                localStorage.setItem(COUNTER_KEY, visitorCount.toString());
                sessionStorage.setItem(SESSION_KEY, 'true');
            }
            
            if (visitorCountEl) {
                visitorCountEl.textContent = visitorCount;
            }
            
        } catch (e) {
            console.warn('فشل تحديث عداد الزيارات');
            if (visitorCountEl) {
                visitorCountEl.textContent = '0';
            }
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
        today = getTodayDate();
        loadStoredData();
        initVisitorCounter();
        startDailyTimer();
        checkNewDay();
        initLoader();
        
        console.log('تاريخ اليوم:', today);
        console.log('الأكواد المستخدمة اليوم:', usedCodes.size);
        console.log('الأكواد المتبقية:', CONFIG.MAX_CODE_PER_DAY - usedCodes.size);
    });

    // ===== فحص دوري للكود =====
    setInterval(() => {
        const newToday = getTodayDate();
        if (newToday !== today) {
            console.log('تم تغيير التاريخ - يوم جديد');
            location.reload();
        }
        
        const disp = codeDisplay.textContent;
        if (!isCodeAvailable(disp)) {
            const nextCode = findNextAvailableCode();
            codeDisplay.textContent = nextCode;
            currentCode = nextCode;
            codeError.classList.add('show');
            
            setTimeout(() => {
                codeError.classList.remove('show');
            }, 3000);
        }
        
        updateRemainingCodes();
        
    }, 5000);

})();
