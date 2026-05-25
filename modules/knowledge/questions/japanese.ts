import { QuizQuestion } from '../../../types';

export const japaneseQuestions: Omit<QuizQuestion, 'id'>[] = [
  {
    subject: 'japanese',
    difficulty: 3,
    question_text: '「春」を正しく読むのはどれ？',
    choices: ['はる', 'なつ', 'あき', 'ふゆ'],
    correct_index: 0,
    explanation: '「春」は「はる」と読みます。',
    time_limit_seconds: 25,
  },
  {
    subject: 'japanese',
    difficulty: 6,
    question_text: '「紅葉」の正しい読みはどれ？',
    choices: ['こうよう', 'もみじ', 'あかは', 'べにば'],
    correct_index: 1,
    explanation: '「紅葉」は「もみじ」または「こうよう」と読みますが、植物そのものは「もみじ」が一般的です。',
    time_limit_seconds: 20,
  },
  {
    subject: 'japanese',
    difficulty: 9,
    question_text: '次の文の「が」の役割として正しいものは？「風が吹く」',
    choices: ['主語を示す格助詞', '目的語を示す格助詞', '接続助詞', '終助詞'],
    correct_index: 0,
    explanation: '「が」は主語を示す格助詞です。「風」が文の主語であることを示しています。',
    time_limit_seconds: 15,
  },
  {
    subject: 'japanese',
    difficulty: 12,
    question_text: '「架草子」の作者は誰か？',
    choices: ['清少納言', '紫式部', '和泉式部', '菅原道真'],
    correct_index: 0,
    explanation: '「架草子」は平安時代の随筆で、清少納言によって書かれました。',
    time_limit_seconds: 12,
  },
  {
    subject: 'japanese',
    difficulty: 15,
    question_text: '古文の「をかし」の現代語訳として最も適切なのは？',
    choices: ['趣がある・興趣がある', '悲しい', '恐ろしい', 'うつくしい'],
    correct_index: 0,
    explanation: '「をかし」は古語で「趣がある」「おもしろい」という意味の形容詞です。',
    time_limit_seconds: 10,
  },
];
