// Global değişkenler
let employeeData = [];
let weeklyReportData = [];

// Sayfa yüklendiğinde
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Güncel tarihi göster
    updateCurrentDate();
    
    // Event listener'ları ekle
    document.getElementById('excelFile').addEventListener('change', handleFileUpload);
    document.getElementById('generateReport').addEventListener('click', generateWeeklyReport);
    document.getElementById('printReport').addEventListener('click', printReport);
    
    // Varsayılan tarih aralığını ayarla
    setDefaultDateRange();
}

function updateCurrentDate() {
    const now = new Date();
    const options = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        weekday: 'long'
    };
    document.getElementById('currentDate').textContent = now.toLocaleDateString('tr-TR', options);
}

function setDefaultDateRange() {
    const today = new Date();
    const startDate = new Date('2025-07-21'); // Kullanıcının belirttiği başlangıç tarihi
    const endDate = new Date('2025-09-08'); // Kullanıcının belirttiği bitiş tarihi
    
    document.getElementById('startDate').value = formatDateForInput(startDate);
    document.getElementById('endDate').value = formatDateForInput(endDate);
}

function formatDateForInput(date) {
    return date.toISOString().split('T')[0];
}

function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // Dosya bilgisini göster
    document.getElementById('fileName').textContent = file.name;
    document.getElementById('fileInfo').style.display = 'flex';
    
    // Excel dosyasını oku
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            
            // İlk sayfayı al
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            
            processExcelData(jsonData);
            
            // Rapor bölümünü göster
            document.getElementById('reportSection').style.display = 'block';
            
        } catch (error) {
            alert('Excel dosyası okunurken hata oluştu: ' + error.message);
        }
    };
    
    reader.readAsArrayBuffer(file);
}

function processExcelData(data) {
    if (data.length < 2) {
        alert('Excel dosyası geçersiz veya boş.');
        return;
    }
    
    const headers = data[0];
    const rows = data.slice(1);
    
    console.log('Excel headers:', headers);
    console.log('Raw data rows:', rows.length);
    
    // Excel dosyasındaki personelleri sırasıyla işle (orijinal sıralama korunacak)
    employeeData = rows.map((row, index) => {
        console.log(`\n--- Personel ${index + 1} ---`);
        console.log(`Satır verisi:`, row);
        
        const employee = {
            name: row[0] || '',
            originalIndex: index, // Excel dosyasındaki orijinal sıra
            adminLeaveStart: null,
            adminLeaveEnd: null,
            annualLeaveStart: null,
            annualLeaveEnd: null,
            annualLeaveDays: parseInt(row[6]) || 0,  // Sütun 6: KAÇ GÜN?
            workStartDate: null
        };
        
        if (employee.name) {
            console.log(`  İsim: ${employee.name}`);
            
            // İdari izin başlangıç (Sütun 2 = index 1)
            console.log(`  İdari izin başlangıç parse ediliyor...`);
            employee.adminLeaveStart = parseExcelDate(row[1]);
            
            // İdari izin bitiş (Sütun 3 = index 2)
            console.log(`  İdari izin bitiş parse ediliyor...`);
            employee.adminLeaveEnd = parseExcelDate(row[2], employee.adminLeaveStart);
            
            // Yıllık izin başlangıç (Sütun 5 = index 4)
            console.log(`  Yıllık izin başlangıç parse ediliyor...`);
            employee.annualLeaveStart = parseExcelDate(row[4]);
            
            // Yıllık izin bitiş (Sütun 6 = index 5)
            console.log(`  Yıllık izin bitiş parse ediliyor...`);
            employee.annualLeaveEnd = parseExcelDate(row[5]);
            
            // İş başlama (Sütun 8 = index 7)
            console.log(`  İş başlama tarihi parse ediliyor...`);
            employee.workStartDate = parseExcelDate(row[7]);
            
            console.log(`  ✅ ${employee.name} özeti:`);
            console.log(`    İdari izin: ${employee.adminLeaveStart ? `${employee.adminLeaveStart.toLocaleDateString('tr-TR')} - ${employee.adminLeaveEnd?.toLocaleDateString('tr-TR')}` : 'Yok'}`);
            console.log(`    Yıllık izin: ${employee.annualLeaveStart ? `${employee.annualLeaveStart.toLocaleDateString('tr-TR')} - ${employee.annualLeaveEnd?.toLocaleDateString('tr-TR')}` : 'Yok'}`);
            console.log(`    İş başlama: ${employee.workStartDate ? employee.workStartDate.toLocaleDateString('tr-TR') : 'Belirtilmemiş'}`);
        }
        
        return employee;
    }).filter(emp => emp.name); // Boş isimleri filtrele
    
    console.log(`Toplam ${employeeData.length} personel işlendi`);
}

