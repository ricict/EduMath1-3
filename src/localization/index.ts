import type { Question, Shape2D } from '@/core/types';

export type Locale = 'en' | 'id' | 'th';

type MessageKey =
  | 'app.title'
  | 'app.subtitle'
  | 'question.numberRecognition'
  | 'question.additionConcept'
  | 'question.addition'
  | 'question.subtraction'
  | 'question.multiplication'
  | 'question.numberComparison'
  | 'question.unitFraction'
  | 'question.readClock'
  | 'question.identify2dShape'
  | 'question.readTallyTable'
  | 'question.readPictogram'
  | 'question.readBarChart'
  | 'visual.numberRecognitionLabel'
  | 'visual.additionFirstGroupLabel'
  | 'visual.additionSecondGroupLabel'
  | 'visual.unitFractionLabel'
  | 'visual.clockLabel'
  | 'visual.numberLineComparisonLabel'
  | 'visual.shapeLabel'
  | 'visual.tallyTableLabel'
  | 'visual.pictogramLabel'
  | 'visual.barChartLabel'
  | 'visual.dataRowLabel'
  | 'visual.dataGroupHeader'
  | 'visual.tallyHeader'
  | 'visual.pictogramKey'
  | 'answer.relationLessThan'
  | 'answer.relationEqual'
  | 'answer.relationGreaterThan'
  | 'answer.fractionLabel'
  | 'answer.timeLabel'
  | 'answer.shapeLabel'
  | 'shape.circle'
  | 'shape.triangle'
  | 'shape.square'
  | 'shape.rectangle'
  | 'action.check'
  | 'action.next'
  | 'action.finish'
  | 'action.startNew'
  | 'feedback.correct'
  | 'feedback.incorrect'
  | 'feedback.correctAnswer'
  | 'feedback.sessionComplete'
  | 'feedback.levelCompleteTitle'
  | 'feedback.levelCompleteMessage'
  | 'feedback.levelRetryTitle'
  | 'feedback.levelRetryMessage'
  | 'advisory.previousGradeTitle'
  | 'advisory.previousGradeMessage'
  | 'action.continue'
  | 'status.loading'
  | 'status.persistenceError'
  | 'status.allGradeSkillsMastered'
  | 'status.noCurriculumEligiblePractice'
  | 'status.noPracticableSkill'
  | 'status.unsupportedPracticeType'
  | 'label.language'
  | 'label.practicePlan'
  | 'label.questionCount'
  | 'label.activePractice';

