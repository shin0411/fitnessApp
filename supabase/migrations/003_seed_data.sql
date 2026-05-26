-- ============================================================================
-- Quiz Questions (5 subjects × multiple difficulties)
-- ============================================================================

insert into quiz_questions (subject, difficulty, question_text, choices, correct_index, explanation, time_limit_seconds) values
  -- Japanese
  ('japanese', 2, '「いぬ」を漢字で書くと？', '["犬","猫","鳥","魚"]'::jsonb, 0, '「犬」と書きます。', 30),
  ('japanese', 3, '「春」を正しく読むのはどれ？', '["はる","なつ","あき","ふゆ"]'::jsonb, 0, '「春」は「はる」と読みます。', 25),
  ('japanese', 5, '「美しい」の対義語は？', '["醜い","新しい","古い","強い"]'::jsonb, 0, '「美しい」の対義語は「醜い」です。', 25),
  ('japanese', 6, '「紅葉」の正しい読みはどれ？', '["こうよう","もみじ","あかは","べにば"]'::jsonb, 1, '「紅葉」は「もみじ」または「こうよう」と読みます。', 20),
  ('japanese', 8, '「矛盾」の意味として正しいのは？', '["筋が通っている","筋が通らない","協力する","賛成する"]'::jsonb, 1, '矛盾とは、つじつまが合わないことを指します。', 20),
  ('japanese', 9, '「風が吹く」の「が」の役割は？', '["主語を示す格助詞","目的語を示す格助詞","接続助詞","終助詞"]'::jsonb, 0, '「が」は主語を示す格助詞です。', 15),
  ('japanese', 12, '『枕草子』の作者は誰？', '["清少納言","紫式部","和泉式部","菅原道真"]'::jsonb, 0, '『枕草子』は平安時代の随筆で、清少納言の作品です。', 12),
  ('japanese', 13, '「行雲流水」の意味は？', '["執着せず自然に任せること","常に努力すること","勝負に勝つこと","知識を蓄えること"]'::jsonb, 0, '行雲流水とは、執着せず自然に任せて生きることです。', 12),
  ('japanese', 15, '古文の「をかし」の意味は？', '["趣がある・興趣がある","悲しい","恐ろしい","うつくしい"]'::jsonb, 0, '「をかし」は「趣がある」「おもしろい」という古語です。', 10),
  ('japanese', 18, '『万葉集』が編纂された時代は？', '["奈良時代","平安時代","鎌倉時代","江戸時代"]'::jsonb, 0, '万葉集は奈良時代に編纂された日本最古の和歌集です。', 8),

  -- English
  ('english', 2, '「ねこ」を英語で言うと？', '["dog","cat","bird","fish"]'::jsonb, 1, '「ねこ」は英語で "cat" です。', 30),
  ('english', 3, '「りんご」を英語で？', '["apple","orange","banana","grape"]'::jsonb, 0, '「りんご」は "apple" です。', 25),
  ('english', 5, '"Hello, how ___ you?" の空欄は？', '["is","are","am","be"]'::jsonb, 1, 'you には are を使います。', 25),
  ('english', 6, '"She ___ to school every day." 空欄に入るのは？', '["go","goes","going","gone"]'::jsonb, 1, '三人称単数現在形なので "goes" が正解です。', 20),
  ('english', 8, '"I have been ___ English for 5 years." の空欄は？', '["study","studied","studying","studies"]'::jsonb, 2, '現在完了進行形なので studying が正解です。', 20),
  ('english', 9, '"I wish I ___ more time." の空欄は？', '["have","had","has","having"]'::jsonb, 1, '仮定法過去の構文では had を使います。', 15),
  ('english', 11, '"By the time he arrived, we ___ already eaten." の空欄は？', '["have","had","has","were"]'::jsonb, 1, '過去完了形で had を使います。', 15),
  ('english', 13, '"Serendipity" の意味は？', '["怒り","偶然の幸運な発見","孤独","深い後悔"]'::jsonb, 1, 'Serendipity は「予期せぬ幸運な発見」を意味します。', 12),
  ('english', 16, 'Which is correct subjunctive mood?', '["I suggest that he goes home.","I suggest that he go home.","I suggest that he going home.","I suggest that he went home."]'::jsonb, 1, 'Subjunctive mood uses the base form: "he go home".', 10),
  ('english', 18, '"Ephemeral" の意味は？', '["永久の","つかの間の","巨大な","神聖な"]'::jsonb, 1, 'Ephemeral は「つかの間の」「短命な」を意味します。', 8),

  -- Math
  ('math', 1, '1 + 1 = ?', '["1","2","3","4"]'::jsonb, 1, '1 + 1 = 2 です。', 30),
  ('math', 3, '3 + 7 = ?', '["8","9","10","11"]'::jsonb, 2, '3 + 7 = 10 です。', 25),
  ('math', 5, '24 ÷ 6 = ?', '["3","4","5","6"]'::jsonb, 1, '24 ÷ 6 = 4 です。', 25),
  ('math', 7, '7 × 8 = ?', '["54","56","58","64"]'::jsonb, 1, '7 × 8 = 56 です。', 20),
  ('math', 8, '2² + 3² = ?', '["10","12","13","25"]'::jsonb, 2, '2² = 4、3² = 9 なので 4 + 9 = 13 です。', 20),
  ('math', 11, 'x² - 5x + 6 = 0 の解は？', '["x = 1, 6","x = 2, 3","x = -2, -3","x = -1, -6"]'::jsonb, 1, '因数分解すると (x-2)(x-3) = 0 です。', 15),
  ('math', 14, 'sin²θ + cos²θ = ?', '["0","1","2","tanθ"]'::jsonb, 1, '三角関数の基本恒等式：sin²θ + cos²θ = 1。', 12),
  ('math', 15, 'log₁₀ 100 = ?', '["1","2","10","100"]'::jsonb, 1, '10² = 100 なので log₁₀ 100 = 2。', 10),
  ('math', 17, '∫(0→1) x² dx = ?', '["1/2","1/3","1/4","1"]'::jsonb, 1, '∫x² dx = x³/3、よって [x³/3]₀¹ = 1/3。', 10),
  ('math', 19, 'lim(x→0) sin(x)/x = ?', '["0","1","∞","undefined"]'::jsonb, 1, '有名な極限：lim(x→0) sin(x)/x = 1。', 8),

  -- Social Studies
  ('social', 3, '日本の首都はどこ？', '["大阪","東京","京都","名古屋"]'::jsonb, 1, '日本の首都は東京です。', 25),
  ('social', 5, '世界で一番大きい大陸は？', '["アフリカ","ユーラシア","北アメリカ","南アメリカ"]'::jsonb, 1, '一番大きい大陸はユーラシア大陸です。', 25),
  ('social', 7, '明治維新が起こったのは何年？', '["1853年","1868年","1889年","1912年"]'::jsonb, 1, '明治維新は1868年に始まりました。', 20),
  ('social', 9, 'EU(欧州連合)の本部がある都市は？', '["パリ","ロンドン","ブリュッセル","ベルリン"]'::jsonb, 2, 'EUの本部はベルギーのブリュッセルにあります。', 15),
  ('social', 11, '日本の三権分立で「司法権」を担うのは？', '["国会","内閣","裁判所","天皇"]'::jsonb, 2, '司法権は裁判所が担います。', 15),
  ('social', 13, '産業革命が最初に起こった国は？', '["フランス","ドイツ","イギリス","アメリカ"]'::jsonb, 2, '産業革命は18世紀後半のイギリスで始まりました。', 12),
  ('social', 16, 'GDP(国内総生産)を初めて提唱した経済学者は？', '["アダム・スミス","ケインズ","サイモン・クズネッツ","ミルトン・フリードマン"]'::jsonb, 2, 'GDPはサイモン・クズネッツが1934年に提唱しました。', 10),

  -- Reading Comprehension / General
  ('comprehension', 4, '「早起きは三文の徳」の意味は？', '["早く起きると良いことがある","三文を稼げる","健康になる","勉強ができる"]'::jsonb, 0, '早起きすると小さなものでも得をするという諺です。', 25),
  ('comprehension', 6, '「一石二鳥」の意味は？', '["二つの石で鳥を撃つ","一つの行動で二つの利益","失敗を二倍する","二度同じことをする"]'::jsonb, 1, '一つの行動で二つの利益を得るたとえです。', 20),
  ('comprehension', 8, '「画竜点睛を欠く」の意味は？', '["完璧である","最も大事な部分が欠けている","絵が下手","目を描かない"]'::jsonb, 1, '最も肝心な部分が欠けていることのたとえです。', 18),
  ('comprehension', 12, '「アンビバレンス」の意味は？', '["一つの感情","相反する感情の共存","強い感情","感情が無いこと"]'::jsonb, 1, '愛と憎しみのような相反する感情が同時に存在する状態。', 12)
