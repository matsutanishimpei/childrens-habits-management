import fs from 'node:fs';
import path from 'node:path';
import PDFDocument from 'pdfkit';

const rootDir = path.resolve(process.cwd());
const docsDir = path.join(rootDir, 'docs');
const outputPath = path.join(docsDir, 'usage-guide.pdf');

const images = {
  today: path.join(docsDir, 'screenshots', '01_today.png'),
  plan: path.join(docsDir, 'screenshots', '02_plan.png'),
  calendar: path.join(docsDir, 'screenshots', '03_calendar_hanako.png'),
  tasks: path.join(docsDir, 'screenshots', '04_tasks.png'),
  children: path.join(docsDir, 'screenshots', '05_children.png'),
};

const doc = new PDFDocument({
  size: 'A4',
  margin: 42,
  bufferPages: true,
  info: {
    Title: 'ハビっと ユーザー向け使い方手順書',
    Author: 'GitHub Copilot',
    Subject: 'ハビっとの使い方',
    Keywords: 'ハビっと, 使い方, 手順書',
  },
});

doc.pipe(fs.createWriteStream(outputPath));

const pageWidth = doc.page.width;
const contentWidth = pageWidth - doc.page.margins.left - doc.page.margins.right;

const colors = {
  bg: '#F6F4EE',
  panel: '#FFFFFF',
  text: '#1F2933',
  muted: '#667085',
  line: '#E5E1D8',
  accent: '#0F766E',
  accentSoft: '#D9F0EE',
  gold: '#FFF9E8',
};

function fillBackground() {
  const { x, y, width, height } = doc.page;
  doc.save();
  doc.rect(0, 0, width, height).fill(colors.bg);
  doc.restore();
}

function drawCard(x, y, width, height, fill = colors.panel) {
  doc.save();
  doc.roundedRect(x, y, width, height, 16).fillAndStroke(fill, colors.line);
  doc.restore();
}

function addTextBlock(text, options = {}) {
  const { fontSize = 11, color = colors.text, width = contentWidth, align = 'left', indent = 0 } = options;
  doc.fillColor(color).fontSize(fontSize).text(text, doc.x + indent, doc.y, { width: width - indent, align });
}

function ensureSpace(heightNeeded) {
  const bottomLimit = doc.page.height - doc.page.margins.bottom;
  if (doc.y + heightNeeded > bottomLimit) {
    doc.addPage();
    fillBackground();
  }
}

function addBadge(label) {
  const badgeWidth = doc.widthOfString(label, { size: 10 }) + 18;
  const badgeHeight = 20;
  const x = doc.page.margins.left;
  const y = doc.y;
  doc.save();
  doc.roundedRect(x, y, badgeWidth, badgeHeight, 10).fill(colors.accentSoft);
  doc.fillColor(colors.accent).fontSize(10).font('Helvetica-Bold').text(label, x, y + 5, { width: badgeWidth, align: 'center' });
  doc.restore();
  doc.y += badgeHeight + 10;
}