function parseExcelDate(value, baseDate = null) {
    if (!value) {
        console.log(`    Boş tarih değeri: ${value}`);
        return null;
    }
    
    console.log(`    Tarih parse ediliyor: "${value}" (tip: ${typeof value})`);
    
    // Önce Date objesi mi kontrol et
    if (value instanceof Date) {
        console.log(`    Date objesi parse edildi: ${value.toLocaleDateString('tr-TR')}`);
        return value;
    }
    
    // Excel tarih numarası (SheetJS genellikle bunları verir)
    if (typeof value === 'number') {
        const date = new Date((value - 25569) * 86400 * 1000);
        console.log(`    Excel numarası parse edildi: ${value} -> ${date.toLocaleDateString('tr-TR')}`);
        return date;
    }
    
    // Excel formüllerini kontrol et (=B7+4 gibi)
    if (typeof value === 'string' && value.startsWith('=')) {
        console.log(`    Excel formülü tespit edildi: ${value}`);
        
        // =B7+4 gibi basit toplama formülleri için
        const addMatch = value.match(/^=.+?\+(\d+)$/);
        if (addMatch && baseDate) {
            const addDays = parseInt(addMatch[1]);
            const result = new Date(baseDate);
            result.setDate(result.getDate() + addDays);
            console.log(`    Formül hesaplandı: ${value} = ${baseDate.toLocaleDateString('tr-TR')} + ${addDays} gün = ${result.toLocaleDateString('tr-TR')}`);
            return result;
        }
        
        // Excel'in WORKDAY formülü için =TEXT(WORKDAY(F7,1),...) gibi
        const workdayMatch = value.match(/WORKDAY\(.+?,(\d+)\)/);
        if (workdayMatch && baseDate) {
            const workDaysToAdd = parseInt(workdayMatch[1]);
            const result = new Date(baseDate);
            // İş günü hesaplama
            let daysAdded = 0;
            let currentDate = new Date(result);
            while (daysAdded < workDaysToAdd) {
                currentDate.setDate(currentDate.getDate() + 1);
                if (!isWeekend(currentDate)) {
                    daysAdded++;
                }
            }
            console.log(`    WORKDAY formülü hesaplandı: ${value} = ${baseDate.toLocaleDateString('tr-TR')} + ${workDaysToAdd} iş günü = ${currentDate.toLocaleDateString('tr-TR')}`);
            return currentDate;
        }
        
        console.log(`    Formül parse edilemedi, null döndürülüyor`);
        return null;
    } 
    
    // String formatları
    if (typeof value === 'string') {
        const cleanValue = value.trim();
        
        // "DD.MM.YYYY Pazartesi" formatını kontrol et
        if (cleanValue.includes('.')) {
            const datePart = cleanValue.split(' ')[0]; // Sadece tarih kısmını al
            const [day, month, year] = datePart.split('.');
            if (day && month && year) {
                const parsedDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
                console.log(`    DD.MM.YYYY formatı parse edildi: ${cleanValue} -> ${parsedDate.toLocaleDateString('tr-TR')}`);
                return parsedDate;
            }
        }
        
        // "DD Ay YYYY" formatını kontrol et
        const parts = cleanValue.split(' ');
        if (parts.length >= 3) {
            const day = parseInt(parts[0]);
            const monthName = parts[1];
            const year = parseInt(parts[2]);
            
            console.log(`    Tarih parçaları: Gün=${day}, Ay=${monthName}, Yıl=${year}`);
            
            const months = {
                'Ocak': 0, 'Şubat': 1, 'Mart': 2, 'Nisan': 3,
                'Mayıs': 4, 'Haziran': 5, 'Temmuz': 6, 'Ağustos': 7,
                'Eylül': 8, 'Ekim': 9, 'Kasım': 10, 'Aralık': 11
            };
            
            if (months.hasOwnProperty(monthName)) {
                const parsedDate = new Date(year, months[monthName], day);
                console.log(`    Türkçe tarih parse edildi: ${cleanValue} -> ${parsedDate.toLocaleDateString('tr-TR')}`);
                return parsedDate;
            } else {
                console.warn(`    Bilinmeyen ay adı: ${monthName}`);
            }
        }
        
        // ISO tarih formatını dene
        const isoDate = new Date(cleanValue);
        if (!isNaN(isoDate.getTime())) {
            console.log(`    ISO tarih parse edildi: ${cleanValue} -> ${isoDate.toLocaleDateString('tr-TR')}`);
            return isoDate;
        }
    }
    
    console.error(`    Tarih parse edilemedi: "${value}"`);
    return null;
}

