import { QuizQuestion } from '../../../types';

export const socialQuestions: Omit<QuizQuestion, 'id'>[] = [
  {
    subject: 'social',
    difficulty: 4,
    question_text: '日本の首都はどこ？',
    choices: ['大阪', '東京', '京都', '名古屋'],
    correct_index: 1,
    explanation: '日本の首都は東京です。',
    time_limit_seconds: 25,
  },
  {
    subject: 'social',
    difficulty: 7,
    question_text: '日本で消費税が初めて導入されたのは何年？',
    choices: ['1985年', '1989年', '1997年', '2014年'],
    correct_index: 1,
    explanation: '日本の消費税（3%）は1989年（平成元年）に初めて導入されました。',
    time_limit_seconds: 20,
  },
  {
    subject: 'social',
    difficulty: 10,
    question_text: '三権分立における「三権」とは？',
    choices: ['立法・行政・司法', '立法・行政・軍事', '外交・財政・司法', '議会・内閣・裁判所'],
    correct_index: 0,
    explanation: '三権分立は立法権（国会）・行政権（内閣）・司法権（裁判所）に権力を分散させる仕組みです。',
    time_limit_seconds: 15,
  },
  {
    subject: 'social',
    difficulty: 14,
    question_text: 'GDP（国内総生産）の説明として正しいのは？',
    choices: [
      '国内で一定期間に生産された財・サービスの付加価値の合計',
      '国民の平均収入',
      '輸出額から輸入額を引いた数値',
      '政府の税収合計',
    ],
    correct_index: 0,
    explanation: 'GDPは一定期間内に国内で生産された付加価値の総額で、経済規模を示す指標です。',
    time_limit_seconds: 12,
  },
];