function addSection({ badge, title, body, steps, imagePath, note }) {
  const estimatedHeight = 24 + 24 + (body ? 22 : 0) + (steps ? steps.length * 16 + 18 : 0) + (imagePath ? 300 : 0) + (note ? 20 : 0);
  ensureSpace(estimatedHeight + 18);

  const startY = doc.y;
  const cardX = doc.page.margins.left;
  const cardWidth = contentWidth;
  const cardPadding = 20;

  drawCard(cardX, startY, cardWidth, estimatedHeight + 28);
  doc.x = cardX + cardPadding;
  doc.y = startY + cardPadding;

  if (badge) {
    const badgeWidth = doc.widthOfString(badge, { size: 10 }) + 18;
    doc.save();
    doc.roundedRect(doc.x, doc.y, badgeWidth, 20, 10).fill(colors.accentSoft);
    doc.fillColor(colors.accent).fontSize(10).font('Helvetica-Bold').text(badge, doc.x, doc.y + 5, { width: badgeWidth, align: 'center' });
    doc.restore();
    doc.y += 28;
  }

  doc.fillColor(colors.text).font('Helvetica-Bold').fontSize(18).text(title, doc.x, doc.y, { width: cardWidth - cardPadding * 2 });
  doc.y += 26;

  if (body) {
    doc.fillColor(colors.text).font('Helvetica').fontSize(11).text(body, doc.x, doc.y, { width: cardWidth - cardPadding * 2, lineGap: 3 });
    doc.y += doc.heightOfString(body, { width: cardWidth - cardPadding * 2, lineGap: 3 }) + 8;
  }

  if (steps?.length) {
    steps.forEach((step, index) => {
      const bullet = `${index + 1}. `;
      const bulletWidth = doc.widthOfString(bullet, { size: 11 });
      doc.fillColor(colors.text).font('Helvetica').fontSize(11).text(bullet, doc.x, doc.y, { continued: true });
      doc.text(step, { width: cardWidth - cardPadding * 2 - bulletWidth, lineGap: 3 });
      doc.y += 4;
    });
    doc.y += 4;
  }

  if (imagePath) {
    const imageMaxWidth = cardWidth - cardPadding * 2;
    const imageTop = doc.y + 8;
    const imageMeta = doc.openImage(imagePath);
    const imageHeight = Math.min((imageMeta.height / imageMeta.width) * imageMaxWidth, 310);
    ensureSpace(imageHeight + 22);
    doc.image(imagePath, doc.x, imageTop, { width: imageMaxWidth, height: imageHeight, fit: [imageMaxWidth, 310], align: 'center', valign: 'center' });
    doc.y = imageTop + imageHeight + 12;
  }

  if (note) {
    doc.fillColor(colors.muted).font('Helvetica-Oblique').fontSize(10).text(note, doc.x, doc.y, { width: cardWidth - cardPadding * 2, lineGap: 2 });
    doc.y += doc.heightOfString(note, { width: cardWidth - cardPadding * 2, lineGap: 2 }) + 6;
  }

  doc.y = startY + estimatedHeight + 28 + 16;
}

fillBackground();

// Cover
doc.rect(doc.page.margins.left, doc.y, contentWidth, 120).roundedRect;
doc.save();
doc.roundedRect(doc.page.margins.left, doc.y, contentWidth, 126, 22).fill('#FFFFFF').stroke(colors.line);
doc.restore();
doc.x = doc.page.margins.left + 22;
doc.y += 20;

doc.fillColor(colors.accent).font('Helvetica-Bold').fontSize(11).text('HABIT MANAGEMENT GUIDE', { characterSpacing: 1.2 });
doc.y += 8;
doc.fillColor(colors.text).font('Helvetica-Bold').fontSize(28).text('ハビっと\nユーザー向け使い方手順書', { lineGap: 4 });
doc.y += 8;
doc.fillColor(colors.muted).font('Helvetica').fontSize(12).text('ローカル起動したハビっとの基本操作を、画面ごとに追えるようにまとめた手順書です。ログインから毎日のチェック、月ごとの記録まで、この 1 枚で流れを確認できます。', {
  width: contentWidth - 44,
  lineGap: 4,
});

doc.y += 18;
doc.save();
doc.roundedRect(doc.x, doc.y, 22, 22, 11).fill(colors.accentSoft);
doc.fillColor(colors.accent).font('Helvetica-Bold').fontSize(12).text('1', doc.x, doc.y + 5, { width: 22, align: 'center' });
doc.restore();
doc.fillColor(colors.text).font('Helvetica').fontSize(11).text('ログイン画面で家庭名と合言葉を入力する', doc.x + 34, doc.y + 4);
doc.y += 28;
doc.save();
doc.roundedRect(doc.x, doc.y, 22, 22, 11).fill(colors.accentSoft);
doc.fillColor(colors.accent).font('Helvetica-Bold').fontSize(12).text('2', doc.x, doc.y + 5, { width: 22, align: 'center' });
doc.restore();
doc.fillColor(colors.text).font('Helvetica').fontSize(11).text('画面上部の子どもボタンで、操作したい子どもを選ぶ', doc.x + 34, doc.y + 4);
doc.y += 28;
doc.save();
doc.roundedRect(doc.x, doc.y, 22, 22, 11).fill(colors.accentSoft);
doc.fillColor(colors.accent).font('Helvetica-Bold').fontSize(12).text('3', doc.x, doc.y + 5, { width: 22, align: 'center' });
doc.restore();
doc.fillColor(colors.text).font('Helvetica').fontSize(11).text('下部のナビゲーションで、使いたい画面を切り替える', doc.x + 34, doc.y + 4);