function generateWeeklyReport() {
    const startDateInput = document.getElementById('startDate').value;
    const endDateInput = document.getElementById('endDate').value;
    
    if (!startDateInput || !endDateInput) {
        alert('Lütfen başlangıç ve bitiş tarihlerini seçin.');
        return;
    }
    
    const startDate = new Date(startDateInput);
    const endDate = new Date(endDateInput);
    
    if (startDate >= endDate) {
        alert('Başlangıç tarihi bitiş tarihinden önce olmalıdır.');
        return;
    }
    
    // Pazartesi gününden başlayacak şekilde ayarla
    const reportStartDate = getMonday(startDate);
    
    weeklyReportData = generateWeeklyData(reportStartDate, endDate);
    displayWeeklyReport(startDate, endDate);
    
    // Yazdır butonunu göster
    document.getElementById('printReport').style.display = 'inline-flex';
    document.getElementById('resultsSection').style.display = 'block';
}

function getMonday(date) {
    const newDate = new Date(date); // Orijinal tarihi kopyala
    const day = newDate.getDay();
    const diff = newDate.getDate() - day + (day === 0 ? -6 : 1); // Pazartesi
    newDate.setDate(diff);
    return newDate;
}

function generateWeeklyData(startDate, endDate) {
    const weeks = [];
    const currentDate = new Date(startDate);
    
    console.log(`Rapor dönemi: ${startDate.toLocaleDateString('tr-TR')} - ${endDate.toLocaleDateString('tr-TR')}`);
    
    while (currentDate <= endDate) {
        const weekStart = new Date(currentDate);
        const weekEnd = new Date(currentDate);
        weekEnd.setDate(weekEnd.getDate() + 6); // Pazar günü
        
        console.log(`\n\n🗓️ === ${getWeekTitle(weekStart)} HAFTASI ===`);
        console.log(`📅 Tarih Aralığı: ${weekStart.toLocaleDateString('tr-TR')} (Pazartesi) - ${weekEnd.toLocaleDateString('tr-TR')} (Pazar)`);
        console.log(`👥 Personel kontrolleri başlıyor...`);
        
        const employeesNotOnLeave = getEmployeesNotOnLeave(weekStart, weekEnd);
        
        console.log(`\n📊 ${getWeekTitle(weekStart)} HAFTASI ÖZETI:`);
        console.log(`   👥 Toplam personel: ${employeeData.length}`);
        console.log(`   ✅ Çalışan personel: ${employeesNotOnLeave.length}`);
        console.log(`   ❌ İzinde olan personel: ${employeeData.length - employeesNotOnLeave.length}`);
        console.log(`   📝 Çalışan personeller: ${employeesNotOnLeave.map(emp => emp.name).join(', ') || 'YOK'}`);
        
        weeks.push({
            weekStart: new Date(weekStart),
            weekEnd: new Date(weekEnd),
            employees: employeesNotOnLeave
        });
        
        // Bir sonraki hafta
        currentDate.setDate(currentDate.getDate() + 7);
    }
    
    return weeks;
}