on conflict do nothing;

-- ============================================================================
-- Benchmark Personas (Lv.999 goal characters)
-- ============================================================================

insert into benchmark_personas (id, archetype, display_name, level, physique_params, beauty_params, knowledge_params, description, gender) values
  ('greek_warrior', 'physical_male', 'スパルタの戦士', 999,
    '{"strength": 999, "endurance": 950, "flexibility": 880, "muscle_mass_kg": 92}'::jsonb,
    '{"face_score": 850, "skin_score": 880, "posture": 999}'::jsonb,
    '{"strategy": 950, "history": 900, "philosophy": 880}'::jsonb,
    '究極の肉体美と戦士の精神を持つ古代の英雄。フィジカル全振り型の到達点。', 'male'),

  ('parisian_muse', 'beauty_female', 'パリのミューズ', 999,
    '{"flexibility": 920, "posture": 999, "muscle_mass_kg": 52}'::jsonb,
    '{"face_score": 999, "skin_score": 999, "fashion": 999, "elegance": 999}'::jsonb,
    '{"art": 950, "literature": 900, "languages": 880}'::jsonb,
    '美の極致を体現するエレガントなアイコン。ビューティー全振り型。', 'female'),

  ('renaissance_genius', 'knowledge_male', 'ルネサンスの賢者', 999,
    '{"flexibility": 800, "posture": 950}'::jsonb,
    '{"face_score": 800, "skin_score": 850, "presence": 999}'::jsonb,
    '{"science": 999, "art": 999, "philosophy": 999, "languages": 999}'::jsonb,
    'レオナルド・ダ・ヴィンチを彷彿とさせる万能の知性。ナレッジ全振り型。', 'male'),

  ('harmony_warrior', 'comprehensive_female', '調和の戦女神', 999,
    '{"strength": 920, "endurance": 940, "flexibility": 950}'::jsonb,
    '{"face_score": 950, "skin_score": 970, "presence": 999}'::jsonb,
    '{"strategy": 950, "philosophy": 940, "art": 920}'::jsonb,
    '身体・美・知性のすべてを高いレベルで体現する理想像。バランス型の頂点。', 'female'),

  ('zen_master', 'comprehensive_male', '禅の達人', 999,
    '{"strength": 880, "endurance": 999, "flexibility": 999}'::jsonb,
    '{"face_score": 880, "skin_score": 950, "posture": 999}'::jsonb,
    '{"philosophy": 999, "psychology": 980, "art": 920}'::jsonb,
    '心身ともに整い、深い知性と精神性を持つ達人。和の総合型。', 'male'),

  ('idol_hero', 'beauty_male', 'スターアイドル', 999,
    '{"strength": 880, "endurance": 900, "flexibility": 920}'::jsonb,
    '{"face_score": 999, "skin_score": 980, "fashion": 999, "stage_presence": 999}'::jsonb,
    '{"languages": 880, "music": 920}'::jsonb,
    '世界中を魅了するスター性。ビューティー＋パフォーマンス特化。', 'male'),

  ('fitness_queen', 'physical_female', 'フィットネスの女王', 999,
    '{"strength": 950, "endurance": 980, "flexibility": 990, "muscle_mass_kg": 60}'::jsonb,
    '{"face_score": 920, "skin_score": 950, "presence": 980}'::jsonb,
    '{"nutrition": 950, "physiology": 920}'::jsonb,
    '健康美と圧倒的なフィジカルを兼ね備えた女性の理想像。', 'female')
