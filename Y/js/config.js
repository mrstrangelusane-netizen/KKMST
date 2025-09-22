// Firebase Configuration
export const firebaseConfig = {
    apiKey: "AIzaSyDCw7cZcRQi_H4yOIJabIqHwMADE_M_4Co",
    authDomain: "kkss-c9290.firebaseapp.com",
    projectId: "kkss-c9290",
    storageBucket: "kkss-c9290.firebasestorage.app",
    messagingSenderId: "319730706655",
    appId: "1:319730706655:web:fe21f5201eecefd8f0e16a",
    measurementId: "G-28NJFT2NK0"
};

// App Configuration
export const appConfig = {
    appId: "kkss-app",
    defaultTechnicians: ['ကိုကျော်', 'မောင်မောင်', 'မေသန္တာ', 'စိုးသူ', 'ထွန်းထွန်း', 'အေးမင်း'],
    cacheExpiry: 5 * 60 * 1000, // 5 minutes
    maxOfflineQueue: 100,
    chartColors: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']
};

// Error Messages
export const errorMessages = {
    network: "အင်တာနက် ချိတ်ဆက်မှု ပြတ်တောက်ပါသည်။",
    auth: "အကောင့်ဝင်ရန် လိုအပ်ပါသည်။",
    validation: "ကျေးဇူးပြု၍ လိုအပ်သော အချက်အလက်များ ဖြည့်သွင်းပါ။",
    firebase: "Firebase ချိတ်ဆက်မှု အမှားတစ်ခု ဖြစ်ပွားပါသည်။",
    generic: "အမှားတစ်ခု ဖြစ်ပွားပါသည်။"
};

// Success Messages
export const successMessages = {
    voucherAdded: "Voucher ထည့်သွင်းပြီးပါပြီ။",
    voucherUpdated: "Voucher ကို ပြင်ဆင်ပြီးပါပြီ။",
    voucherDeleted: "Voucher ဖျက်ပြီးပါပြီ။",
    technicianAdded: "Technician အသစ် ထည့်သွင်းပြီးပါပြီ။",
    technicianUpdated: "နာမည် ပြင်ဆင်ပြီးပါပြီ။",
    technicianDeleted: "Technician ဖျက်ပြီးပါပြီ။",
    backupCreated: "Backup ဖန်တီးပြီးပါပြီ။",
    dataRestored: "ဒေတာ restore လုပ်ပြီးပါပြီ။",
    syncComplete: "ဒေတာ ချိတ်ဆက်ပြီးပါပြီ။"
};