function getEmployeesNotOnLeave(weekStart, weekEnd) {
    console.log(`\n🗓️ ${weekStart.toLocaleDateString('tr-TR')} - ${weekEnd.toLocaleDateString('tr-TR')} haftası için DETAYLI personel kontrolü:`);
    
    const workingEmployees = [];
    const onLeaveEmployees = [];
    
    employeeData.forEach(employee => {
        console.log(`\n👤 ${employee.name} kontrol ediliyor:`);
        console.log(`  Yıllık İzin: ${employee.annualLeaveStart ? employee.annualLeaveStart.toLocaleDateString('tr-TR') : 'Yok'} - ${employee.annualLeaveEnd ? employee.annualLeaveEnd.toLocaleDateString('tr-TR') : 'Yok'}`);
        console.log(`  İdari İzin: ${employee.adminLeaveStart ? employee.adminLeaveStart.toLocaleDateString('tr-TR') : 'Yok'} - ${employee.adminLeaveEnd ? employee.adminLeaveEnd.toLocaleDateString('tr-TR') : 'Yok'}`);
        console.log(`  İş Başlama: ${employee.workStartDate ? employee.workStartDate.toLocaleDateString('tr-TR') : 'Belirtilmemiş'}`);
        
        const isOnLeave = isEmployeeOnLeave(employee, weekStart, weekEnd);
        
        if (isOnLeave) {
            onLeaveEmployees.push(employee.name);
            console.log(`  ➡️ SONUÇ: İZİNDE`);
        } else {
            workingEmployees.push(employee);
            console.log(`  ➡️ SONUÇ: ÇALIŞIYOR`);
        }
    });
    
    console.log(`\n📋 Bu hafta sonuçları:`);
    console.log(`   ❌ İzinde olan personeller: ${onLeaveEmployees.join(', ') || 'YOK'}`);
    console.log(`   ✅ Çalışan personeller: ${workingEmployees.map(emp => emp.name).join(', ') || 'YOK'}`);
    
    // Excel dosyasındaki orijinal sırayı korumak için originalIndex'e göre sırala
    workingEmployees.sort((a, b) => a.originalIndex - b.originalIndex);
    console.log(`   📋 Excel sıralaması korundu: ${workingEmployees.map(emp => `${emp.name} (#${emp.originalIndex + 1})`).join(', ') || 'YOK'}`);
    
    return workingEmployees;
}

function isEmployeeOnLeave(employee, weekStart, weekEnd) {
    console.log(`\n${employee.name} kontrol ediliyor (${weekStart.toLocaleDateString('tr-TR')} - ${weekEnd.toLocaleDateString('tr-TR')} haftası):`);
    
    // Personelin birleştirilmiş izin dönemlerini al
    const mergedLeaves = getMergedLeavePeriodsForEmployee(employee);
    
    if (mergedLeaves.length === 0) {
        console.log(`  📅 Birleştirilmiş izin dönemleri: İzin yok`);
        
        // İzin yoksa, işe başlama tarihi kontrolü yap
        if (employee.workStartDate) {
            if (employee.workStartDate > weekEnd) {
                console.log(`  ❌ Henüz işe başlamamış (İş başlama: ${employee.workStartDate.toLocaleDateString('tr-TR')})`);
                return true;
            } else {
                console.log(`  ✓ İş başlamış (İş başlama: ${employee.workStartDate.toLocaleDateString('tr-TR')})`);
                console.log(`  ✅ ${employee.name} bu hafta ÇALIŞIYOR`);
                return false;
            }
        } else {
            console.log(`  ✅ ${employee.name} bu hafta ÇALIŞIYOR (iş başlama tarihi belirtilmemiş)`);
            return false;
        }
    }
    
    console.log(`  📅 Birleştirilmiş izin dönemleri:`);
    
    // Önce herhangi bir izin dönemi ile kesişip kesişmediğini kontrol et
    for (const leavePeriod of mergedLeaves) {
        console.log(`    ${leavePeriod.start.toLocaleDateString('tr-TR')} - ${leavePeriod.end.toLocaleDateString('tr-TR')} (${leavePeriod.types.join(' + ')})`);
        
        if (hasLeaveInWeek(leavePeriod.start, leavePeriod.end, weekStart, weekEnd)) {
            console.log(`  ❌ ${employee.name} bu hafta İZİNDE (${leavePeriod.types.join(' + ')})`);
            return true;
        }
    }
    
    // İzin dönemleri ile kesişmiyorsa, pozisyon analizi yap
    const firstLeaveStart = mergedLeaves[0].start;
    const lastLeaveEnd = mergedLeaves[mergedLeaves.length - 1].end;
    
    console.log(`  🔍 Pozisyon analizi:`);
    console.log(`    İlk izin başlangıcı: ${firstLeaveStart.toLocaleDateString('tr-TR')}`);
    console.log(`    Son izin bitişi: ${lastLeaveEnd.toLocaleDateString('tr-TR')}`);
    console.log(`    Bu hafta: ${weekStart.toLocaleDateString('tr-TR')} - ${weekEnd.toLocaleDateString('tr-TR')}`);
    
    if (weekEnd < firstLeaveStart) {
        // Hafta, ilk izin başlangıcından önce - çalışıyor olmalı
        console.log(`  ✅ İlk izin başlangıcından ÖNCE - ${employee.name} bu hafta ÇALIŞIYOR`);
        return false;
    } else if (weekStart > lastLeaveEnd) {
        // Hafta, son izin bitişinden sonra - iş başlama tarihi kontrolü
        console.log(`  🔍 Son izin bitişinden SONRA - iş başlama tarihi kontrolü yapılıyor`);
        if (employee.workStartDate) {
            if (employee.workStartDate > weekEnd) {
                console.log(`  ❌ Henüz işe başlamamış (İş başlama: ${employee.workStartDate.toLocaleDateString('tr-TR')})`);
                return true;
            } else {
                console.log(`  ✓ İş başlamış (İş başlama: ${employee.workStartDate.toLocaleDateString('tr-TR')})`);
                console.log(`  ✅ ${employee.name} bu hafta ÇALIŞIYOR`);
                return false;
            }
        } else {
            console.log(`  ✅ ${employee.name} bu hafta ÇALIŞIYOR (iş başlama tarihi belirtilmemiş)`);
            return false;
        }
    } else {
        // Hafta, izin dönemleri arasında - bu durumda çalışmıyor olmalı
        // (çünkü izinler birleştirilmiş, aralarında boşluk olmamalı)
        console.log(`  ❌ İzin dönemleri arasında kaldı - ${employee.name} bu hafta İZİNDE`);
        return true;
    }
}

function hasLeaveInWeek(leaveStart, leaveEnd, weekStart, weekEnd) {
    // İzin tarihleri ile hafta aralığının kesişip kesişmediğini kontrol et
    // Basit mantık: İzin başlangıcı hafta bitişinden önce VE izin bitişi hafta başlangıcından sonra
    
    const hasOverlap = leaveStart <= weekEnd && leaveEnd >= weekStart;
    
    console.log(`    Kontrol: İzin [${leaveStart.toLocaleDateString('tr-TR')} - ${leaveEnd.toLocaleDateString('tr-TR')}] vs Hafta [${weekStart.toLocaleDateString('tr-TR')} - ${weekEnd.toLocaleDateString('tr-TR')}]`);
    console.log(`    İzin başlangıcı <= Hafta bitişi: ${leaveStart.toLocaleDateString('tr-TR')} <= ${weekEnd.toLocaleDateString('tr-TR')} = ${leaveStart <= weekEnd}`);
    console.log(`    İzin bitişi >= Hafta başlangıcı: ${leaveEnd.toLocaleDateString('tr-TR')} >= ${weekStart.toLocaleDateString('tr-TR')} = ${leaveEnd >= weekStart}`);
    console.log(`    Kesişim var mı: ${hasOverlap}`);
    
    return hasOverlap;
}

// Eski fonksiyonu da tutuyoruz uyumluluk için
function isDateRangeOverlap(leaveStart, leaveEnd, weekStart, weekEnd) {
    return hasLeaveInWeek(leaveStart, leaveEnd, weekStart, weekEnd);
}

function getMergedLeavePeriodsForEmployee(employee) {
    console.log(`    🔍 ${employee.name} için izin birleştirme analizi:`);
    
    const leavePerods = [];
    
    // İdari izin dönemini ekle
    if (employee.adminLeaveStart && employee.adminLeaveEnd) {
        const adminPeriod = {
            start: new Date(employee.adminLeaveStart),
            end: new Date(employee.adminLeaveEnd),
            type: 'İdari İzin'
        };
        leavePerods.push(adminPeriod);
        console.log(`      ➕ İdari İzin eklendi: ${adminPeriod.start.toLocaleDateString('tr-TR')} - ${adminPeriod.end.toLocaleDateString('tr-TR')}`);
    }
    
    // Yıllık izin dönemini ekle
    if (employee.annualLeaveStart && employee.annualLeaveEnd) {
        const annualPeriod = {
            start: new Date(employee.annualLeaveStart),
            end: new Date(employee.annualLeaveEnd),
            type: 'Yıllık İzin'
        };
        leavePerods.push(annualPeriod);
        console.log(`      ➕ Yıllık İzin eklendi: ${annualPeriod.start.toLocaleDateString('tr-TR')} - ${annualPeriod.end.toLocaleDateString('tr-TR')}`);
    }
    
    if (leavePerods.length === 0) {
        console.log(`      ℹ️ Hiç izin yok`);
        return [];
    }
    
    if (leavePerods.length === 1) {
        console.log(`      ℹ️ Tek izin dönemi var, birleştirme gerekmiyor`);
        return [{
            start: leavePerods[0].start,
            end: leavePerods[0].end,
            types: [leavePerods[0].type]
        }];
    }
    
    // Tarihe göre sırala
    leavePerods.sort((a, b) => a.start - b.start);
    console.log(`      📅 Tarih sırasına göre sıralandı:`);
    leavePerods.forEach((period, index) => {
        console.log(`        ${index + 1}. ${period.type}: ${period.start.toLocaleDateString('tr-TR')} - ${period.end.toLocaleDateString('tr-TR')}`);
    });
    
    // Ardışık izinleri birleştir
    const merged = [];
    let current = {
        start: new Date(leavePerods[0].start),
        end: new Date(leavePerods[0].end),
        types: [leavePerods[0].type]
    };
    
    console.log(`      🔄 Birleştirme işlemi başlıyor...`);
    console.log(`        Başlangıç dönemi: ${current.start.toLocaleDateString('tr-TR')} - ${current.end.toLocaleDateString('tr-TR')} (${current.types[0]})`);
    
    for (let i = 1; i < leavePerods.length; i++) {
        const nextPeriod = leavePerods[i];
        console.log(`        🔍 Kontrol ediliyor: ${nextPeriod.type} (${nextPeriod.start.toLocaleDateString('tr-TR')} - ${nextPeriod.end.toLocaleDateString('tr-TR')})`);
        
        // Detaylı tarih analizi
        const currentEndDay = current.end.getDay(); // 0=Pazar, 1=Pazartesi, ..., 6=Cumartesi
        const nextStartDay = nextPeriod.start.getDay();
        
        console.log(`          Mevcut izin bitiş günü: ${current.end.toLocaleDateString('tr-TR')} (${getDayName(currentEndDay)})`);
        console.log(`          Sonraki izin başlangıç günü: ${nextPeriod.start.toLocaleDateString('tr-TR')} (${getDayName(nextStartDay)})`);
        
        // Mevcut izin bitişi ile bir sonraki izin başlangıcı arasında kaç iş günü var?
        const daysBetween = getWorkDaysBetween(current.end, nextPeriod.start);
        console.log(`          Aralarındaki iş günü sayısı: ${daysBetween}`);
        
        if (daysBetween <= 1) {
            // Ardışık izinler - birleştir
            console.log(`          ✅ Ardışık izinler tespit edildi - BİRLEŞTİRİLİYOR`);
            current.end = new Date(nextPeriod.end);
            current.types.push(nextPeriod.type);
            console.log(`          📝 Güncel birleşik dönem: ${current.start.toLocaleDateString('tr-TR')} - ${current.end.toLocaleDateString('tr-TR')} (${current.types.join(' + ')})`);
        } else {
            // Ayrık izinler - mevcut dönem kaydet ve yeni dönem başlat
            console.log(`          ❌ Ayrık izinler tespit edildi - AYRI DÖNEM`);
            merged.push({
                start: new Date(current.start),
                end: new Date(current.end),
                types: [...current.types]
            });
            console.log(`          💾 Kaydedilen dönem: ${current.start.toLocaleDateString('tr-TR')} - ${current.end.toLocaleDateString('tr-TR')} (${current.types.join(' + ')})`);
            
            current = {
                start: new Date(nextPeriod.start),
                end: new Date(nextPeriod.end),
                types: [nextPeriod.type]
            };
            console.log(`          🆕 Yeni dönem başlatıldı: ${current.start.toLocaleDateString('tr-TR')} - ${current.end.toLocaleDateString('tr-TR')} (${current.types[0]})`);
        }
    }
    
    // Son dönem kaydet
    merged.push({
        start: new Date(current.start),
        end: new Date(current.end),
        types: [...current.types]
    });
    
    console.log(`      ✅ Birleştirme tamamlandı. Toplam ${merged.length} dönem:`);
    merged.forEach((period, index) => {
        console.log(`        ${index + 1}. ${period.start.toLocaleDateString('tr-TR')} - ${period.end.toLocaleDateString('tr-TR')} (${period.types.join(' + ')})`);
    });
    
    return merged;
}

function getDayName(dayIndex) {
    const days = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
    return days[dayIndex];
}

function getWorkDaysBetween(date1, date2) {
    // date1'den date2'ye kadar kaç iş günü var (date1 ve date2 dahil değil)
    const start = new Date(date1);
    const end = new Date(date2);
    
    start.setDate(start.getDate() + 1); // Ertesi gün
    end.setDate(end.getDate() - 1); // Önceki gün
    
    if (start > end) {
        return 0; // Hiç gün yok veya negatif
    }
    
    let workDays = 0;
    const currentDate = new Date(start);
    
    while (currentDate <= end) {
        if (!isWeekend(currentDate)) {
            workDays++;
        }
        currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return workDays;
}

function getNextWorkDay(date) {
    const nextDay = new Date(date);
    
    // Hafta sonu ise bir sonraki Pazartesi'yi bul
    while (isWeekend(nextDay)) {
        nextDay.setDate(nextDay.getDate() + 1);
    }
    
    return nextDay;
}



function displayWeeklyReport(startDate, endDate) {
    const reportDateRange = document.getElementById('reportDateRange');
    const totalEmployees = document.getElementById('totalEmployees');
    const weeklyReports = document.getElementById('weeklyReports');
    
    // Rapor bilgilerini güncelle
    reportDateRange.textContent = `${formatDate(startDate)} - ${formatDate(endDate)}`;
    totalEmployees.textContent = `Toplam ${employeeData.length} Personel`;
    
    // İlk sayfa: Personel listesi ve izin detayları
    weeklyReports.innerHTML = '';
    
    // İlk sayfa oluştur
    const firstPageDiv = document.createElement('div');
    firstPageDiv.className = 'first-page';
    firstPageDiv.innerHTML = createFirstPageContent();
    weeklyReports.appendChild(firstPageDiv);
    
    // Haftalık raporlar için ayrı grid container
    const weeklyGridDiv = document.createElement('div');
    weeklyGridDiv.className = 'weekly-grid';
    
    // Haftalık raporları oluştur
    weeklyReportData.forEach((week, index) => {
        const weekDiv = document.createElement('div');
        weekDiv.className = 'week-report';
        
        const weekHeaderHtml = `
            <div class="week-header">
                <div class="week-title">
                    <i class="fas fa-calendar-week"></i>
                    ${getWeekTitle(week.weekStart)} Haftası
                </div>
                <div class="week-dates">
                    ${formatDate(week.weekStart)} - ${formatDate(week.weekEnd)}
                </div>
                <div class="employee-count">
                    ${week.employees.length} Personel
                </div>
            </div>
        `;
        
        let weekContentHtml = '';
        
        if (week.employees.length === 0) {
            weekContentHtml = `
                <div class="empty-week">
                    <i class="fas fa-user-slash"></i>
                    <div>Bu hafta çalışan personel bulunmamaktadır.</div>
                </div>
            `;
        } else {
            weekContentHtml = `
                <div class="employee-grid">
                    ${week.employees.map((employee, index) => {
                        const leaveDays = getEmployeeLeaveDays(employee);
                        return `
                        <div class="employee-card">
                            <div class="employee-name">${index + 1}. ${employee.name}</div>
                            <div class="employee-leave-info">
                                <div class="leave-detail">
                                    <i class="fas fa-calendar-times"></i>
                                    Yıllık: ${leaveDays.annualDays} gün
                                </div>
                                <div class="leave-detail">
                                    <i class="fas fa-calendar-minus"></i>
                                    İdari: ${leaveDays.adminDays} gün
                                </div>
                            </div>
                            <div class="employee-status">Aktif Çalışan</div>
                        </div>
                    `;
                    }).join('')}
                </div>
            `;
        }
        
        weekDiv.innerHTML = weekHeaderHtml + weekContentHtml;
        weeklyGridDiv.appendChild(weekDiv);
    });
    
    // Grid'i ana container'a ekle
    weeklyReports.appendChild(weeklyGridDiv);
}

function getWeekTitle(date) {
    const day = date.getDate();
    const month = date.toLocaleDateString('tr-TR', { month: 'long' });
    return `${day} ${month}`;
}

function formatDate(date) {
    return date.toLocaleDateString('tr-TR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    });
}

function printReport() {
    // Kullanıcıya yazdırma ayarları konusunda bilgi ver
    const printInfo = confirm(
        'Yazdırma sırasında en iyi sonuç için:\n\n' +
        '1. Yazdırma menüsünde "Diğer ayarlar" bölümünü açın\n' +
        '2. "Başlık ve altbilgiler" seçeneğini KAPATIN\n' +
        '3. Sayfaya sığdır veya %100 ölçek kullanın\n\n' +
        'Devam etmek istiyor musunuz?'
    );
    
    if (printInfo) {
        window.print();
    }
}

// Yardımcı fonksiyonlar
function addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

function isWeekend(date) {
    const day = date.getDay();
    return day === 0 || day === 6; // Pazar veya Cumartesi
}

// İzin gün sayısını hesaplayan fonksiyonlar
function calculateLeaveDays(startDate, endDate) {
    if (!startDate || !endDate) return 0;
    
    let totalDays = 0;
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
        if (!isWeekend(currentDate)) {
            totalDays++;
        }
        currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return totalDays;
}

function getEmployeeLeaveDays(employee) {
    const adminDays = calculateLeaveDays(employee.adminLeaveStart, employee.adminLeaveEnd);
    const annualDays = calculateLeaveDays(employee.annualLeaveStart, employee.annualLeaveEnd);
    
    return {
        adminDays: adminDays,
        annualDays: annualDays,
        totalDays: adminDays + annualDays
    };
}

function createFirstPageContent() {
    // Personelleri orijinal sıraya göre sırala
    const sortedEmployees = [...employeeData].sort((a, b) => a.originalIndex - b.originalIndex);
    
    const employeeListHtml = sortedEmployees.map((employee, index) => {
        const formatDateOrEmpty = (date) => {
            return date ? date.toLocaleDateString('tr-TR', { 
                day: '2-digit', 
                month: 'long', 
                year: 'numeric' 
            }) : 'Belirtilmemiş';
        };
        
        return `
            <div class="employee-summary-card">
                <div class="employee-summary-header">
                    <div class="employee-number">${index + 1}</div>
                    <div class="employee-summary-name">${employee.name}</div>
                </div>
                <div class="employee-summary-details">
                    <div class="summary-detail-row">
                        <div class="detail-label">
                            <i class="fas fa-plane-departure"></i>
                            Yıllık İzin Başlangıç
                        </div>
                        <div class="detail-value">${formatDateOrEmpty(employee.annualLeaveStart)}</div>
                    </div>
                    <div class="summary-detail-row">
                        <div class="detail-label">
                            <i class="fas fa-plane-arrival"></i>
                            Yıllık İzin Bitiş
                        </div>
                        <div class="detail-value">${formatDateOrEmpty(employee.annualLeaveEnd)}</div>
                    </div>
                    <div class="summary-detail-row">
                        <div class="detail-label">
                            <i class="fas fa-briefcase"></i>
                            İşe Başlama Tarihi
                        </div>
                        <div class="detail-value">${formatDateOrEmpty(employee.workStartDate)}</div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    return `
        <div class="first-page-header">
            <div class="page-title">
                <i class="fas fa-users"></i>
                Personel İzin Özeti
            </div>
            <div class="page-subtitle">
                Yüklenen ${employeeData.length} personelin izin detayları
            </div>
        </div>
        <div class="employee-summary-grid">
            ${employeeListHtml}
        </div>
    `;
}

function getWorkDaysInWeek(startDate, endDate) {
    const workDays = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
        if (!isWeekend(currentDate)) {
            workDays.push(new Date(currentDate));
        }
        currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return workDays;
} 