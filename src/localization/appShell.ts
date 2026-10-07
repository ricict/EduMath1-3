import type { Locale } from './index';

export type AppShellMessageKey =
  | 'nav.progress'
  | 'nav.settings'
  | 'nav.practice'
  | 'practice.invalidGrade'
  | 'practice.backHome'
  | 'home.eyebrow'
  | 'home.subtitle'
  | 'home.viewProgress'
  | 'home.openSettings'
  | 'home.gradeTitle'
  | 'home.gradeDescription'
  | 'home.practice'
  | 'home.selected'
  | 'home.resumeNote'
  | 'gradeSwitch.blockedTitle'
  | 'gradeSwitch.blockedMessage'
  | 'gradeSwitch.ok'
  | 'progress.eyebrow'
  | 'progress.title'
  | 'progress.subtitle'
  | 'progress.completedSessions'
  | 'progress.completedQuestions'
  | 'progress.masteredCount'
  | 'progress.mastered'
  | 'progress.inProgress'
  | 'progress.notStarted'
  | 'progress.nextAvailable'
  | 'progress.gradeComplete'
  | 'progress.nextUnavailable'
  | 'progress.noActivity'
  | 'progress.loading'
  | 'progress.error'
  | 'progress.retry'
  | 'settings.eyebrow'
  | 'settings.title'
  | 'settings.subtitle'
  | 'settings.languageTitle'
  | 'settings.languageDescription'
  | 'settings.gradeTitle'
  | 'settings.gradeDescription'
  | 'settings.selected'
  | 'settings.storageError';

const messages: Readonly<
  Record<Locale, Readonly<Record<AppShellMessageKey, string>>>