const messages: Readonly<Record<Locale, Readonly<Record<MessageKey, string>>>> = {
  en: {
    'app.title': '10 Minutes Math',
    'app.subtitle': 'Grade 1 · Addition within 10',
    'question.numberRecognition': 'Which number is shown?',
    'question.additionConcept':
      'There are {a} objects and {b} more objects. How many are there altogether?',
    'question.addition': 'What is {a} + {b}?',
    'question.subtraction': 'What is {a} - {b}?',
    'question.multiplication': 'What is {a} × {b}?',
    'question.numberComparison': 'Compare {left} and {right}. Choose <, =, or >.',
    'question.unitFraction':
      'One of {denominator} equal parts is shaded. Which fraction is shown?',
    'question.readClock': 'What time does the clock show?',
    'question.identify2dShape': 'What shape is shown?',
    'question.readTallyTable': 'How many items are in group {group}?',
    'question.readPictogram':
      'According to the pictogram, how many items are in group {group}?',
    'question.readBarChart':
      'According to the bar chart, how many items are in group {group}?',
    'visual.numberRecognitionLabel': 'Shown number: {target}',
    'visual.additionFirstGroupLabel': 'First group: {count} objects',
    'visual.additionSecondGroupLabel': 'Second group: {count} objects',
    'visual.unitFractionLabel': '{shaded} of {total} equal parts is shaded',
    'visual.clockLabel': 'Analog clock showing {hour}:{minute}',
    'visual.numberLineComparisonLabel':
      'Number line from {min} to {max}. Compare {left} and {right}.',
    'visual.shapeLabel': 'Shown shape: {shape}',
    'visual.tallyTableLabel': 'Tally table. {rows}',
    'visual.pictogramLabel': 'Pictogram. {rows}',
    'visual.barChartLabel': 'Unit-scale bar chart. {rows}',
    'visual.dataRowLabel': 'Group {group}: {count} items',
    'visual.dataGroupHeader': 'Group',
    'visual.tallyHeader': 'Tally',
    'visual.pictogramKey': 'Each symbol represents 1 item.',
    'answer.relationLessThan': 'Less than',
    'answer.relationEqual': 'Equal to',
    'answer.relationGreaterThan': 'Greater than',
    'answer.fractionLabel': 'Fraction {numerator} over {denominator}',
    'answer.timeLabel': 'Time {hour}:{minute}',
    'answer.shapeLabel': 'Shape {shape}',
    'shape.circle': 'Circle',
    'shape.triangle': 'Triangle',
    'shape.square': 'Square',
    'shape.rectangle': 'Rectangle',
    'action.check': 'Check answer',
    'action.next': 'Next question',
    'action.finish': 'Finish session',
    'action.startNew': 'Start new session',
    'feedback.correct': 'Correct!',
    'feedback.incorrect': 'Try again.',
    'feedback.correctAnswer': 'Correct answer: {answer}',
    'feedback.sessionComplete': 'Practice session complete!',
    'feedback.levelCompleteTitle': 'Level complete!',
    'feedback.levelCompleteMessage':
      'Great work. Continue to the next recommended level.',
    'feedback.levelRetryTitle': 'Keep practicing this level',
    'feedback.levelRetryMessage':
      'You finished this practice set. Continue to strengthen this level before moving on.',
    'advisory.previousGradeTitle': 'Grade {grade} is not fully complete',
    'advisory.previousGradeMessage':
      'You can still practice Grade {targetGrade}. Completing Grade {grade} first is recommended so EduMath can estimate the most appropriate question level from your curriculum progress.',
    'action.continue': 'Continue',
    'status.loading': 'Restoring your practice session…',
    'status.persistenceError': 'Local practice storage is unavailable.',
    'status.allGradeSkillsMastered': 'You completed the current grade practice path.',
    'status.noCurriculumEligiblePractice': 'The next practice is not available yet.',
    'status.noPracticableSkill': 'The next eligible skill does not have a practice activity yet.',
    'status.unsupportedPracticeType': 'This practice type is not available on this screen yet.',
    'label.practicePlan': 'Grade {grade} · Level {difficulty}',
    'label.language': 'Language',
    'label.questionCount': 'Question {count}',
    'label.activePractice': 'Active practice {elapsed} / {target}',
  },
  id: {
    'app.title': '10 Menit Matematika',
    'app.subtitle': 'Kelas 1 · Penjumlahan sampai 10',
    'question.numberRecognition': 'Angka berapa yang ditunjukkan?',
    'question.additionConcept':
      'Ada {a} benda dan ditambah {b} benda lagi. Berapa jumlah semuanya?',
    'question.addition': 'Berapakah {a} + {b}?',
    'question.subtraction': 'Berapakah {a} - {b}?',
    'question.multiplication': 'Berapakah {a} × {b}?',
    'question.numberComparison': 'Bandingkan {left} dan {right}. Pilih <, =, atau >.',
    'question.unitFraction':
      'Satu dari {denominator} bagian yang sama diarsir. Pecahan apa yang ditunjukkan?',
    'question.readClock': 'Jam menunjukkan pukul berapa?',
    'question.identify2dShape': 'Bentuk apa yang ditunjukkan?',
    'question.readTallyTable': 'Ada berapa benda di kelompok {group}?',
    'question.readPictogram':
      'Menurut piktogram, ada berapa benda di kelompok {group}?',
    'question.readBarChart':
      'Menurut diagram batang, ada berapa benda di kelompok {group}?',
    'visual.numberRecognitionLabel': 'Angka yang ditampilkan: {target}',
    'visual.additionFirstGroupLabel': 'Kelompok pertama: {count} benda',
    'visual.additionSecondGroupLabel': 'Kelompok kedua: {count} benda',
    'visual.unitFractionLabel': '{shaded} dari {total} bagian yang sama diarsir',
    'visual.clockLabel': 'Jam analog menunjukkan pukul {hour}:{minute}',
    'visual.numberLineComparisonLabel':
      'Garis bilangan dari {min} sampai {max}. Bandingkan {left} dan {right}.',
    'visual.shapeLabel': 'Bentuk yang ditampilkan: {shape}',
    'visual.tallyTableLabel': 'Tabel turus. {rows}',
    'visual.pictogramLabel': 'Piktogram. {rows}',
    'visual.barChartLabel': 'Diagram batang skala satuan. {rows}',
    'visual.dataRowLabel': 'Kelompok {group}: {count} benda',
    'visual.dataGroupHeader': 'Kelompok',
    'visual.tallyHeader': 'Turus',
    'visual.pictogramKey': 'Setiap simbol mewakili 1 benda.',
    'answer.relationLessThan': 'Kurang dari',
    'answer.relationEqual': 'Sama dengan',
    'answer.relationGreaterThan': 'Lebih dari',
    'answer.fractionLabel': 'Pecahan {numerator} per {denominator}',
    'answer.timeLabel': 'Pukul {hour}:{minute}',
    'answer.shapeLabel': 'Bentuk {shape}',
    'shape.circle': 'Lingkaran',
    'shape.triangle': 'Segitiga',
    'shape.square': 'Persegi',
    'shape.rectangle': 'Persegi panjang',
    'action.check': 'Periksa jawaban',
    'action.next': 'Soal berikutnya',
    'action.finish': 'Selesaikan sesi',
    'action.startNew': 'Mulai sesi baru',
    'feedback.correct': 'Benar!',
    'feedback.incorrect': 'Coba lagi.',
    'feedback.correctAnswer': 'Jawaban yang benar: {answer}',
    'feedback.sessionComplete': 'Sesi latihan selesai!',
    'feedback.levelCompleteTitle': 'Level selesai!',
    'feedback.levelCompleteMessage':
      'Bagus! Lanjutkan ke level berikutnya yang direkomendasikan.',
    'feedback.levelRetryTitle': 'Lanjutkan latihan level ini',
    'feedback.levelRetryMessage':
      'Set latihan ini selesai. Lanjutkan untuk memperkuat level ini sebelum naik.',
    'advisory.previousGradeTitle': 'Kelas {grade} belum sepenuhnya selesai',
    'advisory.previousGradeMessage':
      'Kamu tetap dapat berlatih di Kelas {targetGrade}. Sebaiknya selesaikan Kelas {grade} terlebih dahulu agar EduMath dapat mengukur level soal yang paling sesuai berdasarkan progres kurikulum.',
    'action.continue': 'Lanjutkan',
    'status.loading': 'Memulihkan sesi latihan…',
    'status.persistenceError': 'Penyimpanan latihan lokal tidak tersedia.',
    'status.allGradeSkillsMastered': 'Kamu telah menyelesaikan jalur latihan untuk kelas ini.',
    'status.noCurriculumEligiblePractice': 'Latihan berikutnya belum tersedia.',
    'status.noPracticableSkill': 'Keterampilan berikutnya belum memiliki aktivitas latihan.',
    'status.unsupportedPracticeType': 'Jenis latihan ini belum tersedia di layar ini.',
    'label.practicePlan': 'Kelas {grade} · Level {difficulty}',
    'label.language': 'Bahasa',
    'label.questionCount': 'Soal {count}',
    'label.activePractice': 'Latihan aktif {elapsed} / {target}',
  },
  th: {
    'app.title': 'คณิตศาสตร์ 10 นาที',
    'app.subtitle': 'ชั้นประถมศึกษาปีที่ 1 · การบวกไม่เกิน 10',
    'question.numberRecognition': 'ตัวเลขที่แสดงคือเลขอะไร?',
    'question.additionConcept':
      'มีสิ่งของ {a} ชิ้น และเพิ่มอีก {b} ชิ้น รวมทั้งหมดมีกี่ชิ้น?',
    'question.addition': '{a} + {b} เท่ากับเท่าไร?',
    'question.subtraction': '{a} - {b} เท่ากับเท่าไร?',
    'question.multiplication': '{a} × {b} เท่ากับเท่าไร?',
    'question.numberComparison': 'เปรียบเทียบ {left} และ {right} เลือก <, = หรือ >',
    'question.unitFraction':
      'ระบายสี 1 ส่วนจากทั้งหมด {denominator} ส่วนที่เท่ากัน เศษส่วนที่แสดงคืออะไร?',
    'question.readClock': 'นาฬิกาแสดงเวลากี่โมง?',
    'question.identify2dShape': 'รูปทรงที่แสดงคือรูปอะไร?',
    'question.readTallyTable': 'กลุ่ม {group} มีสิ่งของกี่ชิ้น?',
    'question.readPictogram':
      'จากแผนภูมิรูปภาพ กลุ่ม {group} มีสิ่งของกี่ชิ้น?',
    'question.readBarChart':
      'จากแผนภูมิแท่ง กลุ่ม {group} มีสิ่งของกี่ชิ้น?',
    'visual.numberRecognitionLabel': 'ตัวเลขที่แสดง: {target}',
    'visual.additionFirstGroupLabel': 'กลุ่มแรกมีสิ่งของ {count} ชิ้น',
    'visual.additionSecondGroupLabel': 'กลุ่มที่สองมีสิ่งของ {count} ชิ้น',
    'visual.unitFractionLabel': 'ระบายสี {shaded} จาก {total} ส่วนที่เท่ากัน',
    'visual.clockLabel': 'นาฬิกาเข็มแสดงเวลา {hour}:{minute}',
    'visual.numberLineComparisonLabel':
      'เส้นจำนวนจาก {min} ถึง {max} เปรียบเทียบ {left} และ {right}',
    'visual.shapeLabel': 'รูปทรงที่แสดง: {shape}',
    'visual.tallyTableLabel': 'ตารางรอยขีดนับ {rows}',
    'visual.pictogramLabel': 'แผนภูมิรูปภาพ {rows}',
    'visual.barChartLabel': 'แผนภูมิแท่งมาตราส่วนหน่วย {rows}',
    'visual.dataRowLabel': 'กลุ่ม {group}: {count} ชิ้น',
    'visual.dataGroupHeader': 'กลุ่ม',
    'visual.tallyHeader': 'รอยขีดนับ',
    'visual.pictogramKey': 'แต่ละสัญลักษณ์แทน 1 ชิ้น',
    'answer.relationLessThan': 'น้อยกว่า',
    'answer.relationEqual': 'เท่ากับ',
    'answer.relationGreaterThan': 'มากกว่า',
    'answer.fractionLabel': 'เศษส่วน {numerator} ส่วน {denominator}',
    'answer.timeLabel': 'เวลา {hour}:{minute}',
    'answer.shapeLabel': 'รูปทรง {shape}',
    'shape.circle': 'วงกลม',
    'shape.triangle': 'สามเหลี่ยม',
    'shape.square': 'สี่เหลี่ยมจัตุรัส',
    'shape.rectangle': 'สี่เหลี่ยมผืนผ้า',
    'action.check': 'ตรวจคำตอบ',
    'action.next': 'ข้อต่อไป',
    'action.finish': 'จบเซสชัน',
    'action.startNew': 'เริ่มเซสชันใหม่',
    'feedback.correct': 'ถูกต้อง!',
    'feedback.incorrect': 'ลองอีกครั้ง',
    'feedback.correctAnswer': 'คำตอบที่ถูกต้อง: {answer}',
    'feedback.sessionComplete': 'เซสชันฝึกเสร็จแล้ว!',
    'feedback.levelCompleteTitle': 'ผ่านระดับแล้ว!',
    'feedback.levelCompleteMessage':
      'เยี่ยมมาก ไปต่อยังระดับที่แนะนำถัดไป',
    'feedback.levelRetryTitle': 'ฝึกระดับนี้ต่อ',
    'feedback.levelRetryMessage':
      'ทำชุดฝึกนี้เสร็จแล้ว ฝึกระดับนี้ต่อเพื่อให้เชี่ยวชาญก่อนเลื่อนไประดับถัดไป',
    'advisory.previousGradeTitle': 'ชั้น {grade} ยังเรียนไม่ครบ',
    'advisory.previousGradeMessage':
      'คุณยังสามารถฝึกชั้น {targetGrade} ได้ แต่แนะนำให้เรียนชั้น {grade} ให้ครบก่อน เพื่อให้ EduMath ประเมินระดับคำถามที่เหมาะสมจากความก้าวหน้าตามหลักสูตรได้แม่นยำยิ่งขึ้น',
    'action.continue': 'ดำเนินการต่อ',
    'status.loading': 'กำลังกู้คืนเซสชันฝึก…',
    'status.persistenceError': 'ไม่สามารถใช้พื้นที่จัดเก็บการฝึกในเครื่องได้',
    'status.allGradeSkillsMastered': 'คุณเรียนจบเส้นทางฝึกของระดับชั้นนี้แล้ว',
    'status.noCurriculumEligiblePractice': 'แบบฝึกหัดถัดไปยังไม่พร้อมใช้งาน',
    'status.noPracticableSkill': 'ทักษะถัดไปยังไม่มีแบบฝึกหัดให้ใช้งาน',
    'status.unsupportedPracticeType': 'แบบฝึกหัดประเภทนี้ยังไม่รองรับบนหน้าจอนี้',
    'label.practicePlan': 'ชั้น {grade} · ระดับ {difficulty}',
    'label.language': 'ภาษา',
    'label.questionCount': 'ข้อ {count}',
    'label.activePractice': 'เวลาฝึกจริง {elapsed} / {target}',
  },
};