on conflict (id) do nothing;

-- ============================================================================
-- Additional Achievements (expanded set)
-- ============================================================================

insert into achievements (id, category, name, description, icon, xp_reward, level_type, condition_type, condition_value) values
  -- Workout streaks
  ('workout_streak_7', 'fitness', '一週間の鉄人', '7日連続でワークアウトを記録', '🔥', 500, 'physical', 'workout_streak_days', '{"days": 7}'),
  ('workout_streak_30', 'fitness', '鋼の意志', '30日連続でワークアウトを記録', '⚒️', 2000, 'physical', 'workout_streak_days', '{"days": 30}'),
  ('workout_streak_100', 'fitness', '不屈の戦士', '100日連続でワークアウトを記録', '💎', 5000, 'physical', 'workout_streak_days', '{"days": 100}'),

  -- Level milestones - Physical
  ('level_10_physical', 'fitness', 'フィジカル新人卒業', 'フィジカルLv.10到達', '🥉', 200, 'physical', 'level_reached', '{"level_type": "physical", "level": 10}'),
  ('level_30_physical', 'fitness', 'ブロンズリフター', 'フィジカルLv.30到達', '🏋️', 400, 'physical', 'level_reached', '{"level_type": "physical", "level": 30}'),
  ('level_200_physical', 'fitness', 'プラチナリフター', 'フィジカルLv.200到達', '⚪', 2500, 'physical', 'level_reached', '{"level_type": "physical", "level": 200}'),
  ('level_500_physical', 'fitness', 'ダイヤモンドリフター', 'フィジカルLv.500到達', '💎', 5000, 'physical', 'level_reached', '{"level_type": "physical", "level": 500}'),

  -- Level milestones - Beauty
  ('level_10_beauty', 'beauty', 'ビューティー新人卒業', 'ビューティーLv.10到達', '🌸', 200, 'beauty', 'level_reached', '{"level_type": "beauty", "level": 10}'),
  ('level_50_beauty', 'beauty', '美の探求者', 'ビューティーLv.50到達', '💄', 500, 'beauty', 'level_reached', '{"level_type": "beauty", "level": 50}'),
  ('level_100_beauty', 'beauty', '美のアイコン', 'ビューティーLv.100到達', '👑', 1000, 'beauty', 'level_reached', '{"level_type": "beauty", "level": 100}'),

  -- Level milestones - Knowledge
  ('level_10_knowledge', 'knowledge', '知識の卵', 'ナレッジLv.10到達', '🥚', 200, 'knowledge', 'level_reached', '{"level_type": "knowledge", "level": 10}'),
  ('level_50_knowledge', 'knowledge', '博識者', 'ナレッジLv.50到達', '📚', 500, 'knowledge', 'level_reached', '{"level_type": "knowledge", "level": 50}'),
  ('level_100_knowledge', 'knowledge', '賢者', 'ナレッジLv.100到達', '🦉', 1000, 'knowledge', 'level_reached', '{"level_type": "knowledge", "level": 100}'),

  -- Quiz milestones
  ('quiz_perfect_10', 'knowledge', 'クイズ無敵', '10問連続正解', '🎯', 300, 'knowledge', 'quiz_streak', '{"count": 10}'),
  ('quiz_total_100', 'knowledge', '100問達成', 'クイズ通算100問正解', '💯', 400, 'knowledge', 'quiz_correct_total', '{"count": 100}'),
  ('quiz_total_1000', 'knowledge', '知識の海', 'クイズ通算1000問正解', '🌊', 3000, 'knowledge', 'quiz_correct_total', '{"count": 1000}'),

  -- Nutrition
  ('meal_7_days', 'nutrition', '食事マスター', '7日連続で食事を記録', '🍱', 300, 'physical', 'meal_streak_days', '{"days": 7}'),
  ('meal_30_days', 'nutrition', '栄養管理プロ', '30日連続で食事を記録', '🥗', 1000, 'physical', 'meal_streak_days', '{"days": 30}'),

  -- Social
  ('first_invite', 'social', '伝道師', '初めて友達を招待した', '📨', 200, 'comprehensive', 'invite_count', '{"count": 1}'),
  ('invite_10', 'social', 'インフルエンサー', '10人を招待', '📣', 1000, 'comprehensive', 'invite_count', '{"count": 10}'),
  ('first_peer_review', 'social', 'コミュニティ参加', '初めて相互検証を行った', '🤝', 100, 'comprehensive', 'peer_review_count', '{"count": 1}'),
  ('guild_member', 'social', 'ギルドの一員', 'ギルドに加入', '⚔️', 200, 'comprehensive', 'guild_join', '{}'),

  -- Mode/Lifestyle
  ('good_mode_30', 'lifestyle', '生活の達人', 'Goodモード30日継続', '🌟', 1500, 'comprehensive', 'good_mode_days', '{"days": 30}'),
  ('sleep_master_7', 'lifestyle', '睡眠の賢者', '7日連続で7時間以上睡眠', '😴', 300, 'comprehensive', 'sleep_streak', '{"hours": 7, "days": 7}'),

  -- Comprehensive
  ('all_axes_50', 'comprehensive', '全方位戦士', '全ての軸でLv.50以上に到達', '⚡', 2000, 'comprehensive', 'all_axes_level', '{"level": 50}'),
  ('all_axes_100', 'comprehensive', '完全体', '全ての軸でLv.100以上に到達', '🌟', 5000, 'comprehensive', 'all_axes_level', '{"level": 100}'),
  ('comp_500', 'comprehensive', '頂点への道', '総合Lv.500到達', '👑', 5000, 'comprehensive', 'level_reached', '{"level_type": "comprehensive", "level": 500}')
on conflict (id) do nothing;