> = {
  en: {
    'nav.progress': 'Progress',
    'nav.settings': 'Settings',
    'nav.practice': 'Grade {grade} Practice',
    'practice.invalidGrade': 'Choose a valid Grade 1–3 practice path.',
    'practice.backHome': 'Back to home',
    'home.eyebrow': 'EduMath Grade 1–3',
    'home.subtitle':
      'Choose your grade. EduMath will use your learning path to select the next available practice.',
    'home.viewProgress': 'View learning progress',
    'home.openSettings': 'Settings',
    'home.gradeTitle': 'Grade {grade}',
    'home.gradeDescription':
      'Start or resume the recommended practice for this learning path.',
    'home.practice': 'Practice',
    'home.selected': 'Preferred grade',
    'home.resumeNote':
      'Each grade keeps its own unfinished practice on this device.',
    'gradeSwitch.blockedTitle': 'Finish your current grade first',
    'gradeSwitch.blockedMessage':
      'Complete at least {minimum} mastered levels in Grade {grade} before switching grades. Current progress: {completed}/{minimum}.',
    'gradeSwitch.ok': 'Continue current grade',
    'progress.eyebrow': 'Your learning journey',
    'progress.title': 'Progress',
    'progress.subtitle':
      'Progress is calculated from completed practice stored on this device.',
    'progress.completedSessions': 'Completed sessions',
    'progress.completedQuestions': 'Completed questions',
    'progress.masteredCount': '{mastered} / {total} mastered',
    'progress.mastered': 'Mastered',
    'progress.inProgress': 'In progress',
    'progress.notStarted': 'Not started',
    'progress.nextAvailable': 'Next practice is available',
    'progress.gradeComplete': 'Grade path complete',
    'progress.nextUnavailable': 'Next curriculum step is not available yet',
    'progress.noActivity': 'Next eligible skill has no practice activity yet',
    'progress.loading': 'Loading learning progress…',
    'progress.error': 'Learning progress could not be loaded from this device.',
    'progress.retry': 'Try again',
    'settings.eyebrow': 'Device preferences',
    'settings.title': 'Settings',
    'settings.subtitle':
      'These preferences stay on this device and do not change scoring or mastery.',
    'settings.languageTitle': 'Language',
    'settings.languageDescription': 'Choose the language used by EduMath.',
    'settings.gradeTitle': 'Preferred grade',
    'settings.gradeDescription':
      'Choose the grade highlighted on Home. Unfinished practice is still resumed first.',
    'settings.selected': 'Selected',
    'settings.storageError':
      'Preferences could not be saved on this device. Your current session can still continue.',
  },
  id: {
    'nav.progress': 'Kemajuan',
    'nav.settings': 'Pengaturan',
    'nav.practice': 'Latihan Kelas {grade}',
    'practice.invalidGrade': 'Pilih jalur latihan Kelas 1–3 yang valid.',
    'practice.backHome': 'Kembali ke beranda',
    'home.eyebrow': 'EduMath Kelas 1–3',
    'home.subtitle':
      'Pilih kelas. EduMath akan menggunakan jalur belajarmu untuk memilih latihan berikutnya yang tersedia.',
    'home.viewProgress': 'Lihat kemajuan belajar',
    'home.openSettings': 'Pengaturan',
    'home.gradeTitle': 'Kelas {grade}',
    'home.gradeDescription':
      'Mulai atau lanjutkan latihan yang direkomendasikan untuk jalur belajar ini.',
    'home.practice': 'Latihan',
    'home.selected': 'Kelas pilihan',
    'home.resumeNote':
      'Setiap kelas menyimpan latihan yang belum selesai secara terpisah di perangkat ini.',
    'gradeSwitch.blockedTitle': 'Selesaikan kelas saat ini terlebih dahulu',
    'gradeSwitch.blockedMessage':
      'Selesaikan minimal {minimum} level yang dikuasai di Kelas {grade} sebelum berpindah kelas. Kemajuan saat ini: {completed}/{minimum}.',
    'gradeSwitch.ok': 'Lanjutkan kelas saat ini',
    'progress.eyebrow': 'Perjalanan belajarmu',
    'progress.title': 'Kemajuan',
    'progress.subtitle':
      'Kemajuan dihitung dari latihan yang telah selesai dan tersimpan di perangkat ini.',
    'progress.completedSessions': 'Sesi selesai',
    'progress.completedQuestions': 'Soal selesai',
    'progress.masteredCount': '{mastered} / {total} dikuasai',
    'progress.mastered': 'Dikuasai',
    'progress.inProgress': 'Sedang dipelajari',
    'progress.notStarted': 'Belum dimulai',
    'progress.nextAvailable': 'Latihan berikutnya tersedia',
    'progress.gradeComplete': 'Jalur kelas selesai',
    'progress.nextUnavailable': 'Langkah kurikulum berikutnya belum tersedia',
    'progress.noActivity': 'Keterampilan berikutnya belum memiliki aktivitas latihan',
    'progress.loading': 'Memuat kemajuan belajar…',
    'progress.error': 'Kemajuan belajar tidak dapat dimuat dari perangkat ini.',
    'progress.retry': 'Coba lagi',
    'settings.eyebrow': 'Preferensi perangkat',
    'settings.title': 'Pengaturan',
    'settings.subtitle':
      'Preferensi ini tetap di perangkat dan tidak mengubah penilaian atau mastery.',
    'settings.languageTitle': 'Bahasa',
    'settings.languageDescription': 'Pilih bahasa yang digunakan EduMath.',
    'settings.gradeTitle': 'Kelas pilihan',
    'settings.gradeDescription':
      'Pilih kelas yang ditandai di Beranda. Latihan yang belum selesai tetap dilanjutkan lebih dulu.',
    'settings.selected': 'Dipilih',
    'settings.storageError':
      'Preferensi tidak dapat disimpan di perangkat ini. Sesi saat ini tetap dapat dilanjutkan.',
  },
  th: {
    'nav.progress': 'ความก้าวหน้า',
    'nav.settings': 'การตั้งค่า',
    'nav.practice': 'แบบฝึกหัดชั้น {grade}',
    'practice.invalidGrade': 'เลือกระดับชั้น 1–3 ที่ถูกต้องสำหรับแบบฝึกหัด',
    'practice.backHome': 'กลับหน้าแรก',
    'home.eyebrow': 'EduMath ชั้น 1–3',
    'home.subtitle':
      'เลือกระดับชั้น EduMath จะใช้เส้นทางการเรียนรู้ของคุณเพื่อเลือกแบบฝึกหัดถัดไปที่พร้อมใช้งาน',
    'home.viewProgress': 'ดูความก้าวหน้าการเรียนรู้',
    'home.openSettings': 'การตั้งค่า',
    'home.gradeTitle': 'ชั้น {grade}',
    'home.gradeDescription':
      'เริ่มหรือทำแบบฝึกหัดที่แนะนำสำหรับเส้นทางการเรียนรู้นี้ต่อ',
    'home.practice': 'ฝึก',
    'home.selected': 'ชั้นที่เลือก',
    'home.resumeNote':
      'แต่ละระดับชั้นจะเก็บแบบฝึกหัดที่ยังไม่เสร็จแยกกันในอุปกรณ์นี้',
    'gradeSwitch.blockedTitle': 'ทำระดับชั้นปัจจุบันให้เสร็จก่อน',
    'gradeSwitch.blockedMessage':
      'ทำให้เชี่ยวชาญอย่างน้อย {minimum} ระดับในชั้น {grade} ก่อนเปลี่ยนชั้น ความก้าวหน้าปัจจุบัน: {completed}/{minimum}',
    'gradeSwitch.ok': 'เรียนชั้นปัจจุบันต่อ',
    'progress.eyebrow': 'เส้นทางการเรียนรู้ของคุณ',
    'progress.title': 'ความก้าวหน้า',
    'progress.subtitle':
      'ความก้าวหน้าคำนวณจากแบบฝึกหัดที่เสร็จแล้วและเก็บไว้ในอุปกรณ์นี้',
    'progress.completedSessions': 'เซสชันที่เสร็จแล้ว',
    'progress.completedQuestions': 'ข้อที่ทำเสร็จแล้ว',
    'progress.masteredCount': 'เชี่ยวชาญ {mastered} / {total}',
    'progress.mastered': 'เชี่ยวชาญ',
    'progress.inProgress': 'กำลังเรียนรู้',
    'progress.notStarted': 'ยังไม่เริ่ม',
    'progress.nextAvailable': 'แบบฝึกหัดถัดไปพร้อมใช้งาน',
    'progress.gradeComplete': 'เส้นทางระดับชั้นเสร็จแล้ว',
    'progress.nextUnavailable': 'ขั้นตอนหลักสูตรถัดไปยังไม่พร้อมใช้งาน',
    'progress.noActivity': 'ทักษะถัดไปยังไม่มีแบบฝึกหัด',
    'progress.loading': 'กำลังโหลดความก้าวหน้า…',
    'progress.error': 'ไม่สามารถโหลดความก้าวหน้าจากอุปกรณ์นี้ได้',
    'progress.retry': 'ลองอีกครั้ง',
    'settings.eyebrow': 'การตั้งค่าในอุปกรณ์',
    'settings.title': 'การตั้งค่า',
    'settings.subtitle':
      'การตั้งค่านี้เก็บไว้ในอุปกรณ์และไม่เปลี่ยนคะแนนหรือการประเมิน mastery',
    'settings.languageTitle': 'ภาษา',
    'settings.languageDescription': 'เลือกภาษาที่ EduMath ใช้',
    'settings.gradeTitle': 'ชั้นที่เลือก',
    'settings.gradeDescription':
      'เลือกระดับชั้นที่เน้นบนหน้าแรก แบบฝึกหัดที่ยังไม่เสร็จจะถูกทำต่อก่อน',
    'settings.selected': 'เลือกแล้ว',
    'settings.storageError':
      'ไม่สามารถบันทึกการตั้งค่าในอุปกรณ์นี้ได้ แต่เซสชันปัจจุบันยังทำต่อได้',
  },
};

export function translateAppShell(
  locale: Locale,
  key: AppShellMessageKey,
  params: Readonly<Record<string, string | number>> = {},
): string {
  return messages[locale][key].replace(
    /\{(\w+)\}/g,
    (placeholder, parameterName: string) => {
      const value = params[parameterName];
      return value === undefined ? placeholder : String(value);
    },
  );
}