doc.y = 170;
doc.fillColor(colors.muted).font('Helvetica').fontSize(10).text('テストデータはローカル D1 の「テスト家族」で確認できます。', doc.page.margins.left + 22, doc.y, { width: contentWidth - 44 });

doc.addPage();
fillBackground();

addSection({
  badge: 'LOGIN',
  title: 'ログイン',
  body: '登録済みの家庭名と合言葉でログインします。新しく使い始める場合は、新規登録から家庭を作成してください。',
  imagePath: images.today,
  note: 'ログイン画面の直後に出る最初の画面です。ここから各画面へ進みます。',
});

addSection({
  badge: 'DAILY CHECK',
  title: '1. 今日のチェック',
  body: 'その日の朝食・昼食・夕食ごとに、タスクの完了状況を確認する画面です。',
  steps: [
    '日付の左右ボタンで、確認したい日を切り替えます。',
    '各食事ブロックで、タスクの完了を確認します。',
    'ページ数や回数などの記録も、この画面で入力します。',
  ],
  imagePath: images.today,
});

addSection({
  badge: 'PLAN',
  title: '2. 週の計画作成',
  body: '1週間の予定をまとめて組み立てる画面です。タスクのコピーや貼り付けをするときに便利です。',
  steps: [
    '上部の左右ボタンで、表示する週を切り替えます。',
    '中央の曜日ボタンから日付を選びます。',
    '予定のコピーや、他の日への貼り付けを行います。',
  ],
  imagePath: images.plan,
});

addSection({
  badge: 'CALENDAR',
  title: '3. できた！きろく',
  body: '月ごとの達成状況をカレンダーで確認する画面です。子どもごとの進捗をざっくり見たいときに使います。',
  steps: [
    '上部の左右ボタンで月を切り替えます。',
    '○、△、× のマークで、その日の進捗を見ます。',
    '気になる日を押すと、その日のチェック画面へ移動できます。',
  ],
  imagePath: images.calendar,
});

addSection({
  badge: 'TASKS',
  title: '4. タスク設定',
  body: '子どもごとのタスクを追加・削除する画面です。毎日のルーティンや宿題を登録します。',
  steps: [
    'タスクを追加したいときは、新規追加ボタンを押します。',
    '名前やアイコン、カテゴリを設定します。',
    '不要になったタスクは削除ボタンで消します。',
  ],
  imagePath: images.tasks,
});

addSection({
  badge: 'CHILDREN',
  title: '5. 子ども設定',
  body: '家庭に紐づく子どもを登録・削除する画面です。家族ごとの管理を始めるときに使います。',
  steps: [
    '新しい子どもを登録して、対象を増やします。',
    '使わなくなった子どもは削除できます。',
    '子どもを切り替えると、表示中のタスクや記録も切り替わります。',
  ],
  imagePath: images.children,
});

addSection({
  badge: 'TIPS',
  title: '迷ったときの見方',
  body: '画面の移動や対象の切り替えは、上部と下部の共通 UI を見ると把握しやすくなります。',
  steps: [
    '左右のボタンは、日付や週、月を切り替える操作です。',
    '画面下のナビゲーションで、今いる場所を切り替えられます。',
    '画面上の子どもボタンで、対象の子どもを切り替えられます。',
  ],
  note: 'Markdown 版は docs/usage-guide.md にあります。',
});

doc.flushPages();
doc.end();