export function translate(
  locale: Locale,
  key: MessageKey,
  params: Readonly<Record<string, string | number>> = {},
): string {
  return messages[locale][key].replace(/\{(\w+)\}/g, (placeholder, parameterName: string) => {
    const value = params[parameterName];
    return value === undefined ? placeholder : String(value);
  });
}

const NUMBER_WORDS: Readonly<Record<Locale, readonly string[]>> = {
  en: ['ZERO', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE', 'TEN'],
  id: ['NOL', 'SATU', 'DUA', 'TIGA', 'EMPAT', 'LIMA', 'ENAM', 'TUJUH', 'DELAPAN', 'SEMBILAN', 'SEPULUH'],
  th: ['ศูนย์', 'หนึ่ง', 'สอง', 'สาม', 'สี่', 'ห้า', 'หก', 'เจ็ด', 'แปด', 'เก้า', 'สิบ'],
};

export function translateNumberWord(locale: Locale, value: number): string {
  if (!Number.isInteger(value) || value < 0 || value > 10) {
    throw new Error('Number-word display supports only integers from 0 to 10.');
  }

  return NUMBER_WORDS[locale][value];
}

export function translateShapeName(locale: Locale, shape: Shape2D): string {
  switch (shape) {
    case 'circle':
      return translate(locale, 'shape.circle');
    case 'triangle':
      return translate(locale, 'shape.triangle');
    case 'square':
      return translate(locale, 'shape.square');
    case 'rectangle':
      return translate(locale, 'shape.rectangle');
  }
}

export function renderQuestionPrompt(question: Question, locale: Locale): string {
  if (question.data.operation === 'number-recognition') {
    return translate(locale, question.promptKey);
  }

  if (question.data.operation === 'number-comparison') {
    return translate(locale, question.promptKey, {
      left: question.data.left,
      right: question.data.right,
    });
  }

  if (question.data.operation === 'unit-fraction') {
    return translate(locale, question.promptKey, {
      denominator: question.data.denominator,
    });
  }

  if (question.data.operation === 'read-clock') {
    return translate(locale, question.promptKey);
  }

  if (question.data.operation === 'identify-2d-shape') {
    return translate(locale, question.promptKey);
  }

  if (
    question.data.operation === 'read-tally-table' ||
    question.data.operation === 'read-pictogram' ||
    question.data.operation === 'read-unit-bar-chart'
  ) {
    return translate(locale, question.promptKey, {
      group: question.data.targetLabel,
    });
  }

  return translate(locale, question.promptKey, {
    a: question.data.a,
    b: question.data.b,
  });
}
