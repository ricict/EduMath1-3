import type { Question } from '@/core/types';

export type Locale = 'en' | 'id' | 'th';

type MessageKey =
  | 'app.title'
  | 'app.subtitle'
  | 'question.addition'
  | 'question.subtraction'
  | 'question.multiplication'
  | 'question.numberComparison'
  | 'question.unitFraction'
  | 'question.readClock'
  | 'action.check'
  | 'action.next'
  | 'feedback.correct'
  | 'feedback.incorrect'
  | 'label.language';

const messages: Readonly<Record<Locale, Readonly<Record<MessageKey, string>>>> = {
  en: {
    'app.title': '10 Minutes Math',
    'app.subtitle': 'Grade 1 · Addition within 10',
    'question.addition': 'What is {a} + {b}?',
    'question.subtraction': 'What is {a} - {b}?',
    'question.multiplication': 'What is {a} × {b}?',
    'question.numberComparison': 'Compare {left} and {right}. Choose <, =, or >.',
    'question.unitFraction':
      'One of {denominator} equal parts is shaded. Which fraction is shown?',
    'question.readClock': 'What time does the clock show?',
    'action.check': 'Check answer',
    'action.next': 'Next question',
    'feedback.correct': 'Correct!',
    'feedback.incorrect': 'Try again.',
    'label.language': 'Language',
  },
  id: {
    'app.title': '10 Menit Matematika',
    'app.subtitle': 'Kelas 1 · Penjumlahan sampai 10',
    'question.addition': 'Berapakah {a} + {b}?',
    'question.subtraction': 'Berapakah {a} - {b}?',
    'question.multiplication': 'Berapakah {a} × {b}?',
    'question.numberComparison': 'Bandingkan {left} dan {right}. Pilih <, =, atau >.',
    'question.unitFraction':
      'Satu dari {denominator} bagian yang sama diarsir. Pecahan apa yang ditunjukkan?',
    'question.readClock': 'Jam menunjukkan pukul berapa?',
    'action.check': 'Periksa jawaban',
    'action.next': 'Soal berikutnya',
    'feedback.correct': 'Benar!',
    'feedback.incorrect': 'Coba lagi.',
    'label.language': 'Bahasa',
  },
  th: {
    'app.title': 'คณิตศาสตร์ 10 นาที',
    'app.subtitle': 'ชั้นประถมศึกษาปีที่ 1 · การบวกไม่เกิน 10',
    'question.addition': '{a} + {b} เท่ากับเท่าไร?',
    'question.subtraction': '{a} - {b} เท่ากับเท่าไร?',
    'question.multiplication': '{a} × {b} เท่ากับเท่าไร?',
    'question.numberComparison': 'เปรียบเทียบ {left} และ {right} เลือก <, = หรือ >',
    'question.unitFraction':
      'ระบายสี 1 ส่วนจากทั้งหมด {denominator} ส่วนที่เท่ากัน เศษส่วนที่แสดงคืออะไร?',
    'question.readClock': 'นาฬิกาแสดงเวลากี่โมง?',
    'action.check': 'ตรวจคำตอบ',
    'action.next': 'ข้อต่อไป',
    'feedback.correct': 'ถูกต้อง!',
    'feedback.incorrect': 'ลองอีกครั้ง',
    'label.language': 'ภาษา',
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

export function renderQuestionPrompt(question: Question, locale: Locale): string {
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

  return translate(locale, question.promptKey, {
    a: question.data.a,
    b: question.data.b,
  });
}
