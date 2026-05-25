import { QuizQuestion } from '../../../types';

export const englishQuestions: Omit<QuizQuestion, 'id'>[] = [
  {
    subject: 'english',
    difficulty: 3,
    question_text: '「りんご」を英語で言うと？',
    choices: ['apple', 'orange', 'banana', 'grape'],
    correct_index: 0,
    explanation: '「りんご」は英語で "apple" です。',
    time_limit_seconds: 25,
  },
  {
    subject: 'english',
    difficulty: 6,
    question_text: '次の文の空欄に入る適切な語は？ "She ___ to school every day."',
    choices: ['go', 'goes', 'going', 'gone'],
    correct_index: 1,
    explanation: '三人称単数現在形なので "goes" が正解です。',
    time_limit_seconds: 20,
  },
  {
    subject: 'english',
    difficulty: 9,
    question_text: '"I wish I ___ more time." の空欄に入るのは？',
    choices: ['have', 'had', 'has', 'having'],
    correct_index: 1,
    explanation: '仮定法過去の構文では "had" を使います。現在の願望を表す場合も過去形を使います。',
    time_limit_seconds: 15,
  },
  {
    subject: 'english',
    difficulty: 13,
    question_text: '"Serendipity" の意味として最も近いのは？',
    choices: ['怒り', '偶然の幸運な発見', '孤独', '深い後悔'],
    correct_index: 1,
    explanation: '"Serendipity" は「予期せぬ幸運な発見」を意味する英語の語彙です。',
    time_limit_seconds: 12,
  },
  {
    subject: 'english',
    difficulty: 16,
    question_text: 'Which sentence demonstrates the subjunctive mood correctly?',
    choices: [
      'I suggest that he goes home.',
      'I suggest that he go home.',
      'I suggest that he going home.',
      'I suggest that he went home.',
    ],
    correct_index: 1,
    explanation: 'The subjunctive mood uses the base form of the verb: "I suggest that he go home."',
    time_limit_seconds: 10,
  },
];
